import { UploadApiResponse, v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";
import config from "../app/config";

cloudinary.config({
  cloud_name: config.uplode_file_cloudinary.cloudinary_cloud_name,
  api_key: config.uplode_file_cloudinary.cloudinary_api_key,
  api_secret: config.uplode_file_cloudinary.cloudinary_api_secret,
});

export const sendFileToCloudinary = (
  fileName: string,
  filePath: string
): Promise<UploadApiResponse> => {
  return new Promise((resolve, reject) => {
    const ext = path.extname(filePath).toLowerCase();

    let resourceType: "image" | "video" | "raw" = "raw";

    if ([".png", ".jpg", ".jpeg", ".webp"].includes(ext)) {
      resourceType = "image";
    } else if ([".pdf"].includes(ext)) {
      resourceType = "image";
    } else if ([".mp4", ".mov", ".avi"].includes(ext)) {
      resourceType = "video";
    }

    cloudinary.uploader.upload(
      filePath,
      { resource_type: resourceType, folder: "user-files", public_id: fileName },
      (error, result) => {
        // ✅ Always clean up temp file after upload attempt
        fs.unlink(filePath, () => {});
        if (error) return reject(error);
        resolve(result as UploadApiResponse);
      }
    );
  });
};