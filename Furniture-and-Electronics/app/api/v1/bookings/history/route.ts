import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status")?.trim() || "COMPLETED"; // Default strictly to completed
    const page = Math.max(parseInt(searchParams.get("page") || "1", 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "20", 10) || 20, 1), 50);
    const skip = (page - 1) * limit;

    const where: any = {};

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { bookingNumber: { contains: search, mode: "insensitive" } },
        { customer: { name: { contains: search, mode: "insensitive" } } },
        { customer: { phone: { contains: search } } },
      ];
    }

    // High performance query with targeted field projection
    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          bookingNumber: true,
          createdAt: true,
          eventDate: true,
          expectedDeliveryDate: true,
          totalEstimatedAmount: true,
          advancePaid: true,
          remainingBalance: true,
          status: true,
          notes: true,
          customer: {
            select: {
              id: true,
              name: true,
              phone: true,
              address: true,
            },
          },
          bills: {
            select: {
              id: true,
              billNumber: true,
              department: true,
              billType: true,
              totalAmount: true,
              paidAmount: true,
              dueAmount: true,
              paymentStatus: true,
              createdAt: true,
            },
            orderBy: { createdAt: "asc" },
          },
          bookingItems: {
            select: {
              id: true,
              department: true,
              quantity: true,
              unitPrice: true,
              lineTotal: true,
              isBilled: true,
              billId: true,
              product: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.booking.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);
    const hasMore = skip + bookings.length < total;

    // Self-healing synchronization for completed/historical bookings where remainingBalance drifted
    const sanitizedBookings = bookings.map((b) => {
      const billsDue = (b.bills || []).reduce((sum, bill) => sum + Number(bill.dueAmount || 0), 0);
      const unbilledDue = (b.bookingItems || [])
        .filter((i) => !i.isBilled)
        .reduce((sum, i) => sum + Number(i.lineTotal || 0), 0);
      const liveRemaining =
        b.bills && b.bills.length > 0 ? billsDue + unbilledDue : Number(b.remainingBalance);

      if (Number(b.remainingBalance) !== liveRemaining) {
        // Fire-and-forget sync to repair database row
        prisma.booking
          .update({
            where: { id: b.id },
            data: { remainingBalance: liveRemaining },
          })
          .catch((err) =>
            console.error(`[Self-Healing] Failed to sync remainingBalance for booking #${b.bookingNumber}:`, err)
          );

        return {
          ...b,
          remainingBalance: liveRemaining,
        };
      }
      return b;
    });

    return NextResponse.json({
      items: sanitizedBookings,
      total,
      page,
      totalPages,
      hasMore,
    });
  } catch (error: any) {
    console.error("Error fetching booking history:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch booking history" }, { status: 500 });
  }
}
