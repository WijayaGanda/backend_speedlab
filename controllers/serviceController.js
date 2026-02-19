const Service = require("../model/ServiceModel");

// Create - Tambah layanan baru
const createService = async (req, res) => {
  try {
    const { name, description, price, estimatedDuration } = req.body;

    const service = new Service({
      name,
      description,
      price,
      estimatedDuration
    });

    await service.save();

    res.status(201).json({
      success: true,
      message: "Layanan berhasil ditambahkan",
      data: service
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error menambahkan layanan", 
      error: error.message 
    });
  }
};

// Read - Get all services
const getAllServices = async (req, res) => {
  try {
    const { isActive } = req.query;
    
    let query = {};
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const services = await Service.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: services
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error mengambil data layanan", 
      error: error.message 
    });
  }
};

// Read - Get single service
const getServiceById = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({ 
        success: false,
        message: "Layanan tidak ditemukan" 
      });
    }

    res.status(200).json({
      success: true,
      data: service
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error mengambil data layanan", 
      error: error.message 
    });
  }
};

// Update - Update service
const updateService = async (req, res) => {
  try {
    const { name, description, price, estimatedDuration, isActive } = req.body;

    const service = await Service.findByIdAndUpdate(
      req.params.id,
      { 
        name, 
        description, 
        price, 
        estimatedDuration, 
        isActive,
        updatedAt: Date.now() 
      },
      { new: true }
    );

    if (!service) {
      return res.status(404).json({ 
        success: false,
        message: "Layanan tidak ditemukan" 
      });
    }

    res.status(200).json({
      success: true,
      message: "Layanan berhasil diupdate",
      data: service
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error update layanan", 
      error: error.message 
    });
  }
};

// Delete - Delete service
const deleteService = async (req, res) => {
  try {
    const service = await Service.findByIdAndDelete(req.params.id);

    if (!service) {
      return res.status(404).json({ 
        success: false,
        message: "Layanan tidak ditemukan" 
      });
    }

    res.status(200).json({
      success: true,
      message: "Layanan berhasil dihapus"
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error menghapus layanan", 
      error: error.message 
    });
  }
};

module.exports = {
  createService,
  getAllServices,
  getServiceById,
  updateService,
  deleteService
};
