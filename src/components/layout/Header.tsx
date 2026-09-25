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
}: HeaderProps) {
  return (
    <header className="h-14 shrink-0 bg-white/95 backdrop-blur-md border-b border-slate-200/80 flex items-center justify-between px-3 md:px-6 z-30">
      {/* Mobile Title / Breadcrumb */}
      <div className="flex items-center gap-2.5 overflow-hidden">
        <Link href="/" className="flex items-center gap-2 md:hidden">
          <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center text-sm font-bold shadow-xs shrink-0">
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
      <div className="flex items-center gap-2">
        {/* Subtle environment status badge: only on mobile screens since desktop has it in the left sidebar */}
        {isDev && <DevBadge className="md:hidden" />}
      </div>
    </header>
  );
}
