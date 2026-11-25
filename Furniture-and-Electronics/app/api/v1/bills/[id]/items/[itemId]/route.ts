import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, itemId } = await params;
    const billId = parseInt(id, 10);
    const billItemId = parseInt(itemId, 10);

    if (isNaN(billId) || isNaN(billItemId)) {
      return NextResponse.json({ error: "Invalid bill or item ID" }, { status: 400 });
    }

    const bill = await prisma.bill.findUnique({
      where: { id: billId },
      include: {
        billItems: {
          include: {
            product: true,
            productUnit: true,
          },
        },
      },
    });

    if (!bill) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }

    if (bill.status === "voided") {
      return NextResponse.json({ error: "Cannot edit a voided bill" }, { status: 400 });
    }

    const targetItem = bill.billItems.find((item) => item.id === billItemId);
    if (!targetItem) {
      return NextResponse.json({ error: "Bill item not found on this bill" }, { status: 404 });
    }

    if (bill.billItems.length <= 1) {
      return NextResponse.json(
        { error: "Cannot remove the last item from a bill. Use Void Bill in Billing History instead." },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Restore inventory stock & serial unit
      if (targetItem.productUnitId) {
        await tx.productUnit.update({
          where: { id: targetItem.productUnitId },
          data: { status: "in_stock", soldAt: null },
        });
        await tx.product.update({
          where: { id: targetItem.productId },
          data: { quantityInStock: { increment: 1 } },
        });
      } else {
        await tx.product.update({
          where: { id: targetItem.productId },
          data: { quantityInStock: { increment: targetItem.quantity } },
        });
      }

      // 2. Delete the BillItem
      await tx.billItem.delete({
        where: { id: billItemId },
      });

      // 3. Option B: If linked to a booking, delete the matching BookingItem
      if (bill.bookingId) {
        const matchingBookingItem = await tx.bookingItem.findFirst({
          where: {
            bookingId: bill.bookingId,
            billId: bill.id,
            productId: targetItem.productId,
          },
        });
        if (matchingBookingItem) {
          await tx.bookingItem.delete({
            where: { id: matchingBookingItem.id },
          });
        }
      }

      // 4. Recalculate bill financials from remaining items
      const remainingItems = await tx.billItem.findMany({
        where: { billId: bill.id },
        include: { product: true },
      });

      const grossTotal = remainingItems.reduce(
        (sum, item) => sum + Number(item.lineTotal || 0),
        0
      );
      const discountVal = Math.min(Number(bill.discount || 0), grossTotal);
      const grossAfterDiscount = Math.max(0, grossTotal - discountVal);

      const sgstPct = Number(bill.sgstPercent || 0);
      const cgstPct = Number(bill.cgstPercent || 0);
      const totalGstPercent = sgstPct + cgstPct;
      const taxableAmount = grossAfterDiscount / (1 + totalGstPercent / 100);
      const sgstAmount = taxableAmount * (sgstPct / 100);
      const cgstAmount = taxableAmount * (cgstPct / 100);
      const totalAmount = grossAfterDiscount;

      const prevPaid = Number(bill.paidAmount || 0);
      const refundedAmount = Math.max(0, prevPaid - totalAmount);
      const newPaidAmount = Math.min(prevPaid, totalAmount);
      const newDueAmount = Math.max(0, totalAmount - newPaidAmount);
      const paymentStatus =
        newDueAmount === 0 ? "PAID" : newPaidAmount > 0 ? "PARTIAL" : "UNPAID";

      const depts = new Set(
        remainingItems.map((i) => (i.product?.department || "FURNITURE").toUpperCase())
      );
      const department =
        depts.size > 1 ? "COMBINED" : Array.from(depts)[0] || bill.department;

      const updatedBill = await tx.bill.update({
        where: { id: bill.id },
        data: {
          department,
          subtotal: taxableAmount,
          discount: discountVal,
          sgstAmount,
          cgstAmount,
          totalAmount,
          paidAmount: newPaidAmount,
          dueAmount: newDueAmount,
          paymentStatus,
          isSettled: newDueAmount === 0,
        },
        include: {
          customer: true,
          user: { select: { name: true, username: true } },
          billItems: {
            include: { product: true, productUnit: true },
          },
        },
      });

      // 5. Synchronize linked Booking totals & remainingBalance
      if (bill.bookingId) {
        const bookingBills = await tx.bill.findMany({
          where: { bookingId: bill.bookingId },
          select: { dueAmount: true },
        });
        const bookingItems = await tx.bookingItem.findMany({
          where: { bookingId: bill.bookingId },
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
          where: { id: bill.bookingId },
          data: {
            totalEstimatedAmount: totalEstimated,
            remainingBalance: Math.max(0, billsDue + unbilledDue),
          },
        });
      }

      return {
        bill: updatedBill,
        restoredProductName: targetItem.product?.name || "Product",
        restoredQuantity: targetItem.productUnitId ? 1 : targetItem.quantity,
        refundedAmount,
      };
    }, {
      maxWait: 10000,
      timeout: 30000,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error removing bill item:", error);
    return NextResponse.json(
      { error: error.message || "Failed to remove item and restore stock" },
      { status: 500 }
    );
  }
}
