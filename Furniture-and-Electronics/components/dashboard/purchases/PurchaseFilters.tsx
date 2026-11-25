"use client";

import React, { useState } from "react";
import {
  FaSearch,
  FaTimes,
  FaUsers,
  FaPlus,
  FaChevronDown,
} from "react-icons/fa";
import { Vendor } from "@/types/purchase";
import TactileButton from "@/components/ui/TactileButton";

interface PurchaseFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: string; // "ALL" | "PENDING_DUE" | "PAID"
  onStatusFilterChange: (status: string) => void;
  selectedVendorId: string;
  onVendorChange: (vendorId: string) => void;
  vendors: Vendor[];
  onOpenNewPurchase: () => void;
  onOpenVendorManager: () => void;
}

export default function PurchaseFilters({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  selectedVendorId,
  onVendorChange,
  vendors,
  onOpenNewPurchase,
  onOpenVendorManager,
}: PurchaseFiltersProps) {
  const [vendorDropdownOpen, setVendorDropdownOpen] = useState(false);

  const selectedVendor = vendors.find(
    (v) => String(v.id) === String(selectedVendorId)
  );

  return (
    <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-gray-200 shadow-xs space-y-3">
      {/* Top Row: Search Input + Vendor Dropdown + Actions */}
      <div className="flex flex-col md:flex-row gap-2.5 sm:gap-3 items-stretch md:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by vendor, phone, item name, purchase #..."
            className="w-full pl-10 pr-9 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
          />
          {search && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
              title="Clear search"
            >
              <FaTimes className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Vendor Selector (left) + Vendors Button (right) */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 min-w-0 md:w-64">
            <button
              type="button"
              onClick={() => setVendorDropdownOpen((prev) => !prev)}
              className="w-full flex items-center justify-between gap-2 py-2 px-3 border border-gray-300 rounded-lg text-xs sm:text-sm text-gray-800 font-medium bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-left"
            >
              <span className="truncate">
                {selectedVendor
                  ? `${selectedVendor.name} (${selectedVendor.phone})`
                  : "🏢 All Vendors / Suppliers"}
              </span>
              <FaChevronDown
                className={`w-3 h-3 text-gray-400 shrink-0 transition-transform ${
                  vendorDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {vendorDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setVendorDropdownOpen(false)}
                />
                <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-white border border-gray-200 rounded-xl shadow-lg max-h-56 overflow-y-auto py-1">
                  <button
                    type="button"
                    onClick={() => {
                      onVendorChange("ALL");
                      setVendorDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs sm:text-sm hover:bg-blue-50 transition-colors ${
                      selectedVendorId === "ALL"
                        ? "bg-blue-50 font-bold text-blue-700"
                        : "text-gray-800 font-medium"
                    }`}
                  >
                    🏢 All Vendors / Suppliers
                  </button>
                  {vendors.map((v) => {
                    const isSelected = String(v.id) === String(selectedVendorId);
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => {
                          onVendorChange(String(v.id));
                          setVendorDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs sm:text-sm hover:bg-blue-50 transition-colors truncate ${
                          isSelected
                            ? "bg-blue-50 font-bold text-blue-700"
                            : "text-gray-800 font-medium"
                        }`}
                      >
                        {v.name} ({v.phone})
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={onOpenVendorManager}
            className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 text-xs font-bold rounded-lg border border-gray-300 transition whitespace-nowrap"
            title="Manage supplier list"
          >
            <FaUsers className="w-3.5 h-3.5 text-gray-600" />
            <span>Vendors ({vendors.length})</span>
          </button>
        </div>

        {/* New Purchase (Full width on mobile) */}
        <TactileButton
          onClick={onOpenNewPurchase}
          variant="purchase"
          size="sm"
          icon={<FaPlus className="w-3 h-3" />}
          className="w-full md:w-auto justify-center py-2.5 md:py-1.5"
        >
          New Purchase
        </TactileButton>
      </div>

      {/* Bottom Row: Single-Line Status Filter Pills */}
      <div className="grid grid-cols-3 gap-1.5 md:flex md:items-center md:gap-2 pt-2 border-t border-gray-100">
        {/* 1. All */}
        <button
          type="button"
          onClick={() => onStatusFilterChange("ALL")}
          className={`px-2.5 sm:px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border whitespace-nowrap text-center ${
            statusFilter === "ALL"
              ? "bg-[#F1F5F9] text-[#334155] border border-[#94A3B8] border-b-[#64748B] shadow-[0_2px_4px_rgba(71,85,105,0.14),inset_0_1px_0_rgba(255,255,255,0.9)] brightness-95"
              : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
          }`}
        >
          <span className="inline-block w-2 h-2 rounded-full mr-1.5 bg-blue-400"></span>
          All
        </button>

        {/* 2. Pending */}
        <button
          type="button"
          onClick={() => onStatusFilterChange("PENDING_DUE")}
          className={`px-2.5 sm:px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border whitespace-nowrap text-center ${
            statusFilter === "PENDING_DUE"
              ? "bg-[#FEF9E7] text-[#854D0E] border border-[#FFCA3A] border-b-[#E5B020] shadow-[0_2px_4px_rgba(180,83,9,0.14),inset_0_1px_0_rgba(255,255,255,0.9)]"
              : "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
          }`}
        >
          <span className="inline-block w-2 h-2 rounded-full mr-1.5 bg-amber-400 animate-pulse"></span>
          Pending
        </button>

        {/* 3. Paid */}
        <button
          type="button"
          onClick={() => onStatusFilterChange("PAID")}
          className={`px-2.5 sm:px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border whitespace-nowrap text-center ${
            statusFilter === "PAID"
              ? "bg-[#EBFDE7] text-[#14532D] border border-[#81FF7A]/80 border-b-[#4ADE80] shadow-[0_2px_4px_rgba(20,83,45,0.12),inset_0_1px_0_rgba(255,255,255,0.9)]"
              : "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
          }`}
        >
          <span className="inline-block w-2 h-2 rounded-full mr-1.5 bg-emerald-400"></span>
          Paid
        </button>
      </div>
    </div>
  );
}
