# Notification API - Testing Commands

## Setup

### 1. Install Firebase Admin SDK
```bash
npm install firebase-admin
```

### 2. Setup Firebase Credentials
- Add `FIREBASE_SERVICE_ACCOUNT_JSON` to your `.env` file
- Or place `firebase-service-account.json` in project root

### 3. Start the server
```bash
npm run dev
```

---

## Test Scenarios

### Obtain JWT Token First
```bash
# Assuming you use the auth endpoint
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'

# Copy the token from response and use in headers
export TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## User Endpoints Tests

### 1. Register Device (FCM Token)
```bash
curl -X POST http://localhost:5000/api/notifications/register-device \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "fcmToken": "eVj9SQ0YdZo:APA91bFxxx...xxxxxxxxxxxxx",
    "deviceName": "Xiaomi Redmi Note 11",
    "deviceId": "device_123",
    "platform": "android"
  }'
```

**Expected Response (201):**
```json
{
  "success": true,
  "message": "Device registered successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "userId": "507f191e810c19729de860ea",
    "fcmToken": "eVj9SQ0YdZo:APA91bFxxx...xxxxxxxxxxxxx",
    "deviceName": "Xiaomi Redmi Note 11",
    "isActive": true
  }
}
```

---

### 2. Get All Notifications (User)
```bash
# Get first 20 notifications
curl -X GET "http://localhost:5000/api/notifications?page=1&limit=20" \
  -H "Authorization: Bearer $TOKEN"

# Get only unread notifications
curl -X GET "http://localhost:5000/api/notifications?page=1&isRead=false" \
  -H "Authorization: Bearer $TOKEN"

# Get read notifications only
curl -X GET "http://localhost:5000/api/notifications?isRead=true" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "title": "Booking Confirmed",
      "body": "Your booking #123 has been confirmed",
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

---

### 3. Get Single Notification
```bash
curl -X GET http://localhost:5000/api/notifications/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer $TOKEN"
```

---

### 4. Mark Notification as Read
```bash
curl -X PATCH http://localhost:5000/api/notifications/507f1f77bcf86cd799439011/read \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
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

### 5. Mark All Notifications as Read
```bash
curl -X PATCH http://localhost:5000/api/notifications/read/all \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN"
```

---

### 6. Delete Notification
```bash
curl -X DELETE http://localhost:5000/api/notifications/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer $TOKEN"
```

---

### 7. Delete All Notifications
```bash
curl -X DELETE http://localhost:5000/api/notifications/delete/all \
  -H "Authorization: Bearer $TOKEN"
```

---

### 8. Unregister Device
```bash
curl -X POST http://localhost:5000/api/notifications/unregister-device \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "fcmToken": "eVj9SQ0YdZo:APA91bFxxx...xxxxxxxxxxxxx"
  }'
```

---

## Admin Endpoints Tests

### Admin Prerequisites
Get admin token (must have role: 'admin' or 'pemilik')

```bash
# Login as admin
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123"
  }'

export ADMIN_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

### 9. Send Notification to Single User (Admin)
```bash
curl -X POST http://localhost:5000/api/notifications/send/user \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "userId": "507f191e810c19729de860ea",
    "title": "Payment Reminder",
    "body": "Please complete your payment for booking #123",
    "type": "payment",
    "relatedId": "507f191e810c19729de860eb",
    "relatedModel": "Booking"
  }'
```

**Different Notification Types:**

**Booking Confirmation:**
```bash
curl -X POST http://localhost:5000/api/notifications/send/user \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "userId": "507f191e810c19729de860ea",
    "title": "Booking Confirmed",
    "body": "Your booking #ORD-2026-04-001 has been confirmed. Service date: April 10, 2026",
    "type": "booking",
    "image": "https://example.com/booking-icon.png"
  }'
```

**Service Completion:**
```bash
curl -X POST http://localhost:5000/api/notifications/send/user \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "userId": "507f191e810c19729de860ea",
    "title": "Service Completed",
    "body": "Your motorcycle service has been completed. please pick it up from our workshop.",
    "type": "service"
  }'
```

**Promotional:**
```bash
curl -X POST http://localhost:5000/api/notifications/send/user \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "userId": "507f191e810c19729de860ea",
    "title": "Special Offer",
    "body": "Get 20% discount on all services this weekend!",
    "type": "promo",
    "image": "https://example.com/promo-banner.png"
  }'
```

---

### 10. Send Notification to Multiple Users (Admin)
```bash
curl -X POST http://localhost:5000/api/notifications/send/multiple \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "userIds": [
      "507f191e810c19729de860ea",
      "507f191e810c19729de860eb",
      "507f191e810c19729de860ec"
    ],
    "title": "System Maintenance",
    "body": "System will be down for maintenance on April 7, 2026 (10 PM - 2 AM)",
    "type": "system"
  }'
```

**Expected Response:**
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

### 11. Broadcast Notification (Admin)
```bash
# Send to all active users
curl -X POST http://localhost:5000/api/notifications/send/broadcast \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "title": "New Feature Available",
    "body": "Check out our new online booking features!",
    "type": "promo"
  }'

# Send only to 'pelanggan' role
curl -X POST http://localhost:5000/api/notifications/send/broadcast \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "title": "Customer Exclusive Offer",
    "body": "Members get exclusive discounts. Login now!",
    "type": "promo",
    "role": "pelanggan"
  }'

# Send only to 'admin' role
curl -X POST http://localhost:5000/api/notifications/send/broadcast \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "title": "Admin Alert",
    "body": "New user registrations: 15. Pending bookings: 23",
    "type": "system",
    "role": "admin"
  }'
```

**Expected Response:**
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

## Error Testing

### Test Invalid FCM Token
```bash
curl -X POST http://localhost:5000/api/notifications/register-device \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "fcmToken": "invalid_token",
    "platform": "android"
  }'

# Expected: 201 (stored, but FCM will fail when sending)
```

### Test Missing Required Fields
```bash
curl -X POST http://localhost:5000/api/notifications/send/user \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "title": "Missing Body"
  }'

# Expected: 400 Bad Request
```

### Test Unauthorized Access
```bash
curl -X POST http://localhost:5000/api/notifications/send/broadcast \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{
    "title": "Test",
    "body": "Test message"
  }'

# Expected: 403 Forbidden
```

### Test Non-Existent User
```bash
curl -X GET http://localhost:5000/api/notifications/invalid-id \
  -H "Authorization: Bearer $TOKEN"

# Expected: 404 Not Found
```

---

## Postman Collection

Import this file to Postman for easier testing:

```json
{
  "info": {
    "name": "Notification API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Register Device",
      "request": {
        "method": "POST",
        "header": [
          {"key": "Authorization", "value": "Bearer {{token}}", "type": "text"}
        ],
        "body": {
          "mode": "raw",
          "raw": "{\"fcmToken\":\"test_token\",\"deviceName\":\"My Phone\",\"platform\":\"android\"}"
        },
        "url": {"raw": "{{baseUrl}}/api/notifications/register-device"}
      }
    }
  ]
}
```

---

## Notes

- Replace `$TOKEN` with actual JWT token from login
- Replace `$ADMIN_TOKEN` with admin user's JWT token
- Replace user IDs with actual MongoDB ObjectIds from your database
- Notification types: `booking`, `payment`, `service`, `promo`, `warranty`, `system`
- Platforms: `android`, `ios`, `web`
- Roles: `pelanggan`, `admin`, `pemilik`
- FCM tokens are example format; use actual tokens from devices
