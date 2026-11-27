"use client";

import React from "react";
import { FaPen, FaEye, FaWallet, FaWhatsapp } from "react-icons/fa";
import { FinanceRecordItem } from "@/hooks/useFinanceRecords";

interface FinanceMobileCardsProps {
  records: FinanceRecordItem[];
  isOwner: boolean;
  onEdit: (record: FinanceRecordItem) => void;
  onView: (record: FinanceRecordItem) => void;
  onResendWhatsApp: (record: FinanceRecordItem) => void;
}

export default function FinanceMobileCards({
  records,
  isOwner,
  onEdit,
  onView,
  onResendWhatsApp,
}: FinanceMobileCardsProps) {
  return (
    <div className="flex-1 overflow-auto p-3 space-y-3 bg-[#F8F6F2]">
      {records.length === 0 ? (
        <div className="px-6 py-12 text-center text-gray-500 font-medium bg-white rounded-2xl border border-[#DED6CA]">
          <FaWallet className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-base font-bold text-gray-700">No finance records found.</p>
          <p className="text-xs text-gray-400 mt-1">
            Tap &quot;+ Create Finance&quot; above to add a financed deal.
          </p>
        </div>
      ) : (
        records.map((rec) => (
          <div
            key={rec.id}
            className="p-4 space-y-3 bg-white rounded-2xl border border-[#DED6CA] shadow-xs"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="font-mono font-extrabold text-gray-900 text-sm">
                  #{rec.invoiceNumber}
                </span>
                <div className="text-[11px] text-gray-500">
                  {new Date(rec.financeDate).toLocaleDateString("en-IN")}
                </div>
              </div>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                {rec.providerName}
              </span>
            </div>

            <div className="bg-[#EEF4FA] border border-[#CBD8E8] rounded-xl p-3 space-y-1.5">
              <div className="flex items-baseline justify-between gap-2">
                <div className="text-base font-extrabold text-gray-900 truncate">
                  {rec.customerName}
                </div>
                {rec.customerPhone && (
                  <div className="text-xs text-slate-700 font-mono font-semibold shrink-0">
                    <span className="font-sans text-[11px] font-bold text-slate-500 mr-1">
                      Mob:
                    </span>
                    {rec.customerPhone}
                  </div>
                )}
              </div>
              <div className="flex items-start justify-between gap-2 border-t border-[#D6E1EE] pt-1.5">
                <div className="text-xs font-semibold text-slate-700 leading-snug break-words min-w-0 flex-1">
                  {rec.productName}
                </div>
                {rec.serialNumber && (
                  <span className="shrink-0 text-[10.5px] font-mono font-semibold text-slate-700 bg-white border border-[#CBD8E8] px-2 py-0.5 rounded-md">
                    S/N: {rec.serialNumber}
                  </span>
                )}
              </div>
            </div>

            <div
              className={`grid ${
                isOwner ? "grid-cols-3 divide-x divide-[#E5DFD7]" : "grid-cols-2 divide-x divide-[#E5DFD7]"
              } bg-[#FAF7F2] rounded-xl py-2.5 border border-[#E5DFD7] text-center`}
            >
              <div className="px-2">
                <div className="text-[10px] font-bold text-gray-500 uppercase">Price</div>
                <div className="text-xs font-black text-gray-900 tabular-nums mt-0.5">
                  ₹{Number(rec.productPrice || 0).toLocaleString("en-IN")}
                </div>
              </div>
              <div className="px-2">
                <div className="text-[10px] font-bold text-gray-500 uppercase">Downpay</div>
                <div className="text-xs font-bold text-gray-700 tabular-nums mt-0.5">
                  ₹{Number(rec.downpayment || 0).toLocaleString("en-IN")}
                </div>
              </div>
              {isOwner && (
                <div className="px-2">
                  <div className="text-[10px] font-bold text-emerald-700 uppercase">
                    Net Bank
                  </div>
                  <div className="text-xs font-black text-emerald-700 tabular-nums mt-0.5">
                    ₹{Number(rec.netAmountReceived || 0).toLocaleString("en-IN")}
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 pt-0.5">
              <button
                type="button"
                onClick={() => onEdit(rec)}
                className="w-full inline-flex items-center justify-center gap-1 h-9 px-2 text-xs font-bold text-[#7A5416] bg-gradient-to-b from-[#FCF7EB] to-[#F7ECD6] border border-[#E5CE9A] border-b-2 border-b-[#C69C4D] rounded-full shadow-2xs active:translate-y-px"
              >
                <FaPen className="w-2.5 h-2.5 shrink-0" />
                <span>Edit</span>
              </button>
              <button
                type="button"
                onClick={() => onView(rec)}
                className="w-full inline-flex items-center justify-center gap-1 h-9 px-2 text-xs font-bold text-[#35347A] bg-gradient-to-b from-[#F5F5FC] to-[#E9E9F8] border border-[#C6C5ED] border-b-2 border-b-[#7F7ECC] rounded-full shadow-2xs active:translate-y-px"
              >
                <FaEye className="w-3 h-3 shrink-0" />
                <span>Invoice</span>
              </button>
              <button
                type="button"
                onClick={() => onResendWhatsApp(rec)}
                className="w-full inline-flex items-center justify-center gap-1 h-9 px-2 text-xs font-bold text-[#11633B] bg-gradient-to-b from-[#ECFDF5] to-[#D1FAE5] border border-[#86EFAC] border-b-2 border-b-[#16A34A] rounded-full shadow-2xs active:translate-y-px"
              >
                <FaWhatsapp className="w-3.5 h-3.5 shrink-0 text-[#15803D]" />
                <span>Send</span>
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
