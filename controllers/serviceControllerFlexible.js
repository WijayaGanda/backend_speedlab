const Service = require("../model/ServiceModel");
const mongoose = require("mongoose");

/**
 * CREATE SERVICE dengan Kategori, Varian, dan Add-ons
 * 
 * Request Body:
 * {
 *   "name": "Remap ECU Honda CBR",
 *   "description": "Remap ECU untuk Honda CBR series",
 *   "category": "REMAP",
 *   "basePrice": 1650000,
 *   "variants": [
 *     { "name": "CBR Non-SP", "priceModifier": 0, "description": "" },
 *     { "name": "CBR SP", "priceModifier": 550000, "description": "Tambahan untuk variant SP" }
 *   ],
 *   "availableAddons": [
 *     {
 *       "name": "Dyno",
 *       "price": 250000,
 *       "type": "OPTIONAL",
 *       "description": "Include dyno hingga selesai"
 *     }
 *   ],
 *   "estimatedDuration": 120,
 *   "isWaitable": true
 * }
 */
const createServiceWithVariants = async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      basePrice,
      variants = [],
      availableAddons = [],
      estimatedDuration = 60,
      isWaitable = true
    } = req.body;

    if (!name || !category || basePrice === undefined) {
      return res.status(400).json({
        success: false,
        message: "name, category, dan basePrice harus diisi"
      });
    }

    const service = new Service({
      name,
      description,
      category,
      basePrice,
      variants,
      availableAddons,
      estimatedDuration,
      isWaitable
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

/**
 * GET ALL SERVICES (dengan varian & add-ons)
 */
const getAllServicesWithDetails = async (req, res) => {
  try {
    const { isActive, category } = req.query;

    let query = {};
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    if (category) {
      query.category = category;
    }

    const services = await Service.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: services.length,
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

/**
 * GET SERVICE BY ID (detail lengkap dengan varian & add-ons)
 */
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

/**
 * UPDATE SERVICE (termasuk varian & add-ons)
 */
const updateService = async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      basePrice,
      variants,
      availableAddons,
      estimatedDuration,
      isActive,
      isWaitable
    } = req.body;

    const updateData = {
      updatedAt: Date.now()
    };

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (basePrice !== undefined) updateData.basePrice = basePrice;
    if (variants !== undefined) updateData.variants = variants;
    if (availableAddons !== undefined) updateData.availableAddons = availableAddons;
    if (estimatedDuration !== undefined) updateData.estimatedDuration = estimatedDuration;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (isWaitable !== undefined) updateData.isWaitable = isWaitable;

    const service = await Service.findByIdAndUpdate(
      req.params.id,
      updateData,
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

/**
 * DELETE SERVICE
 */
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

/**
 * ADD VARIANT ke Service
 * Request: { "name": "CBR SP", "priceModifier": 550000, "description": "..." }
 */
const addVariantToService = async (req, res) => {
  try {
    const { name, priceModifier = 0, description = "" } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Nama variant harus diisi"
      });
    }

    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Layanan tidak ditemukan"
      });
    }

    // Cek apakah variant sudah ada
    if (service.variants.some(v => v.name === name)) {
      return res.status(400).json({
        success: false,
        message: "Variant dengan nama ini sudah ada"
      });
    }

    service.variants.push({
      name,
      priceModifier,
      description
    });

    await service.save();

    res.status(200).json({
      success: true,
      message: "Variant berhasil ditambahkan",
      data: service
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error menambah variant",
      error: error.message
    });
  }
};

/**
 * UPDATE VARIANT di Service
 */
const updateVariantInService = async (req, res) => {
  try {
    const { serviceId, variantName } = req.params;
    const { newName, priceModifier, description } = req.body;

    const service = await Service.findById(serviceId);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Layanan tidak ditemukan"
      });
    }

    const variant = service.variants.find(v => v.name === variantName);

    if (!variant) {
      return res.status(404).json({
        success: false,
        message: "Variant tidak ditemukan"
      });
    }

    if (newName !== undefined) variant.name = newName;
    if (priceModifier !== undefined) variant.priceModifier = priceModifier;
    if (description !== undefined) variant.description = description;

    await service.save();

    res.status(200).json({
      success: true,
      message: "Variant berhasil diupdate",
      data: service
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error update variant",
      error: error.message
    });
  }
};

/**
 * DELETE VARIANT dari Service
 */
const deleteVariantFromService = async (req, res) => {
  try {
    const { serviceId, variantName } = req.params;

    const service = await Service.findById(serviceId);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Layanan tidak ditemukan"
      });
    }

    const variantIndex = service.variants.findIndex(v => v.name === variantName);

    if (variantIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Variant tidak ditemukan"
      });
    }

    service.variants.splice(variantIndex, 1);
    await service.save();

    res.status(200).json({
      success: true,
      message: "Variant berhasil dihapus",
      data: service
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error menghapus variant",
      error: error.message
    });
  }
};

/**
 * ADD ADD-ON ke Service
 * Request: { "name": "Dyno", "price": 250000, "type": "OPTIONAL", "description": "...", "maxQuantity": 1 }
 */
const addAddonToService = async (req, res) => {
  try {
    const { name, price, type = "OPTIONAL", description = "", maxQuantity = 1 } = req.body;

    if (!name || price === undefined) {
      return res.status(400).json({
        success: false,
        message: "Nama dan harga add-on harus diisi"
      });
    }

    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Layanan tidak ditemukan"
      });
    }

    // Cek apakah addon sudah ada
    if (service.availableAddons.some(a => a.name === name)) {
      return res.status(400).json({
        success: false,
        message: "Add-on dengan nama ini sudah ada"
      });
    }

    service.availableAddons.push({
      id: new mongoose.Types.ObjectId(),
      name,
      price,
      type,
      description,
      maxQuantity
    });

    await service.save();

    res.status(200).json({
      success: true,
      message: "Add-on berhasil ditambahkan",
      data: service
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error menambah add-on",
      error: error.message
    });
  }
};

/**
 * UPDATE ADD-ON di Service
 */
const updateAddonInService = async (req, res) => {
  try {
    const { serviceId, addonId } = req.params;
    const { name, price, type, description, maxQuantity } = req.body;

    const service = await Service.findById(serviceId);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Layanan tidak ditemukan"
      });
    }

    const addon = service.availableAddons.find(
      a => a.id.toString() === addonId
    );

    if (!addon) {
      return res.status(404).json({
        success: false,
        message: "Add-on tidak ditemukan"
      });
    }

    if (name !== undefined) addon.name = name;
    if (price !== undefined) addon.price = price;
    if (type !== undefined) addon.type = type;
    if (description !== undefined) addon.description = description;
    if (maxQuantity !== undefined) addon.maxQuantity = maxQuantity;

    await service.save();

    res.status(200).json({
      success: true,
      message: "Add-on berhasil diupdate",
      data: service
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error update add-on",
      error: error.message
    });
  }
};

/**
 * DELETE ADD-ON dari Service
 */
const deleteAddonFromService = async (req, res) => {
  try {
    const { serviceId, addonId } = req.params;

    const service = await Service.findById(serviceId);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Layanan tidak ditemukan"
      });
    }

    const addonIndex = service.availableAddons.findIndex(
      a => a.id.toString() === addonId
    );

    if (addonIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Add-on tidak ditemukan"
      });
    }

    service.availableAddons.splice(addonIndex, 1);
    await service.save();

    res.status(200).json({
      success: true,
      message: "Add-on berhasil dihapus",
      data: service
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error menghapus add-on",
      error: error.message
    });
  }
};

module.exports = {
  createServiceWithVariants,
  getAllServicesWithDetails,
  getServiceById,
  updateService,
  deleteService,
  addVariantToService,
  updateVariantInService,
  deleteVariantFromService,
  addAddonToService,
  updateAddonInService,
  deleteAddonFromService
};
