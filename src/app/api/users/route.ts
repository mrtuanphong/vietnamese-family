import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, normalizePhone } from "@/lib/auth";
import { ensureUserSchema } from "@/lib/ensureUserSchema";

export async function GET() {
  try {
    await ensureUserSchema();

    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        person: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            middleName: true,
            gender: true,
            generation: true,
            photoUrl: true,
          },
        },
      },
    });

    const sanitized = users.map(({ password: _, ...u }) => {
      let parsedAdminModules: string[] = [];
      if (u.adminModules) {
        try {
          parsedAdminModules = JSON.parse(u.adminModules);
        } catch {
          parsedAdminModules = [];
        }
      }
      return {
        ...u,
        adminModules: parsedAdminModules,
      };
    });

    return NextResponse.json(sanitized);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureUserSchema();

    const body = await req.json();
    const { phone, password, fullName, role, adminModules, personId } = body;

    if (!phone || !password || !fullName) {
      return NextResponse.json(
        { error: "Vui lòng nhập đầy đủ Số điện thoại, Mật khẩu và Họ tên." },
        { status: 400 }
      );
    }

    const normPhone = normalizePhone(String(phone));
    if (!normPhone) {
      return NextResponse.json(
        { error: "Số điện thoại không hợp lệ." },
        { status: 400 }
      );
    }

    // Check if phone already registered
    const existing = await prisma.user.findFirst({
      where: { phone: normPhone },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Số điện thoại này đã được đăng ký tài khoản." },
        { status: 409 }
      );
    }

    // Check if personId is already claimed by another user
    if (personId) {
      const existingClaim = await prisma.user.findFirst({
        where: { personId },
      });
      if (existingClaim) {
        return NextResponse.json(
          { error: "Hồ sơ thành viên gia phả này đã được liên kết với một tài khoản khác." },
          { status: 409 }
        );
      }
    }

    const hashedPassword = hashPassword(String(password).trim());
    const formattedModules = Array.isArray(adminModules) ? JSON.stringify(adminModules) : "[]";

    const user = await prisma.user.create({
      data: {
        phone: normPhone,
        password: hashedPassword,
        fullName: String(fullName).trim(),
        role: role || "member",
        adminModules: formattedModules,
        personId: personId || null,
        status: "active",
      },
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

    const { password: _, ...sanitized } = user;
    return NextResponse.json(sanitized, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
