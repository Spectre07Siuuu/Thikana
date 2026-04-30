const fs = require('fs');
const path = require('path');

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/**
 * Saves a base64 encoded image to the specified directory.
 * @param {string} base64Str - The base64 data URL string.
 * @param {string} dir - The directory inside server/uploads/.
 * @param {string} filenamePrefix - Prefix for the generated filename.
 * @returns {string} The public URL path of the saved image.
 */
function saveBase64Image(base64Str, dir, filenamePrefix) {
  const matches = base64Str.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    throw new Error('Invalid image format. Must be a base64 data URL.');
  }
  
  let type = matches[1].toLowerCase();
  if (type === 'jpeg') type = 'jpg';
  
  const allowed = ['jpg', 'png', 'webp'];
  if (!allowed.includes(type)) {
    throw new Error(`Unsupported file type: ${type}. Allowed: jpg, png, webp.`);
  }

  const filename = `${filenamePrefix}-${Date.now()}.${type}`;
  const dirPath = path.join(__dirname, '..', 'uploads', dir);
  
  // Ensure the directory exists
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  
  const filepath = path.join(dirPath, filename);
  const buffer = Buffer.from(matches[2], 'base64');
  if (buffer.length > MAX_IMAGE_BYTES) {
    throw new Error('Image exceeds maximum size of 5MB.');
  }
  
  fs.writeFileSync(filepath, buffer);
  return `/uploads/${dir}/${filename}`;
}

module.exports = { saveBase64Image };
