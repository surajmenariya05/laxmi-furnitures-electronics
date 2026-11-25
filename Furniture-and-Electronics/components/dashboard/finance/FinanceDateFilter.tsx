"use client";

import React, { useState, useRef, useEffect } from "react";
import { DateRangePreset } from "@/hooks/useFinanceRecords";

interface FinanceDateFilterProps {
  dateRange: DateRangePreset;
  startDate: string;
  setStartDate: (val: string) => void;
  endDate: string;
  setEndDate: (val: string) => void;
  appliedCustomRange: { start: string; end: string } | null;
  onSelectPreset: (preset: "ALL" | "7" | "30" | "90") => void;
  onApplyCustomRange: () => void;
}

export default function FinanceDateFilter({
  dateRange,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  appliedCustomRange,
  onSelectPreset,
  onApplyCustomRange,
}: FinanceDateFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const currentLabel =
    dateRange === "ALL"
      ? "All Time"
      : dateRange === "7"
      ? "Last 7 Days"
      : dateRange === "30"
      ? "Last 30 Days"
      : dateRange === "90"
      ? "Last 90 Days"
      : appliedCustomRange
      ? `${appliedCustomRange.start} → ${appliedCustomRange.end}`
      : "Custom Range";

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex items-center gap-2.5 h-10 px-4 rounded-xl bg-white border border-[#DDD6CE] border-b-2 border-b-[#C8BFB5] text-sm font-bold text-[#1C1A17] shadow-2xs hover:bg-[#FAF6F0] transition"
      >
        <span>{currentLabel}</span>
        <span className="text-[10px] text-[#6E6862]">▼</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-[340px] bg-[#FAF6F0] border border-[#E5DFD7] rounded-2xl shadow-xl p-3.5 z-50">
          <div className="flex flex-col gap-1">
            {(
              [
                { key: "ALL", label: "All Time" },
                { key: "7", label: "Last 7 Days" },
                { key: "30", label: "Last 30 Days" },
                { key: "90", label: "Last 90 Days" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => {
                  onSelectPreset(opt.key);
                  setIsOpen(false);
                }}
                className={`text-left px-3 py-2 text-sm rounded-xl font-bold transition ${
                  dateRange === opt.key
                    ? "bg-[#1C1A17] text-white shadow-xs"
                    : "text-[#6E6862] hover:bg-[#EAE4DC] hover:text-[#1C1A17]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="mt-3 pt-3 border-t border-[#E5DFD7]">
            <span className="text-xs font-bold text-[#6E6862] mb-2 block px-2 uppercase tracking-wider">
              Custom Range
            </span>
            <div className="flex items-center gap-2 px-1">
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-[10px] font-bold text-[#6E6862] mb-0.5">From</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="border border-[#DDD6CE] bg-white rounded-lg px-2 py-1.5 text-xs text-[#1C1A17] font-semibold w-full min-w-0 outline-none focus:border-[#1C1A17]"
                />
              </div>
              <span className="text-[#6E6862] mt-4 font-bold shrink-0">→</span>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-[10px] font-bold text-[#6E6862] mb-0.5">To</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="border border-[#DDD6CE] bg-white rounded-lg px-2 py-1.5 text-xs text-[#1C1A17] font-semibold w-full min-w-0 outline-none focus:border-[#1C1A17]"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                onApplyCustomRange();
                setIsOpen(false);
              }}
              disabled={!startDate || !endDate}
              className="mt-3 w-full bg-[#1C1A17] hover:bg-[#2C2926] text-white text-xs font-bold py-2 rounded-xl transition shadow-xs disabled:bg-[#DDD6CE] disabled:text-[#6E6862]"
            >
              Apply Range
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
