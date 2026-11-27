"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Modal } from "@/components/ui/modal";
import { FinanceRecordItem, FinanceProviderItem } from "@/hooks/useFinanceRecords";
import { FinanceWhatsAppRecipient } from "@/lib/whatsapp/background-finance-dispatch";
import { FaWhatsapp, FaTimes, FaPaperPlane, FaUsers } from "react-icons/fa";

interface FinanceWhatsAppResendModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: FinanceRecordItem | null;
  providers: FinanceProviderItem[];
  onSend: (
    record: FinanceRecordItem,
    recipients: FinanceWhatsAppRecipient[]
  ) => void;
}

export default function FinanceWhatsAppResendModal({
  isOpen,
  onClose,
  record,
  providers,
  onSend,
}: FinanceWhatsAppResendModalProps) {
  const [selectedContactIds, setSelectedContactIds] = useState<number[]>([]);

  const contacts = useMemo(() => {
    if (!record) return [];
    const provider = providers.find((p) => p.id === record.financeProviderId);
    return provider?.contacts || [];
  }, [record, providers]);

  useEffect(() => {
    if (isOpen) {
      setSelectedContactIds([]);
    }
  }, [isOpen, record?.id]);

  if (!isOpen || !record) return null;

  const handleConfirmSend = () => {
    const selectedRecipients: FinanceWhatsAppRecipient[] = contacts
      .filter((c) => selectedContactIds.includes(c.id))
      .map((c) => ({ name: c.name, phone: c.phone }));

    if (selectedRecipients.length === 0) return;
    onSend(record, selectedRecipients);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden border border-gray-200"
    >
      {/* Header */}
      <div className="px-5 py-4 bg-gradient-to-r from-emerald-800 to-emerald-700 text-white flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
            <FaWhatsapp className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-extrabold truncate">
              Send Finance Invoice PDF
            </h3>
            <p className="text-[11px] text-emerald-100 truncate">
              #{record.invoiceNumber} · {record.customerName} ({record.providerName})
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-white/75 hover:text-white p-1 transition shrink-0"
        >
          <FaTimes className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="p-4 sm:p-5 overflow-y-auto flex-1">
        {contacts.length === 0 ? (
          <div className="text-center py-6 px-3 bg-gray-50 rounded-xl border border-gray-200">
            <FaUsers className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-gray-700">
              No representatives added for {record.providerName}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Add WhatsApp contacts in <strong>Manage Providers</strong> first, then try again.
            </p>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-extrabold uppercase tracking-wider text-gray-600">
                Select {record.providerName} Representatives
              </span>
              {contacts.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    setSelectedContactIds(
                      selectedContactIds.length === contacts.length
                        ? []
                        : contacts.map((c) => c.id)
                    )
                  }
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-900 underline"
                >
                  {selectedContactIds.length === contacts.length
                    ? "Clear All"
                    : "Select All"}
                </button>
              )}
            </div>

            <div className="space-y-2">
              {contacts.map((contact) => {
                const checked = selectedContactIds.includes(contact.id);
                return (
                  <label
                    key={contact.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${
                      checked
                        ? "bg-emerald-50 border-emerald-400 text-emerald-950"
                        : "bg-gray-50/70 border-gray-200 text-gray-800 hover:bg-gray-100/70"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        setSelectedContactIds((prev) =>
                          prev.includes(contact.id)
                            ? prev.filter((id) => id !== contact.id)
                            : [...prev, contact.id]
                        )
                      }
                      className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold truncate">{contact.name}</div>
                      <div className="text-xs text-gray-500 font-medium">
                        +91 {contact.phone}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 sm:px-5 py-3.5 bg-gray-50 border-t flex justify-end gap-2 shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-xl border border-gray-300 bg-white text-gray-700 text-xs font-bold hover:bg-gray-50 transition"
        >
          Cancel
        </button>
        {contacts.length > 0 && (
          <button
            type="button"
            disabled={selectedContactIds.length === 0}
            onClick={handleConfirmSend}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-b from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white text-xs font-extrabold border border-emerald-800 border-b-2 border-b-emerald-950 shadow-sm active:translate-y-px transition disabled:opacity-50"
          >
            <FaPaperPlane className="w-3 h-3" />
            <span>
              Resend PDF{" "}
              {selectedContactIds.length > 0
                ? `(${selectedContactIds.length})`
                : ""}
            </span>
          </button>
        )}
      </div>
    </Modal>
  );
}
