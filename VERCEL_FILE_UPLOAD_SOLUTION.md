# Solusi: File Upload untuk Vercel (Serverless)

## 🚨 **Masalah di Vercel**

```
Error: ENOENT: no such file or directory, mkdir '/var/task/uploads/service-history'
```

**Root Cause:** Vercel adalah **serverless** environment, tidak ada persistent file system.

---

## 📋 **Why This Happens**

| Environment | File System | Status |
|-------------|-----------|--------|
| **Local Dev** | Persistent | ✅ Works |
| **Regular Server** | Persistent | ✅ Works |
| **Vercel** | Ephemeral (read-only) | ❌ Doesn't work |

Vercel `/var/task/` folder adalah **read-only** dan di-reset setiap request.

---

## ✅ **Quick Fix (Current Implementation)**

Saya sudah implement environment detection:

**Development (.env.local):**
```bash
NODE_ENV=development
```
→ Menggunakan **Local Storage** (disk)

**Production (Vercel):**
```bash
NODE_ENV=production
```
→ Mengembalikan **503 Service Unavailable** dengan pesan bahwa feature sedang dalam maintenance

---

## 🎯 **3 Solusi Permanen untuk Production**

### **Solusi 1: AWS S3 (Recommended for Scalability)**

#### Install:
```bash
npm install aws-sdk
```

#### Update uploadMiddleware.js:
```javascript
const AWS = require('aws-sdk');

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const uploadToS3 = (file) => {
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: `service-history/${Date.now()}-${file.originalname}`,
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: 'public-read'
  };

  return s3.upload(params).promise();
};
```

#### Vercel .env:
```
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
AWS_BUCKET_NAME=your-bucket-name
```

---

### **Solusi 2: Azure Blob Storage**

#### Install:
```bash
npm install @azure/storage-blob
```

#### Vercel .env:
```
AZURE_STORAGE_CONNECTION_STRING=xxx
AZURE_STORAGE_CONTAINER=service-history
```

---

### **Solusi 3: Deploy ke Railway/Render (memiliki persistent storage)**

- **Railway.app** - Lebih flexible, support persistent volumes
- **Render.com** - Ada free tier dengan persistent disk
- **Heroku** - Classic option (sekarang berbayar)

---

## 📝 **Untuk Immediate Fix (Current State)**

**Development (Local):**
```bash
npm install
npm run dev
```
→ Upload foto bekerja normal di localhost

**Production (Vercel - Current):**
- Upload foto akan return error 503
- Fitur foto disabled sampai cloud storage di-implement

---

## 🔄 **Next Steps untuk Production**

### **Step 1: Pilih Cloud Provider**
- AWS S3 ✅ (Best for production)
- Azure Blob Storage ✅
- Google Cloud Storage ✅
- Cloudinary ✅ (Easiest)

### **Step 2: Update uploadMiddleware.js**
```javascript
if (isProduction) {
  // Gunakan cloud storage
  const storage = cloudStorage(); // S3, Azure, dll
} else {
  // Gunakan local storage
  const storage = multer.diskStorage({...});
}
```

### **Step 3: Update uploadWorkPhotos Controller**
```javascript
newPhotos = req.files.map((file, index) => ({
  filename: generateUniqueFilename(),
  path: uploadToCloud(file),  // S3 URL, Azure URL, dll
  uploadedAt: new Date(),
  description: ...
}));
```

### **Step 4: Add to Vercel .env**
```
CLOUD_PROVIDER=s3  // atau 'azure', 'gcs', dll
CLOUD_ACCESS_KEY=xxx
CLOUD_SECRET_KEY=xxx
```

---

## 🚀 **Recommended: Cloudinary (Easiest)**

Cloudinary adalah yang paling simple untuk production:

### Install:
```bash
npm install cloudinary multer-storage-cloudinary
```

### Setup:
```javascript
const cloudinary = require('cloudinary').v2;
const CloudinaryStorage = require('multer-storage-cloudinary').CloudinaryStorage;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'speedlab/service-history',
    resource_type: 'auto',
  }
});

module.exports = multer({ storage });
```

### Vercel .env:
```
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx
NODE_ENV=production
```

**Keuntungan:**
- ✅ Free tier generous (25GB/month)
- ✅ Auto image optimization
- ✅ CDN included
- ✅ Mudah setup

---

## 📊 **Perbandingan**

| Provider | Setup | Cost | Performance | Notes |
|----------|-------|------|-------------|-------|
| **Local Storage** | ⭐⭐⭐ | $0 | ⭐⭐⭐ | Dev only |
| **Cloudinary** | ⭐⭐⭐⭐ | Free | ⭐⭐⭐⭐⭐ | **Best for starting** |
| **AWS S3** | ⭐⭐ | Cheap | ⭐⭐⭐⭐⭐ | **Best for scale** |
| **Azure Blob** | ⭐⭐⭐ | Moderate | ⭐⭐⭐⭐⭐ | Good if using Azure |

---

## 🎯 **Action Items**

- [ ] **Now:** Development bekerja dengan local storage ✅
- [ ] **Soon:** Implement cloud storage (pick 1: Cloudinary, AWS, atau Azure)
- [ ] **Deploy:** Test di Vercel setelah cloud storage ready
- [ ] **Monitor:** Check upload success rate & costs

---

## 📌 **Current Status**

```
✅ Development (LOCAL): Photo upload works
❌ Production (VERCEL): Photo upload returns 503 (maintenance mode)
⏳ Next Phase: Implement cloud storage
```

---

## 💡 **Pro Tips**

1. **Test cloud storage di local dulu** sebelum deploy ke Vercel
2. **Add monitoring** untuk track upload success rate
3. **Set size limits** di cloud provider (prevent abuse)
4. **Use CDN URL** untuk faster image loading
5. **Add image optimization** di cloud provider (auto-resize, compress)

---

Sudah siap untuk implement cloud storage? Pilih provider favorit dan saya akan setup-nya! 🚀
