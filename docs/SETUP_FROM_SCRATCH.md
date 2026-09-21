# Hướng Dẫn Thiết Lập Dự Án Từ Đầu (Setup From Scratch)

Tài liệu này hướng dẫn chi tiết cách dựng toàn bộ hệ thống gồm 2 môi trường: **Development** (Thử nghiệm) và **Production** (Chính thức) khi bắt đầu với mã nguồn từ GitHub.

```
GitHub Repo (vietnamese-family)
├── Nhánh main ────────► Vercel (vietnamese-family-prod) ──► Neon (CSDL Prod) ──► do.lifeofphong.com
└── Nhánh dev  ────────► Vercel (vietnamese-family-dev)  ──► Neon (CSDL Dev)  ──► vietnamese-family-dev.vercel.app
       ▲
       └── git push từ máy cá nhân (Local dev)
```

---

## GIAI ĐOẠN 1: Chuẩn Bị Mã Nguồn & Nhánh Trên GitHub

Kho mã nguồn cần có sẵn 2 nhánh riêng biệt: `main` và `dev`.

1. **Clone mã nguồn về máy tính:**
   ```bash
   git clone https://github.com/mrtuanphong/vietnamese-family
   cd vietnamese-family
   ```

2. **Khởi tạo và đẩy nhánh `dev` lên GitHub (nếu chưa có):**
   ```bash
   # Đảm bảo đang ở nhánh main mới nhất
   git checkout main
   git pull origin main

   # Tạo và chuyển sang nhánh dev
   git checkout -b dev

   # Đẩy nhánh dev lên GitHub
   git push -u origin dev
   ```

---

## GIAI ĐOẠN 2: Thiết Lập Cơ Sở Dữ Liệu Trên Neon

Dự án sử dụng PostgreSQL Serverless trên [Neon](https://console.neon.tech).

### Bước 1: Tạo Project trên Neon
1. Truy cập [console.neon.tech](https://console.neon.tech) và chọn **Sign in with GitHub**.
2. Bấm nút **Create Project**:
   - **Project Name:** `vietnamese-family`
   - **Region:** Chọn khu vực gần nhất (ví dụ `Singapore - ap-southeast-1` hoặc `US East`).
3. Sau khi tạo xong, Neon sẽ tự động tạo một nhánh mặc định tên là **`main`** (dùng làm CSDL Production).
4. **Lưu lại chuỗi kết nối Production:**
   - Tại trang Dashboard, trong khung **Connection Details**, chọn định dạng **Postgres** hoặc **Prisma**.
   - Sao chép chuỗi kết nối:
     ```text
     postgresql://neondb_owner:<PASSWORD>@<EP_PROD>.neon.tech/neondb?sslmode=require
     ```

### Bước 2: Tạo Nhánh CSDL cho Dev (Branching)
1. Trong menu bên trái của bảng điều khiển Neon, vào mục **Branches**.
2. Bấm **New Branch**:
   - **Branch Name:** `dev`
   - **Parent Branch:** Chọn `main` (để sao chép toàn bộ cấu trúc và dữ liệu từ bản chính).
3. Bấm **Create Branch**.
4. **Lưu lại chuỗi kết nối Dev:**
   - Bấm vào branch `dev` vừa tạo, xem khung **Connection Details**.
   - Sao chép chuỗi kết nối của nhánh này:
     ```text
     postgresql://neondb_owner:<PASSWORD>@<EP_DEV>.neon.tech/neondb?sslmode=require
     ```
     *(Nhánh này sẽ có mã Endpoint riêng biệt, hoàn toàn tách rời với Prod).*

---

## GIAI ĐOẠN 3: Khởi Tạo Cấu Trúc Bảng Dữ Liệu (Migration)

Trước khi chạy ứng dụng, cần khởi tạo các bảng (`Person`, `Clan`, `Relationship`, `Marriage`) vào CSDL Neon:

1. Tại thư mục dự án trên máy tính, tạo file `.env` từ file mẫu:
   ```bash
   cp .env.example .env
   ```
2. Mở file `.env` và dán chuỗi kết nối của nhánh **`dev`** vào `DATABASE_URL`.
3. Chạy lệnh cài đặt và deploy schema cho CSDL Dev:
   ```bash
   npm install
   npx prisma migrate deploy
   ```
4. Đổi tạm `DATABASE_URL` trong `.env` sang chuỗi kết nối của nhánh **`main` (Production)** và chạy lại lệnh trên để khởi tạo bảng cho CSDL Prod:
   ```bash
   npx prisma migrate deploy
   ```
5. Đổi lại `DATABASE_URL` trong `.env` về nhánh **`dev`** để phục vụ việc lập trình trên máy.

---

## GIAI ĐOẠN 4: Thiết Lập 2 Dự Án Trên Vercel

Mở [Vercel Dashboard](https://vercel.com) và đăng nhập bằng tài khoản GitHub.

### Dự Án 1: Môi Trường Production (`vietnamese-family-prod`)

1. Bấm **Add New...** > chọn **Project**.
2. Tìm repository `vietnamese-family` và bấm **Import**.
3. Cấu hình dự án:
   - **Project Name:** `vietnamese-family-prod`
   - **Framework Preset:** Next.js
4. Mở mục **Environment Variables** và thêm 2 biến:
   - `DATABASE_URL`: Dán chuỗi kết nối CSDL **Production** trên Neon.
   - `DB_ENV`: Điền `production`.
5. Bấm **Deploy**.
6. **Gán Tên Miền Chính Thức (Custom Domain):**
   - Sau khi deploy xong, vào **Settings** > **Domains**.
   - Thêm tên miền chính thức của bạn (ví dụ: `do.lifeofphong.com`).
   - Cấu hình bản ghi DNS theo hướng dẫn của Vercel tại nhà cung cấp tên miền của bạn.

---

### Dự Án 2: Môi Trường Development (`vietnamese-family-dev`)

1. Bấm **Add New...** > chọn **Project** (import lần 2 từ cùng repository `vietnamese-family`).
2. Cấu hình dự án:
   - **Project Name:** `vietnamese-family-dev`
   - **Framework Preset:** Next.js
3. Mở mục **Environment Variables** và thêm 2 biến:
   - `DATABASE_URL`: Dán chuỗi kết nối CSDL **Dev** trên Neon.
   - `DB_ENV`: Điền `dev`.
4. Bấm **Deploy**.
5. **Chuyển Nhánh Chính Sang `dev` (Rất quan trọng):**
   - Sau khi deploy lần đầu, vào **Settings** > **Environments** (hoặc **Git**).
   - Tại mục **Production**, đổi nhánh liên kết từ `main` sang **`dev`** > bấm **Save**.
   - Vào **Settings** > **Domains**: Đảm bảo domain mặc định có dạng `vietnamese-family-dev.vercel.app` và đang kết nối với môi trường **Production** của project này.
6. **Build lại:**
   - Vào tab **Deployments** > bấm dấu ba chấm `...` ở bản build trên cùng > chọn **Redeploy**.

---

### (Tùy chọn tối ưu) Bỏ qua build trùng lặp trên bản Prod
Mặc định khi bạn push lên nhánh `dev`, dự án Prod cũng sẽ tự tạo một bản "Preview". Để tiết kiệm số phút build miễn phí trên Vercel:
1. Vào dự án **`vietnamese-family-prod`** > **Settings** > **Git**.
2. Cuộn xuống phần **Ignored Build Step**, nhập lệnh:
   ```bash
   [ "$VERCEL_GIT_COMMIT_REF" != "main" ] && exit 0 || exit 1
   ```
3. Bấm **Save**. Từ nay project Prod sẽ chỉ build duy nhất khi có code trên nhánh `main`.

---

## GIAI ĐOẠN 5: Bảng Nghiệm Thu & Kiểm Tra Chéo

| STT | Hạng mục kiểm tra | Cách thực hiện | Tiêu chuẩn đạt |
|:---:|---|---|---|
| 1 | Nhận diện môi trường Dev | Truy cập `vietnamese-family-dev.vercel.app` | Tiêu đề trang và tab trình duyệt có chữ **`[Dev]`** |
| 2 | Nhận diện môi trường Prod | Truy cập `do.lifeofphong.com` | Tiêu đề trang sạch sẽ, **không** có tiền tố `[Dev]` |
| 3 | Kiểm tra Endpoint CSDL | Vào trang `/about` > tab "Hệ thống & CSDL" trên cả 2 web | Mã Endpoint trên mỗi trang khớp đúng với nhánh tương ứng trên Neon |
| 4 | Kiểm tra cô lập dữ liệu | Thêm 1 người tên "Test Dev" trên web Dev | Sang trang Prod tải lại (F5), người "Test Dev" **không** xuất hiện |
| 5 | Chạy local trên máy cá nhân | Mở Terminal chạy `npm run dev` | Truy cập `http://localhost:3000` thấy tiền tố `[Dev]` |

---

## 🔒 Quy Tắc Bảo Mật Cho Repo Public

- File `.env` chứa mật khẩu thật phải luôn nằm trong danh sách `.gitignore`.
- Tuyệt đối không đưa chuỗi kết nối thật vào mã nguồn (`.ts`, `.tsx`, `.js`) hoặc tài liệu markdown.
- Trong các tài liệu hướng dẫn công khai, luôn dùng chuỗi placeholder mẫu như trong `.env.example`:
  ```env
  DATABASE_URL="postgresql://neondb_owner:your_password@ep-your-dev-endpoint.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
  DB_ENV="dev"
  ```
