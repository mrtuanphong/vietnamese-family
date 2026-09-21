"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu, Home, Users, Network, Settings, Info,
  Plus, UserPlus, CalendarDays,
  CircleUser, UserCog, Building2,
  LogOut, Lock,
} from "lucide-react";
import BottomTabBar from "@/components/ui/BottomTabBar";
import { clanApi, personsApi } from "@/lib/api";
import { AccessContext } from "@/lib/AccessContext";
import PersonDialog from "@/components/person/PersonDialog";
import LoginGate from "@/components/ui/LoginGate";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const LIST_ROUTES = ["/members", "/events", "/families"];

const navItems = [
  { href: "/",        label: "Trang chủ",          active: (p: string) => p === "/",                                        icon: Home },
  { href: "/events",  label: "Danh sách",           active: (p: string) => LIST_ROUTES.some((r) => p.startsWith(r)),        icon: Users },
  { href: "/tree",    label: "Cây gia phả",         active: (p: string) => p.startsWith("/tree"),                           icon: Network },
  { href: "/clan",    label: "Thông tin dòng họ",   active: (p: string) => p.startsWith("/clan"),                           icon: Settings },
  { href: "/about",   label: "Về phần mềm",         active: (p: string) => p.startsWith("/about"),                          icon: Info },
];

const HEADER_H = 56;
const SIDEBAR_W = 224;

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [clanName, setClanName] = useState("Gia Đình Việt");
  const [showAddPerson, setShowAddPerson] = useState(false);
  const [isPublic, setIsPublic] = useState(true);
  const [accessGranted, setAccessGranted] = useState(false);
  const [loggedInName, setLoggedInName] = useState("");
  const [canEdit, setCanEdit] = useState(false);
  const [isDev, setIsDev] = useState(false);

  useEffect(() => {
    setOpen(window.innerWidth >= 768);

    if (typeof window !== "undefined") {
      const host = window.location.hostname;
      if (host === "localhost" || host === "127.0.0.1" || host.includes("dev")) {
        setIsDev(true);
      }
    }

    // Read sessionStorage synchronously before any async calls to avoid login flash
    const granted = sessionStorage.getItem("giapha_access") === "granted";
    setAccessGranted(granted);
    if (granted) {
      setLoggedInName(sessionStorage.getItem("giapha_name") ?? "");
      setCanEdit(sessionStorage.getItem("giapha_can_edit") === "1");
    }
    setMounted(true);

    clanApi.get().then((c) => {
      if (c?.name) setClanName(c.name);
    });
    fetch("/api/access")
      .then((r) => r.json())
      .then((d) => {
        setIsPublic(d.public ?? true);
        if (typeof d.isDev === "boolean") {
          setIsDev(d.isDev);
        }
      })
      .catch(() => {});
  }, []);

  const desktopOpen = mounted && open;

  const rawPageTitle = (() => {
    if (pathname === "/") return "Trang chủ";
    if (LIST_ROUTES.some((r) => pathname.startsWith(r))) return "Danh sách";
    if (pathname.startsWith("/tree")) return "Cây gia phả";
    if (pathname.startsWith("/clan")) return "Thông tin dòng họ";
    if (pathname.startsWith("/about")) return "Về phần mềm";
    return "";
  })();

  const pageTitle = rawPageTitle ? (isDev ? `[Dev] ${rawPageTitle}` : rawPageTitle) : "";

  useEffect(() => {
    const fullTitle = rawPageTitle
      ? `${isDev ? "[Dev] " : ""}${rawPageTitle} · Gia Đình Việt`
      : `${isDev ? "[Dev] " : ""}Gia Đình Việt`;
    document.title = fullTitle;
  }, [rawPageTitle, isDev]);

  if (mounted && !accessGranted) {
    return (
      <LoginGate
        clanName={clanName}
        isPublic={isPublic}
        onGranted={(name, edit) => {
          setAccessGranted(true);
          setLoggedInName(name);
          setCanEdit(edit);
        }}
      />
    );
  }

  return (
    <>
      {/* Mobile overlay */}
      {open && mounted && (
        <div
          className="fixed inset-0 bg-black/40 z-10 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar — full viewport height */}
      <aside
        className="fixed left-0 top-0 h-screen w-56 bg-white z-20 flex flex-col transition-transform duration-200"
        style={{ transform: open ? "translateX(0)" : "translateX(-100%)" }}
      >
        {/* Sidebar brand */}
        <div className="h-14 shrink-0 flex items-center gap-2 px-4 bg-primary border-r border-primary-foreground/20">
          <span className="text-primary-foreground font-semibold text-base truncate flex-1 min-w-0">
            {clanName}
          </span>
          {!isPublic && <Lock size={13} className="text-primary-foreground/60 shrink-0" />}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2 border-r">
          {navItems.map(({ href, label, active: isActive, icon: Icon }) => {
            const active = isActive(pathname);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => {
                  if (typeof window !== "undefined" && window.innerWidth < 768) setOpen(false);
                }}
                className={`flex items-center gap-3 px-3 py-2.5 mx-2 my-0.5 rounded-lg font-medium transition-colors ${
                  active ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Icon size={20} className={active ? "text-gray-700" : "text-gray-400"} />
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main: header + content */}
      <div
        className="transition-all duration-200 flex flex-col h-dvh"
        style={{ marginLeft: desktopOpen ? SIDEBAR_W : 0 }}
      >
        {/* Header */}
        <header className="sticky top-0 z-30 h-14 shrink-0 bg-primary flex items-center px-3 gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen(!open)}
            aria-label="Mở/đóng menu"
            className="hidden md:inline-flex text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10 shrink-0"
          >
            <Menu size={20} />
          </Button>

          {pageTitle && (
            <span className="text-primary-foreground font-semibold text-base truncate">
              {pageTitle}
            </span>
          )}
          <div className="flex-1 min-w-0" />

          {/* Right actions */}
          <div className="flex items-center gap-1">
            {canEdit ? (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary-foreground/15 text-primary-foreground/80 shrink-0">
                Super Admin
              </span>
            ) : (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary-foreground/10 text-primary-foreground/60 shrink-0">
                Tài khoản khách
              </span>
            )}

            {canEdit && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Thêm mới"
                    className="rounded-full text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground data-[state=open]:bg-primary-foreground/10 data-[state=open]:text-primary-foreground"
                  >
                    <Plus size={20} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onSelect={() => setShowAddPerson(true)} className="gap-3 px-4 py-3 cursor-pointer">
                    <UserPlus size={18} className="text-gray-400" />
                    Thêm người
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled className="gap-3 px-4 py-3">
                    <Users size={18} className="text-gray-300" />
                    Thêm gia đình
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled className="gap-3 px-4 py-3">
                    <CalendarDays size={18} className="text-gray-300" />
                    Thêm sự kiện
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Thiết lập"
                  className="rounded-full text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground data-[state=open]:bg-primary-foreground/10 data-[state=open]:text-primary-foreground"
                >
                  <CircleUser size={20} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                {loggedInName && (
                  <DropdownMenuItem disabled className="gap-3 px-4 py-3">
                    <CircleUser size={18} className="text-gray-500" />
                    <div className="flex flex-col min-w-0">
                      <span className="font-medium text-gray-900 truncate">{loggedInName}</span>
                      <span className="text-xs text-gray-600">Đã đăng nhập</span>
                    </div>
                  </DropdownMenuItem>
                )}
                {loggedInName && (
                  <DropdownMenuItem
                    className="gap-3 px-4 py-3 cursor-pointer text-red-600 focus:text-red-600"
                    onSelect={() => {
                      sessionStorage.removeItem("giapha_access");
                      sessionStorage.removeItem("giapha_name");
                      sessionStorage.removeItem("giapha_can_edit");
                      setAccessGranted(false);
                      setLoggedInName("");
                      setCanEdit(false);
                    }}
                  >
                    <LogOut size={18} />
                    Thoát
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

          </div>
        </header>

        {/* Page content */}
        <AccessContext.Provider value={{ canEdit }}>
          <div className="flex-1 flex flex-col overflow-hidden">
            {children}
          </div>
        </AccessContext.Provider>
        <BottomTabBar />
      </div>

      <PersonDialog
        open={showAddPerson}
        onOpenChange={setShowAddPerson}
        title="Thêm người"
        onSubmit={async (data) => {
          await personsApi.create(data);
          setShowAddPerson(false);
          router.refresh();
        }}
      />
    </>
  );
}
