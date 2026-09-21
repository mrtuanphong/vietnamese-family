export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const person = await prisma.person.findUnique({ where: { id } });
  if (!person) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { password: _, ...sanitized } = person;
  return NextResponse.json(sanitized);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { id: _id, createdAt: _ca, updatedAt: _ua, ...data } = await req.json();
    if (data.password && typeof data.password === "string" && data.password.trim()) {
      if (!data.password.includes(":")) {
        data.password = hashPassword(data.password.trim());
      }
    } else {
      delete data.password;
    }
    const person = await prisma.person.update({ where: { id }, data });
    const { password: _, ...sanitized } = person;
    return NextResponse.json(sanitized);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const clan = await prisma.clan.findFirst();
    if (clan?.superAdminId === id) {
      return NextResponse.json({ error: "Không thể xoá tài khoản Super Admin." }, { status: 403 });
    }
    await prisma.relationship.deleteMany({ where: { OR: [{ parentId: id }, { childId: id }] } });
    await prisma.marriage.deleteMany({ where: { OR: [{ spouse1Id: id }, { spouse2Id: id }] } });
    await prisma.person.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
