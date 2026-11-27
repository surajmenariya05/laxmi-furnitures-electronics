"use client";

import { FinanceRecordItem } from "@/hooks/useFinanceRecords";
import { ToastContextType } from "@/components/dashboard/providers/ToastProvider";

export interface FinanceWhatsAppRecipient {
  name: string;
  phone: string;
}

export interface BackgroundFinanceDispatchParams {
  record: FinanceRecordItem;
  recipients: FinanceWhatsAppRecipient[];
  showToast: ToastContextType["showToast"];
}

/**
 * Generates the Finance Tax Invoice PDF once and sends it sequentially
 * in the background to each selected finance provider representative.
 */
export function dispatchFinanceWhatsAppInBackground({
  record,
  recipients,
  showToast,
}: BackgroundFinanceDispatchParams) {
  if (!recipients || recipients.length === 0) return;

  (async () => {
    try {
      const { generateFinanceInvoicePdfBlob } = await import(
        "@/lib/pdf/finance-invoice"
      );
      const pdfBlob = await generateFinanceInvoicePdfBlob(record);

      const pdfBase64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve((reader.result as string)?.split(",")[1] || "");
        };
        reader.readAsDataURL(pdfBlob);
      });

      if (!pdfBase64) {
        throw new Error("Failed to encode Finance Invoice PDF");
      }

      let successCount = 0;
      const failedNames: string[] = [];

      for (let i = 0; i < recipients.length; i++) {
        const recipient = recipients[i];
        try {
          const res = await fetch(
            `/api/v1/finance/records/${record.id}/whatsapp/send`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contactName: recipient.name,
                phone: recipient.phone,
                pdfBase64,
              }),
            }
          );

          if (res.ok) {
            successCount++;
          } else {
            failedNames.push(recipient.name);
          }
        } catch (err) {
          console.error(
            `Failed sending finance invoice to ${recipient.name}:`,
            err
          );
          failedNames.push(recipient.name);
        }

        // Brief pause between consecutive WhatsApp sends
        if (i < recipients.length - 1) {
          await new Promise((r) => setTimeout(r, 700));
        }
      }

      if (successCount === recipients.length) {
        showToast({
          type: "success",
          title: "WhatsApp Delivered",
          message: `Finance Invoice #${record.invoiceNumber} sent to ${successCount}/${recipients.length} representative${recipients.length > 1 ? "s" : ""}.`,
          duration: 6000,
        });
      } else if (successCount > 0) {
        showToast({
          type: "warning",
          title: "Partial WhatsApp Delivery",
          message: `Sent #${record.invoiceNumber} to ${successCount}/${recipients.length} representatives. Failed: ${failedNames.join(", ")}.`,
          duration: 7000,
        });
      } else {
        showToast({
          type: "warning",
          title: "WhatsApp Offline / Not Delivered",
          message: `Finance #${record.invoiceNumber} saved, but WhatsApp could not send to ${failedNames.join(", ")}.`,
          duration: 7000,
        });
      }
    } catch (err: any) {
      console.error("Background Finance WhatsApp dispatch failed:", err);
      showToast({
        type: "error",
        title: "WhatsApp Dispatch Failed",
        message:
          err.message ||
          `Failed to send Finance Invoice #${record.invoiceNumber} on WhatsApp.`,
        duration: 7000,
      });
    }
  })();
}
