"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

interface OverduePaymentsSectionProps {
  overdueData: any[];
  mutateOverdue: (data?: any, shouldRevalidate?: boolean) => Promise<any>;
  whatsappSettings: any;
}

export default function OverduePaymentsSection({
  overdueData,
  mutateOverdue,
  whatsappSettings,
}: OverduePaymentsSectionProps) {
  const [overduePayments, setOverduePayments] = useState<any[]>(overdueData || []);
  const [sendingWhatsappId, setSendingWhatsappId] = useState<number | null>(null);
  const [isDismissingOverdue, setIsDismissingOverdue] = useState(false);

  useEffect(() => {
    if (overdueData) setOverduePayments(overdueData);
  }, [overdueData]);

  const handleDismissAllOverdue = async () => {
    if (overduePayments.length === 0) return;
    try {
      setIsDismissingOverdue(true);
      const billIds = overduePayments.map((b) => b.id);
      const res = await fetch("/api/v1/due-payments/snooze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billIds }),
      });
      if (!res.ok) throw new Error("Failed to reset overdue timers");
      setOverduePayments([]);
      mutateOverdue([]);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to dismiss overdue section");
    } finally {
      setIsDismissingOverdue(false);
    }
  };

  const handleDismissSingleOverdue = async (billId: number) => {
    try {
      const res = await fetch("/api/v1/due-payments/snooze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billIds: [billId] }),
      });
      if (!res.ok) throw new Error("Failed to reset reminder timer");
      setOverduePayments((prev) => prev.filter((p) => p.id !== billId));
      mutateOverdue();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to dismiss customer");
    }
  };

  if (overduePayments.length === 0) return null;

  return (
    <div className="bg-[#FDF2F2] border border-[#780000]/20 p-4 sm:p-6 rounded-2xl shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="p-2 bg-[#FEE2E2] text-[#780000] rounded-lg shrink-0">
            <svg
              className="w-5 h-5 sm:w-6 sm:h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-[#780000] truncate">
            Urgent: Overdue Payments (15+ Days)
          </h3>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#FEE2E2] text-[#780000] shrink-0">
            {overduePayments.length}
          </span>
        </div>
        <button
          type="button"
          onClick={handleDismissAllOverdue}
          disabled={isDismissingOverdue}
          className="p-1.5 rounded-lg text-[#780000]/70 hover:text-[#780000] hover:bg-[#FEE2E2] transition-colors flex items-center justify-center text-sm font-bold disabled:opacity-50 shrink-0"
          title="Dismiss & reset reminder timer for all overdue customers"
        >
          ✕
        </button>
      </div>

      <div className="max-h-[340px] overflow-y-auto pr-1 sm:pr-2 custom-scrollbar">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {overduePayments.map((bill) => {
            const handleSendReminder = async () => {
              const phone = bill.customer?.phone || bill.customerPhone;
              if (!phone) {
                alert("No phone number available for this customer.");
                return;
              }

              try {
                setSendingWhatsappId(bill.id);
                const { generateBillPdfBlob } = await import("@/lib/client-pdf");
                const blob = await generateBillPdfBlob(bill);

                const formData = new FormData();
                formData.append("file", blob, `Laxmi_Invoice_${bill.billNumber}.pdf`);
                formData.append("customerName", bill.customer?.name || "Customer");
                formData.append("mobileNumber", phone);
                formData.append("billNumber", bill.billNumber);

                const reminderMsg = `Hello ${bill.customer?.name || "Customer"},\nThis is Laxmi Electronics & Furnitures. Your pending due of ₹${parseFloat(
                  bill.dueAmount
                ).toFixed(2)} from bill #${
                  bill.billNumber
                } is overdue. Please settle it at your earliest convenience.`;
                formData.append("customMessage", reminderMsg);

                const res = await fetch(`/api/v1/bills/${bill.id}/whatsapp/upload`, {
                  method: "POST",
                  body: formData,
                });

                const data = await res.json();
                if (!res.ok || !data.success) {
                  throw new Error(data.error || "Failed to send WhatsApp message");
                }

                setOverduePayments((prev) => prev.filter((p) => p.id !== bill.id));
              } catch (err: any) {
                console.error("WhatsApp send error:", err);
                alert(err.message || "Failed to send WhatsApp reminder");
              } finally {
                setSendingWhatsappId(null);
              }
            };

            return (
              <div
                key={bill.id}
                className="bg-white rounded-lg p-4 shadow-sm border border-red-100 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <div
                      className="font-bold text-gray-900 truncate"
                      title={bill.customer?.name}
                    >
                      {bill.customer?.name || "Guest"}
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/billing/${bill.id}`}
                        className="text-xs font-bold text-blue-600 hover:underline"
                      >
                        #{bill.billNumber}
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDismissSingleOverdue(bill.id)}
                        className="text-gray-400 hover:text-[#780000] hover:bg-red-50 rounded p-0.5 transition"
                        title="Reset reminder timer for this customer"
                      >
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 mb-1">
                    {bill.customer?.phone || bill.customerPhone || "No Phone"}
                  </div>
                  <div className="text-sm font-black text-[#780000]">
                    Due: ₹{parseFloat(bill.dueAmount).toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Bill Date: {new Date(bill.createdAt).toLocaleDateString()}
                  </div>
                </div>

                {(bill.customer?.phone || bill.customerPhone) && (
                  <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
                    <button
                      onClick={handleSendReminder}
                      disabled={
                        sendingWhatsappId === bill.id ||
                        !whatsappSettings ||
                        whatsappSettings.status !== "connected"
                      }
                      className="flex-1 flex justify-center items-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white py-1.5 rounded-md text-sm font-bold transition disabled:opacity-50"
                    >
                      {sendingWhatsappId === bill.id ? (
                        <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
                      ) : (
                        "WhatsApp"
                      )}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
