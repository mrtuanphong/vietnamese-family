export type WorkspaceType = "CLAN" | "CLUB" | "GROUP" | "COMMUNITY";

export interface Workspace {
  id: string;
  name: string;
  type: WorkspaceType;
  address?: string | null;
  description?: string | null;
  enabled: boolean;
  enabledModules?: string[] | null;
  clanLastName?: string | null;
  superAdminId?: string | null;
  superAdminGeneration?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  workspace?: Workspace;
  userId: string;
  user?: AppUser;
  role: UserRole;
  adminModules?: string[] | null;
  personId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserWorkspaceSummary {
  workspaceId: string;
  workspaceName: string;
  workspaceType: WorkspaceType;
  role: UserRole;
  adminModules: string[];
  enabledModules: string[];
  personId?: string | null;
}

export interface Clan {
  id: string;
  name: string;
  address?: string | null;
  description?: string | null;
  enabled: boolean;
  superAdminId?: string | null;
  superAdminGeneration?: number | null;
  clanLastName?: string | null;
  enabledModules?: string[] | null;
}

export type Gender = "male" | "female" | "unknown";
export type UserRole = "member" | "admin" | "super_admin";

export interface AppUser {
  id: string;
  phone: string;
  email?: string | null;
  fullName: string;
  avatarUrl?: string | null;
  status: "active" | "suspended";
  role: UserRole;
  adminModules?: string[] | null;
  personId?: string | null;
  person?: Partial<Person> | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Person {
  id: string;
  firstName: string;
  lastName: string;
  middleName?: string | null;
  gender: Gender;
  birthDate?: string | null;
  birthPlace?: string | null;
  deathDateLunar?: string | null;
  deathPlace?: string | null;
  phone?: string | null;
  currentAddress?: string | null;
  photoUrl?: string | null;
  bio?: string | null;
  generation?: number | null;
  childOrder?: number | null;
  isClanMember?: boolean;
  role?: UserRole;
  password?: string | null;
  adminModules?: string[] | null;
  userAccount?: AppUser | null;
  createdAt?: string;
}

export interface Relationship {
  id: string;
  parentId: string;
  childId: string;
}

export interface Marriage {
  id: string;
  spouse1Id: string;
  spouse2Id: string;
  startDate?: string | null;
  endDate?: string | null;
}

export interface FamilyTreeData {
  persons: Person[];
  relationships: Relationship[];
  marriages: Marriage[];
}

export interface Fund {
  id: string;
  name: string;
  description?: string | null;
  cycleType: "1_YEAR" | "EVENT" | "CUSTOM" | string;
  cycleName: string;
  amountPerCycle: number;
  currentCycle: string;
  balance: number;
  bankName?: string | null;
  bankAccount?: string | null;
  accountHolder?: string | null;
  createdAt?: string;
  updatedAt?: string;
  transactions?: Transaction[];
}

export interface Transaction {
  id: string;
  fundId: string;
  fund?: Fund;
  type: "INCOME" | "EXPENSE";
  category: "CYCLE_FEE" | "DONATION" | "EVENT_EXPENSE" | "VISIT_GIFT" | "SCHOLARSHIP" | "RENOVATION" | string;
  categoryName: string;
  title: string;
  amount: number;
  actorName: string;
  actorPhone?: string | null;
  actorId?: string | null;
  receiptUrl?: string | null;
  note?: string | null;
  isDonationSeparate?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
