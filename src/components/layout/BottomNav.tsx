"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Network,
  WalletCards,
  CalendarDays,
  UserCircle2,
  Users,
} from "lucide-react";
import { isModuleEnabled } from "@/config/modules";

interface BottomNavProps {
  enabledModules?: string[] | null;
  onOpenAccount?: () => void;
}

export function BottomNav({ enabledModules, onOpenAccount }: BottomNavProps) {
  const pathname = usePathname();

  const navItems = [
    {
      id: "home",
      name: "Tổng quan",
      href: "/",
      icon: LayoutDashboard,
      isActive: (p: string) => p === "/",
    },
    {
      id: "tree",
      name: "Gia phả",
      href: "/tree",
      icon: Network,
      isActive: (p: string) => p.startsWith("/tree"),
      show: isModuleEnabled("tree", enabledModules),
    },
    {
      id: "members",
      name: "Thành viên",
      href: "/members",
      icon: Users,
      isActive: (p: string) => p.startsWith("/members") || p.startsWith("/families"),
      show: !isModuleEnabled("tree", enabledModules) && isModuleEnabled("members", enabledModules),
    },
    {
      id: "funds",
      name: "Sổ quỹ",
      href: "/funds",
      icon: WalletCards,
      isActive: (p: string) => p.startsWith("/funds") || p.startsWith("/transactions"),
      show: isModuleEnabled("funds", enabledModules),
    },
    {
      id: "events",
      name: "Lịch giỗ",
      href: "/events",
      icon: CalendarDays,
      isActive: (p: string) => p.startsWith("/events"),
      show: isModuleEnabled("events", enabledModules),
    },
    {
      id: "account",
      name: "Cài đặt",
      href: "/settings",
      icon: UserCircle2,
      isActive: (p: string) => p.startsWith("/settings") || p.startsWith("/about") || p.startsWith("/clan"),
      onClick: onOpenAccount,
    },
  ];

  const visibleItems = navItems.filter((i) => i.show !== false);

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-lg max-w-lg mx-auto safe-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {visibleItems.map((item) => {
          const active = item.isActive(pathname);
          const Icon = item.icon;

          if (item.onClick) {
            return (
              <button
                key={item.id}
                onClick={item.onClick}
                className={`flex flex-col items-center justify-center w-full h-full py-1 transition-all ${
                  active ? "text-teal-600 font-semibold" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <div className={`p-1 rounded-xl transition-all ${active ? "bg-teal-50" : ""}`}>
                  <Icon className={`w-5 h-5 ${active ? "stroke-[2.5]" : "stroke-[1.75]"}`} />
                </div>
                <span className="text-[10px] mt-0.5 tracking-tight font-medium">{item.name}</span>
              </button>
            );
          }

          return (
            <Link
              key={item.id}
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full py-1 transition-all ${
                active ? "text-teal-600 font-semibold" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <div className={`p-1 rounded-xl transition-all ${active ? "bg-teal-50" : ""}`}>
                <Icon className={`w-5 h-5 ${active ? "stroke-[2.5]" : "stroke-[1.75]"}`} />
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
