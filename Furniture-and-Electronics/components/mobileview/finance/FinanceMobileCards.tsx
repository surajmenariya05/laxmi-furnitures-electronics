"use client";

import React from "react";
import { FaPen, FaEye, FaWallet } from "react-icons/fa";
import { FinanceRecordItem } from "@/hooks/useFinanceRecords";

interface FinanceMobileCardsProps {
  records: FinanceRecordItem[];
  isOwner: boolean;
  onEdit: (record: FinanceRecordItem) => void;
  onView: (record: FinanceRecordItem) => void;
}

export default function FinanceMobileCards({
  records,
  isOwner,
  onEdit,
  onView,
}: FinanceMobileCardsProps) {
  return (
    <div className="flex-1 overflow-auto divide-y divide-gray-100">
      {records.length === 0 ? (
        <div className="px-6 py-12 text-center text-gray-500 font-medium">
          <FaWallet className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-base font-bold text-gray-700">No finance records found.</p>
          <p className="text-xs text-gray-400 mt-1">
            Tap &quot;+ Create Finance&quot; above to add a financed deal.
          </p>
        </div>
      ) : (
        records.map((rec) => (
          <div key={rec.id} className="p-4 space-y-3 bg-white">
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

            <div>
              <div className="font-bold text-gray-900 text-sm">{rec.customerName}</div>
              {rec.customerPhone && (
                <div className="text-xs text-gray-500 font-mono">{rec.customerPhone}</div>
              )}
              <div className="text-xs text-gray-600 mt-1 truncate">{rec.productName}</div>
            </div>

            <div
              className={`grid ${
                isOwner ? "grid-cols-3" : "grid-cols-2"
              } gap-2 bg-[#FAF7F2] rounded-xl p-2.5 border border-[#E5DFD7] text-center`}
            >
              <div>
                <div className="text-[10px] font-bold text-gray-500 uppercase">Price</div>
                <div className="text-xs font-black text-gray-900">
                  ₹{Number(rec.productPrice || 0).toLocaleString("en-IN")}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-gray-500 uppercase">Downpay</div>
                <div className="text-xs font-bold text-gray-700">
                  ₹{Number(rec.downpayment || 0).toLocaleString("en-IN")}
                </div>
              </div>
              {isOwner && (
                <div>
                  <div className="text-[10px] font-bold text-emerald-700 uppercase">
                    Net Bank
                  </div>
                  <div className="text-xs font-black text-emerald-700">
                    ₹{Number(rec.netAmountReceived || 0).toLocaleString("en-IN")}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-0.5">
              <button
                type="button"
                onClick={() => onEdit(rec)}
                className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-bold text-[#7A5416] bg-gradient-to-b from-[#FCF7EB] to-[#F7ECD6] border border-[#E5CE9A] border-b-2 border-b-[#C69C4D] rounded-full shadow-2xs active:translate-y-px"
              >
                <FaPen className="w-2.5 h-2.5" />
                <span>Edit</span>
              </button>
              <button
                type="button"
                onClick={() => onView(rec)}
                className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-bold text-[#35347A] bg-gradient-to-b from-[#F5F5FC] to-[#E9E9F8] border border-[#C6C5ED] border-b-2 border-b-[#7F7ECC] rounded-full shadow-2xs active:translate-y-px"
              >
                <FaEye className="w-3 h-3" />
                <span>View Invoice</span>
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
