# Service History Photo Upload - Documentation

## 📸 Overview

Fitur ini memungkinkan admin untuk mengupload foto progress pekerjaan service di service history. Setiap service history bisa menyimpan multiple photos dengan deskripsi untuk tracking perkerjaan.

---

## ✅ What's New

### Model Update (ServiceHistoryModel.js)
```javascript
workPhotos: [{
  filename: String,           // Nama file di server
  path: String,              // Path file (/uploads/service-history/...)
  uploadedAt: Date,          // Waktu upload
  description: String        // Deskripsi foto (opsional)
}]
```

### New Controller Functions
- `uploadWorkPhotos()` - Upload multiple photos
- `deleteWorkPhoto()` - Delete single photo
- `updatePhotoDescription()` - Update photo description

### New Routes Endpoints
- `POST /api/service-histories/:serviceHistoryId/upload-photos` - Upload photos
- `DELETE /api/service-histories/:serviceHistoryId/photos/:photoIndex` - Delete photo
- `PUT /api/service-histories/:serviceHistoryId/photos/:photoIndex/description` - Update description

---

## 🚀 How to Use

### 1. Install Dependencies
```bash
npm install
# atau jika belum ada:
npm install multer
```

### 2. Upload Photos to Service History

**Request:**
```bash
POST /api/service-histories/{serviceHistoryId}/upload-photos
Authorization: Bearer {token}
Content-Type: multipart/form-data

Body:
- photos: [file1, file2, file3, ...] (max 10 files)
- description: ["Photo 1 desc", "Photo 2 desc", ...] (optional)
```

**Using curl:**
```bash
curl -X POST http://localhost:3000/api/service-histories/6703b4d2c5a3f8e2d1c5a1b0/upload-photos \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "photos=@/path/to/photo1.jpg" \
  -F "photos=@/path/to/photo2.jpg" \
  -F "description=Before service" \
  -F "description=After service"
```

**Response:**
```json
{
  "success": true,
  "message": "2 foto berhasil diunggah",
  "data": {
    "_id": "6703b4d2c5a3f8e2d1c5a1b0",
    "workPhotos": [
      {
        "filename": "servicehistory-1234567890-photo1.jpg",
        "path": "/uploads/service-history/servicehistory-1234567890-photo1.jpg",
        "uploadedAt": "2024-04-14T10:30:00Z",
        "description": "Before service"
      },
      {
        "filename": "servicehistory-1234567890-photo2.jpg",
        "path": "/uploads/service-history/servicehistory-1234567890-photo2.jpg",
        "uploadedAt": "2024-04-14T10:30:05Z",
        "description": "After service"
      }
    ]
  },
  "uploadedPhotos": [...]
}
```

---

### 3. Delete Photo

**Request:**
```bash
DELETE /api/service-histories/{serviceHistoryId}/photos/{photoIndex}
Authorization: Bearer {token}
```

**Using curl:**
```bash
curl -X DELETE http://localhost:3000/api/service-histories/6703b4d2c5a3f8e2d1c5a1b0/photos/0 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "message": "Foto berhasil dihapus",
  "data": { ... }
}
```

---

### 4. Update Photo Description

**Request:**
```bash
PUT /api/service-histories/{serviceHistoryId}/photos/{photoIndex}/description
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "description": "New description"
}
```

**Using curl:**
```bash
curl -X PUT http://localhost:3000/api/service-histories/6703b4d2c5a3f8e2d1c5a1b0/photos/0/description \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Engine repair completed"
  }'
```

---

## 📋 File Specs

### Supported Formats
- JPEG (.jpg, .jpeg)
- PNG (.png)
- WebP (.webp)
- GIF (.gif)

### Size Limits
- **Max file size:** 5MB per file
- **Max files per upload:** 10 files
- **Max total:** 50MB per upload session

### Storage
- **Location:** `/uploads/service-history/`
- **File naming:** `servicehistory-{timestamp}-{random}.{ext}`
- **Access:** `GET /uploads/service-history/{filename}`

---

## 🎯 Frontend Integration Example

### Vue.js / React Upload
```javascript
async function uploadPhotos(serviceHistoryId, files, descriptions = []) {
  const formData = new FormData();
  
  files.forEach((file, index) => {
    formData.append('photos', file);
    if (descriptions[index]) {
      formData.append('description', descriptions[index]);
    }
  });

  const response = await fetch(
    `/api/service-histories/${serviceHistoryId}/upload-photos`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    }
  );

  return await response.json();
}
```

### Display Photos
```javascript
// Dari GET /api/service-histories/{id}
const history = await fetch(`/api/service-histories/${id}`).then(r => r.json());

history.data.workPhotos.forEach((photo, index) => {
  console.log(`Photo ${index}: ${photo.path}`);
  console.log(`Description: ${photo.description}`);
  console.log(`Uploaded at: ${photo.uploadedAt}`);
  
  // Display image
  // <img src={`http://localhost:3000${photo.path}`} />
});
```

---

## 🔐 Authorization

### Upload Photos
- **Required Role:** admin
- **Required Token:** Valid JWT with admin role

### Delete Photos
- **Required Role:** admin
- **Required Token:** Valid JWT with admin role

### View Photos
- **Required Role:** Any authenticated user
- **Required Token:** Valid JWT

---

## 🛡️ Security Features

1. **File Validation**
   - ✅ Mime type check
   - ✅ File extension validation
   - ✅ Size limit enforcement

2. **Access Control**
   - ✅ Only admin can upload/delete photos
   - ✅ AuthenticationMiddleware required
   - ✅ Token validation on all requests

3. **File Management**
   - ✅ Automatic cleanup on delete
   - ✅ Automatic cleanup on service history delete
   - ✅ Unique filename generation

---

## 📊 Complete Response Example

### GET Service History dengan Photos
```json
{
  "success": true,
  "data": {
    "_id": "6703b4d2c5a3f8e2d1c5a1b0",
    "bookingId": "6703b4d2c5a3f8e2d1c5a1b1",
    "userId": "6703b4d2c5a3f8e2d1c5a1b2",
    "motorcycleId": "6703b4d2c5a3f8e2d1c5a1b3",
    "status": "Sedang Dikerjakan",
    "diagnosis": "Engine mala trouble",
    "workDone": "Cleaned carburetor, replaced spark plug",
    "spareParts": [
      {
        "name": "Spark Plug",
        "price": 25000,
        "quantity": 1
      }
    ],
    "servicePrice": 150000,
    "sparepartsPrice": 25000,
    "totalPrice": 175000,
    "mechanicName": "Ahmad",
    "startDate": "2024-04-14T09:00:00Z",
    "workPhotos": [
      {
        "filename": "servicehistory-1234567890-a1b2c3.jpg",
        "path": "/uploads/service-history/servicehistory-1234567890-a1b2c3.jpg",
        "uploadedAt": "2024-04-14T10:30:00Z",
        "description": "Engine before cleaning"
      },
      {
        "filename": "servicehistory-1234567890-d4e5f6.jpg",
        "path": "/uploads/service-history/servicehistory-1234567890-d4e5f6.jpg",
        "uploadedAt": "2024-04-14T10:35:00Z",
        "description": "Engine after cleaning"
      }
    ],
    "createdAt": "2024-04-14T09:00:00Z",
    "updatedAt": "2024-04-14T10:35:00Z"
  }
}
```

---

## ⚠️ Error Handling

### Upload Errors

```json
{
  "success": false,
  "message": "Error mengupload foto",
  "error": "Format file tidak didukung..."
}
```

### Delete Errors

```json
{
  "success": false,
  "message": "Foto berhasil dihapus",
  "error": "Index foto tidak valid"
}
```

---

## 🔄 Workflow Example

### Scenario: Service Progress Tracking

1. **Create Service History**
   ```
   POST /api/service-histories
   → ServiceHistory dibuat, workPhotos = []
   ```

2. **Admin Upload Before Photos**
   ```
   POST /api/service-histories/{id}/upload-photos
   → Upload 2 photos dengan description "Before service"
   → workPhotos now has 2 items
   ```

3. **Update Service Status**
   ```
   PUT /api/service-histories/{id}
   → status = "Sedang Dikerjakan"
   ```

4. **Admin Upload Work Progress Photos**
   ```
   POST /api/service-histories/{id}/upload-photos
   → Upload 3 photos dengan description berbeda
   → workPhotos now has 5 items total
   ```

5. **Customer View Service History**
   ```
   GET /api/service-histories/{id}
   → See semua photos dengan timeline
   ```

6. **Admin Update Photo Description**
   ```
   PUT /api/service-histories/{id}/photos/2/description
   → Update description photo ke-2
   ```

7. **Complete Service**
   ```
   PUT /api/service-histories/{id}
   → status = "Selesai"
   → endDate = now
   ```

---

## 🧹 Cleanup

Photos akan otomatis dihapus dari server dalam 2 kasus:

1. **Saat Delete Photo**
   - File fisik dihapus dari `/uploads/service-history/`
   - Entry dihapus dari database

2. **Saat Delete Service History**
   - Semua file dalam `workPhotos` dihapus
   - Folder entry dihapus dari database

---

## 📝 Migration untuk Data Lama

Jika ada service history yang sudah ada, field `workPhotos` akan otomatis menjadi empty array `[]` karena default value di model.

Tidak perlu migration script khusus! ✨

---

## 🚀 Next Steps

1. Run `npm install` untuk install multer
2. Test endpoints menggunakan Postman/curl
3. Integrate dengan frontend
4. Deploy ke server

Selesai! 🎉
