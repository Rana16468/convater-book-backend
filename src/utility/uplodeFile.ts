import ApiError from '../app/error/ApiError';
import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import status from "http-status";
import crypto from "crypto";
import config from '../app/config';

// Configuration constants
const MAX_FILE_SIZE = 300 * 1024 * 1024; // 300 MB
const UPLOAD_BASE_PATH =config.file_path

// Dangerous file extensions that should be blocked for security
const DANGEROUS_EXTENSIONS = [
  ".exe", ".bat", ".cmd", ".com", ".pif", ".scr", ".vbs", 
  ".js", ".jar", ".msi", ".dll", ".so", ".dylib", ".app",
  ".deb", ".rpm", ".sh", ".bash", ".ps1", ".psm1"
];

// MIME type categories for organized storage
const MIME_CATEGORIES: Record<string, { folder: string; prefix: string }> = {
  image: { folder: "images", prefix: "img" },
  video: { folder: "videos", prefix: "vid" },
  audio: { folder: "audios", prefix: "aud" },
  pdf: { folder: "documents/pdf", prefix: "doc" },
  document: { folder: "documents", prefix: "doc" },
  spreadsheet: { folder: "documents/spreadsheets", prefix: "sheet" },
  presentation: { folder: "documents/presentations", prefix: "pres" },
  archive: { folder: "archives", prefix: "arch" },
  text: { folder: "text", prefix: "txt" },
  font: { folder: "fonts", prefix: "font" },
  other: { folder: "others", prefix: "file" }
};

/**
 * Sanitize filename to prevent directory traversal and injection attacks
 */
const sanitizeFilename = (filename: string): string => {
  // Remove path separators and null bytes
  let sanitized = filename.replace(/[\/\\:\0]/g, "");
  
  // Remove leading dots to prevent hidden files
  sanitized = sanitized.replace(/^\.+/, "");
  
  // Replace multiple spaces with single space
  sanitized = sanitized.replace(/\s+/g, " ");
  
  // Remove or replace special characters that might cause issues
  sanitized = sanitized.replace(/[<>:"|?*]/g, "");
  
  // Limit filename length (Windows has 255 char limit)
  const ext = path.extname(sanitized);
  const nameWithoutExt = sanitized.replace(ext, "");
  const maxNameLength = 200;
  
  if (nameWithoutExt.length > maxNameLength) {
    sanitized = nameWithoutExt.substring(0, maxNameLength) + ext;
  }
  
  return sanitized.trim();
};

/**
 * Determine file category based on MIME type
 */
const getFileCategory = (mimetype: string): keyof typeof MIME_CATEGORIES => {
  const type = mimetype.toLowerCase();
  
  if (type.startsWith("image/")) return "image";
  if (type.startsWith("video/")) return "video";
  if (type.startsWith("audio/")) return "audio";
  if (type === "application/pdf") return "pdf";
  
  // Document types
  if (
    type.includes("word") || 
    type.includes("document") ||
    type === "application/rtf" ||
    type === "text/plain"
  ) return "document";
  
  // Spreadsheet types
  if (
    type.includes("spreadsheet") || 
    type.includes("excel") ||
    type === "text/csv"
  ) return "spreadsheet";
  
  // Presentation types
  if (
    type.includes("presentation") || 
    type.includes("powerpoint")
  ) return "presentation";
  
  // Archive types
  if (
    type.includes("zip") || 
    type.includes("rar") ||
    type.includes("tar") ||
    type.includes("7z") ||
    type.includes("gzip") ||
    type.includes("bzip")
  ) return "archive";
  
  // Text types
  if (type.startsWith("text/")) return "text";
  
  // Font types
  if (
    type.includes("font") ||
    type === "application/vnd.ms-fontobject" ||
    type === "application/x-font-ttf"
  ) return "font";
  
  return "other";
};

/**
 * Check if file extension is potentially dangerous
 */
const isDangerousExtension = (filename: string): boolean => {
  const ext = path.extname(filename).toLowerCase();
  return DANGEROUS_EXTENSIONS.includes(ext);
};

/**
 * Generate a secure unique filename
 */
const generateSecureFilename = (originalName: string, category: string): string => {
  const sanitized = sanitizeFilename(originalName);
  const fileExt = path.extname(sanitized);
  const nameWithoutExt = sanitized.replace(fileExt, "");
  
  // Create a unique identifier
  const uniqueId = uuidv4();
  const timestamp = Date.now();
  
  // Use category prefix
  const prefix = MIME_CATEGORIES[category as keyof typeof MIME_CATEGORIES]?.prefix || "file";
  
  // Generate hash of original name for additional uniqueness
  const hash = crypto
    .createHash("md5")
    .update(nameWithoutExt + timestamp)
    .digest("hex")
    .substring(0, 8);
  
  // Construct filename: prefix-hash-uuid.ext
  const safeName = nameWithoutExt
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 50);
    
  return `${prefix}-${safeName}-${hash}-${uniqueId}${fileExt}`;
};

/**
 * Multer storage configuration
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      // Get file category
      const category = getFileCategory(file.mimetype);
      const { folder } = MIME_CATEGORIES[category];
      
      // Construct full path
      const folderPath = path.join(UPLOAD_BASE_PATH as string, folder);
      
      // Create directory if it doesn't exist
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true, mode: 0o755 });
      }
      
      cb(null, folderPath);
    } catch (error) {
      cb(
        new ApiError(
          status.INTERNAL_SERVER_ERROR,
          "Failed to create upload directory" , ''
        ),
        ""
      );
    }
  },
  
  filename: (req, file, cb) => {
    try {
      const category = getFileCategory(file.mimetype);
      const secureFilename = generateSecureFilename(file.originalname, category);
      cb(null, secureFilename);
    } catch (error) {
      cb(
        new ApiError(
          status.INTERNAL_SERVER_ERROR,
          "Failed to generate filename", ""
        ),
        ""
      );
    }
  }
});

/**
 * File filter for security validation
 */
const fileFilter = (
  req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  try {
    // Check for dangerous file extensions
    if (isDangerousExtension(file.originalname)) {
      return cb(
        new ApiError(
          status.BAD_REQUEST,
          `File type not allowed for security reasons: ${path.extname(file.originalname)}`, ""
        )
      );
    }
    
    // Validate original filename is not malicious
    const sanitized = sanitizeFilename(file.originalname);
    if (!sanitized || sanitized.length === 0) {
      return cb(
        new ApiError(
          status.BAD_REQUEST,
          "Invalid filename", ""
        )
      );
    }
    
    // Check for null bytes in filename (directory traversal attack)
    if (file.originalname.includes("\0")) {
      return cb(
        new ApiError(
          status.BAD_REQUEST,
          "Invalid filename: contains null bytes", ""
        )
      );
    }
    
    // Validate MIME type is not empty
    if (!file.mimetype || file.mimetype.trim() === "") {
      return cb(
        new ApiError(
          status.BAD_REQUEST,
          "File MIME type could not be determined",""
        )
      );
    }
    
    // All checks passed
    cb(null, true);
  } catch (error) {
    cb(
      new ApiError(
        status.INTERNAL_SERVER_ERROR,
        "File validation failed",""
      )
    );
  }
};

/**
 * Main upload configuration
 */
const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 10, // Maximum 10 files per request
    fields: 20, // Maximum 20 non-file fields
    fieldNameSize: 100, // Maximum field name size
    fieldSize: 1024 * 1024, // Maximum field value size (1MB)
    parts: 50, // Maximum number of parts (fields + files)
    headerPairs: 100 // Maximum number of header key-value pairs
  },
  fileFilter,
  preservePath: false // Prevent directory traversal
});

/**
 * Error handler middleware for multer errors
 */
export const handleMulterError = (err: any, req: any, res: any, next: any) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(status.BAD_REQUEST).json({
        success: false,
        message: `File size exceeds the maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB`
      });
    }
    if (err.code === "LIMIT_FILE_COUNT") {
      return res.status(status.BAD_REQUEST).json({
        success: false,
        message: "Too many files uploaded at once"
      });
    }
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(status.BAD_REQUEST).json({
        success: false,
        message: "Unexpected file field"
      });
    }
    return res.status(status.BAD_REQUEST).json({
      success: false,
      message: err.message
    });
  }
  
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message
    });
  }
  
  next(err);
};

/**
 * Utility function to get file metadata
 */
export const getFileMetadata = (file: Express.Multer.File) => {
  const category = getFileCategory(file.mimetype);
  const { folder } = MIME_CATEGORIES[category];

  console.log({
    originalName: file.originalname,
    filename: file.filename,
    path: file.path,
    size: file.size,
    mimetype: file.mimetype,
    category,
    folder,
    url: `/uploads/${folder}/${file.filename}`,
    uploadedAt: new Date().toISOString()
  })
  
  return {
    originalName: file.originalname,
    filename: file.filename,
    path: file.path,
    size: file.size,
    mimetype: file.mimetype,
    category,
    folder,
    url: `/uploads/${folder}/${file.filename}`,
    uploadedAt: new Date().toISOString()
  };
};

/**
 * Cleanup function to delete uploaded file (useful for rollback)
 */
export const deleteUploadedFile = async (filePath: string): Promise<void> => {
  try {
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  } catch (error) {
    console.error("Failed to delete file:", error);
  }
};

export default upload;