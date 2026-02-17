import fs from "fs";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import config from "../app/config";
import ApiError from "../app/error/ApiError";
import httpStatus from "http-status";


export const s3 = new S3Client({
  region: config.s3_bucket.aws_bucket_region,
  credentials: {
    accessKeyId: config.s3_bucket.aws_bucket_accesskey,
    secretAccessKey: config.s3_bucket.aws_bucket_secret_key,
  },
} as any);

export const uploadToS3 = async (
  file: Express.Multer.File,
  folder: string = config.file_path || "uploads",
): Promise<string> => {
  if (!file || !file.path) {
    throw new ApiError(httpStatus.BAD_REQUEST, "No file provided");
  }

  const filePath = file.path.replace(/\\/g, "/");

  if (!fs.existsSync(filePath)) {
    throw new ApiError(httpStatus.NOT_FOUND, "File not found on server");
  }

 
  folder = folder.replace(/^\/+|\/+$/g, "");

  const fileStream = fs.createReadStream(filePath);

  const fileName = `${folder}/${Date.now()}-${file.originalname
    .replace(/\s+/g, "-")
    .toLowerCase()}`;

  const params = {
    Bucket: config.s3_bucket.aws_bucket_name, 
    Key: fileName,
    Body: fileStream,
    ContentType: file.mimetype,
    ACL: "public-read", 
  } as any;

  try {
    await s3.send(new PutObjectCommand(params));


    fs.unlinkSync(filePath);

    return `https://${config.s3_bucket.aws_bucket_name}.s3.${config.s3_bucket.aws_bucket_region}.amazonaws.com/${fileName}`;
  } catch (error) {
    // console.error("S3 Upload Error:", error);

    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Failed to upload file to S3",
    );
  }
};
