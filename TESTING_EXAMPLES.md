# API Testing Examples - SpeedLab Workshop

Contoh request untuk testing API menggunakan Thunder Client, Postman, atau tools sejenis.

## 1. Setup User & Authentication

### 1.1 Register Admin (First Time Setup)
```json
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "name": "Admin SpeedLab",
  "email": "admin@speedlab.com",
  "password": "admin123",
  "phone": "081234567890",
  "address": "Jl. Bengkel No. 1",
  "role": "admin"
}
```

### 1.2 Register Pemilik
```json
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "name": "Owner SpeedLab",
  "email": "owner@speedlab.com",
  "password": "owner123",
  "phone": "081234567891",
  "address": "Jl. Bengkel No. 1",
  "role": "pemilik"
}
```

### 1.3 Register Pelanggan
```json
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "name": "Budi Santoso",
  "email": "budi@example.com",
  "password": "budi123",
  "phone": "081234567892",
  "address": "Jl. Customer No. 123",
  "role": "pelanggan"
}
```

### 1.4 Login
```json
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "budi@example.com",
  "password": "budi123"
}
```

Response akan memberikan token:
```json
{
  "success": true,
  "message": "Login berhasil",
  "data": {
    "user": { ... },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Simpan token ini untuk request selanjutnya!**

---

## 2. Customer Journey

### 2.1 Daftar Motor Pertama
```json
POST http://localhost:3000/api/motorcycles
Authorization: Bearer <customer-token>
Content-Type: application/json

{
  "brand": "Honda",
  "model": "Beat Street",
  "year": 2023,
  "licensePlate": "B 1234 ABC",
  "color": "Merah Hitam"
}
```

### 2.2 Daftar Motor Kedua
```json
POST http://localhost:3000/api/motorcycles
Authorization: Bearer <customer-token>
Content-Type: application/json

{
  "brand": "Yamaha",
  "model": "NMAX",
  "year": 2022,
  "licensePlate": "B 5678 DEF",
  "color": "Biru"
}
```

### 2.3 Lihat Motor Saya
```json
GET http://localhost:3000/api/motorcycles/my-motorcycles
Authorization: Bearer <customer-token>
```

### 2.4 Lihat Menu Layanan
```json
GET http://localhost:3000/api/services
```

### 2.5 Buat Reservasi
```json
POST http://localhost:3000/api/bookings
Authorization: Bearer <customer-token>
Content-Type: application/json

{
  "motorcycleId": "<motor-id-dari-step-2.1>",
  "serviceIds": ["<service-id-1>", "<service-id-2>"],
  "bookingDate": "2024-01-20",
  "bookingTime": "10:00",
  "complaint": "Mesin kasar saat di gas, rem depan bunyi, dan ban depan kempes",
  "notes": "Mohon dikerjakan pagi hari"
}
```

### 2.6 Lihat Booking Saya
```json
GET http://localhost:3000/api/bookings/my-bookings
Authorization: Bearer <customer-token>
```

### 2.7 Lihat Riwayat Servis Saya
```json
GET http://localhost:3000/api/service-histories/my-history
Authorization: Bearer <customer-token>
```

### 2.8 Klaim Garansi
```json
POST http://localhost:3000/api/warranties
Authorization: Bearer <customer-token>
Content-Type: application/json

{
  "serviceHistoryId": "<service-history-id>",
  "motorcycleId": "<motorcycle-id>",
  "complaint": "Rem masih bunyi setelah diganti kemarin",
  "notes": "Mohon dicek kembali"
}
```

---

## 3. Admin Journey

### 3.1 Login sebagai Admin
```json
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "admin@speedlab.com",
  "password": "admin123"
}
```

### 3.2 Lihat Semua Booking (FIFO)
```json
GET http://localhost:3000/api/bookings
Authorization: Bearer <admin-token>
```

### 3.3 Lihat Booking Hari Ini
```json
GET http://localhost:3000/api/bookings?date=2024-01-20
Authorization: Bearer <admin-token>
```

### 3.4 Verifikasi Booking
```json
PATCH http://localhost:3000/api/bookings/<booking-id>/verify
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "notes": "Booking sudah diverifikasi, silakan datang sesuai jadwal"
}
```

### 3.5 Update Status Booking ke "Sedang Dikerjakan"
```json
PATCH http://localhost:3000/api/bookings/<booking-id>/status
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "status": "Sedang Dikerjakan",
  "notes": "Motor sedang dalam pengerjaan oleh mekanik Budi"
}
```

### 3.6 Update Status Motor
```json
PATCH http://localhost:3000/api/motorcycles/<motorcycle-id>/status
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "status": "Sedang Dikerjakan"
}
```

### 3.7 Buat Service History setelah Selesai
```json
POST http://localhost:3000/api/service-histories
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "bookingId": "<booking-id>",
  "diagnosis": "Oli mesin sudah hitam dan kental, kampas rem depan tipis 30%, ban bocor karena paku",
  "workDone": "Ganti oli mesin, ganti kampas rem depan, tambal ban depan, cek tekanan angin",
  "spareParts": [
    {
      "name": "Oli Mesin Shell AX7",
      "price": 55000,
      "quantity": 1
    },
    {
      "name": "Kampas Rem Depan Original",
      "price": 85000,
      "quantity": 1
    },
    {
      "name": "Tambal Ban",
      "price": 15000,
      "quantity": 1
    }
  ],
  "mechanicName": "Budi Mekanik",
  "startDate": "2024-01-20T10:00:00",
  "endDate": "2024-01-20T12:30:00",
  "totalPrice": 305000,
  "warrantyExpiry": "2024-04-20",
  "notes": "Motor sudah selesai dikerjakan dan siap diambil"
}
```

### 3.8 Update Status Motor ke "Selesai"
```json
PATCH http://localhost:3000/api/motorcycles/<motorcycle-id>/status
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "status": "Selesai"
}
```

### 3.9 Update Status Booking ke "Selesai"
```json
PATCH http://localhost:3000/api/bookings/<booking-id>/status
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "status": "Selesai",
  "notes": "Motor sudah selesai dikerjakan dan siap diambil"
}
```

### 3.10 Update Status Motor ke "Diambil" (setelah customer ambil)
```json
PATCH http://localhost:3000/api/motorcycles/<motorcycle-id>/status
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "status": "Diambil"
}
```

### 3.11 Lihat Statistik Motor (untuk Grafik)
```json
GET http://localhost:3000/api/motorcycles/stats/summary
Authorization: Bearer <admin-token>
```

Response:
```json
{
  "success": true,
  "data": {
    "Menunggu": 5,
    "Sedang Dikerjakan": 3,
    "Selesai": 2,
    "Diambil": 15
  }
}
```

### 3.12 Tambah Layanan Baru
```json
POST http://localhost:3000/api/services
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "name": "Service Rutin",
  "description": "Ganti oli, cek rem, cek rantai, cek ban",
  "price": 150000,
  "estimatedDuration": 60
}
```

### 3.13 Verifikasi Klaim Garansi
```json
PATCH http://localhost:3000/api/warranties/<warranty-id>/verify
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "status": "Diterima",
  "notes": "Garansi diterima, silakan datang untuk perbaikan"
}
```

---

## 4. Owner Journey

### 4.1 Login sebagai Owner
```json
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "owner@speedlab.com",
  "password": "owner123"
}
```

### 4.2 Tambah Karyawan
```json
POST http://localhost:3000/api/employees
Authorization: Bearer <owner-token>
Content-Type: application/json

{
  "name": "Budi Mekanik",
  "email": "budi.mekanik@speedlab.com",
  "phone": "081234567893",
  "address": "Jl. Karyawan No. 1",
  "position": "Mekanik",
  "salary": 4500000,
  "hireDate": "2024-01-01"
}
```

### 4.3 Lihat Semua Karyawan
```json
GET http://localhost:3000/api/employees
Authorization: Bearer <owner-token>
```

### 4.4 Filter Karyawan Mekanik
```json
GET http://localhost:3000/api/employees?position=Mekanik
Authorization: Bearer <owner-token>
```

### 4.5 Update Data Karyawan
```json
PUT http://localhost:3000/api/employees/<employee-id>
Authorization: Bearer <owner-token>
Content-Type: application/json

{
  "name": "Budi Mekanik Senior",
  "salary": 5000000,
  "position": "Supervisor"
}
```

### 4.6 Lihat Semua User/Pelanggan
```json
GET http://localhost:3000/api/users?role=pelanggan
Authorization: Bearer <owner-token>
```

### 4.7 Lihat Statistik Booking
```json
GET http://localhost:3000/api/bookings/stats/summary
Authorization: Bearer <owner-token>
```

### 4.8 Lihat Semua Service History
```json
GET http://localhost:3000/api/service-histories
Authorization: Bearer <owner-token>
```

---

## 5. Testing Flow Lengkap

### Step 1: Setup Initial Data
1. Register admin
2. Register pemilik
3. Login sebagai admin
4. Tambah beberapa layanan

### Step 2: Customer Experience
1. Register pelanggan
2. Login sebagai pelanggan
3. Daftar 2 motor
4. Buat reservasi untuk motor pertama

### Step 3: Admin Process Booking
1. Login sebagai admin
2. Lihat booking hari ini
3. Verifikasi booking
4. Update status ke "Sedang Dikerjakan"
5. Buat service history
6. Update status ke "Selesai"
7. Update status ke "Diambil"

### Step 4: Check Statistics
1. Login sebagai admin/owner
2. Cek statistik motor
3. Cek statistik booking

### Step 5: Warranty Flow
1. Login sebagai pelanggan
2. Buat klaim garansi
3. Login sebagai admin
4. Verifikasi klaim garansi

---

## Tips untuk Testing

1. **Save Tokens**: Simpan token setelah login untuk digunakan di request selanjutnya
2. **Save IDs**: Simpan ID motor, booking, dll untuk digunakan di endpoint lain
3. **Check Response**: Selalu cek response untuk memastikan data yang benar
4. **Test Order**: Ikuti urutan testing di atas untuk flow yang benar
5. **Use Variables**: Gunakan environment variables di Postman/Thunder Client untuk token dan IDs

## Common Status Values

### Motorcycle Status:
- Menunggu
- Sedang Dikerjakan
- Selesai
- Diambil

### Booking Status:
- Menunggu Verifikasi
- Terverifikasi
- Sedang Dikerjakan
- Selesai
- Dibatalkan
- Diambil

### Warranty Status:
- Menunggu Verifikasi
- Diterima
- Ditolak

---

Happy Testing! 🚀
