"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { clanApi, personsApi, workspacesApi } from "@/lib/api";
import { AccessContext, AccessContextValue } from "@/lib/AccessContext";
import PersonDialog from "@/components/person/PersonDialog";
import LoginGate from "@/components/ui/LoginGate";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { UserRole, UserWorkspaceSummary, WorkspaceType } from "@/types";
import { DEFAULT_ENABLED_MODULES, SYSTEM_MODULES, isModuleEnabled } from "@/config/modules";

const LIST_ROUTES = ["/members", "/events", "/families"];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [clanName, setClanName] = useState("Gia Đình Việt");
  const [enabledModules, setEnabledModules] = useState<string[]>(DEFAULT_ENABLED_MODULES);
  const [showAddPerson, setShowAddPerson] = useState(false);
  const [accessGranted, setAccessGranted] = useState(false);
  const [loggedInName, setLoggedInName] = useState("");
  const [role, setRole] = useState<UserRole | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [adminModules, setAdminModules] = useState<string[]>([]);
  const [personId, setPersonId] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const [editablePersonIds, setEditablePersonIds] = useState<string[]>([]);
  const [isDev, setIsDev] = useState(false);

  // Multi-workspace states
  const [userId, setUserId] = useState<string | null>(null);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [workspaces, setWorkspaces] = useState<UserWorkspaceSummary[]>([]);

  const updateEnabledModules = useCallback((modules: string[]) => {
    setEnabledModules(modules);
  }, []);

  const refreshClan = useCallback(async () => {
    try {
      const c = await clanApi.get();
      if (c?.name) setClanName(c.name);
      if (c?.enabledModules && Array.isArray(c.enabledModules)) {
        setEnabledModules(c.enabledModules);
      }
    } catch (err) {
      console.error("Error refreshing clan:", err);
    }
  }, []);

  const switchWorkspace = useCallback(
    async (targetWorkspaceId: string) => {
      try {
        const target = workspaces.find((w) => w.workspaceId === targetWorkspaceId);
        if (!target) return;

        const isSuper = target.role === "super_admin";
        sessionStorage.setItem("giapha_active_workspace_id", targetWorkspaceId);
        sessionStorage.setItem("giapha_role", target.role);
        sessionStorage.setItem("giapha_is_super_admin", String(isSuper));
        sessionStorage.setItem("giapha_admin_modules", JSON.stringify(target.adminModules || []));
        sessionStorage.setItem("giapha_person_id", target.personId || "");
        sessionStorage.setItem("giapha_clan_name", target.workspaceName);

        setActiveWorkspaceId(targetWorkspaceId);
        setClanName(target.workspaceName);
        setRole(target.role);
        setIsSuperAdmin(isSuper);
        setAdminModules(target.adminModules || []);
        setPersonId(target.personId || null);
        if (target.enabledModules && target.enabledModules.length > 0) {
          setEnabledModules(target.enabledModules);
        }

        toast.success(`Đã chuyển sang: ${target.workspaceName}`);
        router.refresh();
      } catch (err) {
        toast.error("Không thể chuyển đổi không gian: " + String(err));
      }
    },
    [workspaces, router]
  );

  const createWorkspace = useCallback(
    async (name: string, type: WorkspaceType = "CLAN") => {
      try {
        const created = await workspacesApi.create({
          name,
          type,
          creatorUserId: userId || undefined,
        });

        // Refresh workspaces list
        const updatedList = await workspacesApi.getAll(userId || undefined);
        setWorkspaces(updatedList);
        sessionStorage.setItem("giapha_workspaces", JSON.stringify(updatedList));

        // Switch to newly created workspace
        await switchWorkspace(created.id);
        toast.success(`Đã tạo không gian mới: ${created.name}`);
      } catch (err) {
        toast.error("Tạo tổ chức thất bại: " + String(err));
      }
    },
    [userId, switchWorkspace]
  );

  const refreshWorkspaces = useCallback(async () => {
    try {
      if (userId) {
        const list = await workspacesApi.getAll(userId);
        setWorkspaces(list);
        sessionStorage.setItem("giapha_workspaces", JSON.stringify(list));
      }
    } catch (err) {
      console.error("Error refreshing workspaces:", err);
    }
  }, [userId]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const host = window.location.hostname;
      if (host === "localhost" || host === "127.0.0.1" || host.includes("dev")) {
        setIsDev(true);
      }
    }

    // Read sessionStorage synchronously
    const granted = sessionStorage.getItem("giapha_access") === "granted";
    setAccessGranted(granted);
    if (granted) {
      const storedRole = (sessionStorage.getItem("giapha_role") as UserRole) ?? "member";
      const isSuper = sessionStorage.getItem("giapha_is_super_admin") === "true" || storedRole === "super_admin";
      const storedUserId = sessionStorage.getItem("giapha_user_id");
      const storedActiveWsId = sessionStorage.getItem("giapha_active_workspace_id");
      const storedWorkspaces = sessionStorage.getItem("giapha_workspaces");
      const storedClanName = sessionStorage.getItem("giapha_clan_name");

      if (storedUserId) setUserId(storedUserId);
      if (storedActiveWsId) setActiveWorkspaceId(storedActiveWsId);
      if (storedClanName) setClanName(storedClanName);
      if (storedWorkspaces) {
        try {
          setWorkspaces(JSON.parse(storedWorkspaces));
        } catch {}
      }

      setLoggedInName(sessionStorage.getItem("giapha_name") ?? "");
      setRole(storedRole);
      setIsSuperAdmin(isSuper);
      setPersonId(sessionStorage.getItem("giapha_person_id") ?? null);
      setPhone(sessionStorage.getItem("giapha_phone") ?? null);

      try {
        const storedAdminModules = sessionStorage.getItem("giapha_admin_modules");
        setAdminModules(storedAdminModules ? JSON.parse(storedAdminModules) : (isSuper ? ["*"] : []));
      } catch {
        setAdminModules(isSuper ? ["*"] : []);
      }
      try {
        const storedIds = sessionStorage.getItem("giapha_editable_ids");
        setEditablePersonIds(storedIds ? JSON.parse(storedIds) : (isSuper ? ["*"] : []));
      } catch {
        setEditablePersonIds([]);
      }
    }
    setMounted(true);

    const activeWsId = sessionStorage.getItem("giapha_active_workspace_id");
    const uId = sessionStorage.getItem("giapha_user_id");
    if (uId) {
      workspacesApi.getAll(uId).then((wsList) => {
        if (Array.isArray(wsList) && wsList.length > 0) {
          setWorkspaces(wsList);
          sessionStorage.setItem("giapha_workspaces", JSON.stringify(wsList));
          const current = wsList.find((w: any) => w.workspaceId === activeWsId) || wsList[0];
          if (current) {
            setActiveWorkspaceId(current.workspaceId);
            setClanName(current.workspaceName);
            if (current.enabledModules) setEnabledModules(current.enabledModules);
          }
        }
      }).catch(() => {});
    } else {
      clanApi.get().then((c) => {
        if (c?.name) setClanName(c.name);
        if (c?.enabledModules && Array.isArray(c.enabledModules)) {
          setEnabledModules(c.enabledModules);
        }
      });
    }

    const handleClanUpdated = (e: any) => {
      const updated = e?.detail;
      if (updated) {
        if (updated.name) setClanName(updated.name);
        if (updated.enabledModules && Array.isArray(updated.enabledModules)) {
          setEnabledModules(updated.enabledModules);
        }
      }
    };
    window.addEventListener("clan:updated" as any, handleClanUpdated);

    fetch("/api/access")
      .then((r) => r.json())
      .then((d) => {
        if (typeof d.isDev === "boolean") {
          setIsDev(d.isDev);
        }
      })
      .catch(() => {});

    return () => {
      window.removeEventListener("clan:updated" as any, handleClanUpdated);
    };
  }, []);

  const isSuper = isSuperAdmin || role === "super_admin";

  const canManageModule = useCallback(
    (key: string): boolean => {
      if (isSuper) return true;
      if (adminModules.includes("*")) return true;
      return adminModules.includes(key);
    },
    [isSuper, adminModules]
  );

  const canManageCommunity = isSuper || role === "admin" || canManageModule("community") || canManageModule("tree");
  const canManageFinance = isSuper || role === "admin" || canManageModule("finance") || canManageModule("funds");
  const canEditClan = isSuper;
  const canEditTree = canManageCommunity;
  const canEdit = canManageCommunity;
  const canViewClan = isSuper || role === "admin" || adminModules.length > 0;
  const canViewAbout = true;

  const canEditPerson = useCallback(
    (targetPersonId?: string | null): boolean => {
      if (!targetPersonId) return false;
      if (isSuper || canManageCommunity) return true;
      if (role === "member") {
        return (
          editablePersonIds.includes(targetPersonId) ||
          editablePersonIds.includes("*") ||
          targetPersonId === personId
        );
      }
      return false;
    },
    [isSuper, canManageCommunity, role, editablePersonIds, personId]
  );

  const canDeletePerson = useCallback(
    (targetPersonId?: string | null): boolean => {
      if (!targetPersonId) return false;
      if (targetPersonId === personId) return false;
      if (isSuper || canManageCommunity) return true;
      return false;
    },
    [isSuper, canManageCommunity, personId]
  );

  // Route protection for administration
  useEffect(() => {
    if (!mounted || !accessGranted) return;
    const hasAdminAccess = isSuper || role === "admin" || canViewClan;
    if (!hasAdminAccess) {
      if (pathname.startsWith("/clan") || pathname.startsWith("/settings")) {
        router.replace("/");
      }
    }
  }, [mounted, accessGranted, isSuper, role, canViewClan, pathname, router]);

  // Route protection for disabled modules
  useEffect(() => {
    if (!mounted || !accessGranted) return;
    const currentModule = SYSTEM_MODULES.find(
      (m) => m.href === pathname || (m.href !== "/" && pathname.startsWith(m.href + "/"))
    );
    if (currentModule && !isModuleEnabled(currentModule.id, enabledModules)) {
      toast.info(`Tính năng "${currentModule.name}" hiện đang tắt.`);
      router.replace("/");
    }
  }, [mounted, accessGranted, pathname, enabledModules, router]);

  const rawPageTitle = (() => {
    if (pathname === "/") return "Tổng quan hệ thống";
    if (pathname.startsWith("/tree")) return "Cây gia phả";
    if (pathname.startsWith("/members")) return "Danh bạ thành viên";
    if (pathname.startsWith("/events")) return "Lịch giỗ & Sự kiện";
    if (pathname.startsWith("/families")) return "Hộ gia đình";
    if (pathname.startsWith("/community/settings")) return "Thiết lập dòng họ & Gia tộc";
    if (pathname.startsWith("/funds")) return "Các quỹ hội nhóm";
    if (pathname.startsWith("/transactions")) return "Sổ cái thu - chi";
    if (pathname.startsWith("/finance/settings")) return "Thiết lập tài chính & Quỹ";
    if (pathname.startsWith("/settings")) return "Cài đặt tổ chức & Hệ thống";
    if (pathname.startsWith("/clan")) return "Thiết lập dòng họ";
    if (pathname.startsWith("/about")) return "Hệ thống & CSDL";
    return "";
  })();

  const pageTitle = rawPageTitle;

  useEffect(() => {
    const fullTitle = rawPageTitle
      ? `${isDev ? "[Dev] " : ""}${rawPageTitle} · ${clanName}`
      : `${isDev ? "[Dev] " : ""}${clanName}`;
    document.title = fullTitle;
  }, [rawPageTitle, isDev, clanName]);

  const handleLogout = () => {
    sessionStorage.removeItem("giapha_access");
    sessionStorage.removeItem("giapha_name");
    sessionStorage.removeItem("giapha_role");
    sessionStorage.removeItem("giapha_is_super_admin");
    sessionStorage.removeItem("giapha_admin_modules");
    sessionStorage.removeItem("giapha_person_id");
    sessionStorage.removeItem("giapha_phone");
    sessionStorage.removeItem("giapha_editable_ids");
    sessionStorage.removeItem("giapha_user_id");
    sessionStorage.removeItem("giapha_active_workspace_id");
    sessionStorage.removeItem("giapha_workspaces");
    sessionStorage.removeItem("giapha_clan_name");
    setAccessGranted(false);
    setLoggedInName("");
    setRole(null);
    setIsSuperAdmin(false);
    setAdminModules([]);
    setPersonId(null);
    setPhone(null);
    setUserId(null);
    setActiveWorkspaceId(null);
    setWorkspaces([]);
    setEditablePersonIds([]);
  };

  const accessContextValue: AccessContextValue = useMemo(
    () => ({
      userId,
      isSuperAdmin: isSuper,
      canEdit,
      role,
      personId,
      name: loggedInName,
      phone,
      adminModules,
      editablePersonIds,
      canEditClan: isSuperAdmin,
      canEditTree: canManageCommunity,
      canManageCommunity,
      canManageFinance,
      canManageModule,
      canViewClan,
      canViewAbout,
      canEditPerson,
      canDeletePerson,
      enabledModules,
      clanName,
      updateEnabledModules,
      refreshClan,
      activeWorkspaceId,
      workspaces,
      switchWorkspace,
      createWorkspace,
      refreshWorkspaces,
    }),
    [
      userId,
      isSuper,
      canEdit,
      role,
      personId,
      loggedInName,
      phone,
      adminModules,
      editablePersonIds,
      isSuperAdmin,
      canManageCommunity,
      canManageFinance,
      canManageModule,
      canViewClan,
      canViewAbout,
      canEditPerson,
      canDeletePerson,
      enabledModules,
      clanName,
      updateEnabledModules,
      refreshClan,
      activeWorkspaceId,
      workspaces,
      switchWorkspace,
      createWorkspace,
      refreshWorkspaces,
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
          sessionStorage.setItem("giapha_is_super_admin", String(!!authData.isSuperAdmin));
          sessionStorage.setItem("giapha_personId", authData.personId ?? "");
          sessionStorage.setItem("giapha_phone", authData.phone);
          sessionStorage.setItem(
            "giapha_admin_modules",
            JSON.stringify(authData.adminModules ?? [])
          );
          sessionStorage.setItem(
            "giapha_editable_ids",
            JSON.stringify(authData.editablePersonIds)
          );

          if (authData.userId) {
            sessionStorage.setItem("giapha_user_id", authData.userId);
            setUserId(authData.userId);
          }
          if (authData.activeWorkspaceId) {
            sessionStorage.setItem("giapha_active_workspace_id", authData.activeWorkspaceId);
            setActiveWorkspaceId(authData.activeWorkspaceId);
          }
          if (authData.workspaces) {
            sessionStorage.setItem("giapha_workspaces", JSON.stringify(authData.workspaces));
            setWorkspaces(authData.workspaces);
          }
          if (authData.clanName) {
            sessionStorage.setItem("giapha_clan_name", authData.clanName);
            setClanName(authData.clanName);
          }
          if (authData.enabledModules && authData.enabledModules.length > 0) {
            setEnabledModules(authData.enabledModules);
          }

          setAccessGranted(true);
          setLoggedInName(authData.name);
          setRole(authData.role);
          setIsSuperAdmin(!!authData.isSuperAdmin);
          setPersonId(authData.personId);
          setPhone(authData.phone);
          setAdminModules(authData.adminModules ?? []);
          setEditablePersonIds(authData.editablePersonIds);
        }}
      />
    );
  }

  const isFullBleedRoute =
    pathname.startsWith("/tree") ||
    pathname.startsWith("/members") ||
    pathname.startsWith("/events") ||
    pathname.startsWith("/families") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/community/settings") ||
    pathname.startsWith("/finance/settings");

  return (
    <AccessContext.Provider value={accessContextValue}>
      <div className="h-screen h-dvh w-full flex flex-col md:flex-row overflow-hidden bg-slate-100/60 text-slate-900">
        {/* Sidebar on Desktop / Tablet (>= 768px) */}
        <Sidebar
          clanName={clanName}
          isDev={isDev}
          isSuperAdmin={isSuper}
          adminModules={adminModules}
          enabledModules={enabledModules}
          userName={loggedInName}
          role={role}
          phone={phone}
          activeWorkspaceId={activeWorkspaceId}
          workspaces={workspaces}
          onLogout={handleLogout}
          onOpenSettings={() => router.push("/settings")}
          onSwitchWorkspace={switchWorkspace}
          onCreateWorkspace={createWorkspace}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0 h-full overflow-hidden">
          {/* Header on Mobile & Desktop */}
          <Header
            clanName={clanName}
            isDev={isDev}
            isSuperAdmin={isSuper}
            adminModules={adminModules}
            pageTitle={rawPageTitle}
            role={role}
            loggedInName={loggedInName}
            phone={phone}
            canEditTree={canEditTree}
            onAddPerson={() => setShowAddPerson(true)}
            onLogout={handleLogout}
          />

          {/* Main content viewport */}
          <main
            className={`flex-1 flex flex-col min-w-0 min-h-0 ${
              isFullBleedRoute
                ? "overflow-hidden"
                : "overflow-y-auto overscroll-contain"
            }`}
          >
            {isFullBleedRoute ? (
              children
            ) : (
              <div className="w-full max-w-6xl mx-auto p-4 md:p-6 lg:p-8 pb-24 md:pb-8">
                {children}
              </div>
            )}
          </main>

          {/* Bottom Nav on Mobile (< 768px) */}
          <BottomNav
            enabledModules={enabledModules}
            onOpenAccount={() => router.push("/settings")}
          />
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
      </div>
    </AccessContext.Provider>
  );
}
