/**
 * WhatsApp Message Templates
 *
 * Professional, concise, markdown-formatted message generators for Laxmi Electronics & Furnitures.
 */

import {
  BillTemplateData,
  BookingNewTemplateData,
  DeliveryInvoiceTemplateData,
  BookingSettledTemplateData,
  BookingDeliveredWithDueTemplateData,
  BookingSlipCopyTemplateData,
  DuePaymentTemplateData,
  BookingCancelledTemplateData,
} from "./types";

const STORE_SIGNATURE = `📞 Helpline & Support: +91 820 939 9683\n_Laxmi Electronics & Furnitures, Main Market, Bhinder_`;

function formatCurrency(amount: number): string {
  return Number(amount || 0).toLocaleString("en-IN");
}

/**
 * 1. Walk-in / Immediate Tax Invoice Message (Used for Regular & Furniture Invoices)
 */
export function formatBillInvoiceMessage(data: BillTemplateData): string {
  const hasDue = data.dueAmount > 0;

  return [
    `🧾 *TAX INVOICE: LAXMI ELECTRONICS & FURNITURES*`,
    ``,
    `Namaste *${data.customerName}* ji 🙏,`,
    `Thank you for shopping with us! Here is your official invoice *#${data.billNumber}*.`,
    ``,
    `📊 *Bill Summary:*`,
    `• Invoice No: *#${data.billNumber}*`,
    `• Date: ${data.date}`,
    `• Total Amount: *₹${formatCurrency(data.totalAmount)}*`,
    `• Amount Paid: *₹${formatCurrency(data.paidAmount)}*`,
    `• Balance Due: *₹${formatCurrency(data.dueAmount)}*`,
    ``,
    hasDue
      ? `⚠️ *Payment Status:* Pending balance of *₹${formatCurrency(data.dueAmount)}*`
      : `✅ *Payment Status:* Paid in Full`,
    ``,
    `📄 Your invoice PDF is attached below for your records.`,
    ``,
    STORE_SIGNATURE,
  ].join("\n");
}

/**
 * 2.0 Advance Booking Confirmation Message (Concise, no verbose breakdown)
 */
export function formatBookingNewMessage(data: BookingNewTemplateData): string {
  const lines: string[] = [
    `🎉 *BOOKING CONFIRMATION: LAXMI ELECTRONICS & FURNITURES*`,
    ``,
    `Namaste *${data.customerName}* ji 🙏,`,
    `Your advance package booking has been confirmed!`,
    ``,
    `🔖 *Booking Reference:* *${data.bookingNumber}*`,
    `📅 *Target Delivery Date:* *${data.expectedDeliveryDate}*`,
  ];

  if (data.eventDate) {
    lines.push(`🎊 *Event Date:* ${data.eventDate}`);
  }

  lines.push(
    ``,
    `💰 *Payment Details:*`,
    `• Total Package: *₹${formatCurrency(data.totalAmount)}*`,
    `• Advance Paid: *₹${formatCurrency(data.advancePaid)}*`,
    `• Balance Due on Delivery: *₹${formatCurrency(data.remainingBalance)}*`,
    ``,
    `📄 Your official Booking Slip PDF is attached below.`,
    ``,
    STORE_SIGNATURE
  );

  return lines.join("\n");
}

/**
 * 2.1 Individual Electronics Delivery Invoice Message
 */
export function formatDeliveryInvoiceMessage(data: DeliveryInvoiceTemplateData): string {
  const lines: string[] = [
    `⚡ *DELIVERY INVOICE: LAXMI ELECTRONICS*`,
    ``,
    `Namaste *${data.customerName}* ji 🙏,`,
    `Your electronics delivery for Booking *#${data.bookingNumber}* has been billed and prepared!`,
    ``,
    `🧾 *Invoice Number:* *${data.billNumber}*`,
    `📅 *Dispatch Date:* ${data.deliveryDate}`,
    ``,
    `📺 *Items Delivered:*`,
  ];

  for (const item of data.items) {
    lines.push(`• *${item.productName}* (Qty: ${item.quantity})`);
    if (item.serialNumber) {
      lines.push(`  - Serial: \`${item.serialNumber}\``);
    }
  }

  lines.push(
    ``,
    `💳 *Payment Ledger:*`,
    `• Invoice Total: *₹${formatCurrency(data.invoiceTotal)}*`,
    `• Paid with Delivery: *₹${formatCurrency(data.amountPaidNow)}*`,
    `• Remaining Booking Balance: *₹${formatCurrency(data.remainingBalance)}*`,
    ``,
    `📄 Attached is your delivery tax invoice with warranty coverage.`,
    ``,
    STORE_SIGNATURE
  );

  return lines.join("\n");
}

/**
 * 2.2 Booking Settlement / Completion Message
 */
export function formatBookingSettledMessage(data: BookingSettledTemplateData): string {
  return [
    `🎊 *ORDER COMPLETED: LAXMI ELECTRONICS & FURNITURES*`,
    ``,
    `Namaste *${data.customerName}* ji 🙏,`,
    `Heartiest congratulations! Your order *#${data.bookingNumber}* has been fully delivered and all accounts are settled.`,
    ``,
    `✨ *Settlement Summary:*`,
    `• Total Order Value: *₹${formatCurrency(data.totalAmount)}*`,
    `• Total Paid: *₹${formatCurrency(data.totalAmount)}*`,
    `• Outstanding Balance: *₹0 (Fully Paid)*`,
    `• Delivery Status: *All Items Delivered* ✅`,
    ``,
    `Thank you for choosing Laxmi Electronics & Furnitures!`,
    ``,
    STORE_SIGNATURE,
  ].join("\n");
}

/**
 * 2.2b Booking Delivery with Pending Balance Message
 */
export function formatBookingDeliveredWithDueMessage(data: BookingDeliveredWithDueTemplateData): string {
  return [
    `🚚 *ORDER DELIVERED: LAXMI ELECTRONICS & FURNITURES*`,
    ``,
    `Namaste *${data.customerName}* ji 🙏,`,
    `Your order *#${data.bookingNumber}* items have been successfully delivered and handed over!`,
    ``,
    `📊 *Order & Balance Summary:*`,
    `• Total Order Value: *₹${formatCurrency(data.totalAmount)}*`,
    `• Total Paid So Far: *₹${formatCurrency(data.paidAmount)}*`,
    `• Pending Balance Due: *₹${formatCurrency(data.remainingDue)}*`,
    `• Delivery Status: *All Items Delivered* ✅`,
    ``,
    `⚠️ Please settle the remaining balance of *₹${formatCurrency(data.remainingDue)}* at your earliest convenience.`,
    ``,
    `Thank you for choosing Laxmi Electronics & Furnitures!`,
    ``,
    STORE_SIGNATURE,
  ].join("\n");
}

/**
 * 2.3 Quick Action: Booking Slip Copy
 */
export function formatBookingSlipCopyMessage(data: BookingSlipCopyTemplateData): string {
  return [
    `📋 *BOOKING SLIP: LAXMI ELECTRONICS & FURNITURES*`,
    ``,
    `Namaste *${data.customerName}* ji 🙏,`,
    `Here is your Booking Slip for Booking *#${data.bookingNumber}*.`,
    ``,
    `• Target Delivery: *${data.expectedDeliveryDate}*`,
    `• Total Package: *₹${formatCurrency(data.totalAmount)}*`,
    `• Advance Paid: *₹${formatCurrency(data.advancePaid)}*`,
    `• Balance Due on Delivery: *₹${formatCurrency(data.remainingBalance)}*`,
    ``,
    `📄 Your official Booking Slip PDF is attached below.`,
    ``,
    STORE_SIGNATURE,
  ].join("\n");
}

/**
 * 3. Due Payment Installment / Full Settlement Message
 */
export function formatDuePaymentMessage(data: DuePaymentTemplateData): string {
  if (data.isFullyPaid) {
    return [
      `🎉 *FULL PAYMENT RECEIVED - ZERO DUES: LAXMI ELECTRONICS & FURNITURES*`,
      ``,
      `Namaste *${data.customerName}* ji 🙏,`,
      `Thank you! Your payment of *₹${formatCurrency(data.installmentAmount)}* for Invoice *#${data.billNumber}* has fully settled your account.`,
      ``,
      `✅ *Account Status:*`,
      `• Total Bill Amount: *₹${formatCurrency(data.totalAmount)}*`,
      `• Total Paid: *₹${formatCurrency(data.totalAmount)}*`,
      `• Outstanding Balance: *₹0 (NIL DUES)*`,
      ``,
      `📄 Attached is your final zero-dues receipt.`,
      ``,
      STORE_SIGNATURE,
    ].join("\n");
  }

  return [
    `💳 *PAYMENT RECEIPT: LAXMI ELECTRONICS & FURNITURES*`,
    ``,
    `Namaste *${data.customerName}* ji 🙏,`,
    `We have received an installment payment against Invoice *#${data.billNumber}*.`,
    ``,
    `💰 *Transaction Details:*`,
    `• Installment Received: *₹${formatCurrency(data.installmentAmount)}*`,
    `• Payment Mode: ${data.paymentMode}`,
    `• Date: ${data.paymentDate}`,
    ``,
    `📊 *Updated Account Status:*`,
    `• Total Bill Amount: *₹${formatCurrency(data.totalAmount)}*`,
    `• Total Paid: *₹${formatCurrency(data.paidAmount)}*`,
    `• Balance Due: *₹${formatCurrency(data.dueAmount)}*`,
    ``,
    `📄 Your updated payment receipt is attached.`,
    ``,
    STORE_SIGNATURE,
  ].join("\n");
}

/**
 * 4. Advance Booking Cancellation & Refund Advice Message
 */
export function formatBookingCancelledMessage(data: BookingCancelledTemplateData): string {
  const hasRefund = data.refundAmount > 0;

  const lines = [
    `❌ *BOOKING CANCELLED: LAXMI ELECTRONICS & FURNITURES*`,
    ``,
    `Namaste *${data.customerName}* ji 🙏,`,
    `Your Advance Booking *#${data.bookingNumber}* has been cancelled upon your request.`,
  ];

  if (hasRefund) {
    lines.push(
      ``,
      `💰 *Refund Details:*`,
      `• Advance Received: *₹${formatCurrency(data.advancePaid)}*`,
      `• Refund Amount: *₹${formatCurrency(data.refundAmount)}*`,
      ``,
      `ℹ️ Your refund is being processed by our store team. If you haven't received it yet in cash or UPI, please visit our store or contact us.`
    );
  }

  lines.push(
    ``,
    `For any assistance or questions, please feel free to reach out to us:`,
    STORE_SIGNATURE
  );

  return lines.join("\n");
}

