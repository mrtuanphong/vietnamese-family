# LỘ TRÌNH PHÁT TRIỂN & THEO DÕI CÔNG VIỆC (ROADMAP & TODO)

Dự án: **Quản lý Dòng họ & Gia phả Số (Vietnamese Family)**  
Cập nhật lần cuối: 25/09/2026

---

## I. TỔNG KẾT TÌNH TRẠNG 5 PHẦN KIẾN TRÚC PHÂN QUYỀN

### [x] PHẦN 1: MÔ HÌNH PHÂN QUYỀN MỚI (AUTHORIZATION MATRIX)
- **Super Admin:** Toàn quyền cấu hình dòng họ, quản lý tài khoản người dùng, bổ nhiệm quyền và bật/tắt module.
- **Quản trị viên phân hệ (Module Leads):**
  - `canManageCommunity`: Quản lý Cây gia phả (`/tree`), Danh bạ (`/members`), Lịch giỗ (`/events`), Hộ gia đình (`/families`).
  - `canManageFinance`: Quản lý Quỹ hội nhóm (`/funds`), Sổ cái thu - chi (`/transactions`).
  - `canManageGames`: Quản lý Tra cứu xưng hô (`/games/kinship`), Đố vui phả hệ (`/games/quiz`).
- **Thành viên (Member):** Xem thông tin chung, chỉ được sửa đổi hồ sơ bản thân, vợ/chồng, con cái (`editablePersonIds`).

### [x] PHẦN 2: THIẾT KẾ CƠ SỞ DỮ LIỆU (DATABASE SCHEMA)
- Tách biệt hoàn toàn hai thực thể:
  - Bảng `User`: Lưu tài khoản đăng nhập app (`phone`, `password`, `fullName`, `role`, `adminModules`, `status`).
  - Bảng `Person`: Thuần túy lưu trữ phả hệ dòng tộc (ngày sinh, ngày mất âm lịch, thế hệ, mộ phần, quan hệ huyết thống).
  - Quan hệ 1-1 (optional): `User.personId` trỏ tới `Person.id`.
- Tự động di chuyển dữ liệu (Auto-migration) qua `src/lib/ensureUserSchema.ts`.

### [x] PHẦN 3: NÂNG CẤP TẦNG XÁC THỰC & CONTEXT (AccessContext)
- `src/lib/AccessContext.tsx`: Cung cấp đầy đủ các cờ `isSuperAdmin`, `canManageCommunity`, `canManageFinance`, `canManageModule()`, `canEditClan`, `canEditTree`, `canEditPerson`, `canDeletePerson`.
- `src/app/api/access/route.ts`: Xác thực dựa trên bảng `User`, tự động tính toán phạm vi quyền hạn và danh sách hồ sơ được chỉnh sửa.
- `src/components/ui/AppShell.tsx`: Bảo vệ đường dẫn (Route Guards) và lưu phiên đăng nhập `sessionStorage`.

### [x] PHẦN 4: GIAO DIỆN QUẢN LÝ BỔ NHIỆM (DELEGATION UI)
- Trang `/clan` (`src/app/clan/page.tsx`):
  - **Quản lý Tài khoản Ứng dụng:** Xem danh sách, tạo tài khoản mới (SĐT, mật khẩu, họ tên, vai trò, liên kết phả hệ), xóa tài khoản.
  - **Bổ nhiệm Quản trị viên Phân hệ:** Gán tài khoản phụ trách nhóm Cộng đồng, Tài chính, Giải trí.
  - **Quản lý Bật / Tắt Modules:** Bật/tắt linh hoạt các tính năng của dòng họ.

### [/] PHẦN 5: LỘ TRÌNH TRIỂN KHAI (5 BƯỚC)
- [x] Bước 1: Thiết kế CSDL & Tách bảng `User` - `Person`.
- [x] Bước 2: Nâng cấp API Access & AccessContext.
- [x] Bước 3: Giao diện Bổ nhiệm Quản trị & Quản lý Tài khoản tại `/clan`.
- [x] Bước 4: Tích hợp Phân hệ Tài chính & Quỹ (`/funds`, `/transactions`).
- [ ] Bước 5: Xây dựng Phân hệ Giải trí (`/games/kinship`, `/games/quiz`).

---

## II. CÁC HẠNG MỤC CẦN LÀM TIẾP THEO (NEXT ACTIONS)

### 1. Tích hợp Phân hệ Tài chính & Quỹ họ (`/funds`, `/transactions`)
- **Nguồn:** Kế thừa logic và components từ dự án `group-fund-manager`.
- **Nội dung:**
  - Trang danh sách các quỹ họ (Quỹ thường niên, Quỹ khuyến học, Quỹ tu bổ từ đường).
  - Tích hợp VietQR động: Tự động sinh mã QR có kèm nội dung chuyển khoản theo cú pháp `[Tên người đóng] dong quy [Tên quỹ]`.
  - Sổ cái thu - chi: Ghi nhận phiếu thu/chi, phân loại, đính kèm hóa đơn chứng từ.
  - Phân quyền: Chỉ Super Admin hoặc tài khoản có `canManageFinance` mới được duyệt thu/chi.

### 2. Xây dựng Công cụ Tra cứu xưng hô gia phả (`/games/kinship`)
- **Nội dung:**
  - Giao diện chọn 2 thành viên A và B trên cây gia phả.
  - Thuật toán tìm đường đi phả hệ (LCA - Lowest Common Ancestor), so sánh thế hệ, nhánh anh/em để suy ra vai vế thuần Việt:
    - Bác, Chú, Cô, Cậu, Dì, Thím, Thím họ...
    - Anh/Chị em họ theo vai vế chi trên / chi dưới.

### 3. Xây dựng Mini-game Đố vui phả hệ (`/games/quiz`)
- **Nội dung:**
  - Sinh câu hỏi trắc nghiệm tự động từ dữ liệu gia phả (VD: "Cụ Đỗ Văn X là đời thứ mấy?", "Ai là cụ tổ đời thứ 1?").
  - Phục vụ con cháu thế hệ trẻ tìm hiểu cội nguồn dòng họ.

### 4. Luồng Tự đăng ký & "Nhận hồ sơ" (Claim Profile)
- Cho phép người dùng tự đăng ký tài khoản bằng số điện thoại.
- Sau khi đăng nhập, hiển thị gợi ý chọn hồ sơ của mình trên cây gia phả để gửi yêu cầu Super Admin phê duyệt liên kết.

### 5. Kiểm thử & Commit Git
- Kiểm tra toàn bộ các luồng chức năng trên trình duyệt.
- Đóng gói các commit chuẩn hóa vào repository.
