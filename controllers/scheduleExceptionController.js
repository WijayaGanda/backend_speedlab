const ScheduleException = require('../model/ScheduleExceptionModel');

exports.getExceptionByDate = async (req, res) => {
  try {
    const { date } = req.query;
    const exception = await ScheduleException.findOne({ date: date });
    
    if (!exception) {
      return res.status(200).json({ success: true, isCustom: false, data: null });
    }
    res.status(200).json({ success: true, isCustom: true, data: exception });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal memuat data tanggal" });
  }
};

exports.saveExceptionDate = async (req, res) => {
  try {
    const { date, isOpen, note, timeSlots } = req.body;

    const updatedException = await ScheduleException.findOneAndUpdate(
      { date: date },
      { isOpen, note, timeSlots },
      { new: true, upsert: true, runValidators: true } // upsert = insert or update
    );

    res.status(200).json({
      success: true,
      message: `Pengaturan tanggal ${date} berhasil disimpan`,
      data: updatedException
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal menyimpan pengaturan" });
  }
};