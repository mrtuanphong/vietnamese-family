export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { recalculateGenerations } from "@/lib/recalculateGenerations";
import { NextRequest, NextResponse } from "next/server";
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

// Always single clan/org — get first or null
export async function GET() {
  try {
    const clan = await prisma.clan.findFirst({ orderBy: { createdAt: "asc" } });
    if (!clan) return NextResponse.json(null);

    return NextResponse.json({
      ...clan,
      enabledModules: normalizeModules(clan.enabledModules),
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, address, description, enabled, superAdminId, superAdminGeneration, clanLastName, enabledModules } = body;

    let serializedModules: string | undefined = undefined;
    if (Array.isArray(enabledModules)) {
      const arr = [...enabledModules];
      if (!arr.includes("settings")) arr.push("settings");
      serializedModules = JSON.stringify(arr);
    } else if (typeof enabledModules === "string") {
      serializedModules = enabledModules;
    }

    const data = {
      name: name || "Gia Đình Việt",
      address,
      description,
      enabled: enabled ?? true,
      superAdminId,
      superAdminGeneration,
      clanLastName,
      ...(serializedModules !== undefined ? { enabledModules: serializedModules } : {}),
    };

    const clan = await prisma.clan.create({ data });
    return NextResponse.json({
      ...clan,
      enabledModules: normalizeModules(clan.enabledModules),
    }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, address, description, enabled, superAdminId, superAdminGeneration, clanLastName, enabledModules } = body;

    let serializedModules: string | undefined = undefined;
    if (Array.isArray(enabledModules)) {
      const arr = [...enabledModules];
      if (!arr.includes("settings")) arr.push("settings");
      serializedModules = JSON.stringify(arr);
    } else if (typeof enabledModules === "string") {
      serializedModules = enabledModules;
    }

    const data = {
      name: name || "Gia Đình Việt",
      address,
      description,
      enabled: enabled ?? true,
      superAdminId,
      superAdminGeneration,
      clanLastName,
      ...(serializedModules !== undefined ? { enabledModules: serializedModules } : {}),
    };

    const existing = await prisma.clan.findFirst({ orderBy: { createdAt: "asc" } });
    if (!existing) {
      const clan = await prisma.clan.create({ data });
      return NextResponse.json({
        ...clan,
        enabledModules: normalizeModules(clan.enabledModules),
      }, { status: 201 });
    }
    const clan = await prisma.clan.update({ where: { id: existing.id }, data });
    if (data.superAdminId && data.superAdminGeneration) await recalculateGenerations();

    return NextResponse.json({
      ...clan,
      enabledModules: normalizeModules(clan.enabledModules),
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
