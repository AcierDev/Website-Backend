import path from "path";
import { promises as fs } from "fs";
import multer, { Options, StorageEngine } from "multer";

const uploadDir = path.join(process.cwd(), "res", "labels");

// Ensure upload directory exists
fs.mkdir(uploadDir, { recursive: true }).catch((error) =>
  console.error("Error creating upload directory:", error)
);

const storage: StorageEngine = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

export const uploadConfig: Options = {
  storage,
  fileFilter: (req, file, cb: multer.FileFilterCallback) => {
    if (file.mimetype !== "application/pdf") {
      cb(null, false);
    } else {
      cb(null, true);
    }
  },
};

export { uploadDir };
