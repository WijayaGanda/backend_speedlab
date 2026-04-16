# Firebase Cloud Messaging Setup Guide

## Complete Setup Instructions for Notification API

---

## Flutter Setup Khusus Notifikasi (FCM)

Bagian ini fokus untuk tim Flutter agar bisa langsung implement push notification ke aplikasi mobile dan terhubung ke endpoint backend:

- POST /api/notifications/register-device
- POST /api/notifications/unregister-device

### Prasyarat

1. Flutter SDK sudah terinstall.
2. Android Studio/Xcode sudah siap untuk build.
3. Firebase Project sudah dibuat.
4. Backend notifikasi sudah running.

### 1) Tambahkan aplikasi Android dan iOS di Firebase

1. Buka Firebase Console.
2. Pilih project Anda.
3. Tambah app Android:
   - Android package name harus sama dengan applicationId di project Flutter.
4. Tambah app iOS:
   - Bundle identifier harus sama dengan Runner di Xcode.

### 2) Download file konfigurasi Firebase

1. Download google-services.json, letakkan di android/app/google-services.json.
2. Download GoogleService-Info.plist, letakkan di ios/Runner/GoogleService-Info.plist.

### 3) Install package Flutter

Tambahkan dependency di pubspec.yaml:

```yaml
dependencies:
  flutter:
    sdk: flutter
  firebase_core: ^3.8.1
  firebase_messaging: ^15.2.10
  flutter_local_notifications: ^17.2.3
  http: ^1.2.2
```

Lalu jalankan:

```bash
flutter pub get
```

### 4) Konfigurasi Android

Pastikan minSdkVersion minimal 21 di android/app/build.gradle.

Tambahkan permission notifikasi untuk Android 13+ di android/app/src/main/AndroidManifest.xml:

```xml
<uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>
```

### 5) Konfigurasi iOS

1. Buka ios/Runner.xcworkspace dengan Xcode.
2. Aktifkan capability:
   - Push Notifications
   - Background Modes -> Remote notifications
3. Jika build iOS, jalankan:

```bash
cd ios
pod install
cd ..
```

### 6) Inisialisasi Firebase + Handler Notifikasi

Buat file lib/services/push_notification_service.dart:

```dart
import 'dart:convert';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:http/http.dart' as http;

@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
}

class PushNotificationService {
  PushNotificationService._();
  static final PushNotificationService instance = PushNotificationService._();

  final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  final FlutterLocalNotificationsPlugin _local = FlutterLocalNotificationsPlugin();

  Future<void> initialize() async {
    await Firebase.initializeApp();

    await _requestPermission();
    await _initLocalNotification();

    FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);

    FirebaseMessaging.onMessage.listen((RemoteMessage message) async {
      await _showForegroundNotification(message);
    });

    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      _handleTap(message);
    });

    final initialMessage = await _messaging.getInitialMessage();
    if (initialMessage != null) {
      _handleTap(initialMessage);
    }

    _messaging.onTokenRefresh.listen((newToken) {
      // Panggil backend agar token terbaru tersimpan
      // registerDevice(authToken, backendBaseUrl);
    });
  }

  Future<void> _requestPermission() async {
    await _messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
      provisional: false,
    );
  }

  Future<void> _initLocalNotification() async {
    const android = AndroidInitializationSettings('@mipmap/ic_launcher');
    const ios = DarwinInitializationSettings();
    const settings = InitializationSettings(android: android, iOS: ios);
    await _local.initialize(settings);
  }

  Future<void> _showForegroundNotification(RemoteMessage message) async {
    final title = message.notification?.title ?? 'Notifikasi';
    final body = message.notification?.body ?? '';

    const androidDetails = AndroidNotificationDetails(
      'speedlab_booking_channel',
      'Booking Notification',
      channelDescription: 'Notifikasi update booking',
      importance: Importance.max,
      priority: Priority.high,
    );
    const iosDetails = DarwinNotificationDetails();

    await _local.show(
      DateTime.now().millisecondsSinceEpoch ~/ 1000,
      title,
      body,
      const NotificationDetails(android: androidDetails, iOS: iosDetails),
      payload: jsonEncode(message.data),
    );
  }

  void _handleTap(RemoteMessage message) {
    final data = message.data;
    final type = data['type'];
    final relatedId = data['relatedId'];

    // Contoh routing:
    // if (type == 'booking' && relatedId != null) {
    //   navigatorKey.currentState?.pushNamed('/booking-detail', arguments: relatedId);
    // }
  }

  Future<String?> getFcmToken() async => _messaging.getToken();

  Future<void> registerDevice(String authToken, String backendBaseUrl) async {
    final token = await getFcmToken();
    if (token == null) return;

    await http.post(
      Uri.parse('$backendBaseUrl/api/notifications/register-device'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $authToken',
      },
      body: jsonEncode({
        'fcmToken': token,
        'deviceName': 'Flutter Device',
        'platform': 'android',
      }),
    );
  }

  Future<void> unregisterDevice(String authToken, String backendBaseUrl) async {
    final token = await getFcmToken();
    if (token == null) return;

    await http.post(
      Uri.parse('$backendBaseUrl/api/notifications/unregister-device'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $authToken',
      },
      body: jsonEncode({'fcmToken': token}),
    );
  }
}
```

### 7) Panggil inisialisasi di main.dart

```dart
import 'package:flutter/material.dart';
import 'services/push_notification_service.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await PushNotificationService.instance.initialize();
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'SpeedLab',
      home: const Scaffold(body: Center(child: Text('SpeedLab App'))),
    );
  }
}
```

### 8) Kapan register dan unregister device

1. Setelah login sukses dan token JWT tersedia -> panggil registerDevice.
2. Saat logout -> panggil unregisterDevice.
3. Saat token refresh dari Firebase -> kirim token baru ke backend.

### 9) Checklist testing Flutter

1. Jalankan app di device fisik.
2. Print token dari getFcmToken dan pastikan tidak null.
3. Panggil register-device, cek response success true.
4. Lakukan event backend (misalnya booking baru/status update).
5. Pastikan notifikasi masuk saat foreground dan background.
6. Tap notifikasi, pastikan routing sesuai type dan relatedId.

### 10) Catatan penting produksi

1. Jangan hardcode backend URL, gunakan environment/flavor.
2. Jangan kirim data sensitif di payload FCM.
3. Selalu simpan notifikasi ke database (sudah dilakukan backend Anda).
4. iOS butuh APNs key/certificate valid di Firebase agar push terkirim.
5. Android emulator tidak selalu konsisten untuk push, prioritas test di device fisik.

---

## Part 1: Firebase Project Setup

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Create a Project"**
3. Enter project name: `SpeedLab Workshop Notifications`
4. Enable Google Analytics (optional)
5. Click **"Create Project"**
6. Wait for project to initialize (2-3 minutes)

### Step 2: Enable Cloud Messaging

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Click **"Cloud Messaging"** tab
3. You'll see:
   - **Server API Key** (deprecated, but note it)
   - **Sender ID** (important for Flutter)
   - **Development token** (for testing)
4. Copy the **Sender ID** for later use

### Step 3: Generate Service Account Key

1. In Firebase Console, go to **Project Settings** → **Service Accounts**
2. Click **"Generate New Private Key"**
3. A JSON file will download automatically
4. **⚠️ SECURE THIS FILE** - it contains sensitive credentials
5. Keep it in a safe location

---

## Part 2: Backend Setup

### Step 1: Install Dependencies

```bash
cd "d:\Kodingan TA\Backend"
npm install firebase-admin
```

### Step 2: Setup Environment Variables

Create/update `.env` file in project root:

```env
# MongoDB
MONGODB_URI=mongodb+srv://speedlab:<password>@cluster0.oskgsvi.mongodb.net/?appName=Cluster0

# JWT
JWT_SECRET=your_jwt_secret_key_here

# Firebase Cloud Messaging
# Option A: Paste JSON directly (replace newlines with \n)
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"your-project-id","private_key_id":"xxx","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk-xxx@your-project-id.iam.gserviceaccount.com","client_id":"xxx","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxx%40your-project-id.iam.gserviceaccount.com"}

# OR Option B: Use file (development only)
# FIREBASE_SERVICE_ACCOUNT_JSON=file:./firebase-service-account.json
```

### Step 3: Add Service Account File (Optional for Development)

1. Save the downloaded JSON file from Firebase as `firebase-service-account.json` in project root
2. Add to `.gitignore`:
   ```
   firebase-service-account.json
   .env
   .env.local
   ```

### Step 4: Verify Installation

Run this command to test Firebase initialization:

```bash
node -e "const admin = require('firebase-admin'); console.log('Firebase loaded successfully');"
```

**Expected output:**
```
Firebase loaded successfully
```

---

## Part 3: Flutter App Setup

### Step 1: Create Flutter Project (if not exists)

```bash
flutter create speedlab_app
cd speedlab_app
```

### Step 2: Add Firebase Dependencies

Edit `pubspec.yaml`:

```yaml
dependencies:
  flutter:
    sdk: flutter
  firebase_core: ^2.24.0
  firebase_messaging: ^14.6.0
  http: ^1.1.0
```

Then run:
```bash
flutter pub get
```

### Step 3: iOS Setup (for Apple devices)

1. Open `ios/Podfile` and uncomment:
   ```ruby
   platform :ios, '11.0'
   ```

2. Run:
   ```bash
   cd ios
   pod install
   cd ..
   ```

### Step 4: Android Setup

1. Get the Flutter FCM Sender ID from Firebase Console:
   - **Project Settings** → **Cloud Messaging** → Copy **Sender ID**

2. Update `android/app/build.gradle`:
   ```gradle
   minSdkVersion 19  // or higher
   compileSdkVersion 34
   ```

3. No additional configuration needed; Firebase automatically configures via `google-services.json`

### Step 5: Add google-services.json to Android

1. In Firebase Console, go to **Project Settings**
2. Click **"Download google-services.json"**
3. Copy file to: `android/app/google-services.json`

### Step 6: Add GoogleService-Info.plist to iOS

1. In Firebase Console, click **"Download GoogleService-Info.plist"**
2. In Xcode, drag and drop the file to: `ios/Runner`
3. Make sure it's added to `Runner` target

### Step 7: Initialize Firebase in Flutter

Create/edit `lib/services/firebase_service.dart`:

```dart
import 'package:firebase_core/firebase_core.dart';
import 'firebase_options.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class FirebaseService {
  static final FirebaseService _instance = FirebaseService._internal();

  factory FirebaseService() {
    return _instance;
  }

  FirebaseService._internal();

  // Background message handler
  static Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
    print("Handling message in background: ${message.messageId}");
  }

  Future<void> initialize() async {
    await Firebase.initializeApp(
      options: DefaultFirebaseOptions.currentPlatform,
    );

    // Set background message handler
    FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

    // Get FCM token
    String? token = await FirebaseMessaging.instance.getToken();
    print("FCM Token: $token");

    // Handle foreground messages
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      print('Got a message whilst in the foreground!');
      print('Message data: ${message.data}');
      print('Message notification: ${message.notification?.title}, ${message.notification?.body}');
    });

    // Handle notification tap
    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      print('Notification tapped');
      _handleNotificationTap(message);
    });

    // Check if app was opened from notification
    RemoteMessage? initialMessage = await FirebaseMessaging.instance.getInitialMessage();
    if (initialMessage != null) {
      _handleNotificationTap(initialMessage);
    }
  }

  Future<String?> getFCMToken() async {
    return await FirebaseMessaging.instance.getToken();
  }

  Future<void> registerDevice(String authToken) async {
    try {
      final fcmToken = await getFCMToken();
      
      if (fcmToken == null) {
        print("Failed to get FCM token");
        return;
      }

      final response = await http.post(
        Uri.parse('http://your-backend-url/api/notifications/register-device'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $authToken',
        },
        body: jsonEncode({
          'fcmToken': fcmToken,
          'deviceName': 'Flutter Device',
          'platform': 'android', // Change to 'ios' if needed
        }),
      );

      if (response.statusCode == 201) {
        print('Device registered successfully');
      } else {
        print('Failed to register device: ${response.body}');
      }
    } catch (e) {
      print('Error registering device: $e');
    }
  }

  void _handleNotificationTap(RemoteMessage message) {
    print('Navigating to notification details');
    // Handle navigation based on message data
    final notificationType = message.data['type'];
    // Navigate to appropriate screen
  }

  Future<void> unregisterDevice(String authToken, String fcmToken) async {
    try {
      final response = await http.post(
        Uri.parse('http://your-backend-url/api/notifications/unregister-device'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $authToken',
        },
        body: jsonEncode({
          'fcmToken': fcmToken,
        }),
      );

      if (response.statusCode == 200) {
        print('Device unregistered successfully');
      }
    } catch (e) {
      print('Error unregistering device: $e');
    }
  }
}
```

### Step 8: Initialize in main.dart

```dart
import 'package:flutter/material.dart';
import 'services/firebase_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize Firebase
  final firebaseService = FirebaseService();
  await firebaseService.initialize();
  
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'SpeedLab',
      home: const HomeScreen(),
    );
  }
}
```

---

## Part 4: Integration with Existing Controllers

### Example: Send Notification on Booking Creation

Edit `controllers/bookingController.js`:

```javascript
const { sendNotificationToUser } = require("../lib/notificationHelper");

const createBooking = async (req, res) => {
  try {
    // ... existing booking creation code ...

    // After booking is saved
    const booking = new Booking(bookingData);
    await booking.save();

    // Send notification to user
    await sendNotificationToUser(req.user.id, {
      title: 'Booking Confirmed',
      body: `Your booking #${booking._id} has been confirmed for ${booking.bookingDate}`,
      image: 'https://your-app.com/booking-icon.png'
    }, {
      type: 'booking',
      relatedId: booking._id,
      relatedModel: 'Booking'
    });

    res.status(201).json({
      success: true,
      data: booking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating booking",
      error: error.message
    });
  }
};

module.exports = { createBooking };
```

### Example: Send Notification on Payment Success

Edit `controllers/paymentController.js`:

```javascript
const { notifyPaymentStatus } = require("../lib/notificationHelper");

const updatePaymentStatus = async (req, res) => {
  try {
    const { transactionId, status } = req.body;

    const payment = await Payment.findByIdAndUpdate(
      transactionId,
      { status, updatedAt: new Date() },
      { new: true }
    );

    // Send notification based on payment status
    if (status === 'success') {
      await notifyPaymentStatus(payment.userId, {
        paymentId: payment._id,
        amount: payment.amount
      }, 'success');
    } else if (status === 'failed') {
      await notifyPaymentStatus(payment.userId, {
        paymentId: payment._id,
        amount: payment.amount
      }, 'failed');
    }

    res.json({
      success: true,
      data: payment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
```

---

## Part 5: Testing

### Test Backend is Working
```bash
npm run dev
# Look for: "Firebase Admin SDK initialized successfully"
```

### Test FCM Token Registration
```bash
curl -X POST http://localhost:5000/api/notifications/register-device \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "fcmToken": "test_token_here",
    "deviceName": "Test Device",
    "platform": "android"
  }'
```

### Test Sending Notification
```bash
curl -X POST http://localhost:5000/api/notifications/send/user \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{
    "userId": "USER_ID",
    "title": "Test Notification",
    "body": "This is a test message"
  }'
```

### Test in Flutter App
1. Register device with correct FCM token
2. Trigger a booking creation
3. Check if push notification appears
4. Tap notification to verify deeplink works

---

## Troubleshooting

### Firebase Initialization Warning
**Problem:** "Firebase initialization warning: Cannot find module"

**Solution:**
1. Ensure `FIREBASE_SERVICE_ACCOUNT_JSON` is set in `.env`
2. Or place `firebase-service-account.json` in project root
3. Restart the server

### No Push Notifications Appearing on Flutter

1. **Check FCM Token:**
   ```dart
   String? token = await FirebaseMessaging.instance.getToken();
   print("My Token: $token");
   ```

2. **Verify Device is Registered:**
   Check database: `db.notificationdevices.find()`

3. **Check Notifications in Database:**
   Check database: `db.notifications.find({userId: "YOUR_ID"})`

4. **Enable Notification Permissions:**
   ```dart
   await FirebaseMessaging.instance.requestPermission();
   ```

5. **Check Android Notification Channel:**
   Ensure app has notification permissions and channels configured.

### Bundle ID/Package Name Issues

**Check your app identifiers:**
- iOS Bundle ID: `ios/Runner/Info.plist` → `CFBundleIdentifier`
- Android Package Name: `android/app/build.gradle` → `applicationId`

These must match in Firebase Project Settings.

### Token Keeps Changing

This is normal! Mobile OS may refresh tokens periodically. The app should re-register on:
- App restart
- Update to Firebase SDK
- Uninstall/reinstall

---

## Security Best Practices

✅ **DO:**
- Store service account JSON securely (not in git)
- Use environment variables for sensitive data
- Validate all notification requests on backend
- Implement rate limiting for notification endpoints
- Audit notification sends
- Encrypt sensitive data in push notifications

❌ **DON'T:**
- Commit firebase-service-account.json to git
- Expose FCM tokens publicly
- Log sensitive user information
- Send sensitive data via FCM (use backend to fetch)
- Test with invalid/fake tokens in production

---

## Production Deployment

### Before Going Live

1. ✅ Test on real devices (not just emulator)
2. ✅ Verify Firebase credentials are set correctly
3. ✅ Test all notification types
4. ✅ Implement notification history backup
5. ✅ Set up monitoring/logging
6. ✅ Test error handling and retry logic
7. ✅ Verify database indexes are created

### Environment Configuration

**Production .env:**
```env
FIREBASE_SERVICE_ACCOUNT_JSON={PRODUCTION_CREDENTIALS}
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@prod-cluster.mongodb.net/
```

### Monitoring

Check Firebase Console for:
- Message delivery rates
- Failed deliveries
- FCM performance metrics
- Error logs

---

## Next Steps

1. ✅ Setup Firebase project ← You are here
2. ⬜ Configure backend with credentials
3. ⬜ Setup Flutter app integration
4. ⬜ Test notification flow
5. ⬜ Deploy to production
6. ⬜ Monitor and optimize

---

## Support Resources

- [Firebase Cloud Messaging Documentation](https://firebase.google.com/docs/cloud-messaging)
- [Firebase Admin SDK Documentation](https://firebase.google.com/docs/reference/admin)
- [Flutter Firebase Messaging Plugin](https://pub.dev/packages/firebase_messaging)
- [Our API Documentation](./NOTIFICATION_API.md)
- [Testing Examples](./NOTIFICATION_TESTING.md)

---

## Contacts

For issues or questions:
- Backend Team: backend-team@example.com
- Firebase Setup Help: firebase-support@example.com
