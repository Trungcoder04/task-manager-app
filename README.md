# 🚀 Task Manager App - Hệ Thống Quản Lý Công Việc & Dự Án Chuyên Nghiệp

![Task Manager App](https://img.shields.io/badge/Status-Completed-success?style=for-the-badge)
![Tech Stack](https://img.shields.io/badge/Stack-React%20%7C%20NestJS%20%7C%20MySQL%20%7C%20Prisma-indigo?style=for-the-badge)

Ứng dụng **Task Manager App** là một giải pháp quản lý công việc và dự án hiện đại, xây dựng theo mô hình Client - Server với giao diện **Kanban Board** tương tác kéo thả mượt mà, hệ thống thống kê **Dashboard** trực quan và tính năng thảo luận/tệp đính kèm thời gian thực.

---

## 🌟 Tính Năng Nổi Bật (Features)

### 📊 1. Trang Thống Kê Tổng Quan (Dashboard Analytics)
* **Chỉ số thời gian thực (Real-time Stats):** Thống kê tổng số công việc, số lượng công việc theo từng trạng thái (`TODO`, `DOING`, `DONE`), tỷ lệ phần trăm hoàn thành dự án (`%`).
* **Phân bổ Mức độ Ưu tiên (Priority Breakdown):** Thống kê công việc theo các mức độ Cao (High), Trung bình (Medium), Thấp (Low).
* **Cảnh báo Hạn chót Thông minh (Smart Deadline Alerts):**
  * 🔴 **`Quá hạn`**: Tự động nhận diện công việc trễ hạn, làm nổi bật với thẻ đỏ và background cảnh báo.
  * 🟡 **`Sắp đến hạn`**: Nhận diện công việc sắp đến hạn trong vòng 7 ngày tới với thẻ vàng cam.
* **Tương tác trực tiếp:** Nhấp xem/chỉnh sửa chi tiết công việc ngay trên Dashboard mà không bị ngắt quãng chuyển tab.

### 📋 2. Bảng Kanban Kéo Thả (Interactive Kanban Board)
* Quản lý công việc theo các cột trạng thái: **Cần làm (TODO)**, **Đang làm (DOING)**, **Đã hoàn thành (DONE)**.
* Kéo thả công việc mượt mà giữa các cột với phản hồi giao diện tức thì.
* Tìm kiếm công việc theo từ khóa tiêu đề/mô tả.
* Lọc công việc linh hoạt theo **Độ ưu tiên**, **Người thực hiện** hoặc **Nhãn dán**.

### 📝 3. Quản Lý Chi Tiết Công Việc (Task Detail & Metadata)
* **Tạo & Cập nhật Task:** Tiêu đề, Mô tả kỹ thuật, Hạn chót (Due Date), Độ ưu tiên, Người thực hiện (Assignee).
* **Kiểm tra ràng buộc Người thực hiện:** Tự động xác thực Assignee phải thuộc danh sách thành viên của Dự án.
* **Giao diện Hộp thoại Xác nhận Tùy chỉnh (ConfirmModal):** Thay thế hoàn toàn popup mặc định thô kệch của trình duyệt bằng ConfirmModal cao cấp thiết kế Glassmorphism mượt mà.

### 🏷️ 4. Quản Lý Nhãn Dán (Label & Tag System)
* Tạo nhãn dán tùy chỉnh tên và mã màu HEX riêng biệt.
* Chọn/gỡ nhãn trực quan trong Modal Chi tiết Công việc.
* Hiển thị nhãn dán màu sắc trên từng thẻ Task ngoài Bảng Kanban.
* Lưu trữ mối quan hệ nhiều-nhiều vào bảng `TaskLabels` trong MySQL.

### 💬 5. Thảo Luận & Đính Kèm Tệp (Comments & Attachments)
* **Bình luận (Task Comments):** Thảo luận tiến độ trực tiếp trong từng Task, hiển thị Avatar, Tên người dùng, Thời gian gửi và hỗ trợ chính chủ xóa bình luận.
* **Đính kèm Tệp (Task Attachments):** Tải lên tệp tài liệu/hình ảnh đính kèm từ thiết bị hoặc đường dẫn URL.

### 👥 6. Quản Lý Dự Án & Thành Viên (Project & Member Management)
* Tạo dự án mới, cập nhật thông tin hoặc xóa dự án.
* Thêm/xóa thành viên vào dự án và phân quyền vai trò (Owner / Member).

---

## 🛠️ Công Nghệ Sử Dụng (Tech Stack)

### **Frontend (Client)**
* **Core:** React 18, TypeScript, Vite.
* **Styling:** CSS Vanilla (Design Tokens, Glassmorphism, Theme Tailored Variables, Animations).
* **State & HTTP Client:** Axios, React Custom Hooks (`useTasks`, `useProjects`, `useAuth`).
* **UI Components:** Custom Modal, ConfirmModal, Toast Notification, Avatar Fallback state.

### **Backend (Server)**
* **Framework:** NestJS (Node.js framework mạnh mẽ).
* **Language:** TypeScript.
* **Database & ORM:** MySQL 8.0, Prisma ORM.
* **Object Storage:** MinIO (Lưu trữ file đính kèm).
* **Data Validation:** `class-validator`, `class-transformer`.

---

## 🗄️ Cấu Trúc Cơ Sở Dữ Liệu (Database Schema)

CSDL bao gồm 8 bảng chính được quản lý qua Prisma ORM:

```mermaid
erDiagram
    Users ||--o{ Projects : "owns"
    Users ||--o{ ProjectMembers : "belongs_to"
    Users ||--o{ TaskComments : "writes"
    Projects ||--o{ Tasks : "contains"
    Projects ||--o{ Labels : "has"
    Tasks ||--o{ TaskLabels : "tagged_with"
    Labels ||--o{ TaskLabels : "belongs_to"
    Tasks ||--o{ TaskComments : "has"
    Tasks ||--o{ TaskAttachments : "has"
```

1. **`Users`**: Lưu thông tin tài khoản người dùng (`id`, `username`, `fullName`, `email`, `avatar`).
2. **`Projects`**: Lưu danh sách dự án (`id`, `name`, `description`, `ownerId`).
3. **`ProjectMembers`**: Bảng trung gian thành viên dự án (`projectId`, `userId`, `role`).
4. **`Tasks`**: Lưu trữ công việc (`id`, `projectId`, `title`, `description`, `status`, `priority`, `dueDate`, `assigneeId`).
5. **`Labels`**: Danh mục nhãn dán (`id`, `projectId`, `name`, `colorCode`).
6. **`TaskLabels`**: Bảng trung gian lưu mối quan hệ giữa Task và Label (`taskId`, `labelId`).
7. **`TaskComments`**: Lưu bình luận trong Task (`id`, `taskId`, `userId`, `content`, `createdAt`).
8. **`TaskAttachments`**: Lưu tệp đính kèm (`id`, `taskId`, `uploaderId`, `fileName`, `fileUrl`, `uploadedAt`).

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Dự Án (Installation & Setup)

### 📋 Yêu Cầu Tiền Đề (Prerequisites)
* **Node.js**: v18.x trở lên
* **npm**: v9.x trở lên
* **MySQL Database**: Đang chạy tại `localhost:3306`
* *(Tùy chọn)* **MinIO Server**: Đang chạy tại `localhost:9000` (nếu dùng đính kèm file MinIO)

---

### 1️⃣ Thiết Lập Backend (NestJS Server)

1. Mở cửa sổ Terminal và di chuyển vào thư mục Backend:
   ```bash
   cd task-manager-app-be
   ```

2. Cài đặt các gói phụ thuộc (Dependencies):
   ```bash
   npm install
   ```

3. Thêm cấu hình biến môi trường tệp `.env`:
   ```env
   DATABASE_URL="mysql://root:123456@localhost:3306/TaskManagerDB"
   PORT=3000
   ```

4. Đồng bộ CSDL MySQL & Khởi tạo dữ liệu mẫu (Seed Data):
   ```bash
   npx prisma db push
   npx prisma db seed
   ```

5. Khởi chạy Backend Server ở chế độ phát triển:
   ```bash
   npm run start:dev
   ```
   👉 Backend API sẽ hoạt động tại: `http://localhost:3000/api`

---

### 2️⃣ Thiết Lập Frontend (React Client)

1. Mở một cửa sổ Terminal mới và di chuyển vào thư mục Frontend:
   ```bash
   cd task-manager-app-fe
   ```

2. Cài đặt các gói phụ thuộc:
   ```bash
   npm install
   ```

3. Khởi chạy Frontend Development Server:
   ```bash
   npm run dev
   ```
   👉 Ứng dụng Web sẽ hoạt động tại: `http://localhost:5173`

---

## 📡 Danh Sách REST APIs Tham Chiếu (API Endpoints Summary)

| Thao tác | HTTP Method | Endpoint | Mô tả |
| :--- | :--- | :--- | :--- |
| **Tasks** | `POST` | `/api/tasks` | Tạo công việc mới |
| **Tasks** | `GET` | `/api/projects/:projectId/tasks` | Lấy danh sách công việc của dự án |
| **Tasks** | `GET` | `/api/tasks/:id` | Xem chi tiết 1 công việc |
| **Tasks** | `PUT` | `/api/tasks/:id` | Cập nhật công việc (Status, Assignee, Labels) |
| **Tasks** | `DELETE` | `/api/tasks/:id` | Xóa công việc |
| **Dashboard** | `GET` | `/api/projects/:projectId/dashboard` | Lấy số liệu thống kê Dashboard |
| **Labels** | `GET` | `/api/projects/:projectId/labels` | Lấy danh sách nhãn dán dự án |
| **Labels** | `POST` | `/api/projects/:projectId/labels` | Tạo nhãn dán mới |
| **Labels** | `DELETE` | `/api/projects/:projectId/labels/:id` | Xóa nhãn dán |
| **Comments**| `GET` | `/api/tasks/:id/comments` | Lấy danh sách bình luận của Task |
| **Comments**| `POST` | `/api/tasks/:id/comments` | Thêm bình luận mới |
| **Comments**| `DELETE` | `/api/tasks/:id/comments/:commentId` | Xóa bình luận |

---

## 🤝 Đóng Góp & Phát Triển (Contribution)

Dự án được hoàn thiện với tinh thần lập trình **Pair Programming**. 

Mọi thắc mắc hoặc đóng góp cải tiến xin vui lòng gửi Pull Request hoặc tạo Issue mới trên Repository!