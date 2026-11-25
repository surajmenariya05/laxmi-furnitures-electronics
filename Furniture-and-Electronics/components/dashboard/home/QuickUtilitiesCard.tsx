"use client";

import React from "react";
import TactileButton from "@/components/ui/TactileButton";

export default function QuickUtilitiesCard() {
  return (
    <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
      <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4">
        Quick Management Utilities
      </h3>
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <TactileButton
          href="/billing"
          variant="invoice"
          size="md"
          className="!rounded-full w-full whitespace-nowrap !px-2 sm:!px-5 !py-2 sm:!py-2.5 !text-[11px] sm:!text-sm"
        >
          <span>🧾</span>
          <span>Record Sale</span>
        </TactileButton>
        <TactileButton
          href="/inventory"
          variant="inventory"
          size="md"
          className="!rounded-full w-full whitespace-nowrap !px-2 sm:!px-5 !py-2 sm:!py-2.5 !text-[11px] sm:!text-sm"
        >
          <span>📦</span>
          <span>Add Product</span>
        </TactileButton>
        <TactileButton
          href="/analytics"
          variant="excel"
          size="md"
          className="!rounded-full w-full whitespace-nowrap !px-2 sm:!px-5 !py-2 sm:!py-2.5 !text-[11px] sm:!text-sm"
        >
          <span>📊</span>
          <span className="sm:hidden">Report</span>
          <span className="hidden sm:inline">Generate Report</span>
        </TactileButton>
      </div>
    </div>
  );
}
