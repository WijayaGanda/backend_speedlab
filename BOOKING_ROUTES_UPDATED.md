# Updated Booking Routes dengan Notification

File ini menunjukkan bagaimana `routes/bookingRoutes.js` harus diupdate untuk mendukung notification endpoints.

---

## bookingRoutes.js (Updated)

```javascript
const express = require("express");
const router = express.Router();
const {
  createBooking,
  approveBooking,
  rejectBooking,
  startService,
  completeService,
  sendCustomMessage,
  getAllBookings,
  getBookingById,
  updateBooking,
  deleteBooking,
  // ... other existing functions
} = require("../controllers/bookingController");

const { authenticate, authorize } = require("../middleware/auth");

// ============================================================================
// USER ROUTES - Semua user (pelanggan) bisa mengakses
// ============================================================================

// Create booking (user membuat booking baru)
// POST /api/bookings
// Body: { motorcycleId, serviceIds, bookingDate, bookingTime, complaint, notes }
// Response: Booking dibuat + notif ke user + notif ke semua admin
router.post("/", authenticate, createBooking);

// Get all bookings (user hanya bisa lihat booking sendiri)
// GET /api/bookings
router.get("/", authenticate, getAllBookings);

// Get single booking
// GET /api/bookings/:id
router.get("/:id", authenticate, getBookingById);

// Update booking (user bisa update booking sebelum disetujui)
// PUT /api/bookings/:id
router.put("/:id", authenticate, updateBooking);

// Delete booking (user bisa cancel booking sebelum disetujui)
// DELETE /api/bookings/:id
router.delete("/:id", authenticate, deleteBooking);

// ============================================================================
// ADMIN ROUTES - Hanya admin & pemilik yang bisa mengakses
// ============================================================================

// Approve booking (admin menyetujui booking)
// POST /api/bookings/:bookingId/approve
// Body: { estimatedCompletionDate, technician, notes }
// Response: Booking status diubah ke "Disetujui" + notif ke user
router.post(
  "/:bookingId/approve",
  authenticate,
  authorize('admin', 'pemilik'),
  approveBooking
);

// Reject booking (admin menolak booking)
// POST /api/bookings/:bookingId/reject
// Body: { rejectionReason }
// Response: Booking status diubah ke "Ditolak" + notif ke user
router.post(
  "/:bookingId/reject",
  authenticate,
  authorize('admin', 'pemilik'),
  rejectBooking
);

// Start service (admin mulai mengerjakan)
// POST /api/bookings/:bookingId/start-service
// Response: Booking status diubah ke "Diproses" + notif ke user
router.post(
  "/:bookingId/start-service",
  authenticate,
  authorize('admin', 'pemilik'),
  startService
);

// Complete service (admin selesai mengerjakan)
// POST /api/bookings/:bookingId/complete-service
// Body: { completionNotes, finalCost }
// Response: Booking status diubah ke "Selesai" + notif ke user
router.post(
  "/:bookingId/complete-service",
  authenticate,
  authorize('admin', 'pemilik'),
  completeService
);

// Send custom message to user (admin kirim update progress atau pesan lainnya)
// POST /api/bookings/:bookingId/send-message
// Body: { title, message, messageType: 'update'|'warning'|'question'|'complete' }
// Response: Notif dikirim ke user
router.post(
  "/:bookingId/send-message",
  authenticate,
  authorize('admin', 'pemilik'),
  sendCustomMessage
);

module.exports = router;
```

---

## Implementasi di server.js

```javascript
// Di server.js, pastikan booking routes sudah mount dengan benar:

const bookingRoutes = require("../routes/bookingRoutes");

// ... bagian middleware ...

// API Routes
app.use("/api/bookings", bookingRoutes);  // ✅ Sudah ada
app.use("/api/notifications", notificationRoutes);  // ✅ Sudah ada
```

---

## Workflow & Endpoints

### 1️⃣ User Membuat Booking
```
POST /api/bookings
├── User data tersimpan
├── ✅ Notif ke user: "Booking Dibuat"
└── ✅ Notif ke SEMUA admin: "Booking Baru Masuk"
```

**cURL Command:**
```bash
curl -X POST http://localhost:5000/api/bookings \
  -H "Authorization: Bearer USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "motorcycleId": "motorcycle123",
    "serviceIds": ["service1", "service2"],
    "bookingDate": "2026-04-10",
    "bookingTime": "10:00",
    "complaint": "Mesin berbunyi aneh"
  }'
```

---

### 2️⃣ Admin Menyetujui Booking
```
POST /api/bookings/{bookingId}/approve
├── Status diubah ke "Disetujui"
├── ✅ Notif ke user: "Booking Disetujui" + tanggal estimasi + teknisi
└── Admin notif dihapus
```

**cURL Command:**
```bash
curl -X POST http://localhost:5000/api/bookings/booking123/approve \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "estimatedCompletionDate": "2026-04-11",
    "technician": "Budi Santoso",
    "notes": "Booking approved - spare parts ready"
  }'
```

---

### 3️⃣ Admin Menolak Booking
```
POST /api/bookings/{bookingId}/reject
├── Status diubah ke "Ditolak"
├── ✅ Notif ke user: "Booking Ditolak" + alasan
└── Admin notif dihapus
```

**cURL Command:**
```bash
curl -X POST http://localhost:5000/api/bookings/booking123/reject \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rejectionReason": "Motor model tersebut tidak bisa dilayani saat ini"
  }'
```

---

### 4️⃣ Admin Mulai Mengerjakan (Start Service)
```
POST /api/bookings/{bookingId}/start-service
├── Status diubah ke "Diproses"
└── ✅ Notif ke user: "Service Dimulai"
```

**cURL Command:**
```bash
curl -X POST http://localhost:5000/api/bookings/booking123/start-service \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

---

### 5️⃣ Admin Kirim Update Progress (Custom Message)
```
POST /api/bookings/{bookingId}/send-message
└── ✅ Notif ke user: Custom message dari admin
```

**cURL Commands - Berbagai skenario:**

**Update Progress:**
```bash
curl -X POST http://localhost:5000/api/bookings/booking123/send-message \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Update Progress",
    "message": "Motor Anda sedang dalam proses pembersihan mesin. Akan dilanjutkan dengan pengecekan sistem kelistrikan.",
    "messageType": "update"
  }'
```

**Tanya Hasil Inspeksi:**
```bash
curl -X POST http://localhost:5000/api/bookings/booking123/send-message \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Konfirmasi Diperlukan",
    "message": "Kami menemukan masalah pada transmisi. Apakah Anda setuju untuk mengganti spare part dengan harga tambahan Rp 500.000?",
    "messageType": "question"
  }'
```

**Peringatan:**
```bash
curl -X POST http://localhost:5000/api/bookings/booking123/send-message \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Pemberitahuan Penting",
    "message": "Bagian tersebut rusak parah dan tidak bisa diperbaiki. Perlu penggantian dengan biaya tambahan.",
    "messageType": "warning"
  }'
```

---

### 6️⃣ Admin Selesaikan Service (Complete)
```
POST /api/bookings/{bookingId}/complete-service
├── Status diubah ke "Selesai"
└── ✅ Notif ke user: "Service Selesai" + biaya final
```

**cURL Command:**
```bash
curl -X POST http://localhost:5000/api/bookings/booking123/complete-service \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "completionNotes": "Service selesai. Motor sudah teruji dan siap digunakan. Semua komponen berfungsi normal.",
    "finalCost": 750000
  }'
```

---

## Notification Status Summary

### Admin melihat Booking Notification:

**Saat USER booking:**
```
📱 Admin gets: "🔔 Booking Baru Masuk!"
   - "Joko Santoso membuat booking untuk Honda CB150R. 
     Tanggal: 10 April 2026 10:00. Total: Rp 500.000"
```

**Saat booking DISETUJUI:**
```
✅ Notif dihilangkan dari admin (mereka sudah handle)
📱 User gets: "✅ Booking Disetujui!"
   - "Booking Honda CB150R Anda telah disetujui. 
     Estimasi selesai: 11 April 2026. Teknisi: Budi Santoso"
```

**Saat SERVICE DIMULAI:**
```
📱 User gets: "🔧 Service Dimulai"
   - "Layanan untuk motor Anda telah dimulai. 
     Kami akan memberikan update progress secara berkala."
```

**Saat CUSTOM MESSAGE:**
```
📱 User gets: "🔄 Update Progress"
   - "Motor Anda sedang dalam proses pembersihan mesin. 
     Akan dilanjutkan dengan pengecekan sistem kelistrikan."
```

**Saat SERVICE SELESAI:**
```
📱 User gets: "✅ Service Selesai!"
   - "Layanan untuk motor Anda telah selesai! 
     Biaya akhir: Rp 750.000. Silakan ambil motor Anda 
     di workshop kami. Terima kasih!"
```

---

## Database Flow

**Booking Collection berubah status:**
```javascript
// Initial (setelah user booking)
{
  _id: "booking123",
  userId: "user456",
  status: "Menunggu",  // ← User harap approval
  motorcycleId: "motorcycle789",
  bookingDate: "2026-04-10",
  bookingTime: "10:00",
  totalPrice: 500000,
  createdAt: "2026-04-07T10:00:00Z"
}

// Setelah admin approve
{
  status: "Disetujui",  // ← Dimulai dari sini
  approvedBy: "admin123",
  approvedAt: "2026-04-07T10:30:00Z",
  estimatedCompletionDate: "2026-04-11",
  assignedTechnician: "Budi Santoso"
}

// Setelah admin start service
{
  status: "Diproses"  // ← Sedang dikerjakan
  serviceStartedAt: "2026-04-07T11:00:00Z"
}

// Setelah admin complete service
{
  status: "Selesai"  // ← DONE
  serviceCompletedAt: "2026-04-07T15:30:00Z",
  finalCost: 750000,
  completionNotes: "Service selesai. Motor sudah teruji..."
}
```

---

## Notification Collection Sample

```javascript
// #1 User booking
{
  userId: "user456",
  type: "booking",
  title: "📅 Booking Dibuat",
  body: "Booking Anda untuk Honda CB150R pada 10 April 2026 jam 10:00 telah dibuat...",
  relatedId: "booking123",
  isRead: false
}

// #2 Admin approval notification (disimpan di database admin juga)
{
  // Untuk ADMIN
  userId: "admin123",
  type: "booking",
  title: "🔔 Booking Baru Masuk!",
  body: "Joko Santoso membuat booking untuk Honda CB150R. Tanggal: 10 April...",
  relatedId: "booking123",
  isRead: false
}

// #3 User approval notification
{
  userId: "user456",
  type: "booking",
  title: "✅ Booking Disetujui!",
  body: "Booking Honda CB150R Anda telah disetujui. Estimasi selesai: 11 April 2026...",
  relatedId: "booking123",
  isRead: false
}

// ... lebih banyak untuk update, complete, dll
```

---

## Checklist Implementasi

- [ ] Update `bookingController.js` dengan notification logic
- [ ] Update `bookingRoutes.js` dengan new endpoints
- [ ] Test user booking endpoint (user & admin notif)
- [ ] Test admin approve endpoint (user notif)
- [ ] Test admin reject endpoint (user notif)
- [ ] Test admin start service endpoint (user notif)
- [ ] Test admin complete service endpoint (user notif)
- [ ] Test custom message endpoint
- [ ] Verify notifications in database
- [ ] Test FCM push notifications on Flutter app

---

**Created:** 2026-04-07
**Last Updated:** 2026-04-07
**Status:** Ready for Implementation
