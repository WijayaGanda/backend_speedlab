# Flexible Pricing System - Advanced Features (Future)

This document outlines future enhancements for the flexible pricing system.

---

## 1. Service Packages/Bundles

**Purpose**: Allow customers to book pre-configured service packages at a bundled price.

**Example**: "Paket Pormap Sport 250cc 2cyl" combines multiple services with a special discount.

### 1.1 PackageModel Structure

```javascript
const PackageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  bundlePrice: { type: Number, required: true },
  discount: { type: Number, default: 0 }, // Rp discount or percentage
  discountType: { type: String, enum: ['FIXED', 'PERCENTAGE'], default: 'FIXED' },
  
  includedServices: [{
    serviceId: { type: ObjectId, ref: 'Service', required: true },
    quantity: { type: Number, default: 1 },
    mandatory: { type: Boolean, default: true },
    variant: String, // Optional: default variant for this service
    addons: [{ addonId: ObjectId, quantity: Number }] // Optional defaults
  }],
  
  isActive: { type: Boolean, default: true },
  isRecommended: { type: Boolean, default: false },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
```

### 1.2 Package Management Endpoints

```
GET    /api/packages              - List all active packages
GET    /api/packages/:id          - Get package details
POST   /api/packages              - Create package (admin only)
PUT    /api/packages/:id          - Update package (admin only)
DELETE /api/packages/:id          - Delete package (admin only)
```

### 1.3 Booking with Package

**Request**:
```json
{
  "motorcycleId": "...",
  "packageId": "package_id_123",
  "customizations": {
    "variant_on_service_1": "CBR SP",
    "skip_addon_on_service_2": true
  },
  "bookingDate": "2024-12-20",
  "bookingTime": "10:00"
}
```

**Price Calculation**:
```
Total = bundlePrice - discount
```

---

## 2. Service Combination Rules

**Purpose**: Define which services can be combined and apply conditional pricing.

### 2.1 Combination Rules Model

```javascript
const CombinationRuleSchema = new mongoose.Schema({
  name: String,
  condition: {
    // If services include ALL of these
    requireServices: [ObjectId],
    // Then apply this modifier
    priceModifier: Number,
    discountPercentage: Number
  }
});
```

### 2.2 Example Rules

- **"Paket Lengkap"**: If booking includes [Remap + Service + Tuning], apply -10% discount
- **"Dyno Premium"**: If Dyno addon is selected for any service, apply -5% on all addons

---

## 3. Addon Groups & Constraints

**Purpose**: Control addon combinations (e.g., "can't have more than 2 addons per service").

### 3.1 Addon Group Model

```javascript
const AddonGroupSchema = new mongoose.Schema({
  name: String, // e.g., "Dyno Services", "Tuning Reports"
  maxPerService: Number, // Max addons from this group per service
  mutuallyExclusive: [String] // Addon IDs that can't be selected together
});
```

---

## 4. Dynamic Pricing Rules

**Purpose**: Support time-based or quantity-based pricing adjustments.

### 4.1 Pricing Rule Examples

- **"Off-peak Discount"**: -10% if booking is Monday-Thursday, 09:00-12:00
- **"Bulk Service Discount"**: -5% per additional service (max -20%)
- **"Member Discount"**: -15% for loyalty program members

### 4.2 Implementation Strategy

```javascript
const applyDynamicPricing = (basePrice, booking, customer) => {
  let discount = 0;
  
  // Time-based discount
  if (isOffPeakTime(booking.bookingTime)) {
    discount += basePrice * 0.10;
  }
  
  // Loyalty discount
  if (customer.isPremiumMember) {
    discount += basePrice * 0.15;
  }
  
  // Bulk service discount
  const additionalServices = booking.bookingServices.length - 1;
  if (additionalServices > 0) {
    discount += Math.min(basePrice * (additionalServices * 0.05), basePrice * 0.20);
  }
  
  return basePrice - discount;
};
```

---

## 5. Pricing History & Audit Trail

**Purpose**: Track all pricing changes for accounting and customer disputes.

### 5.1 PriceAuditModel

```javascript
const PriceAuditSchema = new mongoose.Schema({
  bookingId: ObjectId,
  timestamp: { type: Date, default: Date.now },
  
  originalPrice: Number,
  finalPrice: Number,
  adjustments: [{
    type: String, // "VARIANT", "ADDON", "DISCOUNT", "TAX"
    description: String,
    amount: Number
  }],
  
  appliedBy: { type: ObjectId, ref: 'User' }, // Admin who made changes
  notes: String
});
```

---

## 6. Invoice & Receipt Generation

**Purpose**: Generate detailed invoices with price breakdown.

### 6.1 Invoice Template

```
┌─────────────────────────────────────────┐
│         INVOICE - SpeedLab              │
│                                         │
│ Booking ID: #BK-2024-001234            │
│ Date: 2024-12-20                       │
├─────────────────────────────────────────┤
│ SERVICES & ITEMS                        │
│                                         │
│ 1. Remap ECU (CBR SP)                  │
│    Base Price: Rp 2,500,000            │
│    Variant: +Rp 550,000                │
│    Dyno Rental (x1): +Rp 250,000       │
│    ────────────────────────            │
│    Subtotal: Rp 3,300,000              │
│                                         │
│ 2. Service Rutin                       │
│    Base Price: Rp 1,500,000            │
│    ────────────────────────            │
│    Subtotal: Rp 1,500,000              │
├─────────────────────────────────────────┤
│ SERVICE TOTAL: Rp 4,800,000            │
│ SPARE PARTS:   Rp 0                    │
│                                         │
│ TOTAL: Rp 4,800,000                    │
│                                         │
│ Status: Menunggu Verifikasi            │
└─────────────────────────────────────────┘
```

---

## 7. Promotional Codes & Coupons

**Purpose**: Support discount codes and promotional campaigns.

### 7.1 CouponModel

```javascript
const CouponSchema = new mongoose.Schema({
  code: { type: String, unique: true, required: true },
  description: String,
  discountType: { type: String, enum: ['FIXED', 'PERCENTAGE'] },
  discountValue: Number,
  
  validFrom: Date,
  validUntil: Date,
  maxUses: Number,
  currentUses: { type: Number, default: 0 },
  
  applicableServices: [ObjectId], // Empty = all services
  minBookingAmount: Number,
  
  isActive: { type: Boolean, default: true }
});
```

### 7.2 Coupon Application in Booking

```json
{
  "motorcycleId": "...",
  "bookingServices": [...],
  "couponCode": "SPEEDLAB2024",
  "bookingDate": "2024-12-20",
  "bookingTime": "10:00"
}
```

---

## 8. Customer Analytics & Reporting

### 8.1 Pricing Analysis Reports

- **Average Service Price**: Track pricing trends
- **Most Popular Variants**: Which variants are selected most
- **Top Add-ons**: Which add-ons generate most revenue
- **Discount Impact**: Revenue lost due to discounts/coupons

### 8.2 Revenue Forecasting

```javascript
const generateRevenueReport = (startDate, endDate) => {
  const bookings = await Booking.find({
    createdAt: { $gte: startDate, $lte: endDate }
  });
  
  return {
    totalBookings: bookings.length,
    totalRevenue: bookings.reduce((sum, b) => sum + b.totalPrice, 0),
    averageBookingValue: totalRevenue / totalBookings,
    
    serviceBreakdown: {
      "Remap ECU": totalRevenueForService,
      // ...
    },
    
    variantPopularity: {
      "CBR SP": numberOfTimesSelected,
      // ...
    }
  };
};
```

---

## 9. Integration with Payment System

**Purpose**: Ensure pricing is locked at booking time, not changed at payment.

### 9.1 Payment Request Structure

```json
{
  "bookingId": "...",
  "priceSnapshot": {
    "servicePrice": 4800000,
    "sparepartsPrice": 0,
    "discounts": 0,
    "taxes": 0,
    "totalPrice": 4800000,
    "breakdown": {
      "services": [...],
      "addons": [...],
      "appliedDiscounts": [...]
    }
  },
  "paymentMethod": "CREDIT_CARD",
  "amountPaid": 4800000
}
```

---

## 10. Implementation Roadmap

### Phase 1 (Current - December 2024)
- ✅ Flexible pricing with variants & addons
- ✅ Auto-detect old vs new format
- ✅ Backward compatibility

### Phase 2 (January 2025)
- [ ] Service packages/bundles
- [ ] Package management UI
- [ ] Booking with packages

### Phase 3 (February 2025)
- [ ] Dynamic pricing rules
- [ ] Promotional codes
- [ ] Invoice generation

### Phase 4 (Q1 2025)
- [ ] Advanced analytics & reporting
- [ ] Pricing history & audit
- [ ] Customer loyalty program

---

## Testing Scenarios

### Scenario 1: Package Booking
```
Customer books "Paket Pormap Sport 250cc 2cyl"
- Service 1: Remap ECU (with variant CBR SP)
- Service 2: Service Rutin
- Service 3: Tuning
- Bundle Price: Rp 6,500,000 (normally Rp 7,200,000)
- Savings: Rp 700,000
```

### Scenario 2: Discount Application
```
Customer books services
- Service Price: Rp 4,800,000
- Coupon: SPEEDLAB2024 (-20%)
- Discount: -Rp 960,000
- Final Price: Rp 3,840,000
```

### Scenario 3: Addon Constraints
```
User tries to select 3 addons from "Dyno Services" group
System prevents: "Max 2 items from this group per service"
```

---

**Last Updated**: December 2024  
**Status**: Planned Features - Design Phase
