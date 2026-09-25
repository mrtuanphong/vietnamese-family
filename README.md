# Gia Đình Việt (`vietnamese-family`)

Ứng dụng quản lý gia phả và kết nối các thế hệ trong dòng họ Việt Nam.

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
- **Production (Chính thức):** https://do.lifeofphong.com
- **Staging / Dev (Thử nghiệm):** https://vietnamese-family-dev.vercel.app
- **Repository:** https://github.com/mrtuanphong/vietnamese-family
