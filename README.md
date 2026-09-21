# Gia Đình Việt (`vietnamese-family`)

Ứng dụng quản lý gia phả và kết nối các thế hệ trong dòng họ Việt Nam.

## 🚀 Công nghệ sử dụng
- **Framework:** Next.js 16 (App Router), React 19, TypeScript
- **Giao diện:** Tailwind CSS v4, shadcn/ui, Lucide Icons
- **Trực quan hoá phả hệ:** ReactFlow
- **Cơ sở dữ liệu:** PostgreSQL (Neon Serverless) kết hợp Prisma ORM 7
- **Lịch Âm:** Thư viện `lunar-javascript`

## 🛠️ Hướng dẫn chạy thử cục bộ (Local)
1. Cài đặt dependencies:
   ```bash
   npm install
   ```
2. Cấu hình biến môi trường:
   Tạo file `.env` và khai báo `DATABASE_URL` kết nối tới PostgreSQL (Neon).
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
- **Production:** https://do.lifeofphong.com
- **Staging / Dev:** https://vietnamese-family-dev.vercel.app
- **Repository:** https://github.com/mrtuanphong/vietnamese-family
