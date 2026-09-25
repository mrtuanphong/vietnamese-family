import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureFinanceSchema } from "@/lib/ensureFinanceSchema";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureFinanceSchema();
    const { id } = await params;

    const tx = await prisma.transaction.findUnique({ where: { id } });
    if (!tx) {
      return NextResponse.json({ error: "Không tìm thấy giao dịch." }, { status: 404 });
    }

    const fund = await prisma.fund.findUnique({ where: { id: tx.fundId } });
    if (fund) {
      // Reverse balance change
      const reversedBalance =
        tx.type === "INCOME"
          ? fund.balance - tx.amount
          : fund.balance + tx.amount;

      await prisma.$transaction([
        prisma.fund.update({
          where: { id: fund.id },
          data: { balance: reversedBalance },
        }),
        prisma.transaction.delete({ where: { id } }),
      ]);
    } else {
      await prisma.transaction.delete({ where: { id } });
    }

    return NextResponse.json({ success: true, message: "Đã hủy giao dịch." });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
