"use client";

import React from "react";

export interface DuePaymentPillProps {
  dueAmount: number | string | null | undefined;
  bill?: any;
  onClick?: (bill?: any) => void;
  className?: string;
}

export default function DuePaymentPill({
  dueAmount,
  bill,
  onClick,
  className = "",
}: DuePaymentPillProps) {
  const due = Number(dueAmount || 0);

  if (due <= 0) {
    return (
      <span
        className={`text-[10px] font-extrabold bg-[#EBFDE7] text-[#14532D] border border-[#81FF7A]/80 border-b-[#4ADE80] shadow-[0_2px_4px_rgba(20,83,45,0.12),inset_0_1px_0_rgba(255,255,255,0.9)] px-1.5 py-0.5 rounded whitespace-nowrap inline-flex items-center gap-1 ${className}`}
      >
        <span>✓</span>
        <span>Paid</span>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        if (onClick) onClick(bill);
      }}
      className={`group relative inline-flex items-center justify-center gap-1 text-[10px] font-extrabold bg-[#FDF2F2] hover:bg-[#FCE8E8] text-[#780000] border border-[#780000]/30 border-b-2 border-b-[#780000]/60 shadow-[0_2px_4px_rgba(120,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.9)] hover:shadow-md active:translate-y-px px-2 py-0.5 rounded transition-all duration-200 cursor-pointer ${className}`}
      title={
        bill?.billNumber
          ? `Click to collect payment for Bill #${bill.billNumber} (Due: ₹${due.toLocaleString("en-IN")})`
          : `Click to collect payment (Due: ₹${due.toLocaleString("en-IN")})`
      }
    >
      <span className="shrink-0 font-mono">Due: ₹{due.toLocaleString("en-IN")}</span>
      <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 group-hover:max-w-[45px] group-hover:opacity-100 group-hover:ml-0.5 transition-all duration-200 ease-out text-[9px] font-black text-emerald-800 bg-emerald-100/90 px-1 rounded border border-emerald-300">
        Pay 💳
      </span>
    </button>
  );
}
