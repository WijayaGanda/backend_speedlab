const Booking = require("../model/BookingModel");
const BookingDetail = require("../model/BookingDetailModel");
const Service = require("../model/ServiceModel");
const User = require("../model/UserModel");

/**
 * CREATE BOOKING dengan Layanan Fleksibel (Varian + Add-ons)
 * 
 * Request Body:
 * {
 *   "userId": "user_id",
 *   "motorcycleId": "motorcycle_id",
 *   "bookingDate": "2026-05-15",
 *   "bookingTime": "09:00",
 *   "complaint": "Motor terasa kasar",
 *   "bookingServices": [
 *     {
 *       "serviceId": "service_id",
 *       "selectedVariant": {
 *         "name": "CBR SP",
 *         "priceModifier": 550000
 *       },
 *       "selectedAddons": [
 *         {
 *           "addonId": "addon_id",
 *           "quantity": 1
 *         }
 *       ]
 *     }
 *   ],
 *   "sparepartsPrice": 0
 * }
 */
const createBookingWithFlexibleService = async (req, res) => {
  try {
    const {
      userId,
      motorcycleId,
      bookingDate,
      bookingTime,
      complaint,
      bookingServices = [],
      sparepartsPrice = 0
    } = req.body;

    // Validasi
    if (!userId || !motorcycleId || !bookingDate || !bookingTime) {
      return res.status(400).json({
        success: false,
        message: "userId, motorcycleId, bookingDate, dan bookingTime harus diisi"
      });
    }

    if (bookingServices.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Minimal 1 service harus dipilih"
      });
    }

    // Create booking
    const booking = new Booking({
      userId,
      motorcycleId,
      bookingDate,
      bookingTime,
      complaint,
      sparepartsPrice
    });

    let totalServicePrice = 0;

    // Process setiap service dalam booking
    for (const bookingService of bookingServices) {
      const service = await Service.findById(bookingService.serviceId);

      if (!service) {
        return res.status(404).json({
          success: false,
          message: `Service dengan ID ${bookingService.serviceId} tidak ditemukan`
        });
      }

      // Calculate harga
      let subtotal = service.basePrice;

      // Tambah variant modifier jika ada
      let selectedVariant = null;
      if (bookingService.selectedVariant) {
        const variant = service.variants.find(
          v => v.name === bookingService.selectedVariant.name
        );
        if (variant) {
          subtotal += variant.priceModifier;
          selectedVariant = {
            name: variant.name,
            priceModifier: variant.priceModifier
          };
        }
      }

      // Tambah add-ons
      const selectedAddons = [];
      for (const addonSelection of bookingService.selectedAddons || []) {
        const addon = service.availableAddons.find(
          a => a.id.toString() === addonSelection.addonId
        );
        if (addon) {
          const quantity = addonSelection.quantity || 1;
          subtotal += (addon.price * quantity);
          selectedAddons.push({
            addonId: addon.id,
            name: addon.name,
            price: addon.price,
            quantity
          });
        }
      }

      // Create booking detail
      const bookingDetail = new BookingDetail({
        bookingId: booking._id,
        serviceId: service._id,
        serviceName: service.name,
        basePrice: service.basePrice,
        selectedVariant,
        selectedAddons,
        subtotal
      });

      await bookingDetail.save();
      booking.bookingDetails.push(bookingDetail._id);
      totalServicePrice += subtotal;
    }

    // Set total prices
    booking.servicePrice = totalServicePrice;
    booking.totalPrice = totalServicePrice + sparepartsPrice;

    await booking.save();

    // Populate data sebelum return
    await booking.populate([
      { path: "userId", select: "name email phone" },
      { path: "motorcycleId", select: "brand model year licensePlate" },
      { path: "bookingDetails" }
    ]);

    res.status(201).json({
      success: true,
      message: "Booking berhasil dibuat",
      data: booking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error membuat booking",
      error: error.message
    });
  }
};

/**
 * GET BOOKING dengan Detail Breakdown
 */
const getBookingWithDetails = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate([
        { path: "userId", select: "name email phone" },
        { path: "motorcycleId", select: "brand model year licensePlate" },
        { 
          path: "bookingDetails",
          populate: {
            path: "serviceId",
            select: "name category basePrice"
          }
        }
      ]);

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
      message: "Error mengambil booking",
      error: error.message
    });
  }
};

/**
 * UPDATE BOOKING - Ubah layanan/varian/add-ons
 */
const updateBookingServices = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { bookingServices, sparepartsPrice = 0 } = req.body;

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking tidak ditemukan"
      });
    }

    // Hapus detail lama
    await BookingDetail.deleteMany({ bookingId });
    booking.bookingDetails = [];

    let totalServicePrice = 0;

    // Process layanan baru
    for (const bookingService of bookingServices) {
      const service = await Service.findById(bookingService.serviceId);

      if (!service) {
        return res.status(404).json({
          success: false,
          message: `Service dengan ID ${bookingService.serviceId} tidak ditemukan`
        });
      }

      let subtotal = service.basePrice;
      let selectedVariant = null;

      if (bookingService.selectedVariant) {
        const variant = service.variants.find(
          v => v.name === bookingService.selectedVariant.name
        );
        if (variant) {
          subtotal += variant.priceModifier;
          selectedVariant = {
            name: variant.name,
            priceModifier: variant.priceModifier
          };
        }
      }

      const selectedAddons = [];
      for (const addonSelection of bookingService.selectedAddons || []) {
        const addon = service.availableAddons.find(
          a => a.id.toString() === addonSelection.addonId
        );
        if (addon) {
          const quantity = addonSelection.quantity || 1;
          subtotal += (addon.price * quantity);
          selectedAddons.push({
            addonId: addon.id,
            name: addon.name,
            price: addon.price,
            quantity
          });
        }
      }

      const bookingDetail = new BookingDetail({
        bookingId,
        serviceId: service._id,
        serviceName: service.name,
        basePrice: service.basePrice,
        selectedVariant,
        selectedAddons,
        subtotal
      });

      await bookingDetail.save();
      booking.bookingDetails.push(bookingDetail._id);
      totalServicePrice += subtotal;
    }

    booking.servicePrice = totalServicePrice;
    booking.sparepartsPrice = sparepartsPrice;
    booking.totalPrice = totalServicePrice + sparepartsPrice;
    booking.updatedAt = Date.now();

    await booking.save();

    await booking.populate([
      { path: "bookingDetails" }
    ]);

    res.status(200).json({
      success: true,
      message: "Booking berhasil diupdate",
      data: booking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error update booking",
      error: error.message
    });
  }
};

/**
 * GET BOOKING LIST dengan Detail Summary
 */
const getAllBookings = async (req, res) => {
  try {
    const { status, userId, sortBy = "createdAt" } = req.query;

    let query = {};
    if (status) query.status = status;
    if (userId) query.userId = userId;

    const bookings = await Booking.find(query)
      .populate([
        { path: "userId", select: "name phone" },
        { path: "motorcycleId", select: "brand model" },
        { path: "bookingDetails" }
      ])
      .sort({ [sortBy]: -1 });

    // Format response dengan summary
    const formattedBookings = bookings.map(booking => ({
      _id: booking._id,
      user: booking.userId,
      motorcycle: booking.motorcycleId,
      bookingDate: booking.bookingDate,
      bookingTime: booking.bookingTime,
      status: booking.status,
      serviceCount: booking.bookingDetails.length,
      servicePrice: booking.servicePrice,
      sparepartsPrice: booking.sparepartsPrice,
      totalPrice: booking.totalPrice,
      createdAt: booking.createdAt
    }));

    res.status(200).json({
      success: true,
      count: formattedBookings.length,
      data: formattedBookings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error mengambil daftar booking",
      error: error.message
    });
  }
};

/**
 * GET BOOKING DETAILS - Breakdown harga per item
 */
const getBookingDetailBreakdown = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking tidak ditemukan"
      });
    }

    const details = await BookingDetail.find({ bookingId }).populate("serviceId");

    // Format breakdown
    const breakdown = details.map(detail => ({
      _id: detail._id,
      serviceName: detail.serviceName,
      basePrice: detail.basePrice,
      variant: detail.selectedVariant,
      addons: detail.selectedAddons.map(addon => ({
        name: addon.name,
        price: addon.price,
        quantity: addon.quantity,
        total: addon.price * addon.quantity
      })),
      subtotal: detail.subtotal
    }));

    res.status(200).json({
      success: true,
      data: {
        bookingId: booking._id,
        itemCount: details.length,
        items: breakdown,
        summary: {
          subtotal: booking.servicePrice,
          spareparts: booking.sparepartsPrice,
          total: booking.totalPrice
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error mengambil detail breakdown",
      error: error.message
    });
  }
};

module.exports = {
  createBookingWithFlexibleService,
  getBookingWithDetails,
  updateBookingServices,
  getAllBookings,
  getBookingDetailBreakdown
};
