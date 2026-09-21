import { prisma } from "@/lib/prisma";
import { isDevEnvironment } from "@/lib/env";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const clan = await prisma.clan.findFirst();
    return NextResponse.json({
      public: clan?.enabled ?? true,
      isDev: isDevEnvironment(),
    });
  } catch (e) {
    return NextResponse.json({ error: String(e), isDev: isDevEnvironment() }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { phone, password } = await req.json();
    const clan = await prisma.clan.findFirst();

    // Guest access — public clan, no credentials needed
    if (clan?.enabled && !phone) {
      return NextResponse.json({ granted: true, name: "Tài khoản khách", canEdit: false });
    }

    if (!phone) return NextResponse.json({ granted: false });

    if (!clan?.superAdminId) return NextResponse.json({ granted: false });

    const superAdmin = await prisma.person.findUnique({ where: { id: clan.superAdminId } });
    const normalize = (p: string) => p.replace(/\s|-/g, "");
    const granted =
      !!superAdmin?.phone && normalize(superAdmin.phone) === normalize(phone);

    const name = granted
      ? [superAdmin!.lastName, superAdmin!.middleName, superAdmin!.firstName].filter(Boolean).join(" ")
      : null;

    return NextResponse.json({ granted, name, canEdit: granted });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
