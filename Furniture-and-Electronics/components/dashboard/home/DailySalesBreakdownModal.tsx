"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Modal } from "@/components/ui/modal";
import DailySalesMobileCards from "@/components/mobileview/dashboard/DailySalesMobileCards";

const getTodayISO = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getYesterdayISO = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatISOToDDMMYYYY = (isoString: string) => {
  if (!isoString) return "";
  const parts = isoString.split("-");
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return isoString;
};

interface DailySalesBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DailySalesBreakdownModal({
  isOpen,
  onClose,
}: DailySalesBreakdownModalProps) {
  const [selectedSalesDate, setSelectedSalesDate] = useState<string>(getTodayISO());
  const [dailySalesData, setDailySalesData] = useState<any>(null);
  const [dailySalesLoading, setDailySalesLoading] = useState(false);
  const dateInputRef = useRef<HTMLInputElement>(null);

  const openDatePicker = () => {
    const input = dateInputRef.current;
    if (!input) return;
    try {
      if (typeof input.showPicker === "function") {
        input.showPicker();
        return;
      }
    } catch {
      // Fallback below if showPicker is blocked
    }
    input.focus();
    input.click();
  };

  useEffect(() => {
    if (isOpen) {
      setSelectedSalesDate(getTodayISO());
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const fetchDailySales = async () => {
      setDailySalesLoading(true);
      try {
        const res = await fetch(
          `/api/v1/dashboard/daily-sales?date=${selectedSalesDate}`
        );
        if (res.ok) {
          const data = await res.json();
          if (isMounted) setDailySalesData(data);
        }
      } catch (err) {
        console.error("Failed to fetch daily sales:", err);
      } finally {
        if (isMounted) setDailySalesLoading(false);
      }
    };

    fetchDailySales();
    return () => {
      isMounted = false;
    };
  }, [isOpen, selectedSalesDate]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="bg-[#F7F5F0] rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col max-h-[88vh] border border-[#E5DFD7]"
    >
      {/* Header with Date Selector */}
      <div className="p-4 sm:p-6 border-b border-gray-200/80 bg-gray-50/70 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-xl font-bold text-gray-800 leading-tight">
                {selectedSalesDate === getTodayISO()
                  ? "Today's Sales Breakdown"
                  : selectedSalesDate === getYesterdayISO()
                  ? "Yesterday's Sales Breakdown"
                  : "Daily Sales Breakdown"}
              </h2>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] sm:text-xs font-bold bg-blue-100 text-blue-800 tracking-wide whitespace-nowrap">
                {formatISOToDDMMYYYY(selectedSalesDate)}
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-gray-500 mt-1">
              Detailed list of items sold & profit on{" "}
              {formatISOToDDMMYYYY(selectedSalesDate)}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 shrink-0 hover:bg-red-50 hover:text-red-600 text-gray-400 rounded-full transition-colors"
            title="Close modal"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Date Controls */}
        <div className="relative flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Hidden native date input anchored at left-0 so popup never overflows right on mobile */}
          <input
            ref={dateInputRef}
            type="date"
            max={getTodayISO()}
            value={selectedSalesDate}
            onChange={(e) => {
              if (e.target.value) setSelectedSalesDate(e.target.value);
            }}
            aria-label="Select sales date"
            tabIndex={-1}
            className="absolute left-0 bottom-0 w-px h-px opacity-0 pointer-events-none"
          />

          <div className="inline-flex rounded-lg bg-gray-200/80 p-0.5 text-xs font-semibold">
            <button
              onClick={() => setSelectedSalesDate(getTodayISO())}
              className={`px-3 py-1.5 rounded-md transition-all ${
                selectedSalesDate === getTodayISO()
                  ? "bg-white text-blue-600 shadow-sm font-bold"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setSelectedSalesDate(getYesterdayISO())}
              className={`px-3 py-1.5 rounded-md transition-all ${
                selectedSalesDate === getYesterdayISO()
                  ? "bg-white text-blue-600 shadow-sm font-bold"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Yesterday
            </button>
          </div>

          <button
            type="button"
            onClick={openDatePicker}
            className="inline-flex items-center gap-2 border border-gray-200 bg-white hover:bg-gray-50 rounded-lg px-2.5 py-1.5 text-xs font-bold text-gray-700 shadow-sm focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
          >
            <span className="tabular-nums">{formatISOToDDMMYYYY(selectedSalesDate)}</span>
            <svg
              className="w-3.5 h-3.5 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Body Content */}
      <div className="p-0 overflow-y-auto custom-scrollbar flex-1 bg-white min-h-[260px] relative">
        {dailySalesLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
            <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="text-xs font-semibold text-gray-500">
              Loading sales for {formatISOToDDMMYYYY(selectedSalesDate)}...
            </p>
          </div>
        ) : !dailySalesData?.soldItems || dailySalesData.soldItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <span className="text-4xl mb-3">📭</span>
            <p className="text-sm font-semibold text-gray-700">
              No sales recorded on {formatISOToDDMMYYYY(selectedSalesDate)}.
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Try selecting another date or check your bills history.
            </p>
          </div>
        ) : (
          <>
            <DailySalesMobileCards items={dailySalesData.soldItems} />

            <table className="hidden md:table min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider"
                  >
                    Bill No.
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider"
                  >
                    Item Details
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider"
                  >
                    SERIAL NO. / S/N
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider"
                  >
                    Qty
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider"
                  >
                    Price / Total
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider"
                  >
                    Net Profit
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {dailySalesData.soldItems.map((item: any) => (
                  <tr
                    key={item.id}
                    className="hover:bg-blue-50/30 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/billing/${item.billId}`}
                        className="text-sm font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded transition-colors"
                        title="View Bill Details"
                      >
                        #{item.billNumber}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-gray-900">
                        {item.productName}
                      </div>
                      <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            item.department === "FURNITURE"
                              ? "bg-[#235347] text-white border border-[#2F6859] border-b-[#14352D] shadow-[0_1.5px_0_#14352D,inset_0_1px_0_rgba(255,255,255,0.25)]"
                              : "bg-[#093F52] text-white border border-[#105269] border-b-[#052531] shadow-[0_1.5px_0_#052531,inset_0_1px_0_rgba(255,255,255,0.25)]"
                          }`}
                        >
                          {item.department === "FURNITURE"
                            ? "🛋️ FURNITURE"
                            : "⚡ ELECTRONICS"}
                        </span>
                        {item.categoryName && (
                          <span className="text-[10.5px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                            {item.categoryName}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.imeiNumber ? (
                        <span className="text-xs font-mono font-medium text-gray-700 bg-gray-100 px-2.5 py-1 rounded-md border border-gray-200">
                          {item.imeiNumber}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400 italic">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-sm font-bold text-gray-700">
                        {item.quantity}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-xs text-gray-500">
                        ₹{item.unitPrice.toFixed(2)} × {item.quantity}
                      </div>
                      <div className="text-sm font-black text-gray-900 mt-0.5">
                        ₹{item.lineTotal.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {item.netProfit != null ? (
                        <div
                          className={`text-sm font-black ${
                            item.netProfit > 0
                              ? "text-green-600"
                              : item.netProfit < 0
                              ? "text-red-500"
                              : "text-gray-500"
                          }`}
                        >
                          {item.netProfit > 0 ? "+" : ""}₹
                          {item.netProfit.toFixed(2)}
                        </div>
                      ) : (
                        <span className="text-xs font-semibold text-gray-400 italic">
                          🔒 Hidden
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>

      {/* Footer Summary Bar */}
      <div className="px-4 py-3 sm:p-4 border-t border-gray-200 bg-gray-50/95 grid grid-cols-3 sm:flex sm:justify-between items-center gap-2 sm:gap-4">
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            Items
          </p>
          <p className="text-sm sm:text-base font-black text-gray-800 tabular-nums">
            {dailySalesData?.totalItems ?? 0}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row sm:gap-6 sm:items-center col-span-2 sm:col-span-1">
          <div className="grid grid-cols-2 sm:flex sm:gap-6 items-center gap-2">
            <div className="text-center sm:text-left">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider sm:hidden">
                Total Sales
              </p>
              <p className="text-sm sm:text-lg font-bold text-gray-700 tabular-nums">
                <span className="hidden sm:inline">Total Sales: </span>₹
                {Number(dailySalesData?.totalSales || 0).toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider sm:hidden">
                Total Profit
              </p>
              {dailySalesData?.totalProfit != null ? (
                <p
                  className={`text-sm sm:text-lg font-black tabular-nums ${
                    dailySalesData.totalProfit > 0
                      ? "text-[#15803D]"
                      : dailySalesData.totalProfit < 0
                      ? "text-[#780000]"
                      : "text-gray-600"
                  }`}
                >
                  <span className="hidden sm:inline">Total Profit: </span>
                  {dailySalesData.totalProfit > 0 ? "+" : ""}₹
                  {Number(dailySalesData.totalProfit).toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              ) : (
                <span className="text-[11px] sm:text-xs font-bold text-gray-500 bg-gray-200/80 px-2 py-1 rounded-md">
                  🔒 Owner Only
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
