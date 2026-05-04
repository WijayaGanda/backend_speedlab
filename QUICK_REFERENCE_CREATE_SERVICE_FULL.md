# Endpoint Cepat - Tambah Service Dengan Variants & Addons

## 🚀 Endpoint Baru - ONE SHOT

Admin bisa membuat service lengkap (dengan variants dan addons) hanya dengan **1 request**, bukan 3 request!

### Endpoint
```
POST /api/service/create-full
```

### Headers
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

### Request Body - Example Remap ECU
```json
{
  "name": "Remap ECU",
  "description": "Service remap ECU untuk performa maksimal",
  "basePrice": 2500000,
  "category": "REMAP",
  "estimatedDuration": 120,
  "isWaitable": true,
  "variants": [
    {
      "variantName": "CBR SP",
      "priceModifier": 550000,
      "variantDescription": "Custom tuning untuk CBR model SP"
    },
    {
      "variantName": "CBR 250RR",
      "priceModifier": 300000,
      "variantDescription": "Tuning untuk CBR 250RR"
    }
  ],
  "addons": [
    {
      "addonName": "Dyno Rental",
      "price": 250000,
      "type": "OPTIONAL",
      "addonDescription": "Rental alat dyno untuk testing",
      "maxQuantity": 1
    },
    {
      "addonName": "Tuning Report",
      "price": 100000,
      "type": "OPTIONAL",
      "addonDescription": "Laporan detail hasil tuning",
      "maxQuantity": 1
    }
  ]
}
```

### Response Success (201 Created)
```json
{
  "success": true,
  "message": "Layanan berhasil dibuat dengan variants dan add-ons",
  "data": {
    "_id": "service_id_123",
    "name": "Remap ECU",
    "basePrice": 2500000,
    "variants": [
      { "name": "CBR SP", "priceModifier": 550000, ... },
      { "name": "CBR 250RR", "priceModifier": 300000, ... }
    ],
    "availableAddons": [
      { "id": "addon_1", "name": "Dyno Rental", "price": 250000, ... },
      { "id": "addon_2", "name": "Tuning Report", "price": 100000, ... }
    ],
    "summary": {
      "totalVariants": 2,
      "totalAddons": 2
    }
  }
}
```

---

## Perbandingan: Old Way vs New Way

### ❌ OLD WAY - 3 Requests

```bash
# Request 1: Create service
POST /api/service
{
  "name": "Remap ECU",
  "basePrice": 2500000,
  ...
}
→ Response: { data: { _id: "service_123" } }

# Request 2: Add variant 1
POST /api/service/service_123/variants
{
  "name": "CBR SP",
  "priceModifier": 550000
}
→ Response: success

# Request 3: Add addon 1
POST /api/service/service_123/addons
{
  "name": "Dyno Rental",
  "price": 250000
}
→ Response: success

# Total: 3 HTTP requests, perlu tunggu setiap response
```

### ✅ NEW WAY - 1 Request

```bash
# Satu request saja!
POST /api/service/create-full
{
  "name": "Remap ECU",
  "basePrice": 2500000,
  "variants": [ {...}, {...} ],
  "addons": [ {...}, {...} ]
}
→ Response: { data: { complete service with all variants and addons } }

# Total: 1 HTTP request, selesai!
```

---

## 📋 Field Reference

### Service Fields (Required)
| Field | Type | Example |
|-------|------|---------|
| `name` | String | "Remap ECU" |
| `basePrice` | Number | 2500000 |

### Service Fields (Optional)
| Field | Type | Default | Example |
|-------|------|---------|---------|
| `description` | String | "" | "Service remap ECU..." |
| `category` | String | "SERVICE" | "REMAP", "SERVICE", "RENTAL_DYNO", "TUNING" |
| `estimatedDuration` | Number | 60 | 120 (menit) |
| `isWaitable` | Boolean | false | true |

### Variant Object (Optional Array)
```json
{
  "variantName": "CBR SP",              // Required
  "priceModifier": 550000,              // Required
  "variantDescription": "Desc..."       // Optional
}
```

### Addon Object (Optional Array)
```json
{
  "addonName": "Dyno Rental",           // Required
  "price": 250000,                      // Required
  "type": "OPTIONAL",                   // Optional (default: "OPTIONAL")
  "addonDescription": "Desc...",        // Optional
  "maxQuantity": 1                      // Optional (default: 1)
}
```

---

## Curl Examples

### Simple - Service Tanpa Variants/Addons
```bash
curl -X POST http://localhost:5000/api/service/create-full \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Service Rutin",
    "basePrice": 1500000,
    "estimatedDuration": 90,
    "isWaitable": true
  }'
```

### Complex - Service dengan Variants & Addons
```bash
curl -X POST http://localhost:5000/api/service/create-full \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Remap ECU",
    "description": "Service remap ECU untuk performa maksimal",
    "basePrice": 2500000,
    "category": "REMAP",
    "estimatedDuration": 120,
    "isWaitable": true,
    "variants": [
      {
        "variantName": "CBR SP",
        "priceModifier": 550000,
        "variantDescription": "Custom tuning untuk CBR model SP"
      },
      {
        "variantName": "CBR 250RR",
        "priceModifier": 300000,
        "variantDescription": "Tuning untuk CBR 250RR"
      }
    ],
    "addons": [
      {
        "addonName": "Dyno Rental",
        "price": 250000,
        "type": "OPTIONAL",
        "addonDescription": "Rental alat dyno untuk testing",
        "maxQuantity": 1
      },
      {
        "addonName": "Tuning Report",
        "price": 100000,
        "type": "OPTIONAL",
        "addonDescription": "Laporan detail hasil tuning",
        "maxQuantity": 1
      }
    ]
  }'
```

---

## Postman Setup

### 1. Buat New Request
- Method: `POST`
- URL: `{{baseUrl}}/api/service/create-full`

### 2. Headers Tab
```
Authorization: Bearer {{adminToken}}
Content-Type: application/json
```

### 3. Body Tab → raw (JSON)
Copy-paste request body dari section di atas

### 4. Click Send!

---

## Error Responses

### 400 - Missing Required Fields
```json
{
  "success": false,
  "message": "Nama dan harga service (basePrice) harus diisi"
}
```

### 401 - Unauthorized
```json
{
  "success": false,
  "message": "Unauthorized - Valid token required"
}
```

### 403 - Forbidden (Non-Admin)
```json
{
  "success": false,
  "message": "Hanya admin/pemilik yang dapat melakukan aksi ini"
}
```

### 500 - Server Error
```json
{
  "success": false,
  "message": "Error membuat service dengan details",
  "error": "Detailed error message"
}
```

---

## Testing Flow

```
1. GET /api/service
   → Verify service appears with variants dan addons

2. GET /api/service/:serviceId
   → Verify complete service object dengan semua details

3. POST /api/booking
   → Test booking dengan variants dari service yang baru dibuat
   → Test booking dengan addons dari service yang baru dibuat

4. Verify price calculation benar
   → basePrice + variant modifier + addons
```

---

## Tips & Tricks

✅ **Kosong variants/addons?** → Biarkan array kosong `[]` atau jangan include field
```json
{
  "name": "Service Simple",
  "basePrice": 1000000
  // variants dan addons boleh tidak ada
}
```

✅ **Hanya mau variants, tanpa addons?**
```json
{
  "name": "Service",
  "basePrice": 1000000,
  "variants": [{...}, {...}],
  "addons": []  // atau jangan include
}
```

✅ **Typo di field name?** Sistem akan mengabaikan dan pakai default value, jadi hati-hati!

✅ **Perlu edit setelah dibuat?** Gunakan endpoint individual:
- `POST /api/service/:id/variants` - tambah variant
- `POST /api/service/:id/addons` - tambah addon
- `PUT /api/service/:id` - edit basic info
- `PUT /api/service/:id/variants/:variantName` - edit variant
- `PUT /api/service/:id/addons/:addonId` - edit addon

---

**Last Updated**: May 2026  
**Status**: ✅ Ready to Use
