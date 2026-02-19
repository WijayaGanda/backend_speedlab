# 🚀 Quick Start Guide - SpeedLab Workshop API

Panduan cepat untuk menjalankan backend API SpeedLab Workshop.

## Prerequisites

✅ Node.js (v14+)  
✅ MongoDB (v4+)  
✅ npm atau yarn

---

## 🔧 Setup dalam 5 Menit

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Environment
```bash
# Copy file .env.example ke .env
cp .env.example .env

# Edit .env jika perlu (default sudah OK untuk development)
```

### 3. Jalankan MongoDB
```bash
# Windows
net start MongoDB

# Linux/Mac
sudo systemctl start mongod

# Atau gunakan MongoDB Compass / Docker
```

### 4. Seed Database (Optional tapi Recommended)
```bash
npm run seed
```

Ini akan membuat:
- 3 user dengan role berbeda (admin, owner, customer)
- 10 layanan bengkel

Login credentials setelah seed:
```
Admin:
  Email: admin@speedlab.com
  Password: admin123

Owner:
  Email: owner@speedlab.com
  Password: owner123

Customer:
  Email: budi@example.com
  Password: budi123
```

### 5. Start Server
```bash
# Production mode
npm start

# Development mode (auto-reload)
npm run dev
```

Server akan berjalan di: `http://localhost:3000`

---

## ✅ Test API

### Test 1: Check Server
```bash
# Browser atau curl
http://localhost:3000
```

Response:
```json
{
  "success": true,
  "message": "SpeedLab Workshop API",
  "version": "1.0.0",
  "endpoints": { ... }
}
```

### Test 2: Login
```bash
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "admin@speedlab.com",
  "password": "admin123"
}
```

### Test 3: Get Services (Public)
```bash
GET http://localhost:3000/api/services
```

---

## 📱 Untuk Flutter Developer

### 1. Base URL
```dart
const String baseUrl = 'http://localhost:3000/api';
// Atau gunakan IP komputer Anda jika test di device fisik
// const String baseUrl = 'http://192.168.1.100:3000/api';
```

### 2. Login & Save Token
```dart
// Login
final response = await http.post(
  Uri.parse('$baseUrl/auth/login'),
  headers: {'Content-Type': 'application/json'},
  body: jsonEncode({
    'email': 'budi@example.com',
    'password': 'budi123'
  }),
);

if (response.statusCode == 200) {
  final data = jsonDecode(response.body);
  final token = data['data']['token'];
  
  // Simpan token (gunakan SharedPreferences atau Hive)
  await saveToken(token);
}
```

### 3. Request dengan Token
```dart
final token = await getToken();

final response = await http.get(
  Uri.parse('$baseUrl/motorcycles/my-motorcycles'),
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer $token',
  },
);
```

### 4. Endpoint untuk Grafik
```dart
// Statistik Status Motor
GET /api/motorcycles/stats/summary

// Statistik Booking
GET /api/bookings/stats/summary
```

---

## 📚 Documentation

### Lengkap
- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - Dokumentasi lengkap semua endpoint
- [TESTING_EXAMPLES.md](./TESTING_EXAMPLES.md) - Contoh request untuk testing
- [README.md](./README.md) - Dokumentasi umum

### Quick Reference

**Authentication**
- POST `/api/auth/register` - Register user baru
- POST `/api/auth/login` - Login
- GET `/api/auth/profile` - Get profile (auth required)

**Motorcycles**
- POST `/api/motorcycles` - Daftar motor (customer)
- GET `/api/motorcycles/my-motorcycles` - My motorcycles (customer)
- GET `/api/motorcycles/stats/summary` - Statistics (admin/owner)

**Bookings**
- POST `/api/bookings` - Buat booking (customer)
- GET `/api/bookings/my-bookings` - My bookings (customer)
- GET `/api/bookings?date=2024-01-20` - Get bookings by date (admin)
- PATCH `/api/bookings/:id/verify` - Verify booking (admin)

**Services**
- GET `/api/services` - Get all services (public)

---

## 🐛 Troubleshooting

### Problem: MongoDB Connection Failed
**Solution:**
```bash
# Check MongoDB status
mongod --version

# Start MongoDB
net start MongoDB  # Windows
sudo systemctl start mongod  # Linux
```

### Problem: Port 3000 already in use
**Solution:**
Edit `.env` file:
```env
PORT=3001
```

### Problem: JWT Token Invalid
**Solution:**
- Token berlaku 7 hari
- Login ulang untuk mendapatkan token baru
- Pastikan format header: `Authorization: Bearer <token>`

### Problem: CORS Error dari Flutter
**Solution:**
CORS sudah diaktifkan. Jika masih error:
1. Pastikan menggunakan IP yang benar (bukan localhost jika test di device)
2. Cek firewall

---

## 📊 Flow Testing Cepat

### Scenario 1: Customer Journey (5 menit)
```bash
1. Register customer
2. Login → dapat token
3. POST /api/motorcycles → daftar motor
4. POST /api/bookings → buat booking
5. GET /api/bookings/my-bookings → lihat booking
```

### Scenario 2: Admin Journey (5 menit)
```bash
1. Login as admin
2. GET /api/bookings?date=today → lihat booking hari ini
3. PATCH /api/bookings/:id/verify → verifikasi
4. PATCH /api/motorcycles/:id/status → update status
5. GET /api/motorcycles/stats/summary → lihat grafik
```

---

## 🎯 Next Steps

1. ✅ Baca [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) untuk detail lengkap
2. ✅ Test semua endpoint dengan Postman/Thunder Client
3. ✅ Implementasi di Flutter
4. ✅ Setup error handling yang baik
5. ✅ Implementasi refresh token jika perlu

---

## 💡 Tips

- Gunakan **Postman** atau **Thunder Client** untuk testing API
- Simpan collection request untuk reuse
- Test dengan berbagai role (pelanggan, admin, owner)
- Gunakan endpoint statistics untuk grafik di Flutter
- Always handle error response dengan baik

---

## 📞 Need Help?

- Check [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
- Check [TESTING_EXAMPLES.md](./TESTING_EXAMPLES.md)
- Create an issue di repository

---

**Happy Coding! 🚀**

Made with ❤️ for SpeedLab Workshop
