const OperatingHour = require('../model/OperatingHourModel');

exports.getOperatingHours = async (req, res) => {
  try {
    let hours = await OperatingHour.find().sort({ dayIndex: 1 });

    if (hours.length === 0) {
      // Setup default: Buka 09:00-12:00 dan 13:00-17:00 (Otomatis melewati jam 12)
      const defaultTimeSlots = [
        { openTime: '09:00', closeTime: '12:00' },
        { openTime: '13:00', closeTime: '17:00' }
      ];

      const defaultHours = [
        { dayIndex: 0, dayName: 'Minggu', isOpen: true, timeSlots: defaultTimeSlots },
        { dayIndex: 1, dayName: 'Senin', isOpen: false, timeSlots: [] }, // Senin Tutup
        { dayIndex: 2, dayName: 'Selasa', isOpen: true, timeSlots: defaultTimeSlots },
        { dayIndex: 3, dayName: 'Rabu', isOpen: true, timeSlots: defaultTimeSlots },
        { dayIndex: 4, dayName: 'Kamis', isOpen: true, timeSlots: defaultTimeSlots },
        { dayIndex: 5, dayName: 'Jumat', isOpen: true, timeSlots: defaultTimeSlots },
        { dayIndex: 6, dayName: 'Sabtu', isOpen: true, timeSlots: defaultTimeSlots },
      ];

      await OperatingHour.insertMany(defaultHours);
      hours = await OperatingHour.find().sort({ dayIndex: 1 });
    }

    res.status(200).json({ success: true, data: hours });
  } catch (error) {
    console.error("Error getOperatingHours:", error);
    res.status(500).json({ success: false, message: "Gagal mengambil jadwal operasional" });
  }
};

exports.updateOperatingHour = async (req, res) => {
  try {
    const { id } = req.params;
    const { isOpen, timeSlots } = req.body;

    const updatedHour = await OperatingHour.findByIdAndUpdate(
      id,
      { isOpen, timeSlots },
      { new: true, runValidators: true }
    );

    if (!updatedHour) {
      return res.status(404).json({ success: false, message: "Jadwal tidak ditemukan" });
    }

    res.status(200).json({ success: true, data: updatedHour });
  } catch (error) {
    console.error("Error updateOperatingHour:", error);
    res.status(500).json({ success: false, message: "Gagal memperbarui jadwal" });
  }
};