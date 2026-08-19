Mô tả chi tiết dự án – Task Management System

Task Management System là một website quản lý công việc cá nhân và nhóm, cho phép người dùng tạo Project, mời thành viên, phân công công việc, theo dõi tiến độ và quản lý toàn bộ hoạt động của Task trong một hệ thống tập trung.

1. Authentication

Hệ thống cung cấp chức năng xác thực người dùng:

Đăng ký tài khoản bằng username, email và password.
Đăng nhập bằng email/password.
Đăng xuất.
Sử dụng JWT để xác thực người dùng.
Bảo vệ các API yêu cầu đăng nhập.
Phân quyền dựa trên vai trò trong Project.
2. User Management

Cho phép người dùng quản lý thông tin cá nhân:

Xem thông tin cá nhân.
Cập nhật username.
Cập nhật avatar.
Thay đổi password.
Sử dụng thông tin User khi được giao Task, comment hoặc thực hiện các hoạt động trong Project.
3. Project Management

Người dùng có thể tạo và quản lý các Project của mình:

Tạo Project.
Xem danh sách Project.
Xem chi tiết Project.
Cập nhật thông tin Project.
Xóa Project.
Mỗi Project có một Owner chịu trách nhiệm quản lý Project.

Ví dụ:

Project: Website bán hàng
Owner: Nguyễn Văn A
Description: Xây dựng website bán hàng online
4. Project Member Management

Owner có thể quản lý thành viên trong Project:

Mời User tham gia Project.
Xem danh sách thành viên.
Xóa thành viên khỏi Project.
Quản lý role của thành viên.
Các role có thể gồm:
OWNER
ADMIN
MEMBER

Khi giao Task, hệ thống kiểm tra người được giao phải là thành viên của Project.

5. Task Management

Đây là chức năng chính của hệ thống.

Người dùng có quyền có thể:

Tạo Task.
Xem Task.
Cập nhật Task.
Xóa Task.
Giao Task cho thành viên.

Mỗi Task bao gồm:

Thuộc tính	Mô tả
Title	Tên Task
Description	Mô tả công việc
Status	Todo / Doing / Done
Priority	Low / Medium / High
Due Date	Deadline
Assignee	Người được giao
Project	Project mà Task thuộc về

Ví dụ:

Task: Implement Login API
Description: Xây dựng API đăng nhập bằng JWT
Status: DOING
Priority: HIGH
Due Date: 20/08/2026
Assignee: Nguyễn Văn B
6. Task Board

Hệ thống cung cấp giao diện Kanban Board để theo dõi tiến độ:

┌──────────┐    ┌──────────┐    ┌──────────┐
│   TODO   │    │  DOING   │    │   DONE   │
├──────────┤    ├──────────┤    ├──────────┤
│ Task A   │    │ Task C   │    │ Task E   │
│ Task B   │    │ Task D   │    │ Task F   │
└──────────┘    └──────────┘    └──────────┘

Người dùng có thể kéo thả Task giữa các cột.

Ví dụ:

TODO → DOING → DONE

Khi kéo Task sang cột khác, hệ thống cập nhật status của Task.

7. Task Label / Tag

Cho phép phân loại Task bằng Label/Tag.

Ví dụ:

[BUG]      [FEATURE]      [URGENT]      [BACKEND]

Một Task có thể có nhiều Label.

Ví dụ:

Task: Fix Login Bug


Labels:
[BUG] [URGENT] [BACKEND]

Có thể tìm kiếm hoặc filter Task theo Label.

8. Task Comment

Cho phép thành viên trao đổi trực tiếp trong Task:

Task: Implement Payment API


Nguyễn A:
API đã hoàn thành phần xử lý thanh toán.


Nguyễn B:
Đã test chưa?


Nguyễn A:
Đã test trên môi trường development.

Các chức năng:

Thêm Comment.
Sửa Comment.
Xóa Comment.
Hiển thị người comment.
Hiển thị thời gian comment.
9. Task Activity / History

Hệ thống lưu lại lịch sử thay đổi của Task.

Ví dụ:

10:00 - Nguyễn A tạo Task
10:15 - Nguyễn A assign Task cho Nguyễn B
11:30 - Nguyễn B đổi Priority: Medium → High
13:00 - Nguyễn B đổi Status: Todo → Doing
16:30 - Nguyễn B đổi Status: Doing → Done

Điều này giúp người dùng biết ai đã làm gì và Task đã thay đổi như thế nào.

10. Task Attachment

Cho phép thành viên đính kèm file vào Task.

Ví dụ:

Task: Design Database


Attachments:
📄 database-design.pdf
📄 api-documentation.docx
🖼 database-erd.png

Chức năng:

Upload file.
Xem file.
Download file.
Xóa file.
Lưu thông tin file và URL trong database.

File thực tế có thể lưu trên Cloudinary, AWS S3 hoặc dịch vụ lưu trữ tương tự; database chỉ lưu metadata và URL.

11. Search & Filter Task

Cho phép người dùng tìm kiếm và lọc Task.

Search:

Search: "Login"

Filter theo:

Status.
Priority.
Assignee.
Label.
Due Date.

Ví dụ:

Search: API
Status: DOING
Priority: HIGH
Assignee: Nguyễn Văn B

Hệ thống chỉ hiển thị những Task phù hợp.

12. Dashboard

Dashboard cung cấp tổng quan về tiến độ Project.

Ví dụ:

┌──────────────┐
│ Total Tasks  │
│      20      │
└──────────────┘


┌──────────────┐
│ Todo         │
│       8      │
└──────────────┘


┌──────────────┐
│ Doing        │
│       5      │
└──────────────┘


┌──────────────┐
│ Done         │
│       7      │
└──────────────┘

Dashboard có thể thống kê:

Tổng số Task.
Số Task Todo.
Số Task Doing.
Số Task Done.
Có thể mở rộng thống kê theo Member, Priority hoặc Project.