"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import DashboardLoading from "./loading";
import { useDepartment } from "@/components/dashboard/department/DepartmentContext";
import TactileButton from "@/components/ui/TactileButton";
import SoldItemsHistoryModal from "@/components/dashboard/SoldItemsHistoryModal";
import WhatsAppConnectionSection from "@/components/dashboard/home/WhatsAppConnectionSection";
import OverduePaymentsSection from "@/components/dashboard/home/OverduePaymentsSection";
import DashboardKpiGrid from "@/components/dashboard/home/DashboardKpiGrid";
import DashboardAnalyticsGrid from "@/components/dashboard/home/DashboardAnalyticsGrid";
import QuickUtilitiesCard from "@/components/dashboard/home/QuickUtilitiesCard";
import DailySalesBreakdownModal from "@/components/dashboard/home/DailySalesBreakdownModal";

export default function DashboardPage() {
  const { department, config: deptConfig } = useDepartment();
  const statsUrl =
    department && department !== "ALL"
      ? `/api/v1/dashboard/stats?department=${encodeURIComponent(department)}`
      : "/api/v1/dashboard/stats";

  const { data: stats, mutate: mutateStats } = useSWR(statsUrl, fetcher, {
    dedupingInterval: 2000,
    refreshInterval: 15000,
    revalidateOnFocus: true,
  });
  const { data: notifications, mutate: mutateNotifications } = useSWR(
    "/api/v1/dashboard/notifications",
    fetcher,
    { dedupingInterval: 2000, refreshInterval: 15000, revalidateOnFocus: true }
  );
  const {
    data: overdueData,
    mutate: mutateOverdue,
    error: swrError,
  } = useSWR("/api/v1/due-payments?overdue=true", fetcher, {
    dedupingInterval: 2000,
    refreshInterval: 15000,
    revalidateOnFocus: true,
  });
  const { data: whatsappSettings, mutate: mutateWhatsappSettings } = useSWR<any>(
    "/api/v1/whatsapp/settings",
    fetcher,
    { dedupingInterval: 5000, revalidateOnFocus: true }
  );

  const [showTodaySalesModal, setShowTodaySalesModal] = useState(false);
  const [showSoldItemsModal, setShowSoldItemsModal] = useState(false);

  const loading = !stats || !notifications || !overdueData;
  const error = swrError ? "Failed to load dashboard metrics" : "";

  const fetchData = async () => {
    mutateStats();
    mutateNotifications();
    mutateOverdue();
    mutateWhatsappSettings();
  };

  if (loading) {
    return <DashboardLoading />;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 my-4 text-center">
        <h3 className="text-lg font-bold text-red-800 mb-2">
          Error Loading Dashboard
        </h3>
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchData}
          className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 pb-12">
      {/* Welcome & Quick Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5 sm:gap-4 bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <h2 className="text-lg sm:text-2xl font-bold text-black tracking-tight">
              Laxmi Electronics & Furnitures
            </h2>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-0.5 rounded-full text-[11px] sm:text-xs font-semibold border ${deptConfig.badgeBg} ${deptConfig.badgeText}`}
            >
              {department === "FURNITURE" ? (
                <img
                  src="/furniture-logo-icon.png"
                  alt="Furniture"
                  className="w-3.5 h-3.5 object-contain inline-block shrink-0"
                />
              ) : (
                <span>{deptConfig.icon}</span>
              )}
              <span>{deptConfig.label}</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Real-time {deptConfig.shortLabel.toLowerCase()} inventory status,
            billing, and order delivery overview.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:flex gap-2 sm:gap-2.5 items-center w-full md:w-auto">
          <TactileButton
            href="/bookings"
            variant="booking"
            size="md"
            className="w-full sm:w-auto text-xs sm:text-sm px-3 sm:px-4"
          >
            💍 Advance Bookings
          </TactileButton>
          <TactileButton
            href="/billing"
            variant="invoice"
            size="md"
            className="w-full sm:w-auto text-xs sm:text-sm px-3 sm:px-4"
          >
            ➕ New Invoice
          </TactileButton>
        </div>
      </div>

      {/* WhatsApp Connection Banner & QR Pairing Modal */}
      <WhatsAppConnectionSection
        whatsappSettings={whatsappSettings}
        mutateWhatsappSettings={mutateWhatsappSettings}
      />

      {/* Overdue Payments Reminder */}
      <OverduePaymentsSection
        overdueData={overdueData}
        mutateOverdue={mutateOverdue}
        whatsappSettings={whatsappSettings}
      />

      {/* 6 KPI Cards */}
      <DashboardKpiGrid
        stats={stats}
        onOpenDailySales={() => setShowTodaySalesModal(true)}
      />

      {/* Charts, Alerts & Product Movement */}
      <DashboardAnalyticsGrid
        stats={stats}
        notifications={notifications}
        onOpenSoldItems={() => setShowSoldItemsModal(true)}
      />

      {/* Quick Management Utilities */}
      <QuickUtilitiesCard />

      {/* Daily Sales & Profit Breakdown Modal */}
      <DailySalesBreakdownModal
        isOpen={showTodaySalesModal}
        onClose={() => setShowTodaySalesModal(false)}
      />

      {/* Sold Items History Modal */}
      <SoldItemsHistoryModal
        isOpen={showSoldItemsModal}
        onClose={() => setShowSoldItemsModal(false)}
      />
    </div>
  );
}
