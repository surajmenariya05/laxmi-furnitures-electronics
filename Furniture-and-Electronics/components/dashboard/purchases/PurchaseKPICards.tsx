"use client";

import React from "react";
import { FaShoppingCart, FaCheckCircle, FaExclamationTriangle, FaTruck } from "react-icons/fa";
import { PurchaseKPIs } from "@/types/purchase";
import { Skeleton } from "@/components/dashboard/Skeleton";

interface PurchaseKPICardsProps {
  kpis: PurchaseKPIs;
  loading?: boolean;
}

export default function PurchaseKPICards({ kpis, loading }: PurchaseKPICardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between"
          >
            <div className="space-y-2">
              <Skeleton className="h-3 w-28 rounded" />
              <Skeleton className="h-7 w-36 rounded" />
              <Skeleton className="h-3 w-32 rounded" />
            </div>
            <Skeleton className="w-10 h-10 rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  const transportAmount = kpis.totalTransportAmount || 0;
  const transportCount = kpis.transportBillsCount || 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Purchases */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Purchases</p>
          <p className="text-xl font-black text-gray-900 mt-1">
            ₹ {kpis.totalPurchaseAmount.toLocaleString("en-IN")}
          </p>
          <p className="text-[11px] text-gray-500 font-medium mt-0.5">
            {kpis.totalPurchasesCount} total supplier bills
          </p>
        </div>
        <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
          <FaShoppingCart className="w-5 h-5" />
        </div>
      </div>

      {/* 2. Total Paid to Vendors on Active/Unsettled Bills */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Paid on Pending Bills</p>
          <p className="text-xl font-black text-[#15803D] mt-1">
            ₹ {kpis.totalPaidAmount.toLocaleString("en-IN")}
          </p>
          <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">
            Disbursed towards active dues
          </p>
        </div>
        <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
          <FaCheckCircle className="w-5 h-5" />
        </div>
      </div>

      {/* 3. Total Due to Vendors (Accounts Payable) */}
      <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/20 shadow-xs flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-[#780000] uppercase tracking-wider">Outstanding Dues</p>
          <p className="text-xl font-black text-[#780000] mt-1">
            ₹ {kpis.totalDueAmount.toLocaleString("en-IN")}
          </p>
          <p className="text-[11px] text-amber-700 font-bold mt-0.5">
            {kpis.unpaidPurchasesCount} bills pending settlement
          </p>
        </div>
        <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
          <FaExclamationTriangle className="w-5 h-5" />
        </div>
      </div>

      {/* 4. Total Transport / Freight Amount */}
      <div className="bg-white p-4 rounded-xl border border-indigo-200 bg-indigo-50/20 shadow-xs flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-indigo-900 uppercase tracking-wider">Total Transport</p>
          <p className="text-xl font-black text-indigo-950 mt-1">
            ₹ {transportAmount.toLocaleString("en-IN")}
          </p>
          <p className="text-[11px] text-indigo-700 font-medium mt-0.5">
            {transportCount > 0 ? `${transportCount} bills with freight` : "Freight on procurements"}
          </p>
        </div>
        <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
          <FaTruck className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
