import cloudinary from '../config/cloudinary.js';
import { generateFileName } from '../middlewares/upload.js';

export const uploadBufferToCloudinary = async (buffer, mimetype) => {
  const fileName = generateFileName(`image.${mimetype.split('/')[1] || 'jpg'}`);
  const result = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'campusconnect', public_id: fileName.replace(/\.[^.]+$/, '') },
      (error, uploadResult) => {
        if (error) reject(error);
        else resolve(uploadResult);
      }
    );

    stream.end(buffer);
  });

  return result;
};

export const deleteFromCloudinary = async (publicId) => {
  if (!publicId) return;
  await cloudinary.uploader.destroy(publicId);
};
