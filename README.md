# PV LMS Backend

Backend API cho hệ thống quản lý học sinh - phụ huynh với chức năng quản lý lớp học và subscription (gói học).

## 🚀 Quick Start

### Yêu cầu
- Node.js >= 18
- PostgreSQL >= 15
- npm hoặc yarn

### Cài đặt và chạy

1. **Cài đặt dependencies:**
```bash
npm install
```

2. **Tạo file `.env` từ `.env.example`:**
```bash
cp .env.example .env
```

3. **Cấu hình database trong file `.env`:**
```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=manager_class
DB_USER=postgres
DB_PASSWORD=postgres

JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d
```

4. **Tạo database PostgreSQL:**
```bash
# Với psql
createdb manager_class

# Hoặc với SQL
psql -U postgres
CREATE DATABASE manager_class;
```

5. **Chạy ứng dụng:**
```bash
# Development mode (tự động reload khi có thay đổi)
npm run dev

# Production mode
npm start
```

Server sẽ chạy tại: `http://localhost:3000`

## 📚 API Documentation

Sau khi chạy server, truy cập Swagger UI tại:
```
http://localhost:3000/api-docs
```

## 🔐 Authentication

### Tạo tài khoản Admin đầu tiên:
```bash
POST /api/auth/register
{
  "email": "admin@example.com",
  "password": "password123",
  "role": "admin"
}
```

### Đăng nhập:
```bash
POST /api/auth/login
{
  "email": "admin@example.com",
  "password": "password123"
}
```

Response sẽ trả về JWT token, sử dụng token này trong header:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

## 👥 Roles & Permissions

- **Admin**: Toàn quyền quản lý hệ thống
- **Staff**: Quản lý parents/students/classes được giao, không thể quản lý staff khác
- **Parent**: Quản lý con cái của mình, đăng ký gói học, xem lớp học

## 📋 API Endpoints chính

### Authentication
- `POST /api/auth/register` - Đăng ký admin đầu tiên
- `POST /api/auth/login` - Đăng nhập (Admin/Staff)
- `POST /api/auth/parent/register` - Đăng ký tài khoản parent
- `POST /api/auth/parent/login` - Đăng nhập parent
- `GET /api/auth/profile` - Lấy thông tin profile

### Parents
- `GET /api/parents` - Danh sách parents (Admin/Staff)
- `POST /api/parents` - Tạo parent (Admin/Staff)
- `GET /api/parents/:id` - Chi tiết parent
- `PUT /api/parents/:id` - Sửa parent
- `DELETE /api/parents/:id` - Xóa parent
- `GET /api/parents/my-children` - Danh sách con của parent đang đăng nhập

### Students
- `GET /api/students` - Danh sách students
- `POST /api/students` - Tạo student (Admin/Staff)
- `GET /api/students/:id` - Chi tiết student
- `PUT /api/students/:id` - Sửa student
- `DELETE /api/students/:id` - Xóa student
- `GET /api/students/:student_id/classes` - Danh sách lớp của student

### Classes
- `GET /api/classes` - Danh sách lớp học
- `POST /api/classes` - Tạo lớp (Admin/Staff)
- `PUT /api/classes/:id` - Sửa lớp (Admin/Staff)
- `DELETE /api/classes/:id` - Xóa lớp (Admin/Staff)
- `POST /api/classes/:class_id/register` - Đăng ký student vào lớp

### Subscriptions
- `GET /api/subscriptions` - Danh sách gói học
- `GET /api/subscriptions?student_id=xxx` - Lọc theo student
- `POST /api/subscriptions` - Tạo gói học (Admin/Staff/Parent)
- `GET /api/subscriptions/:id` - Chi tiết gói học
- `PUT /api/subscriptions/:id` - Sửa gói học
- `DELETE /api/subscriptions/:id` - Xóa gói học
- `PATCH /api/subscriptions/:id/use` - Đánh dấu đã dùng 1 buổi

### Users (Admin only)
- `GET /api/users` - Danh sách users (Admin)
- `POST /api/users` - Tạo staff (Admin)
- `GET /api/users/:id` - Chi tiết user
- `PUT /api/users/:id` - Sửa user
- `DELETE /api/users/:id` - Xóa user

## 🐳 Docker (Optional)

### Chạy với Docker Compose:
```bash
docker-compose up -d
```

### Xem logs:
```bash
docker-compose logs -f
```

### Dừng services:
```bash
docker-compose down
```

## 🗄️ Database

Hệ thống sử dụng **Sequelize ORM** với PostgreSQL. Database sẽ tự động được tạo khi server khởi động lần đầu.

### Tables:
- `users` - Tài khoản Admin/Staff
- `parents` - Thông tin phụ huynh
- `students` - Thông tin học sinh
- `classes` - Thông tin lớp học
- `class_registrations` - Đăng ký học sinh vào lớp
- `subscriptions` - Gói học (tổng số buổi, đã dùng, còn lại)

## 📝 Response Format

Tất cả API responses đều có format:
```json
{
  "success": true,
  "message": "Success message",
  "data": { ... }
}
```

## 🛠️ Development

### Scripts
- `npm start` - Chạy production server
- `npm run dev` - Chạy development server với nodemon (tự động reload)

### Database Sync
Database sẽ tự động sync khi server khởi động. Tables sẽ được tạo tự động nếu chưa tồn tại.

## 📖 Ví dụ sử dụng

### 1. Tạo Admin đầu tiên
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123"
  }'
```

### 2. Đăng nhập và lấy token
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123"
  }'
```

### 3. Tạo Parent (với token)
```bash
curl -X POST http://localhost:3000/api/parents \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Nguyễn Văn A",
    "email": "parent@example.com",
    "phone": "0123456789"
  }'
```

### 4. Tạo Student
```bash
curl -X POST http://localhost:3000/api/students \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Nguyễn Văn B",
    "parent_id": "parent-uuid",
    "dob": "2010-05-15",
    "gender": "male",
    "current_grade": "5"
  }'
```

### 5. Tạo Subscription
```bash
curl -X POST http://localhost:3000/api/subscriptions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "student_id": "student-uuid",
    "package_name": "Gói 20 buổi",
    "total_sessions": 20,
    "start_date": "2024-01-01",
    "end_date": "2024-06-30"
  }'
```

## 📞 Health Check

```bash
GET http://localhost:3000/api/health
```

## License

ISC
