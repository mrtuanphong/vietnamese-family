export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { ensureUserSchema } from "@/lib/ensureUserSchema";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await ensureUserSchema();
    const { id } = await params;
    const person = await prisma.person.findUnique({
      where: { id },
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

    if (!person) return NextResponse.json({ error: "Không tìm thấy thành viên." }, { status: 404 });

    let parsedAdminModules: string[] = [];
    if (person.userAccount?.adminModules) {
      try {
        parsedAdminModules = JSON.parse(person.userAccount.adminModules);
      } catch {
        parsedAdminModules = [];
      }
    } else if (person.adminModules) {
      try {
        parsedAdminModules = JSON.parse(person.adminModules);
      } catch {
        parsedAdminModules = [];
      }
    }

    return NextResponse.json({
      ...person,
      role: person.userAccount?.role || person.role || "member",
      adminModules: parsedAdminModules,
      userAccount: person.userAccount
        ? {
            ...person.userAccount,
            adminModules: parsedAdminModules,
          }
        : null,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await ensureUserSchema();
    const { id } = await params;
    const { id: _id, createdAt: _ca, updatedAt: _ua, userAccount: _ua2, ...data } = await req.json();

    delete data.password;
    delete data.adminModules;

    const person = await prisma.person.update({ where: { id }, data });
    return NextResponse.json(person);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await ensureUserSchema();
    const { id } = await params;
    const clan = await prisma.clan.findFirst();
    if (clan?.superAdminId === id) {
      return NextResponse.json(
        { error: "Không thể xoá thành viên mốc tính thế hệ của dòng họ." },
        { status: 403 }
      );
    }
    await prisma.relationship.deleteMany({ where: { OR: [{ parentId: id }, { childId: id }] } });
    await prisma.marriage.deleteMany({ where: { OR: [{ spouse1Id: id }, { spouse2Id: id }] } });
    await prisma.person.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
