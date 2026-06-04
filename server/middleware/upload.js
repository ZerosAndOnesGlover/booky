const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const { Readable } = require('stream');

// Store files in memory before uploading to Cloudinary
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const allowedDocTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  const allAllowed = [...allowedImageTypes, ...allowedDocTypes];

  if (allAllowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images (JPG, PNG, WEBP) and documents (PDF, DOC, DOCX) are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 },
});

// --- Content validation by magic bytes ---
// The multer fileFilter only sees the client-supplied MIME type, which is
// trivially spoofable. These signatures verify the *actual* bytes so a file
// renamed/relabelled to a permitted type is rejected.
const SIGNATURES = [
  { type: 'image', test: (b) => b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },                                  // JPEG
  { type: 'image', test: (b) => b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 },                 // PNG
  { type: 'image', test: (b) => b.length >= 12 && b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP' },  // WEBP
  { type: 'doc',   test: (b) => b.length >= 4 && b.toString('ascii', 0, 4) === '%PDF' },                                            // PDF
  { type: 'doc',   test: (b) => b.length >= 8 && b[0] === 0xd0 && b[1] === 0xcf && b[2] === 0x11 && b[3] === 0xe0 },                 // legacy .doc (OLE2)
  { type: 'doc',   test: (b) => b.length >= 4 && b[0] === 0x50 && b[1] === 0x4b && (b[2] === 0x03 || b[2] === 0x05 || b[2] === 0x07) }, // .docx (ZIP/OOXML)
];

const assertAllowedFileContent = (buffer, categories) => {
  const sig = Buffer.isBuffer(buffer) ? SIGNATURES.find((s) => s.test(buffer)) : null;
  if (!sig || !categories.includes(sig.type)) {
    const err = new Error('Unsupported or unrecognized file content. The uploaded file does not match an allowed type.');
    err.status = 400;
    throw err;
  }
};

// Upload buffer to Cloudinary
const uploadToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    // Verify the real file content before sending it to storage. Image uploads
    // must be images; raw uploads (manuscripts) may be images or documents.
    try {
      const categories = options.resource_type === 'image' ? ['image'] : ['image', 'doc'];
      assertAllowedFileContent(buffer, categories);
    } catch (err) {
      return reject(err);
    }

    const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });

    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);
    readable.pipe(uploadStream);
  });
};

// Delete asset from Cloudinary
const deleteFromCloudinary = async (publicId) => {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error('Cloudinary delete error:', err.message);
  }
};

module.exports = { upload, uploadToCloudinary, deleteFromCloudinary };
