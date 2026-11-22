"use client";

import React from "react";
import { FaShoppingCart, FaCheckCircle, FaExclamationTriangle, FaTruck } from "react-icons/fa";
import { PurchaseKPIs } from "@/types/purchase";
import KpiCard from "@/components/ui/KpiCard";
import { Skeleton } from "@/components/dashboard/Skeleton";

interface PurchaseKPICardsProps {
  kpis: PurchaseKPIs;
  loading?: boolean;
}

export default function PurchaseKPICards({ kpis, loading }: PurchaseKPICardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 xl:gap-5">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="min-h-36 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.045)] flex items-start justify-between"
          >
            <div className="space-y-3 flex-1">
              <Skeleton className="h-3 w-24 rounded" />
              <Skeleton className="h-8 w-36 rounded" />
              <Skeleton className="h-3 w-28 rounded" />
            </div>
            <Skeleton className="w-11 h-11 rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  const transportAmount = kpis.totalTransportAmount || 0;
  const transportCount = kpis.transportBillsCount || 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 xl:gap-5">
      <KpiCard
        label="Total Purchases"
        value={`₹ ${kpis.totalPurchaseAmount.toLocaleString("en-IN")}`}
        note={`${kpis.totalPurchasesCount} total supplier bills`}
        accent="blue"
        icon={<FaShoppingCart className="w-5 h-5" />}
      />

      <KpiCard
        label="Paid on Pending Bills"
        value={`₹ ${kpis.totalPaidAmount.toLocaleString("en-IN")}`}
        note="Disbursed towards active dues"
        accent="green"
        valueClassName="text-emerald-700"
        icon={<FaCheckCircle className="w-5 h-5" />}
      />

      <KpiCard
        label="Outstanding Dues"
        value={`₹ ${kpis.totalDueAmount.toLocaleString("en-IN")}`}
        note={`${kpis.unpaidPurchasesCount} bills pending settlement`}
        accent="amber"
        valueClassName="text-amber-800"
        icon={<FaExclamationTriangle className="w-5 h-5" />}
      />

      <KpiCard
        label="Total Transport"
        value={`₹ ${transportAmount.toLocaleString("en-IN")}`}
        note={transportCount > 0 ? `${transportCount} bills with freight` : "Freight on procurements"}
        accent="violet"
        icon={<FaTruck className="w-5 h-5" />}
      />
    </div>
  );
}
