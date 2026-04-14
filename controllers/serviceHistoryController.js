const ServiceHistory = require("../model/ServiceHistoryModel");
const Booking = require("../model/BookingModel");
const { createClient } = require('@supabase/supabase-js');
const multer = require('multer');

// Setup Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY; // Bisa anon key atau service role key
let supabase = null;

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
} else {
  console.warn("⚠️ SUPABASE_URL atau SUPABASE_KEY tidak ditemukan di .env");
}

// Setup Multer (Memory Storage untuk Vercel / Serverless)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit 5MB per file
});

// Upload Photos
const uploadWorkPhotos = async (req, res) => {
  try {
    const { id } = req.params;
    const files = req.files; 
    let descriptions = req.body.description || [];

    if (!supabase) {
      return res.status(500).json({ success: false, message: "Server storage belum dikonfigurasi" });
    }

    if (typeof descriptions === 'string') {
      descriptions = [descriptions];
    }

    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, message: "Tidak ada foto yang diunggah" });
    }

    const history = await ServiceHistory.findById(id);
    if (!history) {
      return res.status(404).json({ success: false, message: "Riwayat servis tidak ditemukan" });
    }

    if (!history.workPhotos) history.workPhotos = [];

    // Proses upload
    const uploadPromises = files.map(async (file, index) => {
      const fileExt = file.originalname.split('.').pop();
      const fileName = `servicehistory-${Date.now()}-${Math.floor(Math.random() * 1000)}.${fileExt}`;
      const filePath = `photos/${fileName}`;

      const { data, error } = await supabase.storage
        .from('service-history')
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error("Supabase Error:", error);
        throw new Error(error.message);
      }

      const { data: urlData } = supabase.storage
        .from('service-history')
        .getPublicUrl(filePath);

      return {
        filename: fileName,
        path: urlData.publicUrl,
        uploadedAt: new Date(),
        description: descriptions[index] || ""
      };
    });

    const newPhotos = await Promise.all(uploadPromises);

    history.workPhotos.push(...newPhotos);
    await history.save();

    res.status(200).json({
      success: true,
      message: `${newPhotos.length} foto berhasil diunggah ke Supabase`,
      data: history
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error mengunggah foto", error: error.message });
  }
};

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

// Read - Get service history by booking ID
const getServiceHistoryByBookingId = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const history = await ServiceHistory.findOne({ bookingId })
      .populate('userId', 'name email phone')
      .populate('motorcycleId')
      .populate('serviceIds')
      .populate('bookingId');

    if (!history) {
      return res.status(404).json({ 
        success: false,
        message: "Service history untuk booking ini tidak ditemukan" 
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

module.exports = {
  createServiceHistory,
  getAllServiceHistories,
  getUserServiceHistories,
  getMotorcycleServiceHistories,
  getServiceHistoryById,
  getServiceHistoryByBookingId,
  updateServiceHistory,
  deleteServiceHistory,
  upload,
  uploadWorkPhotos
};
