"use client";

import React from "react";
import KpiCard from "@/components/ui/KpiCard";
import { FaFileInvoiceDollar, FaUniversity } from "react-icons/fa";
import { FinanceKpis } from "@/hooks/useFinanceRecords";

interface FinanceKpiCardsProps {
  kpis: FinanceKpis;
  isOwner: boolean;
}

export default function FinanceKpiCards({ kpis, isOwner }: FinanceKpiCardsProps) {
  return (
    <div
      className={`grid grid-cols-1 ${
        isOwner ? "md:grid-cols-2" : "md:grid-cols-1 max-w-md"
      } gap-4 mb-6`}
    >
      <KpiCard
        label="Total Finances"
        value={kpis.totalCount}
        note="Financed deals in selected period"
        accent="blue"
        icon={<FaFileInvoiceDollar className="w-4 h-4" />}
      />

      {isOwner && (
        <KpiCard
          label="Total Amount Received in Bank"
          value={`₹${Number(kpis.totalBankReceived || 0).toLocaleString("en-IN")}`}
          note="Net bank settlement across selected period"
          accent="green"
          icon={<FaUniversity className="w-4 h-4" />}
        />
      )}
    </div>
  );
}
