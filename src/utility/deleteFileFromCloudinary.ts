import { v2 as cloudinary } from "cloudinary";
import config from "../app/config";
import catchError from "../app/error/catchError";
import ApiError from "../app/error/ApiError";
import httpStatus from "http-status";

cloudinary.config({
  cloud_name: config.uplode_file_cloudinary.cloudinary_cloud_name,
  api_key: config.uplode_file_cloudinary.cloudinary_api_key,
  api_secret: config.uplode_file_cloudinary.cloudinary_api_secret,
});

const deleteFileFromCloudinary = async (fileUrl: string) => {
  try {
    const parsedUrl = new URL(fileUrl);
    const pathname = parsedUrl.pathname;

    const pathParts = pathname.split("/");
    const uploadIndex = pathParts.indexOf("upload");

    if (uploadIndex === -1) {
      throw new ApiError(httpStatus.NOT_IMPLEMENTED,"Invalid Cloudinary URL","");
    }

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

    const resourceType = pathname.includes("/image/")
      ? "image"
      : pathname.includes("/video/")
      ? "video"
      : pathname.includes("/raw/")
      ? "raw"
      : "auto";

      

    return  await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
  } catch (error) {
    catchError(error);
    throw error;
  }
};

export default deleteFileFromCloudinary;
