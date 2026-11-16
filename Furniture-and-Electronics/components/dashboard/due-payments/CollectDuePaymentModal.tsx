"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import {
  FaMoneyBillWave,
  FaTimes,
  FaExclamationCircle,
} from "react-icons/fa";

export interface CollectDuePaymentModalBill {
  id: number;
  billNumber: string;
  totalAmount: number | string;
  paidAmount: number | string;
  dueAmount: number | string;
  customer?: {
    name?: string | null;
    phone?: string | null;
  } | null;
  customerPhone?: string | null;
  [key: string]: any;
}

export interface CollectDuePaymentModalProps {
  isOpen: boolean;
  bill: CollectDuePaymentModalBill | null;
  onClose: () => void;
  onSuccess?: (result: {
    billId: number;
    isFullyPaid: boolean;
    collectedAmount: number;
    updatedBill: any;
  }) => void;
}

export default function CollectDuePaymentModal({
  isOpen,
  bill,
  onClose,
  onSuccess,
}: CollectDuePaymentModalProps) {
  const [activeBill, setActiveBill] = useState<CollectDuePaymentModalBill | null>(null);
  const [collectAmount, setCollectAmount] = useState<string>("");
  const [collectPaymentMode, setCollectPaymentMode] = useState<string>("CASH");
  const [paymentNotes, setPaymentNotes] = useState<string>("");
  const [paymentError, setPaymentError] = useState<string>("");
  const [settling, setSettling] = useState<boolean>(false);

  useEffect(() => {
    if (bill) {
      setActiveBill(bill);
      const due = parseFloat(String(bill.dueAmount || 0));
      setCollectAmount(due > 0 ? due.toFixed(0) : "");
      setCollectPaymentMode("CASH");
      setPaymentNotes("");
      setPaymentError("");
    }
  }, [bill, isOpen]);

  if (!isOpen || (!bill && !activeBill)) return null;

  const currentPaymentBill = bill || activeBill;
  if (!currentPaymentBill) return null;

  const handleClose = () => {
    if (settling) return;
    setPaymentError("");
    onClose();
  };

  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPaymentBill) return;

    const currentDue = parseFloat(String(currentPaymentBill.dueAmount || 0));
    const payingAmount = parseFloat(collectAmount);

    if (isNaN(payingAmount) || payingAmount <= 0) {
      setPaymentError("Please enter a valid payment amount greater than ₹0.");
      return;
    }

    if (payingAmount > currentDue + 0.01) {
      setPaymentError(
        `Payment cannot exceed outstanding due of ₹${currentDue.toLocaleString("en-IN")}.`
      );
      return;
    }

    const billId = currentPaymentBill.id;
    try {
      setSettling(true);
      setPaymentError("");

      const res = await fetch(`/api/v1/due-payments/${billId}/settle`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountPaid: payingAmount,
          paymentMode: collectPaymentMode,
          notes: paymentNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to record payment");
      }

      const isFullyPaid = data.isFullyPaid;
      const updatedBillData = data.bill;
      const collectedAmount = data.collectedAmount;

      // Dispatch WhatsApp receipt automatically if customer has a phone
      const customerPhone =
        currentPaymentBill.customer?.phone || currentPaymentBill.customerPhone;
      if (customerPhone) {
        try {
          const fullBill = {
            ...currentPaymentBill,
            paidAmount: updatedBillData.paidAmount,
            dueAmount: updatedBillData.dueAmount,
            paymentStatus: updatedBillData.paymentStatus,
            isSettled: isFullyPaid,
          };

          const { generateBillPdfBlob } = await import("@/lib/client-pdf");
          const blob = await generateBillPdfBlob(fullBill);

          const formData = new FormData();
          formData.append("file", blob, `Laxmi_Invoice_${fullBill.billNumber}.pdf`);
          formData.append(
            "customerName",
            fullBill.customer?.name || "Customer"
          );
          formData.append("mobileNumber", customerPhone);
          formData.append("billNumber", fullBill.billNumber);

          const { formatDuePaymentMessage } = await import("@/lib/whatsapp/templates");
          const receiptMsg = formatDuePaymentMessage({
            customerName: fullBill.customer?.name || "Customer",
            billNumber: fullBill.billNumber,
            installmentAmount: collectedAmount,
            paymentMode: collectPaymentMode || "Cash / UPI",
            paymentDate: new Date().toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            }),
            totalAmount: Number(fullBill.totalAmount),
            paidAmount: Number(updatedBillData.paidAmount),
            dueAmount: Number(updatedBillData.dueAmount),
            isFullyPaid,
          });

          formData.append("customMessage", receiptMsg);

          await fetch(`/api/v1/bills/${fullBill.id}/whatsapp/upload`, {
            method: "POST",
            body: formData,
          });
        } catch (e) {
          console.error("Failed to send WhatsApp payment receipt:", e);
        }
      }

      if (onSuccess) {
        onSuccess({
          billId,
          isFullyPaid,
          collectedAmount,
          updatedBill: updatedBillData,
        });
      }

      handleClose();
    } catch (err: any) {
      console.error(err);
      setPaymentError(err.message || "Failed to process payment. Please try again.");
    } finally {
      setSettling(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      containerClassName="max-w-lg"
      className="bg-[#F6F4F1] rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-[#E4DFD8] p-0"
    >
      {/* Modal Header */}
      <div className="flex justify-between items-center px-6 py-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
            <FaMoneyBillWave className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-black text-gray-900">Collect Due Payment</h3>
            <p className="text-xs text-gray-500 font-medium">
              Bill #{currentPaymentBill.billNumber} • {currentPaymentBill.customer?.name || "Customer"}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleClose}
          disabled={settling}
          className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-200 transition"
        >
          <FaTimes className="w-4 h-4" />
        </button>
      </div>

      {/* Modal Form */}
      <form onSubmit={handleConfirmPayment} className="p-6 space-y-4">
        {/* Bill Financial Summary Grid */}
        <div className="grid grid-cols-3 gap-2.5 p-3.5 bg-gray-50 rounded-xl border border-gray-200 text-center">
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase">Total Bill</p>
            <p className="text-sm font-extrabold text-gray-900 mt-0.5">
              ₹{Number(currentPaymentBill.totalAmount).toLocaleString("en-IN")}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase">Already Paid</p>
            <p className="text-sm font-extrabold text-emerald-700 mt-0.5">
              ₹{Number(currentPaymentBill.paidAmount).toLocaleString("en-IN")}
            </p>
          </div>
          <div className="bg-red-50/80 rounded-lg py-1 border border-red-200">
            <p className="text-[10px] font-black text-red-600 uppercase">Current Due</p>
            <p className="text-sm font-black text-red-700 mt-0.5">
              ₹{Number(currentPaymentBill.dueAmount).toLocaleString("en-IN")}
            </p>
          </div>
        </div>

        {/* Amount to Collect Input */}
        <div>
          <div className="flex justify-between items-baseline mb-1.5">
            <label className="text-xs font-bold text-gray-700">
              Payment Amount to Collect (₹) <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={() =>
                setCollectAmount(
                  parseFloat(String(currentPaymentBill?.dueAmount || 0)).toFixed(0)
                )
              }
              className="text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline"
            >
              Pay Full (₹{Number(currentPaymentBill?.dueAmount || 0).toLocaleString("en-IN")})
            </button>
          </div>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold">
              ₹
            </span>
            <input
              type="number"
              min="1"
              max={parseFloat(String(currentPaymentBill?.dueAmount || 0))}
              step="any"
              value={collectAmount}
              onChange={(e) => {
                setCollectAmount(e.target.value);
                setPaymentError("");
              }}
              required
              placeholder="Enter collected amount"
              className="w-full pl-8 pr-4 py-2.5 bg-white border border-gray-300 rounded-xl font-mono text-base font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Payment Mode Selection */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1.5">
            Payment Mode
          </label>
          <div className="grid grid-cols-4 gap-2">
            {["CASH", "UPI", "CARD", "NET_BANKING"].map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setCollectPaymentMode(mode)}
                className={`py-2 text-xs font-bold rounded-lg border transition ${
                  collectPaymentMode === mode
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                    : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                }`}
              >
                {mode.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        {/* Notes / Reference */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">
            Payment Notes / Ref <span className="text-gray-400 font-normal">(Optional)</span>
          </label>
          <input
            type="text"
            value={paymentNotes}
            onChange={(e) => setPaymentNotes(e.target.value)}
            placeholder="e.g. UPI Ref #, Cheque No, Received in cash"
            className="w-full px-3.5 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Live Balance Preview */}
        {(() => {
          const paying = parseFloat(collectAmount) || 0;
          const currentDue = parseFloat(String(currentPaymentBill?.dueAmount || 0));
          const currentPaid = parseFloat(String(currentPaymentBill?.paidAmount || 0));
          const newPaid = currentPaid + paying;
          const newRemainingDue = Math.max(0, currentDue - paying);
          const isFull = newRemainingDue === 0 && paying > 0;

          return (
            <div
              className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                isFull
                  ? "bg-emerald-50/70 border-emerald-300 text-emerald-900"
                  : paying > 0
                  ? "bg-amber-50/70 border-amber-300 text-amber-900"
                  : "bg-gray-50 border-gray-200 text-gray-700"
              }`}
            >
              <div className="flex justify-between font-medium">
                <span>After this payment:</span>
                <span className="font-bold">
                  {isFull ? (
                    <span className="text-emerald-700 font-extrabold">
                      ✓ Fully Settled
                    </span>
                  ) : (
                    <span className="text-amber-800 font-extrabold">
                      🟡 Partial Installment
                    </span>
                  )}
                </span>
              </div>
              <div className="flex justify-between text-[11px] pt-1 border-t border-gray-200/60">
                <span>New Total Paid: ₹{newPaid.toLocaleString("en-IN")}</span>
                <span className="font-black">
                  Remaining Due: ₹{newRemainingDue.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          );
        })()}

        {paymentError && (
          <div className="flex items-center gap-2 p-2.5 bg-red-50 text-red-600 rounded-lg text-xs font-semibold border border-red-200">
            <FaExclamationCircle className="w-4 h-4 flex-shrink-0" />
            <span>{paymentError}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={settling}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-100 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={settling}
            className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-sm hover:shadow disabled:opacity-50"
          >
            {settling ? (
              <>
                <div className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" />
                <span>Recording...</span>
              </>
            ) : (
              <span>Confirm Payment</span>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
