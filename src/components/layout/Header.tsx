"use client";

import React from "react";
import Link from "next/link";
import { UserRole } from "@/types";
import { DevBadge } from "@/components/ui/DevBadge";

interface HeaderProps {
  clanName: string;
  isDev?: boolean;
  isSuperAdmin?: boolean;
  adminModules?: string[];
  pageTitle?: string;
  role?: UserRole | null;
  loggedInName?: string;
  phone?: string | null;
  canEditTree?: boolean;
  onAddPerson?: () => void;
  onLogout?: () => void;
}

export function Header({
  clanName,
  isDev,
  pageTitle,
  loggedInName,
}: HeaderProps) {
  return (
    <header className="h-14 shrink-0 bg-white/95 backdrop-blur-md border-b border-slate-200/80 flex items-center justify-between px-3 md:px-6 z-30 gap-3">
      {/* Mobile Title / Breadcrumb */}
      <div className="flex items-center gap-2.5 overflow-hidden shrink-0">
        <Link href="/" className="flex items-center gap-2 md:hidden">
          <div className="w-8 h-8 rounded-xl bg-brand-600 text-white flex items-center justify-center text-sm font-bold shadow-xs shrink-0">
            🏛️
          </div>
        </Link>
        <div className="truncate">
          <span className="font-bold text-slate-900 text-sm md:text-base truncate block">
            {pageTitle || clanName}
          </span>
          {pageTitle && (
            <span className="text-[11px] text-slate-400 block md:hidden truncate">
              {clanName}
            </span>
          )}
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2 justify-end min-w-0 flex-1">
        <div id="header-actions" className="flex items-center gap-2" />
        {/* Subtle environment status badge: only on mobile screens since desktop has it in the left sidebar */}
        {isDev && <DevBadge className="md:hidden shrink-0" />}

        {loggedInName && (
          <Link
            href="/profile"
            className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1.5 rounded-xl hover:bg-slate-100 text-slate-700 transition-all border border-transparent hover:border-slate-200 shrink-0"
            title="Xem và chỉnh sửa thông tin cá nhân"
          >
            <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 border border-brand-200 flex items-center justify-center font-bold text-xs shrink-0">
              {loggedInName.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs font-semibold hidden sm:inline max-w-[120px] truncate">
              {loggedInName}
            </span>
          </Link>
        )}
      </div>
    </header>
  );
}
