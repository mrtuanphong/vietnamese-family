# Kết Nối Cộng Đồng (Community Connection)

Ứng dụng nền tảng kết nối cộng đồng, quản lý gia phả dòng họ và gắn kết các tổ chức Việt Nam.

- **Tên chính thức:** Kết Nối Cộng Đồng
- **Tên tiếng Anh:** Community Connection
- **Ngôn ngữ chính:** Tiếng Việt (chủ đạo xuyên suốt toàn bộ ứng dụng và dữ liệu)
- **Tên miền chính thức:** [ketnoicongdong.com](https://ketnoicongdong.com) *(available)*
- **Mã nguồn:** `vietnamese-family`

---

## 🚀 Công nghệ sử dụng
- **Framework:** Next.js 16 (App Router), React 19, TypeScript
- **Giao diện:** Tailwind CSS v4, shadcn/ui, Lucide Icons
- **Trực quan hoá phả hệ:** ReactFlow
- **Cơ sở dữ liệu:** PostgreSQL (Neon Serverless) kết hợp Prisma ORM 7
- **Lịch Âm:** Thư viện `lunar-javascript`

## 📖 Tài liệu hướng dẫn chi tiết
- **[Thiết lập dự án trên máy tính mới](./docs/SETUP_NEW_MACHINE.md)**: Hướng dẫn chi tiết từng bước khi clone và làm việc trên máy tính mới.
- **[Vận hành & kiến trúc hệ thống](./docs/DEVELOPMENT_GUIDE.md)**: Chi tiết mô hình 2 môi trường Dev & Production, cơ chế CSDL Neon, Git workflow.
- **[Thiết lập hệ thống từ đầu](./docs/SETUP_FROM_SCRATCH.md)**: Hướng dẫn khởi tạo toàn bộ hạ tầng GitHub, Neon và Vercel từ con số 0.
- **[Lộ trình phát triển & công việc](./docs/ROADMAP.md)**: Bảng theo dõi tiến độ các phân hệ và tính năng.

## 🛠️ Hướng dẫn chạy thử cục bộ (Local)
1. Cài đặt dependencies:
   ```bash
   npm install
   ```
2. Cấu hình biến môi trường:
   Sao chép file mẫu: `cp .env.example .env` và điền `DATABASE_URL` từ nhánh `dev` của Neon.
3. Sinh mã Prisma Client:
   ```bash
   npx prisma generate
   ```
4. Khởi động server:
   ```bash
   npm run dev
   ```
   Truy cập `http://localhost:3000` trên trình duyệt.

## 🌐 Môi trường triển khai
- **Production (Chính thức):** [https://ketnoicongdong.com](https://ketnoicongdong.com) *(hoặc https://do.lifeofphong.com)*
- **Staging / Dev (Thử nghiệm):** https://vietnamese-family-dev.vercel.app
- **Repository:** https://github.com/mrtuanphong/vietnamese-family
