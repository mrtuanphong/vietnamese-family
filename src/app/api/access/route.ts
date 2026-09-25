import { prisma } from "@/lib/prisma";
import { isDevEnvironment } from "@/lib/env";
import { normalizePhone, verifyPassword } from "@/lib/auth";
import { UserRole, UserWorkspaceSummary } from "@/types";
import { NextRequest, NextResponse } from "next/server";
import { ensureUserSchema } from "@/lib/ensureUserSchema";
import { ensureWorkspaceSchema } from "@/lib/ensureWorkspaceSchema";
import { DEFAULT_ENABLED_MODULES } from "@/config/modules";

function normalizeModules(rawJson?: string | null): string[] {
  if (!rawJson) return DEFAULT_ENABLED_MODULES;
  try {
    const list = JSON.parse(rawJson);
    if (!Array.isArray(list)) return DEFAULT_ENABLED_MODULES;
    const res = [...list];
    if (!res.includes("settings")) res.push("settings");
    if (res.includes("clan") && !res.includes("clan_settings")) res.push("clan_settings");
    if (res.includes("funds") && !res.includes("finance_settings")) res.push("finance_settings");
    return res;
  } catch {
    return DEFAULT_ENABLED_MODULES;
  }
}

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
    await ensureUserSchema();
    const defaultWsId = await ensureWorkspaceSchema();

    const body = await req.json();
    const { phone, password, workspaceId: requestedWorkspaceId } = body;

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

    // 1. First, search in User table
    const allUsers = await prisma.user.findMany({
      include: {
        person: true,
      },
    });

    let user = allUsers.find(
      (u) => u.phone && normalizePhone(u.phone) === normalizedInputPhone
    );

    // Fallback: If not found in User table yet, check Person table and auto-migrate
    if (!user) {
      const persons = await prisma.person.findMany({
        where: { phone: { not: null }, password: { not: null } },
      });
      const matchedPerson = persons.find(
        (p) => p.phone && normalizePhone(p.phone) === normalizedInputPhone
      );

      if (matchedPerson && matchedPerson.password) {
        const pName = [matchedPerson.lastName, matchedPerson.middleName, matchedPerson.firstName]
          .filter(Boolean)
          .join(" ");

        user = await prisma.user.create({
          data: {
            phone: normalizedInputPhone,
            password: matchedPerson.password,
            fullName: pName || "Thành viên",
            role: (matchedPerson.role as UserRole) || "member",
            adminModules: matchedPerson.adminModules || "[]",
            personId: matchedPerson.id,
            status: "active",
          },
          include: {
            person: true,
          },
        });
      }
    }

    if (!user || !user.password) {
      return NextResponse.json(
        { granted: false, error: "Số điện thoại hoặc mật khẩu không chính xác." },
        { status: 401 }
      );
    }

    if (user.status === "suspended") {
      return NextResponse.json(
        { granted: false, error: "Tài khoản của bạn đã bị tạm khóa. Vui lòng liên hệ Quản trị viên." },
        { status: 403 }
      );
    }

    const inputPwd = String(password).trim();
    let isValidPassword = verifyPassword(inputPwd, user.password);

    // Support auto-capitalization (e.g. on mobile/Mac where Admin is typed instead of admin)
    if (!isValidPassword && inputPwd.toLowerCase() === "admin") {
      isValidPassword = verifyPassword("admin", user.password);
    }

    if (!isValidPassword) {
      return NextResponse.json(
        { granted: false, error: "Số điện thoại hoặc mật khẩu không chính xác." },
        { status: 401 }
      );
    }

    // 2. Fetch Multi-Workspace Memberships for this user
    const client = prisma as any;
    let memberships = await client.workspaceMember.findMany({
      where: { userId: user.id },
      include: {
        workspace: true,
      },
      orderBy: { createdAt: "asc" },
    });

    // If user has no membership yet, add them to default workspace
    if (memberships.length === 0) {
      const newM = await client.workspaceMember.create({
        data: {
          workspaceId: defaultWsId,
          userId: user.id,
          role: user.role || "member",
          adminModules: user.adminModules || "[]",
          personId: user.personId,
        },
        include: {
          workspace: true,
        },
      });
      memberships = [newM];
    }

    const workspaces: UserWorkspaceSummary[] = memberships.map((m: any) => {
      let adminMods: string[] = [];
      if (m.role === "super_admin") {
        adminMods = ["*"];
      } else if (m.adminModules) {
        try {
          adminMods = JSON.parse(m.adminModules);
        } catch {
          adminMods = [];
        }
      }

      return {
        workspaceId: m.workspace.id,
        workspaceName: m.workspace.name,
        workspaceType: m.workspace.type,
        role: m.role as UserRole,
        adminModules: adminMods,
        enabledModules: normalizeModules(m.workspace.enabledModules),
        personId: m.personId,
      };
    });

    // Select active workspace
    const activeMembership =
      (requestedWorkspaceId && memberships.find((m: any) => m.workspaceId === requestedWorkspaceId)) ||
      memberships[0];

    const activeWorkspaceId = activeMembership.workspaceId;
    const activeWorkspaceName = activeMembership.workspace.name;
    const role: UserRole = (activeMembership.role as UserRole) || "member";
    const isSuperAdmin = role === "super_admin";

    let adminModules: string[] = [];
    if (isSuperAdmin) {
      adminModules = ["*"];
    } else if (activeMembership.adminModules) {
      try {
        adminModules = JSON.parse(activeMembership.adminModules);
      } catch {
        adminModules = [];
      }
    }

    const linkedPersonId = activeMembership.personId || user.personId;
    let editablePersonIds: string[] = [];

    if (
      isSuperAdmin ||
      role === "admin" ||
      adminModules.includes("community") ||
      adminModules.includes("*")
    ) {
      editablePersonIds = ["*"];
    } else if (linkedPersonId) {
      // Role is "member": can edit self, spouse(s), and children
      const [marriages, childRelationships] = await Promise.all([
        prisma.marriage.findMany({
          where: {
            OR: [{ spouse1Id: linkedPersonId }, { spouse2Id: linkedPersonId }],
          },
          select: { spouse1Id: true, spouse2Id: true },
        }),
        prisma.relationship.findMany({
          where: { parentId: linkedPersonId },
          select: { childId: true },
        }),
      ]);

      const spouseIds = marriages.map((m) =>
        m.spouse1Id === linkedPersonId ? m.spouse2Id : m.spouse1Id
      );
      const childIds = childRelationships.map((r) => r.childId);

      editablePersonIds = Array.from(
        new Set([linkedPersonId, ...spouseIds, ...childIds])
      );
    }

    const displayName =
      user.fullName ||
      (user.person
        ? [user.person.lastName, user.person.middleName, user.person.firstName]
            .filter(Boolean)
            .join(" ")
        : "Thành viên");

    const canManageCommunity =
      isSuperAdmin || adminModules.includes("community") || adminModules.includes("*");
    const canManageFinance =
      isSuperAdmin || adminModules.includes("finance") || adminModules.includes("*");

    return NextResponse.json({
      granted: true,
      userId: user.id,
      isSuperAdmin,
      role,
      name: displayName,
      personId: linkedPersonId,
      phone: user.phone,
      adminModules,
      editablePersonIds,
      canEditClan: isSuperAdmin,
      canEditTree: canManageCommunity,
      canManageCommunity,
      canManageFinance,
      canViewClan: isSuperAdmin || adminModules.length > 0,
      canViewAbout: true,
      // Multi-Workspace
      workspaces,
      activeWorkspaceId,
      clanName: activeWorkspaceName,
      enabledModules: normalizeModules(activeMembership.workspace.enabledModules),
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
