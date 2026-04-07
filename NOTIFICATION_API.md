# Notification API Documentation

## Overview
Notification API menggunakan **Firebase Cloud Messaging (FCM)** untuk mengirimkan push notification ke aplikasi Flutter. Sistem ini memungkinkan:
- ✅ Real-time push notifications
- ✅ Multiple device support per user
- ✅ Tracking read/unread status
- ✅ Topic-based subscriptions
- ✅ Broadcast notifications
- ✅ Admin control panel

---

## Setup Firebase Cloud Messaging

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Cloud Messaging

### 2. Generate Service Account Key
1. Go to **Project Settings** → **Service Accounts**
2. Click **Generate New Private Key**
3. Save the JSON file (keep it secret!)

### 3. Setup Environment Variables
Add to `.env` file:

```env
# Option 1: Paste the entire JSON (replace newlines with \n)
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"..."}

# Option 2: Use service account file (development only)
# Create firebase-service-account.json in project root
```

### 4. Install Dependencies
```bash
npm install
npm install firebase-admin
```

---

## API Endpoints

### 1. Register FCM Device Token
Save device token from Flutter app to backend.

**Endpoint:** `POST /api/notifications/register-device`

**Authentication:** Required (Bearer Token)

**Request Body:**
```json
{
  "fcmToken": "eVj...xxxxxxxxxxxxx",
  "deviceName": "Xiaomi Redmi Note 11",
  "deviceId": "device_123",
  "platform": "android"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Device registered successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "userId": "507f191e810c19729de860ea",
    "fcmToken": "eVj...xxxxxxxxxxxxx",
    "deviceName": "Xiaomi Redmi Note 11",
    "deviceId": "device_123",
    "platform": "android",
    "isActive": true,
    "createdAt": "2026-04-07T10:00:00.000Z"
  }
}
```

**Example cURL:**
```bash
curl -X POST http://localhost:5000/api/notifications/register-device \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "fcmToken": "eVj...xxxxxxxxxxxxx",
    "deviceName": "My Phone",
    "platform": "android"
  }'
```

---

### 2. Unregister Device Token
Remove device token (e.g., saat logout).

**Endpoint:** `POST /api/notifications/unregister-device`

**Authentication:** Required

**Request Body:**
```json
{
  "fcmToken": "eVj...xxxxxxxxxxxxx"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Device unregistered successfully"
}
```

---

### 3. Get All Notifications
Retrieve notifications for logged-in user.

**Endpoint:** `GET /api/notifications`

**Authentication:** Required

**Query Parameters:**
- `page` (default: 1) - Pagination page
- `limit` (default: 20) - Items per page
- `isRead` (optional) - Filter by read status: "true" or "false"

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "userId": "507f191e810c19729de860ea",
      "title": "Booking Confirmed",
      "body": "Your booking #123 has been confirmed",
      "image": "https://...",
      "type": "booking",
      "isRead": false,
      "createdAt": "2026-04-07T10:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 45,
    "page": 1,
    "limit": 20,
    "pages": 3
  },
  "unreadCount": 12
}
```

**Example:**
```bash
curl -X GET "http://localhost:5000/api/notifications?page=1&limit=10&isRead=false" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 4. Get Single Notification
Get details of a specific notification.

**Endpoint:** `GET /api/notifications/:id`

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "userId": "507f191e810c19729de860ea",
    "title": "Booking Confirmed",
    "body": "Your booking #123 has been confirmed",
    "type": "booking",
    "relatedId": "507f191e810c19729de860eb",
    "relatedModel": "Booking",
    "isRead": false,
    "createdAt": "2026-04-07T10:00:00.000Z"
  }
}
```

---

### 5. Mark Notification as Read
Mark a single notification as read.

**Endpoint:** `PATCH /api/notifications/:id/read`

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "message": "Notification marked as read",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "isRead": true,
    "readAt": "2026-04-07T10:05:00.000Z"
  }
}
```

---

### 6. Mark All Notifications as Read
Mark all unread notifications as read.

**Endpoint:** `PATCH /api/notifications/read/all`

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "message": "All notifications marked as read"
}
```

---

### 7. Delete Notification
Delete a single notification.

**Endpoint:** `DELETE /api/notifications/:id`

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "message": "Notification deleted successfully"
}
```

---

### 8. Delete All Notifications
Delete all notifications for the user.

**Endpoint:** `DELETE /api/notifications/delete/all`

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "message": "All notifications deleted successfully"
}
```

---

## Admin Endpoints (Admin/Pemilik Only)

### 9. Send Notification to Single User
Send notification to a specific user.

**Endpoint:** `POST /api/notifications/send/user`

**Authentication:** Required (Admin/Pemilik)

**Request Body:**
```json
{
  "userId": "507f191e810c19729de860ea",
  "title": "Payment Reminder",
  "body": "Please complete your payment for booking #123",
  "image": "https://...",
  "type": "payment",
  "relatedId": "507f191e810c19729de860eb",
  "relatedModel": "Booking"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Notification sent successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "userId": "507f191e810c19729de860ea",
    "title": "Payment Reminder",
    "isRead": false
  }
}
```

**Notification Types:**
- `booking` - Booking-related notifications
- `payment` - Payment-related notifications  
- `service` - Service-related notifications
- `promo` - Promotional notifications
- `warranty` - Warranty-related notifications
- `system` - System notifications (default)

---

### 10. Send Notification to Multiple Users
Send notification to multiple users at once.

**Endpoint:** `POST /api/notifications/send/multiple`

**Authentication:** Required (Admin/Pemilik)

**Request Body:**
```json
{
  "userIds": [
    "507f191e810c19729de860ea",
    "507f191e810c19729de860eb",
    "507f191e810c19729de860ec"
  ],
  "title": "System Maintenance",
  "body": "System will be down for maintenance on 2026-04-07",
  "type": "system"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Notifications sent",
  "summary": {
    "totalRequested": 3,
    "successCount": 3,
    "failureCount": 0
  },
  "results": [
    {
      "userId": "507f191e810c19729de860ea",
      "success": true,
      "notificationId": "507f1f77bcf86cd799439011"
    }
  ]
}
```

---

### 11. Broadcast Notification
Send notification to all users (or by role).

**Endpoint:** `POST /api/notifications/send/broadcast`

**Authentication:** Required (Admin/Pemilik)

**Request Body:**
```json
{
  "title": "New Feature Available",
  "body": "Check out our new booking features!",
  "image": "https://...",
  "type": "promo",
  "role": "pelanggan"
}
```

**Query Parameters for Role:**
- `role` (optional) - Filter by user role: `pelanggan`, `admin`, `pemilik`
- If omitted, sends to all users

**Response:**
```json
{
  "success": true,
  "message": "Broadcast notification sent successfully",
  "data": {
    "totalUsersTargeted": 150,
    "totalDevicesTargeted": 200,
    "fcmResponse": {
      "successCount": 195,
      "failureCount": 5
    }
  }
}
```

---

## Flutter Integration

### 1. Install Firebase Messaging
```bash
flutter pub add firebase_messaging
flutter pub get
```

### 2. Initialize Firebase in Flutter
```dart
import 'package:firebase_messaging/firebase_messaging.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize Firebase
  await Firebase.initializeApp();
  
  // Get FCM token
  String? token = await FirebaseMessaging.instance.getToken();
  print("FCM Token: $token");
  
  runApp(const MyApp());
}
```

### 3. Register FCM Token on App Startup
```dart
Future<void> registerFCMToken(String authToken) async {
  final fcmToken = await FirebaseMessaging.instance.getToken();
  
  final response = await http.post(
    Uri.parse('http://your-backend.com/api/notifications/register-device'),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $authToken',
    },
    body: jsonEncode({
      'fcmToken': fcmToken,
      'deviceName': 'My Device',
      'deviceId': 'device_123',
      'platform': 'android'
    }),
  );
  
  if (response.statusCode == 201) {
    print('Device registered successfully');
  }
}
```

### 4. Handle Incoming Messages
```dart
// Foreground messages
FirebaseMessaging.onMessage.listen((RemoteMessage message) {
  print('Got a message whilst in the foreground!');
  print('Message data: ${message.data}');
  
  if (message.notification != null) {
    print('Message also contained a notification: ${message.notification}');
    
    // Show local notification
    showLocalNotification(
      message.notification!.title ?? '',
      message.notification!.body ?? '',
    );
  }
});

// Background messages
FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
  print('A new onMessageOpenedApp event was published!');
  // Navigate to specific screen based on notification data
});

// Handle notification when terminated
FirebaseMessaging.instance.getInitialMessage().then((message) {
  if (message != null) {
    // Handle notification tap
  }
});
```

### 5. Fetch Notifications from API
```dart
Future<List<Notification>> getNotifications() async {
  final response = await http.get(
    Uri.parse('http://your-backend.com/api/notifications?page=1&limit=20'),
    headers: {
      'Authorization': 'Bearer $authToken',
    },
  );
  
  if (response.statusCode == 200) {
    final json = jsonDecode(response.body);
    List<Notification> notifications = [];
    
    for (var item in json['data']) {
      notifications.add(Notification.fromJson(item));
    }
    
    return notifications;
  }
  
  throw Exception('Failed to fetch notifications');
}
```

### 6. Mark as Read
```dart
Future<void> markNotificationAsRead(String notificationId) async {
  final response = await http.patch(
    Uri.parse('http://your-backend.com/api/notifications/$notificationId/read'),
    headers: {
      'Authorization': 'Bearer $authToken',
    },
  );
  
  if (response.statusCode == 200) {
    print('Notification marked as read');
  }
}
```

---

## Error Handling

### Common Error Responses

**400 Bad Request:**
```json
{
  "success": false,
  "message": "FCM token is required"
}
```

**401 Unauthorized:**
```json
{
  "success": false,
  "message": "Authentication required"
}
```

**403 Forbidden:**
```json
{
  "success": false,
  "message": "Admin access required"
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "Notification not found"
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "message": "Error sending notification",
  "error": "Firebase service unavailable"
}
```

---

## Database Models

### Notification Schema
```javascript
{
  userId: ObjectId,           // Reference to User
  title: String,              // Notification title
  body: String,               // Notification body
  image: String,              // Optional image URL
  type: String,               // booking|payment|service|promo|system|warranty
  relatedId: ObjectId,        // Reference to related document
  relatedModel: String,       // Which model relatedId refers to
  isRead: Boolean,            // Read status
  readAt: Date,               // When it was read
  sentAt: Date,               // When notification was sent
  createdAt: Date             // Created timestamp
}
```

### NotificationDevice Schema
```javascript
{
  userId: ObjectId,           // Reference to User
  fcmToken: String,           // Firebase Cloud Messaging token
  deviceName: String,         // User-friendly device name
  deviceId: String,           // Device identifier
  platform: String,           // android|ios|web (default: android)
  isActive: Boolean,          // Active status
  lastUsedAt: Date,           // Last activity timestamp
  createdAt: Date             // Created timestamp
}
```

---

## Best Practices

✅ **DO:**
- Store FCM token securely in app
- Refresh token periodically
- Handle token refresh when needed
- Implement proper error handling
- Use appropriate notification types
- Test with multiple devices
- Clean up old tokens on logout

❌ **DON'T:**
- Expose service account key
- Send unnecessary notifications (spam)
- Store tokens in plain text on client
- Ignore FCM error responses
- Send notifications without user consent

---

## Testing

### Test with cURL

**Register Device:**
```bash
curl -X POST http://localhost:5000/api/notifications/register-device \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "fcmToken": "exam:ple_token_here",
    "deviceName": "Test Device",
    "platform": "android"
  }'
```

**Get Notifications:**
```bash
curl -X GET "http://localhost:5000/api/notifications?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Send Notification (Admin):**
```bash
curl -X POST http://localhost:5000/api/notifications/send/user \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "userId": "USER_ID_HERE",
    "title": "Test Notification",
    "body": "This is a test notification",
    "type": "system"
  }'
```

---

## Troubleshooting

### FCM Credentials Not Found
**Error:** `Firebase initialization warning: Cannot find module 'firebase-service-account.json'`

**Solution:**
1. Create `firebase-service-account.json` in project root
2. Or use `FIREBASE_SERVICE_ACCOUNT_JSON` environment variable

### Token Not Received in Flutter
**Solution:**
1. Check Firebase project is properly configured
2. Verify `google-services.json` exists in Android project
3. Ensure app has notification permissions

### Notifications Not Displaying
**Solution:**
1. Enable notifications in app permissions
2. Check foreground notification handling in Flutter
3. Verify notification channel configuration (Android)

### Firebase Admin SDK Errors
**Check:**
1. Service account JSON is valid
2. Firebase project ID is correct
3. Cloud Messaging is enabled in Firebase Console
4. Network connectivity is working

---

## Support
For issues or questions, contact the development team.
