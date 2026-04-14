const multer = require('multer');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// =============================================
// SUPABASE CONFIGURATION
// =============================================

const supabaseUrl = process.env.SUPABASE_URL || 'https://ylyiiipafwquvzjamxol.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseKey) {
  console.warn('⚠️ Warning: SUPABASE_KEY tidak ditemukan di .env');
}

const supabase = createClient(supabaseUrl, supabaseKey);

const BUCKET_NAME = 'service-history';

// =============================================
// MULTER CONFIGURATION (Memory Storage untuk File)
// =============================================

// Memory storage - file disimpan di RAM, akan langsung di-upload ke Supabase
const storage = multer.memoryStorage();

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
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 10
  }
});

// =============================================
// HELPER FUNCTIONS: Upload ke Supabase
// =============================================

/**
 * Upload file ke Supabase Storage
 * @param {Buffer} fileBuffer - File content
 * @param {String} fileName - Nama file
 * @param {String} mimetype - File mime type
 * @returns {Promise<{success: boolean, path: string, url: string, error?: string}>}
 */
const uploadToSupabase = async (fileBuffer, fileName, mimetype) => {
  try {
    if (!supabaseKey) {
      throw new Error('SUPABASE_KEY tidak dikonfigurasi');
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomSuffix = Math.round(Math.random() * 1E9);
    const fileExt = path.extname(fileName);
    const uniqueFileName = `servicehistory-${timestamp}-${randomSuffix}${fileExt}`;

    // Upload ke Supabase
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(uniqueFileName, fileBuffer, {
        contentType: mimetype,
        upsert: false
      });

    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(uniqueFileName);

    return {
      success: true,
      filename: uniqueFileName,
      path: publicUrl,
      url: publicUrl
    };
  } catch (error) {
    console.error('Error uploading to Supabase:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Delete file dari Supabase Storage
 * @param {String} fileName - Nama file di Supabase
 * @returns {Promise<{success: boolean, error?: string}>}
 */
const deleteFromSupabase = async (fileName) => {
  try {
    if (!supabaseKey) {
      console.warn('Cannot delete: SUPABASE_KEY tidak dikonfigurasi');
      return { success: false, error: 'SUPABASE_KEY not configured' };
    }

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([fileName]);

    if (error) {
      throw new Error(`Delete failed: ${error.message}`);
    }

    console.log(`✅ File deleted from Supabase: ${fileName}`);
    return { success: true };
  } catch (error) {
    console.error('Error deleting from Supabase:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Extract filename dari Supabase public URL
 * @param {String} url - Supabase public URL
 * @returns {String} - Filename
 */
const extractFileNameFromUrl = (url) => {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    // Format: /storage/v1/object/public/service-history/{fileName}
    return pathParts[pathParts.length - 1];
  } catch {
    return null;
  }
};

/**
 * Delete files dari ServiceHistory
 * @param {Object} serviceHistory - Service history object
 */
const deleteServiceHistoryFiles = async (serviceHistory) => {
  if (serviceHistory && serviceHistory.workPhotos && serviceHistory.workPhotos.length > 0) {
    for (const photo of serviceHistory.workPhotos) {
      const fileName = extractFileNameFromUrl(photo.path);
      if (fileName) {
        await deleteFromSupabase(fileName);
      }
    }
  }
};

module.exports = {
  uploadServiceHistory,
  uploadToSupabase,
  deleteFromSupabase,
  deleteServiceHistoryFiles,
  extractFileNameFromUrl,
  supabase
};
