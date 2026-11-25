"use client";

import React from "react";
import { FaMapMarkerAlt, FaTrash } from "react-icons/fa";
import { Vendor } from "@/types/purchase";

interface VendorMobileCardsProps {
  vendors: Vendor[];
  isOwner: boolean;
  deletingId: number | null;
  onDelete: (vendor: Vendor) => void;
}

export default function VendorMobileCards({
  vendors,
  isOwner,
  deletingId,
  onDelete,
}: VendorMobileCardsProps) {
  return (
    <div className="md:hidden space-y-2.5 bg-[#F8F6F2] p-2.5 rounded-xl border border-[#E5DFD7]">
      {vendors.map((v) => {
        const due = v.totalDue || 0;
        const billsCount = v._count?.purchases || 0;

        return (
          <div
            key={v.id}
            className="bg-white rounded-xl border border-[#DED6CA] p-3.5 shadow-2xs space-y-2.5"
          >
            {/* Top Row: Vendor Name (left) & Mob (right) */}
            <div className="space-y-1.5">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-sm font-extrabold text-gray-900 leading-snug break-words min-w-0">
                  {v.name}
                </p>
                <p className="text-xs font-mono font-bold text-gray-800 shrink-0">
                  <span className="font-sans text-[10px] font-bold text-gray-400 mr-1">
                    Mob:
                  </span>
                  {v.phone}
                </p>
              </div>

              {/* Second Row: Location + Bill Count (left) & Delete Button (right) */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center flex-wrap gap-2 min-w-0">
                  {v.address && (
                    <p className="text-[11px] text-gray-500 flex items-center gap-1 min-w-0">
                      <FaMapMarkerAlt className="w-2.5 h-2.5 text-gray-400 shrink-0" />
                      <span className="truncate">{v.address}</span>
                    </p>
                  )}
                  <span className="inline-block text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full whitespace-nowrap">
                    {billsCount} {billsCount === 1 ? "bill" : "bills"}
                  </span>
                  {v.gstin && (
                    <p className="text-[10px] text-gray-400 font-mono">
                      GST: {v.gstin}
                    </p>
                  )}
                </div>

                {isOwner && (
                  <button
                    type="button"
                    onClick={() => onDelete(v)}
                    disabled={deletingId === v.id || due > 0}
                    className={`shrink-0 p-2 rounded-lg border transition ${
                      due > 0
                        ? "border-gray-200 text-gray-300 cursor-not-allowed bg-gray-50"
                        : "border-red-200 text-red-500 hover:text-red-700 hover:bg-red-50 bg-red-50/40"
                    }`}
                    title={
                      due > 0
                        ? "Cannot delete vendor with outstanding balance"
                        : "Delete vendor"
                    }
                  >
                    <FaTrash className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Bottom 3-Column Strip: Purchased | Paid | Due */}
            <div className="grid grid-cols-3 divide-x divide-[#E5DFD7] bg-[#FAF8F5] border border-[#E5DFD7] rounded-lg py-2 text-center">
              <div className="px-1.5">
                <p className="text-[9.5px] font-bold uppercase tracking-wider text-gray-400">
                  Purchased
                </p>
                <p className="text-xs font-extrabold text-gray-900 tabular-nums mt-0.5">
                  ₹{(v.totalPurchased || 0).toLocaleString("en-IN")}
                </p>
              </div>
              <div className="px-1.5">
                <p className="text-[9.5px] font-bold uppercase tracking-wider text-gray-400">
                  Paid
                </p>
                <p className="text-xs font-extrabold text-emerald-700 tabular-nums mt-0.5">
                  ₹{(v.totalPaid || 0).toLocaleString("en-IN")}
                </p>
              </div>
              <div className="px-1.5">
                <p className="text-[9.5px] font-bold uppercase tracking-wider text-gray-400">
                  Due
                </p>
                <p
                  className={`text-xs font-black tabular-nums mt-0.5 ${
                    due > 0 ? "text-red-600" : "text-gray-400"
                  }`}
                >
                  ₹{due.toLocaleString("en-IN")}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
