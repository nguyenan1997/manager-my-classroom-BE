# Quick Start Guide

## Khởi động nhanh với Docker (Khuyến nghị)

1. **Clone và vào thư mục project:**
```bash
cd BE
```

2. **Chạy với Docker Compose:**
```bash
docker-compose up -d
```

3. **Kiểm tra services:**
```bash
# Xem logs
docker-compose logs -f

# Kiểm tra backend
curl http://localhost:3000/api/health
```

4. **Truy cập giao diện web:**
Mở trình duyệt: http://localhost:3000

## Khởi động Local (không dùng Docker)

1. **Cài đặt PostgreSQL:**
- Cài đặt PostgreSQL 15+
- Tạo database: `createdb pv_lms`

2. **Cài đặt dependencies:**
```bash
npm install
```

3. **Tạo file .env:**
```bash
cp .env.example .env
# Chỉnh sửa .env với thông tin database của bạn
```

4. **Tạo database:**
```bash
# Tạo database (tables sẽ được tự động tạo bởi Sequelize khi server khởi động)
createdb pv_lms
```

5. **Chạy ứng dụng:**
```bash
# Development
npm run dev

# Production
npm start
```

## Test API nhanh

### 1. Đăng ký tài khoản
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "full_name": "Test User"
  }'
```

### 2. Đăng nhập
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

Lưu token từ response để dùng cho các request tiếp theo.

### 3. Tạo học sinh
```bash
curl -X POST http://localhost:3000/api/students \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "full_name": "Nguyễn Văn A",
    "grade": "5",
    "school": "Trường ABC"
  }'
```

## Troubleshooting

### Lỗi kết nối database
- Kiểm tra PostgreSQL đang chạy: `pg_isready`
- Kiểm tra thông tin trong file `.env`
- Kiểm tra database đã được tạo chưa: `psql -U postgres -l | grep pv_lms`
- Database tables sẽ được tự động tạo bởi Sequelize khi server khởi động lần đầu

### Port đã được sử dụng
- Thay đổi PORT trong file `.env`
- Hoặc dừng service đang dùng port 3000

### Docker issues
- Kiểm tra Docker đang chạy: `docker ps`
- Xem logs: `docker-compose logs`
- Rebuild: `docker-compose up -d --build`

