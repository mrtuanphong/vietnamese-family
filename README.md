# Gia Đình Việt (`vietnamese-family`)

Ứng dụng quản lý gia phả và kết nối các thế hệ trong dòng họ Việt Nam.

## 🚀 Công nghệ sử dụng
- **Framework:** Next.js 16 (App Router), React 19, TypeScript
- **Giao diện:** Tailwind CSS v4, shadcn/ui, Lucide Icons
- **Trực quan hoá phả hệ:** ReactFlow
- **Cơ sở dữ liệu:** PostgreSQL (Neon Serverless) kết hợp Prisma ORM 7
- **Lịch Âm:** Thư viện `lunar-javascript`

## 📖 Tài liệu hướng dẫn chi tiết
Xem toàn bộ tài liệu vận hành và kiến trúc tại: **[docs/DEVELOPMENT_GUIDE.md](./docs/DEVELOPMENT_GUIDE.md)**
- Mô hình 2 môi trường Dev & Production
- Cơ chế phân nhánh CSDL trên Neon (Branching)
- Hướng dẫn cấu hình lại biến môi trường `.env` khi cài lại máy hoặc chuyển máy
- Quy trình Git workflow và CI/CD tự động lên Vercel

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
