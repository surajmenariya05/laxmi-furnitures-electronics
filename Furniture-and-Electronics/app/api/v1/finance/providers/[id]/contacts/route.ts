import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { normalizePhoneNumber } from "@/lib/whatsapp/client";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "owner") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const providerId = parseInt(id, 10);
    if (isNaN(providerId)) {
      return NextResponse.json({ error: "Invalid provider ID" }, { status: 400 });
    }

    const provider = await prisma.financeProvider.findUnique({
      where: { id: providerId },
    });
    if (!provider || !provider.isActive) {
      return NextResponse.json({ error: "Finance provider not found" }, { status: 404 });
    }

    const body = await req.json();
    const name = String(body.name || "").trim();
    const normalizedPhone = normalizePhoneNumber(String(body.phone || ""));

    if (!name) {
      return NextResponse.json({ error: "Person name is required" }, { status: 400 });
    }
    if (!/^\d{10}$/.test(normalizedPhone)) {
      return NextResponse.json(
        { error: "Valid 10-digit mobile number is required" },
        { status: 400 }
      );
    }

    const contact = await prisma.financeProviderContact.create({
      data: {
        financeProviderId: providerId,
        name,
        phone: normalizedPhone,
      },
    });

    return NextResponse.json(contact, { status: 201 });
  } catch (error) {
    console.error("Error adding finance provider contact:", error);
    return NextResponse.json(
      { error: "Failed to add contact" },
      { status: 500 }
    );
  }
}
