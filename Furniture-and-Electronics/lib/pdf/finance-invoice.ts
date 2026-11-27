"use client";

import React from "react";
import { createRoot } from "react-dom/client";
import FinanceInvoiceTemplate from "@/components/dashboard/finance/FinanceInvoiceTemplate";
import { FinanceRecordItem } from "@/hooks/useFinanceRecords";

export async function generateFinanceInvoicePdfBlob(
  record: FinanceRecordItem
): Promise<Blob> {
  const jsPDF = (await import("jspdf")).default;
  const html2canvas = (await import("html2canvas-pro")).default;

  const container = document.createElement("div");
  container.style.position = "absolute";
  container.style.left = "-9999px";
  container.style.top = "-9999px";
  container.style.width = "760px";
  container.style.padding = "0px";
  container.style.margin = "0px";
  container.style.boxSizing = "border-box";
  container.style.background = "#FAF7F2";
  document.body.appendChild(container);

  const root = createRoot(container);

  await new Promise<void>((resolve) => {
    root.render(React.createElement(FinanceInvoiceTemplate, { record }));
    // Allow React & logo/signature images to flush
    setTimeout(resolve, 200);
  });

  const canvas = await html2canvas(container, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#FAF7F2",
  });

  root.unmount();
  document.body.removeChild(container);

  const imgData = canvas.toDataURL("image/jpeg", 0.82);
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const imgWidth = pdfWidth - 16; // 8mm horizontal margins
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  pdf.addImage(imgData, "JPEG", 8, 8, imgWidth, imgHeight, undefined, "FAST");
  return pdf.output("blob");
}
