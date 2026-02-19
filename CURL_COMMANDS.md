# 🧪 cURL Testing Commands - SpeedLab Workshop API

Quick testing menggunakan cURL di terminal/command prompt.

---

## 🔐 Authentication

### Register Customer
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Budi Santoso\",\"email\":\"budi@example.com\",\"password\":\"budi123\",\"phone\":\"081234567890\",\"address\":\"Jl. Customer No. 123\",\"role\":\"pelanggan\"}"
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"budi@example.com\",\"password\":\"budi123\"}"
```

### Get Profile (with token)
```bash
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 🏍️ Motorcycles

### Register New Motorcycle
```bash
curl -X POST http://localhost:3000/api/motorcycles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d "{\"brand\":\"Honda\",\"model\":\"Beat\",\"year\":2023,\"licensePlate\":\"B 1234 ABC\",\"color\":\"Merah\"}"
```

### Get My Motorcycles
```bash
curl -X GET http://localhost:3000/api/motorcycles/my-motorcycles \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Get Motorcycle Statistics
```bash
curl -X GET http://localhost:3000/api/motorcycles/stats/summary \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Update Motorcycle Status (Admin)
```bash
curl -X PATCH http://localhost:3000/api/motorcycles/MOTORCYCLE_ID/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d "{\"status\":\"Sedang Dikerjakan\"}"
```

---

## 🛠️ Services

### Get All Services (Public)
```bash
curl -X GET http://localhost:3000/api/services
```

### Create Service (Admin)
```bash
curl -X POST http://localhost:3000/api/services \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d "{\"name\":\"Service Rutin\",\"description\":\"Ganti oli, cek rem\",\"price\":150000,\"estimatedDuration\":60}"
```

---

## 📅 Bookings

### Create Booking
```bash
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d "{\"motorcycleId\":\"MOTOR_ID\",\"serviceIds\":[\"SERVICE_ID1\",\"SERVICE_ID2\"],\"bookingDate\":\"2024-01-20\",\"bookingTime\":\"10:00\",\"complaint\":\"Mesin kasar\",\"notes\":\"Mohon dikerjakan pagi\"}"
```

### Get My Bookings
```bash
curl -X GET http://localhost:3000/api/bookings/my-bookings \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get All Bookings (Admin) - Today
```bash
curl -X GET "http://localhost:3000/api/bookings?date=2024-01-20" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### Verify Booking (Admin)
```bash
curl -X PATCH http://localhost:3000/api/bookings/BOOKING_ID/verify \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d "{\"notes\":\"Booking diverifikasi\"}"
```

### Update Booking Status (Admin)
```bash
curl -X PATCH http://localhost:3000/api/bookings/BOOKING_ID/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d "{\"status\":\"Sedang Dikerjakan\",\"notes\":\"Motor sedang dikerjakan\"}"
```

### Get Booking Statistics
```bash
curl -X GET http://localhost:3000/api/bookings/stats/summary \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

---

## 📜 Service History

### Create Service History (Admin)
```bash
curl -X POST http://localhost:3000/api/service-histories \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d "{\"bookingId\":\"BOOKING_ID\",\"diagnosis\":\"Oli kotor\",\"workDone\":\"Ganti oli\",\"spareParts\":[{\"name\":\"Oli\",\"price\":50000,\"quantity\":1}],\"mechanicName\":\"Budi\",\"startDate\":\"2024-01-20T10:00:00\",\"endDate\":\"2024-01-20T11:00:00\",\"totalPrice\":200000,\"warrantyExpiry\":\"2024-04-20\"}"
```

### Get My Service History
```bash
curl -X GET http://localhost:3000/api/service-histories/my-history \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🛡️ Warranties

### Create Warranty Claim
```bash
curl -X POST http://localhost:3000/api/warranties \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d "{\"serviceHistoryId\":\"HISTORY_ID\",\"motorcycleId\":\"MOTOR_ID\",\"complaint\":\"Masih bunyi\",\"notes\":\"Mohon dicek\"}"
```

### Verify Warranty Claim (Admin)
```bash
curl -X PATCH http://localhost:3000/api/warranties/WARRANTY_ID/verify \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d "{\"status\":\"Diterima\",\"notes\":\"Silakan datang untuk perbaikan\"}"
```

---

## 👥 Employees (Owner Only)

### Create Employee
```bash
curl -X POST http://localhost:3000/api/employees \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer OWNER_TOKEN" \
  -d "{\"name\":\"Budi Mekanik\",\"email\":\"budi@speedlab.com\",\"phone\":\"081234567890\",\"position\":\"Mekanik\",\"salary\":5000000}"
```

### Get All Employees
```bash
curl -X GET http://localhost:3000/api/employees \
  -H "Authorization: Bearer OWNER_TOKEN"
```

---

## 📊 Health Check

### Check Server Status
```bash
curl http://localhost:3000
```

---

## 💡 Tips

### Windows PowerShell
Gunakan backtick ` untuk line continuation:
```powershell
curl -X POST http://localhost:3000/api/auth/login `
  -H "Content-Type: application/json" `
  -d "{\"email\":\"budi@example.com\",\"password\":\"budi123\"}"
```

### Save Token to Variable

**Linux/Mac:**
```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"budi@example.com","password":"budi123"}' | jq -r '.data.token')

# Use token
curl -X GET http://localhost:3000/api/motorcycles/my-motorcycles \
  -H "Authorization: Bearer $TOKEN"
```

**Windows PowerShell:**
```powershell
$response = curl -X POST http://localhost:3000/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"budi@example.com\",\"password\":\"budi123\"}' | ConvertFrom-Json

$TOKEN = $response.data.token

# Use token
curl -X GET http://localhost:3000/api/motorcycles/my-motorcycles `
  -H "Authorization: Bearer $TOKEN"
```

---

## 🔄 Complete Testing Flow

### 1. Setup & Login
```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"test123","phone":"081234567890","role":"pelanggan"}'

# Login & save token
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}' | jq -r '.data.token')
```

### 2. Register Motorcycle
```bash
MOTOR_RESPONSE=$(curl -s -X POST http://localhost:3000/api/motorcycles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"brand":"Honda","model":"Beat","year":2023,"licensePlate":"B 1234 XYZ","color":"Merah"}')

MOTOR_ID=$(echo $MOTOR_RESPONSE | jq -r '.data._id')
```

### 3. Get Services & Create Booking
```bash
# Get first service ID
SERVICE_RESPONSE=$(curl -s http://localhost:3000/api/services)
SERVICE_ID=$(echo $SERVICE_RESPONSE | jq -r '.data[0]._id')

# Create booking
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"motorcycleId\":\"$MOTOR_ID\",\"serviceIds\":[\"$SERVICE_ID\"],\"bookingDate\":\"2024-01-20\",\"bookingTime\":\"10:00\",\"complaint\":\"Test complaint\"}"
```

---

**Note:** Ganti `YOUR_TOKEN_HERE`, `ADMIN_TOKEN`, `BOOKING_ID`, `MOTOR_ID`, etc. dengan nilai yang sebenarnya dari response API.

