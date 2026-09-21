export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const persons = await prisma.person.findMany({ orderBy: { createdAt: "asc" } });
    const sanitized = persons.map(({ password: _, ...p }) => p);
    return NextResponse.json(sanitized);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { id: _id, createdAt: _ca, updatedAt: _ua, ...data } = await req.json();
    if (data.password && typeof data.password === "string" && data.password.trim()) {
      data.password = hashPassword(data.password.trim());
    } else {
      delete data.password;
    }
    const person = await prisma.person.create({ data });
    const { password: _, ...sanitized } = person;
    return NextResponse.json(sanitized, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
