import multer from 'multer';
import path from 'path';
import fs from 'fs';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadDir = '';

    switch (file.mimetype.split('/')[0]) {
      case 'audio':
        uploadDir = 'audio';
        break;
      case 'image':
        uploadDir = 'images';
        break;
      case 'video':
        uploadDir = 'videos';
        break;
      default:
        uploadDir = 'files';
        break;
    }

    // Use path.resolve instead of __dirname
    const destinationDir = path.resolve('public', uploadDir);

    // Create the directory if it doesn't exist
    fs.mkdirSync(destinationDir, { recursive: true });

    cb(null, destinationDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const fileExtension = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${fileExtension}`);
  },
});

const upload = multer({ storage });

export default upload;
