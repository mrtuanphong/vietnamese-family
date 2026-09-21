"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, Network, Settings } from "lucide-react";
import { useAccess } from "@/lib/AccessContext";

const LIST_ROUTES = ["/members", "/events", "/families"];

const tabs = [
  {
    href: "/",
    label: "Trang chủ",
    icon: Home,
    match: (p: string) => p === "/",
  },
  {
    href: "/events",
    label: "Danh sách",
    icon: Users,
    match: (p: string) => LIST_ROUTES.some((r) => p.startsWith(r)),
  },
  {
    href: "/tree",
    label: "Cây gia phả",
    icon: Network,
    match: (p: string) => p.startsWith("/tree"),
  },
  {
    href: "/clan",
    label: "Dòng họ",
    icon: Settings,
    match: (p: string) => p.startsWith("/clan"),
    requiresClanView: true,
  },
];

export default function BottomTabBar() {
  const pathname = usePathname();
  const { canViewClan } = useAccess();

  const visibleTabs = tabs.filter((t) => !t.requiresClanView || canViewClan);

  return (
    <nav className="sm:hidden bg-white border-t safe-bottom shrink-0">
      <div className="flex">
        {visibleTabs.map(({ href, label, icon: Icon, match }) => {
          const active = match(pathname);
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition-colors ${
                active ? "text-brand-500" : "text-gray-400"
              }`}
            >
              <Icon size={24} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
