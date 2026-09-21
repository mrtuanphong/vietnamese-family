# Hướng Dẫn Vận Hành & Kiến Trúc Dự Án (Gia Đình Việt)

Tài liệu này dành cho thành viên mới tham gia dự án hoặc dùng để tra cứu khi thiết lập lại môi trường làm việc trên máy tính mới.

---

## 1. Tổng Quan Kiến Trúc & Công Nghệ

- **Tên dự án:** Gia Đình Việt (`vietnamese-family`)
- **Mã nguồn:** [GitHub Repository](https://github.com/mrtuanphong/vietnamese-family)
- **Framework chính:** Next.js 16 (App Router), React 19, TypeScript
- **Giao diện & Thành phần UI:** Tailwind CSS v4, shadcn/ui, Lucide Icons
- **Cơ sở dữ liệu:** PostgreSQL Serverless lưu trữ trên [Neon](https://console.neon.tech)
- **ORM kết nối CSDL:** Prisma ORM 7 (`@prisma/client`, `@prisma/adapter-pg`)
- **Nền tảng triển khai (Hosting/CI-CD):** [Vercel](https://vercel.com)
- **Xử lý ngày tháng:** Thư viện `lunar-javascript` (chuyển đổi Âm–Dương lịch cho ngày giỗ, sinh nhật)

---

## 2. Mô Hình Hai Môi Trường: Dev & Production

Dự án tách biệt hoàn toàn giữa môi trường phát triển thử nghiệm (**Development**) và môi trường người dùng thật (**Production**) từ mã nguồn, CSDL đến máy chủ triển khai:

| Tiêu chí | Môi trường Development (Dev / Staging) | Môi trường Production (Chính thức) |
|---|---|---|
| **Mục đích** | Phát triển, kiểm thử tính năng mới, thử nghiệm dữ liệu | Người thân, dòng họ truy cập và tra cứu chính thức |
| **Nhánh Git (GitHub)** | `dev` | `main` |
| **Dự án trên Vercel** | `vietnamese-family-dev` | `vietnamese-family-prod` |
| **Đường dẫn Website** | [vietnamese-family-dev.vercel.app](https://vietnamese-family-dev.vercel.app) | [do.lifeofphong.com](https://do.lifeofphong.com) |
| **Nhánh CSDL trên Neon** | Branch `dev` | Branch `production` (hoặc `main`) |
| **Dấu hiệu nhận biết UI** | Có tiền tố **`[Dev]`** trên tab trình duyệt và tiêu đề trang | Giao diện chuẩn sạch sẽ, không có nhãn `[Dev]` |
| **Giá trị biến `DB_ENV`** | `dev` | `production` |

---

## 3. Cơ Chế Cơ Sở Dữ Liệu Trên Neon

Hệ thống dùng tính năng **Branching** của Neon Serverless Postgres:
- **Nhánh `production`:** Chứa dữ liệu gia phả thực tế của dòng họ.
- **Nhánh `dev`:** Bản phân nhánh độc lập được nhân bản từ bản chính. Mọi thao tác thêm/sửa/xoá người trong quá trình code và test chỉ tác động vào nhánh này, **không ảnh hưởng** đến dữ liệu thật trên `do.lifeofphong.com`.
- Mỗi nhánh CSDL có một mã máy chủ riêng (**Endpoint ID**, ví dụ `ep-xyz-123456...`). Bạn có thể vào tab **"Về phần mềm > Hệ thống & CSDL"** trên web để kiểm tra Endpoint ID đang kết nối.

---

## 4. Quản Lý Biến Môi Trường (Environment Variables)

### 4.1. Nguyên tắc bảo mật
- **Tuyệt đối không đẩy file `.env` lên GitHub.** File `.gitignore` đã được cấu hình chặn tất cả các file dạng `.env*`.
- GitHub chỉ lưu trữ code logic; thông tin kết nối và mật khẩu được lưu riêng biệt ở máy cá nhân (Local) và trên đám mây (Vercel).

### 4.2. Danh sách biến môi trường cần thiết
| Tên biến | Ý nghĩa | Ví dụ giá trị |
|---|---|---|
| `DATABASE_URL` | Chuỗi kết nối PostgreSQL từ Neon | `postgresql://user:pass@ep-xyz.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require` |
| `DB_ENV` | Phân loại môi trường hiển thị | `dev` (trên máy local và web dev) hoặc `production` (trên web prod) |

---

## 5. Hướng Dẫn Thiết Lập Khi Cài Lại Máy Hoặc Chuyển Máy Mới

Khi bạn cài lại hệ điều hành hoặc chuyển sang làm việc trên một máy tính khác, hãy làm theo các bước sau:

### Bước 1: Clone mã nguồn về máy
```bash
# Chọn thư mục làm việc mong muốn (ví dụ ~/workspace)
mkdir -p ~/workspace
cd ~/workspace

# Clone repository từ GitHub
git clone https://github.com/mrtuanphong/vietnamese-family
cd vietnamese-family

# Chuyển sang nhánh dev để làm việc
git checkout dev
```

### Bước 2: Khôi phục biến môi trường (`.env`)
Chọn 1 trong 2 cách sau:

- **Cách A — Kéo tự động từ Vercel (Nhanh nhất, chỉ 10 giây):**
  ```bash
  # Cần đăng nhập tài khoản Vercel nếu chưa đăng nhập
  npx vercel link
  # Khi được hỏi:
  # - Set up “vietnamese-family”? -> chọn Y
  # - Which scope? -> chọn tài khoản của bạn
  # - Link to existing project? -> chọn Y
  # - What’s the name of your existing project? -> nhập vietnamese-family-dev

  # Kéo file môi trường về máy
  npx vercel env pull .env.local
  ```

- **Cách B — Cấu hình thủ công từ file mẫu:**
  ```bash
  cp .env.example .env
  ```
  Sau đó mở [console.neon.tech](https://console.neon.tech) > chọn mục **Branches** > chọn nhánh **`dev`** > copy chuỗi kết nối và dán vào `DATABASE_URL` trong file `.env`.

### Bước 3: Cài đặt thư viện và khởi động
```bash
# 1. Cài đặt các gói phụ thuộc
npm install

# 2. Sinh mã Prisma Client tương thích
npx prisma generate

# 3. Khởi chạy máy chủ phát triển
npm run dev
```
Mở trình duyệt truy cập: **`http://localhost:3000`**

---

## 6. Quy Trình Phát Triển & Triển Khai (Workflow)

```
[Local Machine (nhánh dev)] 
       │  git push origin dev
       ▼
[GitHub (nhánh dev)] ────── auto deploy ────► [Vercel: vietnamese-family-dev]
       │                                     (vietnamese-family-dev.vercel.app)
       │  git merge dev -> main
       ▼
[GitHub (nhánh main)] ───── auto deploy ────► [Vercel: vietnamese-family-prod]
                                             (do.lifeofphong.com)
```

### Quy trình 3 bước chuẩn:

1. **Lập trình tính năng mới (hàng ngày):**
   - Luôn làm việc trên nhánh **`dev`** (`git checkout dev`).
   - Kết nối vào CSDL Dev. Kiểm tra thấy tiêu đề có `[Dev]` là an toàn.
   - Thử nghiệm trên `http://localhost:3000`.

2. **Kiểm thử trên Staging (Web Dev):**
   - Lưu và đẩy code lên nhánh `dev`:
     ```bash
     git add .
     git commit -m "feat: tên_tính_năng_mới"
     git push origin dev
     ```
   - Vercel tự động build trong ~1 phút. Truy cập [vietnamese-family-dev.vercel.app](https://vietnamese-family-dev.vercel.app) để kiểm tra giao diện và hoạt động thực tế trên cloud.

3. **Phát hành lên Production (Trang chính thức):**
   - Khi tính năng trên Dev đã ổn định và sẵn sàng cho gia đình sử dụng:
     ```bash
     git checkout main
     git pull origin main
     git merge dev
     git push origin main
     git checkout dev
     ```
   - Hoặc tạo **Pull Request** từ `dev` vào `main` trên giao diện [GitHub](https://github.com/mrtuanphong/vietnamese-family).
   - Vercel dự án `vietnamese-family-prod` sẽ tự động chạy migration và cập nhật trực tiếp lên [do.lifeofphong.com](https://do.lifeofphong.com).

---

## 7. Danh Mục Đường Dẫn Quản Trị Hệ Thống

- **Mã nguồn:** [GitHub Repository (mrtuanphong/vietnamese-family)](https://github.com/mrtuanphong/vietnamese-family)
- **Quản lý máy chủ & triển khai:** [Vercel Dashboard](https://vercel.com)
- **Quản lý CSDL Serverless:** [Neon Console](https://console.neon.tech)
- **Trang web Dev (Thử nghiệm):** [vietnamese-family-dev.vercel.app](https://vietnamese-family-dev.vercel.app)
- **Trang web Prod (Chính thức):** [do.lifeofphong.com](https://do.lifeofphong.com)
