# Contoh Implementasi: Booking Notification (User ↔ Admin)

Panduan lengkap untuk implementasi notification dua arah antara user dan admin dalam sistem booking.

---

## Scenario 1: User Membuat Booking → Admin Notifikasi

### Step 1: Updated bookingController.js (createBooking)

Tambahkan import di bagian atas:
```javascript
const { sendNotificationToUser, sendNotificationToUserList } = require("../lib/notificationHelper");
const User = require("../model/UserModel");
```

Kemudian update function createBooking:

```javascript
const createBooking = async (req, res) => {
  try {
    const { motorcycleId, serviceIds, bookingDate, bookingTime, complaint, notes } = req.body;

    // Validasi motor milik user
    const motorcycle = await Motorcycle.findOne({ 
      _id: motorcycleId, 
      userId: req.user._id 
    });

    if (!motorcycle) {
      return res.status(404).json({ 
        success: false,
        message: "Motor tidak ditemukan atau bukan milik Anda" 
      });
    }

    // Validasi motor tidak sedang dalam status booking yang aktif
    const activeBooking = await Booking.findOne({
      motorcycleId,
      status: { $nin: ['Selesai', 'Dibatalkan', 'Diambil'] }
    });

    if (activeBooking) {
      return res.status(400).json({
        success: false,
        message: "Motor ini sedang dalam proses booking..."
      });
    }

    // Hitung total harga
    let totalPrice = 0;
    if (serviceIds && serviceIds.length > 0) {
      const services = await Service.find({ _id: { $in: serviceIds } });
      totalPrice = services.reduce((sum, service) => sum + service.price, 0);
    }

    // Buat booking
    const booking = new Booking({
      userId: req.user._id,
      motorcycleId,
      serviceIds,
      bookingDate,
      bookingTime,
      complaint,
      totalPrice,
      notes
    });

    await booking.save();

    const populatedBooking = await Booking.findById(booking._id)
      .populate('userId', 'name email phone')
      .populate('motorcycleId')
      .populate('serviceIds');

    // ============================================
    // 🔔 NOTIFICATION UNTUK USER (BOOKING CREATED)
    // ============================================
    try {
      await sendNotificationToUser(req.user._id, {
        title: 'Booking Dibuat',
        body: `Booking Anda untuk ${motorcycle.brand} ${motorcycle.model} pada ${new Date(bookingDate).toLocaleDateString('id-ID')} jam ${bookingTime} telah dibuat.`,
        image: 'https://your-app.com/booking-created-icon.png'
      }, {
        type: 'booking',
        relatedId: booking._id,
        relatedModel: 'Booking'
      });
    } catch (notifError) {
      console.warn('Gagal mengirim notif ke user:', notifError.message);
      // Jangan hentikan proses meski notif gagal
    }

    // ============================================
    // 🔔 NOTIFICATION UNTUK ADMIN (NEW BOOKING)
    // ============================================
    try {
      // Cari semua admin dan pemilik
      const admins = await User.find({ 
        role: { $in: ['admin', 'pemilik'] },
        isActive: true 
      }).select('_id');

      if (admins.length > 0) {
        const adminIds = admins.map(admin => admin._id);
        
        const bookingNotifTitle = 'Booking Baru 📌';
        const bookingNotifBody = `${req.user.name} membuat booking untuk ${motorcycle.brand} ${motorcycle.model} pada ${new Date(bookingDate).toLocaleDateString('id-ID')} jam ${bookingTime}. Total: Rp ${totalPrice.toLocaleString('id-ID')}`;

        // Send ke semua admin
        for (const adminId of adminIds) {
          try {
            await sendNotificationToUser(adminId, {
              title: bookingNotifTitle,
              body: bookingNotifBody,
              image: 'https://your-app.com/new-booking-icon.png'
            }, {
              type: 'booking',
              relatedId: booking._id,
              relatedModel: 'Booking'
            });
          } catch (error) {
            console.warn(`Gagal notif ke admin ${adminId}:`, error.message);
          }
        }
      }
    } catch (adminNotifError) {
      console.warn('Gagal mengirim notif ke admin:', adminNotifError.message);
    }

    res.status(201).json({
      success: true,
      message: "Booking berhasil dibuat",
      data: populatedBooking
    });

  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error membuat booking", 
      error: error.message 
    });
  }
};
```

---

## Scenario 2: Admin Approve/Reject Booking → User Notifikasi

Tambahkan functions baru di `bookingController.js`:

```javascript
// =============================================
// Approve Booking (Admin Action)
// =============================================
const approveBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { estimatedCompletionDate, technician } = req.body;

    // Check authorization - hanya admin & pemilik
    if (!['admin', 'pemilik'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Anda tidak memiliki akses untuk approve booking"
      });
    }

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "bookingId is required"
      });
    }

    // Update booking
    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      {
        status: 'Disetujui',
        approvedBy: req.user._id,
        approvedAt: new Date(),
        estimatedCompletionDate,
        assignedTechnician: technician
      },
      { new: true }
    ).populate('userId', 'name email phone')
     .populate('motorcycleId');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking tidak ditemukan"
      });
    }

    // ============================================
    // 🔔 NOTIFICATION UNTUK USER (BOOKING APPROVED)
    // ============================================
    try {
      const completionDate = new Date(estimatedCompletionDate).toLocaleDateString('id-ID');
      
      await sendNotificationToUser(booking.userId._id, {
        title: '✅ Booking Disetujui',
        body: `Booking Anda telah disetujui! Estimasi selesai: ${completionDate}. Teknisi yang menangani: ${technician || 'Akan ditentukan'}`,
        image: 'https://your-app.com/approved-icon.png'
      }, {
        type: 'booking',
        relatedId: booking._id,
        relatedModel: 'Booking'
      });
    } catch (notifError) {
      console.warn('Gagal mengirim notif approve:', notifError.message);
    }

    res.json({
      success: true,
      message: "Booking berhasil disetujui",
      data: booking
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error approve booking",
      error: error.message
    });
  }
};

// =============================================
// Reject Booking (Admin Action)
// =============================================
const rejectBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { rejectionReason } = req.body;

    if (!['admin', 'pemilik'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Anda tidak memiliki akses untuk reject booking"
      });
    }

    if (!bookingId || !rejectionReason) {
      return res.status(400).json({
        success: false,
        message: "bookingId dan rejectionReason harus diisi"
      });
    }

    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      {
        status: 'Ditolak',
        rejectedBy: req.user._id,
        rejectedAt: new Date(),
        rejectionReason
      },
      { new: true }
    ).populate('userId', 'name email phone');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking tidak ditemukan"
      });
    }

    // ============================================
    // 🔔 NOTIFICATION UNTUK USER (BOOKING REJECTED)
    // ============================================
    try {
      await sendNotificationToUser(booking.userId._id, {
        title: '❌ Booking Ditolak',
        body: `Booking Anda sayangnya ditolak. Alasan: ${rejectionReason}. Hubungi kami untuk informasi lebih lanjut.`,
        image: 'https://your-app.com/rejected-icon.png'
      }, {
        type: 'booking',
        relatedId: booking._id,
        relatedModel: 'Booking'
      });
    } catch (notifError) {
      console.warn('Gagal mengirim notif reject:', notifError.message);
    }

    res.json({
      success: true,
      message: "Booking berhasil ditolak",
      data: booking
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error reject booking",
      error: error.message
    });
  }
};

// =============================================
// Start Service (Admin Action)
// =============================================
const startService = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      {
        status: 'Diproses',
        serviceStartedAt: new Date()
      },
      { new: true }
    ).populate('userId', 'name email phone')
     .populate('motorcycleId');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking tidak ditemukan"
      });
    }

    // ============================================
    // 🔔 NOTIFICATION UNTUK USER (SERVICE STARTED)
    // ============================================
    try {
      await sendNotificationToUser(booking.userId._id, {
        title: '🔧 Service Dimulai',
        body: `Layanan untuk ${booking.motorcycleId.brand} ${booking.motorcycleId.model} Anda telah dimulai. Kami akan memberikan update lebih lanjut.`,
        image: 'https://your-app.com/service-started-icon.png'
      }, {
        type: 'booking',
        relatedId: booking._id,
        relatedModel: 'Booking'
      });
    } catch (notifError) {
      console.warn('Gagal mengirim notif service start:', notifError.message);
    }

    res.json({
      success: true,
      message: "Service dimulai",
      data: booking
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// =============================================
// Complete Service (Admin Action)
// =============================================
const completeService = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { completionNotes, finalCost } = req.body;

    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      {
        status: 'Selesai',
        serviceCompletedAt: new Date(),
        completionNotes,
        finalCost: finalCost || booking.totalPrice
      },
      { new: true }
    ).populate('userId', 'name email phone')
     .populate('motorcycleId');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking tidak ditemukan"
      });
    }

    // ============================================
    // 🔔 NOTIFICATION UNTUK USER (SERVICE COMPLETED)
    // ============================================
    try {
      const cost = finalCost || booking.totalPrice;
      
      await sendNotificationToUser(booking.userId._id, {
        title: '✅ Service Selesai',
        body: `Layanan untuk motor Anda telah selesai! Biaya akhir: Rp ${cost.toLocaleString('id-ID')}. Silakan mengambil motor Anda di workshop.`,
        image: 'https://your-app.com/completed-icon.png'
      }, {
        type: 'booking',
        relatedId: booking._id,
        relatedModel: 'Booking'
      });
    } catch (notifError) {
      console.warn('Gagal mengirim notif completion:', notifError.message);
    }

    res.json({
      success: true,
      message: "Service berhasil diselesaikan",
      data: booking
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
  createBooking,
  approveBooking,
  rejectBooking,
  startService,
  completeService,
  // ... other exports
};
```

---

## Scenario 3: Admin Kirim Custom Message ke User

Buat endpoint baru di `notificationRoutes.js`:

```javascript
// Di routes/notificationRoutes.js, tambahkan admin route:
router.post("/send/user", authenticate, authorize('admin', 'pemilik'), sendNotificationToUser);

// Atau buat custom endpoint di booking routes
router.post("/:bookingId/send-message", authenticate, authorize('admin', 'pemilik'), sendMessageToBookingUser);
```

Implementasi di `bookingController.js`:

```javascript
const sendMessageToBookingUser = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { title, message, type = 'booking' } = req.body;

    // Hanya admin & pemilik
    if (!['admin', 'pemilik'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized"
      });
    }

    if (!bookingId || !title || !message) {
      return res.status(400).json({
        success: false,
        message: "bookingId, title, dan message diperlukan"
      });
    }

    // Find booking
    const booking = await Booking.findById(bookingId).populate('userId', 'name _id');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking tidak ditemukan"
      });
    }

    // ============================================
    // 🔔 SEND CUSTOM MESSAGE TO USER
    // ============================================
    await sendNotificationToUser(booking.userId._id, {
      title: title,
      body: message,
      image: 'https://your-app.com/message-icon.png'
    }, {
      type: type,
      relatedId: booking._id,
      relatedModel: 'Booking'
    });

    res.json({
      success: true,
      message: "Pesan berhasil dikirim ke customer",
      data: {
        bookingId,
        userId: booking.userId._id,
        title,
        message
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error sending message",
      error: error.message
    });
  }
};
```

---

## Test Scenarios

### 1. Test: User Booking → Admin Notif

```bash
# 1. Login sebagai user
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Copy token user
export USER_TOKEN="eyJ..."

# 2. Register device user
curl -X POST http://localhost:5000/api/notifications/register-device \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"fcmToken":"user_token_123","platform":"android"}'

# 3. Login sebagai admin
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"adminpass123"}'

# Copy token admin
export ADMIN_TOKEN="eyJ..."

# 4. Register device admin
curl -X POST http://localhost:5000/api/notifications/register-device \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"fcmToken":"admin_token_123","platform":"android"}'

# 5. User membuat booking
curl -X POST http://localhost:5000/api/bookings \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "motorcycleId":"motorcycle_id",
    "serviceIds":["service_id1"],
    "bookingDate":"2026-04-10",
    "bookingTime":"10:00",
    "complaint":"Mesin berbunyi aneh"
  }'

# Result: Admin akan dapat notifikasi!
```

### 2. Test: Admin Approve → User Notif

```bash
# Admin approve booking
curl -X POST http://localhost:5000/api/bookings/{BOOKING_ID}/approve \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "estimatedCompletionDate":"2026-04-11",
    "technician":"Budi Santoso"
  }'

# Result: User akan dapat notifikasi bahwa booking disetujui!
```

### 3. Test: Admin Send Custom Message → User Notif

```bash
curl -X POST http://localhost:5000/api/bookings/{BOOKING_ID}/send-message \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title":"Update Progress",
    "message":"Motor Anda sedang dalam proses. Sudah mencapai tahap pembersihan mesin."
  }'

# Result: User dapat notifikasi dari admin!
```

---

## Notification Flow Diagram

```
USER SIDE                          DB                         ADMIN SIDE
┌─────────────┐
│ User Booking│
└──────┬──────┘
       │ POST /api/bookings
       ├──────────────────────────────────────────────────────┐
       │                                                        │
       ├─────────────────────────►┌──────────────┐◄────────────┤ createBooking()
       │                          │  Booking DB  │              │
       │                          └──────────────┘              │
       │                                                        │
       │ ◄──────────────────────────────────────────────────────┤
       │      Notif: "Booking dibuat"                          │
       │                                                        │
       │                                            Notif: "Booking Baru" ┐
       │                                                        │        │
       │                                                        │        ▼
       │                                                    ┌───────────┐
       │                                                    │  FCM Push │
       │                                                    └───────────┘

ADMIN APPROVES
       ┌──────────────────────────────────────────────────────┐
       │ Admin Click "Approve"                                │
       │ POST /api/bookings/{id}/approve                      │
       └──────────────┬─────────────────────────────────────┬─┘
                      │                                      │
                      ├─────────────────────────────────────┼───► approveBooking()
                      │                                      │
                      ├──────────► Update Booking Status ◄──┘
                      │
                      ├─────────────────────────────────────────► sendNotificationToUser()
                      │                                              │
                      │                                              ▼
                      │ ◄──── Notif: "Booking Disetujui" ────      FCM Push
```

---

## Database Entries Sample

**notifications collection:**
```json
// Ketika user booking
{
  "_id": ObjectId,
  "userId": "user123",
  "title": "Booking Dibuat",
  "body": "Booking Anda untuk Honda CB150R pada 10 April 2026 jam 10:00 telah dibuat.",
  "type": "booking",
  "relatedId": "booking123",
  "relatedModel": "Booking",
  "isRead": false,
  "createdAt": ISODate("2026-04-07T10:00:00Z")
}

// Ketika admin approve
{
  "_id": ObjectId,
  "userId": "user123",
  "title": "✅ Booking Disetujui",
  "body": "Booking Anda telah disetujui! Estimasi selesai: 11 April 2026. Teknisi: Budi Santoso",
  "type": "booking",
  "relatedId": "booking123",
  "relatedModel": "Booking",
  "isRead": false,
  "createdAt": ISODate("2026-04-07T10:30:00Z")
}

// Ketika admin kirim custom message
{
  "_id": ObjectId,
  "userId": "user123",
  "title": "Update Progress",
  "body": "Motor Anda sedang dalam proses. Sudah mencapai tahap pembersihan mesin.",
  "type": "booking",
  "relatedId": "booking123",
  "relatedModel": "Booking",
  "isRead": false,
  "createdAt": ISODate("2026-04-07T11:00:00Z")
}
```

---

## Summary

✅ **Implementasi lengkap untuk:**
1. User booking → Admin dapat notifikasi
2. Admin approve → User dapat notifikasi
3. Admin reject → User dapat notifikasi
4. Admin start service → User dapat notifikasi
5. Admin complete service → User dapat notifikasi
6. Admin send custom message → User dapat notifikasi

Setiap notifikasi disimpan di database dan juga dikirim via FCM push notification ke device yang terdaftar.

---

**Created:** 2026-04-07
**Version:** 1.0.0
