"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { FaEye } from "react-icons/fa";
import { BookingResponse } from "@/types/booking";
import DuePaymentPill from "@/components/ui/DuePaymentPill";
import BookingDueBreakdownModal from "@/components/dashboard/bookings/BookingDueBreakdownModal";

interface BookingHistoryMobileCardsProps {
  bookings: BookingResponse[];
  onViewSlip: (booking: BookingResponse) => void;
  onCollectDue?: (bill: any) => void;
}

function BookingHistoryMobileCard({
  booking,
  onViewSlip,
  onCollectDue,
}: {
  booking: BookingResponse;
  onViewSlip: (booking: BookingResponse) => void;
  onCollectDue?: (bill: any) => void;
}) {
  const furnitureBill = booking.bills?.find((b) => b.department === "FURNITURE");
  const electronicsBills =
    booking.bills?.filter((b) => b.department === "ELECTRONICS") || [];

  const hasFurniture =
    Boolean(furnitureBill) ||
    (booking.bookingItems || []).some(
      (i) => (i.department || "FURNITURE").toUpperCase() === "FURNITURE"
    );
  const hasElectronics =
    electronicsBills.length > 0 ||
    (booking.bookingItems || []).some(
      (i) => (i.department || "").toUpperCase() === "ELECTRONICS"
    );

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showDueBreakdownModal, setShowDueBreakdownModal] = useState(false);
  const [selectedElecBillId, setSelectedElecBillId] = useState<number>(() =>
    electronicsBills.length > 0
      ? electronicsBills[electronicsBills.length - 1].id
      : 0
  );

  useEffect(() => {
    if (
      electronicsBills.length > 0 &&
      !electronicsBills.some((b) => b.id === selectedElecBillId)
    ) {
      setSelectedElecBillId(electronicsBills[electronicsBills.length - 1].id);
    }
  }, [booking.bills]);

  const currentElecBill =
    electronicsBills.find((b) => b.id === selectedElecBillId) ||
    electronicsBills[electronicsBills.length - 1];

  const formattedBookingDate = new Date(booking.createdAt).toLocaleDateString(
    "en-IN",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );

  const deliveryDateRaw = booking.expectedDeliveryDate || booking.eventDate;
  const formattedDeliveryDate = deliveryDateRaw
    ? new Date(deliveryDateRaw).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  const total = Number(booking.totalEstimatedAmount);
  const advance = Number(booking.advancePaid);

  const totalBillsDue = (booking.bills || []).reduce(
    (sum, b) => sum + Number(b.dueAmount || 0),
    0
  );
  const unbilledItemsDue = (booking.bookingItems || [])
    .filter((i) => !i.isBilled)
    .reduce((sum, i) => sum + Number(i.lineTotal || 0), 0);

  const liveRemainingDue =
    booking.bills && booking.bills.length > 0
      ? totalBillsDue + unbilledItemsDue
      : Number(booking.remainingBalance);

  const billsWithDue = (booking.bills || []).filter(
    (b) => Number(b.dueAmount || 0) > 0
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200/90 p-3.5 shadow-2xs space-y-3">
      {/* 1. Header Row: Booking # + Date on left, Status on right */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <span className="inline-flex items-center font-extrabold text-white bg-[#5A94C1] px-2.5 py-0.5 rounded-md border border-[#6EA6CF] border-b-[#3E7197] shadow-[0_2px_0_#3E7197,inset_0_1px_0_rgba(255,255,255,0.35)] font-mono text-[11px] tracking-tight whitespace-nowrap">
            {booking.bookingNumber}
          </span>
          <span className="text-[11px] font-semibold text-gray-500 whitespace-nowrap">
            {formattedBookingDate}
          </span>
        </div>

        <span
          className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider whitespace-nowrap ${
            booking.status === "COMPLETED"
              ? "bg-[#EBFDE7] text-[#14532D] border border-[#81FF7A]/80 border-b-[#4ADE80]"
              : booking.status === "CANCELLED"
              ? "bg-[#FDF2F2] text-[#780000] border border-[#780000]/30 border-b-[#780000]/60"
              : booking.status === "PARTIALLY_DELIVERED"
              ? "bg-[#FEF9E7] text-[#854D0E] border border-[#FFCA3A] border-b-[#E5B020]"
              : "bg-[#F1F5F9] text-[#334155] border border-[#94A3B8] border-b-[#64748B]"
          }`}
        >
          {booking.status.replace("_", " ")}
        </span>
      </div>

      {/* 2 & 3. Customer, Delivery & Linked Bills Sub-Box */}
      <div className="bg-[#EEF4FA] border border-[#CBD8E8] rounded-xl p-3 space-y-2.5">
        {/* 2. Customer & Delivery Row */}
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">
              {booking.customer?.name || "Customer"}
            </p>
            <p className="text-[11px] text-slate-600 font-mono">
              {booking.customer?.phone || "—"}
            </p>
          </div>

          {formattedDeliveryDate && (
            <div className="shrink-0 inline-flex items-center gap-1.5 text-[11px] font-semibold text-blue-900 bg-white border border-blue-200/80 px-2 py-1 rounded-lg shadow-2xs">
              <img
                src="/design-logos/truck-logo.png"
                alt="Delivery"
                className="w-3.5 h-3.5 object-contain shrink-0"
              />
              <span className="whitespace-nowrap">{formattedDeliveryDate}</span>
            </div>
          )}
        </div>

        {/* 3. Linked Bills Section (Per-bill view & due settlement) */}
        {(hasFurniture || hasElectronics) && (
          <div className="border-t border-[#D6E1EE] pt-2.5 space-y-2">
          {hasFurniture && (
            <div className="flex items-center justify-between gap-2">
              {furnitureBill ? (
                <>
                  <Link
                    href={`/billing/${furnitureBill.id}`}
                    className="inline-flex items-center gap-1.5 font-semibold text-white bg-[#235347] hover:brightness-110 px-2.5 py-0.5 rounded-md border border-[#2F6859] border-b-[#14352D] shadow-[0_1.5px_0_#14352D,inset_0_1px_0_rgba(255,255,255,0.3)] text-[11px] font-mono whitespace-nowrap"
                  >
                    <img
                      src="/furniture-logo-icon.png"
                      alt="Furniture"
                      className="w-3 h-3 object-contain shrink-0"
                    />
                    <span>{furnitureBill.billNumber}</span>
                  </Link>
                  <DuePaymentPill
                    dueAmount={furnitureBill.dueAmount}
                    bill={{
                      ...furnitureBill,
                      customer: booking.customer,
                      customerPhone: booking.customer?.phone,
                    }}
                    onClick={onCollectDue}
                  />
                </>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-[#FEF9E7] text-[#854D0E] border border-[#FFCA3A] px-2 py-0.5 rounded">
                  <span>⏳</span>
                  <span>Furn: Pending Invoice</span>
                </span>
              )}
            </div>
          )}

          {hasElectronics && (
            <div className="flex items-center justify-between gap-2 relative">
              {electronicsBills.length === 0 ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-[#FEF9E7] text-[#854D0E] border border-[#FFCA3A] px-2 py-0.5 rounded">
                  <span>⏳</span>
                  <span>Elec: Pending Delivery</span>
                </span>
              ) : electronicsBills.length === 1 ? (
                <>
                  <Link
                    href={`/billing/${electronicsBills[0].id}`}
                    className="inline-flex items-center gap-1.5 font-semibold text-white bg-[#093F52] hover:brightness-110 px-2.5 py-0.5 rounded-md border border-[#105269] border-b-[#052531] shadow-[0_1.5px_0_#052531,inset_0_1px_0_rgba(255,255,255,0.3)] text-[11px] font-mono whitespace-nowrap"
                  >
                    <span>⚡</span>
                    <span>{electronicsBills[0].billNumber}</span>
                  </Link>
                  <DuePaymentPill
                    dueAmount={electronicsBills[0].dueAmount}
                    bill={{
                      ...electronicsBills[0],
                      customer: booking.customer,
                      customerPhone: booking.customer?.phone,
                    }}
                    onClick={onCollectDue}
                  />
                </>
              ) : (
                <>
                  <div className="relative inline-flex items-stretch rounded-md border border-[#105269] border-b-[#052531] bg-[#093F52] shadow-[0_1.5px_0_#052531,inset_0_1px_0_rgba(255,255,255,0.3)]">
                    <Link
                      href={`/billing/${currentElecBill.id}`}
                      className="inline-flex items-center gap-1.5 font-semibold text-white px-2.5 py-0.5 text-[11px] font-mono rounded-l-md whitespace-nowrap"
                    >
                      <span>⚡</span>
                      <span>{currentElecBill.billNumber}</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => setIsDropdownOpen((prev) => !prev)}
                      className="px-2 hover:bg-white/10 border-l border-[#105269] text-white text-[10px] font-black flex items-center justify-center rounded-r-md"
                      title="Switch delivery invoice"
                    >
                      ▾
                    </button>

                    {isDropdownOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-20"
                          onClick={() => setIsDropdownOpen(false)}
                        />
                        <div className="absolute left-0 top-7 z-30 bg-white border border-gray-200 rounded-lg shadow-xl py-1 min-w-[220px] text-xs">
                          <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 flex justify-between">
                            <span>Delivery Invoices ({electronicsBills.length})</span>
                            <span className="text-purple-600">Switch</span>
                          </div>
                          {electronicsBills.map((b) => {
                            const bDue = Number(b.dueAmount || 0);
                            const isCurrent = b.id === currentElecBill.id;
                            return (
                              <div
                                key={b.id}
                                onClick={() => {
                                  setSelectedElecBillId(b.id);
                                  setIsDropdownOpen(false);
                                }}
                                className={`px-3 py-2 flex items-center justify-between gap-2 hover:bg-purple-50 cursor-pointer ${
                                  isCurrent
                                    ? "bg-purple-50 font-bold text-purple-900"
                                    : "text-gray-700"
                                }`}
                              >
                                <span className="flex items-center gap-1 font-mono text-[11px]">
                                  <span>⚡</span>
                                  <span>{b.billNumber}</span>
                                </span>
                                <span
                                  onClick={(e) => {
                                    if (bDue > 0 && onCollectDue) {
                                      e.stopPropagation();
                                      setIsDropdownOpen(false);
                                      onCollectDue({
                                        ...b,
                                        customer: booking.customer,
                                        customerPhone: booking.customer?.phone,
                                      });
                                    }
                                  }}
                                >
                                  <DuePaymentPill
                                    dueAmount={bDue}
                                    bill={{
                                      ...b,
                                      customer: booking.customer,
                                      customerPhone: booking.customer?.phone,
                                    }}
                                    onClick={onCollectDue}
                                  />
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>

                  <DuePaymentPill
                    dueAmount={currentElecBill.dueAmount}
                    bill={{
                      ...currentElecBill,
                      customer: booking.customer,
                      customerPhone: booking.customer?.phone,
                    }}
                    onClick={onCollectDue}
                  />
                </>
              )}
            </div>
          )}
          </div>
        )}
      </div>

      {/* 4. Financial Strip + Package Slip Action */}
      <div className="bg-[#FAF8F5] border border-[#E5DFD7]/80 rounded-lg p-2.5 grid grid-cols-3 gap-2 items-center">
        <div>
          <p className="text-[9.5px] font-bold uppercase tracking-wider text-gray-400">
            Total
          </p>
          <p className="text-xs font-black text-gray-900 tabular-nums mt-0.5">
            ₹{total.toLocaleString("en-IN")}
          </p>
        </div>

        <div className="text-center">
          <p className="text-[9.5px] font-bold uppercase tracking-wider text-gray-400">
            Advance
          </p>
          <p className="text-xs font-black text-[#15803D] tabular-nums mt-0.5">
            ₹{advance.toLocaleString("en-IN")}
          </p>
        </div>

        <div className="text-right">
          <p className="text-[9.5px] font-bold uppercase tracking-wider text-gray-400">
            Due
          </p>
          <div className="mt-0.5 flex justify-end">
            {liveRemainingDue <= 0 ? (
              <span className="text-xs font-black text-[#15803D]">₹0 (Paid)</span>
            ) : unbilledItemsDue === 0 &&
              billsWithDue.length === 1 &&
              onCollectDue ? (
              <DuePaymentPill
                dueAmount={liveRemainingDue}
                bill={{
                  ...billsWithDue[0],
                  customer: booking.customer,
                  customerPhone: booking.customer?.phone,
                }}
                onClick={onCollectDue}
              />
            ) : (
              <button
                type="button"
                onClick={() => setShowDueBreakdownModal(true)}
                className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-[#FDF2F2] text-[#780000] border border-[#780000]/30 border-b-2 border-b-[#780000]/60 px-2 py-0.5 rounded cursor-pointer"
              >
                <span className="font-mono">
                  ₹{liveRemainingDue.toLocaleString("en-IN")}
                </span>
                <span className="text-[9px]">▾</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div>
        <button
          type="button"
          onClick={() => onViewSlip(booking)}
          className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#5A94C1] hover:brightness-110 active:translate-y-0.5 text-white text-xs font-bold border border-[#6EA6CF] border-b-[#3E7197] shadow-[0_2px_0_#3E7197,inset_0_1px_0_rgba(255,255,255,0.35)] transition-all cursor-pointer"
        >
          <FaEye className="w-3.5 h-3.5 text-white/90" />
          <span>Package Slip</span>
        </button>
      </div>

      <BookingDueBreakdownModal
        isOpen={showDueBreakdownModal}
        onClose={() => setShowDueBreakdownModal(false)}
        booking={booking}
        onCollectBillDue={onCollectDue}
      />
    </div>
  );
}

export default function BookingHistoryMobileCards({
  bookings,
  onViewSlip,
  onCollectDue,
}: BookingHistoryMobileCardsProps) {
  return (
    <div className="md:hidden space-y-3 p-3 bg-[#F8F6F2]">
      {bookings.map((booking) => (
        <BookingHistoryMobileCard
          key={booking.id}
          booking={booking}
          onViewSlip={onViewSlip}
          onCollectDue={onCollectDue}
        />
      ))}
    </div>
  );
}
