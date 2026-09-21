import { prisma } from "@/lib/prisma";
import { isDevEnvironment } from "@/lib/env";
import { normalizePhone, verifyPassword } from "@/lib/auth";
import { UserRole } from "@/types";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    return NextResponse.json({
      public: false,
      isDev: isDevEnvironment(),
    });
  } catch (e) {
    return NextResponse.json({ error: String(e), isDev: isDevEnvironment() }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { phone, password } = await req.json();

    if (!phone || !password) {
      return NextResponse.json(
        { granted: false, error: "Vui lòng nhập đầy đủ Số điện thoại và Mật khẩu." },
        { status: 400 }
      );
    }

    const normalizedInputPhone = normalizePhone(String(phone));
    if (!normalizedInputPhone) {
      return NextResponse.json(
        { granted: false, error: "Số điện thoại không hợp lệ." },
        { status: 400 }
      );
    }

    // Fetch all persons with phone number to find match via normalized phone
    const persons = await prisma.person.findMany({
      where: {
        phone: { not: null },
      },
    });

    const person = persons.find(
      (p) => p.phone && normalizePhone(p.phone) === normalizedInputPhone
    );

    if (!person || !person.password) {
      return NextResponse.json(
        { granted: false, error: "Số điện thoại hoặc mật khẩu không chính xác." },
        { status: 401 }
      );
    }

    const inputPwd = String(password).trim();
    let isValidPassword = verifyPassword(inputPwd, person.password);

    // Support auto-capitalization (e.g. on mobile/Mac where Admin is typed instead of admin)
    if (!isValidPassword && inputPwd.toLowerCase() === "admin") {
      isValidPassword = verifyPassword("admin", person.password);
    }

    if (!isValidPassword) {
      return NextResponse.json(
        { granted: false, error: "Số điện thoại hoặc mật khẩu không chính xác." },
        { status: 401 }
      );
    }

    const clan = await prisma.clan.findFirst({ orderBy: { createdAt: "asc" } });
    const isSuperAdmin = clan?.superAdminId === person.id || person.role === "super_admin";
    const role: UserRole = isSuperAdmin
      ? "super_admin"
      : (person.role as UserRole) || "member";

    let editablePersonIds: string[] = [];

    if (role === "super_admin" || role === "admin") {
      editablePersonIds = ["*"];
    } else {
      // Role is "member": can edit self, spouse(s), and children
      const [marriages, childRelationships] = await Promise.all([
        prisma.marriage.findMany({
          where: {
            OR: [{ spouse1Id: person.id }, { spouse2Id: person.id }],
          },
          select: { spouse1Id: true, spouse2Id: true },
        }),
        prisma.relationship.findMany({
          where: { parentId: person.id },
          select: { childId: true },
        }),
      ]);

      const spouseIds = marriages.map((m) =>
        m.spouse1Id === person.id ? m.spouse2Id : m.spouse1Id
      );
      const childIds = childRelationships.map((r) => r.childId);

      editablePersonIds = Array.from(
        new Set([person.id, ...spouseIds, ...childIds])
      );
    }

    const name = [person.lastName, person.middleName, person.firstName]
      .filter(Boolean)
      .join(" ");

    return NextResponse.json({
      granted: true,
      role,
      name,
      personId: person.id,
      phone: person.phone,
      editablePersonIds,
      canEditClan: role === "super_admin",
      canEditTree: role === "admin" || role === "super_admin",
      canViewClan: role === "admin" || role === "super_admin",
      canViewAbout: role === "admin" || role === "super_admin",
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
