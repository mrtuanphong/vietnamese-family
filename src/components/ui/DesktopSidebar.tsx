"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { clanApi } from "@/lib/api";

const navItems = [
  {
    href: "/",
    label: "Trang chủ",
    active: (p: string) => p === "/",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href: "/members",
    label: "Danh sách",
    active: (p: string) => ["/members", "/events", "/families"].some((r) => p.startsWith(r)),
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    href: "/tree",
    label: "Cây gia phả",
    active: (p: string) => p.startsWith("/tree"),
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 20H5a2 2 0 01-2-2V6a2 2 0 012-2h4m6 16h4a2 2 0 002-2V6a2 2 0 00-2-2h-4m-6 16v-5m0-11V4m6 16v-8m0-8V4M9 9h6" />
      </svg>
    ),
  },
  {
    href: "/clan",
    label: "Dòng họ",
    active: (p: string) => p.startsWith("/clan"),
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

export default function DesktopSidebar() {
  const pathname = usePathname();
  const [clanName, setClanName] = useState("Gia Đình Việt");

  useEffect(() => {
    clanApi.get().then((c) => {
      if (c?.name) setClanName(c.name);
    });
  }, []);

  return (
    <aside className="hidden md:flex fixed top-0 left-0 h-full w-56 flex-col bg-white border-r z-20">
      <div className="px-5 py-4 border-b">
        <span className="font-bold text-sm text-gray-800 leading-tight line-clamp-2">{clanName}</span>
      </div>
      <nav className="flex-1 py-2 overflow-y-auto">
        {navItems.map((item) => {
          const active = item.active(pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 mx-2 my-0.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-amber-50 text-amber-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <span className={active ? "text-amber-600" : "text-gray-400"}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
