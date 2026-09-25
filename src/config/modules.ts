export type ModuleCategory = "community" | "finance" | "games" | "utilities";

export interface CategoryMeta {
  id: ModuleCategory;
  name: string;
  description: string;
  badgeClass: string;
  iconName: string;
}

export interface ModuleDefinition {
  id: string;
  name: string;
  description: string;
  category: ModuleCategory;
  href: string;
  iconName: string;
  defaultEnabled: boolean;
  status: "active" | "beta" | "coming_soon";
  requiresRole?: ("admin" | "super_admin")[];
  statHint?: string;
}

export const CATEGORIES: Record<ModuleCategory, CategoryMeta> = {
  community: {
    id: "community",
    name: "Cộng Đồng & Gia Tộc",
    description: "Phả hệ, cây gia phả, danh bạ thành viên, lịch giỗ và thiết lập tộc",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    iconName: "Users",
  },
  finance: {
    id: "finance",
    name: "Tài Chính & Quỹ",
    description: "Quản lý ngân quỹ, sổ cái thu - chi, VietQR và thiết lập tài chính",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
    iconName: "WalletCards",
  },
  games: {
    id: "games",
    name: "Giải Trí & Kết Nối",
    description: "Trò chơi tìm hiểu cội nguồn và công cụ tra cứu xưng hô thuần Việt",
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
    iconName: "Sparkles",
  },
  utilities: {
    id: "utilities",
    name: "Tiện Ích & Cài Đặt",
    description: "Cấu hình tổ chức, phân quyền hệ thống và quản trị phân hệ",
    badgeClass: "bg-slate-50 text-slate-700 border-slate-200",
    iconName: "Settings",
  },
};

export const SYSTEM_MODULES: ModuleDefinition[] = [
  // Community Category
  {
    id: "tree",
    name: "Cây Gia Phả",
    description: "Phả đồ dòng họ trực quan bằng React Flow, hiển thị đa thế hệ",
    category: "community",
    href: "/tree",
    iconName: "Network",
    defaultEnabled: true,
    status: "active",
  },
  {
    id: "members",
    name: "Danh Bạ Thành Viên",
    description: "Tra cứu lý lịch, số điện thoại, vai vế và thế hệ từng người",
    category: "community",
    href: "/members",
    iconName: "Users",
    defaultEnabled: true,
    status: "active",
  },
  {
    id: "events",
    name: "Lịch Giỗ & Sự Kiện",
    description: "Tự động tính ngày giỗ âm lịch, ngày sinh nhật và lễ hội họ",
    category: "community",
    href: "/events",
    iconName: "CalendarDays",
    defaultEnabled: true,
    status: "active",
  },
  {
    id: "families",
    name: "Hộ Gia Đình",
    description: "Tổng hợp danh sách các chi nhánh gia đình hạt nhân",
    category: "community",
    href: "/families",
    iconName: "Home",
    defaultEnabled: true,
    status: "active",
  },
  {
    id: "clan_settings",
    name: "Thiết Lập Dòng Họ",
    description: "Cấu hình họ của tộc, thành viên tham chiếu tính đời và quy ước thế hệ",
    category: "community",
    href: "/community/settings",
    iconName: "Settings",
    defaultEnabled: true,
    status: "active",
    requiresRole: ["admin", "super_admin"],
  },

  // Finance Category
  {
    id: "funds",
    name: "Các Quỹ Hội Nhóm",
    description: "Quỹ thường niên, khuyến học, tu bổ và tích hợp tạo mã VietQR",
    category: "finance",
    href: "/funds",
    iconName: "WalletCards",
    defaultEnabled: true,
    status: "active",
  },
  {
    id: "transactions",
    name: "Sổ Cái Thu - Chi",
    description: "Minh bạch mọi khoản thu chi, lưu trữ ảnh hóa đơn chứng từ",
    category: "finance",
    href: "/transactions",
    iconName: "ArrowLeftRight",
    defaultEnabled: true,
    status: "active",
  },
  {
    id: "finance_settings",
    name: "Thiết Lập Tài Chính",
    description: "Cấu hình tài khoản ngân hàng VietQR, chu kỳ và định mức quỹ",
    category: "finance",
    href: "/finance/settings",
    iconName: "Sliders",
    defaultEnabled: true,
    status: "active",
    requiresRole: ["admin", "super_admin"],
  },

  // Games Category
  {
    id: "quiz",
    name: "Đố Vui Phả Hệ",
    description: "Trò chơi câu đố quan hệ họ hàng giúp con cháu nhớ nguồn cội",
    category: "games",
    href: "/games/quiz",
    iconName: "Sparkles",
    defaultEnabled: false,
    status: "coming_soon",
  },
  {
    id: "kinship",
    name: "Tra Cứu Xưng Hô",
    description: "Nhập 2 người để máy tính toán chuẩn mực cách xưng hô theo gia phả",
    category: "games",
    href: "/games/kinship",
    iconName: "Compass",
    defaultEnabled: false,
    status: "coming_soon",
  },

  // Utilities Category (Chỉ quản lý tổ chức chung & hệ thống)
  {
    id: "settings",
    name: "Cài Đặt Tổ Chức",
    description: "Thông tin tổ chức, tài khoản truy cập, phân quyền và bật/tắt modules",
    category: "utilities",
    href: "/settings",
    iconName: "Settings",
    defaultEnabled: true,
    status: "active",
    requiresRole: ["admin", "super_admin"],
  },
  {
    id: "about",
    name: "Hệ Thống & CSDL",
    description: "Xem phiên bản phần mềm, máy chủ Neon CSDL và nhật ký cập nhật",
    category: "utilities",
    href: "/about",
    iconName: "Info",
    defaultEnabled: true,
    status: "active",
    requiresRole: ["admin", "super_admin"],
  },
];

export const DEFAULT_ENABLED_MODULES: string[] = SYSTEM_MODULES.filter(
  (m) => m.defaultEnabled
).map((m) => m.id);

export function isModuleEnabled(
  moduleId: string,
  enabledModules?: string[] | null
): boolean {
  // 1. Settings & About are core utilities for administrators — always enabled
  if (moduleId === "settings" || moduleId === "about") {
    return true;
  }

  if (!enabledModules || !Array.isArray(enabledModules)) {
    return DEFAULT_ENABLED_MODULES.includes(moduleId);
  }

  // 2. Direct match
  if (enabledModules.includes(moduleId)) {
    return true;
  }

  // 3. Fallback for legacy module IDs if user previously saved settings
  if (moduleId === "clan_settings" && (enabledModules.includes("clan") || enabledModules.includes("tree"))) {
    return true;
  }
  if (moduleId === "finance_settings" && (enabledModules.includes("funds") || enabledModules.includes("transactions"))) {
    return true;
  }

  return false;
}

export function getModulesByCategory(
  category: ModuleCategory,
  enabledModules?: string[] | null,
  includeDisabled: boolean = false
): ModuleDefinition[] {
  return SYSTEM_MODULES.filter((m) => {
    if (m.category !== category) return false;
    if (includeDisabled) return true;
    return isModuleEnabled(m.id, enabledModules);
  });
}
