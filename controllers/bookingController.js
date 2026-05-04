const Booking = require("../model/BookingModel");
const Motorcycle = require("../model/MotorcycleModel");
const Service = require("../model/ServiceModel");
const User = require("../model/UserModel");
const { sendNotificationToUser } = require("../lib/notificationHelper");

// Create - Buat booking baru (support both old fixed price dan new flexible format)
const createBooking = async (req, res) => {
  try {
    const { motorcycleId, serviceIds, bookingServices, bookingDate, bookingTime, complaint, notes, userId } = req.body;

    console.log('📝 Creating booking with:', { motorcycleId, serviceIds, bookingServices, bookingDate, bookingTime });

    const hasServiceIds = Array.isArray(serviceIds) && serviceIds.length > 0;
    const hasBookingServices = Array.isArray(bookingServices) && bookingServices.length > 0;

    if (!hasServiceIds && !hasBookingServices) {
      return res.status(400).json({
        success: false,
        message: "Kirim serviceIds untuk format lama atau bookingServices untuk format flexible"
      });
    }

    // Tentukan userId: jika admin mengirim userId, gunakan itu. Jika tidak, gunakan userId dari token
    let targetUserId = req.user._id;
    
    // Jika userId dikirim dalam request body
    if (userId) {
      // Cek apakah user yang login adalah admin atau pemilik
      if (req.user.role !== 'admin' && req.user.role !== 'pemilik') {
        return res.status(403).json({ 
          success: false,
          message: "Hanya admin/pemilik yang dapat membuat booking untuk user lain" 
        });
      }
      targetUserId = userId;
    }

    // Validasi motor milik user yang akan membuat booking
    const motorcycle = await Motorcycle.findOne({ 
      _id: motorcycleId, 
      userId: targetUserId 
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

    // ========== AUTO-DETECT FORMAT ==========
    let isFlexibleFormat = hasBookingServices;
    let servicePrice = 0;
    let bookingDetailsData = [];

    if (isFlexibleFormat) {
      // NEW FORMAT - Flexible dengan variants dan addons
      console.log('✨ Using FLEXIBLE format with bookingServices');

      for (const item of bookingServices) {
        const { serviceId, selectedVariant, selectedAddons = [] } = item;

        const service = await Service.findById(serviceId);
        if (!service) {
          return res.status(400).json({
            success: false,
            message: `Layanan dengan ID ${serviceId} tidak ditemukan`
          });
        }

        // Calculate price: basePrice + variant modifier + addons total
        let itemPrice = service.basePrice || service.price || 0;

        // Add variant modifier jika ada
        if (selectedVariant) {
          const variant = service.variants.find(v => v.name === selectedVariant);
          if (variant) {
            itemPrice += variant.priceModifier;
            console.log(`  ✅ Added variant "${selectedVariant}": +${variant.priceModifier}`);
          }
        }

        // Add addons price
        let addonsTotal = 0;
        const addonDetails = [];
        for (const addon of selectedAddons) {
          const { addonId, quantity = 1 } = addon;
          const addonData = service.availableAddons.find(a => a.id.toString() === addonId);
          
          if (addonData) {
            const addonPrice = addonData.price * quantity;
            addonsTotal += addonPrice;
            addonDetails.push({
              id: addonData.id,
              name: addonData.name,
              price: addonData.price,
              quantity,
              subtotal: addonPrice
            });
            console.log(`  ✅ Added addon "${addonData.name}": Rp${addonPrice}`);
          }
        }
        itemPrice += addonsTotal;

        // Store booking detail
        bookingDetailsData.push({
          serviceId,
          serviceName: service.name,
          basePrice: service.basePrice || service.price || 0,
          selectedVariant: selectedVariant || null,
          selectedAddons: addonDetails,
          addonsTotal,
          subtotal: itemPrice
        });

        servicePrice += itemPrice;
        console.log(`  💰 Service item total: Rp${itemPrice}`);
      }

    } else {
      // OLD FORMAT - Fixed price, menggunakan serviceIds
      console.log('📌 Using OLD format with serviceIds');

      if (hasServiceIds) {
        const services = await Service.find({ _id: { $in: serviceIds } });
        console.log('🔍 Found services:', services.map(s => ({ id: s._id, price: s.price || s.basePrice })));
        
        servicePrice = services.reduce((sum, service) => {
          const price = service.price || service.basePrice || 0;
          return sum + price;
        }, 0);
        
        console.log('💰 Calculated servicePrice from serviceIds:', servicePrice);
      } else {
        console.warn('⚠️ No serviceIds provided in old format');
      }
    }

    // ========== CREATE BOOKING OBJECT ==========
    const bookingObject = {
      userId: targetUserId,
      motorcycleId,
      bookingDate,
      bookingTime,
      complaint,
      servicePrice,
      sparepartsPrice: 0, // Akan diupdate saat service history dibuat
      totalPrice: servicePrice,
      notes
    };

    // Tambahkan field sesuai format
    if (isFlexibleFormat) {
      bookingObject.bookingDetails = bookingDetailsData;
    } else {
      bookingObject.serviceIds = serviceIds || [];
    }

    const booking = new Booking(bookingObject);
    const savedBooking = await booking.save();

    console.log('✅ Booking saved:', { 
      id: savedBooking._id, 
      format: isFlexibleFormat ? 'FLEXIBLE' : 'FIXED',
      servicePrice: savedBooking.servicePrice,
      totalPrice: savedBooking.totalPrice 
    });

    // ========== SEND NOTIFICATION TO ADMINS ==========
    try {
      const admins = await User.find({
        role: { $in: ['admin', 'pemilik'] },
        isActive: true
      }).select('_id');

      if (admins && admins.length > 0) {
        const formattedDate = new Date(bookingDate).toLocaleDateString('id-ID');
        const motorcycleName = `${motorcycle.brand} ${motorcycle.model}`;

        for (const admin of admins) {
          const notifResult = await sendNotificationToUser(
            admin._id,
            {
              title: 'Booking Baru Masuk',
              body: `${req.user.name} membuat booking ${motorcycleName} pada ${formattedDate} ${bookingTime}`
            },
            { type: 'booking', relatedId: savedBooking._id, relatedModel: 'Booking' }
          );

          console.log('🔔 Admin notification result:', {
            adminId: admin._id.toString(),
            successCount: notifResult.fcm.successCount || 0,
            failureCount: notifResult.fcm.failureCount || 0
          });
        }
      }
    } catch (notifErr) {
      console.warn('Gagal mengirim notifikasi ke admin:', notifErr.message);
    }

    // ========== POPULATE AND RETURN ==========
    const populatedBooking = await Booking.findById(savedBooking._id)
      .populate('userId', 'name email phone')
      .populate('motorcycleId')
      .populate('serviceIds');

    res.status(201).json({
      success: true,
      message: "Booking berhasil dibuat",
      data: populatedBooking
    });
  } catch (error) {
    console.error('❌ Error creating booking:', error);
    res.status(500).json({ 
      success: false,
      message: "Error membuat booking", 
      error: error.message 
    });
  }
};

// Read - Get all bookings (untuk admin, dengan filter FIFO dan tanggal)
const getAllBookings = async (req, res) => {
  try {
    const { date, status } = req.query;

    let query = {};
    
    // Filter by date (untuk tampilan admin berdasarkan hari ini)
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      
      query.bookingDate = {
        $gte: startDate,
        $lte: endDate
      };
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Sort by FIFO (createdAt ascending)
    const bookings = await Booking.find(query)
      .populate('userId', 'name email phone')
      .populate('motorcycleId')
      .populate('serviceIds')
      .populate('verifiedBy', 'name')
      .sort({ createdAt: 1 }); // FIFO

    res.status(200).json({
      success: true,
      data: bookings
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error mengambil data booking", 
      error: error.message 
    });
  }
};

// Read - Get bookings by user (untuk pelanggan)
const getUserBookings = async (req, res) => {
  try {
    const { motorcycleId } = req.query;
    
    // Build query
    const query = { userId: req.user._id };
    if (motorcycleId) {
      query.motorcycleId = motorcycleId;
    }
    
    const bookings = await Booking.find(query)
      .populate('motorcycleId')
      .populate('serviceIds')
      .populate('verifiedBy', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: bookings
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error mengambil data booking", 
      error: error.message 
    });
  }
};

// Read - Get single booking
const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('userId', 'name email phone')
      .populate('motorcycleId')
      .populate('serviceIds')
      .populate('verifiedBy', 'name');

    if (!booking) {
      return res.status(404).json({ 
        success: false,
        message: "Booking tidak ditemukan" 
      });
    }

    res.status(200).json({
      success: true,
      data: booking
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error mengambil data booking", 
      error: error.message 
    });
  }
};

// Update - Verifikasi booking (untuk admin)
const verifyBooking = async (req, res) => {
  try {
    const { notes } = req.body;

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ 
        success: false,
        message: "Booking tidak ditemukan" 
      });
    }

    if (booking.status !== 'Menunggu Verifikasi') {
      return res.status(400).json({ 
        success: false,
        message: "Booking sudah diverifikasi" 
      });
    }

    booking.status = 'Terverifikasi';
    booking.verifiedBy = req.user._id;
    booking.verifiedAt = Date.now();
    if (notes) booking.notes = notes;
    booking.updatedAt = Date.now();

    await booking.save();

    try {
      await sendNotificationToUser(
        booking.userId,
        {
          title: 'Booking Terverifikasi',
          body: `Booking Anda telah diverifikasi admin dan siap diproses.`
        },
        { type: 'booking', relatedId: booking._id, relatedModel: 'Booking' }
      );
    } catch (notifErr) {
      console.warn('Gagal mengirim notifikasi verifikasi booking:', notifErr.message);
    }

    const updatedBooking = await Booking.findById(booking._id)
      .populate('userId', 'name email phone')
      .populate('motorcycleId')
      .populate('serviceIds')
      .populate('verifiedBy', 'name');

    res.status(200).json({
      success: true,
      message: "Booking berhasil diverifikasi",
      data: updatedBooking
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error verifikasi booking", 
      error: error.message 
    });
  }
};

// Update - Update booking status
const updateBookingStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;

    const validStatuses = ['Menunggu Verifikasi', 'Terverifikasi', 'Sedang Dikerjakan', 'Selesai', 'Dibatalkan', 'Diambil'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false,
        message: "Status tidak valid" 
      });
    }

    const updateData = { 
      status,
      updatedAt: Date.now() 
    };

    if (notes) updateData.notes = notes;

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    )
      .populate('userId', 'name email phone')
      .populate('motorcycleId')
      .populate('serviceIds')
      .populate('verifiedBy', 'name');

    if (!booking) {
      return res.status(404).json({ 
        success: false,
        message: "Booking tidak ditemukan" 
      });
    }

    // Update status motor juga
    if (booking.motorcycleId) {
      let motorcycleStatus = 'Menunggu';
      if (status === 'Sedang Dikerjakan') motorcycleStatus = 'Sedang Dikerjakan';
      else if (status === 'Selesai') motorcycleStatus = 'Selesai';
      else if (status === 'Diambil') motorcycleStatus = 'Diambil';

      await Motorcycle.findByIdAndUpdate(booking.motorcycleId._id, { 
        status: motorcycleStatus,
        updatedAt: Date.now() 
      });
    }

    try {
      const motorcycleName = booking.motorcycleId
        ? `${booking.motorcycleId.brand} ${booking.motorcycleId.model}`
        : 'motor Anda';

      await sendNotificationToUser(
        booking.userId._id,
        {
          title: `Status Booking: ${status}`,
          body: `Booking ${motorcycleName} sekarang berstatus ${status}.`
        },
        { type: 'booking', relatedId: booking._id, relatedModel: 'Booking' }
      );
    } catch (notifErr) {
      console.warn('Gagal mengirim notifikasi ke user:', notifErr.message);
    }

    res.status(200).json({
      success: true,
      message: "Status booking berhasil diupdate",
      data: booking
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error update status booking", 
      error: error.message 
    });
  }
};

// Update - Update booking
const updateBooking = async (req, res) => {
  try {
    const { serviceIds, bookingDate, bookingTime, complaint, notes } = req.body;

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ 
        success: false,
        message: "Booking tidak ditemukan" 
      });
    }

    // Hitung ulang total harga jika serviceIds berubah
    let totalPrice = booking.totalPrice;
    if (serviceIds && serviceIds.length > 0) {
      const services = await Service.find({ _id: { $in: serviceIds } });
      totalPrice = services.reduce((sum, service) => sum + service.price, 0);
    }

    const updatedBooking = await Booking.findByIdAndUpdate(
      req.params.id,
      { 
        serviceIds,
        bookingDate,
        bookingTime,
        complaint,
        notes,
        totalPrice,
        updatedAt: Date.now() 
      },
      { new: true }
    )
      .populate('userId', 'name email phone')
      .populate('motorcycleId')
      .populate('serviceIds')
      .populate('verifiedBy', 'name');

    res.status(200).json({
      success: true,
      message: "Booking berhasil diupdate",
      data: updatedBooking
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error update booking", 
      error: error.message 
    });
  }
};

// Delete - Delete booking
const deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);

    if (!booking) {
      return res.status(404).json({ 
        success: false,
        message: "Booking tidak ditemukan" 
      });
    }

    res.status(200).json({
      success: true,
      message: "Booking berhasil dihapus"
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error menghapus booking", 
      error: error.message 
    });
  }
};

// Get booking statistics
const getBookingStats = async (req, res) => {
  try {
    const stats = await Booking.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    const formattedStats = {
      "Menunggu Verifikasi": 0,
      Terverifikasi: 0,
      "Sedang Dikerjakan": 0,
      Selesai: 0,
      Dibatalkan: 0,
      Diambil: 0
    };

    stats.forEach(stat => {
      formattedStats[stat._id] = stat.count;
    });

    res.status(200).json({
      success: true,
      data: formattedStats
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error mengambil statistik", 
      error: error.message 
    });
  }
};

// Cancel Booking (untuk customer)
const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('userId', 'name email phone')
      .populate('motorcycleId')
      .populate('serviceIds')
      .populate('verifiedBy', 'name');

    if (!booking) {
      return res.status(404).json({ 
        success: false,
        message: "Booking tidak ditemukan" 
      });
    }

    // Cek apakah booking milik customer yang login
    if (booking.userId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false,
        message: "Anda hanya bisa membatalkan booking milik Anda sendiri" 
      });
    }

    // Cek apakah status masih bisa dibatalkan
    const cancelableStatuses = ['Menunggu Verifikasi', 'Terverifikasi'];
    if (!cancelableStatuses.includes(booking.status)) {
      return res.status(400).json({ 
        success: false,
        message: `Booking dengan status '${booking.status}' tidak dapat dibatalkan` 
      });
    }

    // Update status menjadi Dibatalkan
    booking.status = 'Dibatalkan';
    booking.updatedAt = Date.now();
    await booking.save();

    res.status(200).json({
      success: true,
      message: "Booking berhasil dibatalkan",
      data: booking
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error membatalkan booking", 
      error: error.message 
    });
  }
};

// Read - Get bookings by date (untuk admin/pemilik)
const getBookingsByDate = async (req, res) => {
  try {
    const { date, status } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: "Parameter tanggal (date) diperlukan"
      });
    }

    // Parse date dan set time range untuk satu hari penuh
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    let query = {
      bookingDate: {
        $gte: startDate,
        $lte: endDate
      }
    };

    // Optional: filter by status
    if (status) {
      query.status = status;
    }

    const bookings = await Booking.find(query)
      .populate('userId', 'name email phone')
      .populate('motorcycleId')
      .populate('serviceIds')
      .populate('verifiedBy', 'name')
      .sort({ bookingTime: 1 }); // Sort by time

    res.status(200).json({
      success: true,
      date: date,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error mengambil data booking berdasarkan tanggal",
      error: error.message
    });
  }
};

// Read - Get user bookings by date (untuk pelanggan)
const getUserBookingsByDate = async (req, res) => {
  try {
    const { date, status } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: "Parameter tanggal (date) diperlukan"
      });
    }

    // Parse date dan set time range untuk satu hari penuh
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    let query = {
      userId: req.user._id,
      bookingDate: {
        $gte: startDate,
        $lte: endDate
      }
    };

    // Optional: filter by status
    if (status) {
      query.status = status;
    }

    const bookings = await Booking.find(query)
      .populate('motorcycleId')
      .populate('serviceIds')
      .populate('verifiedBy', 'name')
      .sort({ bookingTime: 1 }); // Sort by time

    res.status(200).json({
      success: true,
      date: date,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error mengambil data booking berdasarkan tanggal",
      error: error.message
    });
  }
};

module.exports = {
  createBooking,
  getAllBookings,
  getUserBookings,
  getBookingById,
  verifyBooking,
  updateBookingStatus,
  updateBooking,
  deleteBooking,
  getBookingStats,
  cancelBooking,
  getBookingsByDate,
  getUserBookingsByDate
};
