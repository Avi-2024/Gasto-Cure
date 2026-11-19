const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const BUCKET_NAME = process.env.SUPABASE_STORAGE_BUCKET || 'GastoCure';

let supabase = null;
if (SUPABASE_URL && SUPABASE_KEY) {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false },
    });
  } catch (err) {
    console.warn('⚠️ Supabase Storage client init warning:', err.message);
  }
}

/**
 * Uploads a file buffer to Supabase Storage with local disk fallback
 * @param {Object} params
 * @param {Buffer} params.buffer - File buffer
 * @param {string} params.filename - Unique filename
 * @param {string} params.mimeType - e.g. "image/png"
 * @param {string} [params.folder] - e.g. "logos" or "prescriptions"
 * @returns {Promise<{ url: string, storageProvider: string }>}
 */
async function uploadFile({ buffer, filename, mimeType, folder = 'assets' }) {
  const filePath = `${folder}/${filename}`;

  // 1. Try Supabase Storage first
  if (supabase) {
    try {
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, buffer, {
          contentType: mimeType,
          upsert: true,
        });

      if (!error && data) {
        const { data: publicUrlData } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(filePath);

        return {
          url: publicUrlData.publicUrl,
          path: filePath,
          storageProvider: 'supabase_storage',
        };
      } else if (error) {
        console.warn(`Supabase Storage upload warning (${error.message}). Falling back to local disk.`);
      }
    } catch (sbErr) {
      console.warn('Supabase storage exception, using local fallback:', sbErr.message);
    }
  }

  // 2. Local Disk Fallback
  const uploadsDir = path.join(__dirname, '../../../uploads', folder);
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const localFilePath = path.join(uploadsDir, filename);
  fs.writeFileSync(localFilePath, buffer);

  const localUrl = `/uploads/${folder}/${filename}`;
  return {
    url: localUrl,
    path: localFilePath,
    storageProvider: 'local_disk',
  };
}

module.exports = {
  uploadFile,
};
