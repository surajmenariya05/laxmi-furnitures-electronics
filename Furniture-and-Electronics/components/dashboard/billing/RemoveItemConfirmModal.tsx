"use client";

import React, { useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { FaUndo, FaExclamationTriangle, FaTimes } from "react-icons/fa";

interface RemoveItemConfirmModalProps {
  isOpen: boolean;
  itemName: string;
  quantity: number;
  serialNumber?: string | null;
  isBookingLinked?: boolean;
  isSubmitting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function RemoveItemConfirmModal({
  isOpen,
  itemName,
  quantity,
  serialNumber,
  isBookingLinked,
  isSubmitting,
  onConfirm,
  onCancel,
}: RemoveItemConfirmModalProps) {
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={isSubmitting ? () => {} : onCancel}
      className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-rose-200"
    >
      <div className="px-5 py-4 bg-rose-50 border-b border-rose-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
            <FaExclamationTriangle className="w-4 h-4" />
          </div>
          <h3 className="text-base font-extrabold text-gray-900">
            Remove Billed Item & Restore Stock?
          </h3>
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

      <div className="p-5 space-y-3 text-sm text-gray-700">
        <p>
          You are about to remove{" "}
          <span className="font-bold text-gray-900">{itemName}</span> from this
          bill.
        </p>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-1.5 text-xs text-amber-900">
          <div className="font-bold flex items-center gap-1.5">
            <FaUndo className="w-3 h-3 text-amber-700" />
            <span>Immediate Database Transaction:</span>
          </div>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              Restores <strong>+{quantity} unit(s)</strong> back into warehouse
              inventory.
            </li>
            {serialNumber && (
              <li>
                Unassigns Serial No.{" "}
                <span className="font-mono font-bold">{serialNumber}</span> and
                marks it <strong>In Stock</strong>.
              </li>
            )}
            <li>
              Deletes all record links of this item from the bill and
              recalculates invoice totals.
            </li>
            {isBookingLinked && (
              <li>
                Removes this item from the linked Advance Booking and updates
                its remaining balance.
              </li>
            )}
          </ul>
        </div>
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
          className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition disabled:opacity-50 flex items-center gap-1.5"
        >
          {isSubmitting ? "Restoring Stock..." : "Yes, Restore Stock & Remove"}
        </button>
      </div>
    </Modal>
  );
}
