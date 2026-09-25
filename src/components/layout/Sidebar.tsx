"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Network,
  Users,
  CalendarDays,
  Home,
  WalletCards,
  ArrowLeftRight,
  Sparkles,
  Compass,
  Settings,
  Sliders,
  Info,
  LogOut,
  ChevronDown,
  Layers,
  Lock,
} from "lucide-react";
import {
  SYSTEM_MODULES,
  CATEGORIES,
  ModuleCategory,
  isModuleEnabled,
  ModuleDefinition,
} from "@/config/modules";
import { UserRole, UserWorkspaceSummary, WorkspaceType } from "@/types";
import { DevBadge } from "@/components/ui/DevBadge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { WorkspaceSwitcher } from "@/components/layout/WorkspaceSwitcher";

const ICON_MAP: Record<string, any> = {
  LayoutDashboard,
  Network,
  Users,
  CalendarDays,
  Home,
  WalletCards,
  ArrowLeftRight,
  Sparkles,
  Compass,
  Settings,
  Sliders,
  Info,
};

interface SidebarProps {
  clanName: string;
  isDev?: boolean;
  isSuperAdmin?: boolean;
  adminModules?: string[];
  enabledModules?: string[] | null;
  userName?: string;
  role?: UserRole | null;
  phone?: string | null;
  activeWorkspaceId?: string | null;
  workspaces?: UserWorkspaceSummary[];
  onLogout?: () => void;
  onOpenSettings?: () => void;
  onSwitchWorkspace?: (workspaceId: string) => void;
  onCreateWorkspace?: (name: string, type?: WorkspaceType) => void;
}

export function Sidebar({
  clanName,
  isDev,
  isSuperAdmin,
  adminModules,
  enabledModules,
  userName,
  role,
  phone,
  activeWorkspaceId,
  workspaces = [],
  onLogout,
  onOpenSettings,
  onSwitchWorkspace,
  onCreateWorkspace,
}: SidebarProps) {
  const pathname = usePathname();

  const getRoleBadge = () => {
    if (isSuperAdmin || role === "super_admin") {
      return { label: "Super Admin", color: "bg-teal-100 text-teal-800 border-teal-200" };
    }
    if (adminModules && adminModules.length > 0) {
      if (adminModules.includes("community") && adminModules.includes("finance")) {
        return { label: "Admin Đa Phân Hệ", color: "bg-blue-100 text-blue-800 border-blue-200" };
      }
      if (adminModules.includes("community")) {
        return { label: "Admin Gia Phả", color: "bg-blue-100 text-blue-800 border-blue-200" };
      }
      if (adminModules.includes("finance")) {
        return { label: "Thủ Quỹ", color: "bg-amber-100 text-amber-800 border-amber-200" };
      }
      return { label: "Quản trị viên", color: "bg-blue-100 text-blue-800 border-blue-200" };
    }
    return { label: "Thành viên", color: "bg-slate-100 text-slate-700 border-slate-200" };
  };

  const badge = getRoleBadge();

  // Check if user has permission to see the module based on roles
  const canAccessModule = (m: ModuleDefinition) => {
    if (m.requiresRole) {
      if (isSuperAdmin) return true;
      const isDomainAdmin =
        adminModules?.includes(m.category) ||
        adminModules?.includes(m.id) ||
        adminModules?.includes("*");
      if (isDomainAdmin) return true;
      if (!role || !m.requiresRole.includes(role as "admin" | "super_admin")) return false;
    }
    return true;
  };

  const categories = Object.keys(CATEGORIES) as ModuleCategory[];

  return (
    <TooltipProvider delayDuration={150}>
      <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-white border-r border-slate-200 h-full shrink-0 select-none overflow-hidden z-20">
        {/* 1. Brand & Context (Pinned at Top, Never Scrolls) */}
        <div className="p-4 pb-3 space-y-3 shrink-0 border-b border-slate-100 bg-white">
          {/* Brand Header */}
          <div className="flex items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
              <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center text-lg font-bold shadow-xs shrink-0">
                🏛️
              </div>
              <div className="overflow-hidden min-w-0">
                <h1 className="font-bold text-slate-900 text-sm tracking-tight leading-tight truncate">
                  {clanName || "Gia Đình Việt"}
                </h1>
                <p className="text-[11px] text-slate-400 font-medium truncate">
                  {isModuleEnabled("tree", enabledModules) || isModuleEnabled("clan_settings", enabledModules)
                    ? "Hệ thống Quản lý Dòng họ"
                    : "Hệ thống Quản lý Tổ chức"}
                </p>
              </div>
            </div>
            {isDev && <DevBadge size="sm" className="shrink-0" />}
          </div>

          {/* Organization / Context Card (Interactive Multi-Workspace Switcher) */}
          <WorkspaceSwitcher
            currentWorkspaceName={clanName}
            activeWorkspaceId={activeWorkspaceId}
            workspaces={workspaces}
            roleBadge={badge}
            onSwitchWorkspace={onSwitchWorkspace}
            onCreateWorkspace={onCreateWorkspace}
          />
        </div>

        {/* 2. Scrollable Module Menu (Only this section scrolls when list is long) */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-3 space-y-4">
          {/* General Home Link */}
          <nav>
            <Link
              href="/"
              className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                pathname === "/"
                  ? "bg-teal-600 text-white shadow-md shadow-teal-600/20"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <LayoutDashboard className={`w-4 h-4 ${pathname === "/" ? "text-white" : "text-slate-400"}`} />
              <span>Tổng quan hệ thống</span>
            </Link>
          </nav>
          {categories.map((catKey) => {
            const cat = CATEGORIES[catKey];
            const categoryModules = SYSTEM_MODULES.filter(
              (m) => m.category === catKey && canAccessModule(m)
            );
            if (categoryModules.length === 0) return null;

            return (
              <div key={catKey} className="space-y-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1">
                  {cat.name}
                </div>
                {categoryModules.map((m) => {
                  const isEnabled = isModuleEnabled(m.id, enabledModules);
                  const isActive = pathname.startsWith(m.href);
                  const Icon = ICON_MAP[m.iconName] || Layers;

                  // 1. Module is Enabled (Active Link)
                  if (isEnabled) {
                    return (
                      <Link
                        key={m.id}
                        href={m.href}
                        className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                          isActive
                            ? "bg-teal-600 text-white shadow-md shadow-teal-600/20"
                            : "text-slate-600 hover:bg-slate-100/90 hover:text-slate-900"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <Icon
                            className={`w-4 h-4 shrink-0 ${
                              isActive ? "text-white" : "text-slate-400"
                            }`}
                          />
                          <span className="truncate">{m.name}</span>
                        </div>
                        {m.status === "coming_soon" && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-100 text-purple-700 font-normal">
                            Sắp có
                          </span>
                        )}
                      </Link>
                    );
                  }

                  // 2. Module is Disabled / OFF (Disabled state with Tooltip)
                  return (
                    <Tooltip key={m.id}>
                      <TooltipTrigger asChild>
                        <div
                          title="Tính năng này đang khóa (Tắt trong cài đặt tổ chức)"
                          className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-400 bg-slate-50/50 border border-transparent hover:border-slate-200/80 cursor-not-allowed select-none transition-all"
                        >
                          <div className="flex items-center gap-2.5 truncate opacity-60">
                            <Icon className="w-4 h-4 shrink-0 text-slate-400" />
                            <span className="truncate">{m.name}</span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Lock className="w-3 h-3 text-slate-400" />
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-200/70 text-slate-500 font-medium">
                              Khóa
                            </span>
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent
                        side="right"
                        className="bg-slate-900 text-white text-xs px-2.5 py-1.5 rounded-lg shadow-xl border border-slate-800 z-50"
                      >
                        <div className="flex items-center gap-1.5 font-semibold text-amber-300 text-[11px]">
                          <Lock className="w-3 h-3" />
                          <span>Tính năng này đang khóa</span>
                        </div>
                        <p className="text-[10px] text-slate-300 mt-0.5">
                          Quản trị viên có thể bật lại trong Cài đặt tổ chức.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* 3. User profile & Logout (Pinned at Bottom, Never Scrolls) */}
        <div className="p-4 pt-3 border-t border-slate-200 space-y-2 shrink-0 bg-white">
          {userName && (
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="overflow-hidden min-w-0">
                <div className="text-xs font-bold text-slate-800 truncate">{userName}</div>
                {phone && <div className="text-[10px] text-slate-400 truncate">{phone}</div>}
              </div>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${badge.color}`}>
                {badge.label}
              </span>
            </div>
          )}

          {onLogout && (
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Đăng xuất</span>
            </button>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}
