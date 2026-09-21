"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { User, Heart, Users, Network, Pencil, Trash2, Cake, Flame, Info, MoreHorizontal, Loader2, ChevronLeft, ChevronRight, Star } from "lucide-react";
import LotusIcon from "@/components/icons/LotusIcon";
import { Lunar } from "lunar-javascript";
import { useRouter } from "next/navigation";
import { personsApi, clanApi, relationshipsApi, marriagesApi } from "@/lib/api";
import { useAccess } from "@/lib/AccessContext";
import PersonDialog from "@/components/person/PersonDialog";
import PersonSidebar from "@/components/tree/PersonSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Person, Relationship, Marriage } from "@/types";

type Tab = "people" | "families" | "events";
type EventCategory = "birthday" | "anniversary";
type EventFilter = "all" | "birthday" | "anniversary";

interface FamilyEvent {
  person: Person;
  category: EventCategory;
  displayDate: string;
  nextDate: Date;
  daysUntil: number;
}

function fullName(p: Person) {
  return [p.lastName || "—", p.middleName, p.firstName].filter(Boolean).join(" ");
}

function normalize(str: string): string {
  return str.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D");
}

function dateOf(dateStr?: string | null) {
  if (!dateStr) return "—";
  const parts = dateStr.split("-");
  const y = parts[0] === "0001" ? "—" : (parts[0] ?? "—");
  const m = parts[1] ?? "—";
  const d = parts[2] ?? "—";
  return `${d}/${m}/${y}`;
}

function yearOf(d?: string | null) {
  const y = d?.slice(0, 4) ?? null;
  return y === "0001" ? "?" : y;
}

function outsiderLabel(person: Person): string | null {
  if (person.isClanMember !== false) return null;
  return person.gender === "female" ? "Dâu" : person.gender === "male" ? "Rể" : "Dâu/Rể";
}

// ── Families logic ──────────────────────────────────────────────

interface FamilyUnit {
  id: string;
  spouse1?: Person;
  spouse2?: Person;
  children: Person[];
}

function buildFamilies(
  persons: Person[],
  relationships: Relationship[],
  marriages: Marriage[]
): FamilyUnit[] {
  const personMap = new Map(persons.map((p) => [p.id, p]));

  const parentChildren = new Map<string, string[]>();
  for (const rel of relationships) {
    if (!parentChildren.has(rel.parentId)) parentChildren.set(rel.parentId, []);
    parentChildren.get(rel.parentId)!.push(rel.childId);
  }

  const coveredParents = new Set<string>();
  const families: FamilyUnit[] = [];

  for (const m of marriages) {
    const childIds = new Set([
      ...(parentChildren.get(m.spouse1Id) ?? []),
      ...(parentChildren.get(m.spouse2Id) ?? []),
    ]);
    const children = [...childIds]
      .map((id) => personMap.get(id))
      .filter(Boolean) as Person[];

    children.sort((a, b) => {
      const oa = a.childOrder ?? Infinity;
      const ob = b.childOrder ?? Infinity;
      if (oa !== ob) return oa - ob;
      const da = a.birthDate ?? "";
      const db = b.birthDate ?? "";
      return da !== db ? (da < db ? -1 : 1) : a.firstName.localeCompare(b.firstName, "vi");
    });

    // male spouse first
    let s1 = personMap.get(m.spouse1Id);
    let s2 = personMap.get(m.spouse2Id);
    if (s1?.gender === "female" && s2?.gender !== "female") [s1, s2] = [s2, s1];

    families.push({ id: `marriage-${m.id}`, spouse1: s1, spouse2: s2, children });
    coveredParents.add(m.spouse1Id);
    coveredParents.add(m.spouse2Id);
  }

  for (const [parentId, childIds] of parentChildren) {
    if (coveredParents.has(parentId)) continue;
    const parent = personMap.get(parentId);
    if (!parent) continue;
    const children = childIds.map((id) => personMap.get(id)).filter(Boolean) as Person[];
    children.sort((a, b) => {
      const oa = a.childOrder ?? Infinity;
      const ob = b.childOrder ?? Infinity;
      if (oa !== ob) return oa - ob;
      const da = a.birthDate ?? "";
      const db = b.birthDate ?? "";
      return da !== db ? (da < db ? -1 : 1) : a.firstName.localeCompare(b.firstName, "vi");
    });
    families.push({ id: `single-${parentId}`, spouse1: parent, children });
  }

  families.sort((a, b) => {
    const ga = a.spouse1?.generation ?? a.spouse2?.generation ?? 999;
    const gb = b.spouse1?.generation ?? b.spouse2?.generation ?? 999;
    if (ga !== gb) return ga - gb;
    return fullName(a.spouse1 ?? ({} as Person)).localeCompare(
      fullName(b.spouse1 ?? ({} as Person)), "vi"
    );
  });

  return families;
}

// ── Events logic ─────────────────────────────────────────────────

function getNextSolarOccurrence(month: number, day: number, today: Date): Date {
  const year = today.getFullYear();
  const candidate = new Date(year, month - 1, day);
  if (candidate >= today) return candidate;
  return new Date(year + 1, month - 1, day);
}

function getNextLunarOccurrence(lunarMonth: number, lunarDay: number, today: Date): Date | null {
  for (const y of [today.getFullYear(), today.getFullYear() + 1]) {
    try {
      const solar = Lunar.fromYmd(y, lunarMonth, lunarDay).getSolar();
      const d = new Date(solar.getYear(), solar.getMonth() - 1, solar.getDay());
      if (d >= today) return d;
    } catch {
      // invalid lunar date for this year (e.g. leap month absent)
    }
  }
  return null;
}

function buildEvents(persons: Person[]): FamilyEvent[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const events: FamilyEvent[] = [];

  for (const p of persons) {
    if (!p.deathDateLunar && p.birthDate) {
      const parts = p.birthDate.split("-");
      const m = parseInt(parts[1] ?? "0");
      const d = parseInt(parts[2] ?? "0");
      if (m > 0 && d > 0) {
        const nextDate = getNextSolarOccurrence(m, d, today);
        const daysUntil = Math.round((nextDate.getTime() - today.getTime()) / 86400000);
        events.push({
          person: p,
          category: "birthday",
          displayDate: `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}`,
          nextDate,
          daysUntil,
        });
      }
    }

    if (p.deathDateLunar) {
      const parts = p.deathDateLunar.split("-");
      const lm = parseInt(parts[1] ?? "0");
      const ld = parseInt(parts[2] ?? "0");
      if (lm > 0 && ld > 0) {
        const nextDate = getNextLunarOccurrence(lm, ld, today);
        if (nextDate) {
          const daysUntil = Math.round((nextDate.getTime() - today.getTime()) / 86400000);
          const solarD = String(nextDate.getDate()).padStart(2, "0");
          const solarM = String(nextDate.getMonth() + 1).padStart(2, "0");
          events.push({
            person: p,
            category: "anniversary",
            displayDate: `${solarD}/${solarM} (tức ${String(ld).padStart(2, "0")}/${String(lm).padStart(2, "0")} ÂL)`,
            nextDate,
            daysUntil,
          });
        }
      }
    }
  }

  return events.sort((a, b) => a.daysUntil - b.daysUntil);
}

// ── Shared avatar ────────────────────────────────────────────────

function Avatar({ person, size = "md", isFirstChild }: { person: Person; size?: "sm" | "md" | "table"; isFirstChild?: boolean }) {
  const sz = size === "sm" ? "w-8 h-8" : size === "table" ? "w-9 h-9" : "w-10 h-10";
  const iconSz = size === "sm" ? 15 : 18;
  const deceased = !!person.deathDateLunar;
  const color =
    person.gender === "female"
    ? "bg-pink-100 text-pink-400"
    : person.gender === "male"
    ? "bg-gray-100 text-gray-500"
    : "bg-gray-100 text-gray-400";
  return (
    <div className="relative shrink-0 inline-flex">
      {/* deceased always uses icon avatar, never photo */}
      <span className={`${sz} rounded-full flex items-center justify-center ${color}`}>
        {deceased ? <LotusIcon size={iconSz} className={person.gender === "female" ? "text-pink-800" : "text-gray-800"} /> : <User size={iconSz} />}
      </span>
      {isFirstChild && (
        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 flex items-center justify-center shadow-sm">
          <Star size={9} className="text-white" fill="currentColor" />
        </span>
      )}
    </div>
  );
}


// ── Family card ──────────────────────────────────────────────────

function OutsiderBadge({ label }: { label: string | null }) {
  if (!label) return null;
  return (
    <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded font-medium shrink-0">
      {label}
    </span>
  );
}

function FamilyCard({
  family,
  selectedPersonId,
  onSelectPerson,
}: {
  family: FamilyUnit;
  selectedPersonId?: string | null;
  onSelectPerson: (p: Person) => void;
}) {
  const { spouse1, spouse2, children } = family;

  const spouseClass = (p: Person) =>
    `flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors min-w-0 cursor-default ${
      selectedPersonId === p.id ? "bg-brand-500 text-white" : "hover:bg-brand-50"
    }`;

  return (
    <Card className="gap-0 py-0">
      <div className="px-3 py-3 flex items-center gap-2 flex-wrap">
        {spouse1 && (
          <button onClick={() => onSelectPerson(spouse1)} className={spouseClass(spouse1)}>
            <Avatar person={spouse1} isFirstChild={spouse1.childOrder === 1} />
            <span className="font-semibold truncate">{fullName(spouse1)}</span>
            <OutsiderBadge label={outsiderLabel(spouse1)} />
          </button>
        )}
        {spouse2 && (
          <>
            <Heart size={14} className="text-pink-400 shrink-0" fill="currentColor" />
            <button onClick={() => onSelectPerson(spouse2)} className={spouseClass(spouse2)}>
              <Avatar person={spouse2} isFirstChild={spouse2.childOrder === 1} />
              <span className="font-semibold truncate">{fullName(spouse2)}</span>
              <OutsiderBadge label={outsiderLabel(spouse2)} />
            </button>
          </>
        )}
      </div>

      {children.length > 0 && (
        <>
          <div className="border-t mx-4" />
          <div className="px-1 py-2">
            <p className="px-3 py-1 text-xs font-medium text-gray-400 uppercase tracking-wide">
              Con cái · {children.length}
            </p>
            {children.map((child) => {
              const b = yearOf(child.birthDate);
              const d = yearOf(child.deathDateLunar);
              const years = b ? (d ? `${b}–${d}` : b) : null;
              const isSelected = selectedPersonId === child.id;
              return (
                <button
                  key={child.id}
                  onClick={() => onSelectPerson(child)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors group text-left cursor-default ${
                    isSelected ? "bg-brand-500 text-white" : "hover:bg-brand-50"
                  }`}
                >
                  <Avatar person={child} size="sm" isFirstChild={child.childOrder === 1} />
                  <div className="flex-1 min-w-0">
                    <span className="font-medium">
                      {fullName(child)}
                    </span>
                    {(years || child.generation != null || child.childOrder != null) && (
                      <span className={`text-xs ml-2 ${isSelected ? "text-white/70" : "text-gray-400"}`}>
                        {[
                          child.childOrder != null ? `Con thứ ${child.childOrder}` : null,
                          child.generation != null ? `Đời ${child.generation}` : null,
                          years,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}
    </Card>
  );
}

// ── Main component ────────────────────────────────────────────────

const TAB_ROUTES: Record<Tab, string> = {
  events: "/events",
  people: "/members",
  families: "/families",
};

export default function ListPageContent({
  activeTab,
  initialPersonId,
}: {
  activeTab: Tab;
  initialPersonId?: string;
}) {
  const [persons, setPersons] = useState<Person[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [marriages, setMarriages] = useState<Marriage[]>([]);
  const [clanName, setClanName] = useState<string>("Gia Đình Việt");
  const [superAdminId, setSuperAdminId] = useState<string | null>(null);
  const [clanLastNameSetting, setClanLastNameSetting] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "generation_asc" | "generation_desc" | "name_asc" | "name_desc">("recent");
  const [genFilter, setGenFilter] = useState<number | null>(null);
  const [editTarget, setEditTarget] = useState<Person | null>(null);
  const [showAddPerson, setShowAddPerson] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [isMutating, setIsMutating] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const router = useRouter();
  const [eventFilter, setEventFilter] = useState<EventFilter>("all");
  const [pageSize, setPageSize] = useState<number>(50);
  const [page, setPage] = useState(1);

  const load = () =>
    Promise.all([
      personsApi.getAll(),
      relationshipsApi.getAll(),
      marriagesApi.getAll(),
    ]).then(([p, r, m]) => {
      setPersons(p);
      setRelationships(r);
      setMarriages(m);
    });

  useEffect(() => {
    load();
    clanApi.get().then((c) => {
      if (c?.name) setClanName(c.name);
      if (c?.superAdminId) setSuperAdminId(c.superAdminId);
      setClanLastNameSetting(c?.clanLastName ?? null);
    });
  }, []);

  useEffect(() => {
    if (!initialPersonId || persons.length === 0) return;
    const person = persons.find((p) => p.id === initialPersonId) ?? null;
    setSelectedPerson(person);
  }, [persons, initialPersonId]);

  const handleAdd = async (data: Omit<Person, "id">) => {
    const tid = toast.loading("Đang thêm người...");
    try {
      await personsApi.create(data);
      toast.success("Đã thêm người", { id: tid });
      setShowAddPerson(false);
      load();
    } catch {
      toast.error("Thêm thất bại", { id: tid });
    }
  };

  const handleEdit = async (data: Omit<Person, "id">) => {
    if (!editTarget) return;
    const tid = toast.loading("Đang lưu...");
    try {
      await personsApi.update(editTarget.id, data);
      toast.success("Đã lưu", { id: tid });
      load();
    } catch {
      toast.error("Lưu thất bại", { id: tid });
    }
  };

  const handleDelete = async (id: string) => {
    const person = persons.find((p) => p.id === id);
    const name = person ? fullName(person) : "người này";
    if (!confirm(`Xoá "${name}" khỏi dòng họ?`)) return;
    setDeletingId(id);
    const tid = toast.loading(`Đang xoá ${name}...`);
    try {
      await personsApi.delete(id);
      toast.success(`Đã xoá ${name}`, { id: tid });
      load();
    } catch {
      toast.error("Xoá thất bại", { id: tid });
    } finally {
      setDeletingId(null);
    }
  };

  const mutate = async (fn: () => Promise<void>) => {
    setIsMutating(true);
    try { await fn(); await load(); } finally { setIsMutating(false); }
  };

  const refreshSelected = async (p: Person | null) => {
    if (!p) return;
    const fresh = (await personsApi.getAll()).find((x) => x.id === p.id);
    setSelectedPerson(fresh ?? null);
  };

  const handleSidebarDelete = async (id: string) => {
    const person = persons.find((p) => p.id === id);
    const name = person ? fullName(person) : "người này";
    if (!confirm(`Xoá "${name}" khỏi dòng họ?`)) return;
    await mutate(async () => { await personsApi.delete(id); setSelectedPerson(null); });
  };

  const handleAddParent = (parentId: string, childId: string) =>
    mutate(async () => { await relationshipsApi.create({ parentId, childId }); });
  const handleAddChild = (parentId: string, childId: string) =>
    mutate(async () => { await relationshipsApi.create({ parentId, childId }); });
  const handleAddSpouse = (s1: string, s2: string) =>
    mutate(async () => { await marriagesApi.create({ spouse1Id: s1, spouse2Id: s2 }); });
  const handleRemoveParent = (id: string) =>
    mutate(() => relationshipsApi.delete(id));
  const handleRemoveChild = (id: string) =>
    mutate(() => relationshipsApi.delete(id));
  const handleRemoveSpouse = (id: string) =>
    mutate(() => marriagesApi.delete(id));

  const { canEdit, canEditPerson, canDeletePerson } = useAccess();
  const hasGenerations = persons.some((p) => p.generation != null);
  const generations = Array.from(
    new Set(persons.map((p) => p.generation).filter((g): g is number => g != null))
  ).sort((a, b) => a - b);

  const filtered = persons
    .filter((p) => normalize(fullName(p)).toLowerCase().includes(normalize(search).toLowerCase()))
    .filter((p) => genFilter === null || p.generation === genFilter)
    .sort((a, b) => {
      if (sortBy === "recent") return (b.createdAt ?? "") > (a.createdAt ?? "") ? 1 : -1;
      if (sortBy === "generation_asc") return (a.generation ?? Infinity) - (b.generation ?? Infinity);
      if (sortBy === "generation_desc") return (b.generation ?? -Infinity) - (a.generation ?? -Infinity);
      if (sortBy === "name_asc") return a.firstName.localeCompare(b.firstName, "vi");
      return b.firstName.localeCompare(a.firstName, "vi");
    });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const families = buildFamilies(persons, relationships, marriages);
  const clanLastName = clanLastNameSetting ?? persons.find((p) => p.id === superAdminId)?.lastName ?? null;
  const allEvents = buildEvents(persons);
  const filteredEvents = allEvents.filter((ev) => eventFilter === "all" || ev.category === eventFilter);

  const handleTabChange = (v: string) => {
    const tab = v as Tab;
    router.push(TAB_ROUTES[tab]);
  };

  const handleMemberRowClick = (p: Person) => {
    if (selectedPerson?.id === p.id) {
      router.push("/members");
    } else {
      router.push(`/members/${p.id}`);
    }
  };

  const handleSidebarClose = () => {
    if (activeTab === "people") {
      router.push("/members");
    } else {
      setSelectedPerson(null);
    }
  };

  // suppress unused warning — clanName/clanLastName used in future dashboard
  void clanName;
  void clanLastName;

  return (
    <div className="flex-1 bg-white flex overflow-hidden">

      <main className="flex-1 min-w-0 overflow-y-auto px-4 sm:px-6 py-6">
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="mb-4 w-full">
          <TabsTrigger value="events" className="flex-1">Sự kiện</TabsTrigger>
          <TabsTrigger value="people" className="flex-1">Thành viên</TabsTrigger>
          <TabsTrigger value="families" className="flex-1">Gia đình</TabsTrigger>
        </TabsList>

        {/* ── People tab ── */}
        <TabsContent value="people">
          <>
            <div className="flex items-center gap-2 mb-3">
              <Input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Tìm theo tên..."
                className="flex-1 min-w-0"
              />
            </div>

            {generations.length > 0 ? (
              <div className="flex flex-col gap-2 mb-4">
                <div className="flex overflow-x-auto gap-1.5 pb-1 scrollbar-none">
                  <button
                    onClick={() => { setGenFilter(null); setPage(1); }}
                    className={`px-3.5 py-1 text-[0.875rem] font-medium rounded-full border transition-colors shrink-0 ${genFilter === null ? "bg-brand-500 text-white border-brand-500" : "bg-white text-gray-600 border-border hover:border-gray-400"}`}
                  >
                    Tất cả
                  </button>
                  {generations.map((g) => (
                    <button
                      key={g}
                      onClick={() => { setGenFilter(g); setPage(1); }}
                      className={`px-3.5 py-1 text-[0.875rem] font-medium rounded-full border transition-colors shrink-0 ${genFilter === g ? "bg-brand-500 text-white border-brand-500" : "bg-white text-gray-600 border-border hover:border-gray-400"}`}
                    >
                      Đời {g}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between items-center gap-1.5 flex-wrap">
                  <span className="text-sm text-gray-400">Tổng {filtered.length} người</span>
                  <div className="flex items-center gap-1.5">
                  <span className="text-sm text-gray-600 whitespace-nowrap">Xếp theo</span>
                  <Select value={sortBy} onValueChange={(v) => { setSortBy(v as typeof sortBy); setPage(1); }}>
                    <SelectTrigger size="sm" className="w-38">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recent">Mặc định (mới)</SelectItem>
                      <SelectItem value="generation_asc">Đời (tăng dần)</SelectItem>
                      <SelectItem value="generation_desc">Đời (giảm dần)</SelectItem>
                      <SelectItem value="name_asc">Tên (A-Z)</SelectItem>
                      <SelectItem value="name_desc">Tên (Z-A)</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
                    <SelectTrigger size="sm" className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="50">50 / trang</SelectItem>
                      <SelectItem value="100">100 / trang</SelectItem>
                    </SelectContent>
                  </Select>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm text-gray-400">Tổng {filtered.length} người</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm text-gray-600 whitespace-nowrap">Xếp theo</span>
                  <Select value={sortBy} onValueChange={(v) => { setSortBy(v as typeof sortBy); setPage(1); }}>
                    <SelectTrigger size="sm" className="w-38">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recent">Mặc định (mới)</SelectItem>
                      <SelectItem value="generation_asc">Đời (tăng dần)</SelectItem>
                      <SelectItem value="generation_desc">Đời (giảm dần)</SelectItem>
                      <SelectItem value="name_asc">Tên (A-Z)</SelectItem>
                      <SelectItem value="name_desc">Tên (Z-A)</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
                    <SelectTrigger size="sm" className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="50">50 / trang</SelectItem>
                      <SelectItem value="100">100 / trang</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-2 pr-1 w-8 text-right text-gray-400">#</TableHead>
                  <TableHead className="pl-2 pr-2">Họ tên</TableHead>
                  {hasGenerations && <TableHead className="text-right hidden sm:table-cell">Đời</TableHead>}
                  <TableHead className="text-right hidden sm:table-cell">Ngày sinh</TableHead>
                  <TableHead className="text-right hidden sm:table-cell">Ngày mất (ÂL)</TableHead>
                  <TableHead className="pl-2 pr-2"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={100} className="text-center py-12">
                      <p className="text-gray-500 mb-3">Chưa có ai. Thêm người đầu tiên.</p>
                      {canEdit && <Button onClick={() => setShowAddPerson(true)}>+ Thêm người</Button>}
                    </TableCell>
                  </TableRow>
                )}
                {paged.map((p, i) => (
                  <TableRow
                    key={p.id}
                    onClick={() => handleMemberRowClick(p)}
                    className={`group ${selectedPerson?.id === p.id ? "bg-brand-50 ring-1 ring-inset ring-brand-200 hover:bg-brand-50" : ""}`}
                  >
                    <TableCell className="pl-2 pr-1 py-3 text-right text-xs text-gray-400 w-8">
                      {(safePage - 1) * pageSize + i + 1}
                    </TableCell>
                    <TableCell className="pl-2 pr-2 py-3">
                      <div className="flex items-center gap-3">
                        <span className="shrink-0">
                          <Avatar person={p} size="table" isFirstChild={p.childOrder === 1} />
                        </span>
                        <div className="flex flex-col min-w-0">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span className={`font-medium ${selectedPerson?.id === p.id ? "text-brand-600 font-bold" : ""}`}>
                              {fullName(p)}
                            </span>
                            <OutsiderBadge label={outsiderLabel(p)} />
                            {p.id === superAdminId && (
                              <span title="Tài khoản Super Admin" className="text-xs px-1.5 py-0.5 bg-brand-100 text-brand-700 rounded font-medium">
                                SA
                              </span>
                            )}
                          </div>
                          {p.generation != null && (
                            <span className="text-xs text-gray-500 sm:hidden">Đời {p.generation}</span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    {hasGenerations && (
                      <TableCell className="text-gray-600 text-right hidden sm:table-cell">
                        {p.generation != null ? `Đời ${p.generation}` : "—"}
                      </TableCell>
                    )}
                    <TableCell className="text-gray-600 text-right hidden sm:table-cell">{dateOf(p.birthDate)}</TableCell>
                    <TableCell className="text-gray-600 text-right hidden sm:table-cell">{dateOf(p.deathDateLunar)}</TableCell>
                    <TableCell className="pl-2 pr-2 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-1.5 justify-end items-center">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/tree?selected=${p.id}`} className="flex items-center gap-1.5">
                                <Network size={14} /><span className="hidden sm:inline">Xem cây</span>
                              </Link>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Xem người này trong cây tổng thể</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/tree?selected=${p.id}&root=${p.id}`} className="flex items-center gap-1.5">
                                <User size={14} /><span className="hidden sm:inline">Xem cây từ đây</span>
                              </Link>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Người này là điểm khởi đầu trong cây</TooltipContent>
                        </Tooltip>
                        {canEditPerson(p.id) && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" disabled={deletingId === p.id}>
                                {deletingId === p.id
                                  ? <Loader2 size={16} className="animate-spin" />
                                  : <MoreHorizontal size={16} />}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setEditTarget(p)} className="flex items-center gap-2">
                                <Pencil size={15} /> Sửa
                              </DropdownMenuItem>
                              {canDeletePerson(p.id) && p.id !== superAdminId && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleDelete(p.id)}
                                    className="flex items-center gap-2 text-destructive focus:text-destructive"
                                  >
                                    <Trash2 size={15} /> Xoá
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
                <span>Tổng {filtered.length} người · Trang {safePage}/{totalPages}</span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={safePage === 1}
                    className="gap-1"
                  >
                    <ChevronLeft size={14} />Trước
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={safePage === totalPages}
                    className="gap-1"
                  >
                    Sau<ChevronRight size={14} />
                  </Button>
                </div>
              </div>
            )}
          </>
        </TabsContent>

        {/* ── Families tab ── */}
        <TabsContent value="families">
          <>
            {families.length === 0 ? (
              <div className="text-center py-16">
                <Users size={48} className="mx-auto text-gray-200 mb-4" />
                <p className="text-gray-400">Chưa có gia đình nào.</p>
                <p className="text-sm text-gray-400 mt-1">Thêm người và kết nối cặp vợ chồng để hiển thị ở đây.</p>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-400 mb-4">{families.length} gia đình</p>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {families.map((f) => (
                    <FamilyCard
                      key={f.id}
                      family={f}
                      selectedPersonId={selectedPerson?.id}
                      onSelectPerson={(p) => setSelectedPerson(selectedPerson?.id === p.id ? null : p)}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        </TabsContent>

        {/* ── Events tab ── */}
        <TabsContent value="events">
          <>
            <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1 scrollbar-none">
              {(["all", "birthday", "anniversary"] as EventFilter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setEventFilter(f)}
                  className={`px-3.5 py-1 text-[0.875rem] font-medium rounded-full border transition-colors shrink-0 ${
                    eventFilter === f
                      ? "bg-brand-500 text-white border-brand-500"
                      : "bg-white text-gray-600 border-border hover:border-gray-400"
                  }`}
                >
                  {f === "all" ? "Tất cả" : f === "birthday" ? "Sinh nhật" : "Giỗ"}
                </button>
              ))}
            </div>

            {filteredEvents.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-400">Không có sự kiện nào.</p>
                <p className="text-sm text-gray-400 mt-1">Thêm ngày sinh hoặc ngày mất để hiển thị ở đây.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {filteredEvents.map((ev) => {
                  const isSelected = selectedPerson?.id === ev.person.id;
                  return (
                    <div
                      key={`${ev.person.id}-${ev.category}`}
                      onClick={() => setSelectedPerson(isSelected ? null : ev.person)}
                      className={`flex items-center gap-3 px-4 py-3 border rounded-xl transition-colors cursor-default ${
                        isSelected
                          ? "bg-brand-50 ring-1 ring-inset ring-brand-200 hover:bg-brand-50"
                          : "bg-white hover:bg-muted/50"
                      }`}
                    >
                      <Avatar person={ev.person} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`font-medium truncate ${isSelected ? "text-brand-600 font-bold" : ""}`}>{fullName(ev.person)}</span>
                          {ev.person.generation != null && (
                            <span className="text-xs px-1.5 py-0.5 bg-brand-100 text-brand-600 rounded font-medium shrink-0">
                              Đời {ev.person.generation}
                            </span>
                          )}
                          <span className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded font-medium shrink-0 ${
                            ev.category === "birthday"
                              ? "bg-blue-50 text-blue-600"
                              : "bg-orange-50 text-orange-600"
                          }`}>
                            {ev.category === "birthday"
                              ? <><Cake size={11} /> Sinh nhật</>
                              : <><Flame size={11} /> Giỗ</>}
                          </span>
                        </div>
                        <span className="text-xs text-gray-400">{ev.displayDate}</span>
                      </div>
                      <div className="text-right shrink-0">
                        {ev.daysUntil === 0 ? (
                          <span className="text-sm font-semibold text-brand-500">Hôm nay</span>
                        ) : ev.daysUntil === 1 ? (
                          <span className="text-sm font-medium text-amber-500">Ngày mai</span>
                        ) : ev.daysUntil <= 7 ? (
                          <span className="text-sm font-medium text-amber-400">{ev.daysUntil} ngày</span>
                        ) : (
                          <span className="text-sm text-gray-400">{ev.daysUntil} ngày</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        </TabsContent>

      </Tabs>
      </main>

      <div className="hidden sm:flex shrink-0">
        {selectedPerson ? (
          <PersonSidebar
            person={selectedPerson}
            allPersons={persons}
            relationships={relationships}
            marriages={marriages}
            superAdminId={superAdminId}
            onClose={handleSidebarClose}
            onEdit={(p) => setEditTarget(p)}
            onDelete={handleSidebarDelete}
            onAddParent={handleAddParent}
            onAddChild={handleAddChild}
            onAddSpouse={handleAddSpouse}
            onCreateAndAddParent={() => {}}
            onCreateAndAddChild={() => {}}
            onCreateAndAddSpouse={() => {}}
            onRemoveParent={handleRemoveParent}
            onRemoveChild={handleRemoveChild}
            onRemoveSpouse={handleRemoveSpouse}
            rootPersonId={null}
            onSetRoot={(id) => id && router.push(`/tree?selected=${id}&root=${id}`)}
            isMutating={isMutating}
            canEdit={canEditPerson(selectedPerson?.id)}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
          />
        ) : (
          <div
            className={`h-full border-l bg-white flex flex-col transition-[width,background-color] duration-200 ${sidebarCollapsed ? "w-8 bg-gray-200 cursor-pointer sm:overflow-hidden" : "w-72"}`}
            onClick={sidebarCollapsed ? () => setSidebarCollapsed(false) : undefined}
          >
            <div className={`flex items-center border-b shrink-0 ${sidebarCollapsed ? "flex-col py-3 px-0 justify-center gap-2" : "px-4 py-3 justify-between"}`}>
              {!sidebarCollapsed && <span className="font-semibold text-sm">Thông tin cá nhân</span>}
              <button
                onClick={(e) => { e.stopPropagation(); setSidebarCollapsed((v) => !v); }}
                className={`h-8 w-8 shrink-0 flex items-center justify-center rounded-md ${sidebarCollapsed ? "text-gray-600 hover:text-gray-800" : "text-gray-400 hover:text-gray-600"}`}
              >
                <ChevronRight size={16} className={`transition-transform duration-200 ${sidebarCollapsed ? "rotate-180" : ""}`} />
              </button>
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 flex items-center justify-center px-6">
                <div className="flex flex-col items-center gap-2 text-center">
                  <Info size={20} className="text-gray-300" />
                  <p className="text-sm text-gray-400 leading-relaxed">Bấm chọn một người trong danh sách để xem thông tin cá nhân.</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <PersonDialog
        open={showAddPerson}
        onOpenChange={setShowAddPerson}
        title="Thêm người"
        onSubmit={handleAdd}
      />
      <PersonDialog
        open={editTarget !== null}
        onOpenChange={(open) => { if (!open) setEditTarget(null); }}
        title="Sửa thông tin"
        initial={editTarget ?? undefined}
        onSubmit={handleEdit}
      />

    </div>
  );
}
