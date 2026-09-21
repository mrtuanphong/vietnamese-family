"use client";

import { useState, useEffect } from "react";
import { ChevronRight, X, User, Network, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAccess } from "@/lib/AccessContext";
import type { Person, Relationship, Marriage } from "@/types";

const NEW_PERSON_SENTINEL = "__new__";

type PendingRemoval =
  | { type: "parent"; relId: string; name: string }
  | { type: "spouse"; marriageId: string; name: string }
  | { type: "child"; relId: string; name: string };

interface PersonSidebarProps {
  person: Person;
  allPersons: Person[];
  relationships: Relationship[];
  marriages: Marriage[];
  superAdminId: string | null;
  onClose: () => void;
  onEdit: (p: Person) => void;
  onDelete: (id: string) => void;
  onAddParent: (parentId: string, childId: string) => void;
  onAddChild: (parentId: string, childId: string) => void;
  onAddSpouse: (spouse1Id: string, spouse2Id: string) => void;
  onCreateAndAddParent: (childId: string) => void;
  onCreateAndAddChild: (parentId: string) => void;
  onCreateAndAddSpouse: (personId: string) => void;
  onRemoveParent: (relationshipId: string) => void;
  onRemoveChild: (relationshipId: string) => void;
  onRemoveSpouse: (marriageId: string) => void;
  rootPersonId?: string | null;
  onSetRoot: (id: string | null) => void;
  isMutating?: boolean;
  canEdit?: boolean;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

function fullName(p: Person) {
  return [p.lastName || "—", p.middleName, p.firstName].filter(Boolean).join(" ");
}

export default function PersonSidebar({
  person,
  allPersons,
  relationships,
  marriages,
  superAdminId,
  onClose,
  onEdit,
  onDelete,
  onAddParent,
  onAddChild,
  onAddSpouse,
  onCreateAndAddParent,
  onCreateAndAddChild,
  onCreateAndAddSpouse,
  onRemoveParent,
  onRemoveChild,
  onRemoveSpouse,
  rootPersonId,
  onSetRoot,
  isMutating = false,
  canEdit = true,
  collapsed: collapsedProp,
  onToggleCollapse,
}: PersonSidebarProps) {
  const { canDeletePerson } = useAccess();
  const isSuperAdmin = person.id === superAdminId;
  const personMap = new Map(allPersons.map((p) => [p.id, p]));

  const [collapsedInternal, setCollapsedInternal] = useState(false);
  const collapsed = collapsedProp ?? collapsedInternal;
  const toggleCollapsed = onToggleCollapse ?? (() => setCollapsedInternal((v) => !v));
  const [addParentSel, setAddParentSel] = useState("");
  const [addSpouseSel, setAddSpouseSel] = useState("");
  const [addChildSel, setAddChildSel] = useState("");
  const [pending, setPending] = useState<PendingRemoval | null>(null);

  useEffect(() => {
    setAddParentSel("");
    setAddSpouseSel("");
    setAddChildSel("");
  }, [person.id]);

  const parents = relationships
    .filter((r) => r.childId === person.id)
    .flatMap((r) => {
      const p = personMap.get(r.parentId);
      return p ? [{ relId: r.id, person: p }] : [];
    });

  const children = relationships
    .filter((r) => r.parentId === person.id)
    .flatMap((r) => {
      const p = personMap.get(r.childId);
      return p ? [{ relId: r.id, person: p }] : [];
    });

  const spouses = marriages
    .filter((m) => m.spouse1Id === person.id || m.spouse2Id === person.id)
    .flatMap((m) => {
      const otherId = m.spouse1Id === person.id ? m.spouse2Id : m.spouse1Id;
      const p = personMap.get(otherId);
      return p ? [{ marriageId: m.id, person: p }] : [];
    });

  const unrelated = allPersons
    .filter(
      (p) =>
        p.id !== person.id &&
        !parents.find((x) => x.person.id === p.id) &&
        !children.find((x) => x.person.id === p.id) &&
        !spouses.find((x) => x.person.id === p.id)
    )
    .sort((a, b) => (a.firstName ?? "").localeCompare(b.firstName ?? "", "vi"));

  const handleAddParent = (val: string) => {
    setAddParentSel("");
    if (!val) return;
    if (val === NEW_PERSON_SENTINEL) { onCreateAndAddParent(person.id); return; }
    onAddParent(val, person.id);
  };

  const handleAddSpouse = (val: string) => {
    setAddSpouseSel("");
    if (!val) return;
    if (val === NEW_PERSON_SENTINEL) { onCreateAndAddSpouse(person.id); return; }
    onAddSpouse(person.id, val);
  };

  const handleAddChild = (val: string) => {
    setAddChildSel("");
    if (!val) return;
    if (val === NEW_PERSON_SENTINEL) { onCreateAndAddChild(person.id); return; }
    onAddChild(person.id, val);
  };

  const confirmRemoval = () => {
    if (!pending) return;
    if (pending.type === "parent") onRemoveParent(pending.relId);
    else if (pending.type === "spouse") onRemoveSpouse(pending.marriageId);
    else if (pending.type === "child") onRemoveChild(pending.relId);
    setPending(null);
  };

  const relationshipLabel = pending
    ? pending.type === "parent" ? "cha/mẹ"
    : pending.type === "spouse" ? "vợ/chồng"
    : "con cái"
    : "";

  return (
    <>
      <AlertDialog open={!!pending} onOpenChange={(open) => { if (!open) setPending(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xoá quan hệ?</AlertDialogTitle>
            <AlertDialogDescription>
              Xoá quan hệ {relationshipLabel} với {pending?.name}? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemoval} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Xoá
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div
        className={`fixed bottom-16 left-0 right-0 z-20 max-h-[65vh] rounded-t-2xl shadow-2xl sm:static sm:bottom-auto sm:max-h-none sm:h-full sm:z-auto sm:rounded-none sm:shadow-none border-t sm:border-t-0 sm:border-l flex flex-col overflow-y-auto transition-[width,background-color] duration-200 ${collapsed ? "sm:w-8 sm:bg-gray-200 sm:cursor-pointer sm:overflow-hidden" : "sm:w-72 bg-white"}`}
        onClick={collapsed ? toggleCollapsed : undefined}
      >
        <div className={`flex items-center border-b ${collapsed ? "sm:flex-col sm:py-3 sm:px-0 sm:justify-center sm:gap-2 px-4 py-3 justify-between" : "px-4 py-3 justify-between"}`}>
          {!collapsed && (
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">Thông tin cá nhân</span>
              {isMutating && <Loader2 size={13} className="animate-spin text-gray-400" />}
            </div>
          )}
          {collapsed && isMutating && <Loader2 size={13} className="animate-spin text-gray-400 hidden sm:block" />}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleCollapsed}
            className={`h-8 w-8 shrink-0 ${collapsed ? "text-gray-600 hover:text-gray-800" : "text-gray-400 hover:text-gray-600"}`}
          >
            <ChevronRight size={16} className={`transition-transform duration-200 ${collapsed ? "rotate-180" : ""}`} />
          </Button>
        </div>

        <div className={`${collapsed ? "sm:hidden" : ""} p-4 flex flex-col items-center gap-2 border-b`}>
          <span className={`w-[72px] h-[72px] rounded-full flex items-center justify-center shrink-0 ${
            person.gender === "female" ? "bg-pink-100 text-pink-400"
            : person.gender === "male" ? "bg-gray-100 text-gray-500"
            : "bg-gray-100 text-gray-400"
          }`}>
            <User size={32} />
          </span>
          <div className="flex items-center justify-center gap-1.5 flex-wrap">
            <p className="font-bold text-center">{fullName(person)}</p>
            {isSuperAdmin && (
              <span title="Tài khoản Super Admin" className="text-xs px-1.5 py-0.5 bg-brand-100 text-brand-700 rounded-full font-medium shrink-0">
                SA
              </span>
            )}
            {person.isClanMember === false && (
              <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded font-medium shrink-0">
                {person.gender === "female" ? "Dâu" : person.gender === "male" ? "Rể" : "Dâu/Rể"}
              </span>
            )}
          </div>
          {person.generation != null && (
            <div className="flex items-center gap-1.5 flex-wrap justify-center">
              <span className="text-xs px-2 py-0.5 bg-brand-100 text-brand-600 rounded-full font-medium">
                Đời {person.generation}
              </span>
            </div>
          )}
          <p className="text-xs text-gray-500">
            {person.gender === "male" ? "Nam" : person.gender === "female" ? "Nữ" : "Không rõ"}
          </p>
          <button
            onClick={() => onSetRoot(rootPersonId === person.id ? null : person.id)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-gray-200 text-gray-500 hover:border-brand-300 hover:text-brand-600 hover:bg-brand-50 transition-colors"
          >
            <Network size={12} />
            {rootPersonId === person.id ? "Xem toàn bộ" : "Xem cây từ đây"}
          </button>
          {person.birthDate && (
            <p className="text-xs text-gray-500">
              Sinh: {(() => { const [y, m, d] = person.birthDate.split("-"); return `${d ?? "—"}/${m ?? "—"}/${y === "0001" ? "?" : (y ?? "—")}`; })()} (Dương lịch)
            </p>
          )}
        </div>

        <div className={collapsed ? "sm:hidden" : ""}>

        {person.currentAddress && (
          <div className="px-4 py-3 border-b">
            <p className="text-xs text-gray-500 font-medium mb-1">Địa chỉ thường trú</p>
            <p className="text-gray-700 text-sm">{person.currentAddress}</p>
          </div>
        )}

        {person.bio && (
          <div className="px-4 py-3 border-b">
            <p className="text-xs text-gray-500 font-medium mb-1">Tiểu sử</p>
            <p className="text-gray-700 leading-relaxed">{person.bio}</p>
          </div>
        )}

        <div className="px-4 py-3 border-b">
          <p className="text-xs text-gray-500 font-medium mb-2">Cha/Mẹ</p>
          {parents.length === 0 ? <p className="text-xs text-gray-400">Chưa có</p> : (
            <ul className="space-y-1">
              {parents.map(({ relId, person: p }) => (
                <li key={relId} className="flex items-center justify-between gap-2">
                  <span className="text-sm">{fullName(p)}</span>
                  {canEdit && <Button variant="ghost" size="icon" onClick={() => setPending({ type: "parent", relId, name: fullName(p) })} disabled={isMutating} className="h-5 w-5 shrink-0 text-gray-400 hover:text-red-500" title="Xoá quan hệ"><X size={12} /></Button>}
                </li>
              ))}
            </ul>
          )}
          {canEdit && <Select value={addParentSel} onValueChange={handleAddParent} disabled={isMutating}>
            <SelectTrigger size="sm" className="mt-2 w-full text-xs">
              <SelectValue placeholder="+ Thêm cha/mẹ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NEW_PERSON_SENTINEL}>✦ Tạo người mới...</SelectItem>
              {unrelated.length > 0 && <SelectSeparator />}
              {unrelated.map((p) => <SelectItem key={p.id} value={p.id}>{p.firstName} - {fullName(p)}</SelectItem>)}
            </SelectContent>
          </Select>}
        </div>

        <div className="px-4 py-3 border-b">
          <p className="text-xs text-gray-500 font-medium mb-2">Vợ/Chồng</p>
          {spouses.length === 0 ? <p className="text-xs text-gray-400">Chưa có</p> : (
            <ul className="space-y-1">
              {spouses.map(({ marriageId, person: p }) => (
                <li key={marriageId} className="flex items-center justify-between gap-2">
                  <span className="text-sm">{fullName(p)}</span>
                  {canEdit && <Button variant="ghost" size="icon" onClick={() => setPending({ type: "spouse", marriageId, name: fullName(p) })} disabled={isMutating} className="h-5 w-5 shrink-0 text-gray-400 hover:text-red-500" title="Xoá quan hệ"><X size={12} /></Button>}
                </li>
              ))}
            </ul>
          )}
          {canEdit && <Select value={addSpouseSel} onValueChange={handleAddSpouse} disabled={isMutating}>
            <SelectTrigger size="sm" className="mt-2 w-full text-xs">
              <SelectValue placeholder="+ Thêm vợ/chồng" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NEW_PERSON_SENTINEL}>✦ Tạo người mới...</SelectItem>
              {unrelated.length > 0 && <SelectSeparator />}
              {unrelated.map((p) => <SelectItem key={p.id} value={p.id}>{p.firstName} - {fullName(p)}</SelectItem>)}
            </SelectContent>
          </Select>}
        </div>

        <div className="px-4 py-3 border-b">
          <p className="text-xs text-gray-500 font-medium mb-2">Con cái</p>
          {children.length === 0 ? <p className="text-xs text-gray-400">Chưa có</p> : (
            <ul className="space-y-1">
              {children.map(({ relId, person: p }) => (
                <li key={relId} className="flex items-center justify-between gap-2">
                  <span className="text-sm">{fullName(p)}</span>
                  {canEdit && <Button variant="ghost" size="icon" onClick={() => setPending({ type: "child", relId, name: fullName(p) })} disabled={isMutating} className="h-5 w-5 shrink-0 text-gray-400 hover:text-red-500" title="Xoá quan hệ"><X size={12} /></Button>}
                </li>
              ))}
            </ul>
          )}
          {canEdit && <Select value={addChildSel} onValueChange={handleAddChild} disabled={isMutating}>
            <SelectTrigger size="sm" className="mt-2 w-full text-xs">
              <SelectValue placeholder="+ Thêm con" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NEW_PERSON_SENTINEL}>✦ Tạo người mới...</SelectItem>
              {unrelated.length > 0 && <SelectSeparator />}
              {unrelated.map((p) => <SelectItem key={p.id} value={p.id}>{p.firstName} - {fullName(p)}</SelectItem>)}
            </SelectContent>
          </Select>}
        </div>

        {canEdit && (
          <div className="px-4 py-3 flex gap-2 mt-auto">
            <Button variant="outline" size="sm" className="flex-1" onClick={() => onEdit(person)} disabled={isMutating}>
              Sửa
            </Button>
            {!isSuperAdmin && canDeletePerson(person.id) && (
              <Button variant="destructive" size="sm" onClick={() => onDelete(person.id)} disabled={isMutating}>
                Xoá
              </Button>
            )}
          </div>
        )}

        </div>{/* end collapsed wrapper */}
      </div>
    </>
  );
}
