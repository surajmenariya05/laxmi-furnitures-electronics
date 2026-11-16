import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dispatchWhatsappNotification } from "@/lib/whatsapp/dispatch";
import { formatBookingCancelledMessage } from "@/lib/whatsapp/templates";

// GET /api/v1/bookings/[id]
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const bookingId = parseInt(id, 10);
    if (!bookingId || isNaN(bookingId)) {
      return NextResponse.json({ error: "Invalid booking ID" }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        customer: true,
        bookingItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                brand: true,
                productType: true,
                quantityInStock: true,
                sellingPrice: true,
                category: { select: { name: true } },
              },
            },
          },
        },
        bills: {
          include: {
            billItems: true,
          },
        },
        deliveries: {
          orderBy: { scheduledDate: "asc" },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Self-healing synchronization for booking remainingBalance
    const billsDue = (booking.bills || []).reduce((sum, bill) => sum + Number(bill.dueAmount || 0), 0);
    const unbilledDue = (booking.bookingItems || [])
      .filter((i) => !i.isBilled)
      .reduce((sum, i) => sum + Number(i.lineTotal || 0), 0);
    const trueRemaining =
      booking.bills && booking.bills.length > 0 ? billsDue + unbilledDue : Number(booking.remainingBalance);

    if (Number(booking.remainingBalance) !== trueRemaining) {
      prisma.booking
        .update({
          where: { id: booking.id },
          data: { remainingBalance: trueRemaining },
        })
        .catch((err) =>
          console.error(`[Self-Healing] Failed to sync remainingBalance for booking #${booking.bookingNumber}:`, err)
        );

      booking.remainingBalance = trueRemaining as any;
    }

    return NextResponse.json(booking);
  } catch (error: any) {
    console.error("Error fetching booking details:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch booking details" },
      { status: 500 }
    );
  }
}

// DELETE /api/v1/bookings/[id]
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const bookingId = parseInt(id, 10);
    if (!bookingId || isNaN(bookingId)) {
      return NextResponse.json({ error: "Invalid booking ID" }, { status: 400 });
    }

    // 1. Fetch full booking with items, bills, customer, and deliveries
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        customer: true,
        bookingItems: {
          include: {
            product: true,
          },
        },
        bills: {
          include: {
            billItems: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const advancePaid = Number(booking.advancePaid || 0);
    const bookingNumber = booking.bookingNumber;
    const customerName = booking.customer?.name || "Customer";
    const customerPhone = booking.customer?.phone || "";

    // 2. Execute Atomic Transaction for Deletion & Stock Restoration
    await prisma.$transaction(
      async (tx) => {
        // Step A: Stock Restoration & Serialized Unit Reset
        // Stock must ONLY be restored for items that were actually billed in linked bills
        for (const bill of booking.bills) {
          for (const bItem of bill.billItems) {
            // Revert serialized product unit if any
            if (bItem.productUnitId) {
              await tx.productUnit.update({
                where: { id: bItem.productUnitId },
                data: {
                  status: "in_stock",
                  soldAt: null,
                },
              });
            }

            // Restore product inventory quantity
            if (bItem.productId && bItem.quantity > 0) {
              await tx.product.update({
                where: { id: bItem.productId },
                data: {
                  quantityInStock: {
                    increment: bItem.quantity,
                  },
                },
              });
            }
          }
        }

        // Step B: Disconnect BookingItems from Bills to prevent FK constraint blocks
        await tx.bookingItem.updateMany({
          where: { bookingId: booking.id },
          data: { billId: null },
        });

        // Step C: Delete Linked Bills & Bill Items
        const linkedBillIds = booking.bills.map((b) => b.id);
        if (linkedBillIds.length > 0) {
          // Delete FinanceRecords if attached to bills
          await tx.financeRecord.deleteMany({
            where: { billId: { in: linkedBillIds } },
          });

          // Delete BillItems
          await tx.billItem.deleteMany({
            where: { billId: { in: linkedBillIds } },
          });

          // Delete Bills
          await tx.bill.deleteMany({
            where: { id: { in: linkedBillIds } },
          });
        }

        // Step D: Delete DeliverySchedules
        await tx.deliverySchedule.deleteMany({
          where: { bookingId: booking.id },
        });

        // Step E: Delete BookingItems
        await tx.bookingItem.deleteMany({
          where: { bookingId: booking.id },
        });

        // Step F: Delete Booking Master Record
        await tx.booking.delete({
          where: { id: booking.id },
        });
      },
      {
        maxWait: 15000,
        timeout: 45000,
      }
    );

    // 3. Post-Transaction: Customer Refund WhatsApp Alert (Async)
    let whatsappDispatched = false;
    if (advancePaid > 0 && customerPhone) {
      try {
        const messageText = formatBookingCancelledMessage({
          customerName,
          bookingNumber,
          advancePaid,
          refundAmount: advancePaid,
        });

        const res = await dispatchWhatsappNotification({
          phone: customerPhone,
          text: messageText,
          customerName,
        });
        whatsappDispatched = Boolean(res.success);
      } catch (waErr) {
        console.error("Failed to dispatch WhatsApp cancellation notification:", waErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Advance Booking #${bookingNumber} deleted successfully.`,
      bookingNumber,
      advancePaid,
      refundRequired: advancePaid > 0,
      whatsappDispatched,
    });
  } catch (error: any) {
    console.error("Error deleting advance booking:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete advance booking" },
      { status: 500 }
    );
  }
}

// PUT /api/v1/bookings/[id]
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const bookingId = parseInt(id, 10);
    if (!bookingId || isNaN(bookingId)) {
      return NextResponse.json({ error: "Invalid booking ID" }, { status: 400 });
    }

    const body = await req.json();
    const {
      customerName,
      customerPhone,
      customerAddress,
      eventDate,
      expectedDeliveryDate,
      notes,
      items, // Updated array of items [{ id?, productId, department, quantity, mrp, unitPrice, lineTotal, customisations, isBilled }]
      discount = 0,
      advancePaid = 0,
    } = body;

    if (!expectedDeliveryDate) {
      return NextResponse.json({ error: "Delivery date is required" }, { status: 400 });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "At least one item must remain in the booking" }, { status: 400 });
    }

    // Resolve creator ID
    let creatorId = parseInt(session.user?.id);
    if (!creatorId || isNaN(creatorId)) creatorId = 1;

    // Fetch existing booking
    const existingBooking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        customer: true,
        bookingItems: {
          include: {
            product: true,
          },
        },
        bills: {
          include: {
            billItems: true,
          },
        },
      },
    });

    if (!existingBooking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const updated = await prisma.$transaction(
      async (tx) => {
        // 1. Update Customer Details if provided
        if (existingBooking.customerId) {
          await tx.customer.update({
            where: { id: existingBooking.customerId },
            data: {
              ...(customerName ? { name: customerName.trim() } : {}),
              ...(customerPhone ? { phone: customerPhone.trim() } : {}),
              ...(customerAddress !== undefined ? { address: customerAddress?.trim() || null } : {}),
            },
          });
        }

        // 2. Identify existing Furniture Bill (if any)
        let furnitureBill = existingBooking.bills.find(
          (b) => b.department === "FURNITURE" && b.billType === "REGULAR"
        );

        // Find existing delivery invoices (Electronics bills)
        const deliveryInvoices = existingBooking.bills.filter(
          (b) => b.billType === "DELIVERY_INVOICE"
        );
        const deliveredItemIds = new Set(
          deliveryInvoices.flatMap((b) => b.billItems.map((bi) => bi.productId))
        );

        // Map existing booking items
        const existingItemsMap = new Map(existingBooking.bookingItems.map((i) => [i.id, i]));
        const incomingItemIds = new Set(items.filter((i: any) => i.id).map((i: any) => i.id));

        // 3. Process REMOVED items
        for (const [oldItemId, oldItem] of existingItemsMap.entries()) {
          if (!incomingItemIds.has(oldItemId)) {
            // Check if already delivered
            if (oldItem.department === "ELECTRONICS" && oldItem.isBilled) {
              throw new Error(
                `Cannot remove already delivered electronic item (${oldItem.product?.name || "Product"}).`
              );
            }

            // If it was a billed furniture item: restore stock and delete from FURN BillItem
            if (oldItem.department === "FURNITURE" && oldItem.isBilled) {
              await tx.product.update({
                where: { id: oldItem.productId },
                data: {
                  quantityInStock: { increment: oldItem.quantity },
                },
              });

              if (furnitureBill) {
                await tx.billItem.deleteMany({
                  where: {
                    billId: furnitureBill.id,
                    productId: oldItem.productId,
                  },
                });
              }
            }

            // Delete booking item
            await tx.bookingItem.delete({
              where: { id: oldItemId },
            });
          }
        }

        // 4. Process UPDATED and NEW items
        for (const item of items) {
          const qty = parseInt(item.quantity, 10) || 1;
          const unitPrice = parseFloat(item.unitPrice) || 0;
          const lineTotal = qty * unitPrice;
          const mrp = item.mrp ? parseFloat(item.mrp) : undefined;
          const isFurn = (item.department || "FURNITURE").toUpperCase() === "FURNITURE";

          if (item.id && existingItemsMap.has(item.id)) {
            // Existing item updated
            const oldItem = existingItemsMap.get(item.id)!;

            if (isFurn && oldItem.isBilled) {
              // Furniture stock delta
              const deltaQty = qty - oldItem.quantity;
              if (deltaQty !== 0) {
                if (deltaQty > 0) {
                  await tx.product.update({
                    where: { id: item.productId },
                    data: { quantityInStock: { decrement: deltaQty } },
                  });
                } else {
                  await tx.product.update({
                    where: { id: item.productId },
                    data: { quantityInStock: { increment: Math.abs(deltaQty) } },
                  });
                }
              }

              // Update BillItem in existing FURN bill
              if (furnitureBill) {
                const existingBillItem = furnitureBill.billItems.find(
                  (bi) => bi.productId === item.productId
                );
                if (existingBillItem) {
                  await tx.billItem.update({
                    where: { id: existingBillItem.id },
                    data: {
                      quantity: qty,
                      mrp,
                      unitPrice,
                      lineTotal,
                      customisations: item.customisations || null,
                    },
                  });
                }
              }
            }

            // Update BookingItem
            await tx.bookingItem.update({
              where: { id: item.id },
              data: {
                quantity: qty,
                mrp,
                unitPrice,
                lineTotal,
                customisations: item.customisations || null,
              },
            });
          } else {
            // NEW item added
            let newBillId: number | null = null;
            let isBilled = false;

            if (isFurn) {
              // Deduct stock for new furniture item
              await tx.product.update({
                where: { id: parseInt(item.productId, 10) },
                data: { quantityInStock: { decrement: qty } },
              });

              // Add to existing furniture bill if present
              if (furnitureBill) {
                const newBillItem = await tx.billItem.create({
                  data: {
                    billId: furnitureBill.id,
                    productId: parseInt(item.productId, 10),
                    quantity: qty,
                    mrp,
                    unitPrice,
                    lineTotal,
                    customisations: item.customisations || null,
                  },
                });
                newBillId = furnitureBill.id;
                isBilled = true;
              } else {
                // If no FURN bill exists yet, create one
                const year = new Date().getFullYear();
                let nextBillNum = (await tx.bill.count()) + 1;
                let furnitureBillNumber = `FURN-${year}-${String(nextBillNum).padStart(4, "0")}`;
                while (await tx.bill.findUnique({ where: { billNumber: furnitureBillNumber } })) {
                  nextBillNum++;
                  furnitureBillNumber = `FURN-${year}-${String(nextBillNum).padStart(4, "0")}`;
                }

                furnitureBill = await tx.bill.create({
                  data: {
                    billNumber: furnitureBillNumber,
                    billType: "REGULAR",
                    department: "FURNITURE",
                    bookingId: existingBooking.id,
                    customerId: existingBooking.customerId,
                    createdByUserId: creatorId,
                    deliveryDate: new Date(),
                    subtotal: lineTotal,
                    discount: 0,
                    totalAmount: lineTotal,
                    paidAmount: 0,
                    dueAmount: lineTotal,
                    paymentStatus: "UNPAID",
                    paymentMode: "CASH",
                    status: "completed",
                  },
                  include: { billItems: true },
                });

                await tx.billItem.create({
                  data: {
                    billId: furnitureBill.id,
                    productId: parseInt(item.productId, 10),
                    quantity: qty,
                    mrp,
                    unitPrice,
                    lineTotal,
                    customisations: item.customisations || null,
                  },
                });

                newBillId = furnitureBill.id;
                isBilled = true;
              }
            }

            // Create BookingItem
            await tx.bookingItem.create({
              data: {
                bookingId: existingBooking.id,
                productId: parseInt(item.productId, 10),
                department: isFurn ? "FURNITURE" : "ELECTRONICS",
                quantity: qty,
                mrp,
                unitPrice,
                lineTotal,
                customisations: item.customisations || null,
                isBilled,
                billId: newBillId,
              },
            });
          }
        }

        // 5. Recalculate Furniture Bill Totals (in-place on existing FURN bill)
        if (furnitureBill) {
          const freshBillItems = await tx.billItem.findMany({
            where: { billId: furnitureBill.id },
          });

          if (freshBillItems.length > 0) {
            const furnSubtotal = freshBillItems.reduce(
              (sum, bi) => sum + Number(bi.lineTotal),
              0
            );
            const disc = parseFloat(discount) || 0;
            const furnDiscount = Math.min(furnSubtotal, disc);
            const furnTotal = Math.max(0, furnSubtotal - furnDiscount);
            const adv = parseFloat(advancePaid) || 0;
            const furnPaid = Math.min(furnTotal, adv);
            const furnDue = Math.max(0, furnTotal - furnPaid);
            const furnStatus = furnDue === 0 ? "PAID" : furnPaid > 0 ? "PARTIAL" : "UNPAID";

            await tx.bill.update({
              where: { id: furnitureBill.id },
              data: {
                subtotal: furnSubtotal,
                discount: furnDiscount,
                totalAmount: furnTotal,
                paidAmount: furnPaid,
                dueAmount: furnDue,
                paymentStatus: furnStatus,
              },
            });
          } else {
            // If all furniture items removed, remove empty furniture bill
            await tx.bill.delete({
              where: { id: furnitureBill.id },
            });
          }
        }

        // 6. Recalculate Master Booking Totals
        const freshBookingItems = await tx.bookingItem.findMany({
          where: { bookingId: existingBooking.id },
        });

        const totalEst = freshBookingItems.reduce(
          (sum, bi) => sum + Number(bi.lineTotal),
          0
        );
        const disc = parseFloat(discount) || 0;
        const netTotal = Math.max(0, totalEst - disc);
        const advPaid = parseFloat(advancePaid) || 0;
        const remaining = Math.max(0, netTotal - advPaid);

        let bookingNotes = notes ? String(notes).trim() : "";
        if (disc > 0) {
          bookingNotes = bookingNotes ? `${bookingNotes} (Discount: ₹${disc})` : `Discount: ₹${disc}`;
        }

        const updatedBooking = await tx.booking.update({
          where: { id: existingBooking.id },
          data: {
            eventDate: eventDate ? new Date(eventDate) : null,
            expectedDeliveryDate: new Date(expectedDeliveryDate),
            totalEstimatedAmount: netTotal,
            advancePaid: advPaid,
            remainingBalance: remaining,
            notes: bookingNotes || null,
          },
          include: {
            customer: true,
            bookingItems: {
              include: {
                product: true,
              },
            },
            bills: true,
            deliveries: true,
          },
        });

        // 7. Update Delivery Schedule Date if needed
        await tx.deliverySchedule.updateMany({
          where: { bookingId: existingBooking.id },
          data: {
            scheduledDate: new Date(expectedDeliveryDate),
            driverNotes: bookingNotes ? `Booking notes: ${bookingNotes}` : null,
          },
        });

        return updatedBooking;
      },
      {
        maxWait: 15000,
        timeout: 45000,
      }
    );

    return NextResponse.json({
      success: true,
      booking: updated,
      message: `Advance Booking #${updated.bookingNumber} updated successfully.`,
    });
  } catch (error: any) {
    console.error("Error updating advance booking:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update advance booking" },
      { status: 500 }
    );
  }
}
