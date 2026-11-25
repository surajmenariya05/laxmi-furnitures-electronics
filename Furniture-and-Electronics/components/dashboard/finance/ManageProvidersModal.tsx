"use client";

import React, { useState } from "react";
import { FaPlus, FaTrash } from "react-icons/fa";
import { Modal } from "@/components/ui/modal";

interface ManageProvidersModalProps {
  isOpen: boolean;
  onClose: () => void;
  providers: any[];
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-200"
    >
      <div className="px-6 py-4 bg-gray-50 border-b flex justify-between items-center">
        <h3 className="text-lg font-black text-gray-900">Manage Finance Providers</h3>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
        >
          &times;
        </button>
      </div>

      <div className="p-6">
        <form onSubmit={handleAddProvider} className="flex gap-2 mb-6">
          <input
            type="text"
            placeholder="e.g., Bajaj Finserv, HDFC, TVS..."
            value={newProviderName}
            onChange={(e) => setNewProviderName(e.target.value)}
            className="flex-1 border-2 border-gray-200 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={isManaging || !newProviderName.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-lg text-sm flex items-center gap-1 disabled:opacity-50 transition"
          >
            <FaPlus /> Add
          </button>
        </form>

        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {providers.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">
              No active finance providers found.
            </p>
          ) : (
            providers.map((p: any) => (
              <div
                key={p.id}
                className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100"
              >
                <span className="font-bold text-gray-800 text-sm">{p.name}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveProvider(p.id)}
                  className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded transition"
                  title="Remove Provider"
                >
                  <FaTrash className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="px-6 py-4 bg-gray-50 border-t flex justify-end">
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
