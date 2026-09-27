export interface ThemeOption {
  id: string;
  name: string;
  label: string;
  description: string;
  primary: string; // 600 hex
  accent: string;  // 500 hex
  previewBg: string; // 50 hex
  previewBorder: string; // 200 hex
  swatchClass: string;
  ringClass: string;
  badgeClass: string;
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: "teal",
    name: "Teal",
    label: "Ngọc Bích",
    description: "Hài hòa, thanh nhã và phong thủy cát tường",
    primary: "#0d9488",
    accent: "#14b8a6",
    previewBg: "#f0fdfa",
    previewBorder: "#99f6e4",
    swatchClass: "bg-teal-600",
    ringClass: "ring-teal-500",
    badgeClass: "bg-teal-50 text-teal-700 border-teal-200",
  },
  {
    id: "emerald",
    name: "Emerald",
    label: "Lục Phỉ Thúy",
    description: "Cội nguồn, sinh sôi nảy nở và trường tồn gia tộc",
    primary: "#059669",
    accent: "#10b981",
    previewBg: "#ecfdf5",
    previewBorder: "#a7f3d0",
    swatchClass: "bg-emerald-600",
    ringClass: "ring-emerald-500",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  {
    id: "blue",
    name: "Blue",
    label: "Lam Thanh Nhã",
    description: "Minh bạch, đoàn kết, phù hợp hội đồng hương & CLB",
    primary: "#2563eb",
    accent: "#3b82f6",
    previewBg: "#eff6ff",
    previewBorder: "#bfdbfe",
    swatchClass: "bg-blue-600",
    ringClass: "ring-blue-500",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
  },
  {
    id: "indigo",
    name: "Indigo",
    label: "Chàm Quý Phái",
    description: "Trang nghiêm, trí tuệ, đĩnh đạc và hiện đại",
    primary: "#4f46e5",
    accent: "#6366f1",
    previewBg: "#eef2ff",
    previewBorder: "#c7d2fe",
    swatchClass: "bg-indigo-600",
    ringClass: "ring-indigo-500",
    badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
  {
    id: "rose",
    name: "Rose",
    label: "Hồng Son Phúc Lộc",
    description: "Ấm cúng, may mắn, hỷ sự và gắn kết gia đạo",
    primary: "#e11d48",
    accent: "#f43f5e",
    previewBg: "#fff1f2",
    previewBorder: "#fecdd3",
    swatchClass: "bg-rose-600",
    ringClass: "ring-rose-500",
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
  },
  {
    id: "amber",
    name: "Amber",
    label: "Hoàng Kim Sa",
    description: "Tôn kính tiên tổ, phú quý vinh hoa và truyền thống",
    primary: "#d97706",
    accent: "#f59e0b",
    previewBg: "#fffbeb",
    previewBorder: "#fde68a",
    swatchClass: "bg-amber-600",
    ringClass: "ring-amber-500",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
  },
  {
    id: "purple",
    name: "Purple",
    label: "Tím Cổ Kính",
    description: "Văn hiến, chiều sâu cội nguồn và di sản tổ tông",
    primary: "#7c3aed",
    accent: "#8b5cf6",
    previewBg: "#f5f3ff",
    previewBorder: "#ddd6fe",
    swatchClass: "bg-purple-600",
    ringClass: "ring-purple-500",
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
  },
];

export const DEFAULT_THEME_ID = "teal";

export function getTheme(themeId?: string | null): ThemeOption {
  return THEME_OPTIONS.find((t) => t.id === themeId) || THEME_OPTIONS[0];
}
