import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { formatName } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isOwner = session.user?.role === "owner";
    const { searchParams } = new URL(req.url);
    const search = (searchParams.get("search") || "").trim();
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const pageStr = searchParams.get("page");
    const limitStr = searchParams.get("limit");

    const page = pageStr ? Math.max(parseInt(pageStr, 10) || 1, 1) : 1;
    const limit = limitStr ? Math.min(Math.max(parseInt(limitStr, 10) || 50, 1), 100) : 100;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (startDate || endDate) {
      where.financeDate = {};
      if (startDate) {
        const s = new Date(startDate);
        s.setHours(0, 0, 0, 0);
        where.financeDate.gte = s;
      }
      if (endDate) {
        const e = new Date(endDate);
        e.setHours(23, 59, 59, 999);
        where.financeDate.lte = e;
      }
    }

    if (search) {
      where.OR = [
        { customerName: { contains: search, mode: "insensitive" } },
        { customerPhone: { contains: search } },
        { invoiceNumber: { contains: search, mode: "insensitive" } },
        { productName: { contains: search, mode: "insensitive" } },
        { financeProvider: { name: { contains: search, mode: "insensitive" } } },
        { bill: { billNumber: { contains: search, mode: "insensitive" } } },
        { bill: { customer: { name: { contains: search, mode: "insensitive" } } } },
      ];
    }

    const [records, allDateMatchingRecords] = await Promise.all([
      prisma.financeRecord.findMany({
        where,
        skip,
        take: limit,
        include: {
          bill: {
            include: { customer: true },
          },
          financeProvider: true,
        },
        orderBy: [{ financeDate: "desc" }, { createdAt: "desc" }],
      }),
      prisma.financeRecord.findMany({
        where: where.financeDate ? { financeDate: where.financeDate } : {},
        select: {
          id: true,
          netAmountReceived: true,
        },
      }),
    ]);

    const totalCount = allDateMatchingRecords.length;
    const totalBankReceived = isOwner
      ? allDateMatchingRecords.reduce(
          (sum, r) => sum + Number(r.netAmountReceived || 0),
          0
        )
      : null;

    const data = records.map((record) => {
      const productPrice = Number(
        Number(record.productPrice || 0) > 0
          ? record.productPrice
          : record.bill?.totalAmount || 0
      );
      return {
        id: record.id,
        billId: record.billId,
        invoiceNumber:
          record.invoiceNumber ||
          record.bill?.billNumber ||
          `FIN-${record.id}`,
        financeProviderId: record.financeProviderId,
        providerName: record.financeProvider.name,
        customerName:
          record.customerName && record.customerName !== "Guest"
            ? record.customerName
            : record.bill?.customer?.name || "Guest",
        customerPhone:
          record.customerPhone || record.bill?.customer?.phone || "",
        customerAddress:
          record.customerAddress || record.bill?.customer?.address || "",
        productName: record.productName || "Financed Product",
        hsnSac: record.hsnSac || "",
        quantity: record.quantity || 1,
        productPrice,
        downpayment: Number(record.downpayment || 0),
        ...(isOwner
          ? { netAmountReceived: Number(record.netAmountReceived || 0) }
          : {}),
        financeDate: record.financeDate || record.createdAt,
        createdAt: record.createdAt,
      };
    });

    return NextResponse.json({
      records: data,
      kpis: {
        totalCount,
        ...(isOwner ? { totalBankReceived } : {}),
      },
      isOwner,
    });
  } catch (error) {
    console.error("Error fetching finance records:", error);
    return NextResponse.json({ error: "Failed to fetch records" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isOwner = session.user?.role === "owner";
    const body = await req.json();

    const {
      financeProviderId,
      invoiceNumber,
      customerName,
      customerPhone,
      customerAddress,
      productName,
      hsnSac,
      quantity = 1,
      productPrice,
      downpayment = 0,
      netAmountReceived = 0,
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

    const year = new Date().getFullYear();
    let finalInvoiceNo = invoiceNumber ? String(invoiceNumber).trim() : "";
    if (!finalInvoiceNo) {
      const count = await prisma.financeRecord.count();
      finalInvoiceNo = `FIN-${year}-${String(count + 1).padStart(4, "0")}`;
    }

    const created = await prisma.financeRecord.create({
      data: {
        financeProviderId: parseInt(financeProviderId, 10),
        invoiceNumber: finalInvoiceNo,
        customerName: formatName(String(customerName).trim()),
        customerPhone: customerPhone ? String(customerPhone).trim() : null,
        customerAddress: customerAddress ? String(customerAddress).trim() : null,
        productName: String(productName).trim(),
        hsnSac: hsnSac ? String(hsnSac).trim() : null,
        quantity: Math.max(1, parseInt(quantity, 10) || 1),
        productPrice: Number(productPrice),
        downpayment: Math.max(0, Number(downpayment) || 0),
        netAmountReceived: isOwner ? Math.max(0, Number(netAmountReceived) || 0) : 0,
        financeDate: financeDate ? new Date(financeDate) : new Date(),
      },
      include: {
        financeProvider: true,
      },
    });

    return NextResponse.json(
      {
        id: created.id,
        invoiceNumber: created.invoiceNumber,
        financeProviderId: created.financeProviderId,
        providerName: created.financeProvider.name,
        customerName: created.customerName,
        customerPhone: created.customerPhone || "",
        customerAddress: created.customerAddress || "",
        productName: created.productName,
        hsnSac: created.hsnSac || "",
        quantity: created.quantity,
        productPrice: Number(created.productPrice),
        downpayment: Number(created.downpayment),
        ...(isOwner ? { netAmountReceived: Number(created.netAmountReceived) } : {}),
        financeDate: created.financeDate,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating finance record:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create finance record" },
      { status: 500 }
    );
  }
}
