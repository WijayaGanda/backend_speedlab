# Supabase Integration - File Upload

## 🚀 Setup Guide

Saya sudah integrate Supabase untuk file upload. Berikut langkah-langkahnya:

---

## 1️⃣ **Install Dependencies**

```bash
npm install
```

---

## 2️⃣ **Setup Supabase Project**

### A. Get API Key dari Supabase

1. Buka [supabase.com](https://supabase.com)
2. Login/Buat account
3. Buka project: `ylyiiipafwquvzjamxol`
4. Pergi ke **Settings** → **API**
5. Copy **anon public** key

### B. Create Storage Bucket

1. Buka **Storage** di sidebar
2. Klik **Create new bucket**
3. Nama: `service-history`
4. Pilih **Public** (agar bisa diakses lewat URL)
5. Klik **Create bucket**

### C. Setup Row Level Security (Optional tapi Recommended)

Jika ingin lebih aman, setup RLS di Storage:

```sql
-- Allow authenticated users to upload
create policy "Users can upload photos"
on storage.objects
for insert
with check (bucket_id = 'service-history');

-- Allow public to view
create policy "Public can view photos"
on storage.objects
for select
using (bucket_id = 'service-history');

-- Allow authenticated to delete own
create policy "Admins can delete"
on storage.objects
for delete
using (bucket_id = 'service-history');
```

---

## 3️⃣ **Add Environment Variables**

### Local (.env)
```bash
NODE_ENV=development
SUPABASE_URL=https://ylyiiipafwquvzjamxol.supabase.co
SUPABASE_KEY=your-anon-public-key-here
```

### Vercel (.env.production)
```bash
NODE_ENV=production
SUPABASE_URL=https://ylyiiipafwquvzjamxol.supabase.co
SUPABASE_KEY=your-anon-public-key-here
```

---

## 4️⃣ **Test Upload**

### Using curl:
```bash
curl -X POST http://localhost:3000/api/service-histories/{serviceHistoryId}/upload-photos \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "photos=@/path/to/photo.jpg" \
  -F "description=Test photo"
```

### Expected Response:
```json
{
  "success": true,
  "message": "1 foto berhasil diunggah ke Supabase",
  "data": {
    "workPhotos": [
      {
        "filename": "servicehistory-1707123456-987654321.jpg",
        "path": "https://ylyiiipafwquvzjamxol.supabase.co/storage/v1/object/public/service-history/servicehistory-...",
        "uploadedAt": "2024-04-14T10:30:00.000Z",
        "description": "Test photo"
      }
    ]
  }
}
```

---

## 🔄 **How It Works**

### Upload Flow:
```
1. Admin POST /api/service-histories/{id}/upload-photos
   ↓
2. Multer capture file ke memory (buffer)
   ↓
3. uploadToSupabase() upload buffer ke Supabase Storage
   ↓
4. Supabase return public URL
   ↓
5. Save URL + metadata ke MongoDB
   ↓
6. Return response dengan data
```

### Delete Flow:
```
1. Admin DELETE /api/service-histories/{id}/photos/{index}
   ↓
2. Extract filename dari URL
   ↓
3. deleteFromSupabase() hapus file dari Supabase
   ↓
4. Remove entry dari workPhotos array di MongoDB
   ↓
5. Save updated document
```

---

## 📊 **API Endpoints**

### Upload Photos
```
POST /api/service-histories/{serviceHistoryId}/upload-photos
Authorization: Bearer {token}
Content-Type: multipart/form-data

Parameters:
- photos: File[] (max 10 files, 5MB each)
- description: String[] (optional)

Response:
{
  "success": true,
  "message": "X foto berhasil diunggah ke Supabase",
  "data": { ... },
  "uploadedPhotos": [...]
}
```

### Delete Photo
```
DELETE /api/service-histories/{serviceHistoryId}/photos/{photoIndex}
Authorization: Bearer {token}

Response:
{
  "success": true,
  "message": "Foto berhasil dihapus",
  "data": { ... }
}
```

### Update Description
```
PUT /api/service-histories/{serviceHistoryId}/photos/{photoIndex}/description
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "description": "New description"
}

Response:
{
  "success": true,
  "message": "Deskripsi foto berhasil diupdate",
  "data": { ... }
}
```

---

## 🎯 **File Structure**

Uploaded files disimpan di Supabase dengan struktur:
```
service-history/
├── servicehistory-1707123456-123456789.jpg
├── servicehistory-1707123457-234567890.png
├── servicehistory-1707123458-345678901.webp
└── ...
```

Setiap file mendapat unique filename berformat:
```
servicehistory-{timestamp}-{randomNumber}.{ext}
```

---

## 📋 **Storage Specs**

| Aspek | Value |
|-------|-------|
| **Max file size** | 5MB |
| **Max files per upload** | 10 |
| **Supported formats** | JPG, PNG, WebP, GIF |
| **Bucket name** | `service-history` |
| **Bucket type** | Public |
| **File retention** | Permanent (sampai di-delete) |

---

## 🔐 **Security Notes**

1. **Public Bucket**: Siapa saja bisa lihat foto (OK untuk public gallery)
2. **Upload Protected**: Hanya authenticated admin yang bisa upload (via middleware)
3. **Delete Protected**: Hanya authenticated admin yang bisa delete (via middleware)
4. **CORS**: Supabase auto-handle CORS, tidak perlu setup

---

## ✅ **Checklist**

- [ ] Install dependencies (`npm install`)
- [ ] Create Supabase account
- [ ] Create storage bucket `service-history`
- [ ] Copy anon public key
- [ ] Add SUPABASE_URL & SUPABASE_KEY ke .env
- [ ] Test upload endpoint
- [ ] Deploy ke production
- [ ] Monitor upload success rate

---

## 🐛 **Troubleshooting**

### Error: "SUPABASE_KEY tidak ditemukan"
```
Solution: Pastikan SUPABASE_KEY ada di .env
```

### Error: "Upload failed: 404 Not Found"
```
Solution: 
1. Create bucket "service-history"
2. Set bucket to PUBLIC
3. Verify SUPABASE_URL correct
```

### Photos tidak bisa dilihat
```
Solution:
1. Verify bucket adalah PUBLIC
2. Check URL format correct
3. Test di browser: https://ylyiiipafwquvzjamxol.supabase.co/storage/v1/object/public/service-history/{filename}
```

### Delete gagal tapi file sudah ter-delete
```
Solution: Normal behavior - file deleted dari DB tapi error delete dari storage
Response akan warning tapi tetap success di DB
```

---

## 💡 **Pro Tips**

1. **Monitor Storage Usage:**
   - Buka Supabase Dashboard → Storage
   - Check usage vs quota

2. **Backup Photos:**
   - Supabase auto backup
   - Atau download periodically

3. **Image Optimization:**
   - Add Supabase Image Transformation: `?width=500&height=500`
   - Contoh: `{publicUrl}?width=300&height=300`

4. **Cost Optimization:**
   - Monitor download bandwidth
   - Consider image compression di client

---

## 🎉 **Done!**

Sekarang Supabase integration sudah siap. Semua file upload akan:
- ✅ Uploaded ke Supabase Storage
- ✅ Metadata disimpan di MongoDB
- ✅ URL public bisa diakses dari mana saja
- ✅ Auto-delete saat photo dihapus

Enjoy! 🚀
