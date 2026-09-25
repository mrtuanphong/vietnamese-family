"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Users,
  Network,
  WalletCards,
  CalendarDays,
  Home,
  ArrowLeftRight,
  Sparkles,
  Compass,
  Settings,
  Sliders,
  Info,
  Layers,
  ArrowRight,
  TrendingUp,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { clanApi, personsApi } from "@/lib/api";
import { useAccess } from "@/lib/AccessContext";
import { AnimatedLoadingDots } from "@/components/ui/AnimatedLoadingDots";
import type { Clan, Person } from "@/types";
import {
  SYSTEM_MODULES,
  CATEGORIES,
  ModuleCategory,
  isModuleEnabled,
  DEFAULT_ENABLED_MODULES,
} from "@/config/modules";

const ICON_MAP: Record<string, any> = {
  Network,
  Users,
  CalendarDays,
  Home,
  WalletCards,
  ArrowLeftRight,
  Sparkles,
  Compass,
  Settings,
  Sliders,
  Info,
};

export default function HomePage() {
  const { enabledModules: contextModules } = useAccess();
  const [clan, setClan] = useState<Clan | null>(null);
  const [persons, setPersons] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    Promise.all([clanApi.get(), personsApi.getAll()])
      .then(([c, ps]) => {
        if (c) setClan(c);
        if (Array.isArray(ps)) setPersons(ps);
      })
      .catch((err) => console.error("Error loading dashboard data:", err))
      .finally(() => setLoading(false));

    const onClanUpdated = (e: any) => {
      if (e?.detail) {
        setClan((prev) => ({ ...(prev || {}), ...e.detail }));
      }
    };
    window.addEventListener("clan:updated" as any, onClanUpdated);
    return () => window.removeEventListener("clan:updated" as any, onClanUpdated);
  }, []);

  const enabledModules = contextModules ?? clan?.enabledModules ?? DEFAULT_ENABLED_MODULES;

  // Compute stats
  const totalMembers = persons.length;
  const generations = useMemo(() => {
    const gens = persons.map((p) => p.generation).filter((g): g is number => typeof g === "number" && g > 0);
    return gens.length > 0 ? Math.max(...gens) : 0;
  }, [persons]);

  const deceasedCount = useMemo(() => {
    return persons.filter((p) => Boolean(p.deathDateLunar)).length;
  }, [persons]);

  // Filter modules
  const filteredModules = useMemo(() => {
    return SYSTEM_MODULES.filter((m) => {
      // Must be enabled
      if (!isModuleEnabled(m.id, enabledModules)) return false;
      // Filter by category
      if (selectedCategory !== "all" && m.category !== selectedCategory) return false;
      return true;
    });
  }, [enabledModules, selectedCategory]);

  const activeModuleCount = SYSTEM_MODULES.filter((m) =>
    isModuleEnabled(m.id, enabledModules)
  ).length;

  return (
    <div className="space-y-6">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-700 via-teal-800 to-slate-900 text-white p-6 md:p-8 shadow-xl shadow-teal-950/10">
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-medium">
            <span>🏛️</span>
            <span>Không gian số Quản trị & Gia tộc</span>
          </div>

          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
              {clan?.name || "Gia Đình Việt"}
            </h1>
            <p className="text-sm md:text-base text-teal-100/90 max-w-xl mt-1">
              Trung tâm chỉ huy tổng thể: Quản lý gia phả dòng họ, ngân quỹ hội nhóm và kết nối các thế hệ.
            </p>
          </div>
        </div>

        <div className="absolute right-[-20px] bottom-[-20px] text-white/5 text-9xl font-black select-none pointer-events-none">
          🏛️
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {/* Card 1: Thành viên & Thế hệ */}
        <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Dòng tộc
            </span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 min-h-[2rem] flex items-center">
              {loading ? (
                <AnimatedLoadingDots dotClassName="bg-teal-600" />
              ) : (
                totalMembers
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {loading ? (
                "Đang tính toán..."
              ) : generations > 0 ? (
                `${generations} thế hệ phả hệ`
              ) : (
                "Thành viên gia tộc"
              )}
            </p>
          </div>
        </div>

        {/* Card 2: Ngân quỹ hội nhóm */}
        <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Ngân quỹ
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <WalletCards className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 min-h-[2rem] flex items-center">
              Hoạt động
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Hỗ trợ VietQR & Thu chi
            </p>
          </div>
        </div>

        {/* Card 3: Lịch giỗ & Tưởng niệm */}
        <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Ngày giỗ
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <CalendarDays className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 min-h-[2rem] flex items-center">
              {loading ? (
                <AnimatedLoadingDots dotClassName="bg-amber-600" />
              ) : (
                `${deceasedCount} ngày`
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {loading ? "Đang dò lịch âm..." : "Lịch âm theo dõi tự động"}
            </p>
          </div>
        </div>

        {/* Card 4: Module đang hoạt động */}
        <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Phân hệ
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 min-h-[2rem] flex items-center">
              {loading ? (
                <AnimatedLoadingDots dotClassName="bg-purple-600" />
              ) : (
                `${activeModuleCount} / ${SYSTEM_MODULES.length}`
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Module đang kích hoạt
            </p>
          </div>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-teal-600" />
            <span>Phân hệ & Tính năng</span>
          </h2>
          <Link
            href="/settings"
            className="text-xs font-semibold text-teal-700 hover:text-teal-800 hover:underline flex items-center gap-1"
          >
            <span>Tùy chỉnh Bật/Tắt</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === "all"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            Tất cả ({activeModuleCount})
          </button>

          {(Object.keys(CATEGORIES) as ModuleCategory[]).map((catKey) => {
            const cat = CATEGORIES[catKey];
            const count = SYSTEM_MODULES.filter(
              (m) => m.category === catKey && isModuleEnabled(m.id, enabledModules)
            ).length;
            if (count === 0) return null;

            const isSelected = selectedCategory === catKey;

            return (
              <button
                key={catKey}
                onClick={() => setSelectedCategory(catKey)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                {cat.name} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Module Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredModules.map((m) => {
          const Icon = ICON_MAP[m.iconName] || Layers;
          const cat = CATEGORIES[m.category];

          return (
            <Link
              key={m.id}
              href={m.href}
              className="group bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-teal-300 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-all flex items-center justify-center shadow-xs">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cat.badgeClass}`}
                    >
                      {cat.name}
                    </span>
                    {m.status === "coming_soon" && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">
                        Sắp ra mắt
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 text-base group-hover:text-teal-700 transition-colors">
                    {m.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {m.description}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-teal-600 group-hover:text-teal-700">
                <span>Truy cập phân hệ</span>
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
