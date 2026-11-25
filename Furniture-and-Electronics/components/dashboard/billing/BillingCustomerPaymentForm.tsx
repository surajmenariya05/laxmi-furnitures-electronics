"use client";

import React from "react";

interface BillingCustomerPaymentFormProps {
  phone: string;
  handlePhoneChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isSearchingCustomer: boolean;
  customerName: string;
  setCustomerName: (val: string) => void;
  customerAddress: string;
  setCustomerAddress: (val: string) => void;
  paymentMode: string;
  setPaymentMode: (mode: string) => void;
  onOpenUpiModal: () => void;
  discount: string;
  setDiscount: (val: string) => void;
  sgstPercent: string;
  setSgstPercent: (val: string) => void;
  cgstPercent: string;
  setCgstPercent: (val: string) => void;
  paidAmount: string;
  setPaidAmount: (val: string) => void;
  grossTotal: number;
  totalAmount: number;
  cartLength: number;
  isSaving: boolean;
  isEditMode: boolean;
  onCheckout: () => void;
  handleNumberKeyDown: (e: React.KeyboardEvent<HTMLInputElement>, allowDecimal?: boolean) => void;
}

export default function BillingCustomerPaymentForm({
  phone,
  handlePhoneChange,
  isSearchingCustomer,
  customerName,
  setCustomerName,
  customerAddress,
  setCustomerAddress,
  paymentMode,
  setPaymentMode,
  onOpenUpiModal,
  discount,
  setDiscount,
  sgstPercent,
  setSgstPercent,
  cgstPercent,
  setCgstPercent,
  paidAmount,
  setPaidAmount,
  grossTotal,
  totalAmount,
  cartLength,
  isSaving,
  isEditMode,
  onCheckout,
  handleNumberKeyDown,
}: BillingCustomerPaymentFormProps) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
        {/* Customer Phone */}
        <div>
          <label className="block text-sm font-bold text-gray-700">
            Customer Phone (10 digits) <span className="text-red-500">*</span>
          </label>
          <div className="relative mt-1">
            <input
              type="text"
              placeholder="e.g. 9876543210"
              maxLength={10}
              className={`block w-full border-2 rounded-lg py-2 px-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-blue-100 ${
                phone && phone.length !== 10
                  ? "border-amber-400 focus:border-amber-500"
                  : "border-gray-300 focus:border-blue-600"
              }`}
              value={phone}
              onChange={handlePhoneChange}
              onKeyDown={(e) => handleNumberKeyDown(e, false)}
            />
            {isSearchingCustomer && (
              <span className="absolute right-3 top-2.5 text-xs text-blue-500 font-bold">
                Searching...
              </span>
            )}
          </div>
          {phone.trim() === "" ? (
            <span className="text-[10px] text-red-500 font-bold mt-1 block">
              Phone number is required
            </span>
          ) : phone.length !== 10 ? (
            <span className="text-[10px] text-amber-600 font-bold mt-1 block">
              Phone must be exactly 10 digits
            </span>
          ) : null}
        </div>

        {/* Customer Name */}
        <div>
          <label className="block text-sm font-bold text-gray-700">
            Customer Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="Enter customer name..."
            className={`mt-1 block w-full border-2 rounded-lg py-2 px-3 text-sm font-semibold transition focus:outline-none focus:ring-2 ${
              customerName.trim() === ""
                ? "border-red-400 focus:border-red-500 focus:ring-red-100 bg-red-50/20"
                : "border-gray-300 focus:border-blue-600 focus:ring-blue-100"
            }`}
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
          />
          {customerName.trim() === "" && (
            <span className="text-[10px] text-red-500 font-bold mt-1 block">
              Name is required
            </span>
          )}
        </div>

        {/* Customer Address */}
        <div className="col-span-1 md:col-span-2">
          <label className="block text-sm font-bold text-gray-700">
            Customer Address
          </label>
          <input
            type="text"
            placeholder="Enter customer address..."
            className="mt-1 block w-full border-2 rounded-lg py-2 px-3 text-sm font-semibold transition focus:outline-none focus:ring-2 border-gray-300 focus:border-blue-600 focus:ring-blue-100"
            value={customerAddress}
            onChange={(e) => setCustomerAddress(e.target.value)}
          />
        </div>

        {/* Payment Method */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">
            Payment Mode <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {["cash", "upi", "card"].map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => {
                  setPaymentMode(mode);
                  if (mode === "upi") {
                    onOpenUpiModal();
                  }
                }}
                className={`py-2 text-center rounded-lg border-2 capitalize text-xs font-bold transition ${
                  paymentMode === mode
                    ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                    : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Discount Amount */}
        <div>
          <label className="block text-sm font-bold text-gray-700">
            Discount Amount (₹)
          </label>
          <input
            type="number"
            min="0"
            max={grossTotal}
            placeholder="0"
            className={`mt-1 block w-full border-2 rounded-lg py-2 px-3 text-sm font-semibold focus:outline-none focus:ring-2 transition ${
              parseFloat(discount || "0") > grossTotal
                ? "border-red-400 focus:border-red-500 focus:ring-red-100 bg-red-50/20"
                : "border-gray-300 focus:border-blue-600 focus:ring-blue-100"
            }`}
            value={discount}
            onChange={(e) => setDiscount(e.target.value)}
            onKeyDown={(e) => handleNumberKeyDown(e, true)}
            onWheel={(e) => (e.target as HTMLInputElement).blur()}
          />
          {parseFloat(discount || "0") > grossTotal && (
            <span className="text-[10px] text-red-500 font-bold mt-1 block">
              Discount cannot exceed subtotal (₹{grossTotal})
            </span>
          )}
        </div>
      </div>

      {/* GST Tax Inputs */}
      <div className="grid grid-cols-2 gap-4 border-t pt-4 mt-4">
        <div>
          <label className="block text-sm font-bold text-gray-700">SGST (%)</label>
          <input
            type="number"
            min="0"
            max="100"
            placeholder="0"
            className={`mt-1 block w-full border-2 rounded-lg py-2 px-3 text-sm font-semibold focus:outline-none focus:ring-2 transition ${
              parseFloat(sgstPercent) > 100
                ? "border-red-400 focus:border-red-500 focus:ring-red-100 bg-red-50/20"
                : "border-gray-300 focus:border-blue-600 focus:ring-blue-100"
            }`}
            value={sgstPercent}
            onChange={(e) => setSgstPercent(e.target.value)}
            onKeyDown={(e) => handleNumberKeyDown(e, true)}
            onWheel={(e) => (e.target as HTMLInputElement).blur()}
          />
          {parseFloat(sgstPercent) > 100 && (
            <span className="text-[10px] text-red-500 font-bold mt-1 block">
              Invalid value. Max 100%
            </span>
          )}
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700">CGST (%)</label>
          <input
            type="number"
            min="0"
            max="100"
            placeholder="0"
            className={`mt-1 block w-full border-2 rounded-lg py-2 px-3 text-sm font-semibold focus:outline-none focus:ring-2 transition ${
              parseFloat(cgstPercent) > 100
                ? "border-red-400 focus:border-red-500 focus:ring-red-100 bg-red-50/20"
                : "border-gray-300 focus:border-blue-600 focus:ring-blue-100"
            }`}
            value={cgstPercent}
            onChange={(e) => setCgstPercent(e.target.value)}
            onKeyDown={(e) => handleNumberKeyDown(e, true)}
            onWheel={(e) => (e.target as HTMLInputElement).blur()}
          />
          {parseFloat(cgstPercent) > 100 && (
            <span className="text-[10px] text-red-500 font-bold mt-1 block">
              Invalid value. Max 100%
            </span>
          )}
        </div>
      </div>

      {/* Amount Paid */}
      <div className="border-t pt-4 mt-4">
        <label className="block text-sm font-bold text-gray-700">
          Amount Paid (₹){" "}
          <span className="text-gray-400 text-xs ml-1 font-normal">
            (Leave empty if full payment)
          </span>
        </label>
        <input
          type="number"
          min="0"
          max={totalAmount}
          className="mt-1 block w-full border-2 border-gray-300 rounded-lg py-2 px-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600 transition bg-green-50"
          placeholder={`e.g. ${totalAmount}`}
          value={paidAmount}
          onChange={(e) => setPaidAmount(e.target.value)}
          onKeyDown={(e) => handleNumberKeyDown(e, true)}
          onWheel={(e) => (e.target as HTMLInputElement).blur()}
        />
      </div>

      {/* Generate / Modify Invoice Button */}
      <div className="border-t pt-4 mt-4">
        <button
          type="button"
          onClick={onCheckout}
          disabled={
            isSaving ||
            cartLength === 0 ||
            (phone.trim().length > 0 && customerName.trim() === "") ||
            parseFloat(sgstPercent) > 100 ||
            parseFloat(cgstPercent) > 100 ||
            parseFloat(discount || "0") > grossTotal
          }
          className={`w-full text-white font-extrabold py-3.5 rounded-lg shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed text-sm uppercase tracking-wider ${
            isEditMode
              ? "bg-indigo-600 hover:bg-indigo-700"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {isSaving
            ? isEditMode
              ? "Updating Invoice..."
              : "Creating Invoice..."
            : isEditMode
            ? "Modify & Update Bill"
            : "Generate & Print Invoice"}
        </button>
      </div>
    </>
  );
}
