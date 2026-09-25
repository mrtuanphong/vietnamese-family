import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureWorkspaceSchema } from "@/lib/ensureWorkspaceSchema";
import { ensureUserSchema } from "@/lib/ensureUserSchema";
import { DEFAULT_ENABLED_MODULES } from "@/config/modules";
import { UserRole } from "@/types";

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

export async function GET(req: NextRequest) {
  try {
    await ensureUserSchema();
    await ensureWorkspaceSchema();

    const userId = req.nextUrl.searchParams.get("userId") || req.headers.get("x-user-id");

    const client = prisma as any;

    if (userId) {
      // Find workspaces where the user is a member
      const memberships = await client.workspaceMember.findMany({
        where: { userId },
        include: {
          workspace: true,
        },
        orderBy: { createdAt: "asc" },
      });

      const result = memberships.map((m: any) => {
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
          workspace: {
            ...m.workspace,
            enabledModules: normalizeModules(m.workspace.enabledModules),
          },
        };
      });

      return NextResponse.json(result);
    }

    // Otherwise, return all workspaces
    const all = await client.workspace.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        _count: {
          select: { members: true, persons: true },
        },
      },
    });

    const formatted = all.map((w: any) => ({
      ...w,
      enabledModules: normalizeModules(w.enabledModules),
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureUserSchema();
    await ensureWorkspaceSchema();

    const body = await req.json();
    const {
      name,
      type = "CLAN",
      address,
      description,
      enabled = true,
      clanLastName,
      enabledModules = DEFAULT_ENABLED_MODULES,
      creatorUserId,
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Tên tổ chức không được để trống." }, { status: 400 });
    }

    const client = prisma as any;

    let serializedModules = JSON.stringify(DEFAULT_ENABLED_MODULES);
    if (Array.isArray(enabledModules)) {
      const arr = [...enabledModules];
      if (!arr.includes("settings")) arr.push("settings");
      serializedModules = JSON.stringify(arr);
    }

    const newWorkspace = await client.workspace.create({
      data: {
        name: name.trim(),
        type,
        address: address ? address.trim() : null,
        description: description ? description.trim() : null,
        enabled,
        clanLastName: clanLastName ? clanLastName.trim() : null,
        enabledModules: serializedModules,
      },
    });

    // If creatorUserId is provided, make that user super_admin of this workspace
    if (creatorUserId) {
      await client.workspaceMember.create({
        data: {
          workspaceId: newWorkspace.id,
          userId: creatorUserId,
          role: "super_admin",
          adminModules: '["*"]',
        },
      });
    }

    return NextResponse.json({
      ...newWorkspace,
      enabledModules: normalizeModules(newWorkspace.enabledModules),
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await ensureUserSchema();
    await ensureWorkspaceSchema();

    const body = await req.json();
    const {
      id,
      name,
      type,
      address,
      description,
      enabled,
      clanLastName,
      superAdminId,
      superAdminGeneration,
      enabledModules,
    } = body;

    if (!id) {
      return NextResponse.json({ error: "Thiếu ID tổ chức (workspaceId)." }, { status: 400 });
    }

    const client = prisma as any;

    let serializedModules: string | undefined = undefined;
    if (Array.isArray(enabledModules)) {
      const arr = [...enabledModules];
      if (!arr.includes("settings")) arr.push("settings");
      serializedModules = JSON.stringify(arr);
    }

    const updateData: Record<string, any> = {};
    if (name !== undefined) updateData.name = name.trim();
    if (type !== undefined) updateData.type = type;
    if (address !== undefined) updateData.address = address;
    if (description !== undefined) updateData.description = description;
    if (enabled !== undefined) updateData.enabled = enabled;
    if (clanLastName !== undefined) updateData.clanLastName = clanLastName;
    if (superAdminId !== undefined) updateData.superAdminId = superAdminId;
    if (superAdminGeneration !== undefined) updateData.superAdminGeneration = superAdminGeneration;
    if (serializedModules !== undefined) updateData.enabledModules = serializedModules;

    const updated = await client.workspace.update({
      where: { id },
      data: updateData,
    });

    // Also sync to Clan table if it matches the first clan
    const firstClan = await prisma.clan.findFirst({ orderBy: { createdAt: "asc" } });
    if (firstClan) {
      await prisma.clan.update({
        where: { id: firstClan.id },
        data: {
          name: updated.name,
          address: updated.address,
          description: updated.description,
          enabled: updated.enabled,
          enabledModules: updated.enabledModules,
          clanLastName: updated.clanLastName,
          superAdminId: updated.superAdminId,
          superAdminGeneration: updated.superAdminGeneration,
        },
      }).catch(() => {});
    }

    return NextResponse.json({
      ...updated,
      enabledModules: normalizeModules(updated.enabledModules),
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
