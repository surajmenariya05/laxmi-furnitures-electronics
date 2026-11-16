"use client";

import React, { useState } from "react";
import useSWR from "swr";
import { useDepartment } from "@/components/dashboard/department/DepartmentContext";
import { BookingResponse } from "@/types/booking";
import BookingsHeader from "@/components/dashboard/bookings/BookingsHeader";
import BookingsStatsSummary from "@/components/dashboard/bookings/BookingsStatsSummary";
import BookingsFilterBar from "@/components/dashboard/bookings/BookingsFilterBar";
import BookingCard from "@/components/dashboard/bookings/BookingCard";
import BookingListEmptyState from "@/components/dashboard/bookings/BookingListEmptyState";
import DeliveryInvoiceModal from "@/components/dashboard/bookings/DeliveryInvoiceModal";
import BookingSlipModal from "@/components/dashboard/bookings/BookingSlipModal";
import EditBookingModal from "@/components/dashboard/bookings/EditBookingModal";
import CollectDuePaymentModal from "@/components/dashboard/due-payments/CollectDuePaymentModal";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to fetch bookings");
  }
  return res.json();
};

export default function BookingsPage() {
  const { department } = useDepartment();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [activeBookingForDelivery, setActiveBookingForDelivery] = useState<BookingResponse | null>(null);
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [selectedSlipBooking, setSelectedSlipBooking] = useState<BookingResponse | null>(null);
  const [selectedEditBooking, setSelectedEditBooking] = useState<BookingResponse | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedDueBill, setSelectedDueBill] = useState<any | null>(null);
  const [deletingBookingId, setDeletingBookingId] = useState<number | null>(null);

  // Construct SWR URL based on active filters
  const params = new URLSearchParams();
  if (statusFilter !== "ALL") params.append("status", statusFilter);
  if (searchQuery.trim()) params.append("search", searchQuery.trim());
  if (department !== "ALL") params.append("department", department);

  const swrUrl = `/api/v1/bookings${params.toString() ? `?${params.toString()}` : ""}`;
  const { data: bookings, error, isLoading, mutate } = useSWR<BookingResponse[]>(
    swrUrl,
    fetcher,
    { refreshInterval: 15000 }
  );

  const bookingList = Array.isArray(bookings) ? bookings : [];

  const handleOpenDeliveryModal = (booking: BookingResponse) => {
    setActiveBookingForDelivery(booking);
    setIsDeliveryModalOpen(true);
  };

  const handleCloseDeliveryModal = () => {
    setIsDeliveryModalOpen(false);
    setActiveBookingForDelivery(null);
  };

  const [completingBookingId, setCompletingBookingId] = useState<number | null>(null);

  const handleDeliverySuccess = () => {
    mutate();
  };

  const handleCompleteBooking = async (bookingId: number) => {
    const target = bookingList.find((b) => b.id === bookingId);
    const confirm = window.confirm(
      `Confirm delivery completed for Booking #${target?.bookingNumber || bookingId}? This will mark the order fulfilled and move it to Booking History.`
    );
    if (!confirm) return;

    setCompletingBookingId(bookingId);
    try {
      const res = await fetch(`/api/v1/bookings/${bookingId}/complete`, {
        method: "POST",
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to mark booking completed");
      }
      mutate();
    } catch (e: any) {
      console.error(e);
      alert(e.message || "Failed to complete booking");
    } finally {
      setCompletingBookingId(null);
    }
  };

  const handleEditBooking = (booking: BookingResponse) => {
    setSelectedEditBooking(booking);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedEditBooking(null);
  };

  const handleDeleteBooking = async (booking: BookingResponse) => {
    const adv = Number(booking.advancePaid || 0);
    const hasAdv = adv > 0;
    const custName = booking.customer?.name || "Customer";

    const confirmMsg = hasAdv
      ? `⚠️ CRITICAL CONFIRMATION: Advance Booking #${booking.bookingNumber} for "${custName}" has an Advance Payment of ₹${adv.toLocaleString("en-IN")}.\n\n` +
        `Deleting this booking will:\n` +
        `1. Restore inventory stock for all billed furniture items.\n` +
        `2. Revert reserved serialized units to in-stock.\n` +
        `3. Permanently remove linked bills from sales records.\n` +
        `4. Dispatch a cancellation WhatsApp message with refund advice to ${custName}.\n\n` +
        `⚠️ IMPORTANT: You MUST refund ₹${adv.toLocaleString("en-IN")} to ${custName}.\n\n` +
        `Are you sure you want to permanently delete this booking?`
      : `Confirm deletion of Advance Booking #${booking.bookingNumber} for "${custName}"?\n\n` +
        `All reserved stock will be restored and linked bills removed. This action cannot be undone.`;

    const isConfirmed = window.confirm(confirmMsg);
    if (!isConfirmed) return;

    setDeletingBookingId(booking.id);
    try {
      const res = await fetch(`/api/v1/bookings/${booking.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Deletion not possible. All database operations have been reverted.");
      }

      if (data.refundRequired) {
        alert(
          `✅ Advance Booking #${booking.bookingNumber} deleted successfully!\n\n` +
          `⚠️ REFUND REMINDER:\n` +
          `Please refund ₹${adv.toLocaleString("en-IN")} to ${custName} immediately in cash or UPI.`
        );
      } else {
        alert(`✅ Advance Booking #${booking.bookingNumber} deleted successfully and inventory stock restored.`);
      }

      mutate();
    } catch (e: any) {
      console.error("Booking deletion failed:", e);
      alert(`❌ Deletion not possible: ${e.message || "An error occurred while deleting the booking."}`);
    } finally {
      setDeletingBookingId(null);
    }
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setStatusFilter("ALL");
  };

  const hasActiveFilters = searchQuery.trim() !== "" || statusFilter !== "ALL";

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Page Header */}
      <BookingsHeader />

      {/* 2. Top Metric Cards */}
      <BookingsStatsSummary bookings={bookingList} />

      {/* 3. Search and Filter Bar */}
      <BookingsFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        department={department}
      />

      {/* 4. Bookings Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div
              key={idx}
              className="h-64 bg-gray-100 rounded-xl animate-pulse border border-gray-200"
            />
          ))}
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 text-red-700 rounded-xl border border-red-200 text-center">
          <p className="font-semibold">{error.message || "Failed to load advance bookings."}</p>
          <button
            onClick={() => mutate()}
            className="mt-3 px-4 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold"
          >
            Try Again
          </button>
        </div>
      ) : bookingList.length === 0 ? (
        <BookingListEmptyState
          hasFilters={hasActiveFilters}
          onClearFilters={handleClearFilters}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {bookingList.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              onOpenDeliveryModal={handleOpenDeliveryModal}
              onViewSlip={setSelectedSlipBooking}
              onCompleteBooking={handleCompleteBooking}
              completingBookingId={completingBookingId}
              onEdit={handleEditBooking}
              onDelete={handleDeleteBooking}
              onCollectDue={(bill) => setSelectedDueBill(bill)}
            />
          ))}
        </div>
      )}

      {/* 5. Delivery Invoice Modal */}
      <DeliveryInvoiceModal
        booking={activeBookingForDelivery}
        isOpen={isDeliveryModalOpen}
        onClose={handleCloseDeliveryModal}
        onSuccess={handleDeliverySuccess}
      />

      {/* 6. Wedding Package Booking Slip Modal */}
      <BookingSlipModal
        booking={selectedSlipBooking}
        isOpen={Boolean(selectedSlipBooking)}
        onClose={() => setSelectedSlipBooking(null)}
      />

      {/* 7. Edit Advance Booking Modal */}
      <EditBookingModal
        booking={selectedEditBooking}
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onSuccess={() => mutate()}
      />

      {/* 8. Collect Due Payment Modal */}
      <CollectDuePaymentModal
        isOpen={Boolean(selectedDueBill)}
        bill={selectedDueBill}
        onClose={() => setSelectedDueBill(null)}
        onSuccess={() => mutate()}
      />
    </div>
  );
}
