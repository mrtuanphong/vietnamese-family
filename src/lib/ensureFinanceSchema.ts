import { prisma } from "@/lib/prisma";

let isFinanceInitialized = false;

export async function ensureFinanceSchema(): Promise<void> {
  if (isFinanceInitialized) return;

  try {
    // 1. Create Fund table if not exists
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Fund" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "description" TEXT,
        "cycleType" TEXT NOT NULL DEFAULT '1_YEAR',
        "cycleName" TEXT NOT NULL DEFAULT 'Hàng năm (1 năm / lần)',
        "amountPerCycle" INTEGER NOT NULL DEFAULT 500000,
        "currentCycle" TEXT NOT NULL DEFAULT 'Năm 2026',
        "balance" INTEGER NOT NULL DEFAULT 0,
        "bankName" TEXT DEFAULT 'MB',
        "bankAccount" TEXT DEFAULT '0988889999',
        "accountHolder" TEXT DEFAULT 'THU QUY DONG HO',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT "Fund_pkey" PRIMARY KEY ("id")
      );
    `);

    // 2. Create Transaction table if not exists
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Transaction" (
        "id" TEXT NOT NULL,
        "fundId" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        "category" TEXT NOT NULL,
        "categoryName" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "amount" INTEGER NOT NULL,
        "actorName" TEXT NOT NULL,
        "actorPhone" TEXT,
        "actorId" TEXT,
        "receiptUrl" TEXT,
        "note" TEXT,
        "isDonationSeparate" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
      );
    `);

    // 3. Add foreign key if not exists
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'Transaction_fundId_fkey'
        ) THEN
          ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_fundId_fkey"
          FOREIGN KEY ("fundId") REFERENCES "Fund"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
      END $$;
    `);

    // 4. Seed initial default funds via raw SQL
    await prisma.$executeRawUnsafe(`
      INSERT INTO "Fund" ("id", "name", "description", "cycleType", "cycleName", "amountPerCycle", "currentCycle", "balance", "bankName", "bankAccount", "accountHolder", "createdAt", "updatedAt")
      VALUES
        (
          'fund_thuong_nien',
          'Quỹ Thường Niên Dòng Họ',
          'Quỹ chi tiêu định kỳ phục vụ ngày giỗ tổ, lễ tết, đèn nhang và các công việc thường nhật của dòng họ.',
          '1_YEAR',
          'Hàng năm (1 năm / lần)',
          500000,
          'Năm 2026',
          18500000,
          'MB',
          '0988889999',
          'THU QUY DONG HO',
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        ),
        (
          'fund_khuyen_hoc',
          'Quỹ Khuyến Học & Tuyên Dương',
          'Khen thưởng các cháu đạt học sinh giỏi, thi đỗ đại học và các con cháu có thành tích vẻ vang làm rạng danh dòng họ.',
          '1_YEAR',
          'Hàng năm (Theo năm học)',
          300000,
          'Năm học 2025 - 2026',
          9200000,
          'MB',
          '0988889999',
          'THU QUY DONG HO',
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        ),
        (
          'fund_tu_bo',
          'Quỹ Tu Bổ Từ Đường & Lăng Mộ',
          'Tôn tạo nhà thờ tổ, khuôn viên lăng mộ và sửa chữa các hạng mục di tích của dòng tộc.',
          'EVENT',
          'Vận động công đức / Tu bổ',
          1000000,
          'Giai đoạn 2025 - 2027',
          45000000,
          'MB',
          '0988889999',
          'THU QUY DONG HO',
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        )
      ON CONFLICT ("id") DO NOTHING;
    `);

    // 5. Seed initial transactions via raw SQL
    await prisma.$executeRawUnsafe(`
      INSERT INTO "Transaction" ("id", "fundId", "type", "category", "categoryName", "title", "amount", "actorName", "actorPhone", "receiptUrl", "note", "isDonationSeparate", "createdAt", "updatedAt")
      VALUES
        (
          'tx_1',
          'fund_thuong_nien',
          'INCOME',
          'CYCLE_FEE',
          'Đóng quỹ thường niên',
          'Gia đình ông Đỗ Văn An đóng quỹ thường niên 2026',
          500000,
          'Đỗ Văn An',
          '0912345678',
          NULL,
          'Đã nộp đủ niên khóa 2026',
          false,
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        ),
        (
          'tx_2',
          'fund_thuong_nien',
          'INCOME',
          'DONATION',
          'Công đức / Tài trợ thêm',
          'Gia đình anh Đỗ Phong công đức tiền mua hương hoa ngày giỗ tổ',
          2000000,
          'Đỗ Phong',
          NULL,
          NULL,
          'Ủng hộ quỹ sắm lễ giỗ tổ rằm tháng Giêng',
          true,
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        ),
        (
          'tx_3',
          'fund_thuong_nien',
          'EXPENSE',
          'EVENT_EXPENSE',
          'Chi sắm lễ / Lễ hội',
          'Chi mua lễ vật và hương hoa dâng tổ đường rằm tháng Giêng',
          2500000,
          'Thủ quỹ dòng họ',
          NULL,
          'https://images.unsplash.com/photo-1554415707-9e49fe8324f6?w=600&q=80',
          'Hóa đơn mua đồ lễ tại Chợ Huyện',
          false,
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        ),
        (
          'tx_4',
          'fund_khuyen_hoc',
          'INCOME',
          'DONATION',
          'Ủng hộ khuyến học',
          'Bác Đỗ Minh Tuấn tài trợ quỹ khuyến học mùa thi',
          5000000,
          'Đỗ Minh Tuấn',
          NULL,
          NULL,
          'Tài trợ giải thưởng thủ khoa dòng họ',
          true,
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        ),
        (
          'tx_5',
          'fund_khuyen_hoc',
          'EXPENSE',
          'SCHOLARSHIP',
          'Trao thưởng khuyến học',
          'Trao học bổng cho 6 cháu đạt giải học sinh giỏi cấp tỉnh',
          3000000,
          'Ban Khuyến học dòng họ',
          NULL,
          'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&q=80',
          'Kèm danh sách ký nhận học bổng của các cháu',
          false,
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        ),
        (
          'tx_6',
          'fund_tu_bo',
          'EXPENSE',
          'RENOVATION',
          'Tu bổ từ đường',
          'Thanh toán đợt 1 sơn sửa mái ngói và hoành phi từ đường',
          15000000,
          'Ban Tu bổ di tích',
          NULL,
          'https://images.unsplash.com/photo-1541888946425-d0fbb186156f?w=600&q=80',
          'Hợp đồng sửa chữa số 01/2026 với đội thợ mộc mỹ nghệ',
          false,
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        )
      ON CONFLICT ("id") DO NOTHING;
    `);

    isFinanceInitialized = true;
    console.log("✅ [Finance Schema] Tables and initial data ensured successfully via SQL.");
  } catch (error) {
    console.error("⚠️ [Finance Schema] Error ensuring Finance schema:", error);
  }
}
