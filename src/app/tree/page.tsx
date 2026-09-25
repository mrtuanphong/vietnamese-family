"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { X, Loader2, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { personsApi, relationshipsApi, marriagesApi, clanApi } from "@/lib/api";
import PersonSidebar from "@/components/tree/PersonSidebar";
import TreeOutline from "@/components/tree/TreeOutline";
import PersonDialog from "@/components/person/PersonDialog";
import { useAccess } from "@/lib/AccessContext";
import type { Person, Relationship, Marriage } from "@/types";

type PendingRelation = { type: "spouse" | "child" | "parent"; anchorId: string };

function TreePageContent() {
  const searchParams = useSearchParams();
  const urlSelectedId = searchParams.get("selected");
  const urlRootId = searchParams.get("root");

  const [persons, setPersons] = useState<Person[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [marriages, setMarriages] = useState<Marriage[]>([]);
  const [selected, setSelected] = useState<Person | null>(null);
  const [editTarget, setEditTarget] = useState<Person | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [superAdminId, setSuperAdminId] = useState<string | null>(null);
  const [pendingRelation, setPendingRelation] = useState<PendingRelation | null>(null);
  const [rootPersonId, setRootPersonId] = useState<string | null>(null);
  const rootPersonIdRef = useRef<string | null>(null);
  const [isMutating, setIsMutating] = useState(false);
  const [outlineSearch, setOutlineSearch] = useState("");
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const { canEditPerson } = useAccess();

  const mutate = async (loadingMsg: string, successMsg: string, fn: () => Promise<void>) => {
    setIsMutating(true);
    const tid = toast.loading(loadingMsg);
    try {
      await fn();
      toast.success(successMsg, { id: tid });
    } catch {
      toast.error("Có lỗi xảy ra", { id: tid });
    } finally {
      setIsMutating(false);
    }
  };

  const load = async () => {
    const [p, r, m] = await Promise.all([
      personsApi.getAll(),
      relationshipsApi.getAll(),
      marriagesApi.getAll(),
    ]);
    setPersons(p);
    setRelationships(r);
    setMarriages(m);
    return { p, r, m };
  };

  useEffect(() => {
    Promise.all([load(), clanApi.get()]).then(([{ p }, clan]) => {
      const adminId = clan?.superAdminId ?? null;
      if (adminId) setSuperAdminId(adminId);
      const preselect = urlSelectedId ? p.find((x) => x.id === urlSelectedId) ?? null : null;
      if (preselect) {
        setSelected(preselect);
        setHighlightId(preselect.id);
      }
      if (urlRootId) {
        rootPersonIdRef.current = urlRootId;
        setRootPersonId(urlRootId);
      }
    }).finally(() => {
      setLoading(false);
    });
  }, [urlSelectedId, urlRootId]);

  const refresh = async (keepSelected?: Person | null) => {
    const { p } = await load();
    if (keepSelected) {
      const fresh = p.find((x) => x.id === keepSelected.id);
      setSelected(fresh ?? null);
      setHighlightId(fresh?.id ?? null);
    }
  };

  const handleSetRoot = (id: string | null) => {
    rootPersonIdRef.current = id;
    setRootPersonId(id);
    const rootPerson = id ? (persons.find((p) => p.id === id) ?? null) : null;
    if (window.innerWidth >= 640) setSelected(rootPerson);
    else setSelected(null);
    setHighlightId(id);
  };

  const handleAddPerson = async (data: Omit<Person, "id">) =>
    mutate("Đang thêm người...", "Đã thêm người", async () => {
      await personsApi.create(data);
      await refresh();
    });

  const handleCreateAndLink = async (data: Omit<Person, "id">) => {
    if (!pendingRelation) return;
    const labels: Record<string, string> = { spouse: "vợ/chồng", child: "con", parent: "cha/mẹ" };
    return mutate(`Đang thêm ${labels[pendingRelation.type]}...`, `Đã thêm ${labels[pendingRelation.type]}`, async () => {
      const newPerson = await personsApi.create(data);
      if (pendingRelation.type === "spouse") {
        await marriagesApi.create({ spouse1Id: pendingRelation.anchorId, spouse2Id: newPerson.id });
      } else if (pendingRelation.type === "child") {
        await relationshipsApi.create({ parentId: pendingRelation.anchorId, childId: newPerson.id });
      } else {
        await relationshipsApi.create({ parentId: newPerson.id, childId: pendingRelation.anchorId });
      }
      setPendingRelation(null);
      await refresh(selected);
    });
  };

  const handleAddParent = (parentId: string, childId: string) =>
    mutate("Đang thêm cha/mẹ...", "Đã thêm cha/mẹ", async () => {
      await relationshipsApi.create({ parentId, childId });
      await refresh(selected);
    });

  const handleEditPerson = async (data: Omit<Person, "id">) => {
    if (!editTarget) return;
    return mutate("Đang lưu...", "Đã lưu", async () => {
      await personsApi.update(editTarget.id, data);
      await refresh(editTarget);
    });
  };

  const handleDeletePerson = async (id: string) => {
    const person = persons.find((p) => p.id === id);
    const name = person ? [person.lastName || "—", person.firstName].filter(Boolean).join(" ") : "người này";
    if (!confirm(`Xoá "${name}" khỏi dòng họ?`)) return;
    await mutate("Đang xoá...", `Đã xoá ${name}`, async () => {
      await personsApi.delete(id);
      setSelected(null);
      await refresh();
    });
  };

  const handleAddChild = (parentId: string, childId: string) =>
    mutate("Đang thêm con...", "Đã thêm con", async () => {
      await relationshipsApi.create({ parentId, childId });
      await refresh(selected);
    });

  const handleAddSpouse = (spouse1Id: string, spouse2Id: string) =>
    mutate("Đang thêm vợ/chồng...", "Đã thêm vợ/chồng", async () => {
      await marriagesApi.create({ spouse1Id, spouse2Id });
      await refresh(selected);
    });

  const handleRemoveParent = (relationshipId: string) =>
    mutate("Đang xoá quan hệ...", "Đã xoá", async () => {
      await relationshipsApi.delete(relationshipId);
      await refresh(selected);
    });

  const handleRemoveChild = (relationshipId: string) =>
    mutate("Đang xoá quan hệ...", "Đã xoá", async () => {
      await relationshipsApi.delete(relationshipId);
      await refresh(selected);
    });

  const handleRemoveSpouse = (marriageId: string) =>
    mutate("Đang xoá quan hệ...", "Đã xoá", async () => {
      await marriagesApi.delete(marriageId);
      await refresh(selected);
    });

  const modalTitle = pendingRelation
    ? pendingRelation.type === "spouse"
      ? "Thêm vợ/chồng mới"
      : pendingRelation.type === "child"
      ? "Thêm con mới"
      : "Thêm cha/mẹ mới"
    : "Thêm người";

  const defaultLastName = pendingRelation?.type === "child" || pendingRelation?.type === "parent"
    ? persons.find((p) => p.id === pendingRelation.anchorId)?.lastName
    : pendingRelation?.type === "spouse"
    ? undefined
    : persons[persons.length - 1]?.lastName;

  const defaultGender = pendingRelation?.type === "spouse"
    ? (persons.find((p) => p.id === pendingRelation.anchorId)?.gender === "male" ? "female" : "male")
    : undefined;

  const rootPerson = rootPersonId ? persons.find((p) => p.id === rootPersonId) : null;
  const rootPersonName = rootPerson
    ? [rootPerson.lastName || "—", rootPerson.middleName, rootPerson.firstName].filter(Boolean).join(" ")
    : "";

  if (loading) {
    return (
      <div className="flex-1 bg-white flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
          <p className="text-xs sm:text-sm font-medium text-slate-500">
            Đang tải cây phả hệ...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 bg-white overflow-hidden">
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Banner khi đang lọc xem theo một nhánh cây cụ thể */}
        {rootPersonId && (
          <div className="bg-teal-50 border-b border-teal-200 px-4 py-2 flex items-center justify-between text-xs text-teal-800 shrink-0">
            <div className="flex items-center gap-2">
              <span>Đang xem cây phả hệ từ nhánh: <strong>{rootPersonName}</strong></span>
              {isMutating && <Loader2 size={13} className="animate-spin text-teal-600" />}
            </div>
            <button
              onClick={() => handleSetRoot(null)}
              className="text-xs font-semibold text-teal-700 hover:text-teal-900 underline flex items-center gap-1 cursor-pointer"
            >
              <X size={12} />
              <span>Xem toàn bộ dòng họ</span>
            </button>
          </div>
        )}

        {/* Cây gia phả dạng danh sách phân cấp trực quan */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <TreeOutline
            persons={persons}
            relationships={relationships}
            marriages={marriages}
            rootPersonId={rootPersonId}
            selectedId={highlightId ?? selected?.id ?? null}
            superAdminId={superAdminId}
            search={outlineSearch}
            onSearchChange={setOutlineSearch}
            onSelect={(person) => {
              setHighlightId(person.id);
              if (window.innerWidth >= 640) setSelected(person);
            }}
            onSetRoot={handleSetRoot}
            initialExpandSelected={!!urlSelectedId}
          />
        </div>
      </div>

      {selected && (
        <div
          className="fixed inset-0 bg-black/30 z-10 sm:hidden"
          onClick={() => setSelected(null)}
        />
      )}

      {/* Sidebar thông tin thành viên chi tiết */}
      <div className="hidden sm:flex shrink-0">
        {selected ? (
          <PersonSidebar
            person={selected}
            allPersons={persons}
            relationships={relationships}
            marriages={marriages}
            superAdminId={superAdminId}
            rootPersonId={rootPersonId}
            onClose={() => setSelected(null)}
            onEdit={(p) => setEditTarget(p)}
            onDelete={handleDeletePerson}
            onAddParent={handleAddParent}
            onAddChild={handleAddChild}
            onAddSpouse={handleAddSpouse}
            onCreateAndAddParent={(childId) => setPendingRelation({ type: "parent", anchorId: childId })}
            onCreateAndAddSpouse={(anchorId) => setPendingRelation({ type: "spouse", anchorId })}
            onCreateAndAddChild={(anchorId) => setPendingRelation({ type: "child", anchorId })}
            onRemoveParent={handleRemoveParent}
            onRemoveChild={handleRemoveChild}
            onRemoveSpouse={handleRemoveSpouse}
            onSetRoot={handleSetRoot}
            isMutating={isMutating}
            canEdit={canEditPerson(selected?.id)}
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
                  <p className="text-sm text-gray-400 leading-relaxed">Bấm chọn một người trong danh sách để xem thông tin chi tiết.</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <PersonDialog
        open={showAdd}
        onOpenChange={(open) => { if (!open) setShowAdd(false); }}
        title="Thêm người"
        defaultLastName={persons[persons.length - 1]?.lastName}
        onSubmit={handleAddPerson}
      />

      <PersonDialog
        open={!!editTarget}
        onOpenChange={(open) => { if (!open) setEditTarget(null); }}
        title="Sửa thông tin"
        initial={editTarget ?? undefined}
        onSubmit={handleEditPerson}
      />

      <PersonDialog
        open={!!pendingRelation}
        onOpenChange={(open) => { if (!open) setPendingRelation(null); }}
        title={modalTitle}
        defaultLastName={defaultLastName}
        initial={defaultGender ? { gender: defaultGender } : undefined}
        onSubmit={handleCreateAndLink}
      />
    </div>
  );
}

export default function TreePage() {
  return (
    <Suspense>
      <TreePageContent />
    </Suspense>
  );
}
