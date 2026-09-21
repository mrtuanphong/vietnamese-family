"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu, Home, Users, Network, Settings, Info,
  Plus, UserPlus, CalendarDays,
  CircleUser, LogOut,
} from "lucide-react";
import BottomTabBar from "@/components/ui/BottomTabBar";
import { clanApi, personsApi } from "@/lib/api";
import { AccessContext, AccessContextValue } from "@/lib/AccessContext";
import PersonDialog from "@/components/person/PersonDialog";
import LoginGate from "@/components/ui/LoginGate";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserRole } from "@/types";

const LIST_ROUTES = ["/members", "/events", "/families"];

const navItems = [
  { href: "/",        label: "Trang chủ",          active: (p: string) => p === "/",                                        icon: Home },
  { href: "/events",  label: "Danh sách",           active: (p: string) => LIST_ROUTES.some((r) => p.startsWith(r)),        icon: Users },
  { href: "/tree",    label: "Cây gia phả",         active: (p: string) => p.startsWith("/tree"),                           icon: Network },
  { href: "/clan",    label: "Thông tin dòng họ",   active: (p: string) => p.startsWith("/clan"),                           icon: Settings, requiresClanView: true },
  { href: "/about",   label: "Về phần mềm",         active: (p: string) => p.startsWith("/about"),                          icon: Info,     requiresAboutView: true },
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
  const [accessGranted, setAccessGranted] = useState(false);
  const [loggedInName, setLoggedInName] = useState("");
  const [role, setRole] = useState<UserRole | null>(null);
  const [personId, setPersonId] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const [editablePersonIds, setEditablePersonIds] = useState<string[]>([]);
  const [isDev, setIsDev] = useState(false);

  useEffect(() => {
    setOpen(window.innerWidth >= 768);

    if (typeof window !== "undefined") {
      const host = window.location.hostname;
      if (host === "localhost" || host === "127.0.0.1" || host.includes("dev")) {
        setIsDev(true);
      }
    }

    // Read sessionStorage synchronously before any async calls
    const granted = sessionStorage.getItem("giapha_access") === "granted";
    setAccessGranted(granted);
    if (granted) {
      setLoggedInName(sessionStorage.getItem("giapha_name") ?? "");
      setRole((sessionStorage.getItem("giapha_role") as UserRole) ?? "member");
      setPersonId(sessionStorage.getItem("giapha_person_id") ?? null);
      setPhone(sessionStorage.getItem("giapha_phone") ?? null);
      try {
        const storedIds = sessionStorage.getItem("giapha_editable_ids");
        setEditablePersonIds(storedIds ? JSON.parse(storedIds) : []);
      } catch {
        setEditablePersonIds([]);
      }
    }
    setMounted(true);

    clanApi.get().then((c) => {
      if (c?.name) setClanName(c.name);
    });

    fetch("/api/access")
      .then((r) => r.json())
      .then((d) => {
        if (typeof d.isDev === "boolean") {
          setIsDev(d.isDev);
        }
      })
      .catch(() => {});
  }, []);

  const canEditClan = role === "super_admin";
  const canEditTree = role === "admin" || role === "super_admin";
  const canEdit = canEditTree;
  const canViewClan = role === "admin" || role === "super_admin";
  const canViewAbout = role === "admin" || role === "super_admin";

  const canEditPerson = useCallback(
    (targetPersonId?: string | null): boolean => {
      if (!targetPersonId) return false;
      if (role === "super_admin" || role === "admin") return true;
      if (role === "member") {
        return (
          editablePersonIds.includes(targetPersonId) ||
          editablePersonIds.includes("*") ||
          targetPersonId === personId
        );
      }
      return false;
    },
    [role, editablePersonIds, personId]
  );

  const canDeletePerson = useCallback(
    (targetPersonId?: string | null): boolean => {
      if (!targetPersonId) return false;
      // Không cho phép bất kỳ ai (member, admin) tự xóa tài khoản của chính mình
      if (targetPersonId === personId) return false;
      // Role member không có quyền xóa bất kỳ ai
      if (role === "member") return false;
      // Role admin hoặc super_admin có quyền xóa thành viên khác
      if (role === "super_admin" || role === "admin") return true;
      return false;
    },
    [role, personId]
  );

  // Route protection: Members cannot view /clan and /about
  useEffect(() => {
    if (!mounted || !accessGranted) return;
    if (role === "member") {
      if (pathname.startsWith("/clan") || pathname.startsWith("/about")) {
        router.replace("/");
      }
    }
  }, [mounted, accessGranted, role, pathname, router]);

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

  const accessContextValue: AccessContextValue = useMemo(
    () => ({
      canEdit,
      role,
      personId,
      name: loggedInName,
      phone,
      editablePersonIds,
      canEditClan,
      canEditTree,
      canViewClan,
      canViewAbout,
      canEditPerson,
      canDeletePerson,
    }),
    [
      canEdit,
      role,
      personId,
      loggedInName,
      phone,
      editablePersonIds,
      canEditClan,
      canEditTree,
      canViewClan,
      canViewAbout,
      canEditPerson,
      canDeletePerson,
    ]
  );

  if (mounted && !accessGranted) {
    return (
      <LoginGate
        clanName={clanName}
        onGranted={(authData) => {
          sessionStorage.setItem("giapha_access", "granted");
          sessionStorage.setItem("giapha_name", authData.name);
          sessionStorage.setItem("giapha_role", authData.role);
          sessionStorage.setItem("giapha_person_id", authData.personId);
          sessionStorage.setItem("giapha_phone", authData.phone);
          sessionStorage.setItem(
            "giapha_editable_ids",
            JSON.stringify(authData.editablePersonIds)
          );
          setAccessGranted(true);
          setLoggedInName(authData.name);
          setRole(authData.role);
          setPersonId(authData.personId);
          setPhone(authData.phone);
          setEditablePersonIds(authData.editablePersonIds);
        }}
      />
    );
  }

  const visibleNavItems = navItems.filter((item) => {
    if (item.requiresClanView && !canViewClan) return false;
    if (item.requiresAboutView && !canViewAbout) return false;
    return true;
  });

  const getRoleBadge = () => {
    switch (role) {
      case "super_admin":
        return (
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary-foreground/20 text-primary-foreground shrink-0">
            Super Admin
          </span>
        );
      case "admin":
        return (
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary-foreground/15 text-primary-foreground/90 shrink-0">
            Quản trị viên
          </span>
        );
      case "member":
      default:
        return (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary-foreground/10 text-primary-foreground/80 shrink-0">
            Thành viên
          </span>
        );
    }
  };

  const getRoleDisplayTitle = () => {
    switch (role) {
      case "super_admin":
        return "Super Admin";
      case "admin":
        return "Quản trị viên";
      case "member":
      default:
        return "Thành viên dòng họ";
    }
  };

  return (
    <AccessContext.Provider value={accessContextValue}>
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
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2 border-r">
          {visibleNavItems.map(({ href, label, active: isActive, icon: Icon }) => {
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
            {getRoleBadge()}

            {canEditTree && (
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
                  aria-label="Tài khoản"
                  className="rounded-full text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground data-[state=open]:bg-primary-foreground/10 data-[state=open]:text-primary-foreground"
                >
                  <CircleUser size={20} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                {loggedInName && (
                  <div className="px-4 py-3 border-b">
                    <p className="font-semibold text-gray-900 truncate">{loggedInName}</p>
                    <p className="text-xs text-brand-600 font-medium mt-0.5">{getRoleDisplayTitle()}</p>
                    {phone && <p className="text-xs text-gray-400 mt-0.5">{phone}</p>}
                  </div>
                )}
                <DropdownMenuItem
                  className="gap-3 px-4 py-3 cursor-pointer text-red-600 focus:text-red-600"
                  onSelect={() => {
                    sessionStorage.removeItem("giapha_access");
                    sessionStorage.removeItem("giapha_name");
                    sessionStorage.removeItem("giapha_role");
                    sessionStorage.removeItem("giapha_person_id");
                    sessionStorage.removeItem("giapha_phone");
                    sessionStorage.removeItem("giapha_editable_ids");
                    setAccessGranted(false);
                    setLoggedInName("");
                    setRole(null);
                    setPersonId(null);
                    setPhone(null);
                    setEditablePersonIds([]);
                  }}
                >
                  <LogOut size={18} />
                  Đăng xuất
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {children}
        </div>
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
    </AccessContext.Provider>
  );
}
