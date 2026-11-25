"use client";

import React from "react";
import { FaEye, FaTrash, FaCheckCircle, FaExclamationCircle } from "react-icons/fa";
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
    <div className="divide-y divide-gray-100">
      {purchases.map((p) => {
        const formattedDate = new Date(p.purchaseDate).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
        const itemsCount = p.items.length;
        const itemsPreview =
          p.items
            .map((i) => `${i.itemName} (${i.quantity})`)
            .slice(0, 2)
            .join(", ") + (itemsCount > 2 ? ` +${itemsCount - 2} more` : "");
        const isDue = Number(p.dueAmount) > 0;

        return (
          <div key={p.id} className="p-4 space-y-3 bg-white">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="font-mono font-bold text-blue-700 text-sm block">
                  {p.purchaseNumber}
                </span>
                <span className="text-[11px] text-gray-500">{formattedDate}</span>
              </div>
              <span
                className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-extrabold tracking-wide uppercase ${
                  p.department === "ELECTRONICS"
                    ? "bg-[#093F52] text-white"
                    : "bg-[#235347] text-white"
                }`}
              >
                {p.department === "ELECTRONICS" ? "ELEC" : "FURN"}
              </span>
            </div>

            <div>
              <div className="font-bold text-gray-900 text-sm">{p.vendor.name}</div>
              <div className="text-[11px] text-gray-500 font-mono">{p.vendor.phone}</div>
              <div className="text-xs text-gray-600 mt-1 line-clamp-1">{itemsPreview}</div>
            </div>

            <div className="grid grid-cols-3 gap-2 bg-gray-50 rounded-xl p-2.5 border border-gray-100 text-center">
              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase">Total</div>
                <div className="text-xs font-extrabold text-gray-900">
                  ₹{Number(p.totalAmount).toLocaleString("en-IN")}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase">Paid</div>
                <div className="text-xs font-extrabold text-emerald-700">
                  ₹{Number(p.paidAmount).toLocaleString("en-IN")}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase">Due</div>
                <div
                  className={`text-xs font-extrabold ${
                    isDue ? "text-[#780000]" : "text-gray-400"
                  }`}
                >
                  ₹{Number(p.dueAmount).toLocaleString("en-IN")}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div>
                {p.paymentStatus === "PAID" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#EBFDE7] text-[#14532D] border border-[#81FF7A]/80">
                    <FaCheckCircle className="w-2.5 h-2.5 text-emerald-600" /> PAID
                  </span>
                )}
                {p.paymentStatus === "PARTIAL" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#FEF9E7] text-[#854D0E] border border-[#FFCA3A]">
                    <FaExclamationCircle className="w-2.5 h-2.5 text-amber-600" /> PARTIAL
                  </span>
                )}
                {p.paymentStatus === "UNPAID" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#FDF2F2] text-[#780000] border border-[#780000]/30">
                    <FaExclamationCircle className="w-2.5 h-2.5 text-red-600" /> UNPAID
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 ml-auto">
                {!p.isStockAdded && onReceiveStock && (
                  <button
                    type="button"
                    onClick={() => onReceiveStock(p)}
                    className="inline-flex items-center gap-1 h-8 px-2.5 text-[11px] font-bold text-[#16507A] bg-gradient-to-b from-[#F2F8FC] to-[#E2F0F9] border border-[#AED5EE] border-b-2 border-b-[#4E97C7] rounded-full shadow-2xs active:translate-y-px"
                  >
                    <span>Stock In</span>
                  </button>
                )}
                {isDue && (
                  <button
                    type="button"
                    onClick={() => onPayInstallment(p)}
                    className="inline-flex items-center gap-1 h-8 px-2.5 text-[11px] font-bold text-[#785428] bg-gradient-to-b from-[#FFFDF9] to-[#F5EFEB] border border-[#E2D4BE] border-b-2 border-b-[#C4A87C] rounded-full shadow-2xs active:translate-y-px"
                  >
                    <span>Pay Due</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onViewDetails(p)}
                  className="inline-flex items-center gap-1 h-8 px-2.5 text-[11px] font-bold text-[#35347A] bg-gradient-to-b from-[#F5F5FC] to-[#E9E9F8] border border-[#C6C5ED] border-b-2 border-b-[#7F7ECC] rounded-full shadow-2xs active:translate-y-px"
                >
                  <FaEye className="w-3 h-3" />
                  <span>View</span>
                </button>
                {isOwner && (
                  <button
                    type="button"
                    onClick={() => onDeletePurchase(p)}
                    className="inline-flex items-center justify-center h-8 w-8 text-[#882424] bg-gradient-to-b from-[#FDF5F5] to-[#F9E8E8] border border-[#E9C3C3] border-b-2 border-b-[#C06A6A] rounded-full shadow-2xs active:translate-y-px"
                  >
                    <FaTrash className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
