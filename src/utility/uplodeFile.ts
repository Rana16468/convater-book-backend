import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import status from "http-status";
import crypto from "crypto";
import ApiError from "../app/error/ApiError";
import config from "../app/config";

const MAX_FILE_SIZE = 300 * 1024 * 1024; // 300 MB
const UPLOAD_PATH = config.file_path as string;

// Allowed MIME types: documents + images
const ALLOWED_MIME_TYPES = [
  // Documents
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",

  // Images
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/bmp",
  "image/tiff",
  "image/svg+xml",
  "image/heic",
  "image/heif",
  "image/x-icon",
  "image/vnd.microsoft.icon"
];

// Block dangerous extensions
const BLOCKED_EXTENSIONS = [
  ".exe", ".bat", ".cmd", ".sh", ".js", ".jar", ".vbs", ".com", ".msi"
];

/**
 * Sanitize filename to prevent directory traversal & injection
 */
const sanitizeFilename = (filename: string): string => {
  let sanitized = filename.replace(/[\/\\:\0]/g, ""); // remove slashes/null bytes
  sanitized = sanitized.replace(/^\.+/, ""); // remove leading dots
  sanitized = sanitized.replace(/\s+/g, "-"); // spaces -> dash
  sanitized = sanitized.replace(/[^a-zA-Z0-9\-_.]/g, ""); // remove special chars
  return sanitized.substring(0, 100); // limit length
};

/**
 * Generate unique secure filename
 */
const generateFilename = (originalName: string): string => {
  const ext = path.extname(originalName);
  const name = sanitizeFilename(originalName.replace(ext, ""));
  const hash = crypto.createHash("md5").update(name + Date.now()).digest("hex").substring(0, 8);
  return `${name}-${hash}-${uuidv4()}${ext}`;
};

// Multer storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    if (!fs.existsSync(UPLOAD_PATH)) {
      fs.mkdirSync(UPLOAD_PATH, { recursive: true, mode: 0o755 });
    }
    cb(null, UPLOAD_PATH);
  },
  filename: (_req, file, cb) => {
    cb(null, generateFilename(file.originalname));
  }
});

// Multer file filter
const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const ext = path.extname(file.originalname).toLowerCase();

  // Block dangerous extensions
  if (BLOCKED_EXTENSIONS.includes(ext)) {
    return cb(new ApiError(status.BAD_REQUEST, `File type not allowed: ${ext}`));
  }

  // Only allow allowed MIME types
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype.toLowerCase())) {
    return cb(new ApiError(status.BAD_REQUEST, "File type not allowed. Only images and documents are allowed"));
  }

  cb(null, true);
};

// Multer upload instance
const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter
});

export default upload;
