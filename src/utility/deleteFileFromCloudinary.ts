import { v2 as cloudinary } from "cloudinary";
import config from "../app/config";
import ApiError from "../app/error/ApiError";
import httpStatus from "http-status";

cloudinary.config({
  cloud_name: config.uplode_file_cloudinary.cloudinary_cloud_name,
  api_key: config.uplode_file_cloudinary.cloudinary_api_key,
  api_secret: config.uplode_file_cloudinary.cloudinary_api_secret,
});

// ✅ Valid Cloudinary resource types for destroy()
type CloudinaryResourceType = "image" | "video" | "raw";

const deleteFileFromCloudinary = async (fileUrl: string): Promise<void> => {
  // ✅ Validate URL is provided
  if (!fileUrl) {
    throw new ApiError(httpStatus.BAD_REQUEST, "File URL is required", "");
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(fileUrl);
  } catch {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid file URL format", "");
  }

  const pathname = parsedUrl.pathname;
  const pathParts = pathname.split("/");
  const uploadIndex = pathParts.indexOf("upload");

  if (uploadIndex === -1) {
    throw new ApiError(
      httpStatus.NOT_IMPLEMENTED,
      "Invalid Cloudinary URL: missing 'upload' segment",
      ""
    );
  }

  // ✅ Extract resource type from URL path (image/video/raw only)
  const resourceType: CloudinaryResourceType = pathname.includes("/image/")
    ? "image"
    : pathname.includes("/video/")
    ? "video"
    : "raw"; // ✅ fallback to "raw" instead of invalid "auto"

  // ✅ Extract public_id (skip version segment like v1234567)
  let publicIdParts = pathParts.slice(uploadIndex + 1);

  if (publicIdParts[0] && /^v\d+$/.test(publicIdParts[0])) {
    publicIdParts.shift();
  }

  const publicIdWithExt = publicIdParts.join("/");
  const dotIndex = publicIdWithExt.lastIndexOf(".");
  const publicId =
    dotIndex !== -1
      ? publicIdWithExt.substring(0, dotIndex)
      : publicIdWithExt;

  if (!publicId) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Could not extract public_id from URL",
      ""
    );
  }

  // ✅ Perform deletion and validate result
  const result = await cloudinary.uploader.destroy(publicId, {
    resource_type: resourceType,
  });

  // ✅ Cloudinary returns { result: 'ok' } on success, { result: 'not found' } on failure
  if (result?.result !== "ok") {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      `Failed to delete file from Cloudinary: ${result?.result ?? "unknown error"}`,
      ""
    );
  }
};

export default deleteFileFromCloudinary;