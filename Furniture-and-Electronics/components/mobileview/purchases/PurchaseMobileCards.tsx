"use client";

import React from "react";
import {
  FaEye,
  FaTrash,
  FaCheckCircle,
  FaExclamationCircle,
} from "react-icons/fa";
import { Purchase } from "@/types/purchase";

interface PurchaseMobileCardsProps {
  purchases: Purchase[];
  onPayInstallment: (purchase: Purchase) => void;
  onViewDetails: (purchase: Purchase) => void;
  onDeletePurchase: (purchase: Purchase) => void;
  onReceiveStock?: (purchase: Purchase) => void;
  isOwner?: boolean;
}

export default function PurchaseMobileCards({
  purchases,
  onPayInstallment,
  onViewDetails,
  onDeletePurchase,
  onReceiveStock,
  isOwner,
}: PurchaseMobileCardsProps) {
  return (
    <div className="p-3 space-y-3 bg-[#F8F6F2]">
      {purchases.map((p) => {
        const formattedDate = new Date(p.purchaseDate).toLocaleDateString(
          "en-IN",
          {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }
        );
        const itemsText = p.items
          .map((i) => `${i.itemName} (${i.quantity})`)
          .join(", ");
        const isDue = Number(p.dueAmount) > 0;

        return (
          <div
            key={p.id}
            className="p-4 space-y-3 bg-white rounded-2xl border border-[#DED6CA] shadow-xs"
          >
            {/* 1. Header Row: Purchase # & Date on left, Dept + Paid/Unpaid Badge on right */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="font-mono font-extrabold text-blue-700 text-sm block">
                  {p.purchaseNumber}
                </span>
                <span className="text-[11px] text-gray-500">{formattedDate}</span>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap justify-end">
                <span
                  className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-extrabold tracking-wide uppercase ${
                    p.department === "ELECTRONICS"
                      ? "bg-[#093F52] text-white"
                      : "bg-[#235347] text-white"
                  }`}
                >
                  {p.department === "ELECTRONICS" ? "ELEC" : "FURN"}
                </span>

                {p.paymentStatus === "PAID" && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#EBFDE7] text-[#14532D] border border-[#81FF7A]/80">
                    <FaCheckCircle className="w-2.5 h-2.5 text-emerald-600" />
                    <span>PAID</span>
                  </span>
                )}
                {p.paymentStatus === "PARTIAL" && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#FEF9E7] text-[#854D0E] border border-[#FFCA3A]">
                    <FaExclamationCircle className="w-2.5 h-2.5 text-amber-600" />
                    <span>PARTIAL</span>
                  </span>
                )}
                {p.paymentStatus === "UNPAID" && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#FDF2F2] text-[#780000] border border-[#780000]/30">
                    <FaExclamationCircle className="w-2.5 h-2.5 text-red-600" />
                    <span>UNPAID</span>
                  </span>
                )}
              </div>
            </div>

            {/* 2. Customer / Vendor & Items Sub-Box */}
            <div className="bg-[#EEF4FA] border border-[#CBD8E8] rounded-xl p-3 space-y-1.5">
              <div className="flex items-baseline justify-between gap-2">
                <div className="text-base font-extrabold text-gray-900 truncate">
                  {p.vendor.name}
                </div>
                <div className="text-xs text-slate-700 font-mono font-semibold shrink-0">
                  <span className="font-sans text-[11px] font-bold text-slate-500 mr-1">
                    Mob:
                  </span>
                  {p.vendor.phone}
                </div>
              </div>
              {itemsText && (
                <div className="text-xs font-medium text-slate-700 border-t border-[#D6E1EE] pt-1.5 leading-snug break-words">
                  {itemsText}
                </div>
              )}
            </div>

            {/* 3. Total | Paid | Due Strip with Vertical Borders */}
            <div className="grid grid-cols-3 divide-x divide-[#E5DFD7] bg-[#FAF8F5] rounded-xl py-2.5 border border-[#E5DFD7] text-center">
              <div className="px-2">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Total
                </div>
                <div className="text-xs font-extrabold text-gray-900 tabular-nums mt-0.5">
                  ₹{Number(p.totalAmount).toLocaleString("en-IN")}
                </div>
              </div>
              <div className="px-2">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Paid
                </div>
                <div className="text-xs font-extrabold text-emerald-700 tabular-nums mt-0.5">
                  ₹{Number(p.paidAmount).toLocaleString("en-IN")}
                </div>
              </div>
              <div className="px-2">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Due
                </div>
                <div
                  className={`text-xs font-extrabold tabular-nums mt-0.5 ${
                    isDue ? "text-[#780000]" : "text-gray-400"
                  }`}
                >
                  ₹{Number(p.dueAmount).toLocaleString("en-IN")}
                </div>
              </div>
            </div>

            {/* 4. Full-Width Dynamic Action Row */}
            <div className="flex items-center gap-2 w-full pt-0.5">
              {!p.isStockAdded && onReceiveStock && (
                <button
                  type="button"
                  onClick={() => onReceiveStock(p)}
                  className="flex-1 inline-flex items-center justify-center gap-1 h-9 px-2.5 text-xs font-bold text-[#16507A] bg-gradient-to-b from-[#F2F8FC] to-[#E2F0F9] border border-[#AED5EE] border-b-2 border-b-[#4E97C7] rounded-full shadow-2xs active:translate-y-px whitespace-nowrap"
                >
                  <span>Stock In</span>
                </button>
              )}
              {isDue && (
                <button
                  type="button"
                  onClick={() => onPayInstallment(p)}
                  className="flex-1 inline-flex items-center justify-center gap-1 h-9 px-2.5 text-xs font-bold text-[#785428] bg-gradient-to-b from-[#FFFDF9] to-[#F5EFEB] border border-[#E2D4BE] border-b-2 border-b-[#C4A87C] rounded-full shadow-2xs active:translate-y-px whitespace-nowrap"
                >
                  <span>Pay Due</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => onViewDetails(p)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 px-3 text-xs font-bold text-[#35347A] bg-gradient-to-b from-[#F5F5FC] to-[#E9E9F8] border border-[#C6C5ED] border-b-2 border-b-[#7F7ECC] rounded-full shadow-2xs active:translate-y-px whitespace-nowrap"
              >
                <FaEye className="w-3 h-3 shrink-0" />
                <span>View</span>
              </button>
              {isOwner && (
                <button
                  type="button"
                  onClick={() => onDeletePurchase(p)}
                  className="shrink-0 inline-flex items-center justify-center h-9 w-9 text-[#882424] bg-gradient-to-b from-[#FDF5F5] to-[#F9E8E8] border border-[#E9C3C3] border-b-2 border-b-[#C06A6A] rounded-full shadow-2xs active:translate-y-px"
                  title="Delete purchase"
                >
                  <FaTrash className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
