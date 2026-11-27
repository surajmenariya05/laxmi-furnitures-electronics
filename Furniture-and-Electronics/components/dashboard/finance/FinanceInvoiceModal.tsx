"use client";

import React, { useRef } from "react";
import { Modal } from "@/components/ui/modal";
import { useReactToPrint } from "react-to-print";
import { FinanceRecordItem } from "@/hooks/useFinanceRecords";
import { FaPrint, FaTimes } from "react-icons/fa";
import FinanceInvoiceTemplate from "@/components/dashboard/finance/FinanceInvoiceTemplate";

interface FinanceInvoiceModalProps {
  record: FinanceRecordItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function FinanceInvoiceModal({
  record,
  isOpen,
  onClose,
}: FinanceInvoiceModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Laxmi_Finance_Invoice_${record?.invoiceNumber || ""}`,
    pageStyle: `
      @page { size: A4 portrait; margin: 10mm; }
      @media print {
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      }
    `,
  });

  if (!isOpen || !record) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="bg-[#FAF7F2] rounded-2xl shadow-2xl max-w-3xl w-full flex flex-col max-h-[92vh] overflow-hidden border border-[#E5DFD7]"
    >
      {/* Modal Bar */}
      <div className="px-4 sm:px-6 py-3 sm:py-3.5 bg-[#F3EDE3] border-b border-[#E5DFD7] flex justify-between items-center gap-2">
        <span className="text-[11px] sm:text-xs font-extrabold uppercase tracking-widest text-[#4A1018] truncate">
          Finance Tax Invoice · #{record.invoiceNumber}
        </span>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => handlePrint()}
            className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-lg bg-[#4A1018] hover:bg-[#3A0C12] text-white text-xs font-bold shadow-xs transition whitespace-nowrap"
          >
            <FaPrint className="w-3 h-3" />
            <span>Print</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-500 hover:text-gray-800 rounded-lg transition"
          >
            <FaTimes className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Editorial Luxury Invoice Body */}
      <div className="flex-1 overflow-auto p-3 sm:p-6 bg-[#EAE4DC]/60">
        <div ref={printRef}>
          <FinanceInvoiceTemplate record={record} />
        </div>
      </div>
    </Modal>
  );
}
