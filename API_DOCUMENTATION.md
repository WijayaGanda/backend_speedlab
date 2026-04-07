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

#### Get Service History by Booking ID
```http
GET /api/service-histories/booking/:bookingId
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "history123",
    "bookingId": "booking_id_123",
    "userId": "user_id_456",
    "motorcycleId": "motor_id_789",
    "status": "Selesai",
    "mechanicName": "Budi",
    "startDate": "2024-01-15T10:00:00",
    "endDate": "2024-01-15T14:00:00",
    "diagnosis": "Oli kotor, filter tersumbat, kampas rem habis",
    "workDone": "Ganti oli, filter udara, kampas rem",
    "spareParts": [
      { "name": "Oli SAE 40", "price": 50000, "quantity": 1 },
      { "name": "Filter Udara", "price": 50000, "quantity": 1 },
      { "name": "Kampas Rem", "price": 75000, "quantity": 1 }
    ],
    "totalPrice": 175000,
    "warrantyExpiry": "2024-04-15",
    "notes": "Motor sudah selesai dikerjakan",
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T14:00:00.000Z"
  }
}
```

**Notes:**
- Mengembalikan service history untuk booking ID tertentu
- Hanya ada 1 service history per booking (unique constraint)
- Endpoint ini bisa digunakan customer untuk melihat detail progress service mereka berdasarkan booking ID

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

---

## 🔄 **ALUR PEMBAYARAN LENGKAP**

### Diagram Alur Pembayaran:

```
┌─────────────────────────────────────────────────────────┐
│ CUSTOMER CLICK BAYAR DI FLUTTER                         │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
    ┌──────────────────────────────┐
    │ 1. API Create Payment         │
    │ POST /api/payment/create      │
    │ {bookingId: "..."}            │
    └──────────────┬───────────────┘
                   │
                   ▼
    ┌──────────────────────────────┐
    │ 2. Response dari Backend      │
    │ {                             │
    │   token: "...",               │
    │   redirect_url: "http://..."  │
    │ }                             │
    └──────────────┬───────────────┘
                   │
                   ▼
    ┌──────────────────────────────┐
    │ 3. Buka WebView Midtrans      │
    │ (Gunakan redirect_url)        │
    │                               │
    │ User pilih metode pembayaran: │
    │ - Gopay                       │
    │ - Transfer Bank               │
    │ - BNPL (Kredivo, dll)         │
    │ - Kartu Kredit                │
    └──────────────┬───────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
        ▼                     ▼
    ✅ SUCCESS            ❌ GAGAL/BATAL
        │                     │
        │                     │
    Redirect ke app      Redirect ke app
        │                     │
        ▼                     ▼
┌────────────────────────────────────┐
│ 4. App Check Status Payment        │
│ GET /api/payment/status/booking... │
│ (Optional: Polling setiap 2 detik) │
└────────────┬─────────────────────┘
             │
             ▼
    ┌─────────────────────┐
    │ Cek transactionStatus│
    └──────────┬──────────┘
             │
    ┌────────┴────────┐
    │                 │
    ▼                 ▼
"settlement"      "pending"
(LUNAS)          (Belum bayar)
    │                 │
    ▼                 ▼
Update UI        Polling ulang
& Booking        atau user
status→           refresh
"Terverifikasi"  manual
    │
    ▼
✅ PEMBAYARAN BERHASIL
```

### Alur Detail:

| No | Tahap | Endpoint | Metode | Status | Keterangan |
|----|-------|----------|--------|--------|-----------|
| 1 | Customer Buat Booking | POST /api/bookings | POST | "Menunggu Verifikasi" | Booking dibuat, belum ada pembayaran |
| 2 | Customer Request Payment | POST /api/payment/create | POST | - | Backend generate token Midtrans |
| 3 | Dapatkan Redirect URL | Response dari step 2 | - | - | Dapat `redirect_url` & `token` |
| 4 | Buka Payment Gateway | WebView ke Midtrans | GET | - | User memilih & melakukan pembayaran |
| 5 | Midtrans Proses | Internal Midtrans | - | pending/settlement | Midtrans menunggu konfirmasi bank/e-wallet |
| 6 | Backend Menerima Webhook | POST /api/payment/webhook | POST | - | Midtrans notifikasi backend pembayaran |
| 7 | Backend Update Status | Internal Update DB | - | settlement | Status booking → "Terverifikasi" |
| 8 | App Check Status | GET /api/payment/status/:bookingId | GET | settlement | App confirm sudah bayar |
| 9 | Show Confirmation | UI Update | - | "Terverifikasi" | Tampilkan konfirmasi pembayaran |

---

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

## 🔴 **TROUBLESHOOTING: Status Masih PENDING Padahal Sudah Bayar**

### ❌ Masalah Umum:
```
Sudah bayar via Midtrans Simulator ✅
Tapi status di database tetap "pending" ❌
Padahal seharusnya berubah "settlement" ❌
```

### 🔍 Root Cause:

**Webhook dari Midtrans TIDAK DITERIMA oleh backend server Anda!**

```
YANG TERJADI:
1. ✅ User bayar di Midtrans Simulator
2. ✅ Midtrans terima pembayaran (status = settlement di Midtrans)
3. ❌ Midtrans coba send webhook ke backend
4. ❌ Backend tidak menerima / webhook tidak configured
5. ❌ Status di database tetap pending (tidak terupdate)
```

### ✅ Solusi:

#### **Solusi 1: Setup Webhook di Midtrans Dashboard (RECOMMENDED)**

**Step 1: Login ke Midtrans Dashboard**
```
Dashboard → Settings → Configuration
```

**Step 2: Scroll ke "Setting URL Endpoints"**

Ada 5 field yang akan muncul:
```
┌─────────────────────────────────────────────────────────┐
│ 1. Payment Notification URL*                   ★★★ DIISI │
│    http://                                              │
│    └─ https://your-domain.com/api/payment/webhook      │
│                                                         │
│ 2. Recurring Notification URL                  ☐ SKIP   │
│    http://                                              │
│    └─ (tidak perlu untuk sistem ini)                    │
│                                                         │
│ 3. Pay Account Notification URL                ☐ SKIP   │
│    http://                                              │
│    └─ (optional, untuk top-up wallet)                   │
│                                                         │
│ 4. Finish Redirect URL*                        ✓ OPSIONAL│
│    http://                                              │
│    └─ https://your-app.com/payment/finish             │
│       (Redirect ke app jika payment berhasil)          │
│                                                         │
│ 5. Unfinish Redirect URL*                      ✓ OPSIONAL│
│    http://                                              │
│    └─ https://your-app.com/payment/unfinish           │
│       (Redirect jika user klik back/cancel)            │
└─────────────────────────────────────────────────────────┘
```

**YANG PENTING DIISI:**

✅ **Field 1: Payment Notification URL** (WAJIB!)
```
https://your-domain.com/api/payment/webhook

Contoh:
├─ Local (dengan Ngrok): https://xxxxx.ngrok.io/api/payment/webhook
├─ Production: https://speedlab.com/api/payment/webhook
└─ Vercel: https://speedlab-app.vercel.app/api/payment/webhook
```

⚠️ **Field 4 & 5: Redirect URL** (Optional tapi recommended)
```
Finish Redirect URL: https://your-app.com/payment/success
Unfinish Redirect URL: https://your-app.com/payment/cancel
```

❌ **Field 2 & 3: Jangan perlu diisi** (tidak untuk sistem ini)

---

**Step 3: Contoh Fill Lengkap**

Jika menggunakan **Ngrok untuk local testing**:

```
Payment Notification URL:
https://xxxxx.ngrok.io/api/payment/webhook
│
└─ Yang akan diterima backend di: POST /api/payment/webhook

Finish Redirect URL: (optional)
https://yourflutterapp.com/order/success

Unfinish Redirect URL: (optional)
https://yourflutterapp.com/order/cancel
```

Atau jika **production**:

```
Payment Notification URL:
https://api.speedlab-workshop.com/api/payment/webhook

Finish Redirect URL:
https://speedlab-workshop.com/payment/success

Unfinish Redirect URL:
https://speedlab-workshop.com/payment/cancel
```

---

**Step 4: Enable & Save**

```
Setelah isi semua field:
1. Pastikan checkbox "HTTP POST notification to your Server" ☑️ ENABLED
2. Click "UPDATE" atau "SAVE"
3. Notification berhasil disimpan ✅
```

---

**Step 5: Test Webhook**

Setelah save, test dengan:

```
Opsi 1: Midtrans Notification Simulator
├─ Dashboard → Developers → Notification Simulator
├─ Input Order ID
├─ Select "Settlement Test Case"
└─ Send notification → Check backend logs

Opsi 2: Direct POST dengan Postman/cURL
├─ POST ke endpoint: http://localhost:3000/api/payment/webhook
└─ Lihat response di terminal backend
```

---

#### **Solusi 2: Gunakan Midtrans Notification Simulator (For Testing)**

Jika webhook belum bisa ditest di local, gunakan simulator dari Midtrans:

**Step 1: Buka Midtrans Notification Simulator**
```
Dashboard → Developers → Notification Simulator
```

**Step 2: Input Order ID**
```
Order ID: SPEEDLAB-{booking_id}-{timestamp}
(Cari dari payment document di MongoDB)
```

**Step 3: Pilih Status**
```
┌─────────────────────────┐
│ Settlement Test Case    │
│ Capture Test Case       │
│ Deny Test Case          │
│ Pending Test Case       │
└─────────────────────────┘
```

**Step 4: Send Notification**
```
➤ Click "Send" button
```

**Step 5: Check Database**
```
Status payment di MongoDB seharusnya berubah ke "settlement"
Status booking seharusnya → "Terverifikasi"
```

---

#### **Solusi 3: Polling Endpoint (Temporary Workaround)**

Jika webhook belum bisa disetup, gunakan polling dari Flutter app:

**Backend:** Sudah ada endpoint `/api/payment/status/:bookingId` yang fetch status terbaru dari Midtrans

**Flutter:**
```dart
// Polling otomatis setiap 2 detik
paymentService.pollPaymentStatus(
  bookingId,
  interval: const Duration(seconds: 2),
  timeout: const Duration(minutes: 5),
).listen((status) {
  if (status.isSettled) {
    print('✅ Payment confirmed via polling');
    // Update UI
  }
});
```

**Keuntungan:** Real-time update tanpa webhook
**Kekurangan:** Boros battery/data

---

### 🐛 **Debug Checklist:**

```
Webhook status masih pending? Check ini:

1. ☐ Webhook URL sudah dikonfigurasi di Midtrans Dashboard?
   └─ Settings → Configuration → Notification URL
   
2. ☐ URL webhook BENAR dan ACCESSIBLE dari internet?
   └─ https://your-domain.com/api/payment/webhook
   └─ BUKAN http://localhost:3000 (localhost tidak bisa diakses Midtrans)
   
3. ☐ "HTTP POST notification" sudah di-ENABLE?
   └─ Dashboard → Settings → Notification Method
   
4. ☐ Backend sudah running?
   └─ node server/server.js
   
5. ☐ Payment route sudah register?
   └─ /api/payment/webhook endpoint sudah ada
   
6. ☐ Environment variables sudah set?
   └─ MIDTRANS_SERVER_KEY
   └─ MIDTRANS_IS_PRODUCTION
   
7. ☐ Testing dengan Midtrans Simulator?
   └─ Dashboard → Developers → Notification Simulator
   └─ Test send notification ke backend
   
8. ☐ Check backend logs?
   └─ Lihat apakah ada error di webhook handler
```

---

### 📋 **Webhook Signature Validation:**

Webhook handler menggunakan signature validation untuk security:

```javascript
// Di paymentController.js
const hash = crypto.createHash('sha512')
  .update(`${order_id}${status_code}${gross_amount}${serverKey}`)
  .digest('hex');

if (signature_key !== hash) {
  return res.status(401).json({ message: "Invalid signature" }); // ❌ Reject
}
```

**Jika signature tidak match:**
```
❌ Webhook ditolak
❌ Status tidak terupdate
❌ Check: MIDTRANS_SERVER_KEY sudah benar?
```

---

### 📊 **Status Flow dengan Webhook:**

```
┌─────────────────────────────────────────┐
│ Backend POST /api/payment/create        │
│ → Save payment dengan status = pending  │
└──────────────────┬──────────────────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │ User bayar di Midtrans│
        │ Simulator / App       │
        └──────────────┬───────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │ Midtrans terima pembayaran    │
        │ status_transaction = settlement
        └──────────────┬───────────────┘
                       │
                       ▼
        ┌─────────────────────────────────┐
        │ Midtrans SEND WEBHOOK ke Backend│
        │ POST /api/payment/webhook      │
        │ {order_id, status, ...}        │
        └──────────────┬──────────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │ Backend terima webhook        │
        │ ✅ Signature valid?           │
        └──────────────┬───────────────┘
                       │
        ┌──────────────┴────────────────┐
        │                               │
        ▼                               ▼
    ✅ VALID                      ❌ INVALID
    Update status:                Return 401
    "settlement"                  └─ Reject
        │
        ▼
    Update Booking
    status → "Terverifikasi"
        │
        ▼
    Save to MongoDB
        │
        ▼
    ✅ DONE - Status updated!
```

---

### 🧪 **Testing Webhook Locally:**

Untuk testing di localhost, gunakan tools ini:

#### **Option 1: Ngrok (Recommended)**

```bash
# Install ngrok
# https://ngrok.com/download

# Run ngrok
ngrok http 3000
# Output: https://xxxxx.ngrok.io

# Midtrans Configuration:
# Notification URL = https://xxxxx.ngrok.io/api/payment/webhook

# Run backend
node server/server.js
```

#### **Option 2: Postman (Manual Testing)**

```
POST http://localhost:3000/api/payment/webhook
Content-Type: application/json

Body (Raw JSON):
{
  "transaction_time": "2024-01-15 10:35:00",
  "transaction_status": "settlement",
  "transaction_id": "123456789",
  "status_message": "The transaction has been successfully completed.",
  "status_code": "200",
  "signature_key": "...", // computed hash
  "server_key": "...", 
  "settlement_time": "2024-01-15 10:36:00",
  "payment_type": "bank_transfer",
  "order_id": "SPEEDLAB-booking_id-timestamp",
  "merchant_id": "...",
  "masked_card": null,
  "gross_amount": "50000.00",
  "fraud_status": "accept",
  "currency": "IDR"
}
```

---

### 📱 **Recommended Flow untuk Flutter:**

**Kombinasi Webhook + Polling (Best Practice):**

```
┌────────────────────────────────────────┐
│ 1. User click "Bayar Sekarang"         │
└─────────────┬──────────────────────────┘
              │
              ▼
┌────────────────────────────────────────┐
│ 2. POST /api/payment/create            │
│    Dapat: token, redirect_url          │
└─────────────┬──────────────────────────┘
              │
              ▼
┌────────────────────────────────────────┐
│ 3. Buka WebView Midtrans              │
│    START POLLING di background         │
└─────────────┬──────────────────────────┘
              │
              ▼
┌────────────────────────────────────────┐
│ 4a. Webhook dari Midtrans (Main)       │
│     Backend update DB + Booking        │
│                          OR            │
│ 4b. Polling detect "settlement"        │
│     (Fallback jika webhook delay)      │
└─────────────┬──────────────────────────┘
              │
              ▼
┌────────────────────────────────────────┐
│ 5. Show Success Dialog                 │
│    Status = "settlement"               │
│    Booking = "Terverifikasi"           │
└────────────────────────────────────────┘
```

**Implementasi:**
```dart
void _handlePayment() async {
  // 1. Buka payment
  Navigator.of(context).push(PaymentScreen(...));
  
  // 2. Start polling sebagai backup
  paymentService.pollPaymentStatus(
    bookingId,
    interval: const Duration(seconds: 2),
  ).listen((status) {
    if (status.isSettled) {
      // Webhook mungkin sudah update, atau polling yang detect
      showSuccessDialog();
    }
  });
}
```

---

## 💾 **STRUKTUR DATABASE PAYMENT**

### Collection: `Payment` (MongoDB)

Status pembayaran disimpan di collection **`Payment`** dengan struktur berikut:

```javascript
{
  _id: ObjectId("..."),
  
  // 1. RELASI KE BOOKING & USER
  bookingId: ObjectId("booking_123"),  // Reference ke collection Booking
  userId: ObjectId("user_456"),         // Reference ke collection User
  
  // 2. INFORMASI MIDTRANS
  orderId: "SPEEDLAB-booking_123-1705315200000", // Unique ID yang dikirim ke Midtrans
  snapToken: "66e4fa55-fdac-4ef9-91b5-733b5b26xxxx", // Token untuk WebView
  snapRedirectUrl: "https://app.sandbox.midtrans.com/snap/v3/redirection/...",
  
  // 3. INFORMASI PEMBAYARAN
  grossAmount: 50000, // Rp 50.000 (DP)
  transactionStatus: "settlement", // ⭐ STATUS PEMBAYARAN
  paymentType: "bank_transfer", // Tipe metode: gopay, bank_transfer, credit_card, dll
  
  // 4. TIMESTAMPS
  createdAt: ISODate("2024-01-15T10:30:00.000Z"),
  updatedAt: ISODate("2024-01-15T10:35:00.000Z")
}
```

### Field Penting - Status Pembayaran:

```javascript
transactionStatus: String // Status payment dari Midtrans

Nilai yang mungkin:
├─ "pending"      → ⏱️ Menunggu pembayaran (initial status)
├─ "settlement"   → ✅ PEMBAYARAN BERHASIL (LUNAS)
├─ "cancel"       → ❌ Dibatalkan oleh user
├─ "expire"       → ⏰ Kadaluarsa (timeout 15 menit)
├─ "deny"         → 🚫 Ditolak oleh sistem/bank
└─ "refund"       → 💰 Dana dikembalikan (refund)
```

### Relasi dengan Collection Lain:

```
┌─────────────┐
│   Payment   │
├─────────────┤
│ _id         │
│ bookingId ──┼──→ Booking._id
│ userId ────┼──→ User._id
│ orderId     │
│ grossAmount │
│ transStatus │ ⭐ STATUS PEMBAYARAN
│ paymentType │
│ createdAt   │
└─────────────┘

Ketika transactionStatus = "settlement":
  ↓
  Booking.status OTOMATIS BERUBAH MENJADI "Terverifikasi"
```

### Query Examples - Cek Status Pembayaran:

```javascript
// ========== 1. Cek status payment berdasarkan bookingId ==========
db.payments.findOne({ bookingId: ObjectId("booking_123") });
// Return: payment document dengan status terbaru

// ========== 2. Cek semua payment pending (belum bayar) ==========
db.payments.find({ transactionStatus: "pending" });

// ========== 3. Cek semua payment settlement (sudah bayar) ==========
db.payments.find({ transactionStatus: "settlement" });

// ========== 4. Cek payment user tertentu ==========
db.payments.find({ userId: ObjectId("user_456") });

// ========== 5. Cek total revenue dari settlement payments ==========
db.payments.aggregate([
  { $match: { transactionStatus: "settlement" } },
  { $group: { 
      _id: null, 
      totalRevenue: { $sum: "$grossAmount" } 
    }
  }
]);

// ========== 6. Cek payment berdasarkan payment type ==========
db.payments.find({ paymentType: "gopay" });
db.payments.find({ paymentType: "bank_transfer" });
```

### Status Flow Diagram:

```
CREATE PAYMENT
      │
      ▼
transactionStatus = "pending"
      │
      ├─────────────────────┐
      │                     │
      ▼                     ▼
  USER BAYAR          TIMEOUT/BATAL
      │                     │
      ▼                     ▼
  MIDTRANS           transactionStatus
  TERIMA              = "expire"/"cancel"
      │
      ▼
  WEBHOOK CALL
  /api/payment/webhook
      │
      ▼
  Status berubah:
  "settlement" (✅ LUNAS)
      │
      ▼
  Booking.status 
  otomatis → "Terverifikasi"
      │
      ▼
  DB Payment terupdate
```

### Payment Lifecycle:

| Tahap | Status | Kondisi | Booking Status |
|-------|--------|---------|---|
| **1. Create Payment** | `pending` | User baru request pembayaran | "Menunggu Verifikasi" |
| **2. User Bayar** | `pending` | User sedang di Midtrans WebView | "Menunggu Verifikasi" |
| **3. Pembayaran Berhasil** | `settlement` | Midtrans send webhook dengan status settlement | "Terverifikasi" (auto update) |
| **4. Payment Expired** | `expire` | User tidak bayar dalam 15 menit | "Menunggu Verifikasi" |
| **5. Payment Cancelled** | `cancel` | User cancel di Midtrans | "Menunggu Verifikasi" |
| **6. Payment Denied** | `deny` | Sistem/Bank tolak pembayaran | "Menunggu Verifikasi" |
| **7. Refund** | `refund` | Dana dikembalikan ke customer | Tergantung (bisa tetap "Terverifikasi") |

### Cara Check Status via API:

```http
GET /api/payment/status/:bookingId
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "orderId": "SPEEDLAB-booking_123-1705315200000",
    "bookingId": "booking_123",
    "userId": "user_456",
    "grossAmount": 50000,
    "transactionStatus": "settlement", // ⭐ CHECK INI
    "paymentType": "bank_transfer",
    "snapToken": "66e4fa55-fdac-...",
    "snapRedirectUrl": "https://app.sandbox.midtrans.com/...",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:35:00.000Z"
  }
}
```

### Catatan Penting:

✅ **Status Otomatis:**
- Status ini **otomatis terupdate** ketika Midtrans mengirim webhook
- Backend akan menerima notifikasi dari Midtrans dan update database

✅ **Booking Auto-Verify:**
- Ketika `transactionStatus = "settlement"`, booking status **otomatis berubah** ke "Terverifikasi"
- Ini adalah integrasi automatic yang sudah built-in di webhook handler

✅ **Polling Backup:**
- Flutter app bisa polling endpoint `/api/payment/status/:bookingId` sebagai backup
- Jika webhook delay, polling akan detect settlement status

---

## � **IMPLEMENTASI DI FLUTTER**

### 1. Setup Dependencies
Tambahkan ke `pubspec.yaml`:
```yaml
dependencies:
  flutter:
    sdk: flutter
  dio: ^5.0.0  # HTTP Client
  webview_flutter: ^4.0.0  # WebView untuk Midtrans
  http: ^1.1.0
```

### 2. Buat Payment Service

**File: `lib/services/payment_service.dart`**

```dart
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

class PaymentService {
  final Dio dio;
  final String baseUrl = "http://localhost:3000/api";
  final String? jwtToken;

  PaymentService({required this.dio, required this.jwtToken});

  // ========== 1. CREATE PAYMENT ==========
  /// Membuat payment request ke Midtrans
  /// Returns: {token, redirect_url}
  Future<PaymentResponse> createPayment(String bookingId) async {
    try {
      final response = await dio.post(
        "$baseUrl/payment/create",
        data: {"bookingId": bookingId},
        options: Options(
          headers: {
            "Authorization": "Bearer $jwtToken",
            "Content-Type": "application/json",
          },
        ),
      );

      if (response.statusCode == 200 && response.data['success']) {
        return PaymentResponse.fromJson(response.data['data']);
      } else {
        throw Exception(response.data['message'] ?? 'Failed to create payment');
      }
    } catch (e) {
      rethrow;
    }
  }

  // ========== 2. CHECK PAYMENT STATUS ==========
  /// Mengecek status pembayaran dari booking
  /// Returns: {orderId, grossAmount, transactionStatus, paymentType, ...}
  Future<PaymentStatusResponse> checkPaymentStatus(String bookingId) async {
    try {
      final response = await dio.get(
        "$baseUrl/payment/status/$bookingId",
        options: Options(
          headers: {
            "Authorization": "Bearer $jwtToken",
            "Content-Type": "application/json",
          },
        ),
      );

      if (response.statusCode == 200 && response.data['success']) {
        return PaymentStatusResponse.fromJson(response.data['data']);
      } else {
        throw Exception(response.data['message'] ?? 'Failed to check payment status');
      }
    } catch (e) {
      rethrow;
    }
  }

  // ========== 3. GET PAYMENT HISTORY ==========
  /// Mendapatkan riwayat pembayaran user
  /// Optional: filter dengan bookingId
  Future<List<PaymentHistoryItem>> getPaymentHistory({String? bookingId}) async {
    try {
      String url = "$baseUrl/payment/history";
      if (bookingId != null) {
        url += "?bookingId=$bookingId";
      }

      final response = await dio.get(
        url,
        options: Options(
          headers: {
            "Authorization": "Bearer $jwtToken",
            "Content-Type": "application/json",
          },
        ),
      );

      if (response.statusCode == 200 && response.data['success']) {
        List<dynamic> data = response.data['data'];
        return data.map((item) => PaymentHistoryItem.fromJson(item)).toList();
      } else {
        throw Exception(response.data['message'] ?? 'Failed to get payment history');
      }
    } catch (e) {
      rethrow;
    }
  }

  // ========== 4. POLLING STATUS (Optional but Recommended) ==========
  /// Polling status pembayaran setiap beberapa detik
  /// Berguna untuk mendeteksi pembayaran tanpa bergantung webhook
  Stream<PaymentStatusResponse> pollPaymentStatus(
    String bookingId, {
    Duration interval = const Duration(seconds: 2),
    Duration timeout = const Duration(minutes: 5),
  }) {
    return Stream.periodic(interval).asyncMap((_) async {
      try {
        return await checkPaymentStatus(bookingId);
      } catch (e) {
        throw Exception('Polling error: $e');
      }
    }).timeout(
      timeout,
      onTimeout: (sink) {
        sink.close();
      },
    );
  }
}

// ========== MODELS ==========

class PaymentResponse {
  final String token;
  final String redirectUrl;

  PaymentResponse({
    required this.token,
    required this.redirectUrl,
  });

  factory PaymentResponse.fromJson(Map<String, dynamic> json) {
    return PaymentResponse(
      token: json['token'] ?? '',
      redirectUrl: json['redirect_url'] ?? '',
    );
  }
}

class PaymentStatusResponse {
  final String orderId;
  final String bookingId;
  final int grossAmount;
  final String transactionStatus; // pending, settlement, cancel, expire, deny
  final String paymentType; // bank_transfer, gopay, credit_card, etc
  final String snapToken;
  final String snapRedirectUrl;
  final DateTime createdAt;
  final DateTime updatedAt;

  PaymentStatusResponse({
    required this.orderId,
    required this.bookingId,
    required this.grossAmount,
    required this.transactionStatus,
    required this.paymentType,
    required this.snapToken,
    required this.snapRedirectUrl,
    required this.createdAt,
    required this.updatedAt,
  });

  bool get isSettled => transactionStatus == 'settlement';
  bool get isPending => transactionStatus == 'pending';
  bool get isExpired => transactionStatus == 'expire';
  bool get isCancelled => transactionStatus == 'cancel';

  factory PaymentStatusResponse.fromJson(Map<String, dynamic> json) {
    return PaymentStatusResponse(
      orderId: json['orderId'] ?? '',
      bookingId: json['bookingId'] ?? '',
      grossAmount: json['grossAmount'] ?? 0,
      transactionStatus: json['transactionStatus'] ?? 'pending',
      paymentType: json['paymentType'] ?? '',
      snapToken: json['snapToken'] ?? '',
      snapRedirectUrl: json['snapRedirectUrl'] ?? '',
      createdAt: DateTime.parse(json['createdAt']),
      updatedAt: DateTime.parse(json['updatedAt']),
    );
  }
}

class PaymentHistoryItem {
  final String id;
  final String orderId;
  final String bookingId;
  final int grossAmount;
  final String transactionStatus;
  final String paymentType;
  final DateTime createdAt;

  PaymentHistoryItem({
    required this.id,
    required this.orderId,
    required this.bookingId,
    required this.grossAmount,
    required this.transactionStatus,
    required this.paymentType,
    required this.createdAt,
  });

  factory PaymentHistoryItem.fromJson(Map<String, dynamic> json) {
    return PaymentHistoryItem(
      id: json['_id'] ?? '',
      orderId: json['orderId'] ?? '',
      bookingId: json['bookingId'] ?? '',
      grossAmount: json['grossAmount'] ?? 0,
      transactionStatus: json['transactionStatus'] ?? '',
      paymentType: json['paymentType'] ?? '',
      createdAt: DateTime.parse(json['createdAt']),
    );
  }
}
```

### 3. Buat Payment UI Widget

**File: `lib/screens/payment_screen.dart`**

```dart
import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:your_app/services/payment_service.dart';

class PaymentScreen extends StatefulWidget {
  final String bookingId;
  final PaymentService paymentService;

  const PaymentScreen({
    required this.bookingId,
    required this.paymentService,
  });

  @override
  State<PaymentScreen> createState() => _PaymentScreenState();
}

class _PaymentScreenState extends State<PaymentScreen> {
  late WebViewController webViewController;
  bool isLoading = true;
  String? paymentUrl;

  @override
  void initState() {
    super.initState();
    _initializePayment();
  }

  /// [STEP 1] Minta token pembayaran dari backend
  Future<void> _initializePayment() async {
    try {
      final paymentResponse = await widget.paymentService.createPayment(
        widget.bookingId,
      );

      if (mounted) {
        setState(() {
          paymentUrl = paymentResponse.redirectUrl;
        });

        _setupWebView();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: ${e.toString()}')),
        );
      }
    }
  }

  /// [STEP 2] Setup WebView untuk Midtrans
  void _setupWebView() {
    webViewController = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageStarted: (String url) {
            setState(() => isLoading = true);
          },
          onPageFinished: (String url) {
            setState(() => isLoading = false);
            // Cek apakah redirect kembali ke app (optional)
            _checkPaymentStatus();
          },
          onWebResourceError: (WebResourceError error) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text('Error: ${error.description}')),
            );
          },
        ),
      )
      ..loadRequest(Uri.parse(paymentUrl!));
  }

  /// [STEP 3] Polling status pembayaran
  /// Cara 1: Polling otomatis setiap 2 detik
  /// Cara 2: User click button "Cek Status Pembayaran"
  Future<void> _checkPaymentStatus() async {
    try {
      final status = await widget.paymentService.checkPaymentStatus(
        widget.bookingId,
      );

      if (mounted) {
        if (status.isSettled) {
          // ✅ PEMBAYARAN BERHASIL
          _showSuccessDialog(status);
        } else if (status.isPending) {
          // ⏱️ MASIH PENDING
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Pembayaran masih diproses...'),
              duration: Duration(seconds: 3),
            ),
          );
        } else if (status.isExpired) {
          // ❌ KADALUARSA
          _showExpiredDialog(status);
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error checking status: ${e.toString()}')),
        );
      }
    }
  }

  void _showSuccessDialog(PaymentStatusResponse status) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('✅ Pembayaran Berhasil'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Order ID: ${status.orderId}'),
            Text('Amount: Rp ${status.grossAmount}'),
            Text('Payment Type: ${status.paymentType}'),
            Text('Status: ${status.transactionStatus}'),
          ],
        ),
        actions: [
          ElevatedButton(
            onPressed: () {
              Navigator.of(context)
                ..pop() // Close dialog
                ..pop(); // Back to booking page
            },
            child: const Text('Kembali ke Booking'),
          ),
        ],
      ),
    );
  }

  void _showExpiredDialog(PaymentStatusResponse status) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('❌ Pembayaran Expired'),
        content: const Text('Waktu pembayaran telah berakhir. Silakan buat booking baru.'),
        actions: [
          ElevatedButton(
            onPressed: () {
              Navigator.of(context)
                ..pop()
                ..pop();
            },
            child: const Text('Kembali'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Pembayaran Midtrans'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _checkPaymentStatus,
            tooltip: 'Cek Status Pembayaran',
          ),
        ],
      ),
      body: paymentUrl == null
          ? const Center(child: CircularProgressIndicator())
          : Stack(
              children: [
                WebViewWidget(controller: webViewController),
                if (isLoading)
                  const Center(
                    child: CircularProgressIndicator(),
                  ),
              ],
            ),
    );
  }
}
```

### 4. Implementasi di Booking Page

**File: `lib/screens/booking_detail_screen.dart`** (Contoh snippet)

```dart
class BookingDetailScreen extends StatefulWidget {
  final String bookingId;
  // ...
  @override
  State<BookingDetailScreen> createState() => _BookingDetailScreenState();
}

class _BookingDetailScreenState extends State<BookingDetailScreen> {
  late PaymentService paymentService;
  // ...

  @override
  void initState() {
    super.initState();
    paymentService = PaymentService(
      dio: Dio(),
      jwtToken: _getStoredToken(), // dari SharedPreferences/Provider
    );
  }

  void _handlePaymentClick() async {
    try {
      // ========== CARA 1: LANGSUNG KE PAYMENT SCREEN ==========
      Navigator.of(context).push(
        MaterialPageRoute(
          builder: (_) => PaymentScreen(
            bookingId: widget.bookingId,
            paymentService: paymentService,
          ),
        ),
      ).then((_) {
        // Setelah kembali dari payment, refresh status booking
        _refreshBookingStatus();
      });

      // ========== ATAU CARA 2: DENGAN LOADING DIALOG ==========
      // showDialog(
      //   context: context,
      //   builder: (_) => AlertDialog(
      //     title: const Text('Loading...'),
      //     content: FutureBuilder<PaymentResponse>(
      //       future: paymentService.createPayment(widget.bookingId),
      //       builder: (context, snapshot) {
      //         if (snapshot.connectionState == ConnectionState.done) {
      //           if (snapshot.hasData) {
      //             // Launch payment URL
      //             _launchPaymentUrl(snapshot.data!.redirectUrl);
      //           } else {
      //             return Text('Error: ${snapshot.error}');
      //           }
      //         }
      //         return const CircularProgressIndicator();
      //       },
      //     ),
      //   ),
      // );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: ${e.toString()}')),
      );
    }
  }

  Future<void> _refreshBookingStatus() async {
    try {
      final status = await paymentService.checkPaymentStatus(widget.bookingId);
      if (status.isSettled) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('✅ Pembayaran berhasil!')),
        );
        // Update UI dan booking data
        setState(() {
          // Update booking status
        });
      }
    } catch (e) {
      debugPrint('Error refreshing status: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Detail Booking')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            // ... booking details ...
            const SizedBox(height: 20),
            ElevatedButton.icon(
              onPressed: _handlePaymentClick,
              icon: const Icon(Icons.payment),
              label: const Text('Bayar Sekarang'),
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 24),
                backgroundColor: Colors.blue,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
```

### 5. Best Practices

#### ✅ **POLLING vs WEBHOOK**

| Metode | Kelebihan | Kekurangan | Kapan Gunakan |
|--------|-----------|-----------|---------------|
| **Polling** | Real-time di app, tidak perlu server setup | Boros battery/data | Testing, atau production dengan webhook backup |
| **Webhook** | Ef fisien (backend trigger) | Butuh konfigurasi server | Production (recommended) |
| **kombinasi** | Best of both | Setup kompleks | Production + realtime UI |

#### ✅ **RECOMMENDED IMPLEMENTATION**

```dart
// Gunakan kombinasi: Webhook + Polling Backup
Future<void> _handlePaymentFlow(String bookingId) async {
  // 1. Buka payment WebView
  Navigator.of(context).push(...PaymentScreen...);

  // 2. Polling untuk backup (jika webhook delay)
  final pollStream = paymentService.pollPaymentStatus(
    bookingId,
    interval: const Duration(seconds: 2),
    timeout: const Duration(minutes: 5),
  );

  // 3. Listen polling result
  pollStream.listen((status) {
    if (status.isSettled) {
      print('✅ Payment confirmed via polling');
      _updateBookingUI();
    }
  });

  // 4. Webhook akan trigger server-side update
  //    (Backend sudah update booking status)
}
```

#### ✅ **ERROR HANDLING**

```dart
Future<void> _createPaymentWithErrorHandling(String bookingId) async {
  try {
    final response = await paymentService.createPayment(bookingId);
    
    // Check if redirect_url valid
    if (response.redirectUrl.isEmpty) {
      throw Exception('Redirect URL kosong');
    }
    
    // Load URL ke WebView
    // ...
  } on DioException catch (e) {
    if (e.response?.statusCode == 401) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Session expired. Silakan login ulang.')),
      );
      Navigator.of(context).pushNamedAndRemoveUntil('/login', (_) => false);
    } else if (e.response?.statusCode == 400) {
      final message = e.response?.data['message'] ?? 'Invalid booking data';
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $message')),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Network error: ${e.message}')),
      );
    }
  } catch (e) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Unexpected error: ${e.toString()}')),
    );
  }
}
```

---

## �🚀 Cara Menjalankan

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
6. **Payment Integration** - 3 Pilihan Implementasi:

   **Opsi 1: Sederhana (Hanya WebView)**
   ```
   1. User click "Bayar Sekarang"
   2. API POST /api/payment/create → dapat redirect_url
   3. Buka WebView ke Midtrans
   4. User bayar (pilih metode)
   5. Redirect kembali ke app
   6. User click "Cek Status" → GET /api/payment/status/bookingId
   7. Jika settlement → show success
   ```

   **Opsi 2: Realtime Polling (Recommended untuk Testing)**
   ```
   1. User click "Bayar Sekarang"
   2. API POST /api/payment/create → dapat redirect_url
   3. Buka WebView ke Midtrans + start polling di background
   4. User bayar
   5. App detect settlement via polling (setiap 2 detik)
   6. Show success otomatis (tidak perlu user action)
   ```

   **Opsi 3: Production-Grade (Webhook + Polling Backup)**
   ```
   1-5. Same seperti Opsi 2
   6. Backend juga receive webhook dari Midtrans
   7. Backend update booking status otomatis
   8. App polling sebagai backup (fallback jika webhook delay)
   9. User experience: pembayaran confirmed ASAP
   ```

   See section **💻 IMPLEMENTASI DI FLUTTER** untuk detail & code samples!

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
