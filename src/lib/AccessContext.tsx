"use client";

import { createContext, useContext } from "react";
import { UserRole, UserWorkspaceSummary, WorkspaceType } from "@/types";
import { DEFAULT_ENABLED_MODULES } from "@/config/modules";

export interface AccessContextValue {
  userId: string | null;
  isSuperAdmin: boolean;
  canEdit: boolean; // General editing
  role: UserRole | null;
  personId: string | null;
  name: string | null;
  phone: string | null;
  adminModules: string[];
  editablePersonIds: string[];
  canEditClan: boolean; // Only super_admin
  canEditTree: boolean; // canManageCommunity or super_admin
  canManageCommunity: boolean;
  canManageFinance: boolean;
  canManageModule: (moduleIdOrCategory: string) => boolean;
  canViewClan: boolean; // super_admin or any module admin
  canViewAbout: boolean;
  canEditPerson: (targetPersonId?: string | null) => boolean;
  canDeletePerson: (targetPersonId?: string | null) => boolean;

  // Real-time Workspace & Module states
  activeWorkspaceId: string | null;
  workspaces: UserWorkspaceSummary[];
  enabledModules: string[];
  clanName: string;
  updateEnabledModules: (modules: string[]) => void;
  refreshClan: () => Promise<void>;
  switchWorkspace: (workspaceId: string) => Promise<void>;
  createWorkspace: (name: string, type?: WorkspaceType) => Promise<void>;
  refreshWorkspaces: () => Promise<void>;
}

export const defaultAccessValue: AccessContextValue = {
  userId: null,
  isSuperAdmin: false,
  canEdit: false,
  role: null,
  personId: null,
  name: null,
  phone: null,
  adminModules: [],
  editablePersonIds: [],
  canEditClan: false,
  canEditTree: false,
  canManageCommunity: false,
  canManageFinance: false,
  canManageModule: () => false,
  canViewClan: false,
  canViewAbout: false,
  canEditPerson: () => false,
  canDeletePerson: () => false,

  activeWorkspaceId: null,
  workspaces: [],
  enabledModules: DEFAULT_ENABLED_MODULES,
  clanName: "Gia Đình Việt",
  updateEnabledModules: () => {},
  refreshClan: async () => {},
  switchWorkspace: async () => {},
  createWorkspace: async () => {},
  refreshWorkspaces: async () => {},
};

export const AccessContext = createContext<AccessContextValue>(defaultAccessValue);

export function useAccess() {
  return useContext(AccessContext);
}
