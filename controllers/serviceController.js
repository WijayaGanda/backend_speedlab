const Service = require("../model/ServiceModel");

// Create - Tambah layanan baru
// Support BOTH format: lama (price) dan baru (basePrice dengan variants & addons)
const createService = async (req, res) => {
  try {
    const { 
      name, 
      description, 
      price,                    // Format lama
      basePrice,                // Format baru
      category,                 // Format baru
      variants,                 // Format baru
      availableAddons,          // Format baru
      estimatedDuration, 
      isWaitable 
    } = req.body;

    // Auto-detect format: jika ada basePrice atau variants/addons → format baru, jika tidak → format lama
    const finalPrice = basePrice || price;
    
    if (!finalPrice) {
      return res.status(400).json({
        success: false,
        message: "Harga service (price atau basePrice) harus diisi"
      });
    }

    const service = new Service({
      name,
      description,
      basePrice: finalPrice,
      category: category || 'SERVICE',
      variants: variants || [],
      availableAddons: availableAddons || [],
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
// Support BOTH format dan flexible variant/addon management
const updateService = async (req, res) => {
  try {
    const { 
      name, 
      description, 
      price,                    // Format lama
      basePrice,                // Format baru
      category,
      variants,
      availableAddons,
      estimatedDuration, 
      isActive, 
      isWaitable 
    } = req.body;

    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ 
        success: false,
        message: "Layanan tidak ditemukan" 
      });
    }

    // Update basic fields
    if (name) service.name = name;
    if (description !== undefined) service.description = description;
    if (estimatedDuration) service.estimatedDuration = estimatedDuration;
    if (isActive !== undefined) service.isActive = isActive;
    if (isWaitable !== undefined) service.isWaitable = isWaitable;
    if (category) service.category = category;

    // Update price (support BOTH price dan basePrice)
    if (basePrice !== undefined) {
      service.basePrice = basePrice;
    } else if (price !== undefined) {
      service.basePrice = price;
    }

    // Update flexible fields (variants & addons)
    if (variants !== undefined) service.variants = variants;
    if (availableAddons !== undefined) service.availableAddons = availableAddons;

    service.updatedAt = Date.now();
    await service.save();

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

// ========== FLEXIBLE SERVICE METHODS ==========
// Untuk manage variants dan addons

// Add variant to service
const addVariant = async (req, res) => {
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

    if (service.variants.some(v => v.name === name)) {
      return res.status(400).json({
        success: false,
        message: "Variant dengan nama ini sudah ada"
      });
    }

    service.variants.push({ name, priceModifier, description });
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

// Update variant
const updateVariant = async (req, res) => {
  try {
    const { variantName } = req.params;
    const { newName, priceModifier, description } = req.body;

    const service = await Service.findById(req.params.id);
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

    if (newName) variant.name = newName;
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

// Delete variant
const deleteVariant = async (req, res) => {
  try {
    const { variantName } = req.params;

    const service = await Service.findById(req.params.id);
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

// Add addon to service
const addAddon = async (req, res) => {
  try {
    const { name, price, type = "OPTIONAL", description = "", maxQuantity = 1 } = req.body;

    if (!name || price === undefined) {
      return res.status(400).json({
        success: false,
        message: "Nama dan harga addon harus diisi"
      });
    }

    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Layanan tidak ditemukan"
      });
    }

    if (service.availableAddons.some(a => a.name === name)) {
      return res.status(400).json({
        success: false,
        message: "Add-on dengan nama ini sudah ada"
      });
    }

    const mongoose = require("mongoose");
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

// Update addon
const updateAddon = async (req, res) => {
  try {
    const { addonId } = req.params;
    const { name, price, type, description, maxQuantity } = req.body;

    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Layanan tidak ditemukan"
      });
    }

    const addon = service.availableAddons.find(a => a.id.toString() === addonId);
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

// Delete addon
const deleteAddon = async (req, res) => {
  try {
    const { addonId } = req.params;

    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Layanan tidak ditemukan"
      });
    }

    const addonIndex = service.availableAddons.findIndex(a => a.id.toString() === addonId);
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

// ========== CREATE SERVICE WITH VARIANTS & ADDONS ==========
// Endpoint convenient: buat service sekaligus tambah variants dan addons dalam satu request
const createServiceWithDetails = async (req, res) => {
  try {
    const {
      name,
      description,
      basePrice,
      category = 'SERVICE',
      estimatedDuration,
      isWaitable = false,
      variants = [],
      addons = []
    } = req.body;

    // Validasi required fields
    if (!name || !basePrice) {
      return res.status(400).json({
        success: false,
        message: "Nama dan harga service (basePrice) harus diisi"
      });
    }

    // 1. Buat service terlebih dahulu
    const service = new Service({
      name,
      description,
      basePrice,
      category,
      estimatedDuration,
      isWaitable,
      variants: [],
      availableAddons: []
    });

    await service.save();
    console.log(`✅ Service created: ${service._id}`);

    // 2. Tambah variants jika ada
    if (variants && variants.length > 0) {
      for (const variant of variants) {
        const { variantName, priceModifier = 0, variantDescription = "" } = variant;

        if (!variantName) {
          console.warn('⚠️ Variant name missing, skipped');
          continue;
        }

        service.variants.push({
          name: variantName,
          priceModifier,
          description: variantDescription
        });

        console.log(`  ✅ Added variant: ${variantName} (+Rp ${priceModifier})`);
      }
    }

    // 3. Tambah addons jika ada
    if (addons && addons.length > 0) {
      const mongoose = require("mongoose");

      for (const addon of addons) {
        const { addonName, price, type = "OPTIONAL", addonDescription = "", maxQuantity = 1 } = addon;

        if (!addonName || price === undefined) {
          console.warn('⚠️ Addon name or price missing, skipped');
          continue;
        }

        service.availableAddons.push({
          id: new mongoose.Types.ObjectId(),
          name: addonName,
          price,
          type,
          description: addonDescription,
          maxQuantity
        });

        console.log(`  ✅ Added addon: ${addonName} (Rp ${price})`);
      }
    }

    // 4. Save service dengan semua details
    await service.save();

    res.status(201).json({
      success: true,
      message: "Layanan berhasil dibuat dengan variants dan add-ons",
      data: {
        _id: service._id,
        name: service.name,
        description: service.description,
        basePrice: service.basePrice,
        category: service.category,
        estimatedDuration: service.estimatedDuration,
        isWaitable: service.isWaitable,
        isActive: service.isActive,
        variants: service.variants,
        availableAddons: service.availableAddons,
        createdAt: service.createdAt,
        summary: {
          totalVariants: service.variants.length,
          totalAddons: service.availableAddons.length
        }
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error membuat service dengan details",
      error: error.message
    });
  }
};

module.exports = {
  createService,
  getAllServices,
  getServiceById,
  updateService,
  deleteService,
  addVariant,
  updateVariant,
  deleteVariant,
  addAddon,
  updateAddon,
  deleteAddon,
  createServiceWithDetails
};
