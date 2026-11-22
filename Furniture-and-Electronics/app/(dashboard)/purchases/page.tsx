"use client";

import React, { useState, useRef, useEffect } from "react";
import useSWR from "swr";
import { useAuth } from "@/hooks/useAuth";
import { useDebounce } from "@/hooks/useDebounce";
import { useDepartment } from "@/components/dashboard/department/DepartmentContext";
import { Purchase, Vendor, PurchaseKPIs } from "@/types/purchase";
import { getPurchases, getVendors, deletePurchase } from "@/lib/api/purchase";
import PurchaseKPICards from "@/components/dashboard/purchases/PurchaseKPICards";
import PurchaseFilters from "@/components/dashboard/purchases/PurchaseFilters";
import PurchaseTable from "@/components/dashboard/purchases/PurchaseTable";
import NewPurchaseModal from "@/components/dashboard/purchases/NewPurchaseModal";
import PayInstallmentModal from "@/components/dashboard/purchases/PayInstallmentModal";
import VendorManagementModal from "@/components/dashboard/purchases/VendorManagementModal";
import PurchaseDetailModal from "@/components/dashboard/purchases/PurchaseDetailModal";
import ReceiveStockModal from "@/components/dashboard/purchases/ReceiveStockModal";

export default function PurchasesPage() {
  const { user } = useAuth();
  const isOwner = user?.role === "owner";
  const { department: activeDept } = useDepartment();

  // Search & Filters State
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 350);
  const [statusFilter, setStatusFilter] = useState("ALL"); // "ALL" | "PENDING_DUE" | "PAID"
  const [selectedVendorId, setSelectedVendorId] = useState("ALL");
  const [page, setPage] = useState(1);

  // Date Range Filter State
  const [dateRange, setDateRange] = useState<"all" | "7" | "30" | "90" | "custom">("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [appliedDates, setAppliedDates] = useState<{ start?: string; end?: string }>({});
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectPreset = (preset: "all" | "7" | "30" | "90") => {
    setDateRange(preset);
    setPage(1);
    setDropdownOpen(false);

    if (preset === "all") {
      setAppliedDates({});
      return;
    }

    const days = parseInt(preset, 10);
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);

    setAppliedDates({
      start: start.toISOString().split("T")[0],
      end: end.toISOString().split("T")[0],
    });
  };

  const handleApplyCustomRange = () => {
    if (!startDate || !endDate) return;
    setDateRange("custom");
    setAppliedDates({ start: startDate, end: endDate });
    setPage(1);
    setDropdownOpen(false);
  };

  // Modals State
  const [isNewPurchaseOpen, setIsNewPurchaseOpen] = useState(false);
  const [isVendorManagerOpen, setIsVendorManagerOpen] = useState(false);
  const [selectedPayPurchase, setSelectedPayPurchase] = useState<Purchase | null>(null);
  const [selectedDetailPurchase, setSelectedDetailPurchase] = useState<Purchase | null>(null);
  const [selectedReceiveStockPurchase, setSelectedReceiveStockPurchase] = useState<Purchase | null>(null);

  // 1. SWR Caching for Vendors List
  const { data: vendorsData, mutate: mutateVendors } = useSWR<Vendor[]>(
    "/api/v1/vendors",
    () => getVendors(),
    { revalidateOnFocus: false, dedupingInterval: 10000 }
  );
  const vendors = vendorsData || [];

  // 2. SWR Caching for Purchases Data & KPIs
  const purchasesCacheKey = [
    "purchases",
    debouncedSearch,
    activeDept,
    selectedVendorId,
    statusFilter,
    appliedDates.start || "",
    appliedDates.end || "",
    page,
  ];

  const {
    data: purchasesResponse,
    isLoading,
    mutate: mutatePurchases,
  } = useSWR(
    purchasesCacheKey,
    () =>
      getPurchases({
        search: debouncedSearch,
        department: activeDept === "ALL" ? undefined : activeDept,
        vendorId: selectedVendorId === "ALL" ? undefined : selectedVendorId,
        paymentStatus: statusFilter === "ALL" ? undefined : statusFilter,
        startDate: appliedDates.start,
        endDate: appliedDates.end,
        page,
        limit: 20,
      }),
    {
      keepPreviousData: true,
      dedupingInterval: 5000,
      revalidateOnFocus: true,
    }
  );

  const purchases = purchasesResponse?.items || [];
  const totalPages = purchasesResponse?.totalPages || 1;
  const kpis: PurchaseKPIs = purchasesResponse?.kpis || {
    totalPurchasesCount: 0,
    totalPurchaseAmount: 0,
    totalPaidAmount: 0,
    totalDueAmount: 0,
    unpaidPurchasesCount: 0,
  };
  const loading = isLoading;

  // Refresh cache on any mutation
  const refreshAll = () => {
    mutatePurchases();
    mutateVendors();
  };

  // Handle Delete Purchase
  const handleDeletePurchase = async (purchase: Purchase) => {
    if (
      !confirm(
        `Are you sure you want to delete purchase #${purchase.purchaseNumber} from ${purchase.vendor.name}? If stock was added, it will be automatically rolled back.`
      )
    ) {
      return;
    }

    try {
      await deletePurchase(purchase.id);
      refreshAll();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to delete purchase.");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      {/* Page Title & Subtitle + Date Filter */}
      <div className="relative z-30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            Purchases & Vendor Settlements
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Track wholesale procurements, manage supplier accounts payable, and settle installments.
          </p>
        </div>

        {/* Date Selector Dropdown matching Analytics style */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="border border-[#DDD6CE] rounded-xl px-4 py-2 bg-white text-sm min-w-[150px] text-left flex justify-between items-center text-[#1C1A17] font-bold hover:border-[#D5CDC3] transition shadow-2xs"
          >
            {dateRange === "all"
              ? "All Time"
              : dateRange === "custom"
              ? "Custom Range"
              : `Last ${dateRange} Days`}
            <span className="ml-2 text-[#6E6862] text-xs">▼</span>
          </button>

          {dropdownOpen && (
            <div className="absolute top-full right-0 mt-2 bg-[#F5F2ED] border border-[#DDD6CE] rounded-2xl shadow-2xl z-50 w-80 p-3">
              <div className="flex flex-col space-y-1">
                <button
                  type="button"
                  onClick={() => handleSelectPreset("all")}
                  className={`text-left px-3 py-2 text-sm rounded-xl font-bold transition ${
                    dateRange === "all"
                      ? "bg-[#1C1A17] text-white shadow-xs"
                      : "text-[#6E6862] hover:bg-[#EAE4DC] hover:text-[#1C1A17]"
                  }`}
                >
                  All Time
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPreset("7")}
                  className={`text-left px-3 py-2 text-sm rounded-xl font-bold transition ${
                    dateRange === "7"
                      ? "bg-[#1C1A17] text-white shadow-xs"
                      : "text-[#6E6862] hover:bg-[#EAE4DC] hover:text-[#1C1A17]"
                  }`}
                >
                  Last 7 Days
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPreset("30")}
                  className={`text-left px-3 py-2 text-sm rounded-xl font-bold transition ${
                    dateRange === "30"
                      ? "bg-[#1C1A17] text-white shadow-xs"
                      : "text-[#6E6862] hover:bg-[#EAE4DC] hover:text-[#1C1A17]"
                  }`}
                >
                  Last 30 Days
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPreset("90")}
                  className={`text-left px-3 py-2 text-sm rounded-xl font-bold transition ${
                    dateRange === "90"
                      ? "bg-[#1C1A17] text-white shadow-xs"
                      : "text-[#6E6862] hover:bg-[#EAE4DC] hover:text-[#1C1A17]"
                  }`}
                >
                  Last 90 Days
                </button>
              </div>

              <div className="mt-3 pt-3 border-t border-[#E5DFD7]">
                <span className="text-xs font-bold text-[#6E6862] mb-2 block px-2 uppercase tracking-wider">
                  Custom Range
                </span>
                <div className="flex items-center gap-2 px-2">
                  <div className="flex flex-col w-full">
                    <span className="text-[10px] font-bold text-[#6E6862] mb-0.5">From</span>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="border border-[#DDD6CE] bg-white rounded-lg px-2 py-1.5 text-xs text-[#1C1A17] font-semibold w-full outline-none focus:border-[#1C1A17]"
                    />
                  </div>
                  <span className="text-[#6E6862] mt-4 font-bold">→</span>
                  <div className="flex flex-col w-full">
                    <span className="text-[10px] font-bold text-[#6E6862] mb-0.5">To</span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="border border-[#DDD6CE] bg-white rounded-lg px-2 py-1.5 text-xs text-[#1C1A17] font-semibold w-full outline-none focus:border-[#1C1A17]"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleApplyCustomRange}
                  disabled={!startDate || !endDate}
                  className="mt-3 w-full bg-[#1C1A17] hover:bg-[#2C2926] text-white text-xs font-bold py-2 rounded-xl transition shadow-xs disabled:bg-[#DDD6CE] disabled:text-[#6E6862]"
                >
                  Apply Range
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <PurchaseKPICards kpis={kpis} loading={loading} />

      {/* Filters & Actions Bar */}
      <PurchaseFilters
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        statusFilter={statusFilter}
        onStatusFilterChange={(val) => {
          setStatusFilter(val);
          setPage(1);
        }}
        selectedVendorId={selectedVendorId}
        onVendorChange={(val) => {
          setSelectedVendorId(val);
          setPage(1);
        }}
        vendors={vendors}
        onOpenNewPurchase={() => setIsNewPurchaseOpen(true)}
        onOpenVendorManager={() => setIsVendorManagerOpen(true)}
      />

      {/* Purchases Data Table */}
      <PurchaseTable
        purchases={purchases}
        loading={loading}
        onPayInstallment={(p) => setSelectedPayPurchase(p)}
        onViewDetails={(p) => setSelectedDetailPurchase(p)}
        onDeletePurchase={handleDeletePurchase}
        onReceiveStock={(p) => setSelectedReceiveStockPurchase(p)}
        isOwner={isOwner}
      />

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center text-xs font-semibold text-[#6E6862] bg-[#F5F2ED]/95 backdrop-blur-md px-4 py-3 rounded-2xl border border-[#E5DFD7] shadow-sm">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <NewPurchaseModal
        isOpen={isNewPurchaseOpen}
        onClose={() => setIsNewPurchaseOpen(false)}
        onSuccess={refreshAll}
        vendors={vendors}
        initialDepartment={activeDept === "ELECTRONICS" ? "ELECTRONICS" : "FURNITURE"}
      />

      <PayInstallmentModal
        isOpen={Boolean(selectedPayPurchase)}
        onClose={() => setSelectedPayPurchase(null)}
        onSuccess={refreshAll}
        purchase={selectedPayPurchase}
      />

      <VendorManagementModal
        isOpen={isVendorManagerOpen}
        onClose={() => setIsVendorManagerOpen(false)}
        onVendorsUpdated={refreshAll}
        vendors={vendors}
        isOwner={isOwner}
      />

      <PurchaseDetailModal
        isOpen={Boolean(selectedDetailPurchase)}
        onClose={() => setSelectedDetailPurchase(null)}
        purchase={selectedDetailPurchase}
        onPayInstallment={(p) => setSelectedPayPurchase(p)}
        onReceiveStock={(p) => setSelectedReceiveStockPurchase(p)}
      />

      <ReceiveStockModal
        isOpen={Boolean(selectedReceiveStockPurchase)}
        onClose={() => setSelectedReceiveStockPurchase(null)}
        onSuccess={refreshAll}
        purchase={selectedReceiveStockPurchase}
      />
    </div>
  );
}

