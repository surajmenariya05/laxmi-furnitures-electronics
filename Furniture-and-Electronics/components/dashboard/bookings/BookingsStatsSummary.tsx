"use client";

import React from "react";
import { BookingResponse } from "@/types/booking";
import { FaBoxes, FaRupeeSign, FaHourglassHalf, FaTruck } from "react-icons/fa";
import KpiCard from "@/components/ui/KpiCard";

interface BookingsStatsSummaryProps {
  bookings: BookingResponse[];
}

export default function BookingsStatsSummary({ bookings }: BookingsStatsSummaryProps) {
  const safeBookings = Array.isArray(bookings) ? bookings : [];
  const activeBookings = safeBookings.length;

  const totalAdvance = safeBookings.reduce(
    (sum, b) => sum + (parseFloat(String(b.advancePaid)) || 0),
    0
  );

  const totalRemaining = safeBookings.reduce(
    (sum, b) => sum + (parseFloat(String(b.remainingBalance)) || 0),
    0
  );

  // Deliveries due within the next 7 days (including today & overdue)
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const dueThisWeekCount = safeBookings.filter((b) => {
    if (!b.expectedDeliveryDate) return false;
    const dDate = new Date(b.expectedDeliveryDate);
    dDate.setHours(0, 0, 0, 0);
    return dDate <= next7Days;
  }).length;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:gap-4 xl:grid-cols-4 xl:gap-5">
      <KpiCard
        label="Active Bookings"
        value={activeBookings}
        note="Active event & wedding orders"
        accent="blue"
        icon={<FaBoxes className="w-5 h-5" />}
      />

      <KpiCard
        label="Advance Received"
        value={formatCurrency(totalAdvance)}
        note="Disbursed deposits & tokens"
        accent="green"
        valueClassName="text-emerald-700"
        icon={<FaRupeeSign className="w-5 h-5" />}
      />

      <KpiCard
        label="Pending Balance"
        value={formatCurrency(totalRemaining)}
        note="Collect prior to final delivery"
        accent="amber"
        valueClassName="text-amber-800"
        icon={<FaHourglassHalf className="w-5 h-5" />}
      />

      <KpiCard
        label="Due in 7 Days"
        value={dueThisWeekCount}
        note="Urgent dispatch schedule"
        accent="rose"
        valueClassName="text-rose-700"
        icon={<FaTruck className="w-5 h-5" />}
      />
    </div>
  );
}
