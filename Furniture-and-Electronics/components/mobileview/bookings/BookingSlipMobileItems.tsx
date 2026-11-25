"use client";

import React from "react";
import { BookingItemResponse } from "@/types/booking";

interface BookingSlipMobileItemsProps {
  items: BookingItemResponse[];
}

export default function BookingSlipMobileItems({
  items,
}: BookingSlipMobileItemsProps) {
  return (
    <div className="sm:hidden print:hidden bg-[#EEF3F8] border border-[#CBD8E8] rounded-xl p-2.5 space-y-2.5">
      {items.map((item, idx) => (
        <div
          key={item.id ?? idx}
          className="rounded-xl border border-slate-300/90 bg-white p-3 space-y-2 shadow-xs"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-gray-900 leading-snug break-words">
                {item.product.name}
              </p>
              {item.customisations && (
                <p className="text-[10.5px] text-gray-500 italic mt-0.5 whitespace-pre-line leading-tight">
                  {item.customisations}
                </p>
              )}
            </div>

            <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200">
              {item.department === "ELECTRONICS" ? "ELEC" : "FURN"}
            </span>
          </div>

          <div className="bg-gray-50 border border-gray-200/70 rounded-lg px-2.5 py-1.5 flex items-center justify-between text-xs">
            <span className="text-gray-600 font-medium tabular-nums">
              Qty: <strong className="text-gray-900">{item.quantity}</strong> × ₹
              {Number(item.unitPrice).toLocaleString("en-IN")}
            </span>
            <span className="font-mono font-black text-gray-900 tabular-nums">
              ₹{Number(item.lineTotal).toLocaleString("en-IN")}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
