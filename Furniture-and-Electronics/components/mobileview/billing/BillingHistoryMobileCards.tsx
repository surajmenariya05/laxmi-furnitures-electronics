"use client";

import React from "react";
import Link from "next/link";
import { FaPen, FaWhatsapp, FaEye, FaDownload } from "react-icons/fa";

export interface BillingHistoryItem {
  id: number;
  billNumber: string;
  createdAt: string;
  department: string;
  totalAmount: number | string;
  paymentMode: string;
  paymentStatus: string;
  dueAmount?: number | string;
  status: string;
  whatsappStatus?: string;
  whatsappSentAt?: string;
  customerName?: string;
  customerPhone?: string;
  customer?: {
    id: number;
    name: string;
    phone?: string;
    address?: string;
  };
  booking?: {
    id: number;
    bookingNumber: string;
  };
}

interface BillingHistoryMobileCardsProps {
  bills: BillingHistoryItem[];
  loading: boolean;
  role?: string | null;
  sendingWhatsappId: number | null;
  onEdit: (bill: BillingHistoryItem) => void;
  onSendWhatsapp: (bill: BillingHistoryItem) => void;
  onDownloadBill: (billId: number) => void;
}

export default function BillingHistoryMobileCards({
  bills,
  loading,
  role,
  sendingWhatsappId,
  onEdit,
  onSendWhatsapp,
  onDownloadBill,
}: BillingHistoryMobileCardsProps) {
  return (
    <div className="space-y-3">
      {bills.map((bill) => (
        <div
          key={bill.id}
          className="rounded-2xl border border-[#E5DFD7] bg-[#FAF7F2]/60 p-4 shadow-xs space-y-3"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`px-2 py-0.5 inline-flex text-[10.5px] font-bold rounded-full items-center gap-1 ${
                  bill.department === "ELECTRONICS"
                    ? "bg-[#093F52] text-white"
                    : "bg-[#235347] text-white"
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
              <span className="text-xs text-gray-500 font-mono">
                {new Date(bill.createdAt).toLocaleDateString("en-IN")}
              </span>
            </div>
            <div className="text-right">
              <div className="text-sm font-extrabold text-gray-900">
                #{bill.billNumber}
              </div>
              {bill.booking && (
                <Link
                  href="/bookings/history"
                  className="inline-flex items-center gap-1 text-[10px] font-extrabold text-blue-800 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 mt-0.5"
                >
                  WB: {bill.booking.bookingNumber}
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-b border-gray-200/70 py-2.5">
            <div className="min-w-0">
              <div className="text-sm font-bold text-gray-900 truncate">
                {bill.customer?.name || "Guest"}
              </div>
              {bill.customer?.phone && (
                <div className="text-xs text-gray-500 font-mono">
                  {bill.customer.phone}
                </div>
              )}
            </div>
            <div className="text-right shrink-0">
              <div className="text-base font-black text-gray-900">
                ₹{bill.totalAmount}
              </div>
              <div className="text-[11px] capitalize font-semibold">
                <span className="text-gray-500">{bill.paymentMode} · </span>
                {bill.paymentStatus === "PARTIAL" ? (
                  <span className="text-[#780000] font-bold">
                    Due ₹{Number(bill.dueAmount).toLocaleString("en-IN")}
                  </span>
                ) : (
                  <span className="text-[#15803D] font-bold">Paid</span>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2.5">
            {/* Status Row: Bill Status on Left, WhatsApp Status on Right */}
            <div className="flex items-center justify-between gap-2">
              <span
                className={`px-2.5 py-0.5 text-[10px] font-extrabold uppercase rounded-full ${
                  bill.status === "voided"
                    ? "bg-[#FDF2F2] text-[#780000] border border-[#780000]/30"
                    : "bg-[#EBFDE7] text-[#14532D] border border-[#81FF7A]/80"
                }`}
              >
                {bill.status}
              </span>
              {bill.whatsappStatus ? (
                <span
                  className={`px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-full ${
                    bill.whatsappStatus === "sent"
                      ? "bg-[#EBFDE7] text-[#14532D] border border-[#81FF7A]/80"
                      : bill.whatsappStatus === "failed"
                      ? "bg-[#FDF2F2] text-[#780000] border border-[#780000]/30"
                      : "bg-[#FEF9E7] text-[#854D0E] border border-[#FFCA3A]"
                  }`}
                >
                  WA: {bill.whatsappStatus}
                </span>
              ) : (
                <span className="text-[11px] text-gray-400 font-medium">WA: -</span>
              )}
            </div>

            {/* Dedicated Action Buttons Row */}
            <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-gray-200/70">
              {role === "owner" && bill.status !== "voided" && bill.customer && (
                <button
                  type="button"
                  onClick={() => onEdit(bill)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 h-8 px-2.5 text-[11px] font-bold text-[#785428] bg-gradient-to-b from-[#FFFDF9] to-[#F5EFEB] border border-[#E2D4BE] border-b-2 border-b-[#C4A87C] rounded-full shadow-2xs active:translate-y-px"
                >
                  <FaPen className="w-2.5 h-2.5" />
                  <span>Edit</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => onSendWhatsapp(bill)}
                disabled={sendingWhatsappId === bill.id || bill.status === "voided"}
                className="flex-1 inline-flex items-center justify-center gap-1.5 h-8 px-2.5 text-[11px] font-bold text-[#136338] bg-gradient-to-b from-[#F2FBF6] to-[#E4F5EB] border border-[#A8E2BF] border-b-2 border-b-[#4BAE74] rounded-full shadow-2xs active:translate-y-px disabled:opacity-50"
              >
                {sendingWhatsappId === bill.id ? (
                  <div className="w-3 h-3 border-2 border-[#136338] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <FaWhatsapp className="w-3.5 h-3.5" />
                )}
                <span>WA</span>
              </button>
              <Link
                href={`/billing/${bill.id}`}
                className="flex-1 inline-flex items-center justify-center gap-1.5 h-8 px-2.5 text-[11px] font-bold text-[#35347A] bg-gradient-to-b from-[#F5F5FC] to-[#E9E9F8] border border-[#C6C5ED] border-b-2 border-b-[#7F7ECC] rounded-full shadow-2xs active:translate-y-px"
              >
                <FaEye className="w-3 h-3" />
                <span>View</span>
              </Link>
              <button
                type="button"
                onClick={() => onDownloadBill(bill.id)}
                disabled={bill.status === "voided"}
                className="inline-flex items-center justify-center gap-1 h-8 px-3 text-[11px] font-bold text-[#16507A] bg-gradient-to-b from-[#F2F8FC] to-[#E2F0F9] border border-[#AED5EE] border-b-2 border-b-[#4E97C7] rounded-full shadow-2xs active:translate-y-px disabled:opacity-50"
                title="Download Bill"
              >
                <FaDownload className="w-2.5 h-2.5" />
              </button>
            </div>
          </div>
        </div>
      ))}
      {bills.length === 0 && !loading && (
        <div className="py-8 text-center text-gray-500 text-sm">
          No transactions found.
        </div>
      )}
    </div>
  );
}
