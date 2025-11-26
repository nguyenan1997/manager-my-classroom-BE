# Phân quyền trong hệ thống

## 👥 Roles

### **Admin**
- Quyền cao nhất
- Có thể làm mọi thứ mà Staff có thể làm
- **Đặc quyền:**
  - ✅ Tạo, xem, sửa, xóa Staff accounts
  - ✅ Quản lý tất cả dữ liệu trong hệ thống

### **Staff**
- Nhân viên quản lý
- Có hầu hết quyền giống Admin
- **Hạn chế:**
  - ❌ Không thể tạo/sửa/xóa Staff accounts
  - ❌ Không thể quản lý User accounts (chỉ Admin mới có quyền này)

---

## 🔐 Phân quyền chi tiết

### **1. Authentication & User Management**

| Action | Admin | Staff |
|--------|-------|-------|
| Đăng ký Admin đầu tiên | ✅ (chỉ lần đầu) | ❌ |
| Đăng nhập | ✅ | ✅ |
| Xem profile | ✅ | ✅ |
| **Tạo Staff** | ✅ | ❌ |
| **Xem danh sách Users** | ✅ | ❌ |
| **Xem User by ID** | ✅ | ❌ |
| **Sửa User** | ✅ | ❌ |
| **Xóa User** | ✅ | ❌ |

### **2. Parents Management**

| Action | Admin | Staff |
|--------|-------|-------|
| Tạo Parent | ✅ | ✅ |
| Xem Parent by ID | ✅ | ✅ |

### **3. Students Management**

| Action | Admin | Staff |
|--------|-------|-------|
| Tạo Student | ✅ | ✅ |
| Xem Student by ID | ✅ | ✅ |

### **4. Classes Management**

| Action | Admin | Staff |
|--------|-------|-------|
| Tạo Class | ✅ | ✅ |
| Xem danh sách Classes | ✅ | ✅ |
| Đăng ký Student vào Class | ✅ | ✅ |

### **5. Subscriptions Management**

| Action | Admin | Staff |
|--------|-------|-------|
| Tạo Subscription | ✅ | ✅ |
| Sử dụng buổi học | ✅ | ✅ |
| Xem Subscription | ✅ | ✅ |

---

## 📋 Luồng hoạt động

### **Bước 1: Tạo Admin đầu tiên**
```
POST /api/auth/register
{
  "email": "admin@school.com",
  "password": "admin123",
  "role": "admin"
}
→ Chỉ hoạt động nếu chưa có admin nào trong hệ thống
```

### **Bước 2: Admin tạo Staff**
```
POST /api/users
Authorization: Bearer ADMIN_TOKEN
{
  "email": "staff@school.com",
  "password": "staff123"
}
→ Admin tạo tài khoản staff
```

### **Bước 3: Staff đăng nhập**
```
POST /api/auth/login
{
  "email": "staff@school.com",
  "password": "staff123"
}
→ Staff nhận token
```

### **Bước 4: Staff làm việc**
```
Staff có thể:
- Tạo Parent: POST /api/parents (với token)
- Tạo Student: POST /api/students
- Tạo Class: POST /api/classes (với token)
- Đăng ký vào lớp: POST /api/classes/:id/register
- Tạo Subscription: POST /api/subscriptions
- Sử dụng buổi học: PATCH /api/subscriptions/:id/use

Staff KHÔNG thể:
- Tạo Staff khác: POST /api/users ❌
- Xem danh sách Users: GET /api/users ❌
- Sửa/Xóa Users: PUT/DELETE /api/users/:id ❌
```

---

## 🛡️ Bảo vệ Routes

### **Routes chỉ Admin:**
- `GET /api/users` - Xem danh sách users
- `GET /api/users/:id` - Xem user by ID
- `POST /api/users` - Tạo staff
- `PUT /api/users/:id` - Sửa user
- `DELETE /api/users/:id` - Xóa user

### **Routes Admin/Staff:**
- `POST /api/parents` - Tạo parent
- `POST /api/classes` - Tạo class

### **Routes Public (không cần auth):**
- `POST /api/students` - Tạo student
- `GET /api/students/:id` - Xem student
- `GET /api/parents/:id` - Xem parent
- `GET /api/classes` - Xem danh sách classes
- `POST /api/classes/:id/register` - Đăng ký vào lớp
- `POST /api/subscriptions` - Tạo subscription
- `PATCH /api/subscriptions/:id/use` - Sử dụng buổi
- `GET /api/subscriptions/:id` - Xem subscription

---

## ⚠️ Lưu ý quan trọng

1. **Admin đầu tiên:**
   - Chỉ có thể tạo qua `/api/auth/register` khi chưa có admin nào
   - Sau khi có admin, endpoint này chỉ cho phép tạo admin (nhưng sẽ báo lỗi nếu đã có admin)

2. **Tạo Staff:**
   - Chỉ Admin mới có thể tạo Staff qua `/api/users`
   - Staff không thể tự tạo Staff khác

3. **Bảo vệ Admin account:**
   - Không thể xóa Admin account
   - Không thể sửa Admin account (trừ chính admin đó)
   - Không thể thay đổi role thành admin

4. **Staff có quyền gần như Admin:**
   - Staff có thể tạo Parent, Class
   - Staff có thể quản lý Students, Subscriptions
   - Chỉ khác Admin ở việc quản lý Users

---

## 🧪 Test Scenarios

### **Scenario 1: Admin tạo Staff**
```bash
# 1. Admin đăng nhập
POST /api/auth/login
→ Nhận ADMIN_TOKEN

# 2. Admin tạo Staff
POST /api/users
Authorization: Bearer ADMIN_TOKEN
{
  "email": "staff1@school.com",
  "password": "staff123"
}
→ ✅ Thành công
```

### **Scenario 2: Staff cố tạo Staff khác**
```bash
# 1. Staff đăng nhập
POST /api/auth/login
→ Nhận STAFF_TOKEN

# 2. Staff cố tạo Staff khác
POST /api/users
Authorization: Bearer STAFF_TOKEN
{
  "email": "staff2@school.com",
  "password": "staff123"
}
→ ❌ 403 Forbidden - Insufficient permissions
```

### **Scenario 3: Staff tạo Class**
```bash
POST /api/classes
Authorization: Bearer STAFF_TOKEN
{
  "name": "Lớp Toán 5",
  "subject": "Toán",
  "day_of_week": "Monday",
  "time_slot": "18:00-19:30"
}
→ ✅ Thành công (Staff có quyền tạo class)
```

---

## 📝 Tóm tắt

✅ **Admin có thể:**
- Quản lý Staff (CRUD)
- Tạo Parent, Class
- Quản lý tất cả dữ liệu

✅ **Staff có thể:**
- Tạo Parent, Class
- Quản lý Students, Subscriptions
- Làm mọi thứ trừ quản lý Users

❌ **Staff KHÔNG thể:**
- Tạo/sửa/xóa Staff
- Xem danh sách Users
- Quản lý User accounts

