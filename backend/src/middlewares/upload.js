import multer from 'multer';
import path from 'path';
import crypto from 'crypto';

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPG, PNG, and WEBP images are allowed'), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
});

export const uploadSingle = upload.single('image');
export const generateFileName = (originalName) => {
  const ext = path.extname(originalName || '.jpg');
  return `${crypto.randomUUID()}${ext}`;
};
