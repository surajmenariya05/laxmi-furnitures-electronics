"use client";

import React from "react";

interface DashboardKpiGridProps {
  stats: any;
  onOpenDailySales: () => void;
}

export default function DashboardKpiGrid({
  stats,
  onOpenDailySales,
}: DashboardKpiGridProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
      {/* Total Products */}
      <div className="relative group overflow-hidden bg-white p-3.5 sm:p-6 rounded-xl shadow-sm border border-gray-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-blue-100 flex flex-col justify-between">
        <div className="absolute top-0 left-0 h-1 w-full bg-blue-500"></div>
        <div className="flex justify-between items-start gap-2">
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider leading-tight">
              Total Products
            </p>
            <h3 className="text-lg sm:text-2xl xl:text-3xl font-extrabold text-gray-800 mt-1.5 sm:mt-2 tabular-nums break-words">
              {stats?.totalProducts ?? 0}
            </h3>
          </div>
          <span className="p-1.5 sm:p-2.5 bg-blue-50 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0">
            <img
              src="/package.svg"
              alt="Total Products"
              className="w-4 h-4 sm:w-6 sm:h-6 object-contain"
            />
          </span>
        </div>
        <p className="text-[11px] sm:text-xs text-gray-500 mt-2.5 sm:mt-4 leading-snug">
          Active SKU catalog items
        </p>
      </div>

      {/* Total Stock Units */}
      <div className="relative group overflow-hidden bg-white p-3.5 sm:p-6 rounded-xl shadow-sm border border-gray-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-emerald-100 flex flex-col justify-between">
        <div className="absolute top-0 left-0 h-1 w-full bg-emerald-500"></div>
        <div className="flex justify-between items-start gap-2">
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider leading-tight">
              Total Stock Units
            </p>
            <h3 className="text-lg sm:text-2xl xl:text-3xl font-extrabold text-gray-800 mt-1.5 sm:mt-2 tabular-nums break-words">
              {stats?.totalStockUnits ?? 0}
            </h3>
          </div>
          <span className="p-1.5 sm:p-2.5 bg-emerald-50 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0">
            <img
              src="/boxes.svg"
              alt="Total Stock Units"
              className="w-4 h-4 sm:w-6 sm:h-6 object-contain"
            />
          </span>
        </div>
        <p className="text-[11px] sm:text-xs text-gray-500 mt-2.5 sm:mt-4 leading-snug">
          Units currently in warehouse
        </p>
      </div>

      {/* Today's Profit */}
      <div
        onClick={onOpenDailySales}
        className="relative group overflow-hidden bg-white p-3.5 sm:p-6 rounded-xl shadow-sm border border-gray-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-green-300 cursor-pointer flex flex-col justify-between"
      >
        <div className="absolute top-0 left-0 h-1 w-full bg-green-500"></div>
        <div className="flex justify-between items-start gap-2">
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider leading-tight">
              Today&apos;s Profit
            </p>
            <h3 className="text-lg sm:text-2xl xl:text-3xl font-extrabold text-gray-800 mt-1.5 sm:mt-2 tabular-nums break-words">
              {stats?.todayProfit != null
                ? `₹${Number(stats.todayProfit).toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`
                : "—"}
            </h3>
          </div>
          <span className="p-1.5 sm:p-2.5 bg-green-50 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0">
            <img
              src="/chart-no-axes-combined.svg"
              alt="Today's Profit"
              className="w-4 h-4 sm:w-6 sm:h-6 object-contain"
            />
          </span>
        </div>
        <p className="text-[11px] sm:text-xs text-gray-500 mt-2.5 sm:mt-4 flex items-center justify-between gap-1 leading-snug">
          <span>
            <span className="text-green-600 font-semibold">
              {stats?.todayProfit != null ? "↑ Today" : "🔒 Owner Only"}
            </span>{" "}
            <span className="hidden sm:inline">
              {stats?.todayProfit != null
                ? "net profit generated"
                : "margin access restricted"}
            </span>
          </span>
          <span className="text-[10px] font-bold text-green-600 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity whitespace-nowrap">
            View →
          </span>
        </p>
      </div>

      {/* Today's Sales */}
      <div
        onClick={onOpenDailySales}
        className="relative group overflow-hidden bg-white p-3.5 sm:p-6 rounded-xl shadow-sm border border-gray-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-indigo-300 cursor-pointer flex flex-col justify-between"
      >
        <div className="absolute top-0 left-0 h-1 w-full bg-indigo-500"></div>
        <div className="flex justify-between items-start gap-2">
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider leading-tight">
              Today&apos;s Sales
            </p>
            <h3 className="text-lg sm:text-2xl xl:text-3xl font-extrabold text-gray-800 mt-1.5 sm:mt-2 tabular-nums break-words">
              ₹
              {Number(stats?.todaySales || 0).toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </h3>
          </div>
          <span className="p-1.5 sm:p-2.5 bg-indigo-50 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0">
            <img
              src="/shopping-cart.svg"
              alt="Today's Sales"
              className="w-4 h-4 sm:w-6 sm:h-6 object-contain"
            />
          </span>
        </div>
        <p className="text-[11px] sm:text-xs text-gray-500 mt-2.5 sm:mt-4 flex items-center justify-between gap-1 leading-snug">
          <span>
            <span className="text-indigo-600 font-semibold">📈 Today</span>{" "}
            <span className="hidden sm:inline">revenue generated</span>
          </span>
          <span className="text-[10px] font-bold text-indigo-600 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity whitespace-nowrap">
            View →
          </span>
        </p>
      </div>

      {/* Monthly Sales */}
      <div className="relative group overflow-hidden bg-white p-3.5 sm:p-6 rounded-xl shadow-sm border border-gray-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-cyan-100 flex flex-col justify-between">
        <div className="absolute top-0 left-0 h-1 w-full bg-cyan-500"></div>
        <div className="flex justify-between items-start gap-2">
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider leading-tight">
              Monthly Sales
            </p>
            <h3 className="text-lg sm:text-2xl xl:text-3xl font-extrabold text-gray-800 mt-1.5 sm:mt-2 tabular-nums break-words">
              ₹
              {Number(stats?.monthlySales || 0).toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </h3>
          </div>
          <span className="p-1.5 sm:p-2.5 bg-cyan-50 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0">
            <img
              src="/calendar-days.svg"
              alt="Monthly Sales"
              className="w-4 h-4 sm:w-6 sm:h-6 object-contain"
            />
          </span>
        </div>
        <p className="text-[11px] sm:text-xs text-gray-500 mt-2.5 sm:mt-4 leading-snug">
          Calendar month total
        </p>
      </div>

      {/* Total Stock Worth */}
      <div className="relative group overflow-hidden bg-white p-3.5 sm:p-6 rounded-xl shadow-sm border border-gray-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-amber-100 flex flex-col justify-between">
        <div className="absolute top-0 left-0 h-1 w-full bg-amber-500"></div>
        <div className="flex justify-between items-start gap-2">
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider leading-tight">
              Total Stock Worth
            </p>
            <h3 className="text-lg sm:text-2xl xl:text-3xl font-extrabold text-gray-800 mt-1.5 sm:mt-2 tabular-nums break-words">
              ₹
              {Number(stats?.totalStockValue || 0).toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </h3>
          </div>
          <span className="p-1.5 sm:p-2.5 bg-amber-50 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0">
            <img
              src="/indian-rupee.svg"
              alt="Total Stock Worth"
              className="w-4 h-4 sm:w-6 sm:h-6 object-contain"
            />
          </span>
        </div>
        <p className="text-[11px] sm:text-xs text-gray-500 mt-2.5 sm:mt-4 leading-snug">
          Capital in inventory
        </p>
      </div>
    </div>
  );
}
