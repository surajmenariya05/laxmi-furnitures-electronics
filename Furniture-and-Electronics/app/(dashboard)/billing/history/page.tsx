"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { getBills, getBill } from "@/lib/api/billing";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useDebounce } from "@/hooks/useDebounce";
import { FaSpinner } from "react-icons/fa";
import useSWRInfinite from "swr/infinite";
import BillingHistoryLoading from "./loading";
import { Modal } from "@/components/ui/modal";
import { useDepartment } from "@/components/dashboard/department/DepartmentContext";
import NewTransactionButton from "@/components/ui/NewTransactionButton";
import BillingHistoryMobileCards, {
  BillingHistoryItem,
} from "@/components/mobileview/billing/BillingHistoryMobileCards";
import BillingHistoryTable from "@/components/dashboard/billing/BillingHistoryTable";

interface BillsPageResponse {
  hasMore?: boolean;
  items?: BillingHistoryItem[];
}

export default function BillingHistoryPage() {
  const router = useRouter();
  const { department } = useDepartment();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);

  const getKey = (pageIndex: number, previousPageData: BillsPageResponse | null) => {
    if (previousPageData && !previousPageData.hasMore) return null;
    return ["bills", debouncedSearch, pageIndex + 1, department];
  };

  const { data, size, setSize, isValidating, error, mutate } = useSWRInfinite(
    getKey,
    ([, s, p, dept]: [string, string, number, string]) => getBills(s, p, 50, dept),
    { dedupingInterval: 5000, persistSize: true, revalidateOnFocus: false }
  );

  const bills: BillingHistoryItem[] = useMemo(() => {
    return data
      ? ([] as BillingHistoryItem[]).concat(
          ...data.map((d: BillsPageResponse | BillingHistoryItem[]) =>
            Array.isArray(d) ? d : d.items || []
          )
        )
      : [];
  }, [data]);
  const hasMore = data ? (data[data.length - 1] as BillsPageResponse)?.hasMore : true;
  const loading = !data && !error;

  const [sendingWhatsappId, setSendingWhatsappId] = useState<number | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState({ name: "", phone: "", address: "" });
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [selectedBill, setSelectedBill] = useState<BillingHistoryItem | null>(null);

  const observer = useRef<IntersectionObserver | null>(null);
  const lastElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isValidating || !hasMore) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore && !isValidating) {
          setSize(size + 1);
        }
      });

      if (node) observer.current.observe(node);
    },
    [isValidating, hasMore, size, setSize]
  );

  const { role } = useAuth();

  useEffect(() => {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    const hasRecentPending = bills.some(
      (b) =>
        b.whatsappStatus === "pending" &&
        new Date(b.createdAt).getTime() > fiveMinutesAgo
    );
    if (!hasRecentPending) return;

    const interval = setInterval(() => {
      if (!isValidating) {
        mutate();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [bills, isValidating, mutate]);

  const openEditModal = (bill: BillingHistoryItem) => {
    if (bill.status === "voided") return;
    router.push(`/billing?editBillId=${bill.id}`);
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBill || !selectedBill.customer) {
      alert("This is a legacy bill without a linked customer profile. Cannot edit.");
      return;
    }

    if (!editData.name.trim()) {
      alert("Customer Name is required.");
      return;
    }
    if (!editData.phone.trim() || editData.phone.trim().length !== 10) {
      alert("Valid 10-digit Phone Number is required.");
      return;
    }

    setSavingCustomer(true);
    try {
      const res = await fetch(`/api/v1/customers/${selectedBill.customer.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editData.name,
          phone: editData.phone,
          address: editData.address,
        }),
      });
      if (!res.ok) throw new Error("Failed to update customer");

      setShowEditModal(false);
      await mutate();
    } catch (err) {
      alert("Error updating customer details");
      console.error(err);
    } finally {
      setSavingCustomer(false);
    }
  };

  const handleSendWhatsapp = async (bill: BillingHistoryItem) => {
    const phone = bill.customer?.phone || bill.customerPhone;
    if (!phone) {
      alert("No customer phone number associated with this bill.");
      return;
    }

    setSendingWhatsappId(bill.id);
    try {
      const fullBill = await getBill(bill.id);
      const { generateBillPdfBlob } = await import("@/lib/client-pdf");
      const blob = await generateBillPdfBlob(fullBill);

      const formData = new FormData();
      formData.append("file", blob, `Laxmi_Invoice_${fullBill.billNumber}.pdf`);
      formData.append(
        "customerName",
        fullBill.customer?.name || bill.customerName || "Customer"
      );
      if (fullBill.customer?.address) {
        formData.append("customerAddress", fullBill.customer.address);
      }
      formData.append("mobileNumber", phone);
      formData.append("billNumber", fullBill.billNumber);

      const res = await fetch(`/api/v1/bills/${bill.id}/whatsapp/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(`Failed to send WhatsApp: ${data.error || "Unknown error"}`);
      }
      await mutate();
    } catch (err: any) {
      console.error("Failed to send WhatsApp invoice:", err);
      alert(`Error sending WhatsApp invoice: ${err.message}`);
    } finally {
      setSendingWhatsappId(null);
    }
  };

  const handleDownloadBill = async (billId: number) => {
    try {
      const bill = await getBill(billId);
      const { generateBillPdfBlob } = await import("@/lib/client-pdf");
      const blob = await generateBillPdfBlob(bill);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Invoice_${bill.billNumber || billId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download PDF", err);
      alert("Failed to download PDF bill details.");
    }
  };

  if (bills.length === 0 && loading) {
    return <BillingHistoryLoading />;
  }

  return (
    <div className="bg-white shadow rounded-2xl p-4 sm:p-6">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-5">
        <h2 className="text-xl sm:text-2xl font-bold text-black">Billing History</h2>
        <NewTransactionButton href="/billing">+ New Transaction</NewTransactionButton>
      </div>

      <div className="mb-5">
        <input
          type="text"
          placeholder="Search by Bill Number, Customer Name or Phone..."
          className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Mobile Cards View */}
      <div className="md:hidden">
        <BillingHistoryMobileCards
          bills={bills}
          loading={loading}
          role={role}
          sendingWhatsappId={sendingWhatsappId}
          onEdit={openEditModal}
          onSendWhatsapp={handleSendWhatsapp}
          onDownloadBill={handleDownloadBill}
        />
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block">
        <BillingHistoryTable
          bills={bills}
          loading={loading}
          role={role}
          sendingWhatsappId={sendingWhatsappId}
          onEdit={openEditModal}
          onSendWhatsapp={handleSendWhatsapp}
          onDownloadBill={handleDownloadBill}
        />
      </div>

      {hasMore && bills.length > 0 && <div ref={lastElementRef} className="h-2" />}

      {hasMore && isValidating && bills.length > 0 && (
        <div className="p-6 flex justify-center items-center">
          <FaSpinner className="w-6 h-6 animate-spin text-blue-500" />
        </div>
      )}

      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        className="bg-[#FAF3F3] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-[#EEDCDD]"
      >
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <h3 className="text-lg font-bold text-gray-800">Edit Customer Details</h3>
          <button
            onClick={() => setShowEditModal(false)}
            className="text-gray-400 hover:text-gray-600 font-bold text-xl"
          >
            &times;
          </button>
        </div>
        <form onSubmit={handleSaveCustomer} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700">Customer Name</label>
            <input
              type="text"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={editData.name}
              onChange={(e) => setEditData({ ...editData, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700">
              Phone Number (10 digits)
            </label>
            <input
              type="text"
              maxLength={10}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={editData.phone}
              onChange={(e) =>
                setEditData({ ...editData, phone: e.target.value.replace(/\D/g, "") })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700">Address</label>
            <input
              type="text"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={editData.address}
              onChange={(e) => setEditData({ ...editData, address: e.target.value })}
            />
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowEditModal(false)}
              className="bg-white border border-gray-300 rounded-md shadow-sm py-2 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingCustomer}
              className="bg-blue-600 border border-transparent rounded-md shadow-sm py-2 px-4 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {savingCustomer ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
