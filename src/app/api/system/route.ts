import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const connStr = process.env.DATABASE_URL;
    let endpoint = "Chưa cấu hình";
    let host = "Chưa cấu hình";
    let dbName = "Chưa cấu hình";
    const isConfigured = Boolean(connStr);

    if (connStr) {
      try {
        const url = new URL(connStr);
        host = url.hostname;
        endpoint = host.split(".")[0] || host;
        dbName = url.pathname.replace(/^\//, "");
      } catch {
        host = "Đã cấu hình (không phân tích được định dạng URL)";
      }
    }

    const isVercel = Boolean(process.env.VERCEL);
    const vercelEnv = process.env.VERCEL_ENV || (isVercel ? "production" : "development");
    const explicitDbEnv = process.env.DB_ENV?.toLowerCase(); // "dev" | "prod" | "production"

    let dbConnected = false;
    let personCount = 0;
    let clanName = "";

    if (isConfigured) {
      try {
        const [count, clan] = await Promise.all([
          prisma.person.count(),
          prisma.clan.findFirst({ select: { name: true } }),
        ]);
        personCount = count;
        clanName = clan?.name || "";
        dbConnected = true;
      } catch {
        dbConnected = false;
      }
    }

    // Determine dev vs prod
    let dbType: "dev" | "production" = "dev";
    if (explicitDbEnv === "prod" || explicitDbEnv === "production") {
      dbType = "production";
    } else if (explicitDbEnv === "dev" || explicitDbEnv === "development") {
      dbType = "dev";
    } else if (host.includes("-dev") || endpoint.includes("-dev") || endpoint.includes("dev-")) {
      dbType = "dev";
    } else if (vercelEnv === "production" && isVercel) {
      dbType = "production";
    } else {
      // Running locally without explicit tag
      dbType = "dev";
    }

    return NextResponse.json({
      runtime: isVercel ? `Vercel (${vercelEnv})` : "Local Development",
      isLocal: !isVercel,
      db: {
        configured: isConfigured,
        connected: dbConnected,
        type: dbType, // "dev" | "production"
        host,
        endpoint,
        dbName,
        personCount,
        clanName,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Lỗi kiểm tra hệ thống", details: String(error) },
      { status: 500 }
    );
  }
}
