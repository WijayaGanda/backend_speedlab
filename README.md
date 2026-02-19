# SpeedLab Workshop - Backend API

Backend API untuk sistem pelayanan bengkel motor SpeedLab menggunakan Node.js, Express, dan MongoDB.

## 🚀 Features

- ✅ Authentication & Authorization (JWT)
- ✅ Multi-role support (Pelanggan, Admin, Pemilik)
- ✅ Motorcycle registration & management
- ✅ Service menu management
- ✅ Booking/Reservation system (FIFO)
- ✅ Service history tracking
- ✅ Warranty claim system
- ✅ Employee management
- ✅ Status tracking untuk grafik
- ✅ Google OAuth integration

## 📋 Prerequisites

- Node.js (v14 atau lebih tinggi)
- MongoDB (v4 atau lebih tinggi)
- npm atau yarn

## 🔧 Installation

1. Clone repository ini

2. Install dependencies:
```bash
npm install
```

3. Setup environment variables:
```bash
cp .env.example .env
```

4. Edit file `.env` sesuai konfigurasi Anda:
```env
MONGODB_URI=mongodb://localhost:27017/speedlabDB
JWT_SECRET=your-super-secret-jwt-key-here
SESSION_SECRET=your-session-secret-key-here
PORT=3000
```

5. Pastikan MongoDB sudah berjalan

6. Jalankan server:
```bash
# Production
npm start

# Development (with auto-reload)
npm run dev
```

Server akan berjalan di `http://localhost:3000`

## 📚 API Documentation

Dokumentasi lengkap API tersedia di file [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

### Base URL
```
http://localhost:3000/api
```

### Endpoints Overview

| Endpoint | Description |
|----------|-------------|
| `/api/auth` | Authentication (register, login, profile) |
| `/api/users` | User management (admin only) |
| `/api/motorcycles` | Motorcycle registration & management |
| `/api/services` | Service menu management |
| `/api/bookings` | Booking/Reservation system |
| `/api/service-histories` | Service history records |
| `/api/warranties` | Warranty claims |
| `/api/employees` | Employee management (owner only) |

## 🔐 User Roles

### 1. Pelanggan (Customer)
- Register & login
- Daftar motor (multiple)
- Buat reservasi
- Lihat status motor
- Lihat riwayat servis
- Klaim garansi

### 2. Admin
- Kelola data pelanggan
- Kelola data motor
- Kelola layanan
- Verifikasi reservasi
- Update status motor
- Buat riwayat servis
- Verifikasi klaim garansi

### 3. Pemilik (Owner)
- Semua akses admin
- Kelola karyawan
- Lihat statistik lengkap

## 📊 Data Structure

### Models
- **User**: Data pengguna dengan role
- **Motorcycle**: Data motor pelanggan
- **Service**: Menu layanan bengkel
- **Booking**: Data reservasi/booking
- **ServiceHistory**: Riwayat servis motor
- **Warranty**: Klaim garansi
- **Employee**: Data karyawan

## 🔄 Flow Aplikasi

### Customer Flow:
```
Register/Login → Daftar Motor → Buat Reservasi → 
Lihat Status Motor → Lihat Riwayat Servis → Klaim Garansi
```

### Admin Flow:
```
Login → Lihat Booking Hari Ini (FIFO) → Verifikasi Reservasi → 
Update Status Motor → Buat Service History → Kelola Data
```

### Owner Flow:
```
Login → Dashboard Statistik → Lihat Status Pengerjaan → 
Kelola Karyawan → Lihat Semua Data
```

## 📈 Features untuk Flutter

### 1. Status Motor (Tracking Pengerjaan)
```http
GET /api/motorcycles/stats/summary
```
Response untuk grafik:
```json
{
  "Menunggu": 5,
  "Sedang Dikerjakan": 3,
  "Selesai": 10,
  "Diambil": 20
}
```

### 2. Booking FIFO (Antrian)
```http
GET /api/bookings?date=2024-01-15
```
Data sudah di-sort berdasarkan waktu booking (First In First Out)

### 3. Update Status Real-time
```http
PATCH /api/motorcycles/:id/status
```
Untuk update status pengerjaan motor

## 🛠️ Development

### Struktur Folder
```
Backend/
├── controllers/        # Business logic
│   ├── authController.js
│   ├── userController.js
│   ├── motorcycleController.js
│   ├── serviceController.js
│   ├── bookingController.js
│   ├── serviceHistoryController.js
│   ├── warrantyController.js
│   └── employeeController.js
├── middleware/         # Middleware (auth, etc)
│   └── auth.js
├── model/             # Database models
│   ├── UserModel.js
│   ├── MotorcycleModel.js
│   ├── ServiceModel.js
│   ├── BookingModel.js
│   ├── ServiceHistoryModel.js
│   ├── WarrantyModel.js
│   └── EmployeeModel.js
├── routes/            # API routes
│   ├── authRoutes.js
│   ├── userRoutes.js
│   ├── motorcycleRoutes.js
│   ├── serviceRoutes.js
│   ├── bookingRoutes.js
│   ├── serviceHistoryRoutes.js
│   ├── warrantyRoutes.js
│   └── employeeRoutes.js
├── server/            # Server configuration
│   └── server.js
├── .env.example       # Environment variables example
├── package.json
└── README.md
```

## 📝 Testing dengan Postman/Thunder Client

1. Import collection atau buat request manual
2. Register user baru
3. Login dan copy token
4. Gunakan token di header untuk request lainnya:
   ```
   Authorization: Bearer <your-token>
   ```

## ⚠️ Important Notes

### Untuk Production:
1. **Hash Password**: Gunakan bcrypt untuk hash password (saat ini masih plain text)
2. **Environment Variables**: Ganti semua secret key dengan yang lebih aman
3. **Rate Limiting**: Tambahkan rate limiting untuk prevent abuse
4. **CORS**: Konfigurasi CORS dengan whitelist domain
5. **HTTPS**: Gunakan HTTPS untuk production
6. **Input Validation**: Tambahkan validasi input yang lebih ketat
7. **Error Handling**: Improve error handling dan logging

### Untuk Flutter Developer:
1. Simpan JWT token setelah login
2. Kirim token di header setiap request
3. Handle error response dengan baik
4. Implementasi refresh token jika diperlukan
5. Gunakan endpoint `/stats/summary` untuk grafik

## 🐛 Troubleshooting

### MongoDB Connection Error
```bash
# Pastikan MongoDB berjalan
# Windows
net start MongoDB

# Linux/Mac
sudo systemctl start mongod
```

### Port Already in Use
```bash
# Ganti PORT di .env
PORT=3001
```

### JWT Token Expired
- Token berlaku 7 hari
- Implementasi refresh token jika diperlukan
- User perlu login ulang setelah 7 hari

## 📞 Support

Jika ada pertanyaan atau issues, silakan buat issue di repository ini.

## 📄 License

ISC

---

Made with ❤️ for SpeedLab Workshop
