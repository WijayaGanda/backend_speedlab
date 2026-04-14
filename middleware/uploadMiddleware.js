const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Environment check
const isProduction = process.env.NODE_ENV === 'production';

// =============================================
// OPTION 1: LOCAL STORAGE (Default - Development)
// =============================================

let uploadDir;
let localStorage;

if (!isProduction) {
  // Buat folder uploads jika belum ada (hanya untuk development)
  uploadDir = path.join(__dirname, '../uploads/service-history');
  
  // Safe mkdir dengan recursive
  try {
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
  } catch (error) {
    console.warn('Warning: Tidak bisa membuat upload directory:', error.message);
  }

  // Configure storage untuk local file
  localStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, 'servicehistory-' + uniqueSuffix + path.extname(file.originalname));
    }
  });
} else {
  // Production: Gunakan memory storage (temporary)
  localStorage = multer.memoryStorage();
}

// File filter - hanya terima gambar
const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
  
  const fileExt = path.extname(file.originalname).toLowerCase();
  
  if (allowedMimes.includes(file.mimetype) && allowedExtensions.includes(fileExt)) {
    cb(null, true);
  } else {
    cb(new Error(`Format file tidak didukung. Hanya menerima: ${allowedExtensions.join(', ')}`), false);
  }
};

// Size limit: 5MB per file, max 10 files
const uploadServiceHistory = multer({
  storage: localStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 10
  }
});

// =============================================
// HELPER FUNCTION: Hapus file lokal
// =============================================
const deleteLocalFile = (filename) => {
  if (isProduction) {
    // Di production, file ada di memory, tidak perlu delete
    return;
  }
  
  try {
    if (!uploadDir) return;
    const filePath = path.join(uploadDir, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`File deleted: ${filename}`);
    }
  } catch (error) {
    console.error(`Error deleting file ${filename}:`, error.message);
  }
};

// Delete multiple files
const deleteLocalFiles = (filenames) => {
  if (Array.isArray(filenames)) {
    filenames.forEach(filename => deleteLocalFile(filename));
  }
};

// =============================================
// HELPER FUNCTION: Hapus file dari ServiceHistory
// =============================================
const deleteServiceHistoryFiles = (serviceHistory) => {
  if (serviceHistory && serviceHistory.workPhotos && serviceHistory.workPhotos.length > 0) {
    const filenames = serviceHistory.workPhotos.map(photo => photo.filename);
    deleteLocalFiles(filenames);
  }
};

module.exports = {
  uploadServiceHistory,
  deleteLocalFile,
  deleteLocalFiles,
  deleteServiceHistoryFiles,
  uploadDir,
  isProduction
};
