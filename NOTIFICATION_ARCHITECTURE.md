# Notification System Architecture

## Overview

Sistem notifikasi SpeedLab menggunakan:
- **Firebase Cloud Messaging (FCM)** untuk push notifications
- **MongoDB** untuk menyimpan riwayat notifikasi
- **Node.js/Express** sebagai backend orchestrator

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Flutter Mobile App                        │
│  • Listen to FCM messages                                   │
│  • Register/Unregister FCM tokens                           │
│  • Fetch notification history                               │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP API
┌──────────────────────▼──────────────────────────────────────┐
│                  Backend API (Node.js)                       │
│  ┌────────────────────────────────────────────────────────┐ │
│  │         Notification Controller                         │ │
│  │  • registerDevice()      - Save FCM token              │ │
│  │  • sendNotification()    - Send to user                │ │
│  │  • getNotifications()    - Fetch history               │ │
│  │  • markAsRead()          - Update status               │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │         Firebase Service (lib/firebase.js)             │ │
│  │  • sendNotification()    - Single FCM send             │ │
│  │  • sendMulticast()       - Multiple FCM send           │ │
│  │  • sendTopic()           - Topic-based send            │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │     Notification Helper (lib/notificationHelper.js)    │ │
│  │  • sendNotificationToUser()      - Single user         │ │
│  │  • sendNotificationToUserList()  - Multiple users      │ │
│  │  • notifyBookingConfirmation()   - Business logic      │ │
│  │  • notifyPaymentStatus()         - Business logic      │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────┬──────────────────────────────────────┘
                       │
         ┌─────────────┼─────────────┐
         │             │             │
    ┌────▼───┐     ┌──▼──┐      ┌──▼──────────┐
    │ MongoDB │     │FCM  │      │ Mail Service│
    │         │     │     │      │ (optional)  │
    └─────────┘     └─────┘      └─────────────┘
```

---

## File Structure

```
Backend/
├── controllers/
│   ├── notificationController.js      # API handlers
│   ├── bookingController.js           # Updated with notifications
│   ├── paymentController.js           # Updated with notifications
│   └── ...
├── models/
│   ├── NotificationModel.js           # Notification document schema
│   └── NotificationDeviceModel.js     # Device/FCM token tracking
├── routes/
│   └── notificationRoutes.js          # API endpoints
├── lib/
│   ├── firebase.js                    # Firebase Admin SDK wrapper
│   └── notificationHelper.js          # Helper functions for other controllers
├── middleware/
│   └── auth.js                        # Authentication (existing)
├── NOTIFICATION_API.md                # Complete API documentation
├── NOTIFICATION_TESTING.md            # Test commands & examples
├── FIREBASE_SETUP.md                  # Setup guide
└── server.js                          # Main server (updated)
```

---

## Data Models

### NotificationModel
Menyimpan riwayat semua notifikasi yang dikirim.

```javascript
{
  userId: ObjectId,          // Penerima notifikasi
  title: String,             // Judul notifikasi
  body: String,              // Isi notifikasi
  image: String,             // Gambar (optional)
  type: String,              // booking, payment, service, promo, warranty, system
  relatedId: ObjectId,       // ID dokumen terkait (booking ID, payment ID, dll)
  relatedModel: String,      // Tipe dokumen terkait (Booking, Payment, etc)
  isRead: Boolean,           // Status baca
  readAt: Date,              // Kapan dibaca
  sentAt: Date,              // Kapan dikirim
  createdAt: Date            // Kapan dibuat di database
}
```

**Indexes:**
- `{ userId: 1, createdAt: -1 }` - Query notifikasi user terbaru
- `{ userId: 1, isRead: 1 }` - Filter read/unread

### NotificationDeviceModel
Menyimpan FCM tokens dari setiap device yang terdaftar.

```javascript
{
  userId: ObjectId,          // Pemilik device
  fcmToken: String,          // Token FCM dari device
  deviceName: String,        // Nama device (misal: "Xiaomi Redmi 11")
  deviceId: String,          // Unique identifier device
  platform: String,          // android, ios, web
  isActive: Boolean,         // Status device
  lastUsedAt: Date,          // Terakhir digunakan
  createdAt: Date            // Kapan terdaftar
}
```

**Indexes:**
- `{ userId: 1 }` - Query semua devices user
- `{ fcmToken: 1 }` - Cari device by token (unique)

---

## API Endpoints Summary

### User Endpoints (Require Authentication)
```
POST   /api/notifications/register-device          Register FCM token
POST   /api/notifications/unregister-device        Remove FCM token
GET    /api/notifications                          Get all notifications
GET    /api/notifications/:id                      Get single notification
PATCH  /api/notifications/:id/read                 Mark as read
PATCH  /api/notifications/read/all                 Mark all as read
DELETE /api/notifications/:id                      Delete notification
DELETE /api/notifications/delete/all               Delete all notifications
```

### Admin Endpoints (Require Admin/Pemilik Role)
```
POST   /api/notifications/send/user                Send to single user
POST   /api/notifications/send/multiple            Send to multiple users
POST   /api/notifications/send/broadcast           Send to all/by role
```

---

## Usage Examples

### 1. Registering Device (from Flutter)

**Flutter Code:**
```dart
Future<void> registerDevice(String authToken) async {
  final fcmToken = await FirebaseMessaging.instance.getToken();
  
  final response = await http.post(
    Uri.parse('$API_URL/api/notifications/register-device'),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $authToken',
    },
    body: jsonEncode({
      'fcmToken': fcmToken,
      'deviceName': 'My Phone',
      'platform': 'android',
    }),
  );
  
  // Handle response
}
```

**Backend Response:**
```json
{
  "success": true,
  "message": "Device registered successfully",
  "data": {
    "_id": "...",
    "userId": "...",
    "fcmToken": "...",
    "isActive": true
  }
}
```

---

### 2. Sending Notification from Another Controller

**bookingController.js:**
```javascript
const { notifyBookingConfirmation } = require("../lib/notificationHelper");

const createBooking = async (req, res) => {
  try {
    // Create booking...
    const booking = new Booking(bookingData);
    await booking.save();

    // Send notification
    const notifResult = await notifyBookingConfirmation(
      req.user.id,
      { bookingId: booking._id }
    );

    console.log('Notification sent:', notifResult);

    res.status(201).json({
      success: true,
      data: booking
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

---

### 3. Broadcast Notification (Admin Panel)

**Admin Endpoint:**
```bash
curl -X POST http://localhost:5000/api/notifications/send/broadcast \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{
    "title": "Special Offer!",
    "body": "Get 30% discount on all services this weekend",
    "type": "promo",
    "role": "pelanggan"
  }'
```

**What Happens:**
1. Backend queries all users with role "pelanggan"
2. Creates Notification document for each user
3. Gets active FCM tokens for those users
4. Sends FCM message to all tokens
5. Returns success count and failure count

---

## Implementation Checklist

### Backend Setup
- [x] Create NotificationModel.js
- [x] Create NotificationDeviceModel.js
- [x] Create notificationController.js
- [x] Create notificationRoutes.js
- [x] Create lib/firebase.js
- [x] Create lib/notificationHelper.js
- [x] Update server.js with routes
- [x] Update package.json with firebase-admin
- [x] Create documentation files

### Firebase Setup
- [ ] Create Firebase project
- [ ] Download service account JSON
- [ ] Set FIREBASE_SERVICE_ACCOUNT_JSON in .env
- [ ] Enable Cloud Messaging

### Flutter Integration
- [ ] Add firebase_messaging to pubspec.yaml
- [ ] Download google-services.json
- [ ] Download GoogleService-Info.plist
- [ ] Create firebase_service.dart
- [ ] Initialize in main.dart
- [ ] Implement notification handlers
- [ ] Test FCM token registration

### Controller Integration
- [ ] Update bookingController.js with notifications
- [ ] Update paymentController.js with notifications
- [ ] Update serviceController.js with notifications
- [ ] Update warrantyController.js with notifications

### Testing
- [ ] Test register device endpoint
- [ ] Test send notification endpoint
- [ ] Test Firebase connectivity
- [ ] Test push notification on Flutter app
- [ ] Test notification history retrieval

---

## Key Features

### ✅ Real-time Push Notifications
- FCM handles delivery to devices
- Works even if app is in background
- Automatic retry with exponential backoff

### ✅ Notification History
- All notifications stored in MongoDB
- Searchable and filterable
- Track read/unread status
- Pagination support

### ✅ Multi-Device Support
- Each user can have multiple devices
- Send to all active devices simultaneously
- Device management (add/remove/update)

### ✅ Topic-Based Messaging
- Subscribe users to topics
- Send to entire topic (useful for broadcasts)
- Automatic topic subscription on register

### ✅ Notification Types
- booking - Booking confirmations/updates
- payment - Payment status changes
- service - Service completion alerts
- promo - Promotional offers
- warranty - Warranty information
- system - System notifications

### ✅ Admin Control
- Send to single user
- Send to multiple users
- Send broadcast to all users
- Filter by role (pelanggan, admin, pemilik)

---

## Error Handling

### Common Errors & Solutions

#### "Firebase initialization warning"
- **Cause:** Missing Firebase credentials
- **Fix:** Set FIREBASE_SERVICE_ACCOUNT_JSON in .env

#### "No devices found for user"
- **Cause:** User hasn't registered any devices
- **Fix:** Register device first before sending notification

#### "Invalid FCM token"
- **Cause:** Token expired or invalid
- **Fix:** System will automatically mark device as inactive on next send

#### "Notification saved but FCM failed"
- **Cause:** FCM delivery issue (temporary)
- **Fix:** Notification is saved, will retry when device comes online

---

## Performance Considerations

### Database Optimization
- Use pagination when fetching notifications (default: 20 per page)
- Indexes on userId and createdAt for fast queries
- Consider archiving old notifications (>90 days)

### FCM Optimization
- Batch send for up to 500 tokens in single request
- Use topic subscriptions for broadcasts
- Implement exponential backoff for retries

### Network
- Send FCM requests asynchronously (don't wait for response)
- Implement timeout handling (default: 10 seconds)
- Cache FCM tokens locally in app

---

## Security Considerations

✅ **Implemented:**
- Authentication required for all endpoints
- Authorization checks (admin-only endpoints)
- FCM tokens stored securely in database
- Service account credentials in environment variables

⚠️ **Recommended:**
- Implement rate limiting on notification endpoints
- Audit log for admin notification sends
- Encrypt notifications in transit (use HTTPS)
- Regular token rotation
- Monitor for suspicious notification patterns

---

## Monitoring & Analytics

### Metrics to Track
- Total notifications sent per day
- FCM success rate
- Average delivery time
- User engagement (notification opens)
- Device registration rate

### Logging
- All successful sends logged with messageId
- Failed sends with error reason
- Admin actions logged for audit trail

### Firebase Console
Monitor in [Firebase Console](https://console.firebase.google.com/):
- Message delivery rates
- FCM performance
- Topic statistics
- Custom metrics

---

## Future Enhancements

🔄 **Potential Features:**
- Email fallback if push fails
- SMS notifications for critical alerts
- Notification scheduling
- Notification templates with variables
- User notification preferences
- Notification analytics dashboard
- A/B testing for notifications
- Delayed/batch sending
- Rich media notifications (images, videos)
- Interactive notifications (buttons, quick actions)

---

## Support & Documentation

- **API Documentation:** [NOTIFICATION_API.md](./NOTIFICATION_API.md)
- **Testing Guide:** [NOTIFICATION_TESTING.md](./NOTIFICATION_TESTING.md)
- **Firebase Setup:** [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)
- **Helper Functions:** `lib/notificationHelper.js`

---

## Quick Start Checklist

```bash
# 1. Install dependencies
npm install firebase-admin

# 2. Setup Firebase credentials in .env
echo "FIREBASE_SERVICE_ACCOUNT_JSON={...}" >> .env

# 3. Start server
npm run dev

# 4. Test endpoint
curl -X POST http://localhost:5000/api/notifications/register-device \
  -H "Authorization: Bearer TOKEN" \
  -d '{"fcmToken":"test"}'

# 5. Check logs for success
# Look for: "Device registered successfully"
```

---

Created: 2026-04-07
Last Updated: 2026-04-07
Version: 1.0.0
