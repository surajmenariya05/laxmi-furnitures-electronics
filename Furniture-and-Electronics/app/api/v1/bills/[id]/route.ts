import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { formatName } from "@/lib/format";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const billId = parseInt(id);

    const bill = await prisma.bill.findUnique({
      where: { id: billId },
      include: {
        customer: true,
        financeRecord: true,
        booking: {
          select: {
            id: true,
            bookingNumber: true,
          },
        },
        user: {
          select: {
            name: true,
            username: true,
          },
        },
        billItems: {
          include: {
            product: {
              include: {
                units: {
                  where: { status: "in_stock" },
                },
              },
            },
            productUnit: true,
          },
        },
      },
    });

    if (!bill) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }

    return NextResponse.json(bill);
  } catch (error) {
    console.error("Error fetching bill:", error);
    return NextResponse.json({ error: "Failed to fetch bill" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const billId = parseInt(id, 10);
    if (isNaN(billId)) {
      return NextResponse.json({ error: "Invalid bill ID" }, { status: 400 });
    }

    const body = await req.json();
    let {
      customerName,
      customerPhone,
      customerAddress,
      paymentMode,
      discount = 0,
      sgstPercent = 0,
      cgstPercent = 0,
      paidAmount,
      items,
      financeProviderId,
      emiAmount,
      financeMonths,
    } = body;

    customerName = formatName(customerName);

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Bill must have at least one item" }, { status: 400 });
    }

    if (!customerName || customerName.trim() === "") {
      return NextResponse.json({ error: "Customer name is required" }, { status: 400 });
    }

    if (!customerPhone || customerPhone.trim().length !== 10) {
      return NextResponse.json({ error: "Valid 10-digit customer phone number is required" }, { status: 400 });
    }

    if (!paymentMode) {
      return NextResponse.json({ error: "Payment mode is required" }, { status: 400 });
    }

    const existingBill = await prisma.bill.findUnique({
      where: { id: billId },
      include: {
        billItems: true,
        customer: true,
        financeRecord: true,
      },
    });

    if (!existingBill) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }

    if (existingBill.status === "voided") {
      return NextResponse.json({ error: "Cannot edit a voided bill" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update or link Customer (only when changed)
      let customerId = existingBill.customerId;
      const trimmedName = customerName.trim();
      const trimmedPhone = customerPhone.trim();
      const trimmedAddress = customerAddress?.trim() || null;

      if (customerId) {
        const custChanged =
          existingBill.customer?.name !== trimmedName ||
          existingBill.customer?.phone !== trimmedPhone ||
          (existingBill.customer?.address || null) !== trimmedAddress;
        if (custChanged) {
          await tx.customer.update({
            where: { id: customerId },
            data: {
              name: trimmedName,
              phone: trimmedPhone,
              address: trimmedAddress,
            },
          });
        }
      } else {
        let customer = await tx.customer.findFirst({ where: { phone: trimmedPhone } });
        if (!customer) {
          customer = await tx.customer.create({
            data: {
              name: trimmedName,
              phone: trimmedPhone,
              address: trimmedAddress,
            },
          });
        }
        customerId = customer.id;
      }

      // 2. Batch-fetch all products in one query & process Existing/New Items
      const existingItemsMap = new Map(existingBill.billItems.map((bi) => [bi.id, bi]));
      const uniqueProductIds = Array.from(
        new Set(items.map((i: any) => parseInt(i.productId, 10)).filter((pid) => !isNaN(pid)))
      );
      const productsList = await tx.product.findMany({
        where: { id: { in: uniqueProductIds } },
      });
      const productsMap = new Map(productsList.map((p) => [p.id, p]));

      let grossSubtotal = 0;
      const itemDepartments = new Set<string>();

      for (const item of items) {
        const qty = parseInt(item.quantity, 10) || 1;
        const product = productsMap.get(parseInt(item.productId, 10));

        if (!product || !product.isActive) {
          throw new Error(`Product ID ${item.productId} not found or inactive.`);
        }

        itemDepartments.add((product.department || "FURNITURE").toUpperCase());

        const configuredRate =
          item.configuredPrice !== undefined &&
          item.configuredPrice !== null &&
          !isNaN(Number(item.configuredPrice)) &&
          Number(item.configuredPrice) >= 0
            ? Number(item.configuredPrice)
            : item.unitPrice !== undefined &&
              item.unitPrice !== null &&
              !isNaN(Number(item.unitPrice)) &&
              Number(item.unitPrice) >= 0
            ? Number(item.unitPrice)
            : Number(product.sellingPrice);

        const effectivePrice = configuredRate;
        const lineTotal = effectivePrice * qty;
        grossSubtotal += lineTotal;

        if (item.billItemId && existingItemsMap.has(Number(item.billItemId))) {
          const oldBi = existingItemsMap.get(Number(item.billItemId))!;
          // Handle quantity delta for quantity-based products
          if (product.productType === "quantity") {
            const deltaQty = qty - oldBi.quantity;
            if (deltaQty > 0) {
              if (product.quantityInStock < deltaQty) {
                throw new Error(
                  `Insufficient stock for ${product.name}. Available: ${product.quantityInStock}`
                );
              }
              await tx.product.update({
                where: { id: product.id },
                data: { quantityInStock: { decrement: deltaQty } },
              });
            } else if (deltaQty < 0) {
              await tx.product.update({
                where: { id: product.id },
                data: { quantityInStock: { increment: Math.abs(deltaQty) } },
              });
            }
          }

          await tx.billItem.update({
            where: { id: oldBi.id },
            data: {
              quantity: qty,
              unitPrice: effectivePrice,
              lineTotal,
            },
          });

          if (existingBill.bookingId) {
            const matchingBi = await tx.bookingItem.findFirst({
              where: {
                bookingId: existingBill.bookingId,
                billId: existingBill.id,
                productId: product.id,
              },
            });
            if (matchingBi) {
              await tx.bookingItem.update({
                where: { id: matchingBi.id },
                data: {
                  quantity: qty,
                  unitPrice: effectivePrice,
                  lineTotal,
                },
              });
            }
          }
        } else {
          // New item added during edit
          if (product.productType !== "quantity") {
            let unitId: number;

            if (item.productUnitId) {
              const unit = await tx.productUnit.findUnique({
                where: { id: parseInt(item.productUnitId, 10) },
              });
              if (!unit || unit.status !== "in_stock") {
                throw new Error(`Selected serial number unit for ${product.name} is no longer available.`);
              }
              await tx.productUnit.update({
                where: { id: unit.id },
                data: { status: "sold", soldAt: new Date() },
              });
              unitId = unit.id;
            } else if (item.serialNumber && String(item.serialNumber).trim()) {
              const cleanSerial = String(item.serialNumber).trim();
              const existingUnit = await tx.productUnit.findUnique({
                where: { imeiNumber: cleanSerial },
              });
              if (existingUnit) {
                if (existingUnit.status !== "in_stock") {
                  throw new Error(`Serial number "${cleanSerial}" is already sold.`);
                }
                await tx.productUnit.update({
                  where: { id: existingUnit.id },
                  data: { status: "sold", soldAt: new Date() },
                });
                unitId = existingUnit.id;
              } else {
                const newUnit = await tx.productUnit.create({
                  data: {
                    productId: product.id,
                    imeiNumber: cleanSerial,
                    status: "sold",
                    costPrice: product.costPrice,
                    soldAt: new Date(),
                  },
                });
                unitId = newUnit.id;
              }
            } else {
              throw new Error(`Serial number unit is required for ${product.name}`);
            }

            if (product.quantityInStock < 1) {
              throw new Error(`Insufficient stock for ${product.name}. Available: ${product.quantityInStock}`);
            }

            await tx.product.update({
              where: { id: product.id },
              data: { quantityInStock: { decrement: 1 } },
            });
            await tx.billItem.create({
              data: {
                billId: existingBill.id,
                productId: product.id,
                productUnitId: unitId,
                quantity: 1,
                mrp: Number(product.sellingPrice),
                unitPrice: effectivePrice,
                lineTotal,
              },
            });
          } else {
            if (product.quantityInStock < qty) {
              throw new Error(
                `Insufficient stock for ${product.name}. Available: ${product.quantityInStock}`
              );
            }
            await tx.product.update({
              where: { id: product.id },
              data: { quantityInStock: { decrement: qty } },
            });
            await tx.billItem.create({
              data: {
                billId: existingBill.id,
                productId: product.id,
                quantity: qty,
                mrp: Number(product.sellingPrice),
                unitPrice: effectivePrice,
                lineTotal,
              },
            });
          }

          if (existingBill.bookingId) {
            await tx.bookingItem.create({
              data: {
                bookingId: existingBill.bookingId,
                productId: product.id,
                department: (product.department || "FURNITURE").toUpperCase(),
                quantity: qty,
                mrp: Number(product.sellingPrice),
                unitPrice: effectivePrice,
                lineTotal,
                isBilled: true,
                billId: existingBill.id,
              },
            });
          }
        }
      }

      // 3. Recompute Totals & Overpayment Handling
      const discountVal = Math.min(parseFloat(discount) || 0, grossSubtotal);
      const grossAfterDiscount = Math.max(0, grossSubtotal - discountVal);
      const sgstPct = parseFloat(sgstPercent) || 0;
      const cgstPct = parseFloat(cgstPercent) || 0;
      const totalGstPercent = sgstPct + cgstPct;
      const taxableAmount = grossAfterDiscount / (1 + totalGstPercent / 100);
      const sgstAmount = taxableAmount * (sgstPct / 100);
      const cgstAmount = taxableAmount * (cgstPct / 100);
      const totalAmount = grossAfterDiscount;

      const requestedPaid =
        paidAmount !== undefined && paidAmount !== "" && !isNaN(parseFloat(paidAmount))
          ? parseFloat(paidAmount)
          : totalAmount;

      const refundedAmount = Math.max(0, requestedPaid - totalAmount);
      const finalPaid = Math.min(requestedPaid, totalAmount);
      const dueAmount = Math.max(0, totalAmount - finalPaid);
      const paymentStatus =
        dueAmount === 0 ? "PAID" : finalPaid > 0 ? "PARTIAL" : "UNPAID";

      const department =
        itemDepartments.size > 1
          ? "COMBINED"
          : Array.from(itemDepartments)[0] || existingBill.department;

      const updatedBill = await tx.bill.update({
        where: { id: existingBill.id },
        data: {
          customerId,
          department,
          paymentMode,
          subtotal: taxableAmount,
          discount: discountVal,
          sgstPercent: sgstPct,
          cgstPercent: cgstPct,
          sgstAmount,
          cgstAmount,
          totalAmount,
          paidAmount: finalPaid,
          dueAmount,
          paymentStatus,
          isSettled: dueAmount === 0,
        },
        include: {
          customer: true,
          financeRecord: true,
          user: { select: { name: true, username: true } },
          billItems: {
            include: { product: true, productUnit: true },
          },
        },
      });

      // 4. Handle FinanceRecord
      if (paymentMode.toLowerCase() === "finance" && financeProviderId) {
        const finData = {
          financeProviderId: parseInt(financeProviderId, 10),
          emiAmount: parseFloat(emiAmount) || 0,
          months: financeMonths ? parseInt(financeMonths, 10) : null,
        };
        if (existingBill.financeRecord) {
          await tx.financeRecord.update({
            where: { billId: existingBill.id },
            data: finData,
          });
        } else {
          await tx.financeRecord.create({
            data: { billId: existingBill.id, ...finData },
          });
        }
      } else if (existingBill.financeRecord) {
        await tx.financeRecord.delete({ where: { billId: existingBill.id } });
      }

      // 5. Sync linked Booking if applicable
      if (existingBill.bookingId) {
        const bookingBills = await tx.bill.findMany({
          where: { bookingId: existingBill.bookingId },
          select: { dueAmount: true },
        });
        const bookingItems = await tx.bookingItem.findMany({
          where: { bookingId: existingBill.bookingId },
          select: { lineTotal: true, isBilled: true },
        });
        const totalEstimated = bookingItems.reduce(
          (sum, bi) => sum + Number(bi.lineTotal || 0),
          0
        );
        const billsDue = bookingBills.reduce(
          (sum, b) => sum + Number(b.dueAmount || 0),
          0
        );
        const unbilledDue = bookingItems
          .filter((bi) => !bi.isBilled)
          .reduce((sum, bi) => sum + Number(bi.lineTotal || 0), 0);

        await tx.booking.update({
          where: { id: existingBill.bookingId },
          data: {
            totalEstimatedAmount: totalEstimated,
            remainingBalance: Math.max(0, billsDue + unbilledDue),
          },
        });
      }

      return { bill: updatedBill, refundedAmount };
    }, {
      maxWait: 10000,
      timeout: 30000,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error updating bill:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update bill" },
      { status: 500 }
    );
  }
}
