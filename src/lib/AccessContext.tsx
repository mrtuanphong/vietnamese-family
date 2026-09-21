"use client";

import { createContext, useContext } from "react";
import { UserRole } from "@/types";

export interface AccessContextValue {
  canEdit: boolean; // General editing (true for admin and super_admin)
  role: UserRole | null;
  personId: string | null;
  name: string | null;
  phone: string | null;
  editablePersonIds: string[];
  canEditClan: boolean; // Only super_admin
  canEditTree: boolean; // admin or super_admin
  canViewClan: boolean; // admin or super_admin
  canViewAbout: boolean; // admin or super_admin
  canEditPerson: (targetPersonId?: string | null) => boolean;
  canDeletePerson: (targetPersonId?: string | null) => boolean;
}

export const defaultAccessValue: AccessContextValue = {
  canEdit: false,
  role: null,
  personId: null,
  name: null,
  phone: null,
  editablePersonIds: [],
  canEditClan: false,
  canEditTree: false,
  canViewClan: false,
  canViewAbout: false,
  canEditPerson: () => false,
  canDeletePerson: () => false,
};

export const AccessContext = createContext<AccessContextValue>(defaultAccessValue);

export function useAccess() {
  return useContext(AccessContext);
}
