"use client";

import React from "react";
import { Modal } from "@/components/ui/modal";
import {
  FaTimes,
  FaFileInvoiceDollar,
  FaCheckCircle,
  FaTruck,
  FaBoxes,
  FaExclamationCircle,
} from "react-icons/fa";
import { BookingResponse } from "@/types/booking";

export interface BookingDueBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: BookingResponse | null;
  onCollectBillDue?: (bill: any) => void;
  onOpenDeliveryInvoice?: (booking: BookingResponse) => void;
}

export default function BookingDueBreakdownModal({
  isOpen,
  onClose,
  booking,
  onCollectBillDue,
  onOpenDeliveryInvoice,
}: BookingDueBreakdownModalProps) {
  if (!isOpen || !booking) return null;

  const total = Number(booking.totalEstimatedAmount || 0);
  const advance = Number(booking.advancePaid || 0);

  // Invoiced bills calculations
  const bills = booking.bills || [];
  const billsWithDue = bills.filter((b) => Number(b.dueAmount || 0) > 0);
  const totalBillsDue = bills.reduce(
    (sum, b) => sum + Number(b.dueAmount || 0),
    0
  );

  // Unbilled reserved items calculations
  const bookingItems = booking.bookingItems || [];
  const unbilledItems = bookingItems.filter((i) => !i.isBilled);
  const unbilledItemsDue = unbilledItems.reduce(
    (sum, i) => sum + Number(i.lineTotal || 0),
    0
  );

  // Total Real Due across the entire booking
  const liveRemainingDue =
    bills.length > 0
      ? totalBillsDue + unbilledItemsDue
      : Math.max(0, total - advance);

  const customerName = booking.customer?.name || "Customer";
  const customerPhone = booking.customer?.phone || "";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="bg-[#F8F7F4] rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-[#DEDAD3] overflow-hidden"
    >
      {/* 1. Modal Header */}
      <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between bg-white">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
            <FaFileInvoiceDollar className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-gray-900 leading-tight">
                Outstanding Dues & Delivery Breakdown
              </h3>
            </div>
            <p className="text-xs text-gray-500 font-mono mt-0.5">
              Booking #{booking.bookingNumber} — <span className="font-sans font-semibold text-gray-700">{customerName}</span>
              {customerPhone && <span className="text-gray-400 ml-1">({customerPhone})</span>}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition"
        >
          <FaTimes className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Scrollable Body */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-5 space-y-4">
        {/* Top Financial Stat Bar */}
        <div className="grid grid-cols-3 gap-2.5 text-center">
          <div className="p-2.5 bg-white rounded-xl border border-gray-200">
            <span className="text-[10px] font-bold text-gray-500 uppercase block">Total Order</span>
            <span className="text-sm font-black text-gray-900 font-mono mt-0.5 block">
              ₹{total.toLocaleString("en-IN")}
            </span>
          </div>
          <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200">
            <span className="text-[10px] font-bold text-emerald-700 uppercase block">Advance Paid</span>
            <span className="text-sm font-black text-[#15803D] font-mono mt-0.5 block">
              ₹{advance.toLocaleString("en-IN")}
            </span>
          </div>
          <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-200">
            <span className="text-[10px] font-bold text-rose-700 uppercase block">Total Due</span>
            <span className="text-sm font-black text-[#780000] font-mono mt-0.5 block">
              ₹{liveRemainingDue.toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        {/* Section A: Invoiced Bills Dues */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <div className="flex items-center gap-1.5">
              <FaFileInvoiceDollar className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-xs font-bold text-gray-800 uppercase tracking-wide">
                Generated Delivery Invoices ({bills.length})
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-gray-700">
              Invoiced Due: <strong className="text-red-700">₹{totalBillsDue.toLocaleString("en-IN")}</strong>
            </span>
          </div>

          {bills.length === 0 ? (
            <div className="p-3 bg-gray-50 rounded-lg text-xs text-gray-500 text-center">
              No delivery invoices generated yet.
            </div>
          ) : billsWithDue.length === 0 ? (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 font-medium flex items-center gap-2">
              <FaCheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>All generated delivery invoices for this booking are fully paid!</span>
            </div>
          ) : (
            <div className="space-y-2">
              {billsWithDue.map((bill) => {
                const isFurn = bill.department === "FURNITURE";
                const bDue = Number(bill.dueAmount || 0);
                const bTotal = Number(bill.totalAmount || 0);
                const bPaid = Number(bill.paidAmount || 0);

                return (
                  <div
                    key={bill.id}
                    className="p-3 rounded-lg border border-gray-200 bg-gray-50/80 hover:bg-amber-50/50 transition-colors flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs">{isFurn ? "🛋️" : "⚡"}</span>
                        <span className="font-mono font-bold text-xs text-gray-900">
                          {bill.billNumber}
                        </span>
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                          isFurn ? "bg-amber-100 text-amber-800" : "bg-purple-100 text-purple-800"
                        }`}>
                          {bill.department}
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-500 font-mono mt-1">
                        Total: ₹{bTotal.toLocaleString("en-IN")} · Paid: ₹{bPaid.toLocaleString("en-IN")}
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <div className="text-right">
                        <span className="text-[9px] uppercase font-bold text-gray-400 block">Due Now</span>
                        <span className="font-mono font-black text-xs text-red-700">
                          ₹{bDue.toLocaleString("en-IN")}
                        </span>
                      </div>
                      {onCollectBillDue && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onCollectBillDue({
                              ...bill,
                              customer: booking.customer,
                              customerPhone: booking.customer?.phone,
                            });
                          }}
                          className="px-2.5 py-1.5 bg-[#15803D] hover:bg-[#166534] text-white rounded-lg text-xs font-bold shadow-2xs transition active:scale-95 cursor-pointer whitespace-nowrap"
                        >
                          Collect 💳
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Section B: Unbilled / Pending Delivery Items */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <div className="flex items-center gap-1.5">
              <FaTruck className="w-3.5 h-3.5 text-amber-600" />
              <span className="text-xs font-bold text-gray-800 uppercase tracking-wide">
                Pending Deliveries ({unbilledItems.length} Items)
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-gray-700">
              Pending Value: <strong className="text-amber-800">₹{unbilledItemsDue.toLocaleString("en-IN")}</strong>
            </span>
          </div>

          {unbilledItems.length === 0 ? (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 font-medium flex items-center gap-2">
              <FaCheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>All reserved items for this booking have been invoiced and delivered.</span>
            </div>
          ) : (
            <>
              <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                {unbilledItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-2 rounded-lg bg-gray-50 border border-gray-150 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2 truncate mr-2">
                      <span className="text-xs">{item.department === "ELECTRONICS" ? "⚡" : "🛋️"}</span>
                      <span className="font-semibold text-gray-800 truncate">
                        {item.product?.name || "Item"}
                      </span>
                      <span className="text-[10px] text-gray-500 whitespace-nowrap">
                        (Qty: {item.quantity})
                      </span>
                    </div>
                    <span className="font-mono font-bold text-gray-700 whitespace-nowrap">
                      ₹{Number(item.lineTotal || 0).toLocaleString("en-IN")}
                    </span>
                  </div>
                ))}
              </div>

              <div className="p-2.5 bg-amber-50/80 border border-amber-200 rounded-lg flex items-start gap-2.5 text-[11px] text-amber-900 leading-snug">
                <FaExclamationCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-amber-950">These items are pending delivery.</p>
                  <p className="text-amber-800 text-[10.5px] mt-0.5">Dues are collected when generating their delivery tax invoice.</p>
                </div>
              </div>

              {onOpenDeliveryInvoice && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenDeliveryInvoice(booking);
                  }}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition active:scale-[0.99] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>⚡</span>
                  <span>Generate Delivery Invoice for Pending Items</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* 3. Modal Footer */}
      <div className="px-5 py-3 border-t border-gray-200 flex justify-end bg-gray-50">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-xs font-bold transition"
        >
          Close
        </button>
      </div>
    </Modal>
  );
}
