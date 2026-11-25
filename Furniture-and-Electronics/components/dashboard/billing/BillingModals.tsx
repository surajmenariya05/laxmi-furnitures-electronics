"use client";

import React from "react";
import { Modal } from "@/components/ui/modal";
import InvoiceTemplate from "@/components/dashboard/InvoiceTemplate";

interface BillingModalsProps {
  showPrintModal: boolean;
  createdBill: any;
  activeCreatedBill: any;
  closePrintModal: () => void;
  handlePrint: () => void;
  printComponentRef: React.RefObject<HTMLDivElement | null>;
  isEditMode: boolean;
  customerName: string;
  customerAddress: string;
  phone: string;
  showUpiModal: boolean;
  setShowUpiModal: (open: boolean) => void;
}

export default function BillingModals({
  showPrintModal,
  createdBill,
  activeCreatedBill,
  closePrintModal,
  handlePrint,
  printComponentRef,
  isEditMode,
  customerName,
  customerAddress,
  phone,
  showUpiModal,
  setShowUpiModal,
}: BillingModalsProps) {
  return (
    <>
      {/* PRINT RECEIPT MODAL */}
      <Modal
        isOpen={Boolean(showPrintModal && createdBill)}
        onClose={closePrintModal}
        className="bg-[#FAF6F0] rounded-2xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh] overflow-hidden border border-[#E5DFD7]"
      >
        {activeCreatedBill && (
          <>
            <div className="px-6 py-4 bg-gray-50 border-b flex justify-between items-center rounded-t-lg">
              <h3 className="text-lg font-bold text-gray-900">
                {isEditMode
                  ? "Tax Invoice Updated Successfully"
                  : "Tax Invoice Generated Successfully"}
              </h3>
              <button
                type="button"
                onClick={closePrintModal}
                className="text-gray-400 hover:text-gray-500 text-2xl font-semibold focus:outline-none"
              >
                &times;
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-gray-100">
              <div
                ref={printComponentRef}
                className="p-1"
                style={{ width: "100%", maxWidth: "800px", margin: "0 auto" }}
              >
                <InvoiceTemplate
                  isDraft={false}
                  billNumber={activeCreatedBill.billNumber}
                  createdAt={activeCreatedBill.createdAt}
                  customerName={
                    activeCreatedBill.customer?.name || customerName || "Guest Customer"
                  }
                  customerAddress={
                    activeCreatedBill.customer?.address || customerAddress || undefined
                  }
                  customerPhone={activeCreatedBill.customer?.phone || phone}
                  cartItems={activeCreatedBill.billItems}
                  subtotal={parseFloat(activeCreatedBill.subtotal)}
                  grossTotal={parseFloat(activeCreatedBill.totalAmount)}
                  discount={parseFloat(activeCreatedBill.discount)}
                  totalAmount={parseFloat(activeCreatedBill.totalAmount)}
                  sgstPercent={activeCreatedBill.sgstPercent?.toString()}
                  cgstPercent={activeCreatedBill.cgstPercent?.toString()}
                  paidAmount={parseFloat(activeCreatedBill.paidAmount)}
                  dueAmount={parseFloat(activeCreatedBill.dueAmount)}
                  paymentMode={activeCreatedBill.paymentMode}
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3 rounded-b-lg">
              <button
                type="button"
                onClick={closePrintModal}
                className="bg-white border border-gray-300 rounded-md py-2 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-md py-2 px-5 text-sm"
              >
                Print Invoice
              </button>
            </div>
          </>
        )}
      </Modal>

      {/* UPI QR MODAL */}
      <Modal
        isOpen={showUpiModal}
        onClose={() => setShowUpiModal(false)}
        className="bg-[#FAF6F0] p-6 rounded-2xl shadow-2xl relative w-80 h-80 flex flex-col border border-[#E5DFD7]"
      >
        <button
          type="button"
          onClick={() => setShowUpiModal(false)}
          className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M6 18L18 6M6 6l12 12"
            ></path>
          </svg>
        </button>
        <div className="text-center mt-2">
          <h2 className="text-xl font-black text-gray-900 mb-1">UPI Payment</h2>
          <p className="text-xs text-gray-500 font-medium">
            Scan QR to pay using any UPI app
          </p>
        </div>

        <div className="flex-1 flex justify-center items-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 my-4 group hover:border-blue-400 transition-colors">
          <div className="text-7xl transform group-hover:scale-110 transition-transform duration-300">
            📱
          </div>
        </div>

        <div className="flex items-center justify-center px-4 py-2 bg-blue-50/50 rounded-lg border border-blue-100">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-xs font-semibold text-gray-700">
              Waiting for payment...
            </span>
          </div>
        </div>
      </Modal>
    </>
  );
}
