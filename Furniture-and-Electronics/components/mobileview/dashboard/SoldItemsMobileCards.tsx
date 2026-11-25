"use client";

import React from "react";

interface SoldItemsMobileCardsProps {
  items: any[];
  lastElementRef: (node: HTMLElement | null) => void;
}

export default function SoldItemsMobileCards({
  items,
  lastElementRef,
}: SoldItemsMobileCardsProps) {
  if (items.length === 0) return null;

  return (
    <div className="md:hidden space-y-2.5">
      {items.map((item, index) => {
        const isLast = items.length === index + 1;
        const date = new Date(item.bill.createdAt).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });

        const isAccessory = item.product?.productType === "accessory";
        const identifier = isAccessory ? "NA" : item.productUnit?.imeiNumber || "NA";
        const billNo = item.bill?.billNumber || "N/A";
        const customerName = item.bill?.customer?.name;
        const status = item.bill?.paymentStatus || "UNKNOWN";

        return (
          <div
            key={item.id}
            ref={isLast ? lastElementRef : null}
            className="bg-white rounded-xl border border-gray-200 p-3.5 shadow-2xs space-y-2.5"
          >
            {/* Top Row: Brand & Product on left, Payment Status on right */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                  {item.product?.brand || "Brand"}
                </p>
                <p className="text-sm font-bold text-gray-900 leading-snug break-words mt-0.5">
                  {item.product?.name || "Product"}
                </p>
              </div>

              <span
                className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  status === "PAID"
                    ? "bg-green-100 text-green-700"
                    : status === "DUE"
                    ? "bg-red-100 text-red-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {status}
              </span>
            </div>

            {/* Meta Row: Bill No, Customer, Date */}
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="font-mono font-bold text-gray-800">#{billNo}</span>
                {customerName && (
                  <span className="text-blue-700 font-medium truncate max-w-[140px]">
                    · {customerName}
                  </span>
                )}
              </div>
              <span className="text-[11px] text-gray-500 whitespace-nowrap">{date}</span>
            </div>

            {/* Bottom Strip: Serial No & Amount */}
            <div className="bg-[#FAF8F5] border border-[#E5DFD7]/80 rounded-lg px-2.5 py-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  S/N:
                </span>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium truncate ${
                    identifier === "NA"
                      ? "bg-gray-100 text-gray-500"
                      : "bg-blue-50 text-blue-700 border border-blue-100"
                  }`}
                >
                  {identifier}
                </span>
              </div>

              <span className="font-mono font-black text-sm text-gray-900 tabular-nums shrink-0">
                ₹{parseFloat(item.lineTotal).toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
