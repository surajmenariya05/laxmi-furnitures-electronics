"use client";

import React from "react";
import {
  FaTrash,
  FaCouch,
  FaTv,
  FaShieldAlt,
  FaSlidersH,
  FaCheck,
  FaTag,
} from "react-icons/fa";
import type { PackageItem } from "@/components/dashboard/bookings/new/PackageItemsTable";

interface PackageItemsMobileCardsProps {
  items: PackageItem[];
  activeConfigIndex: number | null;
  setActiveConfigIndex: (idx: number | null) => void;
  onUpdateQuantity: (index: number, newQty: number) => void;
  onUpdateItemConfig: (
    index: number,
    config: { customPrice?: number; customisations?: string }
  ) => void;
  onRemoveItem: (index: number) => void;
}

export default function PackageItemsMobileCards({
  items,
  activeConfigIndex,
  setActiveConfigIndex,
  onUpdateQuantity,
  onUpdateItemConfig,
  onRemoveItem,
}: PackageItemsMobileCardsProps) {
  return (
    <div className="divide-y divide-gray-200">
      {items.map((item, index) => {
        const effectivePrice =
          item.customPrice !== undefined && item.customPrice > 0
            ? item.customPrice
            : item.sellingPrice;
        const lineTotal = effectivePrice * item.quantity;
        const isFurniture = item.department === "FURNITURE";
        const isConfigOpen = activeConfigIndex === index;
        const hasCustomPrice = item.customPrice !== undefined && item.customPrice > 0;
        const hasCustomisations = Boolean(item.customisations?.trim());
        const isDiscounted = hasCustomPrice && item.customPrice! < item.sellingPrice;
        const discountPercent = isDiscounted
          ? (((item.sellingPrice - item.customPrice!) / item.sellingPrice) * 100).toFixed(2)
          : null;

        return (
          <div key={`m-${item.productId}-${index}`} className="p-4 space-y-3 bg-white">
            {/* Top Row: Dept + Name + Config/Remove */}
            <div className="flex items-start justify-between gap-2.5">
              <div className="flex items-start gap-2.5 min-w-0">
                <span
                  className={`p-1.5 rounded-md text-xs shrink-0 mt-0.5 ${
                    isFurniture
                      ? "bg-[#235347] text-white"
                      : "bg-[#093F52] text-white"
                  }`}
                >
                  {isFurniture ? (
                    <FaCouch className="w-3 h-3" />
                  ) : (
                    <FaTv className="w-3 h-3" />
                  )}
                </span>
                <div className="min-w-0">
                  <div className="font-bold text-gray-900 text-sm leading-snug">
                    {item.name}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    {item.brand && (
                      <span className="text-[11px] text-gray-500">
                        Brand: {item.brand}
                      </span>
                    )}
                    {item.warrantyMonths ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                        <FaShieldAlt className="w-2.5 h-2.5" />
                        {item.warrantyMonths}M
                      </span>
                    ) : (
                      <span className="text-[10px] text-gray-400">
                        Standard Warranty
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveConfigIndex(isConfigOpen ? null : index)}
                  className={`inline-flex items-center gap-1 h-7 px-2.5 rounded-full text-[11px] font-bold border transition ${
                    isConfigOpen
                      ? "bg-blue-600 text-white border-blue-700"
                      : hasCustomPrice || hasCustomisations
                      ? "bg-blue-50 text-blue-700 border-blue-200"
                      : "bg-gray-50 text-gray-600 border-gray-200"
                  }`}
                >
                  <FaSlidersH className="w-3 h-3" />
                  <span>Config</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (activeConfigIndex === index) setActiveConfigIndex(null);
                    onRemoveItem(index);
                  }}
                  className="inline-flex items-center justify-center h-7 w-7 rounded-full text-rose-600 bg-rose-50 border border-rose-200"
                  title="Remove from package"
                >
                  <FaTrash className="w-3 h-3" />
                </button>
              </div>
            </div>

            {hasCustomisations && (
              <p className="text-xs text-gray-500 italic whitespace-pre-line bg-gray-50 px-2.5 py-1.5 rounded-lg border border-gray-100">
                {item.customisations}
              </p>
            )}

            {/* Middle Row: Unit Rate | Qty Stepper | Line Total */}
            <div className="flex items-center justify-between gap-2 bg-[#FAF7F2] rounded-xl px-3 py-2 border border-[#E5DFD7]">
              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase">Rate</div>
                <div className="text-xs font-bold text-gray-800">
                  ₹{effectivePrice.toLocaleString("en-IN")}
                  {isDiscounted && (
                    <span className="ml-1 text-[10px] text-emerald-700 font-extrabold">
                      ({discountPercent}% OFF)
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => onUpdateQuantity(index, Math.max(1, item.quantity - 1))}
                  className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold flex items-center justify-center text-xs"
                >
                  -
                </button>
                <span className="w-7 text-center font-bold text-xs text-gray-900">
                  {item.quantity}
                </span>
                <button
                  type="button"
                  onClick={() => onUpdateQuantity(index, item.quantity + 1)}
                  className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold flex items-center justify-center text-xs"
                >
                  +
                </button>
              </div>

              <div className="text-right">
                <div className="text-[10px] font-bold text-gray-400 uppercase">Total</div>
                <div className="text-sm font-black text-gray-900">
                  ₹{lineTotal.toLocaleString("en-IN")}
                </div>
              </div>
            </div>

            {/* Mobile Configure Price & Customisations Panel */}
            {isConfigOpen && (
              <div className="bg-blue-50/50 rounded-xl border border-blue-200 p-3.5 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-blue-100">
                  <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                    <FaTag className="text-blue-600 w-3 h-3" />
                    <span className="truncate">Customise Price &amp; Specs</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveConfigIndex(null)}
                    className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 shrink-0"
                  >
                    <FaCheck className="w-2.5 h-2.5" />
                    <span>Done</span>
                  </button>
                </div>

                <div>
                  <div className="flex justify-between items-baseline mb-1">
                    <label className="text-xs font-bold text-gray-700">
                      Customised Price (₹)
                    </label>
                    <span className="text-[10px] text-gray-500">
                      MRP: ₹{item.sellingPrice.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">
                      ₹
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder={`Standard rate (${item.sellingPrice})`}
                      value={item.customPrice !== undefined ? item.customPrice : ""}
                      onWheel={(e) => e.currentTarget.blur()}
                      onChange={(e) => {
                        const val = e.target.value.trim();
                        onUpdateItemConfig(index, {
                          customPrice: val === "" ? undefined : parseFloat(val) || 0,
                        });
                      }}
                      className="w-full pl-7 pr-3 py-2 bg-white border border-gray-300 rounded-lg text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Specifications &amp; Customisations
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. 3 door with dressing, 3 drawer, size, polish..."
                    value={item.customisations || ""}
                    onChange={(e) =>
                      onUpdateItemConfig(index, {
                        customisations: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
