# Flexible Pricing System - Integration Guide

## Overview

The system now supports **flexible pricing** alongside the existing fixed-price model. Both formats can coexist, with automatic detection at the API level.

- **Old Format**: Fixed price per service (backward compatible)
- **New Format**: Flexible pricing with variants and add-ons

---

## 1. Service Management - Variants & Add-ons

### 1.0 Create Service with Variants & Add-ons (All in ONE) ⭐ RECOMMENDED

**Endpoint**: `POST /api/service/create-full`

**Headers**:
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body** (Convenient - buat service sekaligus tambah variants dan addons):
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

**Response**:
```json
{
  "success": true,
  "message": "Layanan berhasil dibuat dengan variants dan add-ons",
  "data": {
    "_id": "service_id_123",
    "name": "Remap ECU",
    "description": "Service remap ECU untuk performa maksimal",
    "basePrice": 2500000,
    "category": "REMAP",
    "estimatedDuration": 120,
    "isWaitable": true,
    "isActive": true,
    "variants": [
      {
        "name": "CBR SP",
        "priceModifier": 550000,
        "description": "Custom tuning untuk CBR model SP"
      },
      {
        "name": "CBR 250RR",
        "priceModifier": 300000,
        "description": "Tuning untuk CBR 250RR"
      }
    ],
    "availableAddons": [
      {
        "id": "addon_id_1",
        "name": "Dyno Rental",
        "price": 250000,
        "type": "OPTIONAL",
        "description": "Rental alat dyno untuk testing",
        "maxQuantity": 1
      },
      {
        "id": "addon_id_2",
        "name": "Tuning Report",
        "price": 100000,
        "type": "OPTIONAL",
        "description": "Laporan detail hasil tuning",
        "maxQuantity": 1
      }
    ],
    "createdAt": "2024-12-19T10:30:00.000Z",
    "summary": {
      "totalVariants": 2,
      "totalAddons": 2
    }
  }
}
```

**Keuntungan**:
- ✅ Satu request saja, bukan perlu 3 requests (create service + add variants + add addons)
- ✅ Lebih cepat dan efisien
- ✅ Atomic operation - semua atau tidak sama sekali

---

### 1.1 Get Available Services

**Endpoint**: `GET /api/service`

**Response** (includes variants and add-ons):
```json
{
  "success": true,
  "data": [
    {
      "_id": "service_id_123",
      "name": "Remap ECU",
      "basePrice": 2500000,
      "category": "REMAP",
      "estimatedDuration": 120,
      "isWaitable": true,
      "isActive": true,
      "variants": [
        {
          "name": "CBR SP",
          "priceModifier": 550000,
          "description": "Custom tuning untuk CBR model SP"
        },
        {
          "name": "CBR 250RR",
          "priceModifier": 300000,
          "description": "Tuning untuk CBR 250RR"
        }
      ],
      "availableAddons": [
        {
          "id": "addon_id_1",
          "name": "Dyno Rental",
          "price": 250000,
          "type": "OPTIONAL",
          "maxQuantity": 1,
          "description": "Rental alat dyno untuk testing"
        },
        {
          "id": "addon_id_2",
          "name": "Tuning Report",
          "price": 100000,
          "type": "OPTIONAL",
          "maxQuantity": 1,
          "description": "Laporan detail hasil tuning"
        }
      ]
    }
  ]
}
```

---

### 1.2 Add Variant to Service (Admin Only)

**Endpoint**: `POST /api/service/:serviceId/variants`

**Headers**:
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "name": "CBR SP",
  "priceModifier": 550000,
  "description": "Custom tuning untuk CBR model SP"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Variant berhasil ditambahkan",
  "data": {
    "_id": "service_id_123",
    "name": "Remap ECU",
    "basePrice": 2500000,
    "variants": [
      {
        "name": "CBR SP",
        "priceModifier": 550000,
        "description": "Custom tuning untuk CBR model SP"
      }
    ]
  }
}
```

---

### 1.3 Update Variant (Admin Only)

**Endpoint**: `PUT /api/service/:serviceId/variants/:variantName`

**Request Body** (all fields optional):
```json
{
  "newName": "CBR SP 2024",
  "priceModifier": 600000,
  "description": "Updated tuning untuk CBR SP 2024 model"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Variant berhasil diupdate",
  "data": { /* updated service object */ }
}
```

---

### 1.4 Delete Variant (Admin Only)

**Endpoint**: `DELETE /api/service/:serviceId/variants/:variantName`

**Response**:
```json
{
  "success": true,
  "message": "Variant berhasil dihapus",
  "data": { /* service object without deleted variant */ }
}
```

---

### 1.5 Add Add-on to Service (Admin Only)

**Endpoint**: `POST /api/service/:serviceId/addons`

**Request Body**:
```json
{
  "name": "Dyno Rental",
  "price": 250000,
  "type": "OPTIONAL",
  "description": "Rental alat dyno untuk testing",
  "maxQuantity": 1
}
```

**Parameters**:
- `name` (required): Nama add-on
- `price` (required): Harga add-on
- `type` (optional): "OPTIONAL" atau "MANDATORY" (default: "OPTIONAL")
- `maxQuantity` (optional): Jumlah maksimal yang bisa dipilih (default: 1)

**Response**:
```json
{
  "success": true,
  "message": "Add-on berhasil ditambahkan",
  "data": { /* updated service object */ }
}
```

---

### 1.6 Update Add-on (Admin Only)

**Endpoint**: `PUT /api/service/:serviceId/addons/:addonId`

**Request Body** (all fields optional):
```json
{
  "name": "Dyno Rental - Updated",
  "price": 300000,
  "type": "OPTIONAL",
  "maxQuantity": 2,
  "description": "Updated description"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Add-on berhasil diupdate",
  "data": { /* updated service object */ }
}
```

---

### 1.7 Delete Add-on (Admin Only)

**Endpoint**: `DELETE /api/service/:serviceId/addons/:addonId`

**Response**:
```json
{
  "success": true,
  "message": "Add-on berhasil dihapus",
  "data": { /* service object without deleted addon */ }
}
```

---

## 2. Booking - Creating with Flexible Pricing

### 2.1 Create Booking - Old Format (Fixed Price)

**BACKWARD COMPATIBLE** - Existing clients can continue using this format.

**Endpoint**: `POST /api/booking`

**Headers**:
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "motorcycleId": "moto_id_123",
  "serviceIds": ["service_id_1", "service_id_2"],
  "bookingDate": "2024-12-20",
  "bookingTime": "10:00",
  "complaint": "Service rutin berkala"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Booking berhasil dibuat",
  "data": {
    "_id": "booking_id_123",
    "userId": "user_id_123",
    "motorcycleId": {
      "_id": "moto_id_123",
      "brand": "Honda",
      "model": "CBR 250RR",
      "plat": "H 8888 ABC"
    },
    "serviceIds": ["service_id_1", "service_id_2"],
    "bookingDate": "2024-12-20T00:00:00.000Z",
    "bookingTime": "10:00",
    "complaint": "Service rutin berkala",
    "status": "Menunggu Verifikasi",
    "servicePrice": 5000000,
    "sparepartsPrice": 0,
    "totalPrice": 5000000,
    "createdAt": "2024-12-19T10:30:00.000Z"
  }
}
```

---

### 2.2 Create Booking - New Format (Flexible with Variants & Add-ons)

**Endpoint**: `POST /api/booking`

**Request Body**:
```json
{
  "motorcycleId": "moto_id_123",
  "bookingServices": [
    {
      "serviceId": "service_id_1",
      "selectedVariant": "CBR SP",
      "selectedAddons": [
        {
          "addonId": "addon_id_1",
          "quantity": 1
        }
      ]
    },
    {
      "serviceId": "service_id_2",
      "selectedVariant": null,
      "selectedAddons": []
    }
  ],
  "bookingDate": "2024-12-20",
  "bookingTime": "10:00",
  "complaint": "Service tuning sport dan maintenance"
}
```

**Parameters Explanation**:
- `bookingServices` (required): Array of services to book
  - `serviceId` (required): ID of the service
  - `selectedVariant` (optional): Name of the variant to add (e.g., "CBR SP")
  - `selectedAddons` (optional): Array of add-ons with quantities
    - `addonId` (required): ID of the add-on
    - `quantity` (optional): Quantity (default: 1)

**Price Calculation Example**:
```
Service 1 (Remap ECU):
  - Base Price: Rp 2,500,000
  - Variant (CBR SP): + Rp 550,000
  - Addon (Dyno): + Rp 250,000
  - Subtotal: Rp 3,300,000

Service 2 (Service):
  - Base Price: Rp 1,500,000
  - Variant: none
  - Addons: none
  - Subtotal: Rp 1,500,000

Total Service Price: Rp 4,800,000
```

**Response**:
```json
{
  "success": true,
  "message": "Booking berhasil dibuat",
  "data": {
    "_id": "booking_id_123",
    "userId": "user_id_123",
    "motorcycleId": { /* motorcycle data */ },
    "bookingDetails": [
      {
        "serviceId": "service_id_1",
        "serviceName": "Remap ECU",
        "basePrice": 2500000,
        "selectedVariant": "CBR SP",
        "selectedAddons": [
          {
            "id": "addon_id_1",
            "name": "Dyno Rental",
            "price": 250000,
            "quantity": 1,
            "subtotal": 250000
          }
        ],
        "addonsTotal": 250000,
        "subtotal": 3300000
      },
      {
        "serviceId": "service_id_2",
        "serviceName": "Service",
        "basePrice": 1500000,
        "selectedVariant": null,
        "selectedAddons": [],
        "addonsTotal": 0,
        "subtotal": 1500000
      }
    ],
    "bookingDate": "2024-12-20T00:00:00.000Z",
    "bookingTime": "10:00",
    "complaint": "Service tuning sport dan maintenance",
    "status": "Menunggu Verifikasi",
    "servicePrice": 4800000,
    "sparepartsPrice": 0,
    "totalPrice": 4800000,
    "createdAt": "2024-12-19T10:30:00.000Z"
  }
}
```

---

## 3. Frontend Implementation Examples

### 3.1 React - Display Services with Variants/Add-ons

```jsx
import React, { useState, useEffect } from 'react';

function ServiceSelection() {
  const [services, setServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);

  useEffect(() => {
    // Fetch services
    fetch('/api/service')
      .then(res => res.json())
      .then(data => setServices(data.data));
  }, []);

  const handleAddService = (serviceId) => {
    setSelectedServices([...selectedServices, {
      serviceId,
      selectedVariant: null,
      selectedAddons: []
    }]);
  };

  const handleVariantChange = (index, variantName) => {
    const updated = [...selectedServices];
    updated[index].selectedVariant = variantName;
    setSelectedServices(updated);
  };

  const handleAddonToggle = (serviceIndex, addonId) => {
    const updated = [...selectedServices];
    const existingAddon = updated[serviceIndex].selectedAddons.find(
      a => a.addonId === addonId
    );

    if (existingAddon) {
      updated[serviceIndex].selectedAddons = 
        updated[serviceIndex].selectedAddons.filter(a => a.addonId !== addonId);
    } else {
      updated[serviceIndex].selectedAddons.push({
        addonId,
        quantity: 1
      });
    }

    setSelectedServices(updated);
  };

  return (
    <div className="service-selection">
      {services.map((service) => (
        <div key={service._id} className="service-card">
          <h3>{service.name}</h3>
          <p className="base-price">
            Base: Rp {service.basePrice?.toLocaleString('id-ID')}
          </p>

          {/* Variants */}
          {service.variants?.length > 0 && (
            <div className="variants">
              <label>Pilih Varian:</label>
              <select
                onChange={(e) => {
                  const index = selectedServices.findIndex(
                    s => s.serviceId === service._id
                  );
                  handleVariantChange(index, e.target.value || null);
                }}
              >
                <option value="">Tidak ada varian</option>
                {service.variants.map((v) => (
                  <option key={v.name} value={v.name}>
                    {v.name} (+Rp {v.priceModifier?.toLocaleString('id-ID')})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Add-ons */}
          {service.availableAddons?.length > 0 && (
            <div className="addons">
              <label>Pilih Add-on:</label>
              {service.availableAddons.map((addon) => (
                <div key={addon.id} className="addon-checkbox">
                  <input
                    type="checkbox"
                    id={addon.id}
                    onChange={() => {
                      const index = selectedServices.findIndex(
                        s => s.serviceId === service._id
                      );
                      handleAddonToggle(index, addon.id);
                    }}
                  />
                  <label htmlFor={addon.id}>
                    {addon.name} - Rp {addon.price?.toLocaleString('id-ID')}
                  </label>
                </div>
              ))}
            </div>
          )}

          <button onClick={() => handleAddService(service._id)}>
            Tambah Layanan
          </button>
        </div>
      ))}
    </div>
  );
}

export default ServiceSelection;
```

---

### 3.2 React - Submit Booking with Flexible Format

```jsx
async function submitFlexibleBooking() {
  const bookingPayload = {
    motorcycleId: selectedMotorcycle._id,
    bookingServices: selectedServices,
    bookingDate,
    bookingTime,
    complaint: complaintText
  };

  const response = await fetch('/api/booking', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(bookingPayload)
  });

  const result = await response.json();

  if (result.success) {
    console.log('✅ Booking created:', result.data);
    // Show success message and navigate
  } else {
    console.error('❌ Booking failed:', result.message);
    // Show error message
  }
}
```

---

### 3.3 Postman Collection - Quick Testing

#### 1. Create Service with Base Price
```
POST /api/service
Authorization: Bearer <admin_token>

{
  "name": "Remap ECU",
  "basePrice": 2500000,
  "estimatedDuration": 120,
  "isWaitable": true,
  "category": "REMAP"
}
```

#### 2. Add Variant
```
POST /api/service/:serviceId/variants
Authorization: Bearer <admin_token>

{
  "name": "CBR SP",
  "priceModifier": 550000,
  "description": "Custom tuning untuk CBR model SP"
}
```

#### 3. Add Add-on
```
POST /api/service/:serviceId/addons
Authorization: Bearer <admin_token>

{
  "name": "Dyno Rental",
  "price": 250000,
  "type": "OPTIONAL",
  "maxQuantity": 1
}
```

#### 4. Create Booking with Flexible Format
```
POST /api/booking
Authorization: Bearer <customer_token>

{
  "motorcycleId": "...",
  "bookingServices": [
    {
      "serviceId": "...",
      "selectedVariant": "CBR SP",
      "selectedAddons": [
        {
          "addonId": "...",
          "quantity": 1
        }
      ]
    }
  ],
  "bookingDate": "2024-12-20",
  "bookingTime": "10:00",
  "complaint": "Service tuning sport"
}
```

---

## 4. Migration Guide - From Old to New Format

### Option 1: Support Both (Recommended)

Continue using the old format for existing clients, gradually migrate to new format:

```javascript
// Old clients can keep using this
const oldBookingPayload = {
  motorcycleId: "...",
  serviceIds: ["id1", "id2"],
  bookingDate: "2024-12-20",
  bookingTime: "10:00",
  complaint: "Service rutin"
};

// New clients use this
const newBookingPayload = {
  motorcycleId: "...",
  bookingServices: [
    {
      serviceId: "id1",
      selectedVariant: "CBR SP",
      selectedAddons: [{ addonId: "addon1", quantity: 1 }]
    },
    {
      serviceId: "id2",
      selectedVariant: null,
      selectedAddons: []
    }
  ],
  bookingDate: "2024-12-20",
  bookingTime: "10:00",
  complaint: "Service tuning sport"
};
```

### Option 2: Convert Data During Setup

If migrating existing services, convert to new format during initial setup phase:

```bash
# For each existing service with fixed price:
# 1. Update service to use basePrice instead of price
# 2. Don't add variants (optional)
# 3. Don't add add-ons (optional)

POST /api/service
{
  "name": "Remap ECU",
  "basePrice": 2500000,  // <-- Instead of "price"
  "estimatedDuration": 120,
  "isWaitable": true,
  "category": "REMAP"
  // variants and addons are empty arrays by default
}
```

---

## 5. API Error Handling

### Common Error Responses

**400 - Missing Required Fields**
```json
{
  "success": false,
  "message": "Layanan dengan ID xyz tidak ditemukan"
}
```

**401 - Unauthorized**
```json
{
  "success": false,
  "message": "Unauthorized - Valid token required"
}
```

**403 - Forbidden (Admin Only)**
```json
{
  "success": false,
  "message": "Hanya admin/pemilik yang dapat melakukan aksi ini"
}
```

**404 - Not Found**
```json
{
  "success": false,
  "message": "Layanan tidak ditemukan"
}
```

**500 - Server Error**
```json
{
  "success": false,
  "message": "Error membuat booking",
  "error": "Detailed error message"
}
```

---

## 6. Frequently Asked Questions

### Q: Can I use both old and new format in the same booking?
**A**: No, each booking uses either the old format (serviceIds) or new format (bookingServices), not both.

### Q: What happens to existing bookings with serviceIds?
**A**: They remain unchanged. The system maintains backward compatibility. Both old and new bookings coexist in the database.

### Q: Can I delete a variant if a booking uses it?
**A**: Yes, the system allows deletion. The booking details will still store the variant name and price modifier that was chosen at booking time.

### Q: Is the variant price modifier cumulative with addons?
**A**: Yes, the final price is: `basePrice + variantModifier + (addon1.price × qty1) + (addon2.price × qty2) ...`

### Q: Can customers create addons or variants?
**A**: No, only admin/pemilik users can create/update/delete variants and addons via the API.

### Q: What's the maximum number of addons per service?
**A**: There's no hard limit, but each addon has a `maxQuantity` field that controls how many of that specific addon can be selected.

---

## 7. Testing Checklist

- [ ] Create service with basePrice
- [ ] Add variant to service
- [ ] Update variant
- [ ] Delete variant
- [ ] Add add-on to service
- [ ] Update add-on
- [ ] Delete add-on
- [ ] Create booking with old format (serviceIds)
- [ ] Verify old format booking price calculation
- [ ] Create booking with new format (bookingServices)
- [ ] Verify flexible format price calculation with variant
- [ ] Verify flexible format price calculation with addons
- [ ] Verify flexible format price calculation with both variant and addons
- [ ] Get booking details and verify bookingDetails array is populated
- [ ] List all bookings and verify mixed format bookings coexist

---

## 8. Production Deployment Notes

1. **Database Migration**: No migration needed - existing bookings use `serviceIds`, new bookings use `bookingDetails`
2. **Backward Compatibility**: All existing clients continue to work without code changes
3. **Gradual Rollout**: Roll out new UI for flexible bookings alongside old UI
4. **Testing**: Test both formats thoroughly before production launch
5. **Monitoring**: Monitor booking creation logs to verify both formats are working

---

**Last Updated**: December 2024  
**Status**: Ready for Integration & Testing
