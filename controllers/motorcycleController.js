const Motorcycle = require("../model/MotorcycleModel");

// Create - Daftar motor baru
const createMotorcycle = async (req, res) => {
  try {
    const { brand, model, year, licensePlate, color, userId } = req.body;

    // Tentukan userId: jika admin mengirim userId, gunakan itu. Jika tidak, gunakan userId dari token
    let targetUserId = req.user._id;
    
    // Jika userId dikirim dalam request body
    if (userId) {
      // Cek apakah user yang login adalah admin atau pemilik
      if (req.user.role !== 'admin' && req.user.role !== 'pemilik') {
        return res.status(403).json({ 
          success: false,
          message: "Hanya admin/pemilik yang dapat mendaftarkan motor untuk user lain" 
        });
      }
      targetUserId = userId;
    }

    // Cek apakah plat nomor sudah terdaftar
    const existing = await Motorcycle.findOne({ licensePlate });
    if (existing) {
      return res.status(400).json({ 
        success: false,
        message: "Plat nomor sudah terdaftar" 
      });
    }

    const motorcycle = new Motorcycle({
      userId: targetUserId,
      brand,
      model,
      year,
      licensePlate,
      color
    });

    await motorcycle.save();

    // Populate user data untuk response yang lebih informatif
    await motorcycle.populate('userId', 'name email phone');

    res.status(201).json({
      success: true,
      message: "Motor berhasil didaftarkan",
      data: motorcycle
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error menambahkan motor", 
      error: error.message 
    });
  }
};

// Read - Get all motorcycles (untuk admin)
const getAllMotorcycles = async (req, res) => {
  try {
    const motorcycles = await Motorcycle.find()
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: motorcycles
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error mengambil data motor", 
      error: error.message 
    });
  }
};

// Read - Get motorcycles by user (untuk pelanggan)
const getUserMotorcycles = async (req, res) => {
  try {
    const motorcycles = await Motorcycle.find({ userId: req.user._id })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: motorcycles
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error mengambil data motor", 
      error: error.message 
    });
  }
};

// Read - Get single motorcycle
const getMotorcycleById = async (req, res) => {
  try {
    const motorcycle = await Motorcycle.findById(req.params.id)
      .populate('userId', 'name email phone');

    if (!motorcycle) {
      return res.status(404).json({ 
        success: false,
        message: "Motor tidak ditemukan" 
      });
    }

    res.status(200).json({
      success: true,
      data: motorcycle
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error mengambil data motor", 
      error: error.message 
    });
  }
};

// Update - Update motorcycle data
const updateMotorcycle = async (req, res) => {
  try {
    const { brand, model, year, licensePlate, color } = req.body;

    const motorcycle = await Motorcycle.findById(req.params.id);
    
    if (!motorcycle) {
      return res.status(404).json({ 
        success: false,
        message: "Motor tidak ditemukan" 
      });
    }

    // Cek jika plat nomor diubah dan sudah ada yang pakai
    if (licensePlate && licensePlate !== motorcycle.licensePlate) {
      const existing = await Motorcycle.findOne({ licensePlate });
      if (existing) {
        return res.status(400).json({ 
          success: false,
          message: "Plat nomor sudah terdaftar" 
        });
      }
    }

    const updatedMotorcycle = await Motorcycle.findByIdAndUpdate(
      req.params.id,
      { 
        brand, 
        model, 
        year, 
        licensePlate, 
        color,
        updatedAt: Date.now() 
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Data motor berhasil diupdate",
      data: updatedMotorcycle
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error update motor", 
      error: error.message 
    });
  }
};

// Update - Update motorcycle status (untuk admin)
const updateMotorcycleStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const validStatuses = ['Menunggu', 'Sedang Dikerjakan', 'Selesai', 'Diambil'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false,
        message: "Status tidak valid" 
      });
    }

    const motorcycle = await Motorcycle.findByIdAndUpdate(
      req.params.id,
      { 
        status,
        updatedAt: Date.now() 
      },
      { new: true }
    ).populate('userId', 'name email phone');

    if (!motorcycle) {
      return res.status(404).json({ 
        success: false,
        message: "Motor tidak ditemukan" 
      });
    }

    res.status(200).json({
      success: true,
      message: "Status motor berhasil diupdate",
      data: motorcycle
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error update status motor", 
      error: error.message 
    });
  }
};

// Delete - Delete motorcycle
const deleteMotorcycle = async (req, res) => {
  try {
    const motorcycle = await Motorcycle.findByIdAndDelete(req.params.id);

    if (!motorcycle) {
      return res.status(404).json({ 
        success: false,
        message: "Motor tidak ditemukan" 
      });
    }

    res.status(200).json({
      success: true,
      message: "Motor berhasil dihapus"
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error menghapus motor", 
      error: error.message 
    });
  }
};

// Get motorcycle status statistics (untuk grafik)
const getMotorcycleStats = async (req, res) => {
  try {
    const stats = await Motorcycle.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    // Format response untuk grafik
    const formattedStats = {
      Menunggu: 0,
      "Sedang Dikerjakan": 0,
      Selesai: 0,
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

module.exports = {
  createMotorcycle,
  getAllMotorcycles,
  getUserMotorcycles,
  getMotorcycleById,
  updateMotorcycle,
  updateMotorcycleStatus,
  deleteMotorcycle,
  getMotorcycleStats
};
