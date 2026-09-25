import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureFinanceSchema } from "@/lib/ensureFinanceSchema";

export async function GET(req: NextRequest) {
  try {
    await ensureFinanceSchema();
    const { searchParams } = new URL(req.url);
    const fundId = searchParams.get("fundId");
    const type = searchParams.get("type");
    const category = searchParams.get("category");

    const client = prisma as any;
    if (client.transaction?.findMany) {
      try {
        const where: Record<string, unknown> = {};
        if (fundId && fundId !== "ALL") where.fundId = fundId;
        if (type && type !== "ALL") where.type = type;
        if (category && category !== "ALL") where.category = category;

        const transactions = await client.transaction.findMany({
          where,
          orderBy: { createdAt: "desc" },
          include: {
            fund: {
              select: {
                id: true,
                name: true,
                cycleName: true,
              },
            },
          },
        });

        return NextResponse.json(transactions);
      } catch (err) {
        console.warn("⚠️ [Transactions API] Fallback to raw query:", err);
      }
    }

    // Direct SQL fallback
    const whereClauses: string[] = [];
    if (fundId && fundId !== "ALL") whereClauses.push(`t."fundId" = '${fundId}'`);
    if (type && type !== "ALL") whereClauses.push(`t."type" = '${type}'`);
    if (category && category !== "ALL") whereClauses.push(`t."category" = '${category}'`);
    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    const txs = await prisma.$queryRawUnsafe(`
      SELECT t.*, f.name as "fundName", f."cycleName" as "fundCycleName"
      FROM "Transaction" t
      LEFT JOIN "Fund" f ON f.id = t."fundId"
      ${whereSql}
      ORDER BY t."createdAt" DESC;
    `);

    const formatted = (txs as any[]).map((t) => ({
      ...t,
      fund: {
        id: t.fundId,
        name: t.fundName || "Quỹ dòng họ",
        cycleName: t.fundCycleName,
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
      fundId,
      type, // "INCOME" | "EXPENSE"
      category,
      categoryName,
      title,
      amount,
      actorName,
      actorPhone,
      actorId,
      receiptUrl,
      note,
      isDonationSeparate = false,
    } = body;

    if (!fundId || !type || !title || !amount || !actorName) {
      return NextResponse.json(
        { error: "Vui lòng điền đầy đủ các thông tin bắt buộc (Quỹ, Loại thu/chi, Tiêu đề, Số tiền, Người thực hiện)." },
        { status: 400 }
      );
    }

    const numericAmount = Math.abs(Number(amount));
    if (numericAmount <= 0) {
      return NextResponse.json({ error: "Số tiền phải lớn hơn 0." }, { status: 400 });
    }

    const client = prisma as any;
    if (client.fund?.findUnique && client.transaction?.create) {
      const fund = await client.fund.findUnique({ where: { id: fundId } });
      if (!fund) {
        return NextResponse.json({ error: "Quỹ không tồn tại." }, { status: 404 });
      }

      const result = await prisma.$transaction(async (tx: any) => {
        const newBalance =
          type === "INCOME"
            ? fund.balance + numericAmount
            : fund.balance - numericAmount;

        await tx.fund.update({
          where: { id: fundId },
          data: { balance: newBalance },
        });

        const transaction = await tx.transaction.create({
          data: {
            fundId,
            type,
            category: category || (type === "INCOME" ? "CYCLE_FEE" : "EVENT_EXPENSE"),
            categoryName: categoryName || (type === "INCOME" ? "Đóng quỹ họ" : "Chi hoạt động"),
            title: String(title).trim(),
            amount: numericAmount,
            actorName: String(actorName).trim(),
            actorPhone: actorPhone || null,
            actorId: actorId || null,
            receiptUrl: receiptUrl || null,
            note: note || null,
            isDonationSeparate: Boolean(isDonationSeparate),
          },
          include: {
            fund: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });

        return transaction;
      });

      return NextResponse.json(result, { status: 201 });
    }

    // Direct SQL fallback
    const newTxId = `tx_${Date.now()}`;
    const cleanTitle = String(title).trim().replace(/'/g, "''");
    const cleanActor = String(actorName).trim().replace(/'/g, "''");
    const cleanCategory = String(category || (type === "INCOME" ? "CYCLE_FEE" : "EVENT_EXPENSE")).replace(/'/g, "''");
    const cleanCategoryName = String(categoryName || (type === "INCOME" ? "Đóng quỹ họ" : "Chi hoạt động")).replace(/'/g, "''");
    const cleanNote = note ? String(note).replace(/'/g, "''") : null;

    await prisma.$executeRawUnsafe(`
      UPDATE "Fund"
      SET "balance" = "balance" ${type === "INCOME" ? "+" : "-"} ${numericAmount}
      WHERE "id" = '${fundId}';
    `);

    await prisma.$executeRawUnsafe(`
      INSERT INTO "Transaction" ("id", "fundId", "type", "category", "categoryName", "title", "amount", "actorName", "actorPhone", "actorId", "receiptUrl", "note", "isDonationSeparate", "createdAt", "updatedAt")
      VALUES ('${newTxId}', '${fundId}', '${type}', '${cleanCategory}', '${cleanCategoryName}', '${cleanTitle}', ${numericAmount}, '${cleanActor}', ${actorPhone ? `'${actorPhone}'` : 'NULL'}, ${actorId ? `'${actorId}'` : 'NULL'}, ${receiptUrl ? `'${receiptUrl}'` : 'NULL'}, ${cleanNote ? `'${cleanNote}'` : 'NULL'}, ${Boolean(isDonationSeparate)}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
    `);

    return NextResponse.json({ id: newTxId, fundId, type, amount: numericAmount }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
