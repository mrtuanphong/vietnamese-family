"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { Plus, Minus, Heart, Star, User } from "lucide-react";
import LotusIcon from "@/components/icons/LotusIcon";
import { Input } from "@/components/ui/input";
import type { Person, Relationship, Marriage } from "@/types";

interface OutlineNode {
  person: Person;
  spouses: Person[];
  children: OutlineNode[];
}

function buildForest(
  persons: Person[],
  relationships: Relationship[],
  marriages: Marriage[],
  rootPersonId: string | null
): OutlineNode[] {
  const personMap = new Map(persons.map((p) => [p.id, p]));
  const visited = new Set<string>();

  function buildNode(id: string): OutlineNode | null {
    if (visited.has(id)) return null;
    visited.add(id);
    const person = personMap.get(id);
    if (!person) return null;

    const spouseIds = marriages
      .filter((m) => m.spouse1Id === id || m.spouse2Id === id)
      .map((m) => (m.spouse1Id === id ? m.spouse2Id : m.spouse1Id))
      .filter((sid) => !visited.has(sid));
    spouseIds.forEach((sid) => visited.add(sid));
    const spouses = spouseIds.map((sid) => personMap.get(sid)).filter(Boolean) as Person[];

    const childIds = relationships.filter((r) => r.parentId === id).map((r) => r.childId);
    const children = (childIds.map((cid) => buildNode(cid)).filter(Boolean) as OutlineNode[])
      .sort((a, b) => {
        const ao = a.person.childOrder ?? 999;
        const bo = b.person.childOrder ?? 999;
        if (ao !== bo) return ao - bo;
        return (a.person.generation ?? 0) - (b.person.generation ?? 0);
      });

    return { person, spouses, children };
  }

  if (rootPersonId) {
    const root = buildNode(rootPersonId);
    return root ? [root] : [];
  }

  const childIdSet = new Set(relationships.map((r) => r.childId));
  const rootIds = persons
    .filter((p) => !childIdSet.has(p.id))
    .sort((a, b) => (a.generation ?? 0) - (b.generation ?? 0))
    .map((p) => p.id);
  return rootIds.map((id) => buildNode(id)).filter(Boolean) as OutlineNode[];
}

function collectAllIds(nodes: OutlineNode[]): string[] {
  const ids: string[] = [];
  function visit(ns: OutlineNode[]) {
    for (const n of ns) {
      ids.push(n.person.id);
      visit(n.children);
    }
  }
  visit(nodes);
  return ids;
}

function personName(p: Person) {
  return [p.lastName || "—", p.middleName, p.firstName].filter(Boolean).join(" ").toLowerCase();
}

function hasDescendantMatch(node: OutlineNode, search: string): boolean {
  const q = search.toLowerCase();
  function check(ns: OutlineNode[]): boolean {
    for (const n of ns) {
      if (personName(n.person).includes(q)) return true;
      if (n.spouses.some((s) => personName(s).includes(q))) return true;
      if (check(n.children)) return true;
    }
    return false;
  }
  return check(node.children);
}

function collectIdsUpToDepth(nodes: OutlineNode[], maxDepth: number, depth = 0): string[] {
  if (depth >= maxDepth) return [];
  const ids: string[] = [];
  for (const n of nodes) {
    ids.push(n.person.id);
    ids.push(...collectIdsUpToDepth(n.children, maxDepth, depth + 1));
  }
  return ids;
}

function findAncestorPath(nodes: OutlineNode[], targetId: string): string[] {
  for (const node of nodes) {
    if (node.person.id === targetId || node.spouses.some((s) => s.id === targetId)) {
      return [node.person.id];
    }
    const childPath = findAncestorPath(node.children, targetId);
    if (childPath.length > 0) return [node.person.id, ...childPath];
  }
  return [];
}

function collectSubtreeIds(nodes: OutlineNode[], targetId: string): string[] {
  for (const node of nodes) {
    if (node.person.id === targetId || node.spouses.some((s) => s.id === targetId)) {
      return collectAllIds([node]);
    }
    const result = collectSubtreeIds(node.children, targetId);
    if (result.length > 0) return result;
  }
  return [];
}

function MiniAvatar({ person }: { person: Person }) {
  const deceased = !!person.deathDateLunar;
  const color =
    person.gender === "female" ? "bg-pink-100 text-pink-400" : "bg-gray-100 text-gray-500";
  const lotusColor = person.gender === "female" ? "text-pink-800" : "text-gray-800";
  return (
    <div className={`relative shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${color}`}>
      {deceased ? <LotusIcon size={11} className={lotusColor} /> : <User size={11} />}
      {person.childOrder === 1 && (
        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-amber-400 flex items-center justify-center">
          <Star size={6} className="text-white" fill="currentColor" />
        </span>
      )}
    </div>
  );
}

function highlightName(name: string, search: string) {
  if (!search) return <>{name}</>;
  const idx = name.toLowerCase().indexOf(search.toLowerCase());
  if (idx === -1) return <>{name}</>;
  return (
    <>
      {name.slice(0, idx)}
      <mark className="bg-yellow-200 text-inherit rounded-sm not-italic">{name.slice(idx, idx + search.length)}</mark>
      {name.slice(idx + search.length)}
    </>
  );
}

function PersonLabel({
  person,
  superAdminId,
  search = "",
  isSelected = false,
  rowActive = false,
}: {
  person: Person;
  superAdminId: string | null;
  search?: string;
  isSelected?: boolean;
  rowActive?: boolean;
}) {
  const name = [person.lastName || "—", person.middleName, person.firstName].filter(Boolean).join(" ");
  const isMatch = !!search && name.toLowerCase().includes(search.toLowerCase());
  return (
    <span className="flex items-center gap-1 min-w-0">
      <span className={`text-sm font-medium truncate ${isSelected && !rowActive ? "underline underline-offset-2" : ""} ${isMatch && !rowActive ? "bg-yellow-200 rounded-sm px-0.5" : ""}`}>
        {highlightName(name, search)}
      </span>
      {person.generation != null && person.isClanMember !== false && (
        <span className={`text-[10px] px-1 py-0.5 rounded font-medium shrink-0 leading-none ${rowActive ? "bg-white/20 text-white" : "bg-brand-100 text-brand-600"}`}>
          Đời {person.generation}
        </span>
      )}
    </span>
  );
}

function OutlineRow({
  node,
  selectedId,
  superAdminId,
  onSelect,
  expandedIds,
  onToggle,
  search = "",
  depth = 0,
  ancestorIsLast = [],
  isLast = false,
}: {
  node: OutlineNode;
  selectedId: string | null;
  superAdminId: string | null;
  onSelect: (p: Person) => void;
  expandedIds: Set<string>;
  onToggle: (id: string) => void;
  search?: string;
  depth?: number;
  ancestorIsLast?: boolean[];
  isLast?: boolean;
}) {
  const hasChildren = node.children.length > 0;
  const expanded = expandedIds.has(node.person.id);
  const hasHiddenMatch = !expanded && !!search && hasDescendantMatch(node, search);

  const clanSpouse = node.spouses.find((s) => s.isClanMember !== false);
  const showSpouseFirst = node.person.isClanMember === false && !!clanSpouse;
  const primary = showSpouseFirst ? clanSpouse! : node.person;
  const secondary = showSpouseFirst ? node.person : null;
  const remainingSpouses = showSpouseFirst
    ? node.spouses.filter((s) => s.id !== clanSpouse!.id)
    : node.spouses;

  const rowActive = selectedId === node.person.id || node.spouses.some((s) => s.id === selectedId);

  const personChipClass = (pid: string) =>
    `flex items-center gap-1.5 cursor-pointer rounded-md px-1.5 py-0.5 transition-colors ${
      selectedId === pid ? "bg-brand-500 text-white" : "hover:bg-brand-50"
    }`;

  return (
    <div data-person-id={node.person.id} className="relative">
      <div
        className={`flex items-center min-h-[30px] rounded-lg transition-colors ${
          rowActive
            ? "bg-brand-50"
            : hasHiddenMatch
            ? "animate-pulse bg-yellow-100 hover:bg-yellow-50"
            : "hover:bg-slate-50/80"
        }`}
        onDoubleClick={() => {
          onSelect(primary);
          if (hasChildren) onToggle(node.person.id);
        }}
      >
        {/* Render guide columns for depth */}
        {Array.from({ length: depth }).map((_, colIndex) => {
          const isImmediateConnector = colIndex === depth - 1;
          const showAncestorLine = !isImmediateConnector && !ancestorIsLast[colIndex];

          return (
            <div
              key={colIndex}
              className="shrink-0 w-6 self-stretch relative flex items-center justify-center pointer-events-none"
            >
              {/* Vertical line through this column from an active ancestor */}
              {showAncestorLine && (
                <span className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-[1px] bg-slate-300" />
              )}

              {/* Immediate connector column to parent */}
              {isImmediateConnector && (
                <>
                  {/* Top branch: from top of row down to center (50%) */}
                  <span className="absolute left-1/2 -translate-x-1/2 top-0 h-1/2 w-[1px] bg-slate-300" />

                  {/* Bottom branch: continues down to next sibling if NOT last child */}
                  {!isLast && (
                    <span className="absolute left-1/2 -translate-x-1/2 top-1/2 bottom-0 w-[1px] bg-slate-300" />
                  )}

                  {/* Horizontal branch: from line center (12px) to right edge (24px) */}
                  <span className="absolute left-1/2 top-1/2 -translate-y-1/2 right-0 h-[1px] bg-slate-300" />
                </>
              )}
            </div>
          );
        })}

        {/* Toggle / Branch Node icon or Leaf Connector */}
        <div className="shrink-0 w-6 self-stretch relative flex items-center justify-center">
          {/* If node has a parent (depth > 0), line enters from the left to the center */}
          {depth > 0 && (
            <span className="absolute left-0 right-1/2 top-1/2 -translate-y-1/2 h-[1px] bg-slate-300 pointer-events-none" />
          )}

          {hasChildren ? (
            <>
              {/* If expanded, line drops out from center of button down to children */}
              {expanded && (
                <span className="absolute left-1/2 -translate-x-1/2 top-1/2 bottom-0 w-[1px] bg-slate-300 pointer-events-none" />
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggle(node.person.id);
                }}
                className="z-10 w-4 h-4 flex items-center justify-center rounded bg-white text-slate-500 hover:text-brand-600 hover:border-brand-500 border border-slate-300 transition-colors cursor-pointer shadow-2xs"
                title={expanded ? "Thu gọn" : "Mở rộng"}
              >
                {expanded ? (
                  <Minus size={10} strokeWidth={2.5} />
                ) : (
                  <Plus size={10} strokeWidth={2.5} />
                )}
              </button>
            </>
          ) : depth > 0 ? (
            /* Leaf node: horizontal line continues straight through towards avatar */
            <span className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[1px] bg-slate-300 pointer-events-none" />
          ) : null}
        </div>

        {/* Primary Person Chip */}
        <div className={personChipClass(primary.id)} onClick={() => onSelect(primary)}>
          <MiniAvatar person={primary} />
          <PersonLabel
            person={primary}
            superAdminId={superAdminId}
            search={search}
            isSelected={selectedId === primary.id}
            rowActive={selectedId === primary.id}
          />
        </div>

        {/* Secondary Spouse */}
        {secondary && (
          <>
            <Heart size={9} className="text-pink-400 shrink-0 mx-1" fill="currentColor" />
            <div className={personChipClass(secondary.id)} onClick={() => onSelect(secondary)}>
              <MiniAvatar person={secondary} />
              <PersonLabel
                person={secondary}
                superAdminId={superAdminId}
                search={search}
                isSelected={selectedId === secondary.id}
                rowActive={selectedId === secondary.id}
              />
            </div>
          </>
        )}

        {/* Remaining Spouses */}
        {remainingSpouses.map((spouse) => (
          <React.Fragment key={spouse.id}>
            <Heart size={9} className="text-pink-400 shrink-0 mx-1" fill="currentColor" />
            <div className={personChipClass(spouse.id)} onClick={() => onSelect(spouse)}>
              <MiniAvatar person={spouse} />
              <PersonLabel
                person={spouse}
                superAdminId={superAdminId}
                search={search}
                isSelected={selectedId === spouse.id}
                rowActive={selectedId === spouse.id}
              />
            </div>
          </React.Fragment>
        ))}
      </div>

      {/* Children list */}
      {hasChildren && (
        <div
          className={`grid transition-[grid-template-rows] duration-200 ease-in-out ${
            expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          }`}
        >
          <div className="overflow-hidden">
            <div>
              {node.children.map((child, index) => (
                <OutlineRow
                  key={child.person.id}
                  node={child}
                  selectedId={selectedId}
                  superAdminId={superAdminId}
                  onSelect={onSelect}
                  expandedIds={expandedIds}
                  onToggle={onToggle}
                  search={search}
                  depth={depth + 1}
                  ancestorIsLast={depth === 0 ? [] : [...ancestorIsLast, isLast]}
                  isLast={index === node.children.length - 1}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TreeOutline({
  persons,
  relationships,
  marriages,
  rootPersonId,
  selectedId,
  superAdminId,
  search = "",
  onSearchChange,
  onSelect,
  onSetRoot,
  initialExpandSelected = false,
}: {
  persons: Person[];
  relationships: Relationship[];
  marriages: Marriage[];
  rootPersonId: string | null;
  selectedId: string | null;
  superAdminId: string | null;
  search?: string;
  onSearchChange?: (v: string) => void;
  onSelect: (p: Person) => void;
  onSetRoot?: (id: string | null) => void;
  initialExpandSelected?: boolean;
}) {
  const forest = useMemo(
    () => buildForest(persons, relationships, marriages, rootPersonId),
    [persons, relationships, marriages, rootPersonId]
  );
  const allIds = useMemo(() => collectAllIds(forest), [forest]);
  const defaultIds = useMemo(
    () => collectIdsUpToDepth(forest, rootPersonId ? 1 : 3),
    [forest, rootPersonId]
  );
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const initialized = useRef<string | null | undefined>(undefined);
  const autoExpandDone = useRef(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialized.current !== rootPersonId && defaultIds.length > 0) {
      initialized.current = rootPersonId;
      setExpandedIds(new Set(defaultIds));
    }
  }, [defaultIds, rootPersonId]);

  useEffect(() => {
    if (!initialExpandSelected || !selectedId || forest.length === 0 || autoExpandDone.current) return;
    const ancestorPath = findAncestorPath(forest, selectedId);
    const subtreeIds = collectSubtreeIds(forest, selectedId);
    setExpandedIds(new Set([...ancestorPath, ...subtreeIds]));
    autoExpandDone.current = true;
    setTimeout(() => {
      const el = scrollContainerRef.current?.querySelector(`[data-person-id="${selectedId}"]`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 150);
  }, [forest, selectedId, initialExpandSelected]);

  const onToggle = (id: string) =>
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const expandAll = () => setExpandedIds(new Set(allIds));

  const expandFromSelected = () => {
    if (!selectedId) return;
    const ancestorPath = findAncestorPath(forest, selectedId);
    const subtreeIds = collectSubtreeIds(forest, selectedId);
    setExpandedIds(new Set([...ancestorPath, ...subtreeIds]));
  };

  if (forest.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
        Không có dữ liệu
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-gray-100 shrink-0 flex-wrap">
        <button
          onClick={expandAll}
          className="text-xs font-medium text-brand-600 hover:text-brand-800 transition-colors cursor-pointer"
        >
          Mở rộng tất cả
        </button>
        <span className="text-gray-300">·</span>
        <button
          onClick={expandFromSelected}
          disabled={!selectedId}
          className="text-xs font-medium text-brand-600 hover:text-brand-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          Mở rộng từ người đang chọn
        </button>
        <span className="text-gray-300">·</span>
        <button
          onClick={() => onSetRoot?.(selectedId)}
          disabled={!selectedId || !onSetRoot}
          className="text-xs font-medium text-brand-600 hover:text-brand-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          Xem cây từ người đang chọn
        </button>
        {onSearchChange && (
          <div className="flex items-center gap-1.5 ml-auto">
            {search && (
              <span className="text-xs text-gray-400">
                {persons.filter((p) => {
                  const name = [p.lastName || "—", p.middleName, p.firstName].filter(Boolean).join(" ");
                  return name.toLowerCase().includes(search.toLowerCase());
                }).length} kết quả
              </span>
            )}
            <Input
              placeholder="Tìm kiếm..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="h-6 w-32 text-xs"
            />
          </div>
        )}
      </div>
      <div ref={scrollContainerRef} className="flex-1 overflow-auto p-3 select-none">
        <div className="min-w-max">
          {forest.map((node) => (
            <OutlineRow
              key={node.person.id}
              node={node}
              selectedId={selectedId}
              superAdminId={superAdminId}
              onSelect={onSelect}
              expandedIds={expandedIds}
              onToggle={onToggle}
              search={search}
              depth={0}
              ancestorIsLast={[]}
              isLast={false}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
