"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { getBills, getBill } from "@/lib/api/billing";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useDebounce } from "@/hooks/useDebounce";
import { FaSpinner, FaPen, FaWhatsapp, FaEye, FaDownload } from "react-icons/fa";
import useSWRInfinite from "swr/infinite";
import BillingHistoryLoading from "./loading";
import { Modal } from "@/components/ui/modal";
import { useDepartment } from "@/components/dashboard/department/DepartmentContext";


function numberToWords(num: number): string {
  const a = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
    "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  const g = ["", "Thousand", "Lakh", "Crore"];

  const count = (n: number) => {
    let word = "";
    if (n < 20) {
      word = a[n];
    } else if (n < 100) {
      word = b[Math.floor(n / 10)] + " " + a[n % 10];
    } else {
      word = a[Math.floor(n / 100)] + " Hundred " + count(n % 100);
    }
    return word.trim();
  };

  if (num === 0) return "Zero Rupees Only";

  let words = "";
  let temp = Math.floor(num);

  let chunks = [];
  chunks.push(temp % 1000);
  temp = Math.floor(temp / 1000);
  chunks.push(temp % 100);
  temp = Math.floor(temp / 100);
  chunks.push(temp % 100);
  temp = Math.floor(temp / 100);
  chunks.push(temp % 100);

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    if (chunk > 0) {
      words = count(chunk) + " " + g[i] + " " + words;
    }
  }

  return (words.trim() + " Rupees Only").replace(/\s+/g, " ");
}

export default function BillingHistoryPage() {
  const { department } = useDepartment();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  
  const getKey = (pageIndex: number, previousPageData: any) => {
    if (previousPageData && !previousPageData.hasMore) return null;
    return ['bills', debouncedSearch, pageIndex + 1, department];
  };

  const { data, size, setSize, isValidating, error, mutate } = useSWRInfinite(
    getKey,
    ([_, s, p, dept]: [string, string, number, string]) => getBills(s, p, 50, dept),
    { dedupingInterval: 5000, persistSize: true }
  );

  const bills: any[] = data ? [].concat(...data.map((d: any) => Array.isArray(d) ? d : d.items || [])) : [];
  const hasMore = data ? data[data.length - 1]?.hasMore : true;
  const loading = !data && !error;

  const [sendingWhatsappId, setSendingWhatsappId] = useState<number | null>(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState({ name: "", phone: "", address: "" });
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [selectedBill, setSelectedBill] = useState<any>(null);

  // Observer for infinite scroll
  const observer = useRef<IntersectionObserver | null>(null);
  const lastElementRef = useCallback((node: HTMLTableRowElement | null) => {
    if (isValidating) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setSize(size + 1);
      }
    });
    
    if (node) observer.current.observe(node);
  }, [isValidating, hasMore, size, setSize]);

  const { role } = useAuth();

  // Polling for real-time WhatsApp status updates
  useEffect(() => {
    const hasPending = bills.some((b) => b.whatsappStatus === "pending");
    if (!hasPending) return;

    const interval = setInterval(() => {
      mutate();
    }, 3000);

    return () => clearInterval(interval);
  }, [bills, mutate]);

  const openEditModal = (bill: any) => {
    setSelectedBill(bill);
    setEditData({
      name: bill.customer?.name || bill.customerName || "",
      phone: bill.customer?.phone || bill.customerPhone || "",
      address: bill.customer?.address || "",
    });
    setShowEditModal(true);
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBill || !selectedBill.customer) {
      alert("This is a legacy bill without a linked customer profile. Cannot edit.");
      return;
    }
    
    // Check what changed
    const oldName = selectedBill.customer.name || selectedBill.customerName || "";
    const oldPhone = selectedBill.customer.phone || selectedBill.customerPhone || "";
    const oldAddress = selectedBill.customer.address || "";
    
    let changes = [];
    if (oldName !== editData.name) changes.push(`Name: ${oldName || "(Empty)"} ➔ ${editData.name || "(Empty)"}`);
    if (oldPhone !== editData.phone) changes.push(`Phone: ${oldPhone || "(Empty)"} ➔ ${editData.phone || "(Empty)"}`);
    if (oldAddress !== editData.address) changes.push(`Address: ${oldAddress || "(Empty)"} ➔ ${editData.address || "(Empty)"}`);
    
    if (changes.length === 0) {
      setShowEditModal(false);
      return;
    }
    
    const confirmMsg = `Confirm Customer Updates:\n\n${changes.join("\n")}\n\nSave changes?`;
    if (!window.confirm(confirmMsg)) return;
    
    setSavingCustomer(true);
    try {
      const res = await fetch(`/api/v1/customers/${selectedBill.customer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update");
      }
      
      const { customer } = await res.json();
      
      // Update local state for bills
      mutate();
      setShowEditModal(false);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingCustomer(false);
    }
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

      const res = await fetch(`/api/v1/bills/${bill.id}/whatsapp/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || "Failed to send WhatsApp message");
      }

      await mutate(); // Refresh list to get updated status
    } catch (err: any) {
      console.error("WhatsApp send error:", err);
      alert(err.message || "Failed to send WhatsApp message");
    } finally {
      setSendingWhatsappId(null);
    }
  };

  const handleDownloadBill = async (billId: number) => {
    try {
      const bill = await getBill(billId);
      if (!bill) return;
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
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-black">Billing History</h2>
        <Link
          href="/billing"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm font-semibold"
        >
          New Transaction
        </Link>
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by Bill Number, Customer Name or Phone..."
          className="w-full border border-gray-300 rounded px-4 py-2"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bill Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dept</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">WhatsApp</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {bills.map((bill, index) => {
                const isLast = bills.length === index + 1;
                return (
                <tr key={bill.id} ref={isLast ? lastElementRef : null}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(bill.createdAt).toLocaleDateString("en-IN")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    <div>#{bill.billNumber}</div>
                    {bill.booking && (
                      <Link
                        href="/bookings/history"
                        className="inline-flex items-center gap-1 text-[10px] font-extrabold text-blue-800 bg-blue-50 hover:bg-blue-100 px-1.5 py-0.5 rounded border border-blue-200 mt-1 transition-colors"
                        title="View Linked Master Booking"
                      >
                        <span>WB:</span>
                        <span className="font-mono">{bill.booking.bookingNumber}</span>
                      </Link>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2.5 py-0.5 inline-flex text-xs font-semibold rounded-full items-center gap-1 ${
                      bill.department === "ELECTRONICS"
                        ? "bg-[#093F52] text-white border border-[#105269] border-b-[#052531] shadow-[0_2px_0_#052531,0_3px_5px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.3)]"
                        : "bg-[#235347] text-white border border-[#2F6859] border-b-[#14352D] shadow-[0_2px_0_#14352D,0_3px_5px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.3)]"
                    }`}>
                      {bill.department === "ELECTRONICS" ? (
                        <>⚡ Electronics</>
                      ) : (
                        <span className="inline-flex items-center gap-1.5">
                          <img src="/furniture-logo-icon.png" alt="Furniture" className="w-3.5 h-3.5 object-contain inline-block shrink-0" />
                          <span>Furniture</span>
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{bill.customer?.name || "Guest"}</div>
                    {bill.customer?.phone && <div className="text-xs text-gray-500">{bill.customer.phone}</div>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                    ₹{bill.totalAmount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                    <div>{bill.paymentMode}</div>
                    {bill.paymentStatus === "PARTIAL" && (
                      <div className="text-[11px] font-bold text-[#780000]">
                        Due: ₹{Number(bill.dueAmount).toLocaleString("en-IN")}
                      </div>
                    )}
                    {bill.paymentStatus === "PAID" && (
                      <div className="text-[10px] font-bold text-[#15803D]">
                        Paid
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-extrabold uppercase rounded-full ${bill.status === "voided"
                        ? "bg-[#FDF2F2] text-[#780000] border border-[#780000]/30 border-b-[#780000]/60 shadow-[0_2px_4px_rgba(120,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.9)]"
                        : "bg-[#EBFDE7] text-[#14532D] border border-[#81FF7A]/80 border-b-[#4ADE80] shadow-[0_2px_4px_rgba(20,83,45,0.12),inset_0_1px_0_rgba(255,255,255,0.9)]"
                      }`}>
                      {bill.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {bill.whatsappStatus ? (
                      <div>
                        <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-bold uppercase rounded-full ${bill.whatsappStatus === "sent"
                            ? "bg-[#EBFDE7] text-[#14532D] border border-[#81FF7A]/80 border-b-[#4ADE80] shadow-[0_2px_4px_rgba(20,83,45,0.12),inset_0_1px_0_rgba(255,255,255,0.9)]"
                            : bill.whatsappStatus === "failed"
                              ? "bg-[#FDF2F2] text-[#780000] border border-[#780000]/30 border-b-[#780000]/60 shadow-[0_2px_4px_rgba(120,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.9)]"
                              : "bg-[#FEF9E7] text-[#854D0E] border border-[#FFCA3A] border-b-[#E5B020] shadow-[0_2px_4px_rgba(180,83,9,0.14),inset_0_1px_0_rgba(255,255,255,0.9)]"
                          }`}>
                          {bill.whatsappStatus}
                        </span>
                        {bill.whatsappSentAt && bill.whatsappStatus === "sent" && (
                          <div className="text-[10px] text-gray-500 mt-1">
                            {new Date(bill.whatsappSentAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-1.5">
                      {role === "owner" && bill.status !== "voided" && bill.customer && (
                        <button
                          type="button"
                          onClick={() => openEditModal(bill)}
                          title="Edit Customer Details"
                          className="group relative inline-flex items-center justify-center h-7 px-2 text-xs font-bold text-amber-800 bg-[#FFFDF5] hover:bg-amber-50 border border-amber-300/80 border-b-2 border-b-amber-400 rounded-full shadow-[0_2px_4px_rgba(217,119,6,0.15),inset_0_1px_0_rgba(255,255,255,0.9)] hover:shadow-md active:translate-y-px transition-all duration-200"
                        >
                          <FaPen className="w-2.5 h-2.5 text-amber-700 transition-transform group-hover:scale-110 shrink-0" />
                          <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 group-hover:max-w-[45px] group-hover:opacity-100 group-hover:ml-1 transition-all duration-300 ease-out text-[11px] font-bold">
                            Edit
                          </span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleSendWhatsapp(bill)}
                        disabled={sendingWhatsappId === bill.id || bill.status === "voided"}
                        className="group relative inline-flex items-center justify-center h-7 px-2 text-xs font-bold text-emerald-800 bg-[#F0FDF4] hover:bg-emerald-50 border border-emerald-300/80 border-b-2 border-b-emerald-400 rounded-full shadow-[0_2px_4px_rgba(22,163,74,0.15),inset_0_1px_0_rgba(255,255,255,0.9)] hover:shadow-md active:translate-y-px transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Send via WhatsApp"
                      >
                        {sendingWhatsappId === bill.id ? (
                          <div className="w-3 h-3 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin shrink-0" />
                        ) : (
                          <FaWhatsapp className="w-3.5 h-3.5 text-emerald-600 transition-transform group-hover:scale-110 shrink-0" />
                        )}
                        <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 group-hover:max-w-[70px] group-hover:opacity-100 group-hover:ml-1 transition-all duration-300 ease-out text-[11px] font-bold">
                          WhatsApp
                        </span>
                      </button>
                      <Link
                        href={`/billing/${bill.id}`}
                        className="group relative inline-flex items-center justify-center h-7 px-2 text-xs font-bold text-indigo-800 bg-[#F5F3FF] hover:bg-indigo-50 border border-indigo-300/80 border-b-2 border-b-indigo-400 rounded-full shadow-[0_2px_4px_rgba(99,102,241,0.15),inset_0_1px_0_rgba(255,255,255,0.9)] hover:shadow-md active:translate-y-px transition-all duration-200"
                        title="View Details"
                      >
                        <FaEye className="w-3 h-3 text-indigo-600 transition-transform group-hover:scale-110 shrink-0" />
                        <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 group-hover:max-w-[45px] group-hover:opacity-100 group-hover:ml-1 transition-all duration-300 ease-out text-[11px] font-bold">
                          View
                        </span>
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDownloadBill(bill.id)}
                        disabled={bill.status === "voided"}
                        className="group relative inline-flex items-center justify-center h-7 px-2 text-xs font-bold text-blue-800 bg-[#EFF6FF] hover:bg-blue-50 border border-blue-300/80 border-b-2 border-b-blue-400 rounded-full shadow-[0_2px_4px_rgba(37,99,235,0.15),inset_0_1px_0_rgba(255,255,255,0.9)] hover:shadow-md active:translate-y-px transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Download Bill"
                      >
                        <FaDownload className="w-2.5 h-2.5 text-blue-600 transition-transform group-hover:scale-110 shrink-0" />
                        <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 group-hover:max-w-[65px] group-hover:opacity-100 group-hover:ml-1 transition-all duration-300 ease-out text-[11px] font-bold">
                          Download
                        </span>
                      </button>
                    </div>
                  </td>
                </tr>
              )})}
              {bills.length === 0 && !loading && (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                    No transactions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      
      {isValidating && bills.length > 0 && (
        <div className="p-6 flex justify-center items-center">
          <FaSpinner className="w-6 h-6 animate-spin text-blue-500" />
        </div>
      )}

      {/* Edit Customer Modal with Spring Animation */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        className="bg-[#FAF3F3] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-[#EEDCDD]"
      >
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-800">Edit Customer Details</h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600 font-bold text-xl">&times;</button>
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
                <label className="block text-sm font-bold text-gray-700">Phone Number (10 digits)</label>
                <input
                  type="text"
                  maxLength={10}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={editData.phone}
                  onChange={(e) => setEditData({ ...editData, phone: e.target.value.replace(/\D/g, "") })}
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
                  className="bg-white border border-gray-300 rounded-md shadow-sm py-2 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCustomer}
                  className="bg-blue-600 border border-transparent rounded-md shadow-sm py-2 px-4 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {savingCustomer ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
      </Modal>
    </div>
  );
}
