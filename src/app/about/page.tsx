"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExternalLink } from "lucide-react";

type BadgeType = "new" | "improved" | "fixed";

interface WhatsNewEntry {
  date: string;
  items: { label: string; badge?: BadgeType }[];
}

interface SystemInfo {
  runtime: string;
  isLocal: boolean;
  db: {
    configured: boolean;
    connected: boolean;
    type: "dev" | "production";
    host: string;
    endpoint: string;
    dbName: string;
    personCount: number;
    clanName: string;
  };
}

const whatsNew: WhatsNewEntry[] = [
  {
    date: "28/06/2026",
    items: [
      { label: "URL riêng cho từng tab: /events · /members · /families", badge: "new" },
      { label: "URL riêng khi xem chi tiết thành viên: /members/<id> — có thể share link", badge: "new" },
      { label: "Trang chủ dashboard tại /", badge: "new" },
      { label: "Trang chủ hiển thị trong sidebar và mobile tab bar", badge: "new" },
      { label: "Trường Họ không còn bắt buộc, hiển thị — khi để trống", badge: "improved" },
      { label: "Tab Sơ đồ: click được, hiển thị thông báo đang phát triển", badge: "improved" },
      { label: "Tab Người đổi tên thành Thành viên", badge: "improved" },
      { label: "Bấm Xem cây → tự expand và cuộn đến người được chọn trong cây thư mục", badge: "improved" },
      { label: "Cây thư mục cho phép cuộn ngang trên mobile", badge: "improved" },
      { label: "Mobile: không hiện overlay khi mở cây từ danh sách", badge: "fixed" },
      { label: "Danh sách: mặc định mở tab Sự kiện", badge: "improved" },
      { label: "Mobile: bottom tab bar luôn hiển thị, chỉ vùng nội dung cuộn", badge: "improved" },
      { label: "Bottom tab bar dùng flexbox thay vì fixed position", badge: "improved" },
      { label: "Tab Gia đình: click người mở sidebar chi tiết thay vì chuyển sang cây", badge: "improved" },
      { label: "Item đang chọn dùng highlight filled (nền đậm) thay vì ring — rõ hơn trên cả danh sách và cây thư mục", badge: "improved" },
      { label: "Cây thư mục: highlight per-person trong cùng 1 row, phân biệt rõ khi row có 2 người", badge: "improved" },
      { label: "Ô tìm kiếm cây thư mục chuyển vào toolbar, gọn hơn", badge: "improved" },
    ],
  },
  {
    date: "22/06/2026",
    items: [
      { label: "Tab Sự kiện: click chọn người → mở sidebar Thông tin cá nhân", badge: "new" },
      { label: "Sidebar collapse/expand kể cả khi chưa chọn ai (placeholder có toggle)", badge: "improved" },
      { label: "Sidebar Thông tin cá nhân chiếm toàn chiều cao trang", badge: "improved" },
      { label: "Tab Người: click row mở sidebar thay vì chuyển sang Cây gia phả", badge: "improved" },
    ],
  },
  {
    date: "21/06/2026",
    items: [
      { label: "Toolbar cây thư mục: Mở rộng tất cả · Mở rộng từ đây · Xem cây từ đây", badge: "new" },
      { label: "Bấm Xem cây từ đây → tự mở sidebar chi tiết (desktop)", badge: "new" },
      { label: "Subtree view: mặc định expand 1 cấp con khi chuyển root", badge: "improved" },
      { label: "Sidebar Chi tiết: bỏ nút X, thêm toggle collapse/expand", badge: "improved" },
      { label: "Icon hoa sen cho người đã mất trên cả bảng danh sách và cây", badge: "new" },
      { label: "Badge ngôi sao vàng cho con cả (thứ tự con = 1)", badge: "new" },
      { label: "Trường Địa chỉ thường trú trong form và chi tiết người", badge: "new" },
      { label: "Form 3 tab: Cơ bản / Địa điểm / Thông tin khác", badge: "improved" },
      { label: "Đăng nhập khách 1 bấm cho dòng họ công khai", badge: "new" },
      { label: "Ẩn toàn bộ controls chỉnh sửa với tài khoản khách", badge: "new" },
    ],
  },
  {
    date: "20/06/2026",
    items: [
      { label: "Badge Dâu/Rể cho thành viên ngoài dòng họ", badge: "new" },
      { label: "Subtree view: xem cây từ một người cụ thể", badge: "new" },
      { label: "Actions menu trên mỗi hàng (Admin)", badge: "new" },
    ],
  },
  {
    date: "19/06/2026",
    items: [
      { label: "Tab Sự kiện: sinh nhật & giỗ, lịch Âm–Dương, filter chips", badge: "new" },
      { label: "Phân quyền: Khách / Admin / Super Admin", badge: "new" },
      { label: "Thứ tự con (childOrder)", badge: "new" },
      { label: "Sơ đồ ReactFlow: marriage hub node", badge: "new" },
      { label: "Tính Đời tự động dựa trên Super Admin làm mốc", badge: "new" },
      { label: "Chuyển sang PostgreSQL (Neon) + Prisma 7", badge: "new" },
      { label: "Deploy Vercel, PWA support", badge: "new" },
    ],
  },
  {
    date: "17/06/2026",
    items: [
      { label: "Cây thư mục (TreeOutline): cha/con phân cấp, vợ/chồng cùng dòng", badge: "new" },
      { label: "Tìm kiếm + highlight + nhấp nháy kết quả đang ẩn", badge: "new" },
      { label: "Double-click: chọn + toggle expand", badge: "new" },
    ],
  },
  {
    date: "16/06/2026",
    items: [
      { label: "Sơ đồ ReactFlow: node/edge, drag, zoom, minimap", badge: "new" },
      { label: "Badge Đời trên node", badge: "new" },
      { label: "Cấu hình dòng họ: tên, địa chỉ, mô tả, bật/tắt công khai", badge: "new" },
      { label: "Đặt Super Admin + thế hệ gốc", badge: "new" },
    ],
  },
];

const badgeStyle: Record<BadgeType, string> = {
  new: "bg-brand-100 text-brand-700",
  improved: "bg-blue-50 text-blue-600",
  fixed: "bg-orange-50 text-orange-600",
};

const badgeLabel: Record<BadgeType, string> = {
  new: "Mới",
  improved: "Cải tiến",
  fixed: "Sửa lỗi",
};

const releases = [
  {
    name: "mvp-01",
    status: "Shipped",
    date: "19/06/2026",
    items: [
      "Toàn bộ tính năng cơ bản: xem/quản lý gia phả, phân quyền khách/admin",
      "Cây thư mục + Sơ đồ ReactFlow",
      "Lịch Âm–Dương, tab Sự kiện",
      "PostgreSQL (Neon) + Prisma 7, deploy Vercel",
      "PWA support",
    ],
    updates: [
      "Sidebar luôn hiển thị, chiếm toàn chiều cao, collapse/expand kể cả khi chưa chọn ai",
      "Toolbar 3 actions: Mở rộng tất cả · Mở rộng từ người đang chọn · Xem cây từ người đang chọn",
      "Subtree view tự mở sidebar + expand 1 cấp",
      "Danh sách: click row mở sidebar thay vì chuyển trang",
      "Tab Sự kiện: click chọn người → mở sidebar (không chuyển sang Cây gia phả)",
      "Trường Địa chỉ thường trú",
      "Form 3 tab: Cơ bản / Địa điểm / Thông tin khác",
      "Đăng nhập khách 1 bấm (không cần nhập credentials)",
    ],
  },
];

export default function AboutPage() {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [loadingSystem, setLoadingSystem] = useState(true);

  useEffect(() => {
    fetch("/api/system")
      .then((res) => res.json())
      .then((data) => setSystemInfo(data))
      .catch((err) => console.error("Lỗi tải thông tin hệ thống:", err))
      .finally(() => setLoadingSystem(false));
  }, []);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-4 py-8 pb-24 sm:pb-8">
        <h1 className="text-xl font-bold text-gray-900 mb-1">Thông tin phần mềm</h1>
        <p className="text-sm text-gray-500 mb-6">Ứng dụng quản lý gia phả dòng họ</p>

        <Tabs defaultValue="features">
          <TabsList className="mb-6">
            <TabsTrigger value="features">Cập nhật mới</TabsTrigger>
            <TabsTrigger value="releases">Phiên bản</TabsTrigger>
            <TabsTrigger value="system">Hệ thống & CSDL</TabsTrigger>
          </TabsList>

          <TabsContent value="features" className="space-y-8">
            {whatsNew.map((entry) => (
              <div key={entry.date} className="flex gap-4">
                <div className="shrink-0 w-24 pt-0.5">
                  <span className="text-xs text-gray-400 font-mono">{entry.date}</span>
                </div>
                <div className="flex-1 space-y-2.5 pb-8 border-b last:border-b-0 last:pb-0">
                  {entry.items.map((item) => (
                    <div key={item.label} className="flex items-start gap-2">
                      {item.badge && (
                        <span className={`text-[0.7rem] font-semibold px-1.5 py-0.5 rounded shrink-0 mt-0.5 ${badgeStyle[item.badge]}`}>
                          {badgeLabel[item.badge]}
                        </span>
                      )}
                      <span className="text-sm text-gray-700 leading-snug">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="releases" className="space-y-8">
            {releases.map((r) => (
              <div key={r.name}>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-sm font-bold text-gray-900">{r.name}</h2>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
                    {r.status}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mb-3">{r.date}</p>

                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Tính năng gốc</h3>
                <ul className="space-y-1 mb-4">
                  {r.items.map((item) => (
                    <li key={item} className="flex gap-2 text-sm text-gray-600">
                      <span className="text-gray-300 shrink-0 mt-0.5">—</span>
                      {item}
                    </li>
                  ))}
                </ul>

                {r.updates.length > 0 && (
                  <>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Cập nhật</h3>
                    <ul className="space-y-1">
                      {r.updates.map((item) => (
                        <li key={item} className="flex gap-2 text-sm text-gray-600">
                          <span className="text-brand-400 shrink-0 mt-0.5">+</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            ))}
          </TabsContent>

          <TabsContent value="system" className="space-y-6">
            {loadingSystem ? (
              <div className="py-8 text-center text-sm text-gray-400">Đang tải thông tin hệ thống...</div>
            ) : systemInfo ? (
              <div className="space-y-6">
                {/* Environment Status Card */}
                <div className="p-4 rounded-xl border bg-white shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">Môi trường CSDL</span>
                    {systemInfo.db.type === "production" ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        PRODUCTION (Chính thức)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-200">
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                        DEV / LOCAL (Thử nghiệm)
                      </span>
                    )}
                  </div>

                  <div className="pt-2 border-t space-y-2 text-sm">
                    <div className="flex justify-between items-center py-1">
                      <span className="text-gray-500">Trạng thái kết nối:</span>
                      {systemInfo.db.connected ? (
                        <span className="text-emerald-600 font-medium flex items-center gap-1">
                          ● Đã kết nối thành công
                        </span>
                      ) : (
                        <span className="text-red-600 font-medium flex items-center gap-1">
                          ✕ Mất kết nối CSDL
                        </span>
                      )}
                    </div>

                    <div className="flex justify-between items-center py-1">
                      <span className="text-gray-500">Môi trường chạy:</span>
                      <span className="font-medium text-gray-800">{systemInfo.runtime}</span>
                    </div>

                    <div className="flex justify-between items-center py-1">
                      <span className="text-gray-500">Dòng họ:</span>
                      <span className="font-medium text-gray-800">{systemInfo.db.clanName || "—"}</span>
                    </div>

                    <div className="flex justify-between items-center py-1">
                      <span className="text-gray-500">Số lượng thành viên:</span>
                      <span className="font-medium text-gray-800">{systemInfo.db.personCount} người</span>
                    </div>
                  </div>
                </div>

                {/* Technical Details Card */}
                <div className="p-4 rounded-xl border bg-gray-50/50 space-y-3">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Chi tiết kỹ thuật CSDL Neon
                  </h3>
                  <div className="space-y-2 text-xs font-mono">
                    <div className="flex flex-col sm:flex-row sm:justify-between py-1 border-b border-gray-200/60 gap-1">
                      <span className="text-gray-500 font-sans">Endpoint ID:</span>
                      <span className="text-brand-700 bg-brand-50 px-2 py-0.5 rounded font-bold break-all">
                        {systemInfo.db.endpoint}
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between py-1 border-b border-gray-200/60 gap-1">
                      <span className="text-gray-500 font-sans">Host:</span>
                      <span className="text-gray-700 break-all">{systemInfo.db.host}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-gray-500 font-sans">Database Name:</span>
                      <span className="text-gray-700">{systemInfo.db.dbName}</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 font-sans pt-1">
                    💡 Để đối chiếu, mở console.neon.tech &gt; Branches và so khớp Endpoint ID trên với branch mong muốn.
                  </p>
                </div>

                {/* Deployment & Infrastructure Links Card */}
                <div className="p-4 rounded-xl border bg-white shadow-sm space-y-3">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Hạ tầng &amp; Quản trị Deployment
                  </h3>
                  <div className="grid grid-cols-1 gap-2 pt-1">
                    <a
                      href="https://github.com/mrtuanphong/vietnamese-family"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-gray-300 hover:bg-gray-50/80 transition-colors group"
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-gray-900 group-hover:text-brand-600 transition-colors">
                          GitHub Repository
                        </span>
                        <span className="text-xs text-gray-500">
                          mrtuanphong/vietnamese-family
                        </span>
                      </div>
                      <ExternalLink size={16} className="text-gray-400 group-hover:text-brand-600 shrink-0" />
                    </a>

                    <a
                      href="https://vercel.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-gray-300 hover:bg-gray-50/80 transition-colors group"
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-gray-900 group-hover:text-brand-600 transition-colors">
                          Vercel Dashboard
                        </span>
                        <span className="text-xs text-gray-500">
                          Quản lý dự án, build deployments &amp; biến môi trường
                        </span>
                      </div>
                      <ExternalLink size={16} className="text-gray-400 group-hover:text-brand-600 shrink-0" />
                    </a>

                    <a
                      href="https://console.neon.tech"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-gray-300 hover:bg-gray-50/80 transition-colors group"
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-gray-900 group-hover:text-brand-600 transition-colors">
                          Neon Database Console
                        </span>
                        <span className="text-xs text-gray-500">
                          Serverless Postgres, quản lý dữ liệu &amp; phân nhánh (Branches)
                        </span>
                      </div>
                      <ExternalLink size={16} className="text-gray-400 group-hover:text-brand-600 shrink-0" />
                    </a>

                    <div className="pt-2 border-t border-gray-100 mt-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <a
                        href="https://do.lifeofphong.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50/50 border border-emerald-100 hover:bg-emerald-50 transition-colors group"
                      >
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-emerald-900">
                            Website Production
                          </span>
                          <span className="text-[0.7rem] text-emerald-700">
                            do.lifeofphong.com
                          </span>
                        </div>
                        <ExternalLink size={14} className="text-emerald-600 shrink-0" />
                      </a>

                      <a
                        href="https://vietnamese-family-dev.vercel.app"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-2.5 rounded-lg bg-amber-50/50 border border-amber-100 hover:bg-amber-50 transition-colors group"
                      >
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-amber-900">
                            Website Staging / Dev
                          </span>
                          <span className="text-[0.7rem] text-amber-700">
                            vietnamese-family-dev.vercel.app
                          </span>
                        </div>
                        <ExternalLink size={14} className="text-amber-600 shrink-0" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-red-50 text-red-700 text-sm">
                Không thể tải thông tin hệ thống. Vui lòng kiểm tra lại cấu hình kết nối.
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
