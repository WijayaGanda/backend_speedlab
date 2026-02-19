# 🚀 Deploy ke Azure App Service

Panduan lengkap deploy SpeedLab Backend API ke Azure.

## 📋 Prerequisites

1. **Azure Account** - [Daftar gratis](https://azure.microsoft.com/free/)
2. **Azure CLI** (pilih salah satu cara install):
   ```powershell
   # Via winget (recommended)
   winget install Microsoft.AzureCLI
   
   # Atau download installer
   # https://aka.ms/installazurecliwindows
   ```

3. **Git** - Pastikan project sudah di-push ke GitHub/Azure Repos

---

## 🎯 Metode 1: Deploy via VS Code (Paling Mudah)

### Step 1: Install Extension
1. Buka VS Code
2. Install extension: **Azure App Service**
3. Install extension: **Azure Account**

### Step 2: Login ke Azure
1. Klik icon Azure di sidebar
2. Klik "Sign in to Azure"
3. Login dengan akun Azure Anda

### Step 3: Deploy
1. Klik kanan pada folder project di VS Code Explorer
2. Pilih **"Deploy to Web App..."**
3. Pilih **"Create new Web App"**
4. Masukkan nama app (contoh: `speedlab-api`)
5. Pilih **Node.js runtime** (versi 18 LTS atau lebih baru)
6. Pilih **Free (F1)** pricing tier
7. Tunggu deployment selesai (5-10 menit)

### Step 4: Set Environment Variables
1. Di VS Code, buka Azure extension
2. Expand **App Services** → pilih app Anda
3. Klik kanan → **Open in Portal**
4. Di Portal, pilih **Settings** → **Configuration**
5. Klik **New application setting**, tambahkan:
   - `MONGODB_URI` = connection string MongoDB Atlas Anda
   - `JWT_SECRET` = secret key JWT Anda
   - `SESSION_SECRET` = secret key session Anda
   - `NODE_ENV` = `production`
6. Klik **Save** → **Continue**

---

## 🎯 Metode 2: Deploy via Azure CLI

### Step 1: Login
```powershell
az login
```

### Step 2: Buat Resource Group
```powershell
az group create --name speedlab-rg --location southeastasia
```

### Step 3: Buat App Service Plan (Free Tier)
```powershell
az appservice plan create --name speedlab-plan --resource-group speedlab-rg --sku F1 --is-linux
```

### Step 4: Buat Web App
```powershell
az webapp create --resource-group speedlab-rg --plan speedlab-plan --name speedlab-api --runtime "NODE:18-lts"
```

### Step 5: Set Environment Variables
```powershell
az webapp config appsettings set --resource-group speedlab-rg --name speedlab-api --settings MONGODB_URI="mongodb+srv://speedlab:PASSWORD@cluster0.oskgsvi.mongodb.net/speedlabDB" JWT_SECRET="supersecretjwtkey" SESSION_SECRET="your-session-secret" NODE_ENV="production"
```

### Step 6: Deploy Code
```powershell
# Dari folder project
az webapp up --resource-group speedlab-rg --name speedlab-api --runtime "NODE:18-lts"
```

---

## 🎯 Metode 3: Deploy via Azure Portal

### Step 1: Buat Web App
1. Login ke [Azure Portal](https://portal.azure.com)
2. Klik **Create a resource**
3. Cari **Web App** → **Create**
4. Isi form:
   - **Resource Group**: Buat baru → `speedlab-rg`
   - **Name**: `speedlab-api` (harus unique)
   - **Publish**: Code
   - **Runtime stack**: Node 18 LTS
   - **Region**: Southeast Asia
   - **Pricing plan**: F1 (Free)
5. Klik **Review + Create** → **Create**

### Step 2: Setup Deployment
1. Buka Web App yang baru dibuat
2. Di menu kiri, pilih **Deployment Center**
3. Pilih source:
   - **GitHub**: Connect repository Anda
   - **Local Git**: Deploy manual dari lokal
4. Follow wizard setup

### Step 3: Set Environment Variables
1. Di Web App, pilih **Configuration**
2. Tambah Application Settings (sama seperti Metode 1)

---

## ✅ Verifikasi Deployment

### Cek Status
```powershell
az webapp show --name speedlab-api --resource-group speedlab-rg --query state
```

### Buka di Browser
```
https://speedlab-api.azurewebsites.net/
```

### Test API
```powershell
curl https://speedlab-api.azurewebsites.net/api/auth/login -X POST -H "Content-Type: application/json" -d '{"email":"test@example.com","password":"password123"}'
```

---

## 📊 Monitoring & Logs

### View Logs di VS Code
1. Azure extension → App Services → your app
2. Klik kanan → **Start Streaming Logs**

### View Logs via CLI
```powershell
az webapp log tail --name speedlab-api --resource-group speedlab-rg
```

### Enable Application Insights (Optional)
```powershell
az monitor app-insights component create --app speedlab-ai --location southeastasia --resource-group speedlab-rg --application-type web
```

---

## 🔒 Security Checklist

- ✅ Environment variables di Azure (jangan hardcode)
- ✅ HTTPS enabled (default di Azure)
- ✅ MongoDB Atlas IP whitelist: Tambahkan `0.0.0.0/0` atau specific Azure IPs
- ✅ CORS configured di `server.js` (sudah ada)
- ⚠️ Ganti semua SECRET keys di production

---

## 💰 Free Tier Limits

Azure App Service Free (F1):
- **60 menit CPU/hari**
- **1 GB RAM**
- **1 GB disk**
- **10 apps max**
- Cocok untuk development/testing

Upgrade ke **Basic (B1)** jika butuh lebih:
```powershell
az appservice plan update --name speedlab-plan --resource-group speedlab-rg --sku B1
```

---

## 🐛 Troubleshooting

### App tidak jalan?
```powershell
# Restart app
az webapp restart --name speedlab-api --resource-group speedlab-rg

# Check logs
az webapp log tail --name speedlab-api --resource-group speedlab-rg
```

### Connection timeout MongoDB?
- Cek MongoDB Atlas Network Access
- Whitelist Azure IPs atau allow all (0.0.0.0/0)

### 502 Bad Gateway?
- Cek apakah PORT sudah benar (Azure set otomatis via `process.env.PORT`)
- Server.js sudah handle: `const PORT = process.env.PORT || 3000;`

---

## 📚 Resources

- [Azure App Service Docs](https://docs.microsoft.com/azure/app-service/)
- [Node.js on Azure](https://docs.microsoft.com/azure/app-service/quickstart-nodejs)
- [Azure Free Account](https://azure.microsoft.com/free/)

---

**URL Production:** `https://speedlab-api.azurewebsites.net`

Setelah deploy, update base URL di frontend Anda!
