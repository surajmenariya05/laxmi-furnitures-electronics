"use client";

import React from "react";
import { FinanceRecordItem } from "@/hooks/useFinanceRecords";
import { numberToWords } from "@/components/dashboard/InvoiceTemplate";

interface FinanceInvoiceTemplateProps {
  record: FinanceRecordItem;
}

export default function FinanceInvoiceTemplate({ record }: FinanceInvoiceTemplateProps) {
  const qty = Math.max(1, Number(record.quantity || 1));
  const totalAmount = Number(record.productPrice || 0);
  const pricePerUnit = totalAmount / qty;
  const formattedDate = new Date(record.financeDate).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const amountInWords = `${numberToWords(totalAmount)} only`;

  return (
    <div
      className="bg-[#FAF7F2] text-[#2C221E] mx-auto min-w-[680px] md:min-w-0 max-w-[760px] p-6 sm:p-8 print:min-w-0 print:p-6 shadow-sm border border-[#E6DFD3] relative overflow-hidden break-inside-avoid"
      style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
    >
      {/* Top Branded Header */}
      <div className="flex justify-between items-start gap-6 pb-4 border-b border-[#D8CBB8]">
        <div className="flex items-center gap-4">
          <img
            src="/LBF%20logo.png"
            alt="Laxmi Electronics & Furniture"
            onError={(e) => {
              e.currentTarget.src = "/logo.png";
            }}
            className="w-16 h-16 object-contain shrink-0"
          />
          <div>
            <h1 className="text-3xl font-normal tracking-[0.14em] text-[#4A1018] leading-none">
              LAXMI
            </h1>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="h-[1px] w-5 bg-[#BFA57D]" />
              <span className="text-[10px] tracking-[0.26em] text-[#6E5C4F] font-sans font-semibold uppercase">
                ELECTRONICS &amp; FURNITURE
              </span>
              <span className="h-[1px] w-5 bg-[#BFA57D]" />
            </div>
            <p className="text-[11px] tracking-[0.14em] text-[#7D6D61] font-sans font-medium uppercase mt-1.5">
              BHINDER, UDAIPUR (RAJASTHAN) · PH: 8209399683
            </p>
          </div>
        </div>

        <div className="text-right">
          <h2 className="text-2xl tracking-[0.18em] text-[#4A1018] font-normal">
            TAX INVOICE
          </h2>
          <div className="h-[1.5px] w-12 bg-[#BFA57D] ml-auto my-2.5" />
          <div className="text-[11px] font-sans space-y-1 text-[#5E5046]">
            <div className="flex justify-end gap-4">
              <span className="uppercase tracking-wider text-[#8C7B6E] font-semibold">
                Invoice No.:
              </span>
              <span className="font-bold text-[#2C221E] min-w-[95px]">
                {record.invoiceNumber}
              </span>
            </div>
            <div className="flex justify-end gap-4">
              <span className="uppercase tracking-wider text-[#8C7B6E] font-semibold">
                Date:
              </span>
              <span className="font-bold text-[#2C221E] min-w-[95px]">
                {formattedDate}
              </span>
            </div>
            <div className="flex justify-end gap-4">
              <span className="uppercase tracking-wider text-[#8C7B6E] font-semibold whitespace-nowrap">
                Financed By:
              </span>
              <span className="font-bold text-[#4A1018] min-w-[95px]">
                {record.providerName}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bill To Section */}
      <div className="py-4">
        <div className="text-[10px] font-sans font-bold tracking-[0.2em] text-[#8C7B6E] uppercase mb-1.5">
          Bill To
        </div>
        <div className="text-lg font-bold text-[#4A1018]">
          Mr/Miss/Mrs. {record.customerName.toUpperCase()}
        </div>
        {record.customerAddress && (
          <p className="text-sm font-sans font-medium text-[#4A3D35] mt-1 max-w-md leading-relaxed">
            {record.customerAddress}
          </p>
        )}
        {record.customerPhone && (
          <p className="text-xs font-sans text-[#4A1018] font-semibold mt-1">
            Mobile Number: {record.customerPhone}
          </p>
        )}
      </div>

      {/* Editorial Burgundy Table */}
      <div className="mt-2">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-[#4A1018] text-white font-sans text-[10px] uppercase tracking-[0.16em]">
              <th className="py-2.5 px-3 text-left font-semibold w-10">#</th>
              <th className="py-2.5 px-3 text-left font-semibold">Item Name</th>
              <th className="py-2.5 px-3 text-center font-semibold">HSN / SAC</th>
              <th className="py-2.5 px-3 text-center font-semibold">Quantity</th>
              <th className="py-2.5 px-3 text-right font-semibold">Price / Unit</th>
              <th className="py-2.5 px-3 text-right font-semibold">Amount</th>
            </tr>
          </thead>
          <tbody className="font-sans text-xs text-[#2C221E]">
            <tr className="border-b border-[#E5DCCF]">
              <td className="py-3.5 px-3">1</td>
              <td className="py-3.5 px-3 font-semibold text-[#2C221E]">
                <div>{record.productName}</div>
                {record.serialNumber && (
                  <div className="text-[10.5px] font-mono font-normal text-[#6E5C4F] mt-0.5">
                    S/N: {record.serialNumber}
                  </div>
                )}
              </td>
              <td className="py-3.5 px-3 text-center text-[#6E5C4F]">
                {record.hsnSac || "—"}
              </td>
              <td className="py-3.5 px-3 text-center">{qty}</td>
              <td className="py-3.5 px-3 text-right whitespace-nowrap">
                ₹ {pricePerUnit.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              <td className="py-3.5 px-3 text-right font-bold whitespace-nowrap">
                ₹ {totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
            </tr>
            <tr className="border-b border-[#C8B9A6] bg-[#F4EFE6]/70 font-bold">
              <td className="py-2.5 px-3" />
              <td className="py-2.5 px-3 uppercase text-[11px] tracking-wider text-[#4A1018]">
                Total
              </td>
              <td className="py-2.5 px-3" />
              <td className="py-2.5 px-3 text-center">{qty}</td>
              <td className="py-2.5 px-3" />
              <td className="py-2.5 px-3 text-right text-[#4A1018] whitespace-nowrap">
                ₹ {totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Bottom Summary & Editorial Sign-off */}
      <div className="grid grid-cols-2 gap-6 mt-6 pt-2">
        {/* Left: Amount in Words, Terms & Thank You */}
        <div className="flex flex-col justify-between space-y-4">
          <div className="font-sans space-y-3">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8C7B6E]">
                Invoice Amount In Words
              </div>
              <div className="text-xs font-semibold text-[#2C221E] mt-1">
                {amountInWords}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8C7B6E]">
                Terms And Conditions
              </div>
              <div className="text-xs text-[#5E5046] mt-0.5">
                Thank you for doing business with us.
              </div>
            </div>
          </div>

          <div className="pt-4">
            <div
              className="text-3xl italic text-[#4A1018]/90 leading-none"
              style={{ fontFamily: "'Brush Script MT', Georgia, serif" }}
            >
              Thank You
            </div>
            <div className="text-[9px] font-sans tracking-[0.22em] text-[#6E5C4F] uppercase mt-1.5">
              FOR CHOOSING LAXMI ELECTRONICS &amp; FURNITURE
            </div>
          </div>
        </div>

        {/* Right: Totals + Signatory */}
        <div className="border-l border-[#D8CBB8] pl-6 flex flex-col justify-between">
          <div className="font-sans text-xs space-y-2">
            <div className="flex justify-between text-[#5E5046]">
              <span>Sub Total</span>
              <span className="font-semibold">
                ₹ {totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-y border-[#BFA57D] text-sm font-bold text-[#4A1018]">
              <span>Total</span>
              <span>
                ₹ {totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between text-[#5E5046] pt-1">
              <span>Received</span>
              <span className="font-semibold text-[#2C221E]">
                ₹ {totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between text-[#5E5046]">
              <span>Balance</span>
              <span className="font-semibold text-[#2C221E]">₹ 0.00</span>
            </div>
          </div>

          <div className="mt-6 text-right font-sans">
            <div className="text-[11px] font-semibold text-[#5E5046] mb-1">
              For: Laxmi electronics and furniture
            </div>
            <div className="flex justify-end my-1">
              <img
                src="/laxmi_authorized_signature_transparent.png"
                alt="Authorized Signature"
                className="h-10 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            </div>
            <div className="pt-1.5 border-t border-[#D8CBB8] inline-block min-w-[160px] text-[11px] font-bold text-[#4A1018] uppercase tracking-wider">
              Authorized Signatory
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
