const Warranty = require("../model/WarrantyModel");
const ServiceHistory = require("../model/ServiceHistoryModel");

// Create - Buat klaim garansi
const createWarrantyClaim = async (req, res) => {
  try {
    const { serviceHistoryId, motorcycleId, complaint, notes } = req.body;

    // Validasi service history
    const serviceHistory = await ServiceHistory.findById(serviceHistoryId);
    if (!serviceHistory) {
      return res.status(404).json({ 
        success: false,
        message: "Riwayat servis tidak ditemukan" 
      });
    }

    // Cek apakah garansi masih berlaku
    if (serviceHistory.warrantyExpiry && new Date() > new Date(serviceHistory.warrantyExpiry)) {
      return res.status(400).json({ 
        success: false,
        message: "Garansi sudah kadaluarsa" 
      });
    }

    const warranty = new Warranty({
      serviceHistoryId,
      userId: req.user._id,
      motorcycleId,
      complaint,
      notes
    });

    await warranty.save();

    const populatedWarranty = await Warranty.findById(warranty._id)
      .populate('userId', 'name email phone')
      .populate('motorcycleId')
      .populate('serviceHistoryId');

    res.status(201).json({
      success: true,
      message: "Klaim garansi berhasil dibuat",
      data: populatedWarranty
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error membuat klaim garansi", 
      error: error.message 
    });
  }
};

// Read - Get all warranty claims (untuk admin)
const getAllWarrantyClaims = async (req, res) => {
  try {
    const { status } = req.query;
    
    let query = {};
    if (status) {
      query.status = status;
    }

    const warranties = await Warranty.find(query)
      .populate('userId', 'name email phone')
      .populate('motorcycleId')
      .populate('serviceHistoryId')
      .populate('verifiedBy', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: warranties
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error mengambil data klaim garansi", 
      error: error.message 
    });
  }
};

// Read - Get warranty claims by user
const getUserWarrantyClaims = async (req, res) => {
  try {
    const warranties = await Warranty.find({ userId: req.user._id })
      .populate('motorcycleId')
      .populate('serviceHistoryId')
      .populate('verifiedBy', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: warranties
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error mengambil data klaim garansi", 
      error: error.message 
    });
  }
};

// Read - Get single warranty claim or by bookingId
const getWarrantyClaimById = async (req, res) => {
  try {
    const id = req.params.id;
    let warranty;
    
    // Check if the id is a valid ObjectId, otherwise it might be a query attempt
    // Currently, finding by ID directly. If we want finding by bookingId, 
    // it's best to handle it by checking if it matches the Warranty _id
    // OR we can make a separate function, but since you asked to make the ID one accept bookingId,
    // let's check ServiceHistory with that bookingId first
    
    warranty = await Warranty.findById(id)
      .populate('userId', 'name email phone')
      .populate('motorcycleId')
      .populate('serviceHistoryId')
      .populate({
        path: 'serviceHistoryId',
        populate: { path: 'bookingId' }
      })
      .populate('verifiedBy', 'name');

    // Jika tidak ketemu berdasarkan Warranty ID, coba cari berdasar bookingId via ServiceHistory
    if (!warranty) {
      // 1. Cari ServiceHistory yang punya bookingId tersebut
      const serviceHistory = await ServiceHistory.findOne({ bookingId: id });
      
      // 2. Jika ketemu, cari Warranty yang mengacu ke serviceHistoryId itu
      if (serviceHistory) {
        warranty = await Warranty.findOne({ serviceHistoryId: serviceHistory._id })
          .populate('userId', 'name email phone')
          .populate('motorcycleId')
          .populate('serviceHistoryId')
          .populate({
            path: 'serviceHistoryId',
            populate: { path: 'bookingId' }
          })
          .populate('verifiedBy', 'name');
      }
    }

    if (!warranty) {
      return res.status(404).json({ 
        success: false,
        message: "Klaim garansi tidak ditemukan" 
      });
    }

    res.status(200).json({
      success: true,
      data: warranty
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error mengambil data klaim garansi", 
      error: error.message 
    });
  }
};

// Update - Verifikasi klaim garansi (untuk admin)
const verifyWarrantyClaim = async (req, res) => {
  try {
    const { status, rejectionReason, notes } = req.body;

    if (!['Diterima', 'Ditolak'].includes(status)) {
      return res.status(400).json({ 
        success: false,
        message: "Status tidak valid. Harus 'Diterima' atau 'Ditolak'" 
      });
    }

    const warranty = await Warranty.findById(req.params.id);

    if (!warranty) {
      return res.status(404).json({ 
        success: false,
        message: "Klaim garansi tidak ditemukan" 
      });
    }

    if (warranty.status !== 'Menunggu Verifikasi') {
      return res.status(400).json({ 
        success: false,
        message: "Klaim garansi sudah diverifikasi" 
      });
    }

    warranty.status = status;
    warranty.verifiedBy = req.user._id;
    warranty.verifiedAt = Date.now();
    if (status === 'Ditolak' && rejectionReason) {
      warranty.rejectionReason = rejectionReason;
    }
    if (notes) warranty.notes = notes;

    await warranty.save();

    const updatedWarranty = await Warranty.findById(warranty._id)
      .populate('userId', 'name email phone')
      .populate('motorcycleId')
      .populate('serviceHistoryId')
      .populate('verifiedBy', 'name');

    res.status(200).json({
      success: true,
      message: `Klaim garansi berhasil ${status === 'Diterima' ? 'diterima' : 'ditolak'}`,
      data: updatedWarranty
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error verifikasi klaim garansi", 
      error: error.message 
    });
  }
};

// Delete - Delete warranty claim
const deleteWarrantyClaim = async (req, res) => {
  try {
    const warranty = await Warranty.findByIdAndDelete(req.params.id);

    if (!warranty) {
      return res.status(404).json({ 
        success: false,
        message: "Klaim garansi tidak ditemukan" 
      });
    }

    res.status(200).json({
      success: true,
      message: "Klaim garansi berhasil dihapus"
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error menghapus klaim garansi", 
      error: error.message 
    });
  }
};

module.exports = {
  createWarrantyClaim,
  getAllWarrantyClaims,
  getUserWarrantyClaims,
  getWarrantyClaimById,
  verifyWarrantyClaim,
  deleteWarrantyClaim
};
