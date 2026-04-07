/**
 * bookingController.js - Updated dengan Notification System
 * 
 * Fitur notifikasi yang ditambahkan:
 * 1. User booking → Notif ke admin
 * 2. Admin approve → Notif ke user
 * 3. Admin reject → Notif ke user
 * 4. Admin start service → Notif ke user
 * 5. Admin complete service → Notif ke user
 * 6. Admin send custom message → Notif ke user
 */

const Booking = require("../model/BookingModel");
const Motorcycle = require("../model/MotorcycleModel");
const Service = require("../model/ServiceModel");
const User = require("../model/UserModel");

// ===== TAMBAHAN IMPORTS UNTUK NOTIFICATION =====
const { sendNotificationToUser } = require("../lib/notificationHelper");
// ================================================

/**
 * CREATE - Buat booking baru (USER ACTION)
 * 
 * Yang terjadi:
 * 1. User membuat booking
 * 2. Notif dikirim ke user: "Booking Dibuat"
 * 3. Notif dikirim ke SEMUA admin: "Booking Baru dari [nama user]"
 */
const createBooking = async (req, res) => {
  try {
    const { motorcycleId, serviceIds, bookingDate, bookingTime, complaint, notes } = req.body;

    // Validasi motor milik user
    const motorcycle = await Motorcycle.findOne({ 
      _id: motorcycleId, 
      userId: req.user._id 
    });

    if (!motorcycle) {
      return res.status(404).json({ 
        success: false,
        message: "Motor tidak ditemukan atau bukan milik Anda" 
      });
    }

    // Validasi motor tidak sedang dalam status booking yang aktif
    const activeBooking = await Booking.findOne({
      motorcycleId,
      status: { $nin: ['Selesai', 'Dibatalkan', 'Diambil'] }
    });

    if (activeBooking) {
      return res.status(400).json({
        success: false,
        message: "Motor ini sedang dalam proses booking. Tunggu hingga status booking berubah menjadi Selesai atau Dibatalkan sebelum membuat booking baru"
      });
    }

    // Hitung total harga
    let totalPrice = 0;
    if (serviceIds && serviceIds.length > 0) {
      const services = await Service.find({ _id: { $in: serviceIds } });
      totalPrice = services.reduce((sum, service) => sum + service.price, 0);
    }

    // Buat booking
    const booking = new Booking({
      userId: req.user._id,
      motorcycleId,
      serviceIds,
      bookingDate,
      bookingTime,
      complaint,
      totalPrice,
      notes
    });

    await booking.save();

    const populatedBooking = await Booking.findById(booking._id)
      .populate('userId', 'name email phone')
      .populate('motorcycleId')
      .populate('serviceIds');

    // ============================================================================
    // 🔔 NOTIFICATION #1: Send to USER - Booking Confirmation
    // ============================================================================
    try {
      const formattedDate = new Date(bookingDate).toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      await sendNotificationToUser(req.user._id, {
        title: '📅 Booking Dibuat',
        body: `Booking Anda untuk ${motorcycle.brand} ${motorcycle.model} pada ${formattedDate} jam ${bookingTime} telah dibuat. Tunggu persetujuan dari admin.`,
        image: 'https://your-app.com/booking-created-icon.png'
      }, {
        type: 'booking',
        relatedId: booking._id,
        relatedModel: 'Booking'
      });

      console.log(`✅ Notif user: Booking dibuat untuk user ${req.user._id}`);
    } catch (notifError) {
      console.warn('⚠️ Gagal notif ke user:', notifError.message);
      // Jangan hentikan proses meski notif gagal
    }

    // ============================================================================
    // 🔔 NOTIFICATION #2: Send to ALL ADMINS - New Booking Alert
    // ============================================================================
    try {
      // Cari semua admin dan pemilik yang aktif
      const admins = await User.find({ 
        role: { $in: ['admin', 'pemilik'] },
        isActive: true 
      }).select('_id name');

      if (admins && admins.length > 0) {
        const formattedDate = new Date(bookingDate).toLocaleDateString('id-ID');

        // Send notif ke setiap admin
        for (const admin of admins) {
          try {
            const adminNotifTitle = '🔔 Booking Baru Masuk!';
            const adminNotifBody = `${req.user.name} membuat booking untuk ${motorcycle.brand} ${motorcycle.model}. Tanggal: ${formattedDate} ${bookingTime}. Total: Rp ${totalPrice.toLocaleString('id-ID')}`;

            await sendNotificationToUser(admin._id, {
              title: adminNotifTitle,
              body: adminNotifBody,
              image: 'https://your-app.com/new-booking-icon.png'
            }, {
              type: 'booking',
              relatedId: booking._id,
              relatedModel: 'Booking'
            });

            console.log(`✅ Notif admin: Booking baru notif ke ${admin.name}`);
          } catch (adminError) {
            console.warn(`⚠️ Gagal notif admin ${admin._id}:`, adminError.message);
          }
        }

        console.log(`✅ Notif admin: Dikirim ke ${admins.length} admin`);
      }
    } catch (adminNotifError) {
      console.warn('⚠️ Gagal mengirim notif ke admin:', adminNotifError.message);
    }

    res.status(201).json({
      success: true,
      message: "Booking berhasil dibuat. Admin akan mereviu dalam waktu singkat.",
      data: populatedBooking
    });

  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error membuat booking", 
      error: error.message 
    });
  }
};

/**
 * APPROVE BOOKING (ADMIN ACTION)
 * 
 * Yang terjadi:
 * 1. Admin klik approve
 * 2. Status booking berubah menjadi "Disetujui"
 * 3. Notif dikirim ke user: "Booking Disetujui"
 */
const approveBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { estimatedCompletionDate, technician, notes } = req.body;

    // Check authorization - hanya admin & pemilik
    if (!['admin', 'pemilik'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Anda tidak memiliki akses untuk approve booking"
      });
    }

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "bookingId is required"
      });
    }

    // Update booking
    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      {
        status: 'Disetujui',
        approvedBy: req.user._id,
        approvedAt: new Date(),
        estimatedCompletionDate,
        assignedTechnician: technician,
        adminNotes: notes
      },
      { new: true }
    ).populate('userId', 'name email phone _id')
     .populate('motorcycleId');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking tidak ditemukan"
      });
    }

    // ============================================================================
    // 🔔 NOTIFICATION: Send to USER - Booking Approved
    // ============================================================================
    try {
      const completionDate = new Date(estimatedCompletionDate).toLocaleDateString('id-ID');
      const technicianName = technician || 'Tim teknisi kami';
      
      await sendNotificationToUser(booking.userId._id, {
        title: '✅ Booking Disetujui!',
        body: `Booking ${booking.motorcycleId.brand} ${booking.motorcycleId.model} Anda telah disetujui. Estimasi selesai: ${completionDate}. Teknisi: ${technicianName}`,
        image: 'https://your-app.com/approved-icon.png'
      }, {
        type: 'booking',
        relatedId: booking._id,
        relatedModel: 'Booking'
      });

      console.log(`✅ Notif user approve: Booking ${bookingId} disetujui notif ke user`);
    } catch (notifError) {
      console.warn('⚠️ Gagal mengirim notif approve:', notifError.message);
    }

    res.json({
      success: true,
      message: "Booking berhasil disetujui dan user telah diberitahu",
      data: booking
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error approve booking",
      error: error.message
    });
  }
};

/**
 * REJECT BOOKING (ADMIN ACTION)
 * 
 * Yang terjadi:
 * 1. Admin klik reject dengan alasan
 * 2. Status booking berubah menjadi "Ditolak"
 * 3. Notif dikirim ke user: "Booking Ditolak" + alasan
 */
const rejectBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { rejectionReason } = req.body;

    // Check authorization
    if (!['admin', 'pemilik'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Anda tidak memiliki akses untuk reject booking"
      });
    }

    if (!bookingId || !rejectionReason) {
      return res.status(400).json({
        success: false,
        message: "bookingId dan rejectionReason harus diisi"
      });
    }

    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      {
        status: 'Ditolak',
        rejectedBy: req.user._id,
        rejectedAt: new Date(),
        rejectionReason
      },
      { new: true }
    ).populate('userId', 'name email phone _id');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking tidak ditemukan"
      });
    }

    // ============================================================================
    // 🔔 NOTIFICATION: Send to USER - Booking Rejected
    // ============================================================================
    try {
      await sendNotificationToUser(booking.userId._id, {
        title: '❌ Booking Ditolak',
        body: `Booking Anda sayangnya ditolak. Alasan: ${rejectionReason}. Silakan hubungi kami di WhatsApp atau datang langsung ke workshop untuk informasi lebih lanjut.`,
        image: 'https://your-app.com/rejected-icon.png'
      }, {
        type: 'booking',
        relatedId: booking._id,
        relatedModel: 'Booking'
      });

      console.log(`✅ Notif user reject: Booking ${bookingId} ditolak notif ke user`);
    } catch (notifError) {
      console.warn('⚠️ Gagal mengirim notif reject:', notifError.message);
    }

    res.json({
      success: true,
      message: "Booking berhasil ditolak dan user telah diberitahu",
      data: booking
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error reject booking",
      error: error.message
    });
  }
};

/**
 * START SERVICE (ADMIN ACTION)
 * 
 * Yang terjadi:
 * 1. Admin mulai mengerjakan service
 * 2. Status booking berubah menjadi "Diproses"
 * 3. Notif dikirim ke user: "Service Dimulai"
 */
const startService = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      {
        status: 'Diproses',
        serviceStartedAt: new Date()
      },
      { new: true }
    ).populate('userId', 'name email phone _id')
     .populate('motorcycleId');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking tidak ditemukan"
      });
    }

    // ============================================================================
    // 🔔 NOTIFICATION: Send to USER - Service Started
    // ============================================================================
    try {
      await sendNotificationToUser(booking.userId._id, {
        title: '🔧 Service Dimulai',
        body: `Layanan untuk ${booking.motorcycleId.brand} ${booking.motorcycleId.model} Anda telah dimulai. Kami akan memberikan update progress secara berkala.`,
        image: 'https://your-app.com/service-started-icon.png'
      }, {
        type: 'booking',
        relatedId: booking._id,
        relatedModel: 'Booking'
      });

      console.log(`✅ Notif service start: Notif ke user ${booking.userId._id}`);
    } catch (notifError) {
      console.warn('⚠️ Gagal mengirim notif service start:', notifError.message);
    }

    res.json({
      success: true,
      message: "Service dimulai dan user telah diberitahu",
      data: booking
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error start service",
      error: error.message
    });
  }
};

/**
 * COMPLETE SERVICE (ADMIN ACTION)
 * 
 * Yang terjadi:
 * 1. Admin selesai mengerjakan service
 * 2. Status booking berubah menjadi "Selesai"
 * 3. Notif dikirim ke user: "Service Selesai" + biaya final
 */
const completeService = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { completionNotes, finalCost } = req.body;

    const bookingBefore = await Booking.findById(bookingId);

    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      {
        status: 'Selesai',
        serviceCompletedAt: new Date(),
        completionNotes,
        finalCost: finalCost || bookingBefore.totalPrice
      },
      { new: true }
    ).populate('userId', 'name email phone _id')
     .populate('motorcycleId');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking tidak ditemukan"
      });
    }

    // ============================================================================
    // 🔔 NOTIFICATION: Send to USER - Service Completed
    // ============================================================================
    try {
      const cost = finalCost || bookingBefore.totalPrice;
      
      await sendNotificationToUser(booking.userId._id, {
        title: '✅ Service Selesai!',
        body: `Layanan untuk motor Anda telah selesai! Biaya akhir: Rp ${cost.toLocaleString('id-ID')}. Silakan ambil motor Anda di workshop kami. Terima kasih! 🙏`,
        image: 'https://your-app.com/completed-icon.png'
      }, {
        type: 'booking',
        relatedId: booking._id,
        relatedModel: 'Booking'
      });

      console.log(`✅ Notif service complete: Notif ke user ${booking.userId._id}`);
    } catch (notifError) {
      console.warn('⚠️ Gagal mengirim notif completion:', notifError.message);
    }

    res.json({
      success: true,
      message: "Service berhasil diselesaikan dan user telah diberitahu",
      data: booking
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error complete service",
      error: error.message
    });
  }
};

/**
 * SEND CUSTOM MESSAGE (ADMIN ACTION)
 * 
 * Yang terjadi:
 * 1. Admin mengirim pesan custom ke user (update progress, pertanyaan, dll)
 * 2. Notif dikirim ke user dengan pesan custom dari admin
 * 
 * Contoh penggunaan:
 * - "Proses pengecatan sedang dilakukan"
 * - "Kami membutuhkan konfirmasi untuk spare part tambahan"
 * - "Motor sudah siap diambil"
 */
const sendCustomMessage = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { title, message, messageType = 'update' } = req.body;

    // Check authorization
    if (!['admin', 'pemilik'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized - Hanya admin yang bisa mengirim pesan"
      });
    }

    if (!bookingId || !title || !message) {
      return res.status(400).json({
        success: false,
        message: "bookingId, title, dan message diperlukan"
      });
    }

    // Find booking
    const booking = await Booking.findById(bookingId).populate('userId', 'name _id');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking tidak ditemukan"
      });
    }

    // ============================================================================
    // 🔔 NOTIFICATION: Send CUSTOM MESSAGE to USER
    // ============================================================================
    try {
      let emoji = '📢'; // default
      if (messageType === 'update') emoji = '🔄';
      if (messageType === 'warning') emoji = '⚠️';
      if (messageType === 'question') emoji = '❓';
      if (messageType === 'complete') emoji = '✅';

      await sendNotificationToUser(booking.userId._id, {
        title: `${emoji} ${title}`,
        body: message,
        image: 'https://your-app.com/message-icon.png'
      }, {
        type: 'booking',
        relatedId: booking._id,
        relatedModel: 'Booking'
      });

      console.log(`✅ Custom message sent to user ${booking.userId._id}`);
    } catch (notifError) {
      console.warn('⚠️ Gagal mengirim custom message:', notifError.message);
    }

    res.json({
      success: true,
      message: "Pesan berhasil dikirim ke customer",
      data: {
        bookingId,
        title,
        message,
        sentAt: new Date()
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error sending custom message",
      error: error.message
    });
  }
};

// ======================== EXPORTS ========================
module.exports = {
  createBooking,
  approveBooking,
  rejectBooking,
  startService,
  completeService,
  sendCustomMessage
};
// =========================================================
