# Solusi Ketidakkonsistenan Data Harga Booking & Service History

## 🔍 Masalah Awal

Sebelum solusi ini, ada ketidakkonsistenan dalam penyimpanan harga:

| Model | Harga yang Disimpan | Masalah |
|-------|-------------------|--------|
| **Booking** | `totalPrice` = hanya harga service saja | Tidak tahu harga spare parts |
| **ServiceHistory** | `totalPrice` = service + spare parts | Data dari request client, tidak tervalidasi |

Hal ini mengakibatkan:
- ❌ Frontend harus fetch 2 API (Booking + ServiceHistory) untuk tahu breakdown harga
- ❌ Tidak ada pemisahan jelas antara biaya service vs spare parts
- ❌ Data tidak konsisten jika ada update

---

## ✅ Solusi Implementasi

### 1️⃣ **Update Model Schema**

#### BookingModel.js
```javascript
// Tambah field breakdown harga
servicePrice: {           // Harga dari service/jasa saja
  type: Number, 
  default: 0,
  description: "Harga dari service/jasa saja"
},
sparepartsPrice: {        // Harga spare parts jika ada
  type: Number, 
  default: 0,
  description: "Harga dari spare parts yang digunakan"
},
totalPrice: {             // Total = servicePrice + sparepartsPrice
  type: Number, 
  default: 0,
  description: "Total harga = servicePrice + sparepartsPrice"
}
```

#### ServiceHistoryModel.js
```javascript
// Tambah field breakdown harga yang sama
servicePrice: {
  type: Number, 
  default: 0,
  description: "Harga dari service/jasa saja"
},
sparepartsPrice: {
  type: Number, 
  default: 0,
  description: "Total harga spare parts yang digunakan"
},
totalPrice: {
  type: Number, 
  default: 0,
  description: "Total harga = servicePrice + sparepartsPrice"
}
```

---

### 2️⃣ **Flow Kalkulasi Harga**

#### Saat Membuat Booking:
```
1. Ambil serviceIds yang dipilih user
2. Kalkulasi servicePrice = SUM(price dari semua service)
3. Simpan:
   - servicePrice = hasil kalkulasi
   - sparepartsPrice = 0 (belum ada)
   - totalPrice = servicePrice (sama dengan servicePrice saat pertama kali)
```

#### Saat Membuat Service History:
```
1. Ambil servicePrice dari Booking yang sudah tersimpan
2. Ambil spareParts dari request
3. Kalkulasi sparepartsPrice = SUM(price * quantity dari semua spare parts)
4. Hitung totalPrice = servicePrice + sparepartsPrice
5. Simpan di ServiceHistory dengan breakdown harga
6. UPDATE Booking dengan sparepartsPrice dan totalPrice (baru)
```

#### Saat Update Service History (spareParts berubah):
```
1. Ambil servicePrice (tetap sama)
2. Kalkulasi sparepartsPrice dari spareParts baru
3. Hitung totalPrice = servicePrice + sparepartsPrice (baru)
4. Update ServiceHistory
5. Update Booking dengan sparepartsPrice dan totalPrice (baru)
```

---

### 3️⃣ **API Response Format**

#### Booking API Response
```json
{
  "success": true,
  "data": {
    "_id": "booking-id",
    "userId": "user-id",
    "motorcycleId": "motorcycle-id",
    "serviceIds": ["service1", "service2"],
    "bookingDate": "2024-04-15",
    "bookingTime": "10:00",
    "complaint": "...",
    "status": "Menunggu Verifikasi",
    "servicePrice": 150000,          // Harga service
    "sparepartsPrice": 0,            // Belum ada spare parts
    "totalPrice": 150000,            // Total = 150000 + 0
    "createdAt": "2024-04-14T10:00:00Z"
  }
}
```

#### Service History API Response (saat sudah ada spare parts)
```json
{
  "success": true,
  "data": {
    "_id": "history-id",
    "bookingId": "booking-id",
    "serviceIds": ["service1", "service2"],
    "spareParts": [
      { "name": "Oli", "price": 50000, "quantity": 1 },
      { "name": "Filter", "price": 30000, "quantity": 2 }
    ],
    "servicePrice": 150000,          // Dari booking
    "sparepartsPrice": 110000,       // Kalkulasi: 50000*1 + 30000*2
    "totalPrice": 260000,            // Total = 150000 + 110000
    "status": "Dimulai"
  }
}
```

---

## 🎯 Keuntungan Solusi Ini

| Keuntungan | Penjelasan |
|-----------|-----------|
| ✅ **Single API Call** | Frontend cukup fetch 1 API untuk dapat breakdown harga lengkap |
| ✅ **Breakdown Jelas** | `servicePrice` vs `sparepartsPrice` sudah terpisah |
| ✅ **Server-side Validation** | Harga dihitung di server, tidak bisa manipulasi dari client |
| ✅ **Konsistensi Data** | Booking & ServiceHistory selalu sync (update otomatis) |
| ✅ **Update Dinamis** | Jika sparse parts berubah, harga auto-recalculate |
| ✅ **Tracking Riwayat** | Mudah lihat komposisi biaya dari awal |

---

## 📝 Implementasi di Frontend

### Saat menampilkan Booking:
```javascript
// Dari response Booking API
<div>
  <p>Biaya Service: Rp {numberFormat(booking.servicePrice)}</p>
  <p>Spare Parts: Rp {numberFormat(booking.sparepartsPrice)}</p>
  <hr/>
  <p><strong>Total: Rp {numberFormat(booking.totalPrice)}</strong></p>
</div>
```

### Saat menampilkan Service History:
```javascript
// Dari response ServiceHistory API (breakdown sudah ada)
<div>
  <p>Biaya Service: Rp {numberFormat(history.servicePrice)}</p>
  <ul>
    {history.spareParts.map(part => (
      <li>{part.name} x{part.quantity} = Rp {numberFormat(part.price * part.quantity)}</li>
    ))}
  </ul>
  <p>Subtotal Spare Parts: Rp {numberFormat(history.sparepartsPrice)}</p>
  <hr/>
  <p><strong>Total: Rp {numberFormat(history.totalPrice)}</strong></p>
</div>
```

---

## 🔄 No Need to Modify Request Body

Penting: **Frontend TIDAK PERLU mengirim `totalPrice` di request body lagi**

### ❌ Dulu (JANGAN):
```javascript
POST /api/serviceHistory
{
  "bookingId": "...",
  "spareParts": [...],
  "totalPrice": 260000  // ❌ Jangan, harga bisa salah!
}
```

### ✅ Sekarang (LAKUKAN):
```javascript
POST /api/serviceHistory
{
  "bookingId": "...",
  "spareParts": [
    { "name": "Oli", "price": 50000, "quantity": 1 },
    { "name": "Filter", "price": 30000, "quantity": 2 }
  ]
  // totalPrice tidak perlu, auto-calculated di server!
}
```

---

## 📊 Database Migration (Jika ada data lama)

Jika sudah ada data di database, jalankan script untuk migrate:

```javascript
// Update existing bookings
db.bookings.updateMany(
  { servicePrice: { $exists: false } },
  [
    {
      $set: {
        servicePrice: "$totalPrice",
        sparepartsPrice: 0
      }
    }
  ]
);

// Update existing service histories
db.servicehistories.updateMany(
  { servicePrice: { $exists: false } },
  [
    {
      $set: {
        servicePrice: { $toDouble: "$totalPrice" },
        sparepartsPrice: {
          $cond: [
            { $isArray: "$spareParts" },
            {
              $reduce: {
                input: "$spareParts",
                initialValue: 0,
                in: { $add: ["$$value", { $multiply: ["$$this.price", "$$this.quantity"] }] }
              }
            },
            0
          ]
        }
      }
    }
  ]
);
```

---

## 🧪 Testing Checklist

- [ ] Test create booking - pastikan `servicePrice` terisi, `sparepartsPrice = 0`
- [ ] Test create service history dengan spare parts - pastikan kalkulasi `sparepartsPrice` benar
- [ ] Test update service history spareParts - pastikan `sparepartsPrice` dan `totalPrice` ter-update
- [ ] Test booking ter-update setelah service history dibuat
- [ ] Test GET booking - breakdown harga ada
- [ ] Test GET service history - breakdown harga ada
- [ ] Verifikasi data konsisten antara Booking dan ServiceHistory

---

## 📌 Summary

| Aspek | Sebelum | Sesudah |
|-------|--------|--------|
| **Field Harga** | `totalPrice` saja | `servicePrice`, `sparepartsPrice`, `totalPrice` |
| **Kalkulasi** | Manual dari client | Otomatis dari server |
| **Konsistensi** | Tidak terjamin | Terjamin (auto-sync) |
| **API Calls** | 2 API (kompleks) | 1 API (simple) |
| **Breakdown** | Tidak jelas | Sangat jelas |

Solusi ini membuat harga lebih **transparan**, **konsisten**, dan **mudah di-display** di frontend! 🎉
