"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const COLORS = [
  "#4f46e5",
  "#10b981",
  "#8b5cf6",
  "#f59e0b",
  "#ef4444",
  "#06b6d4",
  "#ec4899",
];

interface DashboardAnalyticsGridProps {
  stats: any;
  notifications: any[];
  onOpenSoldItems: () => void;
}

export default function DashboardAnalyticsGrid({
  stats,
  notifications,
  onOpenSoldItems,
}: DashboardAnalyticsGridProps) {
  const [trendType, setTrendType] = useState<"daily" | "weekly" | "monthly">("daily");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const renderChart = (chartNode: React.ReactNode) => {
    if (!mounted) {
      return (
        <div className="h-56 sm:h-64 flex items-center justify-center text-gray-400 text-xs">
          Loading chart...
        </div>
      );
    }
    return chartNode;
  };

  const trendData = stats?.trends?.[trendType] || [];

  return (
    <>
      {/* Main Charts & Notifications Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
        {/* Sales Trend Chart (Col span 2) */}
        <div className="lg:col-span-2 bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-gray-800">
                Sales Analytics Trend
              </h3>
              <p className="text-xs text-gray-400">
                Track earnings growth over different periods
              </p>
            </div>

            <div className="flex border border-gray-200 rounded-lg p-0.5 bg-gray-50 self-start sm:self-auto">
              {(["daily", "weekly", "monthly"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setTrendType(type)}
                  className={`py-1.5 px-3 rounded-md text-xs font-bold capitalize transition ${
                    trendType === type
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="h-56 sm:h-72 w-full">
            {renderChart(
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={trendData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f3f4f6"
                  />
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 10, fill: "#9ca3af" }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 10, fill: "#9ca3af" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      border: "1px solid #f3f4f6",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                    formatter={(value) => [`₹${Number(value).toFixed(2)}`, "Sales"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    stroke="#4f46e5"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorSales)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Low Stock Alerts Notification Widget */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between max-h-[400px]">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base sm:text-lg font-bold text-gray-800">
                Inventory Alerts
              </h3>
              <span className="bg-red-50 text-red-600 text-xs px-2 py-0.5 rounded-full font-bold">
                {notifications.length} Alerts
              </span>
            </div>

            <div className="overflow-y-auto space-y-3 pr-1 max-h-[280px]">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400 text-center">
                  <span className="text-3xl mb-2">✅</span>
                  <span className="text-sm font-semibold">
                    All products in healthy stock
                  </span>
                </div>
              ) : (
                notifications.map((notif: any) => (
                  <div
                    key={notif.id}
                    className={`p-3 rounded-lg border flex flex-col gap-1 transition hover:shadow-sm ${
                      notif.severity === "critical"
                        ? "bg-rose-50/50 border-rose-200"
                        : notif.severity === "danger"
                        ? "bg-amber-50/50 border-amber-200"
                        : "bg-yellow-50/20 border-yellow-200"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-800 text-sm truncate max-w-[150px]">
                        {notif.name}
                      </span>
                      <span
                        className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded uppercase ${
                          notif.severity === "critical"
                            ? "bg-red-100 text-red-800"
                            : notif.severity === "danger"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {notif.severity === "critical" ? "OUT OF STOCK" : "LOW STOCK"}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 flex justify-between">
                      <span>Brand: {notif.brand || "Generic"}</span>
                      <span>
                        Stock:{" "}
                        <strong
                          className={
                            notif.severity === "critical"
                              ? "text-red-600"
                              : "text-amber-600"
                          }
                        >
                          {notif.quantity}
                        </strong>
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="border-t pt-3 mt-3 flex justify-between items-center text-xs">
            <span className="text-gray-400">Sorted by critical severity</span>
            <Link
              href="/inventory"
              className="text-blue-600 hover:underline font-bold"
            >
              Manage Stock &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* Categories & Fast/Slow Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
        {/* Category distribution */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-2">
            Stock by Category
          </h3>
          <p className="text-xs text-gray-400 mb-4 sm:mb-6 font-medium">
            Visual distribution of inventory categories
          </p>

          <div className="h-56 sm:h-64">
            {renderChart(
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stats?.categoryStock || []}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f3f4f6"
                  />
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 10, fill: "#9ca3af" }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 10, fill: "#9ca3af" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      border: "1px solid #f3f4f6",
                      borderRadius: "8px",
                    }}
                    formatter={(value) => [value, "Stock units"]}
                  />
                  <Bar dataKey="stock" radius={[4, 4, 0, 0]}>
                    {(stats?.categoryStock || []).map((_: any, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Fast-Moving Items */}
        <div
          className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between cursor-pointer hover:shadow-md hover:border-blue-200 transition-all group relative"
          onClick={onOpenSoldItems}
        >
          <div className="absolute top-5 right-5 w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
            <svg
              className="w-4 h-4 text-blue-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-2">
              🚀 Fast-Moving Products
            </h3>
            <p className="text-xs text-gray-400 mb-4 sm:mb-6 group-hover:text-blue-500 transition-colors">
              Tap to view all sold items history
            </p>

            <div className="space-y-4">
              {stats?.movement?.fastMoving?.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-xs">
                  No sales recorded yet.
                </div>
              ) : (
                stats?.movement?.fastMoving?.map((item: any, idx: number) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between border-b last:border-0 pb-3 last:pb-0"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-6 h-6 shrink-0 rounded-full bg-blue-50 text-blue-600 font-bold flex items-center justify-center text-xs">
                        {idx + 1}
                      </span>
                      <span className="font-semibold text-gray-800 text-sm truncate max-w-[180px]">
                        {item.name}
                      </span>
                    </div>
                    <span className="bg-green-50 text-green-700 text-xs font-extrabold px-2.5 py-1 rounded-full border border-green-100 shrink-0">
                      {item.quantity} sold
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Slow-Moving Items */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-2">
              ⏳ Slow-Moving Items
            </h3>
            <p className="text-xs text-gray-400 mb-4 sm:mb-6 font-medium">
              In-stock items with minimal sales
            </p>

            <div className="space-y-4">
              {stats?.movement?.slowMoving?.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-xs">
                  No slow moving items detected.
                </div>
              ) : (
                stats?.movement?.slowMoving?.map((item: any, idx: number) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between border-b last:border-0 pb-3 last:pb-0"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-6 h-6 shrink-0 rounded-full bg-purple-50 text-purple-600 font-bold flex items-center justify-center text-xs">
                        {idx + 1}
                      </span>
                      <span className="font-semibold text-gray-800 text-sm truncate max-w-[180px]">
                        {item.name}
                      </span>
                    </div>
                    <span className="bg-amber-50 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-full border border-amber-100 shrink-0">
                      {item.quantity} sold
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
