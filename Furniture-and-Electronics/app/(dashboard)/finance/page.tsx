"use client";

import React, { useState, useEffect } from "react";
import { FaCog, FaPlus, FaWallet } from "react-icons/fa";
import FinanceLoading from "./loading";
import { useFinanceRecords, FinanceRecordItem } from "@/hooks/useFinanceRecords";
import FinanceDateFilter from "@/components/dashboard/finance/FinanceDateFilter";
import FinanceKpiCards from "@/components/dashboard/finance/FinanceKpiCards";
import FinanceHistoryTable from "@/components/dashboard/finance/FinanceHistoryTable";
import FinanceFormModal from "@/components/dashboard/finance/FinanceFormModal";
import FinanceInvoiceModal from "@/components/dashboard/finance/FinanceInvoiceModal";
import ManageProvidersModal from "@/components/dashboard/finance/ManageProvidersModal";
import { useToast } from "@/components/dashboard/providers/ToastProvider";
import {
  dispatchFinanceWhatsAppInBackground,
  FinanceWhatsAppRecipient,
} from "@/lib/whatsapp/background-finance-dispatch";

export default function FinancePage() {
  const {
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
  } = useFinanceRecords();

  const { showToast } = useToast();
  const [showManageModal, setShowManageModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<FinanceRecordItem | null>(null);
  const [viewingRecord, setViewingRecord] = useState<FinanceRecordItem | null>(null);

  useEffect(() => {
    if (showManageModal) {
      mutateProviders();
    }
  }, [showManageModal, mutateProviders]);

  const handleOpenCreate = () => {
    setEditingRecord(null);
    setShowFormModal(true);
  };

  const handleOpenEdit = (record: FinanceRecordItem) => {
    setEditingRecord(record);
    setShowFormModal(true);
  };

  const handleSaveRecord = async (
    payload: any,
    editingId?: number,
    selectedRecipients?: FinanceWhatsAppRecipient[]
  ) => {
    if (editingId) {
      await updateRecord(editingId, payload);
    } else {
      const created = await createRecord(payload);
      if (created && selectedRecipients && selectedRecipients.length > 0) {
        dispatchFinanceWhatsAppInBackground({
          record: created,
          recipients: selectedRecipients,
          showToast,
        });
      }
    }
  };

  if (isLoading) {
    return <FinanceLoading />;
  }

  return (
    <div className="p-1 sm:p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-3.5 sm:gap-4 mb-5 sm:mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight flex items-center gap-2.5">
            <FaWallet className="text-blue-600 shrink-0" />
            <span>Finance Management</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 font-medium">
            Create, track, and print customer finance deals.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2.5 w-full lg:w-auto">
          <div className="flex items-center justify-between gap-2 w-full sm:w-auto">
            <FinanceDateFilter
              dateRange={dateRange}
              startDate={startDate}
              setStartDate={setStartDate}
              endDate={endDate}
              setEndDate={setEndDate}
              appliedCustomRange={appliedCustomRange}
              onSelectPreset={handleSelectPreset}
              onApplyCustomRange={handleApplyCustomRange}
            />

            {/* 3D Tactile Manage Providers Button */}
            <button
              type="button"
              onClick={() => setShowManageModal(true)}
              className="shrink-0 inline-flex items-center gap-1.5 sm:gap-2 h-10 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold text-[#1C1A17] bg-gradient-to-b from-white to-[#F3EFEA] hover:from-[#FAF6F0] hover:to-[#EAE3DA] border border-[#D7CFC5] border-b-2 border-b-[#B8AEA2] shadow-[0_2px_4px_rgba(28,26,23,0.08),inset_0_1px_0_rgba(255,255,255,0.95)] hover:shadow-md active:translate-y-px transition-all duration-200 whitespace-nowrap"
            >
              <FaCog className="w-3.5 h-3.5 text-gray-600" />
              <span>Manage Providers</span>
            </button>
          </div>

          {/* 3D Tactile Create Finance Button */}
          <button
            type="button"
            onClick={handleOpenCreate}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl text-sm font-extrabold text-white bg-gradient-to-b from-[#2E62EB] to-[#1D4ED8] hover:from-[#3B6EF0] hover:to-[#1E40AF] border border-[#1E40AF] border-b-2 border-b-[#172554] shadow-[0_2px_6px_rgba(29,78,216,0.28),inset_0_1px_0_rgba(255,255,255,0.3)] hover:shadow-md active:translate-y-px transition-all duration-200"
          >
            <FaPlus className="w-3 h-3" />
            <span>Create Finance</span>
          </button>
        </div>
      </div>

      {/* Top KPI Cards */}
      <FinanceKpiCards kpis={kpis} isOwner={isOwner} />

      {/* Finance History Table */}
      <FinanceHistoryTable
        records={records}
        isOwner={isOwner}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onEdit={handleOpenEdit}
        onView={(rec) => setViewingRecord(rec)}
      />

      {/* Modals */}
      <FinanceFormModal
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        editingRecord={editingRecord}
        providers={providers}
        isOwner={isOwner}
        onSave={handleSaveRecord}
      />

      <FinanceInvoiceModal
        record={viewingRecord}
        isOpen={Boolean(viewingRecord)}
        onClose={() => setViewingRecord(null)}
      />

      <ManageProvidersModal
        isOpen={showManageModal}
        onClose={() => setShowManageModal(false)}
        providers={providers}
        mutateProviders={mutateProviders}
      />
    </div>
  );
}
