const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');

async function seed() {
  console.log('Connecting to Railway Cloud MySQL DB...');
  const conn = await mysql.createConnection('mysql://root:jEWUWrInSjAJeapQsyaeaIMwrpSzjuXL@sakura.proxy.rlwy.net:47542/railway');
  const pass = await bcrypt.hash('123456', 10);

  // 1. Users
  console.log('Seeding Users...');
  await conn.query(`
    INSERT INTO Users (Id, Username, Password, FullName, Email, Role, Status, CreatedAt)
    VALUES 
      (1, 'dev123', '${pass}', 'Trần Văn Trung', 'dev@gmail.com', 1, 1, NOW()),
      (2, 'videv', '${pass}', 'Lê Văn Vi', 'vi@gmail.com', 2, 1, NOW()),
      (3, 'annguyen', '${pass}', 'Nguyễn Văn An', 'an@gmail.com', 2, 1, NOW())
    ON DUPLICATE KEY UPDATE Password = VALUES(Password), Status = 1, Role = VALUES(Role);
  `);

  // 2. Projects
  console.log('Seeding Projects...');
  await conn.query(`
    INSERT INTO Projects (Id, Name, Description, OwnerId, CreatedAt)
    VALUES 
      (1, 'Website E-Commerce Nông Sản Việt', 'Hệ thống thương mại điện tử chuyên cung cấp nông sản sạch xuất khẩu chất lượng cao.', 1, NOW()),
      (2, 'Ứng Dụng SmartHR Management', 'Giải pháp quản lý nhân sự, chấm công GPS và tính lương tự động cho doanh nghiệp.', 1, NOW()),
      (3, 'Nâng Cấp Task Manager v2.0', 'Dự án tối ưu hóa hiệu năng, phân quyền RBAC và giao diện Glassmorphic UI.', 1, NOW())
    ON DUPLICATE KEY UPDATE Name = VALUES(Name), Description = VALUES(Description);
  `);

  // 3. ProjectMembers
  console.log('Seeding ProjectMembers...');
  await conn.query(`
    INSERT INTO ProjectMembers (ProjectId, UserId, Role, JoinedAt)
    VALUES 
      (1, 1, 1, NOW()),
      (1, 2, 2, NOW()),
      (1, 3, 3, NOW()),
      (2, 1, 1, NOW()),
      (2, 2, 3, NOW()),
      (3, 1, 1, NOW()),
      (3, 3, 2, NOW())
    ON DUPLICATE KEY UPDATE Role = VALUES(Role);
  `);

  // 4. Labels
  console.log('Seeding Labels...');
  await conn.query(`
    INSERT INTO Labels (Id, ProjectId, Name, ColorCode)
    VALUES 
      (1, 1, 'FEATURE', '#8b5cf6'),
      (2, 1, 'UI/UX DESIGN', '#ec4899'),
      (3, 1, 'BACKEND', '#3b82f6'),
      (4, 1, 'DEVOPS', '#10b981'),
      (5, 1, 'URGENT BUG', '#ef4444')
    ON DUPLICATE KEY UPDATE Name = VALUES(Name), ColorCode = VALUES(ColorCode);
  `);

  // 5. Tasks
  console.log('Seeding Tasks...');
  await conn.query(`
    INSERT INTO Tasks (Id, ProjectId, Title, Description, Status, Priority, DueDate, AssigneeId, OrderIndex, CreatedAt)
    VALUES 
      (1, 1, 'Thiết kế Mockup Giao diện Trang chủ', 'Xây dựng bản vẽ Figma cho trang chủ nông sản với tông màu xanh tươi sáng, hiện đại.', 4, 3, DATE_ADD(NOW(), INTERVAL 3 DAY), 2, 0, NOW()),
      (2, 1, 'Phát triển API Đăng nhập & Xác thực JWT', 'Viết API Login, Register sử dụng NestJS + Bcrypt mã hóa mật khẩu 10 rounds.', 4, 3, DATE_ADD(NOW(), INTERVAL 5 DAY), 1, 1, NOW()),
      (3, 1, 'Tích hợp Cổng thanh toán VNPay & ZaloPay', 'Kết nối API thanh toán trực tuyến VNPay Sandbox cho đơn hàng mua nông sản.', 2, 4, DATE_ADD(NOW(), INTERVAL 7 DAY), 1, 0, NOW()),
      (4, 1, 'Tối ưu hóa Tốc độ Tải trang (SEO & Performance)', 'Nén ảnh WebP, cài đặt Server-Side Caching và nén Gzip giúp tải trang dưới 1.5 giây.', 2, 2, DATE_ADD(NOW(), INTERVAL 10 DAY), 3, 1, NOW()),
      (5, 1, 'Viết Unit Test cho Module Quản lý Đơn hàng', 'Viết test coverage > 80% cho các hàm xử lý tính tổng tiền, giảm giá voucher.', 1, 2, DATE_ADD(NOW(), INTERVAL 12 DAY), 2, 0, NOW()),
      (6, 1, 'Cấu hình Docker & Tự động hóa CI/CD Deployment', 'Viết Dockerfile, cấu hình GitHub Actions tự động build và deploy lên Vercel/Render.', 3, 3, DATE_ADD(NOW(), INTERVAL 4 DAY), 1, 0, NOW())
    ON DUPLICATE KEY UPDATE Title = VALUES(Title), Description = VALUES(Description), Status = VALUES(Status), Priority = VALUES(Priority);
  `);

  console.log('🎉 SEED SAMPLE DATA TO RAILWAY CLOUD SUCCESSFUL!');
  await conn.end();
}

seed().catch(err => {
  console.error('SEED ERROR:', err);
  process.exit(1);
});
