import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureFinanceSchema } from "@/lib/ensureFinanceSchema";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureFinanceSchema();
    const { id } = await params;

    const fund = await prisma.fund.findUnique({
      where: { id },
      include: {
        transactions: {
          orderBy: { createdAt: "desc" },
          take: 50,
        },
      },
    });

    if (!fund) {
      return NextResponse.json({ error: "Không tìm thấy quỹ." }, { status: 404 });
    }

    return NextResponse.json(fund);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureFinanceSchema();
    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.fund.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Không tìm thấy quỹ." }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = String(body.name).trim();
    if (body.description !== undefined) updateData.description = body.description ? String(body.description).trim() : null;
    if (body.cycleType !== undefined) updateData.cycleType = body.cycleType;
    if (body.cycleName !== undefined) updateData.cycleName = body.cycleName;
    if (body.amountPerCycle !== undefined) updateData.amountPerCycle = Number(body.amountPerCycle);
    if (body.currentCycle !== undefined) updateData.currentCycle = body.currentCycle;
    if (body.balance !== undefined) updateData.balance = Number(body.balance);
    if (body.bankName !== undefined) updateData.bankName = body.bankName;
    if (body.bankAccount !== undefined) updateData.bankAccount = body.bankAccount;
    if (body.accountHolder !== undefined) updateData.accountHolder = body.accountHolder;

    const updated = await prisma.fund.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureFinanceSchema();
    const { id } = await params;

    const txCount = await prisma.transaction.count({ where: { fundId: id } });
    if (txCount > 0) {
      return NextResponse.json(
        { error: `Không thể xóa quỹ vì đang có ${txCount} giao dịch thu/chi liên quan.` },
        { status: 400 }
      );
    }

    await prisma.fund.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Đã xóa quỹ." });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
