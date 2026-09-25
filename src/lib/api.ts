import type { Clan, Person, Relationship, Marriage, AppUser, Fund, Transaction, Workspace, WorkspaceMember, UserWorkspaceSummary } from "@/types";

const base = "/api";

export const workspacesApi = {
  getAll: (userId?: string): Promise<any[]> => {
    const q = userId ? `?userId=${encodeURIComponent(userId)}` : "";
    return fetch(`${base}/workspaces${q}`).then(json<any[]>);
  },
  create: (data: { name: string; type?: string; address?: string; description?: string; clanLastName?: string; creatorUserId?: string; enabledModules?: string[] }): Promise<Workspace> =>
    fetch(`${base}/workspaces`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then(json<Workspace>),
  update: (data: Partial<Workspace> & { id: string }): Promise<Workspace> =>
    fetch(`${base}/workspaces`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then(json<Workspace>),
  getMembers: (workspaceId: string): Promise<any[]> =>
    fetch(`${base}/workspaces/${workspaceId}/members`).then(json<any[]>),
  addMember: (workspaceId: string, data: any): Promise<any> =>
    fetch(`${base}/workspaces/${workspaceId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then(json<any>),
  removeMember: (workspaceId: string, memberId: string): Promise<any> =>
    fetch(`${base}/workspaces/${workspaceId}/members?memberId=${encodeURIComponent(memberId)}`, {
      method: "DELETE",
    }).then(json<any>),
};

export const clanApi = {
  get: (): Promise<Clan | null> => fetch(`${base}/clan`).then((r) => r.json()),
  upsert: async (data: Omit<Clan, "id">): Promise<Clan> => {
    const res: Clan = await fetch(`${base}/clan`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((r) => r.json());

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("clan:updated", { detail: res }));
    }
    return res;
  },
};

async function json<T>(r: Response): Promise<T> {
  const data = await r.json();
  if (!r.ok) throw new Error(data?.error ?? `HTTP ${r.status}`);
  return data as T;
}

export const usersApi = {
  getAll: (): Promise<AppUser[]> => fetch(`${base}/users`).then(json<AppUser[]>),
  getOne: (id: string): Promise<AppUser> => fetch(`${base}/users/${id}`).then(json<AppUser>),
  create: (data: Partial<AppUser> & { phone: string; password: string; fullName: string }): Promise<AppUser> =>
    fetch(`${base}/users`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then(json<AppUser>),
  update: (id: string, data: Partial<AppUser> & { password?: string }): Promise<AppUser> =>
    fetch(`${base}/users/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then(json<AppUser>),
  delete: (id: string): Promise<{ success: boolean; message?: string }> =>
    fetch(`${base}/users/${id}`, { method: "DELETE" }).then(json<{ success: boolean; message?: string }>),
};

export const fundsApi = {
  getAll: (): Promise<Fund[]> => fetch(`${base}/funds`).then(json<Fund[]>),
  getOne: (id: string): Promise<Fund> => fetch(`${base}/funds/${id}`).then(json<Fund>),
  create: (data: Partial<Fund>): Promise<Fund> =>
    fetch(`${base}/funds`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then(json<Fund>),
  update: (id: string, data: Partial<Fund>): Promise<Fund> =>
    fetch(`${base}/funds/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then(json<Fund>),
  delete: (id: string): Promise<{ success: boolean; message?: string }> =>
    fetch(`${base}/funds/${id}`, { method: "DELETE" }).then(json<{ success: boolean; message?: string }>),
};

export const transactionsApi = {
  getAll: (params?: { fundId?: string; type?: string; category?: string }): Promise<Transaction[]> => {
    const sp = new URLSearchParams();
    if (params?.fundId) sp.set("fundId", params.fundId);
    if (params?.type) sp.set("type", params.type);
    if (params?.category) sp.set("category", params.category);
    const qs = sp.toString() ? `?${sp.toString()}` : "";
    return fetch(`${base}/transactions${qs}`).then(json<Transaction[]>);
  },
  create: (data: Partial<Transaction>): Promise<Transaction> =>
    fetch(`${base}/transactions`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then(json<Transaction>),
  delete: (id: string): Promise<{ success: boolean; message?: string }> =>
    fetch(`${base}/transactions/${id}`, { method: "DELETE" }).then(json<{ success: boolean; message?: string }>),
};

export const personsApi = {
  getAll: (): Promise<Person[]> => fetch(`${base}/persons`).then(json<Person[]>),
  getOne: (id: string): Promise<Person> => fetch(`${base}/persons/${id}`).then(json<Person>),
  create: (data: Omit<Person, "id">): Promise<Person> =>
    fetch(`${base}/persons`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then(json<Person>),
  update: (id: string, data: Partial<Person>): Promise<Person> =>
    fetch(`${base}/persons/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then(json<Person>),
  delete: (id: string): Promise<void> =>
    fetch(`${base}/persons/${id}`, { method: "DELETE" }).then(json<void>),
};

export const relationshipsApi = {
  getAll: (): Promise<Relationship[]> => fetch(`${base}/relationships`).then((r) => r.json()),
  create: (data: Omit<Relationship, "id">): Promise<Relationship> =>
    fetch(`${base}/relationships`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
  delete: (id: string): Promise<void> =>
    fetch(`${base}/relationships/${id}`, { method: "DELETE" }).then((r) => r.json()),
};

export const marriagesApi = {
  getAll: (): Promise<Marriage[]> => fetch(`${base}/marriages`).then((r) => r.json()),
  create: (data: Omit<Marriage, "id">): Promise<Marriage> =>
    fetch(`${base}/marriages`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
  delete: (id: string): Promise<void> =>
    fetch(`${base}/marriages/${id}`, { method: "DELETE" }).then((r) => r.json()),
};
