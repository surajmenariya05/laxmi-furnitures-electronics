"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { useDebounce } from "@/hooks/useDebounce";
import { useAuth } from "@/hooks/useAuth";

export interface FinanceRecordItem {
  id: number;
  billId?: number | null;
  invoiceNumber: string;
  financeProviderId: number;
  providerName: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  productName: string;
  hsnSac: string;
  quantity: number;
  productPrice: number;
  downpayment: number;
  netAmountReceived?: number;
  financeDate: string;
}

export interface FinanceKpis {
  totalCount: number;
  totalBankReceived?: number;
}

export type DateRangePreset = "ALL" | "7" | "30" | "90" | "CUSTOM";

function formatLocalIsoDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function useFinanceRecords() {
  const { role } = useAuth();
  const isOwner = role === "owner";

  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 400);

  // Date selector state
  const [dateRange, setDateRange] = useState<DateRangePreset>("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [appliedCustomRange, setAppliedCustomRange] = useState<{
    start: string;
    end: string;
  } | null>(null);

  const queryUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (debouncedSearch.trim()) params.append("search", debouncedSearch.trim());

    if (dateRange === "7" || dateRange === "30" || dateRange === "90") {
      const days = parseInt(dateRange, 10);
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - days);
      params.append("startDate", formatLocalIsoDate(start));
      params.append("endDate", formatLocalIsoDate(end));
    } else if (dateRange === "CUSTOM" && appliedCustomRange) {
      params.append("startDate", appliedCustomRange.start);
      params.append("endDate", appliedCustomRange.end);
    }

    return `/api/v1/finance/records?${params.toString()}`;
  }, [debouncedSearch, dateRange, appliedCustomRange]);

  const {
    data: recordsResponse,
    mutate: mutateRecords,
    error: recordsError,
  } = useSWR(queryUrl, fetcher, { dedupingInterval: 3000 });

  const { data: providersData, mutate: mutateProviders } = useSWR(
    "/api/v1/finance/providers",
    fetcher,
    { dedupingInterval: 5000 }
  );

  const records: FinanceRecordItem[] = recordsResponse?.records || [];
  const kpis: FinanceKpis = recordsResponse?.kpis || {
    totalCount: 0,
    totalBankReceived: 0,
  };
  const providers: any[] = providersData || [];
  const isLoading = !recordsResponse && !recordsError;

  const handleSelectPreset = (preset: "ALL" | "7" | "30" | "90") => {
    setDateRange(preset);
    setAppliedCustomRange(null);
    setStartDate("");
    setEndDate("");
  };

  const handleApplyCustomRange = () => {
    if (!startDate || !endDate) return;
    setDateRange("CUSTOM");
    setAppliedCustomRange({ start: startDate, end: endDate });
  };

  const createRecord = async (payload: any) => {
    const res = await fetch("/api/v1/finance/records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to create finance record");
    await mutateRecords();
    return data;
  };

  const updateRecord = async (id: number, payload: any) => {
    const res = await fetch(`/api/v1/finance/records/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to update finance record");
    await mutateRecords();
    return data;
  };

  return {
    isOwner,
    searchQuery,
    setSearchQuery,
    dateRange,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    appliedCustomRange,
    handleSelectPreset,
    handleApplyCustomRange,
    records,
    kpis,
    providers,
    isLoading,
    mutateProviders,
    createRecord,
    updateRecord,
  };
}
