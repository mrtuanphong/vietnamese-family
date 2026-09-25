# Hướng Dẫn Thiết Lập Dự Án Trên Máy Tính Mới

Tài liệu này hướng dẫn chi tiết từng bước để thiết lập môi trường và bắt đầu làm việc với dự án **Gia Đình Việt (`vietnamese-family`)** khi bạn chuyển sang máy tính mới hoặc cài đặt lại hệ điều hành.

---

## 1. Yêu Cầu Tiền Đề (Prerequisites)

Trước khi bắt đầu, hãy đảm bảo máy tính mới đã cài đặt các công cụ sau:

1. **Git:**
   - Kiểm tra bằng lệnh: `git --version`
   - Nếu chưa có: tải tại [git-scm.com](https://git-scm.com/) (hoặc chạy `xcode-select --install` trên macOS).
2. **Node.js & npm:**
   - Phiên bản khuyến nghị: **Node.js 18.x hoặc 20.x LTS trở lên**.
   - Kiểm tra bằng lệnh:
     ```bash
     node -v
     npm -v
     ```
   - Nếu chưa có: tải bản LTS tại [nodejs.org](https://nodejs.org/) hoặc cài qua `nvm` (`nvm install --lts`).
3. **Trình soạn thảo mã nguồn:**
   - Khuyến nghị [Visual Studio Code](https://code.visualstudio.com/) cùng tiện ích mở rộng **Prisma**, **Tailwind CSS IntelliSense**.

---

## 2. Các Bước Thiết Lập

### Bước 1: Chuẩn bị trên máy tính hiện tại (nếu còn truy cập được)
Đảm bảo bạn đã lưu và đẩy toàn bộ mã nguồn đang làm dở lên GitHub:
```bash
git status
git add .
git commit -m "chore: save working state"
git push origin dev
```

---

### Bước 2: Tải mã nguồn về máy mới (Clone)
Mở Terminal trên máy mới, di chuyển đến thư mục bạn muốn lưu dự án (ví dụ: `~/workspace`) và clone repository:

```bash
# Tạo và chuyển vào thư mục chứa dự án
mkdir -p ~/workspace
cd ~/workspace

# Clone repository từ GitHub
git clone https://github.com/mrtuanphong/vietnamese-family.git
cd vietnamese-family

# Chuyển sang nhánh dev (nhánh phát triển chính)
git checkout dev
git pull origin dev
```

---

### Bước 3: Cài đặt các thư viện phụ thuộc (Dependencies)
Chạy lệnh cài đặt các package được định nghĩa trong `package.json`:

```bash
npm install
```

---

### Bước 4: Cấu hình biến môi trường (`.env`)
Do các file chứa mật khẩu (`.env`, `.env.local`) được bảo vệ trong `.gitignore` để tránh rò rỉ lên GitHub, bạn cần tạo file môi trường trên máy mới.

Chọn **1 trong 2 cách** sau:

#### Cách A: Cấu hình thủ công từ file mẫu (Khuyên dùng)
1. Tạo file `.env` từ `.env.example`:
   ```bash
   cp .env.example .env
   ```
2. Mở file `.env` vừa tạo và cập nhật nội dung:
   ```env
   # Chuỗi kết nối PostgreSQL đến nhánh dev trên Neon
   DATABASE_URL="postgresql://neondb_owner:YOUR_DEV_PASSWORD@ep-your-dev-endpoint.neon.tech/neondb?sslmode=require"
   
   # Định danh môi trường phát triển
   DB_ENV="dev"
   ```
   > **Lấy chuỗi kết nối ở đâu?**
   > - **Cách nhanh:** Sao chép nguyên vẹn từ file `.env` của máy cũ.
   > - **Cách từ Neon:** Đăng nhập [console.neon.tech](https://console.neon.tech) > chọn project `vietnamese-family` > chọn nhánh **`dev`** trong mục **Branches** > copy chuỗi kết nối tại khung **Connection Details**.

#### Cách B: Kéo tự động từ Vercel (Nếu đã có Vercel CLI)
```bash
# Đăng nhập và liên kết dự án với Vercel
npx vercel link
# Trả lời các câu hỏi:
# - Set up “vietnamese-family”? [Y]
# - Link to existing project? [Y]
# - Project name: vietnamese-family-dev

# Kéo file môi trường về máy
npx vercel env pull .env.local
```

---

### Bước 5: Sinh mã nguồn Prisma Client
Sau khi có file `.env`, chạy lệnh sinh Prisma Client để kết nối với CSDL:

```bash
npx prisma generate
```

---

### Bước 6: Khởi chạy và kiểm tra ứng dụng
Khởi động máy chủ phát triển cục bộ:

```bash
npm run dev
```

Mở trình duyệt truy cập địa chỉ: **[http://localhost:3000](http://localhost:3000)**

#### Các tiêu chí kiểm tra máy mới đã sẵn sàng:
- [x] Trang web tải bình thường, tiêu đề hiển thị tiền tố **`[Dev]`** (báo hiệu đang kết nối đúng CSDL Dev).
- [x] Dữ liệu danh sách thành viên và cây gia phả tải thành công.
- [x] Đăng nhập bằng số điện thoại và mật khẩu hoạt động bình thường.
- [x] Vào mục **Về phần mềm** > tab **Hệ thống & CSDL** kiểm tra Endpoint CSDL hiển thị đúng endpoint nhánh `dev`.

---

## 3. Quy Trình Làm Việc Hàng Ngày Trên Máy Mới

```bash
# 1. Trước khi code, luôn kéo cập nhật mới nhất về
git pull origin dev

# 2. Khởi chạy server kiểm thử
npm run dev

# 3. Sau khi hoàn thành tính năng / sửa lỗi
git status
git add .
git commit -m "feat: mô tả tính năng vừa thêm"
git push origin dev
```
Khi bạn đẩy lên nhánh `dev`, hệ thống Vercel sẽ tự động build và deploy lên website thử nghiệm:
👉 **[vietnamese-family-dev.vercel.app](https://vietnamese-family-dev.vercel.app)**

---

## 4. Xử Lý Các Sự Cố Thường Gặp (Troubleshooting)

### 1. Lỗi cổng 3000 đã bị ứng dụng khác sử dụng (`Port 3000 is in use`)
Chạy ứng dụng trên cổng khác:
```bash
npm run dev -- -p 3001
```
Hoặc tìm và tắt tiến trình đang chiếm cổng 3000:
```bash
# Trên macOS / Linux
lsof -ti:3000 | xargs kill -9
```

### 2. Lỗi kết nối CSDL (`Can't reach database server...` hoặc `SSL connection error`)
- Kiểm tra lại chuỗi `DATABASE_URL` trong file `.env` đã có đuôi `?sslmode=require` chưa.
- Kiểm tra máy tính có đang bật VPN/tường lửa chặn kết nối ra ngoài cổng 5432 của PostgreSQL không.
- Đăng nhập vào [console.neon.tech](https://console.neon.tech) để kiểm tra xem nhánh `dev` có đang hoạt động bình thường không.

### 3. Lỗi Prisma Client (`PrismaClientInitializationError` hoặc type mismatch)
Chạy lại lệnh sinh client và xoá cache build:
```bash
npx prisma generate
rm -rf .next
npm run dev
```
