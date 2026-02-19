const ServiceHistory = require("../model/ServiceHistoryModel");
const Booking = require("../model/BookingModel");

// Create - Tambah riwayat servis
const createServiceHistory = async (req, res) => {
  try {
    const { 
      bookingId, 
      diagnosis, 
      workDone, 
      spareParts, 
      mechanicName, 
      startDate, 
      endDate, 
      totalPrice, 
      warrantyExpiry, 
      notes 
    } = req.body;

    // Validasi booking
    const booking = await Booking.findById(bookingId)
      .populate('motorcycleId')
      .populate('serviceIds');

    if (!booking) {
      return res.status(404).json({ 
        success: false,
        message: "Booking tidak ditemukan" 
      });
    }

    const serviceHistory = new ServiceHistory({
      bookingId,
      userId: booking.userId,
      motorcycleId: booking.motorcycleId._id,
      serviceIds: booking.serviceIds,
      complaint: booking.complaint,
      diagnosis,
      workDone,
      spareParts,
      mechanicName,
      startDate,
      endDate,
      totalPrice,
      warrantyExpiry,
      notes
    });

    await serviceHistory.save();

    const populatedHistory = await ServiceHistory.findById(serviceHistory._id)
      .populate('userId', 'name email phone')
      .populate('motorcycleId')
      .populate('serviceIds')
      .populate('bookingId');

    res.status(201).json({
      success: true,
      message: "Riwayat servis berhasil ditambahkan",
      data: populatedHistory
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error menambahkan riwayat servis", 
      error: error.message 
    });
  }
};

// Read - Get all service histories
const getAllServiceHistories = async (req, res) => {
  try {
    const histories = await ServiceHistory.find()
      .populate('userId', 'name email phone')
      .populate('motorcycleId')
      .populate('serviceIds')
      .populate('bookingId')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: histories
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error mengambil riwayat servis", 
      error: error.message 
    });
  }
};

// Read - Get service histories by user
const getUserServiceHistories = async (req, res) => {
  try {
    const histories = await ServiceHistory.find({ userId: req.user._id })
      .populate('motorcycleId')
      .populate('serviceIds')
      .populate('bookingId')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: histories
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error mengambil riwayat servis", 
      error: error.message 
    });
  }
};

// Read - Get service histories by motorcycle
const getMotorcycleServiceHistories = async (req, res) => {
  try {
    const { motorcycleId } = req.params;

    const histories = await ServiceHistory.find({ motorcycleId })
      .populate('userId', 'name email phone')
      .populate('motorcycleId')
      .populate('serviceIds')
      .populate('bookingId')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: histories
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error mengambil riwayat servis", 
      error: error.message 
    });
  }
};

// Read - Get single service history
const getServiceHistoryById = async (req, res) => {
  try {
    const history = await ServiceHistory.findById(req.params.id)
      .populate('userId', 'name email phone')
      .populate('motorcycleId')
      .populate('serviceIds')
      .populate('bookingId');

    if (!history) {
      return res.status(404).json({ 
        success: false,
        message: "Riwayat servis tidak ditemukan" 
      });
    }

    res.status(200).json({
      success: true,
      data: history
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error mengambil riwayat servis", 
      error: error.message 
    });
  }
};

// Update - Update service history
const updateServiceHistory = async (req, res) => {
  try {
    const { 
      diagnosis, 
      workDone, 
      spareParts, 
      mechanicName, 
      startDate, 
      endDate, 
      totalPrice, 
      warrantyExpiry, 
      notes 
    } = req.body;

    const history = await ServiceHistory.findByIdAndUpdate(
      req.params.id,
      { 
        diagnosis, 
        workDone, 
        spareParts, 
        mechanicName, 
        startDate, 
        endDate, 
        totalPrice, 
        warrantyExpiry, 
        notes 
      },
      { new: true }
    )
      .populate('userId', 'name email phone')
      .populate('motorcycleId')
      .populate('serviceIds')
      .populate('bookingId');

    if (!history) {
      return res.status(404).json({ 
        success: false,
        message: "Riwayat servis tidak ditemukan" 
      });
    }

    res.status(200).json({
      success: true,
      message: "Riwayat servis berhasil diupdate",
      data: history
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error update riwayat servis", 
      error: error.message 
    });
  }
};

// Delete - Delete service history
const deleteServiceHistory = async (req, res) => {
  try {
    const history = await ServiceHistory.findByIdAndDelete(req.params.id);

    if (!history) {
      return res.status(404).json({ 
        success: false,
        message: "Riwayat servis tidak ditemukan" 
      });
    }

    res.status(200).json({
      success: true,
      message: "Riwayat servis berhasil dihapus"
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error menghapus riwayat servis", 
      error: error.message 
    });
  }
};

module.exports = {
  createServiceHistory,
  getAllServiceHistories,
  getUserServiceHistories,
  getMotorcycleServiceHistories,
  getServiceHistoryById,
  updateServiceHistory,
  deleteServiceHistory
};
