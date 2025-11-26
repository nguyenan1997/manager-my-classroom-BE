# Giải thích ý đồ và luồng hoạt động của hệ thống

## 🎯 Mục đích của hệ thống

Đây là một hệ thống quản lý lớp học đơn giản cho phép:
- Phụ huynh đăng ký con vào các lớp học
- Quản lý gói học (subscription) - theo dõi số buổi đã học/còn lại
- Tránh trùng lịch học khi đăng ký

---

## 📊 Cấu trúc Database và ý đồ

### 1. **Bảng `parents` (Phụ huynh)**
```
Fields: id, name, phone, email
```

**Ý đồ:**
- Lưu thông tin liên hệ của phụ huynh
- Một phụ huynh có thể có nhiều con (students)
- Không có authentication → đây là thông tin cơ bản, không cần đăng nhập

**Ví dụ:**
```json
{
  "id": 1,
  "name": "Nguyễn Văn A",
  "phone": "0123456789",
  "email": "nguyenvana@email.com"
}
```

---

### 2. **Bảng `students` (Học sinh)**
```
Fields: id, name, dob, gender, current_grade, parent_id
```

**Ý đồ:**
- Lưu thông tin học sinh
- Mỗi học sinh thuộc về một phụ huynh (`parent_id`)
- Thông tin cần thiết để quản lý: tên, ngày sinh, giới tính, lớp hiện tại

**Ví dụ:**
```json
{
  "id": 1,
  "name": "Nguyễn Văn B",
  "dob": "2010-05-15",
  "gender": "male",
  "current_grade": "5",
  "parent_id": 1
}
```

**Mối quan hệ:**
- `parent_id` → `parents.id` (Many-to-One)
- Một phụ huynh có thể có nhiều con

---

### 3. **Bảng `classes` (Lớp học)**
```
Fields: id, name, subject, day_of_week, time_slot, teacher_name, max_students
```

**Ý đồ:**
- Lưu thông tin lớp học
- Quan trọng: `day_of_week` và `time_slot` để kiểm tra trùng lịch
- `max_students`: Giới hạn số học sinh trong lớp

**Ví dụ:**
```json
{
  "id": 1,
  "name": "Lớp Toán 5",
  "subject": "Toán",
  "day_of_week": "Monday",
  "time_slot": "18:00-19:30",
  "teacher_name": "Cô Lan",
  "max_students": 20
}
```

**Tại sao cần `day_of_week` và `time_slot`?**
- Để kiểm tra trùng lịch khi đăng ký
- Một học sinh không thể học 2 lớp cùng lúc

---

### 4. **Bảng `class_registrations` (Đăng ký lớp)**
```
Fields: id, class_id, student_id
```

**Ý đồ:**
- Junction table (bảng trung gian) để kết nối Student và Class
- Quan hệ Many-to-Many: Một học sinh có thể học nhiều lớp, một lớp có nhiều học sinh
- **Không có `status`** → Đơn giản, chỉ cần biết học sinh đã đăng ký lớp nào

**Ví dụ:**
```json
{
  "id": 1,
  "class_id": 1,
  "student_id": 1
}
```
→ Học sinh ID 1 đã đăng ký lớp ID 1

**Tại sao tách riêng bảng này?**
- Một học sinh có thể học nhiều lớp (Toán, Tiếng Anh, Văn...)
- Một lớp có nhiều học sinh
- Cần lưu lại lịch sử đăng ký

---

### 5. **Bảng `subscriptions` (Gói học)**
```
Fields: id, student_id, package_name, start_date, end_date, total_sessions, used_sessions
```

**Ý đồ:**
- Quản lý gói học của học sinh
- **Không liên kết với `class_id`** → Một gói học có thể dùng cho nhiều lớp
- Theo dõi số buổi: `total_sessions` (tổng), `used_sessions` (đã dùng)
- `remaining_sessions` = `total_sessions - used_sessions` (tính tự động)

**Ví dụ:**
```json
{
  "id": 1,
  "student_id": 1,
  "package_name": "Gói 20 buổi",
  "start_date": "2024-01-01",
  "end_date": "2024-06-30",
  "total_sessions": 20,
  "used_sessions": 5
}
```
→ Còn lại 15 buổi

**Tại sao không có `class_id`?**
- Một gói học có thể dùng cho nhiều lớp khác nhau
- Linh hoạt hơn: học sinh có thể dùng gói này cho lớp Toán, lớp Tiếng Anh...

---

## 🔄 Luồng hoạt động thực tế

### **Scenario 1: Phụ huynh đăng ký con vào lớp học**

```
Bước 1: Tạo phụ huynh
POST /api/parents
{
  "name": "Nguyễn Văn A",
  "phone": "0123456789",
  "email": "nguyenvana@email.com"
}
→ Nhận được parent_id = 1

Bước 2: Tạo học sinh
POST /api/students
{
  "name": "Nguyễn Văn B",
  "dob": "2010-05-15",
  "gender": "male",
  "current_grade": "5",
  "parent_id": 1
}
→ Nhận được student_id = 1

Bước 3: Tạo lớp học (Admin/System tạo)
POST /api/classes
{
  "name": "Lớp Toán 5",
  "subject": "Toán",
  "day_of_week": "Monday",
  "time_slot": "18:00-19:30",
  "teacher_name": "Cô Lan",
  "max_students": 20
}
→ Nhận được class_id = 1

Bước 4: Đăng ký học sinh vào lớp
POST /api/classes/1/register
{
  "student_id": 1
}
→ Hệ thống kiểm tra:
  - Học sinh đã đăng ký lớp này chưa? (tránh trùng)
  - Học sinh có lớp khác cùng thời gian không? (tránh trùng lịch)
  - Lớp còn chỗ không? (kiểm tra max_students)
→ Tạo record trong class_registrations

Bước 5: Mua gói học
POST /api/subscriptions
{
  "student_id": 1,
  "package_name": "Gói 20 buổi",
  "start_date": "2024-01-01",
  "end_date": "2024-06-30",
  "total_sessions": 20
}
→ Tạo subscription với used_sessions = 0
```

### **Scenario 2: Học sinh đi học và sử dụng buổi học**

```
Bước 1: Học sinh đến lớp học
→ Giáo viên/Admin đánh dấu đã học

Bước 2: Sử dụng buổi học
PATCH /api/subscriptions/1/use
→ used_sessions tăng từ 5 → 6
→ remaining_sessions = 20 - 6 = 14

Bước 3: Xem trạng thái gói học
GET /api/subscriptions/1
→ Trả về:
{
  "id": 1,
  "student_id": 1,
  "package_name": "Gói 20 buổi",
  "total_sessions": 20,
  "used_sessions": 6,
  "remaining_sessions": 14,
  ...
}
```

### **Scenario 3: Kiểm tra trùng lịch**

```
Học sinh ID 1 đã đăng ký:
- Lớp Toán: Monday, 18:00-19:30

Bây giờ muốn đăng ký:
- Lớp Tiếng Anh: Monday, 18:00-19:30

POST /api/classes/2/register
{
  "student_id": 1
}

→ Hệ thống kiểm tra:
  - Lớp 2 có day_of_week = "Monday", time_slot = "18:00-19:30"
  - Học sinh 1 đã có lớp nào cùng day_of_week và time_slot chưa?
  - → CÓ! Lớp Toán cũng Monday 18:00-19:30
  - → Trả về lỗi: "Student already has a class at this time slot"
```

---

## 🤔 Tại sao thiết kế như vậy?

### 1. **Tách biệt `class_registrations` và `subscriptions`**

**`class_registrations`:**
- Quan hệ học tập: Học sinh đăng ký lớp nào
- Mục đích: Quản lý lịch học, tránh trùng lịch

**`subscriptions`:**
- Quan hệ thương mại: Học sinh mua gói học bao nhiêu buổi
- Mục đích: Quản lý thanh toán, theo dõi số buổi còn lại

**Ví dụ thực tế:**
- Học sinh đăng ký 3 lớp (Toán, Tiếng Anh, Văn) → 3 records trong `class_registrations`
- Học sinh mua 1 gói 20 buổi → 1 record trong `subscriptions`
- Mỗi lần đi học bất kỳ lớp nào → dùng 1 buổi từ gói

### 2. **Không có Authentication**

**Lý do:**
- Yêu cầu đơn giản, không cần đăng nhập
- Có thể là hệ thống nội bộ, hoặc sẽ thêm sau
- Tập trung vào logic nghiệp vụ chính: quản lý lớp và gói học

**Nếu cần thêm authentication:**
- Thêm bảng `users` (email, password)
- Liên kết `users` với `parents`
- Thêm middleware JWT để bảo vệ routes

### 3. **`day_of_week` và `time_slot` là string**

**Lý do:**
- Linh hoạt: có thể là "Monday", "Thứ 2", "Mon"...
- `time_slot` có thể là "18:00-19:30", "18:00", "6PM-7:30PM"...
- Dễ hiểu, không cần parse phức tạp

**Nếu cần chính xác hơn:**
- Có thể dùng enum cho `day_of_week`
- Có thể tách `time_slot` thành `start_time` và `end_time`

---

## 📋 Tóm tắt luồng đầy đủ

```
1. Tạo Phụ huynh
   POST /api/parents
   → Lưu thông tin liên hệ

2. Tạo Học sinh
   POST /api/students
   → Liên kết với phụ huynh

3. Tạo Lớp học
   POST /api/classes
   → Định nghĩa lớp, lịch học

4. Đăng ký vào lớp
   POST /api/classes/:id/register
   → Kiểm tra trùng lịch
   → Lưu vào class_registrations

5. Mua gói học
   POST /api/subscriptions
   → Định nghĩa số buổi

6. Đi học (sử dụng buổi)
   PATCH /api/subscriptions/:id/use
   → Tăng used_sessions
   → remaining_sessions tự động giảm

7. Xem trạng thái
   GET /api/subscriptions/:id
   → Xem còn bao nhiêu buổi
```

---

## 🎯 Điểm quan trọng

1. **Trùng lịch được kiểm tra tự động** khi đăng ký lớp
2. **Gói học độc lập với lớp học** → Linh hoạt sử dụng
3. **Không có authentication** → Đơn giản, dễ test
4. **Mỗi bảng có mục đích rõ ràng** → Dễ maintain

Bạn có muốn tôi giải thích thêm phần nào không?

