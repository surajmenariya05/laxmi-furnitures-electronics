"use client";

import React from "react";
import Link from "next/link";
import { FaWhatsapp, FaMoneyBillWave } from "react-icons/fa";

interface DuePaymentsMobileCardsProps {
  dues: any[];
  loading: boolean;
  sendingWhatsappId: number | null;
  calculateDaysPassed: (dateStr: string) => number;
  onSendWhatsapp: (bill: any) => void;
  onOpenPaymentModal: (bill: any) => void;
}

export default function DuePaymentsMobileCards({
  dues,
  loading,
  sendingWhatsappId,
  calculateDaysPassed,
  onSendWhatsapp,
  onOpenPaymentModal,
}: DuePaymentsMobileCardsProps) {
  return (
    <div className="space-y-3 mb-4">
      {loading ? (
        <div className="bg-white rounded-xl p-6 text-center text-gray-500 text-sm">
          Loading dues...
        </div>
      ) : dues.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center text-gray-500 text-sm font-medium border border-gray-200">
          No pending due payments found.
        </div>
      ) : (
        dues.map((bill: any) => {
          const daysPassed = calculateDaysPassed(bill.createdAt);
          const isOverdue = daysPassed >= 15;
          const isUnpaid = (bill.paymentStatus || "").toUpperCase() === "UNPAID";

          return (
            <div
              key={bill.id}
              className="bg-white rounded-2xl border border-[#E5DFD7] p-4 shadow-xs space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Link
                    href={`/billing/${bill.id}`}
                    className="text-sm font-black text-blue-600 hover:underline"
                  >
                    #{bill.billNumber}
                  </Link>
                  <div className="text-[11px] text-gray-500 mt-0.5">
                    {new Date(bill.createdAt).toLocaleDateString()} ·{" "}
                    <span className={isOverdue ? "text-[#780000] font-bold" : ""}>
                      {isOverdue ? `Overdue (${daysPassed}d)` : `${daysPassed}d ago`}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      (bill.department || "FURNITURE").toUpperCase() === "FURNITURE"
                        ? "bg-[#235347] text-white"
                        : "bg-[#093F52] text-white"
                    }`}
                  >
                    {(bill.department || "FURNITURE").toUpperCase() === "FURNITURE"
                      ? "FURN"
                      : "ELEC"}
                  </span>
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                      isUnpaid
                        ? "bg-[#FDF2F2] text-[#780000] border border-[#780000]/30"
                        : "bg-[#FEF9E7] text-[#854D0E] border border-[#FFCA3A]"
                    }`}
                  >
                    {isUnpaid ? "UNPAID" : "PARTIAL"}
                  </span>
                </div>
              </div>

              <div className="flex items-baseline justify-between gap-2 border-t border-gray-100 pt-2.5">
                <div className="text-base font-extrabold text-gray-900 truncate">
                  {bill.customer?.name || "Guest"}
                </div>
                <div className="text-xs text-gray-700 font-mono font-semibold shrink-0">
                  <span className="font-sans text-[11px] font-bold text-gray-400 mr-1">
                    Mob:
                  </span>
                  {bill.customer?.phone || "N/A"}
                </div>
              </div>

              <div className="grid grid-cols-3 divide-x divide-gray-200 bg-[#FAF8F5] rounded-xl py-2.5 border border-[#E5DFD7] text-center">
                <div className="px-2">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Total
                  </div>
                  <div className="text-xs font-extrabold text-gray-900 tabular-nums mt-0.5">
                    ₹{parseFloat(bill.totalAmount).toLocaleString("en-IN")}
                  </div>
                </div>
                <div className="px-2">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Paid
                  </div>
                  <div className="text-xs font-extrabold text-[#15803D] tabular-nums mt-0.5">
                    ₹{parseFloat(bill.paidAmount).toLocaleString("en-IN")}
                  </div>
                </div>
                <div className="px-2">
                  <div className="text-[10px] font-bold text-[#780000] uppercase tracking-wider">
                    Due
                  </div>
                  <div className="text-xs font-black text-[#780000] tabular-nums mt-0.5">
                    ₹{parseFloat(bill.dueAmount).toLocaleString("en-IN")}
                  </div>
                </div>
              </div>

              <div
                className={`pt-1 ${
                  bill.customer?.phone
                    ? "grid grid-cols-2 gap-2.5"
                    : "flex justify-end"
                }`}
              >
                {bill.customer?.phone && (
                  <button
                    type="button"
                    onClick={() => onSendWhatsapp(bill)}
                    disabled={sendingWhatsappId === bill.id}
                    className="w-full inline-flex items-center justify-center gap-1.5 h-9 px-3 text-xs font-bold text-[#136338] bg-gradient-to-b from-[#F2FBF6] to-[#E4F5EB] border border-[#A8E2BF] border-b-2 border-b-[#4BAE74] rounded-full shadow-2xs disabled:opacity-50"
                  >
                    <FaWhatsapp className="w-3.5 h-3.5 shrink-0" />
                    <span>Remind</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onOpenPaymentModal(bill)}
                  className={`${
                    bill.customer?.phone ? "w-full" : "px-5"
                  } inline-flex items-center justify-center gap-1.5 h-9 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-xs font-bold shadow-xs`}
                >
                  <FaMoneyBillWave className="w-3.5 h-3.5 shrink-0" />
                  <span>Collect Due</span>
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
