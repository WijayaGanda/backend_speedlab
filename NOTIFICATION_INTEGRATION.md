# Integration Guide: Using Notifications in Controllers

Panduan lengkap untuk mengintegrasikan notification system ke dalam controller yang sudah ada.

---

## Quick Integration

### Step 1: Import Notification Helper

```javascript
const { 
  sendNotificationToUser,
  notifyBookingConfirmation,
  notifyPaymentStatus,
  notifyServiceCompleted,
  notifyWarrantyClaim
} = require("../lib/notificationHelper");
```

### Step 2: Send Notification

```javascript
// Setelah membuat dokumen baru
await notifyBookingConfirmation(userId, { bookingId: booking._id });
```

---

## Complete Integration Examples

### 1. Booking Controller

**File:** `controllers/bookingController.js`

```javascript
const Booking = require("../model/BookingModel");
const { notifyBookingConfirmation } = require("../lib/notificationHelper");

// Create new booking
const createBooking = async (req, res) => {
  try {
    const { motorcycleId, serviceId, bookingDate, notes } = req.body;

    // Validate inputs
    if (!motorcycleId || !serviceId || !bookingDate) {
      return res.status(400).json({
        success: false,
        message: "motorcycleId, serviceId, and bookingDate are required"
      });
    }

    // Create booking
    const booking = new Booking({
      userId: req.user.id,
      motorcycleId,
      serviceId,
      bookingDate,
      notes,
      status: 'confirmed'
    });

    await booking.save();

    // ✅ Send confirmation notification
    const notifResult = await notifyBookingConfirmation(req.user.id, {
      bookingId: booking._id
    });

    console.log('Confirmation notification result:', notifResult);

    res.status(201).json({
      success: true,
      message: "Booking created successfully",
      data: booking
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating booking",
      error: error.message
    });
  }
};

// Cancel booking
const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const booking = await Booking.findOneAndUpdate(
      { _id: id, userId },
      { status: 'cancelled', updatedAt: new Date() },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found"
      });
    }

    // ✅ Send cancellation notification
    const { sendNotificationToUser } = require("../lib/notificationHelper");
    await sendNotificationToUser(userId, {
      title: 'Booking Cancelled',
      body: `Your booking #${booking._id} has been cancelled`,
      image: 'https://your-app.com/cancel-icon.png'
    }, {
      type: 'booking',
      relatedId: booking._id,
      relatedModel: 'Booking'
    });

    res.json({
      success: true,
      data: booking
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Complete booking
const completeBooking = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findByIdAndUpdate(
      id,
      { status: 'completed', completedAt: new Date() },
      { new: true }
    );

    // ✅ Send completion notification
    const { sendNotificationToUser } = require("../lib/notificationHelper");
    await sendNotificationToUser(booking.userId, {
      title: 'Booking Completed',
      body: `Your booking #${booking._id} has been completed. Thank you!`,
      image: 'https://your-app.com/check-icon.png'
    }, {
      type: 'booking',
      relatedId: booking._id,
      relatedModel: 'Booking'
    });

    res.json({
      success: true,
      data: booking
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
  createBooking,
  cancelBooking,
  completeBooking
};
```

---

### 2. Payment Controller

**File:** `controllers/paymentController.js`

```javascript
const Payment = require("../model/PaymentModel");
const Booking = require("../model/BookingModel");
const { notifyPaymentStatus } = require("../lib/notificationHelper");

// Create payment
const initiatePayment = async (req, res) => {
  try {
    const { bookingId, amount, paymentMethod } = req.body;
    const userId = req.user.id;

    // Validate booking exists
    const booking = await Booking.findOne({ _id: bookingId, userId });
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found"
      });
    }

    // Create payment
    const payment = new Payment({
      userId,
      bookingId,
      amount,
      paymentMethod,
      status: 'pending',
      transactionId: `TXN-${Date.now()}`
    });

    await payment.save();

    // ✅ Send pending notification
    await notifyPaymentStatus(userId, {
      paymentId: payment._id,
      amount: amount
    }, 'pending');

    res.status(201).json({
      success: true,
      message: "Payment initiated",
      data: payment
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Webhook: Payment success (from payment gateway)
const handlePaymentWebhook = async (req, res) => {
  try {
    const { transactionId, status, amount } = req.body;

    // Find and update payment
    const payment = await Payment.findOneAndUpdate(
      { transactionId },
      {
        status: status,
        paidAt: status === 'success' ? new Date() : null,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found"
      });
    }

    // ✅ Send success/failure notification
    if (status === 'success') {
      await notifyPaymentStatus(
        payment.userId,
        { paymentId: payment._id, amount: amount },
        'success'
      );

      // Update booking status to paid
      await Booking.findByIdAndUpdate(
        payment.bookingId,
        { paymentStatus: 'paid' }
      );

    } else if (status === 'failed') {
      await notifyPaymentStatus(
        payment.userId,
        { paymentId: payment._id, amount: amount },
        'failed'
      );
    }

    res.json({
      success: true,
      message: "Webhook processed",
      data: payment
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Manual payment confirmation (admin can manually mark as paid)
const confirmPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;

    const payment = await Payment.findByIdAndUpdate(
      paymentId,
      {
        status: 'success',
        paidAt: new Date(),
        manuallyConfirmed: true,
        confirmedBy: req.user.id
      },
      { new: true }
    );

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found"
      });
    }

    // ✅ Send notification
    await notifyPaymentStatus(
      payment.userId,
      { paymentId: payment._id, amount: payment.amount },
      'success'
    );

    res.json({
      success: true,
      message: "Payment confirmed",
      data: payment
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
  initiatePayment,
  handlePaymentWebhook,
  confirmPayment
};
```

---

### 3. Service Controller

**File:** `controllers/serviceController.js`

```javascript
const Service = require("../model/ServiceModel");
const ServiceHistory = require("../model/ServiceHistoryModel");
const { sendNotificationToUser } = require("../lib/notificationHelper");

// Start service
const startService = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const service = await Service.findOneAndUpdate(
      { bookingId },
      { status: 'in-progress', startedAt: new Date() },
      { new: true }
    );

    // ✅ Notify customer that service started
    const booking = await Booking.findById(service.bookingId);
    if (booking) {
      await sendNotificationToUser(booking.userId, {
        title: 'Service Started',
        body: `Your motorcycle service has started. Please wait for updates.`,
        image: 'https://your-app.com/service-icon.png'
      }, {
        type: 'service',
        relatedId: service._id,
        relatedModel: 'Service'
      });
    }

    res.json({ success: true, data: service });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Complete service
const completeService = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { notes, totalCost } = req.body;

    const service = await Service.findOneAndUpdate(
      { bookingId },
      {
        status: 'completed',
        completedAt: new Date(),
        notes,
        totalCost
      },
      { new: true }
    );

    // Create service history record
    await ServiceHistory.create({
      bookingId,
      serviceId: service._id,
      notes,
      cost: totalCost
    });

    // ✅ Notify customer with service completion details
    const booking = await Booking.findById(service.bookingId);
    if (booking) {
      await sendNotificationToUser(booking.userId, {
        title: 'Service Completed',
        body: `Your service is complete! Total cost: Rp ${totalCost.toLocaleString('id-ID')}. Please collect your motorcycle.`,
        image: 'https://your-app.com/complete-icon.png'
      }, {
        type: 'service',
        relatedId: service._id,
        relatedModel: 'Service'
      });
    }

    res.json({ success: true, data: service });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  startService,
  completeService
};
```

---

### 4. Warranty Controller

**File:** `controllers/warrantyController.js`

```javascript
const Warranty = require("../model/WarrantyModel");
const { sendNotificationToUser } = require("../lib/notificationHelper");

// Claim warranty
const claimWarranty = async (req, res) => {
  try {
    const { serviceId, reason } = req.body;
    const userId = req.user.id;

    const warranty = new Warranty({
      userId,
      serviceId,
      reason,
      status: 'pending',
      claimedAt: new Date()
    });

    await warranty.save();

    // ✅ Send claim acknowledgment
    await sendNotificationToUser(userId, {
      title: 'Warranty Claim Received',
      body: 'Your warranty claim has been received. We will review and contact you within 24 hours.',
      image: 'https://your-app.com/warranty-icon.png'
    }, {
      type: 'warranty',
      relatedId: warranty._id,
      relatedModel: 'Warranty'
    });

    res.status(201).json({
      success: true,
      message: "Warranty claim submitted",
      data: warranty
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Approve warranty claim (admin)
const approveWarrantyClaim = async (req, res) => {
  try {
    const { warrantyId } = req.params;
    const { approvalNotes } = req.body;

    const warranty = await Warranty.findByIdAndUpdate(
      warrantyId,
      {
        status: 'approved',
        approvedAt: new Date(),
        approvalNotes
      },
      { new: true }
    );

    // ✅ Notify customer of approval
    await sendNotificationToUser(warranty.userId, {
      title: 'Warranty Claim Approved',
      body: 'Your warranty claim has been approved! We will contact you to arrange the warranty service.',
      image: 'https://your-app.com/check-icon.png'
    }, {
      type: 'warranty',
      relatedId: warranty._id,
      relatedModel: 'Warranty'
    });

    res.json({
      success: true,
      message: "Warranty claim approved",
      data: warranty
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Reject warranty claim (admin)
const rejectWarrantyClaim = async (req, res) => {
  try {
    const { warrantyId } = req.params;
    const { rejectionReason } = req.body;

    const warranty = await Warranty.findByIdAndUpdate(
      warrantyId,
      {
        status: 'rejected',
        rejectedAt: new Date(),
        rejectionReason
      },
      { new: true }
    );

    // ✅ Notify customer of rejection
    await sendNotificationToUser(warranty.userId, {
      title: 'Warranty Claim Decision',
      body: `Your warranty claim could not be approved. Reason: ${rejectionReason}`,
      image: 'https://your-app.com/info-icon.png'
    }, {
      type: 'warranty',
      relatedId: warranty._id,
      relatedModel: 'Warranty'
    });

    res.json({
      success: true,
      message: "Warranty claim rejected",
      data: warranty
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
  claimWarranty,
  approveWarrantyClaim,
  rejectWarrantyClaim
};
```

---

### 5. Custom Notification Example

**Sending custom notification dari controller mana pun:**

```javascript
const { sendNotificationToUser } = require("../lib/notificationHelper");

// Di dalam controller function
await sendNotificationToUser(userId, {
  title: 'Custom Title',
  body: 'Custom message body',
  image: 'https://your-app.com/custom-icon.png'
}, {
  type: 'system',              // notification type
  relatedId: documentId,       // optional: related document ID
  relatedModel: 'ModelName'    // optional: related model name
});
```

---

## Best Practices

### ✅ DO:
1. **Always use async/await:**
   ```javascript
   const result = await notifyBookingConfirmation(userId, data);
   ```

2. **Include try-catch for notification failures:**
   ```javascript
   try {
     await notifyPaymentStatus(userId, data, 'success');
   } catch (error) {
     console.warn('Notification failed:', error.message);
     // Continue - main operation succeeded
   }
   ```

3. **Use appropriate notification types:**
   - `booking` - Booking-related
   - `payment` - Payment status
   - `service` - Service progress
   - `warranty` - Warranty claims
   - `promo` - Promotional offers
   - `system` - System alerts

4. **Include relevant context:**
   ```javascript
   await sendNotificationToUser(userId, {
     title: 'Booking Confirmed',
     body: `Booking #${booking._id} confirmed for ${booking.bookingDate}`
   }, {
     type: 'booking',
     relatedId: booking._id,
     relatedModel: 'Booking'
   });
   ```

### ❌ DON'T:
1. **Don't make notification blocking:**
   ```javascript
   // ❌ WRONG - Waits for notification
   const result = await sendNotificationToUser(...);
   // Continue processing
   
   // ✅ RIGHT - Fire and forget
   sendNotificationToUser(...).catch(err => console.warn(err));
   // Continue processing
   ```

2. **Don't send sensitive data:**
   ```javascript
   // ❌ WRONG
   body: `Payment details: ${bankAccount}...`
   
   // ✅ RIGHT
   body: `Payment of Rp ${amount} processed successfully`
   ```

3. **Don't spam users:**
   ```javascript
   // ❌ WRONG - Sends 10 notifications for same event
   for (let i = 0; i < 10; i++) {
     await sendNotificationToUser(userId, ...);
   }
   
   // ✅ RIGHT - Send once
   await sendNotificationToUser(userId, ...);
   ```

---

## Testing Notifications

### 1. Test with Postman

```json
POST /api/notifications/send/user
{
  "userId": "USER_ID",
  "title": "Test Notification",
  "body": "This is a test from controller integration",
  "type": "system"
}
```

### 2. Test in Controller

```javascript
// Add to test route temporarily
app.get("/test-notification", async (req, res) => {
  try {
    const { sendNotificationToUser } = require("../lib/notificationHelper");
    
    const result = await sendNotificationToUser("USER_ID", {
      title: 'Test',
      body: 'Controller integration test'
    }, { type: 'system' });
    
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### 3. Check Database

```javascript
// Query notifications in MongoDB
db.notifications.find({ userId: "USER_ID" }).sort({ _id: -1 }).limit(10)
```

---

## Troubleshooting

### Notification Not Sending?

1. **Check device is registered:**
   ```javascript
   db.notificationdevices.find({ userId: "USER_ID" })
   ```

2. **Check Firebase credentials:**
   ```bash
   echo $FIREBASE_SERVICE_ACCOUNT_JSON | head -c 50
   ```

3. **Check server logs:**
   ```bash
   npm run dev
   # Look for "Notification sent successfully" or errors
   ```

4. **Test directly:**
   ```bash
   curl -X POST http://localhost:5000/api/notifications/send/user \
     -H "Authorization: Bearer TOKEN" \
     -d '{"userId":"...", "title":"Test", "body":"Test"}'
   ```

---

## Migration Checklist

Use this to systematically add notifications to existing controllers:

- [ ] bookingController.js - createBooking, cancelBooking, completeBooking
- [ ] paymentController.js - initiatePayment, handleWebhook, confirmPayment
- [ ] serviceController.js - startService, completeService
- [ ] serviceHistoryController.js - recordHistory
- [ ] warrantyController.js - claimWarranty, approveWarranty, rejectWarranty
- [ ] userController.js - userRegistration, passwordReset
- [ ] employeeController.js - employeeStatusChange (optional)

---

**Created:** 2026-04-07
**Last Updated:** 2026-04-07
**Status:** Ready for Integration
