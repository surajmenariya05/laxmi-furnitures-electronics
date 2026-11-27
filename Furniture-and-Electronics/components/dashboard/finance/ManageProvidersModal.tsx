"use client";

import React, { useState } from "react";
import {
  FaPlus,
  FaTrash,
  FaChevronDown,
  FaChevronRight,
  FaPhoneAlt,
  FaUser,
} from "react-icons/fa";
import { Modal } from "@/components/ui/modal";
import { FinanceProviderItem } from "@/hooks/useFinanceRecords";

interface ManageProvidersModalProps {
  isOpen: boolean;
  onClose: () => void;
  providers: FinanceProviderItem[];
  mutateProviders: () => Promise<any>;
}

export default function ManageProvidersModal({
  isOpen,
  onClose,
  providers,
  mutateProviders,
}: ManageProvidersModalProps) {
  const [newProviderName, setNewProviderName] = useState("");
  const [isManaging, setIsManaging] = useState(false);

  // Per-provider inline add-person & expand state
  const [addingForProviderId, setAddingForProviderId] = useState<number | null>(null);
  const [personName, setPersonName] = useState("");
  const [personPhone, setPersonPhone] = useState("");
  const [personError, setPersonError] = useState("");
  const [savingPerson, setSavingPerson] = useState(false);
  const [expandedProviders, setExpandedProviders] = useState<Record<number, boolean>>({});

  const handleAddProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProviderName.trim()) return;

    try {
      setIsManaging(true);
      const res = await fetch("/api/v1/finance/providers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newProviderName }),
      });
      if (res.ok) {
        setNewProviderName("");
        await mutateProviders();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to add provider");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsManaging(false);
    }
  };

  const handleRemoveProvider = async (id: number) => {
    if (!confirm("Are you sure you want to remove this finance provider?")) return;

    try {
      const res = await fetch(`/api/v1/finance/providers/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await mutateProviders();
      }
    } catch (err) {
      console.error("Failed to remove provider", err);
    }
  };

  const handleToggleAddPerson = (providerId: number) => {
    if (addingForProviderId === providerId) {
      setAddingForProviderId(null);
      setPersonName("");
      setPersonPhone("");
      setPersonError("");
    } else {
      setAddingForProviderId(providerId);
      setPersonName("");
      setPersonPhone("");
      setPersonError("");
    }
  };

  const handleAddPerson = async (e: React.FormEvent, providerId: number) => {
    e.preventDefault();
    const trimmedName = personName.trim();
    const cleanedPhone = personPhone.replace(/[^0-9]/g, "");

    if (!trimmedName) {
      setPersonError("Name is required");
      return;
    }
    if (cleanedPhone.length !== 10) {
      setPersonError("Enter a valid 10-digit mobile number");
      return;
    }

    try {
      setSavingPerson(true);
      setPersonError("");
      const res = await fetch(`/api/v1/finance/providers/${providerId}/contacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmedName, phone: personPhone }),
      });
      const contentType = res.headers.get("content-type") || "";
      const data = contentType.includes("application/json")
        ? await res.json()
        : null;
      if (!res.ok) {
        setPersonError(
          data?.error ||
            `Request failed (${res.status}). If you just updated routes, restart the dev server.`
        );
        return;
      }
      setAddingForProviderId(null);
      setPersonName("");
      setPersonPhone("");
      setExpandedProviders((prev) => ({ ...prev, [providerId]: true }));
      await mutateProviders();
    } catch (err) {
      console.error(err);
      setPersonError("Failed to add person");
    } finally {
      setSavingPerson(false);
    }
  };

  const handleRemovePerson = async (providerId: number, contactId: number) => {
    if (!confirm("Remove this representative?")) return;

    try {
      const res = await fetch(
        `/api/v1/finance/providers/${providerId}/contacts/${contactId}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        await mutateProviders();
      }
    } catch (err) {
      console.error("Failed to remove contact", err);
    }
  };

  const toggleExpanded = (providerId: number) => {
    setExpandedProviders((prev) => ({
      ...prev,
      [providerId]: !prev[providerId],
    }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden border border-gray-200"
    >
      <div className="px-5 sm:px-6 py-4 bg-gray-50 border-b flex justify-between items-center shrink-0">
        <h3 className="text-lg font-black text-gray-900">Manage Finance Providers</h3>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-2xl font-bold leading-none"
        >
          &times;
        </button>
      </div>

      <div className="p-4 sm:p-6 overflow-y-auto flex-1">
        <form onSubmit={handleAddProvider} className="flex gap-2 mb-5">
          <input
            type="text"
            placeholder="e.g., Bajaj Finserv, HDFC, TVS..."
            value={newProviderName}
            onChange={(e) => setNewProviderName(e.target.value)}
            className="flex-1 min-w-0 border-2 border-gray-200 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={isManaging || !newProviderName.trim()}
            className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-lg text-sm flex items-center gap-1 disabled:opacity-50 transition"
          >
            <FaPlus className="w-3 h-3" /> Add
          </button>
        </form>

        <div className="space-y-2.5 max-h-[48vh] overflow-y-auto pr-1">
          {providers.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">
              No active finance providers found.
            </p>
          ) : (
            providers.map((p) => {
              const contacts = p.contacts || [];
              const hasContacts = contacts.length > 0;
              const isExpanded = !!expandedProviders[p.id];
              const isAddingPerson = addingForProviderId === p.id;

              return (
                <div
                  key={p.id}
                  className="bg-gray-50 rounded-xl border border-gray-200/80 overflow-hidden"
                >
                  {/* Provider Header Row */}
                  <div className="flex justify-between items-center gap-2 p-3">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {hasContacts && (
                        <button
                          type="button"
                          onClick={() => toggleExpanded(p.id)}
                          className="p-1 text-gray-500 hover:text-gray-800 hover:bg-gray-200/70 rounded transition shrink-0"
                          title={isExpanded ? "Hide persons" : "Show persons"}
                          aria-label={isExpanded ? "Hide persons" : "Show persons"}
                        >
                          {isExpanded ? (
                            <FaChevronDown className="w-3.5 h-3.5" />
                          ) : (
                            <FaChevronRight className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                      <span
                        onClick={() => hasContacts && toggleExpanded(p.id)}
                        className={`font-bold text-gray-800 text-sm truncate ${
                          hasContacts ? "cursor-pointer" : ""
                        }`}
                      >
                        {p.name}
                      </span>
                      {hasContacts && (
                        <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 shrink-0">
                          {contacts.length}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* + 3D Button before Delete */}
                      <button
                        type="button"
                        onClick={() => handleToggleAddPerson(p.id)}
                        title="Add Representative"
                        aria-label={`Add person to ${p.name}`}
                        className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-extrabold text-white border border-b-2 active:translate-y-px transition-all ${
                          isAddingPerson
                            ? "bg-gradient-to-b from-slate-600 to-slate-700 border-slate-700 border-b-slate-900"
                            : "bg-gradient-to-b from-[#2E62EB] to-[#1D4ED8] hover:from-[#3B6EF0] hover:to-[#1E40AF] border-[#1E40AF] border-b-[#172554] shadow-[0_2px_4px_rgba(29,78,216,0.28),inset_0_1px_0_rgba(255,255,255,0.3)]"
                        }`}
                      >
                        <FaPlus className="w-3 h-3" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRemoveProvider(p.id)}
                        className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-lg transition"
                        title="Remove Provider"
                      >
                        <FaTrash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Inline Add Person Form (Name + Number) */}
                  {isAddingPerson && (
                    <form
                      onSubmit={(e) => handleAddPerson(e, p.id)}
                      className="px-3 pb-3 pt-2 border-t border-gray-200 bg-white space-y-2"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Person Name"
                          value={personName}
                          onChange={(e) => setPersonName(e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:border-blue-500"
                          autoFocus
                        />
                        <input
                          type="tel"
                          inputMode="numeric"
                          maxLength={10}
                          placeholder="10-digit WhatsApp Number"
                          value={personPhone}
                          onChange={(e) => {
                            const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                            setPersonPhone(digits);
                            if (digits.length === 10 && personError) {
                              setPersonError("");
                            }
                          }}
                          className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      {personPhone.length > 0 && personPhone.length < 10 && (
                        <p className="text-[11px] font-medium text-amber-600">
                          Enter a valid 10-digit number ({personPhone.length}/10)
                        </p>
                      )}
                      {personError && (
                        <p className="text-[11px] font-semibold text-rose-600">
                          {personError}
                        </p>
                      )}
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleAddPerson(p.id)}
                          className="px-2.5 py-1 rounded-md text-xs font-bold text-gray-600 hover:bg-gray-100 transition"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={savingPerson}
                          className="px-3 py-1 rounded-md text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition"
                        >
                          {savingPerson ? "Saving..." : "Save Person"}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Expanded Persons List */}
                  {hasContacts && isExpanded && (
                    <div className="border-t border-gray-200/80 bg-white/80 divide-y divide-gray-100">
                      {contacts.map((c) => (
                        <div
                          key={c.id}
                          className="flex items-center justify-between gap-2 px-3 py-2 pl-5 text-xs"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-gray-800 flex items-center gap-1.5 truncate">
                              <FaUser className="w-2.5 h-2.5 text-blue-500 shrink-0" />
                              <span className="truncate">{c.name}</span>
                            </div>
                            <div className="text-[11px] text-gray-500 font-medium flex items-center gap-1.5 mt-0.5">
                              <FaPhoneAlt className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                              <span>+91 {c.phone}</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemovePerson(p.id, c.id)}
                            className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-lg transition shrink-0"
                            title={`Remove ${c.name}`}
                          >
                            <FaTrash className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="px-5 sm:px-6 py-4 bg-gray-50 border-t flex justify-end shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="bg-gray-900 hover:bg-black text-white font-bold px-5 py-2 rounded-lg text-sm transition"
        >
          Done
        </button>
      </div>
    </Modal>
  );
}
