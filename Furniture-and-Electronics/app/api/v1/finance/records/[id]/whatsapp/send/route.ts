import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  botSendMessage,
  isBotConfigured,
  normalizePhoneNumber,
} from "@/lib/whatsapp/client";
import { getWhatsappSettings } from "@/lib/whatsapp/dispatch";
import { formatFinanceInvoiceMessage } from "@/lib/whatsapp/templates";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const recordId = parseInt(id, 10);
    if (isNaN(recordId)) {
      return NextResponse.json({ error: "Invalid finance record ID" }, { status: 400 });
    }

    const body = await req.json();
    const contactName = String(body.contactName || "").trim();
    const normalizedPhone = normalizePhoneNumber(String(body.phone || ""));
    const pdfBase64 = String(body.pdfBase64 || "").trim();

    if (!contactName) {
      return NextResponse.json({ error: "Contact name is required" }, { status: 400 });
    }
    if (!/^\d{10}$/.test(normalizedPhone)) {
      return NextResponse.json({ error: "Valid 10-digit phone number is required" }, { status: 400 });
    }
    if (!pdfBase64) {
      return NextResponse.json({ error: "PDF attachment is required" }, { status: 400 });
    }

    const record = await prisma.financeRecord.findUnique({
      where: { id: recordId },
      select: { id: true, invoiceNumber: true },
    });
    if (!record) {
      return NextResponse.json({ error: "Finance record not found" }, { status: 404 });
    }

    const settings = await getWhatsappSettings();
    if (!isBotConfigured() && settings.status !== "connected") {
      return NextResponse.json(
        { error: "WhatsApp service is not configured or disconnected" },
        { status: 503 }
      );
    }

    const invoiceNumber = record.invoiceNumber || `FIN-${record.id}`;
    const text = formatFinanceInvoiceMessage({
      contactName,
      invoiceNumber,
    });

    await botSendMessage({
      phone: normalizedPhone,
      text,
      pdfFilename: `Laxmi_Finance_Invoice_${invoiceNumber}.pdf`,
      pdfBase64,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Finance WhatsApp send error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send finance invoice via WhatsApp" },
      { status: 502 }
    );
  }
}
