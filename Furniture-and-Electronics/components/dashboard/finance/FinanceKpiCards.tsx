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
      className={`grid ${
        isOwner ? "grid-cols-2" : "grid-cols-1 max-w-md"
      } gap-3 sm:gap-4 mb-5 sm:mb-6`}
    >
      <KpiCard
        label="Total Finances"
        value={kpis.totalCount}
        note="Financed deals in period"
        accent="blue"
        icon={<FaFileInvoiceDollar className="w-4 h-4" />}
      />

      {isOwner && (
        <KpiCard
          label="Bank Received"
          value={`₹${Number(kpis.totalBankReceived || 0).toLocaleString("en-IN")}`}
          note="Net settlement in bank"
          accent="green"
          icon={<FaUniversity className="w-4 h-4" />}
        />
      )}
    </div>
  );
}
