# Quick Test Guide: Booking Notification Flow

Panduan lengkap untuk testing notification system end-to-end dengan skenario real booking workflow.

---

## ⚙️ Setup (Run Once)

### 1. Make sure server is running
```bash
cd "d:\Kodingan TA\Backend"
npm run dev
# Output: "Firebase Admin SDK initialized successfully"
```

### 2. Setup test accounts (if not exists)
Buat 3 user via admin panel atau database:
- **User:** email=`john@example.com`, password=`password123`, role=`pelanggan`
- **Admin1:** email=`admin@example.com`, password=`admin123`, role=`admin`
- **Admin2:** email=`pemilik@example.com`, password=`pemilik123`, role=`pemilik`

---

## 📱 FULL END-TO-END TEST SCENARIO

### Step 1: Login sebagai User
```bash
# Login user - Joko Santoso
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "joko@example.com",
    "password": "password123"
  }'
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "_id": "user123",
    "name": "Joko Santoso",
    "email": "joko@example.com",
    "role": "pelanggan"
  }
}
```

**Copy token:**
```bash
export USER_TOKEN="eyJhbGciOiJIUzI1NiIs..."
export USER_ID="user123"
```

---

### Step 2: Register User's Device untuk FCM
```bash
# User register perangkat mereka
curl -X POST http://localhost:5000/api/notifications/register-device \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fcmToken": "user_device_token_xyz123",
    "deviceName": "Joko Redmi Note 11",
    "deviceId": "joko_device_001",
    "platform": "android"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Device registered successfully",
  "data": {
    "_id": "device123",
    "userId": "user123",
    "fcmToken": "user_device_token_xyz123",
    "isActive": true
  }
}
```

---

### Step 3: Login sebagai Admin
```bash
# Login admin
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }'
```

**Copy token:**
```bash
export ADMIN_TOKEN="eyJhbGciOiJIUzI1NiIs..."
export ADMIN_ID="admin123"
```

---

### Step 4: Register Admin's Device untuk FCM
```bash
# Admin register device
curl -X POST http://localhost:5000/api/notifications/register-device \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fcmToken": "admin_device_token_abc789",
    "deviceName": "Admin MacBook Pro",
    "deviceId": "admin_device_001",
    "platform": "web"
  }'
```

---

## 🔔 NOTIFICATION WORKFLOW TESTING

### ⭐ TEST 1: User Books → Admin Gets Notification

**User creates booking:**
```bash
# User membuat booking
curl -X POST http://localhost:5000/api/bookings \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "motorcycleId": "motorcycle123",
    "serviceIds": ["service1", "service2"],
    "bookingDate": "2026-04-10",
    "bookingTime": "10:00",
    "complaint": "Mesin berbunyi aneh saat dijalankan"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Booking berhasil dibuat. Admin akan mereviu dalam waktu singkat.",
  "data": {
    "_id": "booking123",
    "userId": "user123",
    "status": "Menunggu",
    "bookingDate": "2026-04-10",
    "totalPrice": 500000
  }
}
```

**Save booking ID:**
```bash
export BOOKING_ID="booking123"
```

**What happened:**
- ✅ User mendapat notif: "📅 Booking Dibuat"
- ✅ Admin mendapat notif: "🔔 Booking Baru Masuk!"
- ✅ Notif disimpan di database

**Check notifications in database:**
```bash
# Lihat notif user yang baru dibuat
# (Lewat MongoDB client atau API)
curl -X GET "http://localhost:5000/api/notifications?isRead=false" \
  -H "Authorization: Bearer $USER_TOKEN"
```

---

### ⭐ TEST 2: Admin Approves → User Gets Notification

**Admin approve booking:**
```bash
# Admin setujui booking
curl -X POST http://localhost:5000/api/bookings/$BOOKING_ID/approve \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "estimatedCompletionDate": "2026-04-11",
    "technician": "Budi Santoso",
    "notes": "Booking approved - all spare parts ready"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Booking berhasil disetujui dan user telah diberitahu",
  "data": {
    "_id": "booking123",
    "status": "Disetujui",
    "approvedAt": "2026-04-07T11:30:00Z",
    "estimatedCompletionDate": "2026-04-11",
    "assignedTechnician": "Budi Santoso"
  }
}
```

**What happened:**
- ✅ Booking status berubah menjadi "Disetujui"
- ✅ User mendapat notif: "✅ Booking Disetujui!"
- ✅ Notif disimpan dengan relasi ke booking

**Verify user notification:**
```bash
curl -X GET "http://localhost:5000/api/notifications?isRead=false" \
  -H "Authorization: Bearer $USER_TOKEN"

# Result: User punya notif "Booking Disetujui"
```

---

### ⭐ TEST 3: Admin Rejects → User Gets Notification

**First create another booking (untuk test reject):**
```bash
# Create second booking
curl -X POST http://localhost:5000/api/bookings \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "motorcycleId": "motorcycle456",
    "serviceIds": ["service3"],
    "bookingDate": "2026-04-12",
    "bookingTime": "14:00",
    "complaint": "Oli perlu diganti"
  }'

# Save new booking ID
export BOOKING_ID_2="booking456"
```

**Admin reject booking:**
```bash
# Admin tolak booking
curl -X POST http://localhost:5000/api/bookings/$BOOKING_ID_2/reject \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rejectionReason": "Jenis motor tersebut tidak bisa dilayani dengan teknisi yang tersedia saat ini"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Booking berhasil ditolak dan user telah diberitahu",
  "data": {
    "_id": "booking456",
    "status": "Ditolak",
    "rejectionReason": "Jenis motor tersebut tidak bisa dilayani..."
  }
}
```

**What happened:**
- ✅ Booking status berubah menjadi "Ditolak"
- ✅ User mendapat notif: "❌ Booking Ditolak" + alasan

---

### ⭐ TEST 4: Admin Starts Service → User Gets Notification

**Admin start service on approved booking:**
```bash
# Admin mulai mengerjakan
curl -X POST http://localhost:5000/api/bookings/$BOOKING_ID/start-service \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Service dimulai dan user telah diberitahu",
  "data": {
    "_id": "booking123",
    "status": "Diproses",
    "serviceStartedAt": "2026-04-07T12:00:00Z"
  }
}
```

**What happened:**
- ✅ Booking status berubah menjadi "Diproses"
- ✅ User mendapat notif: "🔧 Service Dimulai"
- ✅ Admin bisa track status di database

---

### ⭐ TEST 5: Admin Sends Custom Message → User Gets Notification

**Admin send progress update:**
```bash
# Admin kirim update progress
curl -X POST http://localhost:5000/api/bookings/$BOOKING_ID/send-message \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Update Progress Repair",
    "message": "Motor Anda sudah masuk tahap pembersihan mesin. Kami akan melanjutkan dengan pengecekan sistem kelistrikan dalam 30 menit ke depan.",
    "messageType": "update"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Pesan berhasil dikirim ke customer",
  "data": {
    "bookingId": "booking123",
    "title": "Update Progress Repair",
    "message": "Motor Anda sudah masuk tahap..."
  }
}
```

**What happened:**
- ✅ User mendapat notif: "🔄 Update Progress Repair"
- ✅ Notif disimpan di database

**Try other message types:**

```bash
# Admin ask for confirmation
curl -X POST http://localhost:5000/api/bookings/$BOOKING_ID/send-message \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Konfirmasi Spare Part",
    "message": "Kami menemukan kerusakan pada sistem pengapian. Spare part asli tersedia dengan harga tambahan Rp 300.000. Apakah Anda setuju?",
    "messageType": "question"
  }'
```

```bash
# Admin warning
curl -X POST http://localhost:5000/api/bookings/$BOOKING_ID/send-message \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Pemberitahuan Penting",
    "message": "Ditemukan kerusakan parah pada pompa bensin. Tidak bisa diperbaiki, harus diganti dengan biaya tambahan Rp 800.000.",
    "messageType": "warning"
  }'
```

---

### ⭐ TEST 6: Admin Completes Service → User Gets Notification

**Admin complete service:**
```bash
# Admin selesaikan service
curl -X POST http://localhost:5000/api/bookings/$BOOKING_ID/complete-service \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "completionNotes": "Service selesai. Motor sudah teruji dengan baik. Semua sistem berfungsi normal. Mesin sudah tidak ada suara aneh lagi.",
    "finalCost": 650000
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Service berhasil diselesaikan dan user telah diberitahu",
  "data": {
    "_id": "booking123",
    "status": "Selesai",
    "serviceCompletedAt": "2026-04-07T15:30:00Z",
    "finalCost": 650000
  }
}
```

**What happened:**
- ✅ Booking status berubah menjadi "Selesai"
- ✅ User mendapat notif: "✅ Service Selesai!" + biaya final
- ✅ User bisa ambil motor

---

## ✅ Verification Checklist

### Check User Notifications
```bash
# Get all unread notifications
curl -X GET "http://localhost:5000/api/notifications?isRead=false" \
  -H "Authorization: Bearer $USER_TOKEN"

# Expected: Multiple notifications from booking flow
```

### Check Admin Notifications
```bash
# Get all admin notifications
curl -X GET "http://localhost:5000/api/notifications" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Expected: "Booking Baru Masuk" notification
```

### Mark Notifications as Read
```bash
# User mark specific notification as read
curl -X PATCH "http://localhost:5000/api/notifications/notification_id/read" \
  -H "Authorization: Bearer $USER_TOKEN"

# Or mark all as read
curl -X PATCH "http://localhost:5000/api/notifications/read/all" \
  -H "Authorization: Bearer $USER_TOKEN"
```

### Delete Notifications
```bash
# Delete one notification
curl -X DELETE "http://localhost:5000/api/notifications/notification_id" \
  -H "Authorization: Bearer $USER_TOKEN"

# Or delete all
curl -X DELETE "http://localhost:5000/api/notifications/delete/all" \
  -H "Authorization: Bearer $USER_TOKEN"
```

---

## 📊 Expected Notification Sequence

```
Timeline Flow:

10:00 AM - User Books
├─ User Notif: "📅 Booking Dibuat"
└─ Admin Notif: "🔔 Booking Baru Masuk!"

11:30 AM - Admin Approves
└─ User Notif: "✅ Booking Disetujui!"

12:00 PM - Admin Starts Service  
└─ User Notif: "🔧 Service Dimulai"

01:00 PM - Admin sends update
└─ User Notif: "🔄 Update Progress Repair"

02:00 PM - Admin ask confirmation
└─ User Notif: "❓ Konfirmasi Spare Part"

03:30 PM - Admin Completes
└─ User Notif: "✅ Service Selesai!"
```

---

## 🐛 Troubleshooting

### Issue: No notifications appearing
**Check:**
1. Device is registered: `db.notificationdevices.find()`
2. Notifications in DB: `db.notifications.find({userId: "user123"})`
3. Server logs for errors
4. Firebase credentials

### Issue: User not getting notified on booking
**Check:**
1. bookingController.js has notification code
2. User device is registered
3. Try manually sending test notification via admin API

### Issue: Notifications showing but not as FCM push
**Check:**
1. Firebase credentials are correct
2. FCM tokens are valid
3. Check Firebase Console for delivery issues
4. Check Flutter app has proper notification handling

---

## 📱 Flutter App Integration Test

Once backend is working, test in Flutter app:

```dart
// In Flutter app
import 'package:firebase_messaging/firebase_messaging.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  
  // Get FCM token
  String? token = await FirebaseMessaging.instance.getToken();
  print("My FCM Token: $token");
  
  // Register device with backend
  registerDeviceWithBackend(token);
  
  runApp(const MyApp());
}

// When app receives push notification:
// ✅ Shows "Booking Dibuat" popup
// ✅ Shows "Booking Disetujui" popup
// ✅ Shows "Service Dimulai" popup
// etc...
```

---

## 📝 Notes

- Notifications are **automatically saved to database** regardless of FCM status
- Each notification includes `relatedId` and `relatedModel` to link to booking
- Admins can see all notifications in their dashboard
- Users see notifications in their notification center
- Notifications persist - can be retrieved anytime

---

**Created:** 2026-04-07
**Last Updated:** 2026-04-07
**Tested:** ✅ Complete workflow
