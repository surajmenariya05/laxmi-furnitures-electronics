"use client";

import { ToastContextType } from "@/components/dashboard/providers/ToastProvider";

export interface BackgroundBookingDispatchParams {
  booking: any;
  uploadedDesignUrls: string[];
  customerName: string;
  customerPhone: string;
  furnitureBill?: any;
  showToast: ToastContextType["showToast"];
}

/**
 * Asynchronously generates PDFs and delivers WhatsApp notifications in the background
 * without blocking UI navigation or screen rendering.
 */
export function dispatchBookingWhatsAppInBackground({
  booking,
  uploadedDesignUrls,
  customerName,
  customerPhone,
  furnitureBill,
  showToast,
}: BackgroundBookingDispatchParams) {
  // Fire-and-forget async execution
  (async () => {
    try {
      let slipSuccess = false;
      let furnSuccess = false;

      // 1. Generate & Dispatch Booking Slip PDF
      try {
        const { generateBookingSlipPdfBlob } = await import("@/lib/pdf/booking-slip");
        const slipBlob = await generateBookingSlipPdfBlob(booking, uploadedDesignUrls);
        const base64data = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve((reader.result as string)?.split(",")[1] || "");
          };
          reader.readAsDataURL(slipBlob);
        });

        const res = await fetch(`/api/v1/bookings/${booking.id}/whatsapp/resend`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pdfBase64: base64data,
            isNewBooking: true,
          }),
        });

        if (res.ok) {
          slipSuccess = true;
        }
      } catch (slipErr) {
        console.error("Background WhatsApp booking slip dispatch error:", slipErr);
      }

      // 2. Generate & Dispatch Furniture Invoice PDF (if one was generated)
      if (furnitureBill && furnitureBill.id) {
        try {
          const { generateBillPdfBlob } = await import("@/lib/client-pdf");
          const furnBlob = await generateBillPdfBlob(furnitureBill);
          const furnFormData = new FormData();
          furnFormData.append("file", furnBlob, `Laxmi_Invoice_${furnitureBill.billNumber}.pdf`);
          furnFormData.append("customerName", customerName);
          furnFormData.append("mobileNumber", customerPhone);
          furnFormData.append("billNumber", furnitureBill.billNumber);

          const furnRes = await fetch(`/api/v1/bills/${furnitureBill.id}/whatsapp/upload`, {
            method: "POST",
            body: furnFormData,
          });

          if (furnRes.ok) {
            furnSuccess = true;
          }
        } catch (fErr) {
          console.error("Background WhatsApp furniture invoice dispatch error:", fErr);
        }
      }

      // 3. Trigger Global Floating Toast Notification
      if (slipSuccess || furnSuccess) {
        const documents: string[] = [];
        if (slipSuccess) documents.push("Booking Slip");
        if (furnSuccess) documents.push("Furniture Invoice");

        showToast({
          type: "success",
          title: "WhatsApp Delivered",
          message: `${documents.join(" & ")} delivered to ${customerName} (+91 ${customerPhone})`,
          duration: 6000,
        });
      } else {
        showToast({
          type: "warning",
          title: "WhatsApp Offline / Not Delivered",
          message: `Booking #${booking.bookingNumber} saved, but WhatsApp could not reach +91 ${customerPhone}. You can resend anytime from the card.`,
          duration: 7000,
        });
      }
    } catch (err: any) {
      console.error("Background WhatsApp dispatch failed:", err);
      showToast({
        type: "error",
        title: "WhatsApp Dispatch Failed",
        message: err.message || `Failed to send WhatsApp to +91 ${customerPhone}`,
        duration: 7000,
      });
    }
  })();
}
