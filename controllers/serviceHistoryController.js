const ServiceHistory = require("../model/ServiceHistoryModel");
const Booking = require("../model/BookingModel");
const { deleteLocalFile, deleteLocalFiles, deleteServiceHistoryFiles, isProduction } = require("../middleware/uploadMiddleware");
const path = require('path');

// Create - Tambah riwayat servis (bisa saat "Sedang Dikerjakan" atau "Selesai")
const createServiceHistory = async (req, res) => {
  try {
    const { 
      bookingId, 
      diagnosis, 
      workDone, 
      spareParts, 
      mechanicName, 
      startDate, 
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

    // Validasi booking status harus "Sedang Dikerjakan" atau "Selesai"
    if (!['Sedang Dikerjakan', 'Selesai'].includes(booking.status)) {
      return res.status(400).json({ 
        success: false,
        message: "Service history hanya bisa dibuat saat booking status 'Sedang Dikerjakan' atau 'Selesai'" 
      });
    }

    // Cek apakah sudah ada service history untuk booking ini
    const existingHistory = await ServiceHistory.findOne({ bookingId });
    if (existingHistory) {
      return res.status(400).json({ 
        success: false,
        message: "Service history untuk booking ini sudah ada, gunakan update untuk mengubahnya" 
      });
    }

    // Kalkulasi servicePrice dari booking serviceIds
    let servicePrice = booking.servicePrice || 0; // Ambil dari booking yang sudah tersimpan

    // Kalkulasi sparepartsPrice dari spareParts yang dikirim
    let sparepartsPrice = 0;
    if (spareParts && spareParts.length > 0) {
      sparepartsPrice = spareParts.reduce((sum, part) => sum + (part.price * part.quantity), 0);
    }

    // Total harga
    const totalPrice = servicePrice + sparepartsPrice;

    const serviceHistory = new ServiceHistory({
      bookingId,
      userId: booking.userId,
      motorcycleId: booking.motorcycleId._id,
      serviceIds: booking.serviceIds,
      complaint: booking.complaint,
      status: 'Dimulai',
      diagnosis,
      workDone,
      spareParts,
      mechanicName,
      startDate,
      servicePrice,
      sparepartsPrice,
      totalPrice,
      notes
    });

    await serviceHistory.save();

    // Update booking dengan informasi spare parts dan total harga terbaru
    await Booking.findByIdAndUpdate(bookingId, {
      sparepartsPrice,
      totalPrice,
      updatedAt: Date.now()
    });

    const populatedHistory = await ServiceHistory.findById(serviceHistory._id)
      .populate('userId', 'name email phone')
      .populate('motorcycleId')
      .populate('serviceIds')
      .populate('bookingId');

    res.status(201).json({
      success: true,
      message: "Riwayat servis berhasil dibuat",
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

// Update - Update service history (untuk progress update)
const updateServiceHistory = async (req, res) => {
  try {
    const { 
      status,
      diagnosis, 
      workDone, 
      spareParts, 
      mechanicName, 
      startDate, 
      endDate, 
      warrantyExpiry, 
      notes 
    } = req.body;

    const history = await ServiceHistory.findById(req.params.id).populate('bookingId');

    if (!history) {
      return res.status(404).json({ 
        success: false,
        message: "Riwayat servis tidak ditemukan" 
      });
    }

    // Update fields
    if (status) history.status = status;
    if (diagnosis !== undefined) history.diagnosis = diagnosis;
    if (workDone !== undefined) history.workDone = workDone;
    if (spareParts !== undefined) history.spareParts = spareParts;
    if (mechanicName !== undefined) history.mechanicName = mechanicName;
    if (startDate !== undefined) history.startDate = startDate;
    if (endDate !== undefined) history.endDate = endDate;
    if (warrantyExpiry !== undefined) history.warrantyExpiry = warrantyExpiry;
    if (notes !== undefined) history.notes = notes;
    
    // Recalculate prices jika spareParts berubah
    if (spareParts !== undefined) {
      // Kalkulasi sparepartsPrice
      let sparepartsPrice = 0;
      if (spareParts && spareParts.length > 0) {
        sparepartsPrice = spareParts.reduce((sum, part) => sum + (part.price * part.quantity), 0);
      }
      
      // Hitung total dengan servicePrice tetap
      const totalPrice = history.servicePrice + sparepartsPrice;
      
      history.sparepartsPrice = sparepartsPrice;
      history.totalPrice = totalPrice;

      // Update booking juga dengan harga baru
      if (history.bookingId) {
        await Booking.findByIdAndUpdate(history.bookingId._id, {
          sparepartsPrice,
          totalPrice,
          updatedAt: Date.now()
        });
      }
    }
    
    history.updatedAt = Date.now();

    await history.save();

    const updatedHistory = await ServiceHistory.findById(history._id)
      .populate('userId', 'name email phone')
      .populate('motorcycleId')
      .populate('serviceIds')
      .populate('bookingId');

    res.status(200).json({
      success: true,
      message: "Riwayat servis berhasil diupdate",
      data: updatedHistory
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

    // Hapus semua file yang terkait dengan service history ini
    deleteServiceHistoryFiles(history);

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

// Upload - Upload work progress photos (admin)
const uploadWorkPhotos = async (req, res) => {
  try {
    // Production warning: File upload tidak fully supported di serverless environment
    if (isProduction) {
      return res.status(503).json({ 
        success: false,
        message: "File upload feature sedang dalam maintenance. Untuk production, gunakan cloud storage (AWS S3, Azure Blob, dll)",
        note: "Hubungi developer untuk implementasi cloud storage"
      });
    }

    const { serviceHistoryId } = req.params;
    const { description } = req.body;

    const history = await ServiceHistory.findById(serviceHistoryId);

    if (!history) {
      // Jika ada files yang diunggah, hapus mereka
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => deleteLocalFile(file.filename));
      }
      return res.status(404).json({ 
        success: false,
        message: "Service history tidak ditemukan" 
      });
    }

    // Validasi ada files yang diunggah
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: "Tidak ada file yang diunggah" 
      });
    }

    // Process uploaded files
    const newPhotos = req.files.map((file, index) => ({
      filename: file.filename,
      path: `/uploads/service-history/${file.filename}`,
      uploadedAt: new Date(),
      description: Array.isArray(description) ? description[index] : description || `Photo ${index + 1}`
    }));

    // Add photos ke workPhotos array
    if (!history.workPhotos) {
      history.workPhotos = [];
    }
    
    history.workPhotos.push(...newPhotos);
    history.updatedAt = Date.now();

    await history.save();

    const updatedHistory = await ServiceHistory.findById(history._id)
      .populate('userId', 'name email phone')
      .populate('motorcycleId')
      .populate('serviceIds')
      .populate('bookingId');

    res.status(200).json({
      success: true,
      message: `${req.files.length} foto berhasil diunggah`,
      data: updatedHistory,
      uploadedPhotos: newPhotos
    });
  } catch (error) {
    // Jika terjadi error, hapus semua files yang diunggah
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => deleteLocalFile(file.filename));
    }
    res.status(500).json({ 
      success: false,
      message: "Error mengupload foto", 
      error: error.message 
    });
  }
};

// Delete - Delete single work photo
const deleteWorkPhoto = async (req, res) => {
  try {
    const { serviceHistoryId, photoIndex } = req.params;

    const history = await ServiceHistory.findById(serviceHistoryId);

    if (!history) {
      return res.status(404).json({ 
        success: false,
        message: "Service history tidak ditemukan" 
      });
    }

    if (!history.workPhotos || history.workPhotos.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: "Tidak ada foto di service history ini" 
      });
    }

    const index = parseInt(photoIndex);
    if (isNaN(index) || index < 0 || index >= history.workPhotos.length) {
      return res.status(400).json({ 
        success: false,
        message: "Index foto tidak valid" 
      });
    }

    // Hapus file
    const photo = history.workPhotos[index];
    deleteLocalFile(photo.filename);

    // Remove dari array
    history.workPhotos.splice(index, 1);
    history.updatedAt = Date.now();

    await history.save();

    const updatedHistory = await ServiceHistory.findById(history._id)
      .populate('userId', 'name email phone')
      .populate('motorcycleId')
      .populate('serviceIds')
      .populate('bookingId');

    res.status(200).json({
      success: true,
      message: "Foto berhasil dihapus",
      data: updatedHistory
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error menghapus foto", 
      error: error.message 
    });
  }
};

// Update - Update photo description
const updatePhotoDescription = async (req, res) => {
  try {
    const { serviceHistoryId, photoIndex } = req.params;
    const { description } = req.body;

    const history = await ServiceHistory.findById(serviceHistoryId);

    if (!history) {
      return res.status(404).json({ 
        success: false,
        message: "Service history tidak ditemukan" 
      });
    }

    if (!history.workPhotos || history.workPhotos.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: "Tidak ada foto di service history ini" 
      });
    }

    const index = parseInt(photoIndex);
    if (isNaN(index) || index < 0 || index >= history.workPhotos.length) {
      return res.status(400).json({ 
        success: false,
        message: "Index foto tidak valid" 
      });
    }

    if (description !== undefined) {
      history.workPhotos[index].description = description;
      history.updatedAt = Date.now();
      await history.save();
    }

    const updatedHistory = await ServiceHistory.findById(history._id)
      .populate('userId', 'name email phone')
      .populate('motorcycleId')
      .populate('serviceIds')
      .populate('bookingId');

    res.status(200).json({
      success: true,
      message: "Deskripsi foto berhasil diupdate",
      data: updatedHistory
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error update deskripsi foto", 
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
  getServiceHistoryByBookingId,
  updateServiceHistory,
  deleteServiceHistory,
  uploadWorkPhotos,
  deleteWorkPhoto,
  updatePhotoDescription
};