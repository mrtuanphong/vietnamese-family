import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, normalizePhone } from "@/lib/auth";
import { ensureUserSchema } from "@/lib/ensureUserSchema";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureUserSchema();
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        person: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Không tìm thấy người dùng." }, { status: 404 });
    }

    const { password: _, ...sanitized } = user;
    let parsedAdminModules: string[] = [];
    if (user.adminModules) {
      try {
        parsedAdminModules = JSON.parse(user.adminModules);
      } catch {
        parsedAdminModules = [];
      }
    }

    return NextResponse.json({ ...sanitized, adminModules: parsedAdminModules });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureUserSchema();
    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Không tìm thấy người dùng." }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};

    if (body.fullName !== undefined) updateData.fullName = String(body.fullName).trim();
    if (body.role !== undefined) updateData.role = body.role;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.avatarUrl !== undefined) updateData.avatarUrl = body.avatarUrl;
    if (body.personId !== undefined) updateData.personId = body.personId || null;

    if (body.phone) {
      const norm = normalizePhone(String(body.phone));
      if (norm) updateData.phone = norm;
    }

    if (body.adminModules !== undefined) {
      updateData.adminModules = Array.isArray(body.adminModules)
        ? JSON.stringify(body.adminModules)
        : "[]";
    }

    if (body.password && typeof body.password === "string" && body.password.trim()) {
      updateData.password = hashPassword(body.password.trim());
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        person: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            middleName: true,
            gender: true,
            generation: true,
          },
        },
      },
    });

    const { password: _, ...sanitized } = updatedUser;
    let parsedAdminModules: string[] = [];
    if (updatedUser.adminModules) {
      try {
        parsedAdminModules = JSON.parse(updatedUser.adminModules);
      } catch {
        parsedAdminModules = [];
      }
    }

    return NextResponse.json({ ...sanitized, adminModules: parsedAdminModules });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureUserSchema();
    const { id } = await params;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ error: "Không tìm thấy người dùng." }, { status: 404 });
    }

    // Do not allow deleting super_admin if it's the only one
    if (user.role === "super_admin") {
      const superCount = await prisma.user.count({ where: { role: "super_admin" } });
      if (superCount <= 1) {
        return NextResponse.json(
          { error: "Không thể xóa tài khoản Super Admin duy nhất của hệ thống." },
          { status: 400 }
        );
      }
    }

    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Đã xóa tài khoản ứng dụng." });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
