"use client";

import { useState } from "react";
import { FaCheckCircle } from "react-icons/fa";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { useDebounce } from "@/hooks/useDebounce";
import { useDepartment } from "@/components/dashboard/department/DepartmentContext";
import DuePaymentsLoading from "./loading";
import CollectDuePaymentModal from "@/components/dashboard/due-payments/CollectDuePaymentModal";
import DuePaymentsMobileCards from "@/components/mobileview/due-payments/DuePaymentsMobileCards";
import DuePaymentsTable from "@/components/dashboard/due-payments/DuePaymentsTable";

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

      <div className="flex flex-wrap justify-between items-center gap-3 mb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">Due Payments</h1>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            Manage stage payments, installment receipts, and balance dues
          </p>
        </div>
        <div className="w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search by Bill No, Name, or Phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border border-gray-300 rounded-xl px-4 py-2 w-full sm:w-72 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs bg-white"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 shadow-sm border border-red-200">
          {error}
        </div>
      )}

      {/* Mobile Cards View (Option A) */}
      <div className="md:hidden">
        <DuePaymentsMobileCards
          dues={dues}
          loading={loading}
          sendingWhatsappId={sendingWhatsappId}
          calculateDaysPassed={calculateDaysPassed}
          onSendWhatsapp={handleSendWhatsapp}
          onOpenPaymentModal={handleOpenPaymentModal}
        />
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block">
        <DuePaymentsTable
          dues={dues}
          loading={loading}
          sendingWhatsappId={sendingWhatsappId}
          calculateDaysPassed={calculateDaysPassed}
          onSendWhatsapp={handleSendWhatsapp}
          onOpenPaymentModal={handleOpenPaymentModal}
        />
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
