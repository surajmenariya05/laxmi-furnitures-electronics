import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { formatName } from "@/lib/format";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isOwner = session.user?.role === "owner";
    const { id } = await params;
    const recordId = parseInt(id, 10);
    if (isNaN(recordId)) {
      return NextResponse.json({ error: "Invalid finance record ID" }, { status: 400 });
    }

    const existing = await prisma.financeRecord.findUnique({
      where: { id: recordId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Finance record not found" }, { status: 404 });
    }

    const body = await req.json();
    const {
      financeProviderId,
      invoiceNumber,
      customerName,
      customerPhone,
      customerAddress,
      productName,
      serialNumber,
      hsnSac,
      quantity = 1,
      productPrice,
      downpayment = 0,
      netAmountReceived,
      financeDate,
    } = body;

    if (!financeProviderId) {
      return NextResponse.json({ error: "Finance Provider is required" }, { status: 400 });
    }
    if (!customerName || !String(customerName).trim()) {
      return NextResponse.json({ error: "Customer Name is required" }, { status: 400 });
    }
    if (!productName || !String(productName).trim()) {
      return NextResponse.json({ error: "Product / Item Name is required" }, { status: 400 });
    }
    if (productPrice === undefined || isNaN(Number(productPrice)) || Number(productPrice) <= 0) {
      return NextResponse.json({ error: "Valid Product Price is required" }, { status: 400 });
    }

    const updated = await prisma.financeRecord.update({
      where: { id: recordId },
      data: {
        financeProviderId: parseInt(financeProviderId, 10),
        ...(invoiceNumber !== undefined
          ? { invoiceNumber: String(invoiceNumber).trim() || existing.invoiceNumber }
          : {}),
        customerName: formatName(String(customerName).trim()),
        customerPhone: customerPhone ? String(customerPhone).trim() : null,
        customerAddress: customerAddress ? String(customerAddress).trim() : null,
        productName: String(productName).trim(),
        serialNumber: serialNumber ? String(serialNumber).trim() : null,
        hsnSac: hsnSac ? String(hsnSac).trim() : null,
        quantity: Math.max(1, parseInt(quantity, 10) || 1),
        productPrice: Number(productPrice),
        downpayment: Math.max(0, Number(downpayment) || 0),
        ...(isOwner && netAmountReceived !== undefined
          ? { netAmountReceived: Math.max(0, Number(netAmountReceived) || 0) }
          : {}),
        ...(financeDate ? { financeDate: new Date(financeDate) } : {}),
      },
      include: {
        financeProvider: true,
      },
    });

    return NextResponse.json({
      id: updated.id,
      invoiceNumber: updated.invoiceNumber,
      financeProviderId: updated.financeProviderId,
      providerName: updated.financeProvider.name,
      customerName: updated.customerName,
      customerPhone: updated.customerPhone || "",
      customerAddress: updated.customerAddress || "",
      productName: updated.productName,
      serialNumber: updated.serialNumber || "",
      hsnSac: updated.hsnSac || "",
      quantity: updated.quantity,
      productPrice: Number(updated.productPrice),
      downpayment: Number(updated.downpayment),
      ...(isOwner ? { netAmountReceived: Number(updated.netAmountReceived) } : {}),
      financeDate: updated.financeDate,
    });
  } catch (error: any) {
    console.error("Error updating finance record:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update finance record" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    await prisma.financeRecord.delete({ where: { id: recordId } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting finance record:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete finance record" },
      { status: 500 }
    );
  }
}
