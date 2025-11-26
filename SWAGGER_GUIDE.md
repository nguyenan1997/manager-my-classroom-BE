# Swagger API Documentation Guide

## 📚 Tổng quan

Dự án đã được tích hợp Swagger UI để xem và test API một cách trực quan.

## 🚀 Truy cập Swagger UI

Sau khi chạy server, truy cập:
```
http://localhost:3000/api-docs
```

## 📋 Các tính năng

### 1. **Xem tất cả API endpoints**
- Danh sách đầy đủ các endpoints được nhóm theo tags
- Mô tả chi tiết cho từng endpoint

### 2. **Test API trực tiếp**
- Click "Try it out" trên mỗi endpoint
- Điền thông tin vào form
- Click "Execute" để gửi request
- Xem response ngay lập tức

### 3. **Authentication**
- Click nút "Authorize" ở đầu trang
- Nhập JWT token: `Bearer YOUR_TOKEN`
- Token sẽ được tự động thêm vào các request cần authentication

## 📖 Các nhóm API

### **Authentication**
- `POST /api/auth/register` - Đăng ký admin/staff
- `POST /api/auth/login` - Đăng nhập
- `GET /api/auth/profile` - Xem profile (cần auth)

### **Parents**
- `POST /api/parents` - Tạo phụ huynh (Admin/Staff only)
- `GET /api/parents/{id}` - Xem thông tin phụ huynh

### **Students**
- `POST /api/students` - Tạo học sinh
- `GET /api/students/{id}` - Xem thông tin học sinh (bao gồm parent)

### **Classes**
- `POST /api/classes` - Tạo lớp học
- `GET /api/classes?day={weekday}` - Danh sách lớp (có thể filter theo ngày)
- `POST /api/classes/{class_id}/register` - Đăng ký học sinh vào lớp

### **Subscriptions**
- `POST /api/subscriptions` - Tạo gói học
- `PATCH /api/subscriptions/{id}/use` - Sử dụng buổi học
- `GET /api/subscriptions/{id}` - Xem trạng thái gói học

### **Health**
- `GET /api/health` - Kiểm tra server

## 🔐 Cách sử dụng Authentication trong Swagger

### Bước 1: Đăng ký hoặc đăng nhập
1. Mở endpoint `POST /api/auth/register` hoặc `POST /api/auth/login`
2. Click "Try it out"
3. Điền thông tin và click "Execute"
4. Copy token từ response

### Bước 2: Authorize
1. Click nút "Authorize" ở đầu trang Swagger
2. Nhập: `Bearer YOUR_TOKEN` (thay YOUR_TOKEN bằng token vừa copy)
3. Click "Authorize" và "Close"

### Bước 3: Sử dụng
- Tất cả các request cần authentication sẽ tự động có token trong header
- Token có hiệu lực trong suốt session (hoặc đến khi hết hạn)

## 📝 Ví dụ sử dụng

### 1. Tạo Admin đầu tiên
```
1. Mở POST /api/auth/register
2. Click "Try it out"
3. Điền:
   {
     "email": "admin@test.com",
     "password": "admin123",
     "role": "admin"
   }
4. Click "Execute"
5. Copy token từ response
```

### 2. Tạo Phụ huynh (cần token)
```
1. Authorize với token (bước trên)
2. Mở POST /api/parents
3. Click "Try it out"
4. Điền:
   {
     "name": "Nguyễn Văn A",
     "phone": "0123456789",
     "email": "parent@test.com"
   }
5. Click "Execute"
```

### 3. Tạo Học sinh
```
1. Mở POST /api/students
2. Click "Try it out"
3. Điền:
   {
     "name": "Nguyễn Văn B",
     "parent_id": 1,
     "dob": "2010-05-15",
     "gender": "male",
     "current_grade": "5"
   }
4. Click "Execute"
```

## 🎨 Giao diện Swagger

Swagger UI cung cấp:
- ✅ Giao diện đẹp, dễ sử dụng
- ✅ Schema validation tự động
- ✅ Response examples
- ✅ Error messages rõ ràng
- ✅ Try it out để test ngay

## 🔧 Cấu hình

Swagger được cấu hình trong `config/swagger.js`:
- OpenAPI 3.0.0
- Server URL: `http://localhost:3000`
- Security scheme: Bearer JWT
- Schemas được định nghĩa sẵn

## 📚 Documentation được viết ở đâu?

Tất cả Swagger documentation được viết bằng JSDoc comments trong các file routes:
- `routes/authRoutes.js`
- `routes/parentRoutes.js`
- `routes/studentRoutes.js`
- `routes/classRoutes.js`
- `routes/subscriptionRoutes.js`

## 💡 Tips

1. **Luôn Authorize trước khi test các endpoint cần auth**
2. **Xem Schema để biết format dữ liệu chính xác**
3. **Check Response examples để hiểu cấu trúc response**
4. **Sử dụng "Try it out" để test thực tế**

## 🐛 Troubleshooting

### Swagger không load?
- Kiểm tra server đã chạy chưa: `npm run dev`
- Kiểm tra port: `http://localhost:3000/api-docs`

### Token không hoạt động?
- Kiểm tra format: `Bearer TOKEN` (có space sau Bearer)
- Kiểm tra token còn hạn không
- Thử đăng nhập lại để lấy token mới

### Endpoint không hiển thị?
- Kiểm tra file route có JSDoc comments không
- Kiểm tra `config/swagger.js` có include đúng path không

---

**Chúc bạn sử dụng Swagger hiệu quả! 🎉**

