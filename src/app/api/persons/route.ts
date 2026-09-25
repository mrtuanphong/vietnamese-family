export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { ensureUserSchema } from "@/lib/ensureUserSchema";

export async function GET() {
  try {
    await ensureUserSchema();
    const persons = await prisma.person.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        userAccount: {
          select: {
            id: true,
            phone: true,
            role: true,
            status: true,
            adminModules: true,
          },
        },
      },
    });

    const formatted = persons.map((p) => {
      let parsedAdminModules: string[] = [];
      if (p.userAccount?.adminModules) {
        try {
          parsedAdminModules = JSON.parse(p.userAccount.adminModules);
        } catch {
          parsedAdminModules = [];
        }
      } else if (p.adminModules) {
        try {
          parsedAdminModules = JSON.parse(p.adminModules);
        } catch {
          parsedAdminModules = [];
        }
      }

      return {
        ...p,
        role: p.userAccount?.role || p.role || "member",
        adminModules: parsedAdminModules,
        userAccount: p.userAccount
          ? {
              ...p.userAccount,
              adminModules: parsedAdminModules,
            }
          : null,
      };
    });

    return NextResponse.json(formatted);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureUserSchema();
    const { id: _id, createdAt: _ca, updatedAt: _ua, userAccount: _ua2, ...data } = await req.json();

    // Pure genealogical person record
    delete data.password;
    delete data.adminModules;
    if (!data.role) data.role = "member";

    const person = await prisma.person.create({ data });
    return NextResponse.json(person, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
