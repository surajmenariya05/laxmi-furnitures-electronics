"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FaWhatsapp,
  FaMoneyBillWave,
  FaTimes,
  FaCheckCircle,
  FaExclamationCircle,
} from "react-icons/fa";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { useDebounce } from "@/hooks/useDebounce";
import { useDepartment } from "@/components/dashboard/department/DepartmentContext";
import DuePaymentsLoading from "./loading";
import CollectDuePaymentModal from "@/components/dashboard/due-payments/CollectDuePaymentModal";

export default function DuePaymentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 500);
  const { department } = useDepartment();

  const { data: rawDues, error: swrError, mutate: mutateDues } = useSWR(
    `/api/v1/due-payments?search=${encodeURIComponent(debouncedSearch)}&department=${department || "ALL"}`,
    fetcher,
    { dedupingInterval: 500 }
  );

  const dues = (rawDues || []).filter((bill: any) => {
    if (!department || department === "ALL") return true;
    const dept = (bill.department || "").toUpperCase();
    const billNo = (bill.billNumber || "").toUpperCase();
    if (department === "FURNITURE") {
      return dept.includes("FURN") || billNo.includes("FURN");
    }
    if (department === "ELECTRONICS") {
      return dept.includes("ELEC") || billNo.includes("ELEC");
    }
    return true;
  });
  const loading = !rawDues && !swrError;
  const error = swrError ? "Failed to fetch due payments" : "";

  const [sendingWhatsappId, setSendingWhatsappId] = useState<number | null>(null);

  // Multi-stage installment payment modal state
  const [selectedBillForPayment, setSelectedBillForPayment] = useState<any | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleOpenPaymentModal = (bill: any) => {
    setSelectedBillForPayment(bill);
  };

  const calculateDaysPassed = (dateString: string) => {
    const created = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - created.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleSendWhatsapp = async (bill: any) => {
    const customerPhone = bill.customer?.phone || bill.customerPhone || "";
    if (!customerPhone) {
      alert("No customer phone number attached to this bill.");
      return;
    }
    try {
      setSendingWhatsappId(bill.id);
      const { generateBillPdfBlob } = await import("@/lib/client-pdf");
      const blob = await generateBillPdfBlob(bill);

      const formData = new FormData();
      formData.append("file", blob, `Laxmi_Invoice_${bill.billNumber}.pdf`);
      formData.append("customerName", bill.customer?.name || "Customer");
      formData.append("mobileNumber", customerPhone);
      formData.append("billNumber", bill.billNumber);

      const reminderMsg = `🔔 *Payment Due Reminder*\n\nHello ${
        bill.customer?.name || "Customer"
      },\nThis is a gentle reminder regarding the outstanding balance for Invoice #${
        bill.billNumber
      }.\n\n*Total Amount:* ₹${Number(bill.totalAmount).toLocaleString(
        "en-IN"
      )}\n*Paid so far:* ₹${Number(bill.paidAmount).toLocaleString(
        "en-IN"
      )}\n*Pending Due:* ₹${Number(bill.dueAmount).toLocaleString(
        "en-IN"
      )}\n\nPlease arrange the payment at your earliest convenience.\n\n*Laxmi Electronics & Furnitures*\nPhone: +91 820 939 9683`;

      formData.append("customMessage", reminderMsg);

      const res = await fetch(`/api/v1/bills/${bill.id}/whatsapp/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || "Failed to send WhatsApp message");
      } else {
        showToast("WhatsApp reminder sent successfully!");
      }
    } catch (err: any) {
      console.error("WhatsApp send error:", err);
      alert(err.message || "Failed to send WhatsApp message");
    } finally {
      setSendingWhatsappId(null);
    }
  };

  if (dues.length === 0 && loading) {
    return <DuePaymentsLoading />;
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-900 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-emerald-700 animate-slide-up">
          <FaCheckCircle className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-bold">{toastMessage}</span>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Due Payments</h1>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            Manage stage payments, installment receipts, and balance dues
          </p>
        </div>
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Search by Bill No, Name, or Phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 w-72 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 shadow-sm border border-red-200">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Bill No
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Paid
                </th>
                <th className="px-6 py-3 text-right text-xs font-bold text-red-500 uppercase tracking-wider">
                  Due Balance
                </th>
                <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Remind
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="ml-3 font-medium">Loading dues...</span>
                    </div>
                  </td>
                </tr>
              ) : dues.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500 font-medium">
                    No pending due payments found.
                  </td>
                </tr>
              ) : (
                dues.map((bill: any) => {
                  const daysPassed = calculateDaysPassed(bill.createdAt);
                  const isOverdue = daysPassed >= 15;
                  const isUnpaid = (bill.paymentStatus || "").toUpperCase() === "UNPAID";

                  return (
                    <tr key={bill.id} className="hover:bg-gray-50/80 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          href={`/billing/${bill.id}`}
                          className="text-sm font-black text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          #{bill.billNumber}
                        </Link>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md inline-flex items-center gap-1 ${
                            (bill.department || "FURNITURE").toUpperCase() === "FURNITURE"
                              ? "bg-[#235347] text-white border border-[#2F6859] border-b-[#14352D] shadow-[0_1.5px_0_#14352D,inset_0_1px_0_rgba(255,255,255,0.25)]"
                              : "bg-[#093F52] text-white border border-[#105269] border-b-[#052531] shadow-[0_1.5px_0_#052531,inset_0_1px_0_rgba(255,255,255,0.25)]"
                          }`}>
                            {(bill.department || "FURNITURE").toUpperCase() === "FURNITURE" ? (
                              <>
                                <img src="/furniture-logo-icon.png" alt="Furn" className="w-3 h-3 object-contain inline-block shrink-0" />
                                <span>FURN</span>
                              </>
                            ) : (
                              <>
                                <span>⚡</span>
                                <span>ELEC</span>
                              </>
                            )}
                          </span>
                          <span
                            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                              isUnpaid ? "bg-[#FDF2F2] text-[#780000] border border-[#780000]/30 border-b-[#780000]/60 shadow-[0_2px_4px_rgba(120,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.9)]" : "bg-[#FEF9E7] text-[#854D0E] border border-[#FFCA3A] border-b-[#E5B020] shadow-[0_2px_4px_rgba(180,83,9,0.14),inset_0_1px_0_rgba(255,255,255,0.9)]"
                            }`}
                          >
                            {isUnpaid ? "UNPAID" : "PARTIAL"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">
                        <div>{new Date(bill.createdAt).toLocaleDateString()}</div>
                        {isOverdue ? (
                          <div className="text-[10px] font-bold mt-0.5 bg-[#FDF2F2] text-[#780000] border border-[#780000]/30 border-b-[#780000]/60 shadow-[0_2px_4px_rgba(120,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.9)] px-2 py-0.5 rounded inline-block">
                            Overdue ({daysPassed} days)
                          </div>
                        ) : (
                          <div className="text-[10px] text-gray-400 font-semibold mt-0.5">
                            {daysPassed} days ago
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-900">
                          {bill.customer?.name || "Guest"}
                        </div>
                        <div className="text-xs text-gray-500 font-medium">
                          {bill.customer?.phone || "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-gray-900">
                        ₹{parseFloat(bill.totalAmount).toLocaleString("en-IN")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-[#15803D]">
                        ₹{parseFloat(bill.paidAmount).toLocaleString("en-IN")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-black text-[#780000] bg-red-50/20">
                        ₹{parseFloat(bill.dueAmount).toLocaleString("en-IN")}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          type="button"
                          onClick={() => handleOpenPaymentModal(bill)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-xs hover:shadow"
                          title="Collect Payment / Installment"
                        >
                          <FaMoneyBillWave className="w-3.5 h-3.5" />
                          <span>Collect</span>
                        </button>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex justify-center items-center gap-3">
                          {bill.customer?.phone ? (
                            <button
                              onClick={() => handleSendWhatsapp(bill)}
                              disabled={sendingWhatsappId === bill.id}
                              className="text-gray-400 hover:text-green-600 bg-gray-100 hover:bg-green-50 p-2 rounded-full transition disabled:opacity-50"
                              title="Send WhatsApp Reminder with Invoice PDF"
                            >
                              {sendingWhatsappId === bill.id ? (
                                <div className="animate-spin h-[1.1rem] w-[1.1rem] border-2 border-green-600 border-t-transparent rounded-full mx-auto" />
                              ) : (
                                <FaWhatsapp className="text-[1.1rem]" />
                              )}
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400 font-medium">No Phone</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reusable Collect Due Payment Modal */}
      <CollectDuePaymentModal
        isOpen={Boolean(selectedBillForPayment)}
        bill={selectedBillForPayment}
        onClose={() => setSelectedBillForPayment(null)}
        onSuccess={({ billId, isFullyPaid, collectedAmount, updatedBill }) => {
          if (isFullyPaid) {
            mutateDues(
              (current: any) => (current || []).filter((d: any) => d.id !== billId),
              false
            );
            showToast(
              `🎉 Bill #${selectedBillForPayment?.billNumber || billId} has been fully settled!`
            );
          } else {
            mutateDues(
              (current: any) =>
                (current || []).map((d: any) =>
                  d.id === billId
                    ? {
                        ...d,
                        paidAmount: updatedBill.paidAmount,
                        dueAmount: updatedBill.dueAmount,
                        paymentStatus: updatedBill.paymentStatus,
                      }
                    : d
                ),
              false
            );
            showToast(
              `✓ Received ₹${collectedAmount.toLocaleString("en-IN")}. Remaining Due: ₹${Number(
                updatedBill.dueAmount
              ).toLocaleString("en-IN")}`
            );
          }
        }}
      />
    </div>
  );
}
