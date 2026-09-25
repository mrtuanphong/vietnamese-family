import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, normalizePhone } from "@/lib/auth";
import { ensureWorkspaceSchema } from "@/lib/ensureWorkspaceSchema";
import { ensureUserSchema } from "@/lib/ensureUserSchema";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureUserSchema();
    await ensureWorkspaceSchema();
    const { id: workspaceId } = await params;

    const client = prisma as any;
    const members = await client.workspaceMember.findMany({
      where: { workspaceId },
      include: {
        user: {
          select: {
            id: true,
            phone: true,
            email: true,
            fullName: true,
            avatarUrl: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // Also get person details if personId is linked
    const personIds = members.map((m: any) => m.personId).filter(Boolean);
    const persons = personIds.length > 0
      ? await prisma.person.findMany({
          where: { id: { in: personIds } },
          select: { id: true, firstName: true, lastName: true, middleName: true, generation: true },
        })
      : [];
    const personMap = new Map(persons.map((p) => [p.id, p]));

    const formatted = members.map((m: any) => {
      let parsedAdminModules: string[] = [];
      if (m.adminModules) {
        try {
          parsedAdminModules = JSON.parse(m.adminModules);
        } catch {
          parsedAdminModules = [];
        }
      }

      return {
        id: m.id,
        workspaceId: m.workspaceId,
        userId: m.userId,
        role: m.role,
        adminModules: parsedAdminModules,
        personId: m.personId,
        person: m.personId ? personMap.get(m.personId) || null : null,
        user: m.user,
        createdAt: m.createdAt,
      };
    });

    return NextResponse.json(formatted);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureUserSchema();
    await ensureWorkspaceSchema();
    const { id: workspaceId } = await params;

    const body = await req.json();
    const { phone, password, fullName, role = "member", adminModules = [], personId } = body;

    if (!phone || !phone.trim()) {
      return NextResponse.json({ error: "Vui lòng nhập số điện thoại." }, { status: 400 });
    }

    const normPhone = normalizePhone(String(phone));
    if (!normPhone) {
      return NextResponse.json({ error: "Số điện thoại không hợp lệ." }, { status: 400 });
    }

    const client = prisma as any;

    // Check if user already exists
    let user = await prisma.user.findFirst({
      where: { phone: normPhone },
    });

    if (!user) {
      // Create user if not exists
      if (!password || !fullName) {
        return NextResponse.json(
          { error: "Tài khoản mới cần có Mật khẩu và Họ tên." },
          { status: 400 }
        );
      }
      user = await prisma.user.create({
        data: {
          phone: normPhone,
          password: hashPassword(String(password).trim()),
          fullName: String(fullName).trim(),
          role: "member", // global role
          status: "active",
        },
      });
    }

    // Check if already a member of this workspace
    const existingMembership = await client.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: user.id,
        },
      },
    });

    if (existingMembership) {
      return NextResponse.json(
        { error: "Tài khoản này đã là thành viên của tổ chức này." },
        { status: 409 }
      );
    }

    const formattedModules = Array.isArray(adminModules) ? JSON.stringify(adminModules) : "[]";

    const membership = await client.workspaceMember.create({
      data: {
        workspaceId,
        userId: user.id,
        role,
        adminModules: formattedModules,
        personId: personId === "none" ? null : personId || null,
      },
      include: {
        user: {
          select: {
            id: true,
            phone: true,
            fullName: true,
          },
        },
      },
    });

    return NextResponse.json(membership, { status: 201 });
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
    await ensureWorkspaceSchema();
    const { id: workspaceId } = await params;
    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get("memberId");
    const userId = searchParams.get("userId");

    const client = prisma as any;

    if (memberId) {
      await client.workspaceMember.delete({
        where: { id: memberId },
      });
      return NextResponse.json({ success: true });
    }

    if (userId) {
      await client.workspaceMember.delete({
        where: {
          workspaceId_userId: {
            workspaceId,
            userId,
          },
        },
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Cần cung cấp memberId hoặc userId." }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
