# 📋 Project Structure - SpeedLab Workshop Backend

```
Backend/
│
├── 📁 controllers/                    # Business Logic
│   ├── authController.js              # Authentication & Profile
│   ├── bookingController.js           # Booking/Reservasi Management
│   ├── employeeController.js          # Employee Management
│   ├── motorcycleController.js        # Motorcycle Management
│   ├── serviceController.js           # Service Menu Management
│   ├── serviceHistoryController.js    # Service History Management
│   ├── userController.js              # User Management (Admin)
│   └── warrantyController.js          # Warranty Claim Management
│
├── 📁 middleware/                     # Middleware
│   └── auth.js                        # Authentication & Authorization
│
├── 📁 model/                          # Database Models (Mongoose)
│   ├── BookingModel.js                # Booking Schema
│   ├── EmployeeModel.js               # Employee Schema
│   ├── MotorcycleModel.js             # Motorcycle Schema
│   ├── ServiceHistoryModel.js         # Service History Schema
│   ├── ServiceModel.js                # Service Schema
│   ├── UserModel.js                   # User Schema
│   └── WarrantyModel.js               # Warranty Schema
│
├── 📁 routes/                         # API Routes
│   ├── authRoutes.js                  # /api/auth/*
│   ├── bookingRoutes.js               # /api/bookings/*
│   ├── employeeRoutes.js              # /api/employees/*
│   ├── motorcycleRoutes.js            # /api/motorcycles/*
│   ├── serviceHistoryRoutes.js        # /api/service-histories/*
│   ├── serviceRoutes.js               # /api/services/*
│   ├── userRoutes.js                  # /api/users/*
│   └── warrantyRoutes.js              # /api/warranties/*
│
├── 📁 server/                         # Server Configuration
│   └── server.js                      # Main Server File
│
├── 📄 .env.example                    # Environment Variables Example
├── 📄 .gitignore                      # Git Ignore Rules
├── 📄 API_DOCUMENTATION.md            # Complete API Documentation
├── 📄 package.json                    # Dependencies & Scripts
├── 📄 passport.js                     # Passport Configuration (Google OAuth)
├── 📄 QUICKSTART.md                   # Quick Start Guide
├── 📄 README.md                       # Main Documentation
├── 📄 seed.js                         # Database Seeder
└── 📄 TESTING_EXAMPLES.md             # API Testing Examples

```

---

## 📊 Database Schema Overview

### Collections:

1. **users** - User accounts
   - Pelanggan (Customer)
   - Admin
   - Pemilik (Owner)

2. **motorcycles** - Customer motorcycles
   - Multiple motorcycles per user
   - Status tracking

3. **services** - Service menu items
   - Name, price, duration
   - Active/inactive status

4. **bookings** - Reservations/bookings
   - FIFO sorting
   - Status workflow
   - Verification by admin

5. **servicehistories** - Service records
   - Complete service details
   - Spare parts used
   - Warranty expiry

6. **warranties** - Warranty claims
   - Linked to service history
   - Verification by admin

7. **employees** - Staff management
   - Mekanik, Admin, Supervisor
   - Salary tracking

---

## 🔐 Authentication Flow

```
User Registration
    ↓
Login (email/password)
    ↓
JWT Token Generated
    ↓
Token stored in client (Flutter)
    ↓
Token sent in Authorization header
    ↓
Middleware validates token
    ↓
Request processed
```

---

## 🔄 Booking Flow

```
Customer creates booking
    ↓
Status: "Menunggu Verifikasi"
    ↓
Admin verifies booking
    ↓
Status: "Terverifikasi"
    ↓
Admin starts work
    ↓
Status: "Sedang Dikerjakan"
    ↓
Work completed
    ↓
Status: "Selesai"
    ↓
Customer picks up motorcycle
    ↓
Status: "Diambil"
```

---

## 🎯 Key Features

### For Customers (Pelanggan):
✅ Register & Login  
✅ Multiple motorcycle registration  
✅ Create reservations  
✅ View motorcycle status  
✅ View service history  
✅ Claim warranty  
✅ Update profile  

### For Admin:
✅ View bookings (FIFO, date filtered)  
✅ Verify reservations  
✅ Update motorcycle status  
✅ Create service history  
✅ Manage services  
✅ Manage motorcycles  
✅ Manage customers  
✅ Verify warranty claims  
✅ View statistics (for charts)  

### For Owner (Pemilik):
✅ All admin features  
✅ Manage employees  
✅ View all statistics  
✅ View dashboard data  

---

## 📈 Statistics Endpoints (for Flutter Charts)

### Motorcycle Status Distribution
```http
GET /api/motorcycles/stats/summary
```
Returns count by status:
- Menunggu
- Sedang Dikerjakan
- Selesai
- Diambil

### Booking Status Distribution
```http
GET /api/bookings/stats/summary
```
Returns count by status:
- Menunggu Verifikasi
- Terverifikasi
- Sedang Dikerjakan
- Selesai
- Dibatalkan
- Diambil

---

## 🔑 Environment Variables

```env
MONGODB_URI          # MongoDB connection string
JWT_SECRET           # Secret key for JWT tokens
SESSION_SECRET       # Secret key for sessions
PORT                 # Server port (default: 3000)
GOOGLE_CLIENT_ID     # Google OAuth (optional)
GOOGLE_CLIENT_SECRET # Google OAuth (optional)
```

---

## 📦 Dependencies

### Production:
- **express** - Web framework
- **mongoose** - MongoDB ODM
- **jsonwebtoken** - JWT authentication
- **cors** - CORS support
- **dotenv** - Environment variables
- **passport** - Authentication middleware
- **express-session** - Session management

### Development:
- **nodemon** - Auto-reload server

---

## 🚀 Scripts

```bash
npm start        # Run server (production)
npm run dev      # Run server (development with auto-reload)
npm run seed     # Seed database with initial data
npm test         # Run tests (not implemented yet)
```

---

## 📱 Flutter Integration Points

### 1. Authentication
- Store JWT token after login
- Send token in every request header

### 2. API Calls
- Use Dio or http package
- Implement interceptors for token
- Handle 401 (token expired)

### 3. Real-time Updates
- Poll status endpoints regularly
- Or implement WebSocket for real-time (future enhancement)

### 4. Charts
- Use fl_chart package
- Fetch data from /stats/summary endpoints
- Update charts based on status

### 5. Date Filtering
- For admin booking list
- Use date picker and query param

---

## 🔮 Future Enhancements

1. **Security:**
   - [ ] Implement bcrypt for password hashing
   - [ ] Add rate limiting
   - [ ] Add request validation (express-validator)
   - [ ] Implement refresh tokens

2. **Features:**
   - [ ] Push notifications
   - [ ] WebSocket for real-time updates
   - [ ] File upload (motorcycle photos)
   - [ ] PDF generation for service history
   - [ ] Email notifications
   - [ ] SMS notifications

3. **Performance:**
   - [ ] Add caching (Redis)
   - [ ] Database indexing optimization
   - [ ] Query optimization

4. **Monitoring:**
   - [ ] Add logging (Winston)
   - [ ] Add monitoring (Prometheus)
   - [ ] Error tracking (Sentry)

---

## 📊 API Response Format

### Success:
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error:
```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error (development only)"
}
```

---

## 🎓 Code Organization Principles

1. **MVC Pattern**: Model-View-Controller separation
2. **Middleware**: Reusable authentication & authorization
3. **Error Handling**: Centralized error handling
4. **Validation**: Input validation at controller level
5. **Security**: JWT-based authentication
6. **Scalability**: Modular structure for easy expansion

---

## 📝 Notes

- All endpoints (except public ones) require authentication
- FIFO (First In First Out) implemented for booking queue
- Status changes automatically update related entities
- Statistics endpoints optimized for dashboard charts
- Response format consistent across all endpoints

---

**Last Updated:** December 29, 2025  
**Version:** 1.0.0  
**Status:** Production Ready ✅
