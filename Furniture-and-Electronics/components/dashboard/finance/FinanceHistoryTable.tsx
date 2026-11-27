"use client";

import React from "react";
import { FaSearch, FaPen, FaEye, FaWallet, FaWhatsapp } from "react-icons/fa";
import { FinanceRecordItem } from "@/hooks/useFinanceRecords";
import FinanceMobileCards from "@/components/mobileview/finance/FinanceMobileCards";
import ActionTooltip from "@/components/ui/ActionTooltip";

interface FinanceHistoryTableProps {
  records: FinanceRecordItem[];
  isOwner: boolean;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onEdit: (record: FinanceRecordItem) => void;
  onView: (record: FinanceRecordItem) => void;
  onResendWhatsApp: (record: FinanceRecordItem) => void;
}

export default function FinanceHistoryTable({
  records,
  isOwner,
  searchQuery,
  setSearchQuery,
  onEdit,
  onView,
  onResendWhatsApp,
}: FinanceHistoryTableProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#E5DFD7] flex-1 flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <FaSearch className="absolute left-3.5 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search by customer name, phone, item, or invoice no..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition font-medium text-sm"
          />
        </div>
      </div>

      {/* Mobile Cards View (Option A) */}
      <div className="md:hidden flex-1 overflow-auto">
        <FinanceMobileCards
          records={records}
          isOwner={isOwner}
          onEdit={onEdit}
          onView={onView}
          onResendWhatsApp={onResendWhatsApp}
        />
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block flex-1 overflow-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              <th className="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                Invoice No.
              </th>
              <th className="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                Customer Details
              </th>
              <th className="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                Finance Provider
              </th>
              <th className="px-5 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                Downpayment
              </th>
              {isOwner && (
                <th className="px-5 py-3 text-right text-xs font-bold text-emerald-700 uppercase tracking-wider">
                  Net Amount
                </th>
              )}
              <th className="px-5 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                Product Price
              </th>
              <th className="px-5 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200 text-sm">
            {records.length === 0 ? (
              <tr>
                <td
                  colSpan={isOwner ? 8 : 7}
                  className="px-6 py-12 text-center text-gray-500 font-medium"
                >
                  <FaWallet className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-base font-bold text-gray-700">
                    No finance records found.
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Click &quot;+ Create Finance&quot; above to add a financed deal.
                  </p>
                </td>
              </tr>
            ) : (
              records.map((rec) => (
                <tr key={rec.id} className="hover:bg-gray-50/70 transition">
                  <td className="px-5 py-3.5 whitespace-nowrap text-gray-600 font-medium">
                    {new Date(rec.financeDate).toLocaleDateString("en-IN")}
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono font-bold text-gray-900">
                        #{rec.invoiceNumber}
                      </span>
                      {rec.serialNumber && (
                        <span className="text-[10.5px] font-mono font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
                          S/N: {rec.serialNumber}
                        </span>
                      )}
                    </div>
                    <div
                      className="text-[11px] text-gray-500 max-w-[180px] truncate mt-0.5"
                      title={rec.productName}
                    >
                      {rec.productName}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <div className="font-bold text-gray-900">{rec.customerName}</div>
                    <div className="text-xs text-gray-500">
                      {rec.customerPhone || "—"}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                      {rec.providerName}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap text-right font-bold text-gray-700">
                    ₹{Number(rec.downpayment || 0).toLocaleString("en-IN")}
                  </td>
                  {isOwner && (
                    <td className="px-5 py-3.5 whitespace-nowrap text-right font-black text-emerald-700">
                      ₹{Number(rec.netAmountReceived || 0).toLocaleString("en-IN")}
                    </td>
                  )}
                  <td className="px-5 py-3.5 whitespace-nowrap text-right font-black text-gray-900">
                    ₹{Number(rec.productPrice || 0).toLocaleString("en-IN")}
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap text-right">
                    <div className="inline-flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onEdit(rec)}
                        aria-label="Edit Finance Details"
                        className="group relative inline-flex items-center justify-center w-7 h-7 shrink-0 text-xs font-bold text-[#7A5416] bg-gradient-to-b from-[#FCF7EB] to-[#F7ECD6] hover:from-[#FEFBF4] hover:to-[#F2E2C2] border border-[#E5CE9A] border-b-2 border-b-[#C69C4D] hover:border-[#B38632] rounded-full shadow-[0_2px_4px_rgba(122,84,22,0.1),inset_0_1px_0_rgba(255,255,255,0.95)] hover:shadow-md active:translate-y-px transition-all duration-150"
                      >
                        <ActionTooltip label="Edit Deal" />
                        <FaPen className="w-2.5 h-2.5 text-[#7A5416] transition-transform group-hover:scale-110 shrink-0" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onView(rec)}
                        aria-label="View Finance Invoice"
                        className="group relative inline-flex items-center justify-center w-7 h-7 shrink-0 text-xs font-bold text-[#35347A] bg-gradient-to-b from-[#F5F5FC] to-[#E9E9F8] hover:from-[#FAF9FE] hover:to-[#DFDFFA] border border-[#C6C5ED] border-b-2 border-b-[#7F7ECC] hover:border-[#6C6BBF] rounded-full shadow-[0_2px_4px_rgba(53,52,122,0.1),inset_0_1px_0_rgba(255,255,255,0.95)] hover:shadow-md active:translate-y-px transition-all duration-150"
                      >
                        <ActionTooltip label="View Invoice" />
                        <FaEye className="w-3 h-3 text-[#35347A] transition-transform group-hover:scale-110 shrink-0" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onResendWhatsApp(rec)}
                        aria-label="Send / Resend PDF on WhatsApp"
                        className="group relative inline-flex items-center justify-center w-7 h-7 shrink-0 text-xs font-bold text-[#11633B] bg-gradient-to-b from-[#ECFDF5] to-[#D1FAE5] hover:from-[#F0FDF4] hover:to-[#A7F3D0] border border-[#86EFAC] border-b-2 border-b-[#16A34A] hover:border-[#15803D] rounded-full shadow-[0_2px_4px_rgba(22,163,74,0.12),inset_0_1px_0_rgba(255,255,255,0.95)] hover:shadow-md active:translate-y-px transition-all duration-150"
                      >
                        <ActionTooltip label="Resend PDF" align="right" />
                        <FaWhatsapp className="w-3.5 h-3.5 text-[#15803D] transition-transform group-hover:scale-110 shrink-0" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
