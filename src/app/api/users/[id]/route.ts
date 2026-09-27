import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, normalizePhone, verifyPassword } from "@/lib/auth";
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
        memberships: {
          include: {
            workspace: true,
          },
          orderBy: { createdAt: "asc" },
        },
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

    const existing = await prisma.user.findUnique({
      where: { id },
      include: { person: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Không tìm thấy người dùng." }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};

    if (body.fullName !== undefined) updateData.fullName = String(body.fullName).trim();
    if (body.role !== undefined) updateData.role = body.role;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.avatarUrl !== undefined) updateData.avatarUrl = body.avatarUrl;
    if (body.personId !== undefined) updateData.personId = body.personId || null;

    // Email update & duplicate check
    if (body.email !== undefined) {
      const normEmail = body.email ? String(body.email).trim().toLowerCase() : null;
      if (normEmail && normEmail !== existing.email) {
        const dupEmail = await prisma.user.findUnique({ where: { email: normEmail } });
        if (dupEmail && dupEmail.id !== id) {
          return NextResponse.json(
            { error: "Địa chỉ email này đã được sử dụng bởi một tài khoản khác." },
            { status: 400 }
          );
        }
      }
      updateData.email = normEmail;
    }

    // Phone update & duplicate check
    if (body.phone) {
      const norm = normalizePhone(String(body.phone));
      if (norm && norm !== existing.phone) {
        const dupPhone = await prisma.user.findUnique({ where: { phone: norm } });
        if (dupPhone && dupPhone.id !== id) {
          return NextResponse.json(
            { error: "Số điện thoại này đã được sử dụng bởi một tài khoản khác." },
            { status: 400 }
          );
        }
        updateData.phone = norm;
      }
    }

    if (body.adminModules !== undefined) {
      updateData.adminModules = Array.isArray(body.adminModules)
        ? JSON.stringify(body.adminModules)
        : "[]";
    }

    // Password update logic (verifies currentPassword if provided)
    if (body.newPassword && typeof body.newPassword === "string" && body.newPassword.trim()) {
      if (body.currentPassword !== undefined) {
        let isValid = verifyPassword(String(body.currentPassword).trim(), existing.password);
        if (!isValid && String(body.currentPassword).trim().toLowerCase() === "admin") {
          isValid = verifyPassword("admin", existing.password);
        }
        if (!isValid) {
          return NextResponse.json(
            { error: "Mật khẩu hiện tại không chính xác." },
            { status: 400 }
          );
        }
      }
      if (body.newPassword.trim().length < 6) {
        return NextResponse.json(
          { error: "Mật khẩu mới phải có ít nhất 6 ký tự." },
          { status: 400 }
        );
      }
      updateData.password = hashPassword(body.newPassword.trim());
    } else if (body.password && typeof body.password === "string" && body.password.trim()) {
      updateData.password = hashPassword(body.password.trim());
    }

    // Also update linked Person if personData is provided
    const targetPersonId = body.personId || existing.personId;
    if (targetPersonId && body.personData && typeof body.personData === "object") {
      const pData: Record<string, unknown> = {};
      if (body.personData.firstName !== undefined) pData.firstName = body.personData.firstName;
      if (body.personData.lastName !== undefined) pData.lastName = body.personData.lastName;
      if (body.personData.middleName !== undefined) pData.middleName = body.personData.middleName;
      if (body.personData.gender !== undefined) pData.gender = body.personData.gender;
      if (body.personData.birthDate !== undefined) pData.birthDate = body.personData.birthDate;
      if (body.personData.birthPlace !== undefined) pData.birthPlace = body.personData.birthPlace;
      if (body.personData.phone !== undefined) pData.phone = body.personData.phone;
      if (body.personData.currentAddress !== undefined) pData.currentAddress = body.personData.currentAddress;
      if (body.personData.photoUrl !== undefined) pData.photoUrl = body.personData.photoUrl;
      if (body.personData.bio !== undefined) pData.bio = body.personData.bio;

      if (Object.keys(pData).length > 0) {
        await prisma.person.update({
          where: { id: targetPersonId },
          data: pData,
        });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        person: true,
        memberships: {
          include: {
            workspace: true,
          },
          orderBy: { createdAt: "asc" },
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
