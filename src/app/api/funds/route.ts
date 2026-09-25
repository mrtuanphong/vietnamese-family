import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureFinanceSchema } from "@/lib/ensureFinanceSchema";

export async function GET() {
  try {
    await ensureFinanceSchema();

    const client = prisma as any;
    if (client.fund?.findMany) {
      try {
        const funds = await client.fund.findMany({
          orderBy: { createdAt: "asc" },
          include: {
            _count: {
              select: { transactions: true },
            },
          },
        });
        return NextResponse.json(funds);
      } catch (err) {
        console.warn("⚠️ [Funds API] Fallback to raw query:", err);
      }
    }

    // Direct SQL fallback
    const funds = await prisma.$queryRawUnsafe(`
      SELECT f.*, COALESCE(COUNT(t.id), 0)::int as "_count_transactions"
      FROM "Fund" f
      LEFT JOIN "Transaction" t ON t."fundId" = f.id
      GROUP BY f.id
      ORDER BY f."createdAt" ASC;
    `);

    const formatted = (funds as any[]).map((f) => ({
      ...f,
      _count: {
        transactions: f._count_transactions || 0,
      },
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureFinanceSchema();

    const body = await req.json();
    const {
      name,
      description,
      cycleType = "1_YEAR",
      cycleName = "Hàng năm (1 năm / lần)",
      amountPerCycle = 500000,
      currentCycle = "Năm 2026",
      bankName = "MB",
      bankAccount = "0988889999",
      accountHolder = "THU QUY DONG HO",
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Tên quỹ không được để trống." }, { status: 400 });
    }

    const client = prisma as any;
    if (client.fund?.create) {
      const fund = await client.fund.create({
        data: {
          name: name.trim(),
          description: description ? description.trim() : null,
          cycleType,
          cycleName,
          amountPerCycle: Number(amountPerCycle) || 0,
          currentCycle,
          balance: 0,
          bankName,
          bankAccount,
          accountHolder,
        },
      });
      return NextResponse.json(fund, { status: 201 });
    }

    const newId = `fund_${Date.now()}`;
    await prisma.$executeRawUnsafe(`
      INSERT INTO "Fund" ("id", "name", "description", "cycleType", "cycleName", "amountPerCycle", "currentCycle", "balance", "bankName", "bankAccount", "accountHolder", "createdAt", "updatedAt")
      VALUES ('${newId}', '${name.trim()}', ${description ? `'${description.trim()}'` : 'NULL'}, '${cycleType}', '${cycleName}', ${Number(amountPerCycle) || 0}, '${currentCycle}', 0, '${bankName}', '${bankAccount}', '${accountHolder}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
    `);

    return NextResponse.json({ id: newId, name, balance: 0 }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
