import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(
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
            product: true,
          },
        },
        bills: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const now = new Date();

    // Compute live remaining dues accurately from all linked bills & unbilled items
    const totalBillsDue = (booking.bills || []).reduce(
      (sum, b) => sum + Number(b.dueAmount || 0),
      0
    );
    const unbilledItemsDue = (booking.bookingItems || [])
      .filter((i) => !i.isBilled)
      .reduce((sum, i) => sum + Number(i.lineTotal || 0), 0);
    const trueRemainingBalance = totalBillsDue + unbilledItemsDue;

    // Update booking status to COMPLETED with genuine remainingBalance and all delivery schedules to DELIVERED
    const updatedBooking = await prisma.$transaction(async (tx) => {
      const completed = await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: "COMPLETED",
          remainingBalance: trueRemainingBalance,
        },
      });

      await tx.deliverySchedule.updateMany({
        where: { bookingId },
        data: {
          status: "DELIVERED",
          actualDelivery: now,
        },
      });

      return completed;
    });

    // Auto-dispatch appropriate WhatsApp Message to Customer based on financial settlement
    if (booking.customer?.phone) {
      try {
        const { dispatchWhatsappNotification } = await import("@/lib/whatsapp/dispatch");
        const { formatBookingSettledMessage, formatBookingDeliveredWithDueMessage } = await import(
          "@/lib/whatsapp/templates"
        );

        const customerName = booking.customer?.name || "Valued Customer";
        const messageText =
          trueRemainingBalance <= 0
            ? formatBookingSettledMessage({
                customerName,
                bookingNumber: booking.bookingNumber,
                totalAmount: Number(booking.totalEstimatedAmount),
              })
            : formatBookingDeliveredWithDueMessage({
                customerName,
                bookingNumber: booking.bookingNumber,
                totalAmount: Number(booking.totalEstimatedAmount),
                paidAmount: Math.max(0, Number(booking.totalEstimatedAmount) - trueRemainingBalance),
                remainingDue: trueRemainingBalance,
              });

        await dispatchWhatsappNotification({
          phone: booking.customer.phone,
          text: messageText,
          billNumber: booking.bookingNumber,
          customerName,
        });
      } catch (waErr) {
        console.error("Failed to dispatch booking completion WhatsApp message:", waErr);
      }
    }

    return NextResponse.json({ success: true, booking: updatedBooking });
  } catch (error: any) {
    console.error("Error completing booking:", error);
    return NextResponse.json(
      { error: error.message || "Failed to mark booking as completed" },
      { status: 500 }
    );
  }
}
