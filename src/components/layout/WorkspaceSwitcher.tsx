"use client";

import React, { useState } from "react";
import {
  ChevronsUpDown,
  Check,
  Plus,
  Building2,
  Users,
  Trophy,
  Globe2,
  Sparkles,
} from "lucide-react";
import { UserRole, UserWorkspaceSummary, WorkspaceType } from "@/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface WorkspaceSwitcherProps {
  currentWorkspaceName: string;
  activeWorkspaceId?: string | null;
  workspaces?: UserWorkspaceSummary[];
  roleBadge?: { label: string; color: string };
  onSwitchWorkspace?: (workspaceId: string) => void;
  onCreateWorkspace?: (name: string, type?: WorkspaceType) => void;
  isCollapsed?: boolean;
}

export function WorkspaceSwitcher({
  currentWorkspaceName,
  activeWorkspaceId,
  workspaces = [],
  roleBadge,
  onSwitchWorkspace,
  onCreateWorkspace,
}: WorkspaceSwitcherProps) {
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [newWsName, setNewWsName] = useState("");
  const [newWsType, setNewWsType] = useState<WorkspaceType>("CLAN");
  const [creating, setCreating] = useState(false);

  const getWorkspaceIcon = (type?: WorkspaceType) => {
    switch (type) {
      case "CLUB":
        return <Trophy className="w-3.5 h-3.5 text-amber-600" />;
      case "GROUP":
        return <Users className="w-3.5 h-3.5 text-blue-600" />;
      case "COMMUNITY":
        return <Globe2 className="w-3.5 h-3.5 text-purple-600" />;
      case "CLAN":
      default:
        return <Building2 className="w-3.5 h-3.5 text-teal-600" />;
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWsName.trim()) return;

    setCreating(true);
    try {
      if (onCreateWorkspace) {
        await onCreateWorkspace(newWsName.trim(), newWsType);
      }
      setOpenCreateDialog(false);
      setNewWsName("");
      setNewWsType("CLAN");
    } finally {
      setCreating(false);
    }
  };

  const displayWorkspaces = workspaces.length > 0
    ? workspaces
    : [
        {
          workspaceId: activeWorkspaceId || "ws_default",
          workspaceName: currentWorkspaceName || "Họ Đỗ (Quảng Tái)",
          workspaceType: "CLAN" as WorkspaceType,
          role: "super_admin" as UserRole,
          adminModules: ["*"],
          enabledModules: [],
        },
      ];

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="w-full text-left p-2.5 rounded-xl border border-slate-200/80 bg-slate-50/70 hover:bg-slate-100/80 hover:border-slate-300 transition-all cursor-pointer group focus:outline-hidden"
          >
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Tổ chức đang chọn
              </span>
              <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-colors" />
            </div>
            <div className="flex items-center justify-between gap-1.5 min-w-0">
              <div className="flex items-center gap-1.5 truncate min-w-0">
                <span className="font-semibold text-xs text-slate-800 truncate">
                  {currentWorkspaceName || "Tổ chức"}
                </span>
              </div>
              {roleBadge && (
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border shrink-0 ${roleBadge.color}`}
                >
                  {roleBadge.label}
                </span>
              )}
            </div>
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="start"
          className="w-64 p-1.5 bg-white border border-slate-200 shadow-xl rounded-2xl z-50"
        >
          <div className="px-2.5 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Không gian của bạn ({displayWorkspaces.length})
          </div>

          <div className="space-y-0.5 max-h-56 overflow-y-auto">
            {displayWorkspaces.map((ws) => {
              const isSelected = ws.workspaceId === activeWorkspaceId;
              const roleLabel =
                ws.role === "super_admin"
                  ? "Super Admin"
                  : ws.role === "admin"
                  ? "Quản trị"
                  : "Thành viên";

              return (
                <DropdownMenuItem
                  key={ws.workspaceId}
                  onClick={() => onSwitchWorkspace && onSwitchWorkspace(ws.workspaceId)}
                  className={`flex items-center justify-between px-2.5 py-2 rounded-xl text-xs cursor-pointer transition-all ${
                    isSelected
                      ? "bg-teal-50 text-teal-900 font-semibold"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate min-w-0">
                    <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                      {getWorkspaceIcon(ws.workspaceType)}
                    </div>
                    <div className="truncate">
                      <div className="truncate">{ws.workspaceName}</div>
                      <div className="text-[10px] text-slate-400 font-normal">
                        {roleLabel}
                      </div>
                    </div>
                  </div>
                  {isSelected && (
                    <Check className="w-4 h-4 text-teal-600 shrink-0 ml-2" />
                  )}
                </DropdownMenuItem>
              );
            })}
          </div>

          <DropdownMenuSeparator className="my-1 bg-slate-100" />

          <DropdownMenuItem
            onClick={() => setOpenCreateDialog(true)}
            className="flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-semibold text-teal-700 hover:bg-teal-50 hover:text-teal-800 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-teal-600" />
            <span>Tạo tổ chức / không gian mới</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dialog tạo không gian mới */}
      <Dialog open={openCreateDialog} onOpenChange={setOpenCreateDialog}>
        <DialogContent className="max-w-md bg-white rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-teal-600" />
              <span>Tạo Không Gian Tổ Chức Mới</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Tên tổ chức / Không gian *
              </label>
              <Input
                required
                value={newWsName}
                onChange={(e) => setNewWsName(e.target.value)}
                placeholder="VD: Họ Nguyễn (Đại Tộc), CLB Doanh Nhân 8X..."
                className="text-sm"
                autoFocus
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Loại tổ chức
              </label>
              <Select
                value={newWsType}
                onValueChange={(v) => setNewWsType(v as WorkspaceType)}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CLAN">🏛️ Dòng họ / Gia tộc phả hệ</SelectItem>
                  <SelectItem value="CLUB">🏆 Câu lạc bộ / Đội nhóm thể thao</SelectItem>
                  <SelectItem value="GROUP">👥 Hội nhóm bạn bè / Đồng hương / Lớp</SelectItem>
                  <SelectItem value="COMMUNITY">🌐 Tổ chức cộng đồng / Hiệp hội</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[11px] text-slate-400 mt-1">
                Tùy theo loại tổ chức, hệ thống sẽ gợi ý các phân hệ (gia phả, quỹ, sự kiện) phù hợp.
              </p>
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpenCreateDialog(false)}
                className="cursor-pointer"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={creating || !newWsName.trim()}
                className="bg-teal-600 hover:bg-teal-700 text-white font-semibold cursor-pointer"
              >
                {creating ? "Đang khởi tạo..." : "Tạo & Chuyển sang không gian mới"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
