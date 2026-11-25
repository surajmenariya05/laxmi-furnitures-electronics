"use client";

import React, { useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { FaCheckCircle, FaTimes, FaWhatsapp, FaEdit } from "react-icons/fa";

interface EditBillSummaryModalProps {
  isOpen: boolean;
  billNumber: string;
  previousTotal: number;
  newTotal: number;
  previousPaid: number;
  requestedPaid: number;
  addedItems: Array<{ name: string; quantity: number; lineTotal: number }>;
  modifiedItems: Array<{ name: string; quantity: number; lineTotal: number }>;
  hasCustomerPhone: boolean;
  isSubmitting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function EditBillSummaryModal({
  isOpen,
  billNumber,
  previousTotal,
  newTotal,
  requestedPaid,
  addedItems,
  modifiedItems,
  hasCustomerPhone,
  isSubmitting,
  onConfirm,
  onCancel,
}: EditBillSummaryModalProps) {
  useEffect(() => {
    if (!isOpen || isSubmitting) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        onConfirm();
      } else if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, onConfirm, onCancel]);

  if (!isOpen) return null;

  const totalDiff = newTotal - previousTotal;
  const refundedDiff = Math.max(0, requestedPaid - newTotal);
  const finalDue = Math.max(0, newTotal - Math.min(requestedPaid, newTotal));

  return (
    <Modal
      isOpen={isOpen}
      onClose={isSubmitting ? () => {} : onCancel}
      className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-indigo-200"
    >
      <div className="px-5 py-4 bg-indigo-50 border-b border-indigo-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center">
            <FaEdit className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-gray-900">
              Confirm Bill Modifications
            </h3>
            <p className="text-[11px] font-mono font-bold text-indigo-700">
              Invoice #{billNumber}
            </p>
          </div>
        </div>
        {!isSubmitting && (
          <button
            type="button"
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <FaTimes className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="p-5 space-y-4 text-sm text-gray-700 max-h-[65vh] overflow-y-auto">
        {addedItems.length > 0 && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
            <div className="text-xs font-extrabold text-emerald-900 uppercase tracking-wider mb-1.5">
              + Newly Added Items (Stock Will Be Deducted)
            </div>
            <ul className="space-y-1 text-xs text-emerald-900">
              {addedItems.map((item, idx) => (
                <li key={idx} className="flex justify-between font-medium">
                  <span>
                    {item.name} × {item.quantity}
                  </span>
                  <span className="font-bold">
                    ₹{item.lineTotal.toLocaleString("en-IN")}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {modifiedItems.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
            <div className="text-xs font-extrabold text-blue-900 uppercase tracking-wider mb-1.5">
              Updated Existing Items (Rate / Qty Changed)
            </div>
            <ul className="space-y-1 text-xs text-blue-900">
              {modifiedItems.map((item, idx) => (
                <li key={idx} className="flex justify-between font-medium">
                  <span>
                    {item.name} × {item.quantity}
                  </span>
                  <span className="font-bold">
                    ₹{item.lineTotal.toLocaleString("en-IN")}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Financial Summary */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5 space-y-2 text-xs">
          <div className="flex justify-between text-gray-600">
            <span>Previous Bill Total</span>
            <span className="font-semibold">
              ₹{previousTotal.toLocaleString("en-IN")}
            </span>
          </div>
          <div className="flex justify-between text-gray-900 text-sm font-extrabold border-t border-gray-200 pt-2">
            <span>New Bill Total</span>
            <span>
              ₹{newTotal.toLocaleString("en-IN")}{" "}
              {totalDiff !== 0 && (
                <span
                  className={`text-xs ml-1 ${
                    totalDiff > 0 ? "text-amber-700" : "text-emerald-700"
                  }`}
                >
                  ({totalDiff > 0 ? "+" : ""}
                  ₹{totalDiff.toLocaleString("en-IN")})
                </span>
              )}
            </span>
          </div>

          {refundedDiff > 0 ? (
            <div className="mt-2 p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 font-bold flex justify-between">
              <span>Marked Refund / Adjustment:</span>
              <span>₹{refundedDiff.toLocaleString("en-IN")}</span>
            </div>
          ) : (
            <div className="flex justify-between text-gray-700 font-semibold pt-1">
              <span>Remaining Due After Update</span>
              <span className={finalDue > 0 ? "text-rose-700 font-bold" : "text-emerald-700 font-bold"}>
                {finalDue > 0 ? `₹${finalDue.toLocaleString("en-IN")}` : "Paid in Full"}
              </span>
            </div>
          )}
        </div>

        {hasCustomerPhone && (
          <div className="flex items-center gap-2 text-xs text-emerald-800 bg-emerald-50/70 border border-emerald-200 rounded-lg px-3 py-2 font-medium">
            <FaWhatsapp className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              The revised PDF invoice & update message will automatically be
              sent to the customer on WhatsApp.
            </span>
          </div>
        )}
      </div>

      <div className="px-5 py-3.5 bg-gray-50 border-t border-gray-100 flex justify-end gap-2.5">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 text-xs font-bold hover:bg-gray-50 transition disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isSubmitting}
          className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition disabled:opacity-50 flex items-center gap-1.5"
        >
          <FaCheckCircle className="w-3.5 h-3.5" />
          <span>{isSubmitting ? "Updating Bill..." : "Confirm & Update Bill"}</span>
        </button>
      </div>
    </Modal>
  );
}
