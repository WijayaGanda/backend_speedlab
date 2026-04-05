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

#### Forgot Password
```http
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "john@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Link reset password telah dikirim ke email Anda",
  "data": {
    "resetToken": "abc123def456...",
    "expiresIn": "1 jam"
  }
}
```

**Notes:**
- Email harus terdaftar di sistem
- Token reset berlaku selama 1 jam
- Di production, link reset akan dikirim via email (untuk sekarang token di-return untuk testing)

#### Reset Password
```http
POST /api/auth/reset-password
Content-Type: application/json

{
  "token": "abc123def456...",
  "newPassword": "passwordBaru123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password berhasil direset, silakan login dengan password baru"
}
```

**Notes:**
- Token harus valid dan belum expired (maksimal 1 jam)
- Password minimal 6 karakter
- Setelah reset, user dapat login dengan password baru

#### Change Password (Authenticated User)
```http
PUT /api/auth/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "passwordLama123",
  "newPassword": "passwordBaru123",
  "confirmPassword": "passwordBaru123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password berhasil diubah"
}
```

**Notes:**
- User harus sudah login (memerlukan token JWT)
- Password saat ini harus benar untuk verifikasi
- Password baru harus sesuai dengan konfirmasi password
- Password minimal 6 karakter

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

#### Delete Motorcycle (Admin/Customer)
```http
DELETE /api/motorcycles/:id
Authorization: Bearer <token>
```
**Note:** 
- Customer hanya bisa menghapus motor milik mereka sendiri
- Admin bisa menghapus motor siapa saja

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

## 📊 BOOKING & SERVICE HISTORY FLOW

### 🎯 Design Decision: Kenapa Pisah (Tidak Digabung)?

**❌ Jika Digabung (1 Collection):**
```
MASALAH:
├─ Booking mulai: serviceIds = [Ganti Oli, Ganti Filter]
│                totalPrice = 150,000
│
└─ Setelah dikerjakan: 
   ├─ Mekanik nemu kampas rem juga habis (tambah 75,000)
   ├─ spareParts berubah (tambah data baru)
   ├─ diagnosis berubah
   ├─ workDone berubah
   ├─ totalPrice jadi 225,000
   └─ 👎 Booking data sudah berubah drastis = confusing!
```

**✅ Jika Pisah (2 Collection - CURRENT DESIGN):**
```
KEUNTUNGAN:
├─ Booking tetap: serviceIds & totalPrice ORIGINAL (150,000)
│  └─ Ini adalah commitment/agree customer
│
├─ Service History: catatan ACTUAL pengerjaan
│  ├─ serviceIds = [Ganti Oli, Ganti Filter, Ganti Kampas Rem]
│  ├─ spareParts = [dengan detail harga]
│  ├─ totalPrice ACTUAL = 225,000
│  └─ Ini adalah HASIL akhir setelah dikerjakan
│
└─ 👍 Audit trail jelas, data konsisten, laporan akurat!
```

### 📋 Penjelasan Detail Booking vs Service History:

| Aspek | Booking | Service History |
|-------|---------|-----------------|
| **Tujuan** | Request/Permintaan servis | Catatan riwayat pengerjaan |
| **Dibuat oleh** | Customer | Admin (setelah booking selesai) |
| **Kapan dibuat** | Awal (customer request) | Akhir (setelah motor dikerjakan) |
| **Bisa diubah** | Ya (sebelum dikerjakan) | Kadang (untuk koreksi data) |
| **Harga** | Harga ESTIMATE awal | Harga ACTUAL (bisa lebih tinggi) |
| **Suku cadang** | Tidak tercatat detail | Tercatat detail (nama, harga, qty) |
| **Status flow** | Menunggu → Terverifikasi → Sedang Dikerjakan → Selesai → Diambil | Satu data saja (hasil final) |
| **Untuk customer** | Lihat booking mereka | Lihat history pengerjaan motor mereka |
| **Untuk admin** | Kelola queue pengerjaan | Lihat detail pengerjaan & garansi |
| **Data audit** | Tracking permintaan | Tracking pekerjaan & biaya |

### 💡 Skenario Harga Berubah (Contoh Real):

```
KASUS: Motor dibawa ke bengkel dengan keluhan "Mesin kasar"
═══════════════════════════════════════════════════════════════

BOOKING (Customer request):
{
  "motorcycleId": "motor123",
  "serviceIds": ["service_ganti_oli"],
  "bookingDate": "2024-01-15",
  "totalPrice": 150000,  ← ESTIMATE awal
  "complaint": "Mesin kasar"
}

[Admin proses...]
[Mekanik mulai kerja...]

TERNYATA MEKANIK NEMU:
- Oli kotor ✓ (sesuai estimate)
- Filter udara tersumbat (tambah 50,000)
- Kampas rem habis (tambah 75,000)
- Busi perlu diganti (tambah 60,000)

SERVICE HISTORY (Hasil pengerjaan):
{
  "bookingId": "booking123",  ← Link ke booking original
  "diagnosis": "Oli kotor, filter tersumbat, kampas rem habis, busi usia",
  "workDone": "Ganti oli, filter udara, kampas rem, busi",
  "spareParts": [
    { name: "Oli SAE 40", price: 50000, quantity: 1 },
    { name: "Filter Udara", price: 50000, quantity: 1 },
    { name: "Kampas Rem", price: 75000, quantity: 1 },
    { name: "Busi", price: 60000, quantity: 1 }
  ],
  "mechanicName": "Budi",
  "startDate": "2024-01-15T10:00:00",
  "endDate": "2024-01-15T14:00:00",
  "totalPrice": 335000,  ← ACTUAL harga (lebih tinggi)
  "warrantyExpiry": "2024-04-15"
}

HASIL:
✓ Booking original tetap clean (150,000)
✓ Service history akurat (335,000)
✓ Customer bisa lihat detail apa yg ditambahkan
✓ Admin punya catatan untuk next maintenance
═══════════════════════════════════════════════════════════════
```

### 🔄 Alur Booking dan Service History:

```
BOOKING FLOW + PROGRESS UPDATE:
═══════════════════════════════════════════════════════════════

1. CUSTOMER MEMBUAT BOOKING
   ↓
   Status Booking: "Menunggu Verifikasi"
   - Customer memilih motor, layanan, jam, komplain
   
   ↓
   
2. ADMIN VERIFIKASI BOOKING
   ↓
   Status Booking: "Terverifikasi"
   - Admin menerima dan memverifikasi booking
   
   ↓
   
3. ADMIN UPDATE KE "SEDANG DIKERJAKAN"
   ↓
   Status Booking: "Sedang Dikerjakan"
   - Mekanik mulai mengerjakan motor
   
   ✨ BARU: BUAT SERVICE HISTORY SEKARANG ✨
   ↓
   Admin membuat service history:
   POST /api/service-histories
   {
     "bookingId": "...",
     "diagnosis": "Awal diagnosis", (optional, bisa diisi nanti)
     "mechanicName": "Budi",
     "startDate": "2024-01-15T10:00:00"
   }
   
   Status Service History: "Dimulai"
   └─ Customer sudah bisa melihat: motor sedang dikerjakan, mekanik siapa
   
   ↓
   
4. ✨ ADMIN UPDATE PROGRESS BERKALA ✨
   ↓
   Motor sedang dikerjakan:
   PUT /api/service-histories/:id
   {
     "status": "Sedang Dikerjakan",
     "diagnosis": "Oli kotor, ditemukan kampas rem juga habis",
     "workDone": "Sudah ganti oli, sedang ganti kampas rem",
     "spareParts": [
       { "name": "Oli SAE 40", "price": 50000, "quantity": 1 },
       { "name": "Kampas Rem", "price": 75000, "quantity": 1 }
     ],
     "totalPrice": 125000
   }
   
   Customer bisa lihat REAL-TIME:
   ✓ Yang sudah dikerjakan
   ✓ Suku cadang apa saja yang digunakan + harga
   ✓ Estimasi total harga
   ✓ Siapa mekaniknya
   
   ↓
   
5. MOTOR SELESAI DIKERJAKAN
   ↓
   Status Booking: "Selesai"
   Admin final update service history:
   PUT /api/service-histories/:id
   {
     "status": "Selesai",
     "endDate": "2024-01-15T14:00:00",
     "totalPrice": 275000,
     "warrantyExpiry": "2024-04-15",
     "notes": "Motor sudah selesai dikerjakan, silakan diambil"
   }
   
   ↓
   
6. CUSTOMER AMBIL MOTOR
   ↓
   Status Booking: "Diambil"
   - Service history complete dengan detail pengerjaan & garansi
   - Customer bisa lihat full history di app

═══════════════════════════════════════════════════════════════
```

### 📱 Customer Progress Tracking (Real-Time):

```
Customer interface:
┌─────────────────────────────────────────────┐
│ BOOKING #123                                │
├─────────────────────────────────────────────┤
│ Status: Sedang Dikerjakan                   │
│                                             │
│ 🔧 PROGRESS PENGERJAAN:                    │
│                                             │
│ Mekanik: Budi                               │
│ Mulai: 2024-01-15 10:00 WIB                 │
│                                             │
│ Diagnosis:                                  │
│ Oli kotor, filter tersumbat,                │
│ kampas rem habis, busi usia                 │
│                                             │
│ Work Done:                                  │
│ ✓ Ganti oli                                 │
│ ✓ Ganti filter udara                        │
│ ⏱️ Sedang: Ganti kampas rem                  │
│ → Pending: Ganti busi                       │
│                                             │
│ Suku Cadang:                                │
│ • Oli SAE 40 - Rp 50.000 (1x)              │
│ • Filter Udara - Rp 50.000 (1x)            │
│ • Kampas Rem - Rp 75.000 (1x)              │
│ • Busi - Rp 60.000 (1x)                    │
│                                             │
│ 💰 Total Estimasi: Rp 235.000              │
│ (Final ketika selesai)                      │
│                                             │
│ last updated: 30 detik lalu                 │
└─────────────────────────────────────────────┘
```

### ✅ Rekomendasi & Best Practice:

**DENGAN PROGRESS TRACKING:**
1. ✓ **Real-time progress** - Customer bisa lihat what's happening now
2. ✓ **Transparent updates** - Admin update diagnosis & spareParts sambil dikerjakan
3. ✓ **Incremental cost tracking** - Customer lihat harga bertambah saat ada part baru
4. ✓ **Flexible pricing** - Service history totalPrice bisa updated berkali-kali sampai final
5. ✓ **Complete audit** - Setiap update di-track dengan timestamp

**Cara implementasi:**

| Tahap | Aksi | API |
|-------|------|-----|
| **Booking Terverifikasi** | Admin siap kerja | - |
| **Status → Sedang Dikerjakan** | Admin buat service history | `POST /api/service-histories` |
| **Mekanik mulai kerja** | Admin update: mekanik, startDate | `PUT /api/service-histories/:id` |
| **Proses berlangsung** | Admin update: diagnosis, workDone, spareParts, totalPrice (berkali-kali) | `PUT /api/service-histories/:id` (berkali-kali) |
| **Motor selesai** | Admin update: status="Selesai", endDate, totalPrice final, warrantyExpiry | `PUT /api/service-histories/:id` |
| **Customer ambil** | Status booking → "Diambil" | - |

**API yang digunakan customer:**
- `GET /api/service-histories/my-history` → Lihat progress real-time
- `GET /api/service-histories/motorcycle/:motorcycleId` → History per motor

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
Query params (optional):
- `motorcycleId=abc123` - filter booking untuk motor tertentu

Contoh:
- Semua booking: `GET /api/bookings/my-bookings`
- Booking motor tertentu: `GET /api/bookings/my-bookings?motorcycleId=6789abc123def456`

#### Cancel Booking (Customer)
```http
PATCH /api/bookings/:id/cancel
Authorization: Bearer <token>
```
**Note:** 
- Customer hanya bisa membatalkan booking milik mereka sendiri
- Hanya booking dengan status 'Menunggu Verifikasi' atau 'Terverifikasi' yang dapat dibatalkan
- Booking dengan status 'Sedang Dikerjakan', 'Selesai', atau 'Diambil' tidak dapat dibatalkan

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

#### Create Service History (Admin) - Saat Booking "Sedang Dikerjakan"
```http
POST /api/service-histories
Authorization: Bearer <token>
Content-Type: application/json

{
  "bookingId": "booking_id_123",
  "mechanicName": "Budi",
  "startDate": "2024-01-15T10:00:00",
  "diagnosis": "Mekanik akan mulai diagnostic", // optional, bisa diisi nanti
  "notes": "Mulai pengerjaan"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Riwayat servis berhasil dibuat",
  "data": {
    "_id": "history123",
    "bookingId": "booking_id_123",
    "status": "Dimulai",
    "mechanicName": "Budi",
    "startDate": "2024-01-15T10:00:00",
    "diagnosis": null,
    "workDone": null,
    "spareParts": [],
    "totalPrice": 0,
    "createdAt": "2024-01-15T10:00:00.000Z"
  }
}
```

**Notes:**
- Hanya bisa dibuat ketika booking status = "Sedang Dikerjakan" atau "Selesai"
- 1 booking = 1 service history (tidak bisa buat lebih dari 1 untuk booking yg sama)
- Field `diagnosis`, `workDone`, `spareParts`, `totalPrice` bisa diisi nanti saat update
- Status service history default = "Dimulai"

#### Update Service History (Admin) - Untuk Progress Update
```http
PUT /api/service-histories/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "Sedang Dikerjakan",
  "diagnosis": "Oli kotor, filter tersumbat, kampas rem habis, busi usia",
  "workDone": "Sudah ganti oli & filter, sedang ganti kampas rem",
  "spareParts": [
    {
      "name": "Oli SAE 40",
      "price": 50000,
      "quantity": 1
    },
    {
      "name": "Filter Udara",
      "price": 50000,
      "quantity": 1
    },
    {
      "name": "Kampas Rem",
      "price": 75000,
      "quantity": 1
    },
    {
      "name": "Busi",
      "price": 60000,
      "quantity": 1
    }
  ],
  "totalPrice": 235000,
  "notes": "Proses berjalan lancar"
}
```

**Notes:**
- Bisa dipanggil berkali-kali untuk update progress
- Customer bisa melihat update ini real-time
- Kirim hanya field yang ingin diupdate (tidak perlu semua)

#### Update Service History (Admin) - Final Status "Selesai"
```http
PUT /api/service-histories/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "Selesai",
  "endDate": "2024-01-15T14:00:00",
  "totalPrice": 275000, // Final price (bisa berbeda dari estimate)
  "warrantyExpiry": "2024-04-15",
  "notes": "Motor sudah selesai dikerjakan, silakan diambil"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Riwayat servis berhasil diupdate",
  "data": {
    "_id": "history123",
    "bookingId": "booking_id_123",
    "status": "Selesai",
    "mechanicName": "Budi",
    "startDate": "2024-01-15T10:00:00",
    "endDate": "2024-01-15T14:00:00",
    "diagnosis": "Oli kotor, filter tersumbat, kampas rem habis, busi usia",
    "workDone": "Ganti oli, filter udara, kampas rem, busi",
    "spareParts": [...],
    "totalPrice": 275000,
    "warrantyExpiry": "2024-04-15",
    "notes": "Motor sudah selesai dikerjakan, silakan diambil",
    "updatedAt": "2024-01-15T14:00:00.000Z"
  }
}
```

#### Get My Service History (Customer)
```http
GET /api/service-histories/my-history
Authorization: Bearer <token>
```

**Purpose:** Customer lihat history pengerjaan motor mereka dengan LIVE PROGRESS

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

### 8. Payment / Pembayaran (`/api/payment`)

**PENTING**: Integrasi dengan Midtrans Payment Gateway

#### Create Payment (Customer/Admin)
```http
POST /api/payment/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "bookingId": "6789abc123def456"
}
```
Response:
```json
{
  "success": true,
  "token": "66e4fa55-fdac-4ef9-91b5-733b5b26xxxx",
  "redirect_url": "https://app.sandbox.midtrans.com/snap/v3/redirection/66e4fa55-fdac-xxx"
}
```
**Note:**
- Customer hanya bisa membayar booking miliknya sendiri
- Admin bisa membayar booking siapa saja
- `grossAmount` diambil otomatis dari `booking.totalPrice` di database (KEAMANAN)
- Jika sudah ada payment pending untuk booking ini, akan return token yang lama
- Gunakan `redirect_url` untuk membuka WebView pembayaran Midtrans di Flutter

#### Check Payment Status (Customer/Admin)
```http
GET /api/payment/status/:bookingId
Authorization: Bearer <token>
```
Response:
```json
{
  "success": true,
  "data": {
    "orderId": "SPEEDLAB-6789abc123def456-1234567890",
    "bookingId": "6789abc123def456",
    "grossAmount": 150000,
    "transactionStatus": "settlement",
    "paymentType": "bank_transfer",
    "snapToken": "66e4fa55-fdac-4ef9-91b5-733b5b26xxxx",
    "snapRedirectUrl": "https://app.sandbox.midtrans.com/snap/v3/redirection/...",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:35:00.000Z"
  }
}
```
**Transaction Status:**
- `pending` - Menunggu pembayaran
- `settlement` - Pembayaran berhasil (LUNAS)
- `cancel` - Dibatalkan
- `expire` - Kadaluarsa
- `deny` - Ditolak

**Note:**
- Endpoint ini akan fetch status terbaru dari Midtrans API
- Customer hanya bisa cek payment miliknya sendiri
- Status booking akan otomatis berubah jadi "Terverifikasi" jika payment settlement

#### Get Payment History (Customer/Admin)
```http
GET /api/payment/history
Authorization: Bearer <token>
```
Query params (optional):
- `bookingId=abc123` - filter payment untuk booking tertentu

Contoh:
- Semua payment: `GET /api/payment/history`
- Payment booking tertentu: `GET /api/payment/history?bookingId=6789abc123def456`

**Note:**
- Customer: Hanya melihat riwayat payment miliknya sendiri
- Admin/Pemilik: Melihat semua riwayat payment
- Response include `count` untuk jumlah total payment

#### Webhook Midtrans (Internal)
```http
POST /api/payment/webhook
Content-Type: application/json
```
**Note:**
- Endpoint ini khusus dipanggil oleh Midtrans (TIDAK PERLU AUTH)
- Digunakan untuk update status payment otomatis
- Menggunakan signature validation untuk keamanan
- Konfigurasi webhook URL di Midtrans Dashboard: `https://your-domain.com/api/payment/webhook`

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
6. **Payment Integration**: 
   - Gunakan WebView untuk membuka `redirect_url` dari Midtrans
   - Setelah payment selesai, user akan di-redirect kembali ke app
   - Gunakan endpoint `/api/payment/status/:bookingId` untuk refresh status payment
   - Status booking akan otomatis berubah jadi "Terverifikasi" setelah payment settlement

---

## 🔄 Flow Aplikasi

### Customer Flow:
1. Register/Login → Dapat token
2. Daftar motor (bisa lebih dari satu)
3. Buat reservasi/booking
4. **Bayar booking via Midtrans** (Gopay, Bank Transfer, dll)
5. Booking otomatis terverifikasi setelah payment settlement
6. Lihat status motor (real-time tracking)
7. Lihat riwayat servis
8. Klaim garansi (jika diperlukan)
9. Lihat riwayat pembayaran

### Admin Flow:
1. Login dengan role admin
2. Lihat booking hari ini (filtered & FIFO)
3. Verifikasi reservasi (otomatis jika sudah bayar)
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
