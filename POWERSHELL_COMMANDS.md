# 🧪 PowerShell Testing Commands - SpeedLab Workshop API

Testing API menggunakan PowerShell di Windows.

---

## 🔐 Authentication

### Register Customer
```powershell
$body = @{
    name = "Budi Santoso"
    email = "budi@example.com"
    password = "budi123"
    phone = "081234567890"
    address = "Jl. Customer No. 123"
    role = "pelanggan"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/auth/register" `
    -Method Post `
    -ContentType "application/json" `
    -Body $body
```

### Register Admin
```powershell
$body = @{
    name = "Admin SpeedLab"
    email = "admin@example.com"
    password = "admin123"
    phone = "081234567890"
    address = "Jl. Bengkel No. 1"
    role = "admin"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/auth/register" `
    -Method Post `
    -ContentType "application/json" `
    -Body $body
```

### Login & Save Token
```powershell
$body = @{
    email = "budi@example.com"
    password = "budi123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" `
    -Method Post `
    -ContentType "application/json" `
    -Body $body

# Save token to variable
$token = $response.data.token
Write-Host "Token: $token"
```

### Get Profile (with token)
```powershell
$headers = @{
    "Authorization" = "Bearer $token"
}

Invoke-RestMethod -Uri "http://localhost:3000/api/auth/profile" `
    -Method Get `
    -Headers $headers
```

---

## 🏍️ Motorcycles

### Register New Motorcycle
```powershell
$headers = @{
    "Authorization" = "Bearer $token"
}

$body = @{
    brand = "Honda"
    model = "Beat"
    year = 2023
    licensePlate = "B 1234 ABC"
    color = "Merah"
} | ConvertTo-Json

$motorcycle = Invoke-RestMethod -Uri "http://localhost:3000/api/motorcycles" `
    -Method Post `
    -ContentType "application/json" `
    -Headers $headers `
    -Body $body

# Save motorcycle ID
$motorcycleId = $motorcycle.data._id
Write-Host "Motorcycle ID: $motorcycleId"
```

### Get My Motorcycles
```powershell
$headers = @{
    "Authorization" = "Bearer $token"
}

Invoke-RestMethod -Uri "http://localhost:3000/api/motorcycles/my-motorcycles" `
    -Method Get `
    -Headers $headers
```

### Get Motorcycle Statistics
```powershell
$headers = @{
    "Authorization" = "Bearer $token"
}

Invoke-RestMethod -Uri "http://localhost:3000/api/motorcycles/stats/summary" `
    -Method Get `
    -Headers $headers
```

### Update Motorcycle Status (Admin)
```powershell
$headers = @{
    "Authorization" = "Bearer $adminToken"
}

$body = @{
    status = "Sedang Dikerjakan"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/motorcycles/$motorcycleId/status" `
    -Method Patch `
    -ContentType "application/json" `
    -Headers $headers `
    -Body $body
```

---

## 🛠️ Services

### Get All Services (Public)
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/services" -Method Get
```

### Create Service (Admin)
```powershell
$headers = @{
    "Authorization" = "Bearer $adminToken"
}

$body = @{
    name = "Service Rutin"
    description = "Ganti oli, cek rem"
    price = 150000
    estimatedDuration = 60
} | ConvertTo-Json

$service = Invoke-RestMethod -Uri "http://localhost:3000/api/services" `
    -Method Post `
    -ContentType "application/json" `
    -Headers $headers `
    -Body $body

$serviceId = $service.data._id
Write-Host "Service ID: $serviceId"
```

---

## 📅 Bookings

### Create Booking
```powershell
$headers = @{
    "Authorization" = "Bearer $token"
}

$body = @{
    motorcycleId = $motorcycleId
    serviceIds = @($serviceId)
    bookingDate = "2024-01-20"
    bookingTime = "10:00"
    complaint = "Mesin kasar dan rem bunyi"
    notes = "Mohon dikerjakan pagi hari"
} | ConvertTo-Json

$booking = Invoke-RestMethod -Uri "http://localhost:3000/api/bookings" `
    -Method Post `
    -ContentType "application/json" `
    -Headers $headers `
    -Body $body

$bookingId = $booking.data._id
Write-Host "Booking ID: $bookingId"
```

### Get My Bookings
```powershell
$headers = @{
    "Authorization" = "Bearer $token"
}

Invoke-RestMethod -Uri "http://localhost:3000/api/bookings/my-bookings" `
    -Method Get `
    -Headers $headers
```

### Get All Bookings (Admin) - Filter by Date
```powershell
$headers = @{
    "Authorization" = "Bearer $adminToken"
}

$date = "2024-01-20"
Invoke-RestMethod -Uri "http://localhost:3000/api/bookings?date=$date" `
    -Method Get `
    -Headers $headers
```

### Verify Booking (Admin)
```powershell
$headers = @{
    "Authorization" = "Bearer $adminToken"
}

$body = @{
    notes = "Booking sudah diverifikasi, silakan datang sesuai jadwal"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/bookings/$bookingId/verify" `
    -Method Patch `
    -ContentType "application/json" `
    -Headers $headers `
    -Body $body
```

### Update Booking Status (Admin)
```powershell
$headers = @{
    "Authorization" = "Bearer $adminToken"
}

$body = @{
    status = "Sedang Dikerjakan"
    notes = "Motor sedang dalam pengerjaan"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/bookings/$bookingId/status" `
    -Method Patch `
    -ContentType "application/json" `
    -Headers $headers `
    -Body $body
```

### Get Booking Statistics
```powershell
$headers = @{
    "Authorization" = "Bearer $adminToken"
}

Invoke-RestMethod -Uri "http://localhost:3000/api/bookings/stats/summary" `
    -Method Get `
    -Headers $headers
```

---

## 📜 Service History

### Create Service History (Admin)
```powershell
$headers = @{
    "Authorization" = "Bearer $adminToken"
}

$body = @{
    bookingId = $bookingId
    diagnosis = "Oli mesin sudah hitam dan kental, kampas rem tipis"
    workDone = "Ganti oli mesin, ganti kampas rem"
    spareParts = @(
        @{
            name = "Oli Shell AX7"
            price = 55000
            quantity = 1
        },
        @{
            name = "Kampas Rem"
            price = 85000
            quantity = 1
        }
    )
    mechanicName = "Budi Mekanik"
    startDate = "2024-01-20T10:00:00"
    endDate = "2024-01-20T12:30:00"
    totalPrice = 290000
    warrantyExpiry = "2024-04-20"
    notes = "Motor sudah selesai"
} | ConvertTo-Json -Depth 3

$history = Invoke-RestMethod -Uri "http://localhost:3000/api/service-histories" `
    -Method Post `
    -ContentType "application/json" `
    -Headers $headers `
    -Body $body

$historyId = $history.data._id
```

### Get My Service History
```powershell
$headers = @{
    "Authorization" = "Bearer $token"
}

Invoke-RestMethod -Uri "http://localhost:3000/api/service-histories/my-history" `
    -Method Get `
    -Headers $headers
```

---

## 🛡️ Warranties

### Create Warranty Claim
```powershell
$headers = @{
    "Authorization" = "Bearer $token"
}

$body = @{
    serviceHistoryId = $historyId
    motorcycleId = $motorcycleId
    complaint = "Rem masih bunyi setelah diganti"
    notes = "Mohon dicek kembali"
} | ConvertTo-Json

$warranty = Invoke-RestMethod -Uri "http://localhost:3000/api/warranties" `
    -Method Post `
    -ContentType "application/json" `
    -Headers $headers `
    -Body $body

$warrantyId = $warranty.data._id
```

### Verify Warranty Claim (Admin)
```powershell
$headers = @{
    "Authorization" = "Bearer $adminToken"
}

$body = @{
    status = "Diterima"
    notes = "Garansi diterima, silakan datang untuk perbaikan"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/warranties/$warrantyId/verify" `
    -Method Patch `
    -ContentType "application/json" `
    -Headers $headers `
    -Body $body
```

---

## 👥 Employees (Owner Only)

### Create Employee
```powershell
$headers = @{
    "Authorization" = "Bearer $ownerToken"
}

$body = @{
    name = "Budi Mekanik"
    email = "budi.mekanik@speedlab.com"
    phone = "081234567890"
    address = "Jl. Karyawan No. 1"
    position = "Mekanik"
    salary = 4500000
    hireDate = "2024-01-01"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/employees" `
    -Method Post `
    -ContentType "application/json" `
    -Headers $headers `
    -Body $body
```

### Get All Employees
```powershell
$headers = @{
    "Authorization" = "Bearer $ownerToken"
}

Invoke-RestMethod -Uri "http://localhost:3000/api/employees" `
    -Method Get `
    -Headers $headers
```

---

## 📊 Health Check

### Check Server Status
```powershell
Invoke-RestMethod -Uri "http://localhost:3000" -Method Get
```

---

## 🔄 Complete Testing Flow Script

Simpan sebagai `test-api.ps1`:

```powershell
# Test API SpeedLab Workshop
Write-Host "=== SpeedLab Workshop API Testing ===" -ForegroundColor Green

# 1. Register Customer
Write-Host "`n1. Register Customer..." -ForegroundColor Yellow
$registerBody = @{
    name = "Budi Santoso"
    email = "budi@example.com"
    password = "budi123"
    phone = "081234567890"
    address = "Jl. Customer No. 123"
    role = "pelanggan"
} | ConvertTo-Json

try {
    $registerResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/register" `
        -Method Post `
        -ContentType "application/json" `
        -Body $registerBody
    Write-Host "✓ Register successful" -ForegroundColor Green
} catch {
    Write-Host "✗ Register failed (might already exist)" -ForegroundColor Red
}

# 2. Login
Write-Host "`n2. Login..." -ForegroundColor Yellow
$loginBody = @{
    email = "budi@example.com"
    password = "budi123"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" `
    -Method Post `
    -ContentType "application/json" `
    -Body $loginBody

$token = $loginResponse.data.token
Write-Host "✓ Login successful" -ForegroundColor Green
Write-Host "Token: $($token.Substring(0,20))..." -ForegroundColor Cyan

# 3. Get Profile
Write-Host "`n3. Get Profile..." -ForegroundColor Yellow
$headers = @{
    "Authorization" = "Bearer $token"
}

$profile = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/profile" `
    -Method Get `
    -Headers $headers

Write-Host "✓ Profile retrieved: $($profile.data.name)" -ForegroundColor Green

# 4. Register Motorcycle
Write-Host "`n4. Register Motorcycle..." -ForegroundColor Yellow
$motorcycleBody = @{
    brand = "Honda"
    model = "Beat"
    year = 2023
    licensePlate = "B $(Get-Random -Minimum 1000 -Maximum 9999) XYZ"
    color = "Merah"
} | ConvertTo-Json

$motorcycleResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/motorcycles" `
    -Method Post `
    -ContentType "application/json" `
    -Headers $headers `
    -Body $motorcycleBody

$motorcycleId = $motorcycleResponse.data._id
Write-Host "✓ Motorcycle registered: $($motorcycleResponse.data.licensePlate)" -ForegroundColor Green

# 5. Get Services
Write-Host "`n5. Get Services..." -ForegroundColor Yellow
$services = Invoke-RestMethod -Uri "http://localhost:3000/api/services" -Method Get
$serviceId = $services.data[0]._id
Write-Host "✓ Services retrieved: $($services.data.Count) services available" -ForegroundColor Green

# 6. Create Booking
Write-Host "`n6. Create Booking..." -ForegroundColor Yellow
$bookingBody = @{
    motorcycleId = $motorcycleId
    serviceIds = @($serviceId)
    bookingDate = (Get-Date).AddDays(1).ToString("yyyy-MM-dd")
    bookingTime = "10:00"
    complaint = "Mesin kasar dan rem bunyi"
    notes = "Test booking dari PowerShell"
} | ConvertTo-Json

$bookingResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/bookings" `
    -Method Post `
    -ContentType "application/json" `
    -Headers $headers `
    -Body $bookingBody

Write-Host "✓ Booking created successfully" -ForegroundColor Green

# 7. Get My Bookings
Write-Host "`n7. Get My Bookings..." -ForegroundColor Yellow
$myBookings = Invoke-RestMethod -Uri "http://localhost:3000/api/bookings/my-bookings" `
    -Method Get `
    -Headers $headers

Write-Host "✓ You have $($myBookings.data.Count) booking(s)" -ForegroundColor Green

Write-Host "`n=== Testing Complete ===" -ForegroundColor Green
```

Jalankan dengan:
```powershell
.\test-api.ps1
```

---

## 💡 Alternative: Gunakan curl.exe

Jika ingin menggunakan curl asli di PowerShell:

```powershell
curl.exe -X POST http://localhost:3000/api/auth/register `
  -H "Content-Type: application/json" `
  -d '{\"name\":\"Budi Santoso\",\"email\":\"budi@example.com\",\"password\":\"budi123\",\"phone\":\"081234567890\",\"address\":\"Jl. Customer No. 123\",\"role\":\"pelanggan\"}'
```

---

## 🎯 Recommended Tools

Untuk testing yang lebih mudah, gunakan:

1. **Thunder Client** (VS Code Extension)
   - Install dari VS Code Extensions
   - GUI yang mudah digunakan

2. **Postman**
   - Download dari postman.com
   - Lebih lengkap dengan collection

3. **REST Client** (VS Code Extension)
   - Testing langsung dari file .http

---

**Note:** Ganti nilai `$token`, `$motorcycleId`, `$serviceId`, dll dengan nilai yang sebenarnya dari response.
