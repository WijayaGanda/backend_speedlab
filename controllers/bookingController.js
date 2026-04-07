const Booking = require("../model/BookingModel");
const Motorcycle = require("../model/MotorcycleModel");
const Service = require("../model/ServiceModel");
const User = require("../model/UserModel");
const { sendNotificationToUser } = require("../lib/notificationHelper");

// Create - Buat booking baru
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

    // Kirim notifikasi ke semua admin
    try {
      const admins = await User.find({ 
        role: { $in: ['admin', 'pemilik'] },
        isActive: true 
      }).select('_id name');
      
      if (admins && admins.length > 0) {
        const formattedDate = new Date(bookingDate).toLocaleDateString('id-ID');
        const motorcycleName = `${motorcycle.brand} ${motorcycle.model}`;
        
        for (const admin of admins) {
          await sendNotificationToUser(admin._id, {
            title: '🔔 Booking Baru Masuk!',
            body: `${req.user.name} membuat booking untuk ${motorcycleName}. Tanggal: ${formattedDate} ${bookingTime}. Total: Rp ${totalPrice.toLocaleString('id-ID')}`
          }, { type: 'booking', relatedId: booking._id, relatedModel: 'Booking' });
        }
      }
    } catch (notifErr) {
      console.warn('Gagal mengirim notifikasi ke admin:', notifErr.message);
    }

    const populatedBooking = await Booking.findById(booking._id)
      .populate('userId', 'name email phone')
      .populate('motorcycleId')
      .populate('serviceIds');

    res.status(201).json({
      success: true,
      message: "Booking berhasil dibuat",
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

    // Kirim notifikasi ke user hanya untuk status "Sedang Dikerjakan" dan "Selesai"
    try {
      if (status === 'Sedang Dikerjakan') {
        await sendNotificationToUser(booking.userId._id, {
          title: '🔧 Booking Sedang Dikerjakan',
          body: `Booking untuk ${booking.motorcycleId.brand} ${booking.motorcycleId.model} sedang dikerjakan...`
        }, { type: 'booking', relatedId: booking._id, relatedModel: 'Booking' });
      } else if (status === 'Selesai') {
        const finalPrice = booking.finalCost || booking.totalPrice;
        await sendNotificationToUser(booking.userId._id, {
          title: '✅ Booking Selesai!',
          body: `Selesai! Total: Rp ${finalPrice.toLocaleString('id-ID')}. Ambil motor Anda.`
        }, { type: 'booking', relatedId: booking._id, relatedModel: 'Booking' });
      }
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
