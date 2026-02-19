# SpeedLab Workshop API Documentation

API Backend untuk sistem pelayanan bengkel motor SpeedLab.

## Base URL
```
http://localhost:3000/api
```

## Authentication
Sebagian besar endpoint memerlukan JWT token di header:
```
Authorization: Bearer <your-jwt-token>
```

---

## 📱 ENDPOINTS

### 1. Authentication (`/api/auth`)

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "081234567890",
  "address": "Jl. Example No. 123",
  "role": "pelanggan" // pelanggan, admin, atau pemilik
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Get Profile
```http
GET /api/auth/profile
Authorization: Bearer <token>
```

#### Update Profile
```http
PUT /api/auth/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Doe Updated",
  "phone": "081234567890",
  "address": "Jl. New Address",
  "avatar": "https://example.com/avatar.jpg"
}
```

---

### 2. Motorcycles (`/api/motorcycles`)

#### Daftar Motor Baru (Customer & Admin)
```http
POST /api/motorcycles
Authorization: Bearer <token>
Content-Type: application/json

{
  "brand": "Honda",
  "model": "Beat",
  "year": 2023,
  "licensePlate": "B 1234 XYZ",
  "color": "Merah",
  "userId": "user_id_123" // OPSIONAL, hanya untuk Admin/Pemilik yang mendaftarkan motor untuk pelanggan lain
}
```
**Notes:**
- Customer: Tidak perlu kirim `userId`, motor akan otomatis terdaftar atas nama mereka
- Admin/Pemilik: Bisa kirim `userId` untuk mendaftarkan motor atas nama pelanggan tertentu (walk-in customer)

#### Get My Motorcycles (Customer)
```http
GET /api/motorcycles/my-motorcycles
Authorization: Bearer <token>
```

#### Get All Motorcycles (Admin/Pemilik)
```http
GET /api/motorcycles
Authorization: Bearer <token>
```

#### Get Motorcycle by ID
```http
GET /api/motorcycles/:id
Authorization: Bearer <token>
```

#### Update Motorcycle
```http
PUT /api/motorcycles/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "brand": "Honda",
  "model": "Beat Updated",
  "year": 2023,
  "licensePlate": "B 1234 XYZ",
  "color": "Biru"
}
```

#### Update Motorcycle Status (Admin) - Untuk Grafik
```http
PATCH /api/motorcycles/:id/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "Sedang Dikerjakan" // Menunggu, Sedang Dikerjakan, Selesai, Diambil
}
```

#### Get Motorcycle Statistics (Admin/Pemilik) - Untuk Grafik Flutter
```http
GET /api/motorcycles/stats/summary
Authorization: Bearer <token>
```
Response:
```json
{
  "success": true,
  "data": {
    "Menunggu": 5,
    "Sedang Dikerjakan": 3,
    "Selesai": 10,
    "Diambil": 20
  }
}
```

#### Delete Motorcycle (Admin)
```http
DELETE /api/motorcycles/:id
Authorization: Bearer <token>
```

---

### 3. Services (`/api/services`)

#### Get All Services (Public)
```http
GET /api/services
```
Query params (optional):
- `isActive=true` - filter layanan aktif saja

#### Get Service by ID
```http
GET /api/services/:id
```

#### Create Service (Admin/Pemilik)
```http
POST /api/services
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Service Rutin",
  "description": "Ganti oli, cek rem, dll",
  "price": 150000,
  "estimatedDuration": 60 // dalam menit
}
```

#### Update Service (Admin/Pemilik)
```http
PUT /api/services/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Service Rutin Updated",
  "description": "Ganti oli, cek rem, dll",
  "price": 175000,
  "estimatedDuration": 60,
  "isActive": true
}
```

#### Delete Service (Admin/Pemilik)
```http
DELETE /api/services/:id
Authorization: Bearer <token>
```

---

### 4. Bookings / Reservasi (`/api/bookings`)

#### Create Booking (Customer)
```http
POST /api/bookings
Authorization: Bearer <token>
Content-Type: application/json

{
  "motorcycleId": "6789abc123def456",
  "serviceIds": ["service_id_1", "service_id_2"],
  "bookingDate": "2024-01-15",
  "bookingTime": "10:00",
  "complaint": "Mesin kasar dan rem bunyi",
  "notes": "Mohon dikerjakan pagi"
}
```

#### Get My Bookings (Customer)
```http
GET /api/bookings/my-bookings
Authorization: Bearer <token>
```

#### Get All Bookings (Admin/Pemilik) - FIFO & Filter by Date
```http
GET /api/bookings
Authorization: Bearer <token>
```
Query params (optional):
- `date=2024-01-15` - filter berdasarkan tanggal booking
- `status=Terverifikasi` - filter berdasarkan status

Response akan di-sort berdasarkan FIFO (First In First Out)

#### Get Booking by ID
```http
GET /api/bookings/:id
Authorization: Bearer <token>
```

#### Verify Booking (Admin)
```http
PATCH /api/bookings/:id/verify
Authorization: Bearer <token>
Content-Type: application/json

{
  "notes": "Booking diverifikasi, silakan datang sesuai jadwal"
}
```

#### Update Booking Status (Admin)
```http
PATCH /api/bookings/:id/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "Sedang Dikerjakan", // Menunggu Verifikasi, Terverifikasi, Sedang Dikerjakan, Selesai, Dibatalkan, Diambil
  "notes": "Motor sedang dalam pengerjaan"
}
```

#### Update Booking (Admin)
```http
PUT /api/bookings/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "serviceIds": ["service_id_1", "service_id_2"],
  "bookingDate": "2024-01-15",
  "bookingTime": "11:00",
  "complaint": "Updated complaint",
  "notes": "Updated notes"
}
```

#### Get Booking Statistics (Admin/Pemilik) - Untuk Grafik
```http
GET /api/bookings/stats/summary
Authorization: Bearer <token>
```

#### Delete Booking (Admin)
```http
DELETE /api/bookings/:id
Authorization: Bearer <token>
```

---

### 5. Service History / Riwayat Servis (`/api/service-histories`)

#### Create Service History (Admin)
```http
POST /api/service-histories
Authorization: Bearer <token>
Content-Type: application/json

{
  "bookingId": "booking_id_123",
  "diagnosis": "Kampas rem habis, oli kotor",
  "workDone": "Ganti kampas rem, ganti oli",
  "spareParts": [
    {
      "name": "Kampas Rem",
      "price": 75000,
      "quantity": 1
    },
    {
      "name": "Oli Mesin",
      "price": 50000,
      "quantity": 1
    }
  ],
  "mechanicName": "Budi",
  "startDate": "2024-01-15T10:00:00",
  "endDate": "2024-01-15T12:00:00",
  "totalPrice": 275000,
  "warrantyExpiry": "2024-04-15",
  "notes": "Motor sudah selesai dikerjakan"
}
```

#### Get My Service History (Customer)
```http
GET /api/service-histories/my-history
Authorization: Bearer <token>
```

#### Get Service History by Motorcycle
```http
GET /api/service-histories/motorcycle/:motorcycleId
Authorization: Bearer <token>
```

#### Get All Service Histories (Admin/Pemilik)
```http
GET /api/service-histories
Authorization: Bearer <token>
```

#### Get Service History by ID
```http
GET /api/service-histories/:id
Authorization: Bearer <token>
```

#### Update Service History (Admin)
```http
PUT /api/service-histories/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "diagnosis": "Updated diagnosis",
  "workDone": "Updated work",
  "totalPrice": 300000,
  "notes": "Updated notes"
}
```

#### Delete Service History (Admin)
```http
DELETE /api/service-histories/:id
Authorization: Bearer <token>
```

---

### 6. Warranties / Garansi (`/api/warranties`)

#### Create Warranty Claim (Customer)
```http
POST /api/warranties
Authorization: Bearer <token>
Content-Type: application/json

{
  "serviceHistoryId": "history_id_123",
  "motorcycleId": "motorcycle_id_456",
  "complaint": "Rem masih bunyi setelah diperbaiki",
  "notes": "Mohon dicek kembali"
}
```

#### Get My Warranty Claims (Customer)
```http
GET /api/warranties/my-claims
Authorization: Bearer <token>
```

#### Get All Warranty Claims (Admin/Pemilik)
```http
GET /api/warranties
Authorization: Bearer <token>
```
Query params (optional):
- `status=Menunggu Verifikasi`

#### Get Warranty Claim by ID
```http
GET /api/warranties/:id
Authorization: Bearer <token>
```

#### Verify Warranty Claim (Admin)
```http
PATCH /api/warranties/:id/verify
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "Diterima", // Diterima atau Ditolak
  "rejectionReason": "Garansi tidak berlaku untuk kerusakan ini", // optional, jika ditolak
  "notes": "Silakan datang untuk perbaikan"
}
```

#### Delete Warranty Claim (Admin)
```http
DELETE /api/warranties/:id
Authorization: Bearer <token>
```

---

### 7. Employees / Karyawan (`/api/employees`) - Hanya Pemilik

#### Create Employee
```http
POST /api/employees
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Ahmad",
  "email": "ahmad@speedlab.com",
  "phone": "081234567890",
  "address": "Jl. Example",
  "position": "Mekanik", // Mekanik, Admin, Supervisor
  "salary": 5000000,
  "hireDate": "2024-01-01"
}
```

#### Get All Employees
```http
GET /api/employees
Authorization: Bearer <token>
```
Query params (optional):
- `isActive=true`
- `position=Mekanik`

#### Get Employee by ID
```http
GET /api/employees/:id
Authorization: Bearer <token>
```

#### Update Employee
```http
PUT /api/employees/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Ahmad Updated",
  "phone": "081234567890",
  "salary": 5500000,
  "isActive": true
}
```

#### Delete Employee
```http
DELETE /api/employees/:id
Authorization: Bearer <token>
```

---

### 8. Users Management (`/api/users`) - Admin/Pemilik

#### Get All Users
```http
GET /api/users
Authorization: Bearer <token>
```
Query params (optional):
- `role=pelanggan`
- `isActive=true`

#### Get User by ID
```http
GET /api/users/:id
Authorization: Bearer <token>
```

#### Create User (Admin)
```http
POST /api/users
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "New User",
  "email": "newuser@example.com",
  "password": "password123",
  "phone": "081234567890",
  "address": "Jl. Example",
  "role": "pelanggan"
}
```

#### Update User
```http
PUT /api/users/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Name",
  "phone": "081234567890",
  "isActive": true
}
```

#### Delete User
```http
DELETE /api/users/:id
Authorization: Bearer <token>
```

---

## 📊 Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error"
}
```

---

## 🔐 User Roles

- **pelanggan**: Customer yang menggunakan layanan bengkel
- **admin**: Admin bengkel yang mengelola booking, servis, dll
- **pemilik**: Owner bengkel yang bisa melihat semua data dan mengelola karyawan

---

## 📈 Data untuk Grafik Flutter

### 1. Status Motor (untuk tracking pengerjaan)
```http
GET /api/motorcycles/stats/summary
```
Mengembalikan jumlah motor berdasarkan status:
- Menunggu
- Sedang Dikerjakan
- Selesai
- Diambil

### 2. Status Booking (untuk monitoring reservasi)
```http
GET /api/bookings/stats/summary
```
Mengembalikan jumlah booking berdasarkan status:
- Menunggu Verifikasi
- Terverifikasi
- Sedang Dikerjakan
- Selesai
- Dibatalkan
- Diambil

---

## 🚀 Cara Menjalankan

1. Install dependencies:
```bash
npm install
```

2. Copy `.env.example` ke `.env` dan sesuaikan konfigurasi

3. Jalankan MongoDB

4. Jalankan server:
```bash
node server/server.js
```

Server akan berjalan di `http://localhost:3000`

---

## 📝 Notes untuk Flutter Developer

1. **Token Management**: Simpan JWT token setelah login/register dan kirim di header setiap request
2. **FIFO Booking**: Data booking dari `/api/bookings?date=today` sudah di-sort FIFO (First In First Out)
3. **Real-time Status**: Update status motor menggunakan endpoint PATCH `/api/motorcycles/:id/status`
4. **Grafik**: Gunakan endpoint `/stats/summary` untuk mendapatkan data grafik
5. **Error Handling**: Semua response memiliki field `success` untuk cek berhasil/gagal

---

## 🔄 Flow Aplikasi

### Customer Flow:
1. Register/Login → Dapat token
2. Daftar motor (bisa lebih dari satu)
3. Buat reservasi
4. Lihat status motor
5. Lihat riwayat servis
6. Klaim garansi (jika diperlukan)

### Admin Flow:
1. Login dengan role admin
2. Lihat booking hari ini (filtered & FIFO)
3. Verifikasi reservasi
4. Update status motor saat pengerjaan
5. Buat service history
6. Kelola data motor, layanan, pelanggan
7. **Walk-in Customer**: Buat user baru → Daftarkan motor untuk user tersebut → Customer bisa lihat status via app

### Pemilik Flow:
1. Login dengan role pemilik
2. Dashboard - lihat semua statistik
3. Lihat status pengerjaan motor
4. Kelola karyawan
5. Lihat semua data (booking, riwayat, dll)
