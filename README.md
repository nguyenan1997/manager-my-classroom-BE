# PV LMS Backend

Backend API cho hệ thống quản lý học sinh - phụ huynh với chức năng quản lý lớp học và subscription (gói học).

## Tính năng

- ✅ Đăng ký và đăng nhập với JWT authentication
- ✅ Quản lý thông tin Học sinh - Phụ huynh
- ✅ Tạo và quản lý Lớp học
- ✅ Đăng ký học sinh vào lớp
- ✅ Quản lý Subscription (gói học) - theo dõi buổi đã dùng/còn lại
- ✅ RESTful API với cấu trúc MVC rõ ràng
- ✅ Docker support với docker-compose

## Cấu trúc Project

```
BE/
├── config/
│   └── database.js          # Sequelize database connection
├── models/                   # Sequelize models
│   ├── User.js
│   ├── Parent.js
│   ├── Student.js
│   ├── Class.js
│   ├── Subscription.js
│   ├── ClassEnrollment.js
│   └── index.js
├── controllers/              # Business logic
│   ├── authController.js
│   ├── studentController.js
│   ├── parentController.js
│   ├── classController.js
│   └── subscriptionController.js
├── middleware/
│   └── auth.js              # Authentication & Authorization
├── routes/                   # API routes
│   ├── authRoutes.js
│   ├── studentRoutes.js
│   ├── parentRoutes.js
│   ├── classRoutes.js
│   └── subscriptionRoutes.js
├── scripts/
│   ├── build.sh             # Build script
│   └── run.sh               # Run script
├── server.js                 # Entry point
├── package.json
├── Dockerfile
├── docker-compose.yml
└── README.md
```

## Database Schema

Project sử dụng **Sequelize ORM** để quản lý database. Schema được định nghĩa trong các model files trong thư mục `models/`.

### Tables:
- **users**: Thông tin đăng nhập (email, password, role)
- **parents**: Thông tin phụ huynh
- **students**: Thông tin học sinh
- **classes**: Thông tin lớp học
- **subscriptions**: Gói học (tổng số buổi, đã dùng, còn lại)
- **class_enrollments**: Đăng ký học sinh vào lớp

Database sẽ được tự động tạo khi khởi động server lần đầu thông qua Sequelize sync.

## Cài đặt

### Yêu cầu
- Node.js >= 18
- PostgreSQL >= 15
- Docker & Docker Compose (optional)

### Cài đặt Local

1. **Clone repository và cài đặt dependencies:**
```bash
npm install
```

2. **Tạo file .env từ .env.example:**
```bash
cp .env.example .env
```

3. **Cập nhật thông tin database trong .env:**
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pv_lms
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=your-super-secret-jwt-key
```

4. **Tạo database:**
```bash
# Tạo database (PostgreSQL sẽ tự động tạo tables khi server khởi động)
createdb pv_lms
```

5. **Chạy ứng dụng:**
```bash
# Development mode
npm run dev

# Production mode
npm start
```

### Cài đặt với Docker

1. **Build và chạy với Docker Compose:**
```bash
docker-compose up -d
```

2. **Xem logs:**
```bash
docker-compose logs -f
```

3. **Dừng services:**
```bash
docker-compose down
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Đăng ký tài khoản
- `POST /api/auth/login` - Đăng nhập
- `GET /api/auth/profile` - Lấy thông tin profile (cần auth)

### Students
- `GET /api/students` - Lấy danh sách học sinh
- `GET /api/students/:id` - Lấy thông tin học sinh
- `POST /api/students` - Tạo học sinh mới
- `PUT /api/students/:id` - Cập nhật học sinh
- `DELETE /api/students/:id` - Xóa học sinh

### Parents
- `GET /api/parents` - Lấy danh sách phụ huynh (admin only)
- `GET /api/parents/:id` - Lấy thông tin phụ huynh
- `PUT /api/parents/:id` - Cập nhật phụ huynh

### Classes
- `GET /api/classes` - Lấy danh sách lớp học
- `GET /api/classes/:id` - Lấy thông tin lớp học
- `POST /api/classes` - Tạo lớp học mới (admin only)
- `PUT /api/classes/:id` - Cập nhật lớp học (admin only)
- `DELETE /api/classes/:id` - Xóa lớp học (admin only)
- `POST /api/classes/:id/enroll` - Đăng ký học sinh vào lớp
- `POST /api/classes/:id/unenroll` - Hủy đăng ký

### Subscriptions
- `GET /api/subscriptions` - Lấy danh sách subscription
- `GET /api/subscriptions/:id` - Lấy thông tin subscription
- `GET /api/subscriptions/student/:student_id` - Lấy subscription theo học sinh
- `POST /api/subscriptions` - Tạo subscription mới
- `PUT /api/subscriptions/:id` - Cập nhật subscription (admin only)
- `POST /api/subscriptions/:id/use-session` - Sử dụng buổi học

## Ví dụ sử dụng API

### 1. Đăng ký
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "parent@example.com",
    "password": "password123",
    "full_name": "Nguyễn Văn A",
    "phone": "0123456789"
  }'
```

### 2. Đăng nhập
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "parent@example.com",
    "password": "password123"
  }'
```

### 3. Tạo học sinh (cần token)
```bash
curl -X POST http://localhost:3000/api/students \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "full_name": "Nguyễn Văn B",
    "date_of_birth": "2010-01-01",
    "grade": "5",
    "school": "Trường Tiểu học ABC"
  }'
```

### 4. Tạo lớp học (admin only)
```bash
curl -X POST http://localhost:3000/api/classes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{
    "name": "Lớp Toán 5",
    "subject": "Toán",
    "grade_level": "5",
    "max_students": 20,
    "start_date": "2024-01-01",
    "schedule_time": "18:00:00",
    "schedule_days": "Mon,Wed,Fri"
  }'
```

### 5. Tạo subscription
```bash
curl -X POST http://localhost:3000/api/subscriptions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "student_id": 1,
    "class_id": 1,
    "total_sessions": 20,
    "start_date": "2024-01-01"
  }'
```

### 6. Sử dụng buổi học
```bash
curl -X POST http://localhost:3000/api/subscriptions/1/use-session \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "sessions_to_use": 1
  }'
```

## Response Format

Tất cả API responses đều có format:

```json
{
  "success": true/false,
  "message": "Message description",
  "data": { ... }
}
```

## Authentication

Hầu hết các endpoints (trừ register, login, và một số GET public) yêu cầu authentication token.

Thêm header:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

## Roles

- **parent**: Phụ huynh - có thể quản lý học sinh của mình, xem và tạo subscription
- **admin**: Quản trị viên - có quyền truy cập tất cả chức năng

## Development

### Scripts
- `npm start` - Chạy production server
- `npm run dev` - Chạy development server với nodemon

### Database Migration
Schema được định nghĩa trong các Sequelize models trong thư mục `models/`. Database sẽ tự động được sync khi server khởi động. 

**Lưu ý:** 
- Sequelize sẽ tự động tạo tables nếu chưa tồn tại
- Để force sync (xóa và tạo lại tables), set `force: true` trong `models/index.js` (chỉ dùng trong development)

## CI/CD

Project bao gồm:
- `Dockerfile` cho containerization
- `docker-compose.yml` cho local development
- Scripts trong `scripts/` folder:
  - `build.sh` - Build script
  - `run.sh` - Run script
  - `init-db.sh` - Database initialization

## License

ISC

