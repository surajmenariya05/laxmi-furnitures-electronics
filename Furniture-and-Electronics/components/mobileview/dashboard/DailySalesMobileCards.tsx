"use client";

import React from "react";
import Link from "next/link";

export interface DailySaleMobileItem {
  id: number;
  billId: number;
  billNumber: string;
  productName: string;
  department: string;
  categoryName?: string | null;
  imeiNumber?: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  netProfit?: number | null;
}

interface DailySalesMobileCardsProps {
  items: DailySaleMobileItem[];
}

export default function DailySalesMobileCards({ items }: DailySalesMobileCardsProps) {
  return (
    <div className="md:hidden divide-y divide-gray-100 p-3 space-y-2.5 bg-[#F8F6F2]">
      {items.map((item) => {
        const isFurn = item.department === "FURNITURE";
        return (
          <div
            key={item.id}
            className="bg-white rounded-xl border border-gray-200/90 p-3.5 shadow-2xs space-y-2.5"
          >
            {/* Top Row: Product Name on left, Bill No on right */}
            <div className="flex items-start justify-between gap-2">
              <p className="min-w-0 flex-1 text-sm font-bold text-gray-900 leading-snug break-words">
                {item.productName}
              </p>

              <Link
                href={`/billing/${item.billId}`}
                className="shrink-0 text-[11px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-md border border-blue-100 whitespace-nowrap transition-colors"
                title="View Bill Details"
              >
                #{item.billNumber}
              </Link>
            </div>

            {/* Meta Row: Dept (left) · Category (middle) · S/N (right) */}
            <div className="flex items-center gap-1.5 min-w-0">
              <span
                className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  isFurn
                    ? "bg-[#235347] text-white border border-[#2F6859]"
                    : "bg-[#093F52] text-white border border-[#105269]"
                }`}
              >
                {isFurn ? "🛋️ Furn" : "⚡ Elec"}
              </span>

              {item.categoryName && (
                <span className="min-w-0 truncate text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                  {item.categoryName}
                </span>
              )}

              {item.imeiNumber && (
                <span className="ml-auto shrink-0 inline-flex items-center gap-1 text-[10px] font-mono font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded border border-gray-200 max-w-[110px] truncate">
                  <span className="text-gray-400 font-sans font-bold">S/N:</span>
                  <span className="truncate">{item.imeiNumber}</span>
                </span>
              )}
            </div>

            {/* Bottom Strip: Rate x Qty | Total | Net Profit */}
            <div className="bg-[#FAF8F5] border border-[#E5DFD7]/80 rounded-lg px-2.5 py-2 grid grid-cols-3 gap-2 items-center">
              <div>
                <p className="text-[9.5px] font-bold uppercase tracking-wider text-gray-400">
                  Rate × Qty
                </p>
                <p className="text-xs font-semibold text-gray-700 tabular-nums mt-0.5">
                  ₹{item.unitPrice.toLocaleString("en-IN")} × {item.quantity}
                </p>
              </div>

              <div className="text-center">
                <p className="text-[9.5px] font-bold uppercase tracking-wider text-gray-400">
                  Total
                </p>
                <p className="text-xs font-black text-gray-900 tabular-nums mt-0.5">
                  ₹{item.lineTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>

              <div className="text-right">
                <p className="text-[9.5px] font-bold uppercase tracking-wider text-gray-400">
                  Net Profit
                </p>
                {item.netProfit != null ? (
                  <p
                    className={`text-xs font-black tabular-nums mt-0.5 ${
                      item.netProfit > 0
                        ? "text-green-600"
                        : item.netProfit < 0
                        ? "text-red-500"
                        : "text-gray-500"
                    }`}
                  >
                    {item.netProfit > 0 ? "+" : ""}₹
                    {item.netProfit.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                ) : (
                  <p className="text-[11px] font-semibold text-gray-400 italic mt-0.5">
                    🔒 Hidden
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
