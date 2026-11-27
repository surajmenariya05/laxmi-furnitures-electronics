"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { FinanceRecordItem } from "@/hooks/useFinanceRecords";
import { FaWallet, FaTimes, FaCheckCircle, FaLock, FaChevronDown } from "react-icons/fa";

interface FinanceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingRecord: FinanceRecordItem | null;
  providers: any[];
  isOwner: boolean;
  onSave: (payload: any, editingId?: number) => Promise<void>;
}

export default function FinanceFormModal({
  isOpen,
  onClose,
  editingRecord,
  providers,
  isOwner,
  onSave,
}: FinanceFormModalProps) {
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [financeProviderId, setFinanceProviderId] = useState("");
  const [providerDropdownOpen, setProviderDropdownOpen] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [financeDate, setFinanceDate] = useState("");
  const [productName, setProductName] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [hsnSac, setHsnSac] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [productPrice, setProductPrice] = useState("");
  const [downpayment, setDownpayment] = useState("");
  const [netAmountReceived, setNetAmountReceived] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setError("");
    if (editingRecord) {
      setCustomerName(editingRecord.customerName || "");
      setCustomerPhone(editingRecord.customerPhone || "");
      setCustomerAddress(editingRecord.customerAddress || "");
      setFinanceProviderId(String(editingRecord.financeProviderId || ""));
      setInvoiceNumber(editingRecord.invoiceNumber || "");
      setFinanceDate(
        editingRecord.financeDate
          ? new Date(editingRecord.financeDate).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0]
      );
      setProductName(editingRecord.productName || "");
      setSerialNumber(editingRecord.serialNumber || "");
      setHsnSac(editingRecord.hsnSac || "");
      setQuantity(String(editingRecord.quantity || 1));
      setProductPrice(String(editingRecord.productPrice || ""));
      setDownpayment(String(editingRecord.downpayment || 0));
      setNetAmountReceived(
        isOwner ? String(editingRecord.netAmountReceived ?? "") : ""
      );
    } else {
      setCustomerName("");
      setCustomerPhone("");
      setCustomerAddress("");
      setFinanceProviderId(providers[0]?.id ? String(providers[0].id) : "");
      setInvoiceNumber("");
      setFinanceDate(new Date().toISOString().split("T")[0]);
      setProductName("");
      setSerialNumber("");
      setHsnSac("");
      setQuantity("1");
      setProductPrice("");
      setDownpayment("0");
      setNetAmountReceived("");
    }
  }, [isOpen, editingRecord, providers, isOwner]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      setError("Customer Name is required");
      return;
    }
    if (!financeProviderId) {
      setError("Please select a Finance Provider");
      return;
    }
    if (!productName.trim()) {
      setError("Product / Item Name is required");
      return;
    }
    if (!productPrice || Number(productPrice) <= 0) {
      setError("Please enter a valid Product Price");
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      const payload: any = {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerAddress: customerAddress.trim(),
        financeProviderId: parseInt(financeProviderId, 10),
        invoiceNumber: invoiceNumber.trim(),
        financeDate,
        productName: productName.trim(),
        serialNumber: serialNumber.trim(),
        hsnSac: hsnSac.trim(),
        quantity: Math.max(1, parseInt(quantity, 10) || 1),
        productPrice: parseFloat(productPrice),
        downpayment: parseFloat(downpayment || "0") || 0,
      };
      if (isOwner) {
        payload.netAmountReceived = parseFloat(netAmountReceived || "0") || 0;
      }

      await onSave(payload, editingRecord?.id);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to save finance record");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={submitting ? () => {} : onClose}
      className="bg-[#FAF7F2] rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-[#E5DFD7]"
    >
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-[#1C1A17] to-[#2F2A24] text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
            <FaWallet className="w-4 h-4 text-amber-300" />
          </div>
          <div>
            <h3 className="text-base font-extrabold tracking-tight">
              {editingRecord
                ? `Edit Finance #${editingRecord.invoiceNumber}`
                : "Create New Finance Record"}
            </h3>
            <p className="text-[11px] text-white/70">
              Enter customer, product, downpayment & settlement details
            </p>
          </div>
        </div>
        {!submitting && (
          <button
            type="button"
            onClick={onClose}
            className="text-white/70 hover:text-white transition"
          >
            <FaTimes className="w-4 h-4" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
            {error}
          </div>
        )}

        {/* Customer Details */}
        <div className="bg-white p-4 rounded-xl border border-[#E5DFD7] space-y-3">
          <div className="text-xs font-extrabold uppercase tracking-wider text-gray-500">
            Customer Details
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Customer Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. MUKESH KUMAR LAXKAR"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Mobile Number
              </label>
              <input
                type="text"
                maxLength={10}
                placeholder="10-digit mobile number"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, ""))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Address
              </label>
              <input
                type="text"
                placeholder="Customer address..."
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Product & Finance Info */}
        <div className="bg-white p-4 rounded-xl border border-[#E5DFD7] space-y-3">
          <div className="text-xs font-extrabold uppercase tracking-wider text-gray-500">
            Product & Finance Info
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="relative">
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Finance Provider <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setProviderDropdownOpen((prev) => !prev)}
                className="w-full flex items-center justify-between gap-2 border border-gray-300 rounded-lg px-3 py-2 text-sm font-semibold bg-white text-left focus:outline-none focus:border-indigo-500"
              >
                <span className={`truncate ${financeProviderId ? "text-gray-900" : "text-gray-400"}`}>
                  {providers.find((p: any) => String(p.id) === String(financeProviderId))?.name ||
                    "Select Provider..."}
                </span>
                <FaChevronDown
                  className={`w-3 h-3 text-gray-400 shrink-0 transition-transform ${
                    providerDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {providerDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setProviderDropdownOpen(false)}
                  />
                  <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-white border border-gray-200 rounded-xl shadow-lg max-h-52 overflow-y-auto py-1">
                    <button
                      type="button"
                      onClick={() => {
                        setFinanceProviderId("");
                        setProviderDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-indigo-50 transition-colors ${
                        !financeProviderId
                          ? "bg-indigo-50 font-bold text-indigo-700"
                          : "text-gray-500"
                      }`}
                    >
                      Select Provider...
                    </button>
                    {providers.map((p: any) => {
                      const isSelected = String(p.id) === String(financeProviderId);
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setFinanceProviderId(String(p.id));
                            setProviderDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-indigo-50 transition-colors truncate ${
                            isSelected
                              ? "bg-indigo-50 font-bold text-indigo-700"
                              : "text-gray-800 font-medium"
                          }`}
                        >
                          {p.name}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Invoice No.
              </label>
              <input
                type="text"
                placeholder="Auto-generated if blank"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono font-semibold focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                value={financeDate}
                onChange={(e) => setFinanceDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Item / Product Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. ROYALOAK COMBOS - 1 bed and 1 mattress"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="md:col-span-3 grid grid-cols-12 gap-2.5">
              <div className="col-span-12 sm:col-span-6">
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Serial No. / S/N
                </label>
                <input
                  type="text"
                  placeholder="Optional S/N"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono font-semibold focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="col-span-6 sm:col-span-3">
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  HSN / SAC
                </label>
                <input
                  type="text"
                  placeholder="Optional"
                  value={hsnSac}
                  onChange={(e) => setHsnSac(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-2.5 py-2 text-sm font-semibold focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="col-span-6 sm:col-span-3">
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Qty
                </label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  onWheel={(e) => (e.target as HTMLInputElement).blur()}
                  className="w-full border border-gray-300 rounded-lg px-2.5 py-2 text-sm font-semibold focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Financials */}
        <div className="bg-white p-4 rounded-xl border border-[#E5DFD7]">
          <div className="text-xs font-extrabold uppercase tracking-wider text-gray-500 mb-3">
            Financial Breakdown
          </div>
          <div className={`grid grid-cols-1 ${isOwner ? "md:grid-cols-3" : "md:grid-cols-2"} gap-3`}>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Product Price (₹) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="any"
                placeholder="e.g. 24000"
                value={productPrice}
                onChange={(e) => setProductPrice(e.target.value)}
                onWheel={(e) => (e.target as HTMLInputElement).blur()}
                className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm font-bold focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Downpayment (₹)
              </label>
              <input
                type="number"
                min="0"
                step="any"
                placeholder="0"
                value={downpayment}
                onChange={(e) => setDownpayment(e.target.value)}
                onWheel={(e) => (e.target as HTMLInputElement).blur()}
                className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm font-bold focus:outline-none focus:border-indigo-500"
              />
            </div>
            {isOwner && (
              <div>
                <label className="flex items-center gap-1 text-xs font-bold text-emerald-800 mb-1">
                  <FaLock className="w-2.5 h-2.5 text-emerald-600" />
                  <span>Net Amount Received in Bank (₹)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0"
                  value={netAmountReceived}
                  onChange={(e) => setNetAmountReceived(e.target.value)}
                  onWheel={(e) => (e.target as HTMLInputElement).blur()}
                  className="w-full border-2 border-emerald-300 bg-emerald-50/40 rounded-lg px-3 py-2 text-sm font-bold text-emerald-900 focus:outline-none focus:border-emerald-600"
                />
              </div>
            )}
          </div>
        </div>

        <div className="pt-2 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 rounded-xl border border-gray-300 bg-white text-gray-700 text-xs font-bold hover:bg-gray-50 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-b from-[#2E62EB] to-[#1D4ED8] hover:from-[#3B6EF0] hover:to-[#1E40AF] text-white text-xs font-extrabold border border-[#1E40AF] border-b-2 border-b-[#172554] shadow-sm active:translate-y-px transition disabled:opacity-50"
          >
            <FaCheckCircle className="w-3.5 h-3.5" />
            <span>
              {submitting
                ? "Saving..."
                : editingRecord
                ? "Update Finance Record"
                : "Save Finance Record"}
            </span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
