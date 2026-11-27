"use client";

import React from "react";
import Link from "next/link";
import { FaPen, FaWhatsapp, FaEye, FaDownload } from "react-icons/fa";
import ActionTooltip from "@/components/ui/ActionTooltip";
import { BillingHistoryItem } from "@/components/mobileview/billing/BillingHistoryMobileCards";

interface BillingHistoryTableProps {
  bills: BillingHistoryItem[];
  loading: boolean;
  role?: string | null;
  sendingWhatsappId: number | null;
  onEdit: (bill: BillingHistoryItem) => void;
  onSendWhatsapp: (bill: BillingHistoryItem) => void;
  onDownloadBill: (billId: number) => void;
}

export default function BillingHistoryTable({
  bills,
  loading,
  role,
  sendingWhatsappId,
  onEdit,
  onSendWhatsapp,
  onDownloadBill,
}: BillingHistoryTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date &amp; Dept
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Bill Number
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Customer
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Total Amount
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Payment
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
              WhatsApp
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-[185px] min-w-[185px]">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {bills.map((bill) => (
            <tr key={bill.id}>
              <td className="px-4 py-3.5 whitespace-nowrap">
                <div className="mb-1">
                  <span
                    className={`px-2 py-0.5 inline-flex text-[10.5px] font-bold rounded-full items-center gap-1 ${
                      bill.department === "ELECTRONICS"
                        ? "bg-[#093F52] text-white border border-[#105269] border-b-[#052531] shadow-[0_1px_2px_rgba(0,0,0,0.18)]"
                        : "bg-[#235347] text-white border border-[#2F6859] border-b-[#14352D] shadow-[0_1px_2px_rgba(0,0,0,0.18)]"
                    }`}
                  >
                    {bill.department === "ELECTRONICS" ? (
                      <>⚡ Elec</>
                    ) : (
                      <span className="inline-flex items-center gap-1">
                        <img
                          src="/furniture-logo-icon.png"
                          alt="Furn"
                          className="w-3 h-3 object-contain shrink-0"
                        />
                        <span>Furn</span>
                      </span>
                    )}
                  </span>
                </div>
                <div className="text-xs text-gray-500 font-medium font-mono">
                  {new Date(bill.createdAt).toLocaleDateString("en-IN")}
                </div>
              </td>
              <td className="px-4 py-3.5 whitespace-nowrap text-sm font-semibold text-gray-900">
                <div>#{bill.billNumber}</div>
                {bill.booking && (
                  <Link
                    href="/bookings/history"
                    className="inline-flex items-center gap-1 text-[10px] font-extrabold text-blue-800 bg-blue-50 hover:bg-blue-100 px-1.5 py-0.5 rounded border border-blue-200 mt-1 transition-colors"
                    title="View Linked Master Booking"
                  >
                    <span>WB:</span>
                    <span className="font-mono">{bill.booking.bookingNumber}</span>
                  </Link>
                )}
              </td>
              <td className="px-4 py-3.5">
                <div
                  className="text-sm font-medium text-gray-900 truncate max-w-[150px] sm:max-w-[190px]"
                  title={bill.customer?.name || "Guest"}
                >
                  {bill.customer?.name || "Guest"}
                </div>
                {bill.customer?.phone && (
                  <div className="text-xs text-gray-500 font-mono">
                    {bill.customer.phone}
                  </div>
                )}
              </td>
              <td className="px-4 py-3.5 whitespace-nowrap text-sm font-bold text-gray-900">
                ₹{bill.totalAmount}
              </td>
              <td className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-500 capitalize">
                <div>{bill.paymentMode}</div>
                {bill.paymentStatus === "PARTIAL" && (
                  <div className="text-[11px] font-bold text-[#780000]">
                    Due: ₹{Number(bill.dueAmount).toLocaleString("en-IN")}
                  </div>
                )}
                {bill.paymentStatus === "PAID" && (
                  <div className="text-[10px] font-bold text-[#15803D]">Paid</div>
                )}
              </td>
              <td className="px-4 py-3.5 whitespace-nowrap text-center">
                <span
                  className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-extrabold uppercase rounded-full ${
                    bill.status === "voided"
                      ? "bg-[#FDF2F2] text-[#780000] border border-[#780000]/30 border-b-[#780000]/60 shadow-[0_2px_4px_rgba(120,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.9)]"
                      : "bg-[#EBFDE7] text-[#14532D] border border-[#81FF7A]/80 border-b-[#4ADE80] shadow-[0_2px_4px_rgba(20,83,45,0.12),inset_0_1px_0_rgba(255,255,255,0.9)]"
                  }`}
                >
                  {bill.status}
                </span>
              </td>
              <td className="px-3 py-3.5 whitespace-nowrap text-center">
                {bill.whatsappStatus ? (
                  <div>
                    <span
                      className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-bold uppercase rounded-full ${
                        bill.whatsappStatus === "sent"
                          ? "bg-[#EBFDE7] text-[#14532D] border border-[#81FF7A]/80 border-b-[#4ADE80] shadow-[0_2px_4px_rgba(20,83,45,0.12),inset_0_1px_0_rgba(255,255,255,0.9)]"
                          : bill.whatsappStatus === "failed"
                          ? "bg-[#FDF2F2] text-[#780000] border border-[#780000]/30 border-b-[#780000]/60 shadow-[0_2px_4px_rgba(120,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.9)]"
                          : "bg-[#FEF9E7] text-[#854D0E] border border-[#FFCA3A] border-b-[#E5B020] shadow-[0_2px_4px_rgba(180,83,9,0.14),inset_0_1px_0_rgba(255,255,255,0.9)]"
                      }`}
                    >
                      {bill.whatsappStatus}
                    </span>
                    {bill.whatsappSentAt && bill.whatsappStatus === "sent" && (
                      <div className="text-[10px] text-gray-500 mt-1">
                        {new Date(bill.whatsappSentAt).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="text-xs text-gray-400">-</span>
                )}
              </td>
              <td className="px-4 py-3.5 whitespace-nowrap text-right text-sm font-medium w-[155px] min-w-[155px]">
                <div className="flex items-center justify-end gap-1.5 w-full">
                  {role === "owner" && bill.status !== "voided" && bill.customer && (
                    <button
                      type="button"
                      onClick={() => onEdit(bill)}
                      aria-label="Edit Bill"
                      className="group relative inline-flex items-center justify-center w-7 h-7 shrink-0 text-xs font-bold text-[#785428] bg-gradient-to-b from-[#FFFDF9] to-[#F5EFEB] hover:from-[#FDFBF7] hover:to-[#EDE3D6] border border-[#E2D4BE] border-b-2 border-b-[#C4A87C] hover:border-[#BFA070] rounded-full shadow-[0_2px_4px_rgba(120,84,40,0.1),inset_0_1px_0_rgba(255,255,255,0.95)] hover:shadow-md active:translate-y-px transition-all duration-150"
                    >
                      <ActionTooltip label="Edit Bill" />
                      <FaPen className="w-2.5 h-2.5 text-[#785428] transition-transform group-hover:scale-110 shrink-0" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onSendWhatsapp(bill)}
                    disabled={sendingWhatsappId === bill.id || bill.status === "voided"}
                    aria-label="Send via WhatsApp"
                    className="group relative inline-flex items-center justify-center w-7 h-7 shrink-0 text-xs font-bold text-[#136338] bg-gradient-to-b from-[#F2FBF6] to-[#E4F5EB] hover:from-[#F8FEFA] hover:to-[#DBEFE3] border border-[#A8E2BF] border-b-2 border-b-[#4BAE74] hover:border-[#3C9C63] rounded-full shadow-[0_2px_4px_rgba(19,99,56,0.1),inset_0_1px_0_rgba(255,255,255,0.95)] hover:shadow-md active:translate-y-px transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ActionTooltip label="WhatsApp" />
                    {sendingWhatsappId === bill.id ? (
                      <div className="w-3 h-3 border-2 border-[#136338] border-t-transparent rounded-full animate-spin shrink-0" />
                    ) : (
                      <FaWhatsapp className="w-3.5 h-3.5 text-[#136338] transition-transform group-hover:scale-110 shrink-0" />
                    )}
                  </button>
                  <Link
                    href={`/billing/${bill.id}`}
                    aria-label="View Details"
                    className="group relative inline-flex items-center justify-center w-7 h-7 shrink-0 text-xs font-bold text-[#35347A] bg-gradient-to-b from-[#F5F5FC] to-[#E9E9F8] hover:from-[#FAF9FE] hover:to-[#DFDFFA] border border-[#C6C5ED] border-b-2 border-b-[#7F7ECC] hover:border-[#6C6BBF] rounded-full shadow-[0_2px_4px_rgba(53,52,122,0.1),inset_0_1px_0_rgba(255,255,255,0.95)] hover:shadow-md active:translate-y-px transition-all duration-150"
                  >
                    <ActionTooltip label="View Bill" />
                    <FaEye className="w-3 h-3 text-[#35347A] transition-transform group-hover:scale-110 shrink-0" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => onDownloadBill(bill.id)}
                    disabled={bill.status === "voided"}
                    aria-label="Download Bill"
                    className="group relative inline-flex items-center justify-center w-7 h-7 shrink-0 text-xs font-bold text-[#16507A] bg-gradient-to-b from-[#F2F8FC] to-[#E2F0F9] hover:from-[#F7FBFE] hover:to-[#D5E9F5] border border-[#AED5EE] border-b-2 border-b-[#4E97C7] hover:border-[#3884B5] rounded-full shadow-[0_2px_4px_rgba(22,80,122,0.1),inset_0_1px_0_rgba(255,255,255,0.95)] hover:shadow-md active:translate-y-px transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ActionTooltip label="Download PDF" align="right" />
                    <FaDownload className="w-2.5 h-2.5 text-[#16507A] transition-transform group-hover:scale-110 shrink-0" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {bills.length === 0 && !loading && (
            <tr>
              <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                No transactions found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
