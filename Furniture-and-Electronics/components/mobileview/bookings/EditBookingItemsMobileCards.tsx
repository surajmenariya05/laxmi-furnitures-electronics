"use client";

import React from "react";
import { FaBolt, FaCouch, FaLock, FaTrash } from "react-icons/fa";

export interface EditBookingMobileItem {
  id?: number;
  productId: number;
  name: string;
  brand: string | null;
  department: "FURNITURE" | "ELECTRONICS";
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  isLocked: boolean;
}

interface EditBookingItemsMobileCardsProps {
  items: EditBookingMobileItem[];
  onUpdateItem: (
    index: number,
    patch: Partial<{ unitPrice: number; quantity: number }>
  ) => void;
  onRemoveItem: (index: number) => void;
}

export default function EditBookingItemsMobileCards({
  items,
  onUpdateItem,
  onRemoveItem,
}: EditBookingItemsMobileCardsProps) {
  return (
    <div className="md:hidden space-y-2.5">
      {items.map((item, idx) => (
        <div
          key={`${item.id ?? "new"}-${item.productId}-${idx}`}
          className={`rounded-xl border p-3.5 shadow-2xs space-y-3 ${
            item.isLocked
              ? "bg-slate-50/70 border-slate-200"
              : "bg-white border-gray-200"
          }`}
        >
          {/* Top Row: Item Name, Badges, Remove */}
          <div className="flex items-start justify-between gap-2.5">
            <div className="min-w-0 flex-1 space-y-1.5">
              <div>
                <p className="text-sm font-bold text-gray-900 leading-snug break-words">
                  {item.name}
                </p>
                {item.brand && (
                  <p className="text-[11px] text-gray-500 mt-0.5">{item.brand}</p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                    item.department === "FURNITURE"
                      ? "bg-amber-50 text-amber-800 border-amber-200"
                      : "bg-blue-50 text-blue-800 border-blue-200"
                  }`}
                >
                  {item.department === "FURNITURE" ? (
                    <FaCouch className="w-2.5 h-2.5" />
                  ) : (
                    <FaBolt className="w-2.5 h-2.5" />
                  )}
                  <span>{item.department}</span>
                </span>

                {item.isLocked && (
                  <span
                    title="Delivered under Delivery Invoice. Locked."
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-black"
                  >
                    <FaLock className="w-2.5 h-2.5" />
                    <span>Delivered</span>
                  </span>
                )}
              </div>
            </div>

            <div className="shrink-0">
              {item.isLocked ? (
                <span className="text-[10px] text-gray-400 italic font-semibold">
                  Locked
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => onRemoveItem(idx)}
                  className="w-8 h-8 rounded-lg border border-red-200 bg-red-50/70 text-red-500 hover:text-red-700 hover:bg-red-100 flex items-center justify-center transition-colors"
                  title="Remove item"
                  aria-label={`Remove ${item.name}`}
                >
                  <FaTrash className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Bottom Strip: Unit Rate, Qty, Total */}
          <div className="bg-[#FAF8F5] border border-[#E5DFD7]/80 rounded-lg p-2.5 grid grid-cols-12 gap-2 items-end">
            <div className="col-span-5">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                Rate (₹)
              </label>
              {item.isLocked ? (
                <p className="font-mono font-bold text-xs text-gray-700 py-1.5">
                  ₹{item.unitPrice.toLocaleString("en-IN")}
                </p>
              ) : (
                <input
                  type="number"
                  min="0"
                  value={item.unitPrice}
                  onWheel={(e) => e.currentTarget.blur()}
                  onChange={(e) =>
                    onUpdateItem(idx, {
                      unitPrice: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full font-mono font-bold text-xs px-2 py-1.5 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              )}
            </div>

            <div className="col-span-3">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1 text-center">
                Qty
              </label>
              {item.isLocked ? (
                <p className="font-mono font-bold text-xs text-gray-700 text-center py-1.5">
                  {item.quantity}
                </p>
              ) : (
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onWheel={(e) => e.currentTarget.blur()}
                  onChange={(e) =>
                    onUpdateItem(idx, {
                      quantity: parseInt(e.target.value, 10) || 1,
                    })
                  }
                  className="w-full text-center font-mono font-bold text-xs px-1.5 py-1.5 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              )}
            </div>

            <div className="col-span-4 text-right">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                Total
              </p>
              <p className="font-mono font-black text-sm text-gray-900 py-1">
                ₹{item.lineTotal.toLocaleString("en-IN")}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
