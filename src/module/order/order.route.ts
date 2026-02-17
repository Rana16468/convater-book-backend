import express, { NextFunction, Request, Response } from "express";
import upload from "../../utility/uplodeFile";
import ApiError from "../../app/error/ApiError";
import httpStatus from "http-status";
import validationRequest from "../../middleware/validationRequest";
import orderZodValidation from "./order.validation";
import orderController from "./order.controller";
import { uploadToS3 } from "../../utility/uploadToS3";

const route = express.Router();

route.post(
  "/order_recorder",

  upload.fields([
    { name: "front", maxCount: 1 },
    { name: "back", maxCount: 1 },
    { name: "file", maxCount: 1 },
  ]),

  async (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (req.body.data && typeof req.body.data === "string") {
        req.body = JSON.parse(req.body.data);
      }

      const files = req.files as {
        [fieldname: string]: Express.Multer.File[];
      };

      // front image (local path for now)
      if (files?.front?.[0]) {
        req.body.coverImages = req.body.coverImages || {};
        req.body.coverImages.front = files.front[0].path.replace(/\\/g, "/");
      }

      // back image (local path for now)
      if (files?.back?.[0]) {
        req.body.coverImages = req.body.coverImages || {};
        req.body.coverImages.back = files.back[0].path.replace(/\\/g, "/");
      }

      // ✅ main file → upload to S3
      if (files?.file?.[0]) {
        const uploadedUrl = await uploadToS3(
          files.file[0], 
          "orders"
        );

        req.body.fileData = req.body.fileData || {};
        req.body.fileData.file = uploadedUrl;
      }

      req.body.ipAddress =
        req.ip ||
        req.socket?.remoteAddress ||
        "";

      next();
    } catch (error: any) {
      next(
        new ApiError(
          httpStatus.BAD_REQUEST,
          "Invalid JSON data",
          error.message
        )
      );
    }
  },

  validationRequest(orderZodValidation.createOrderZodSchema),
  orderController.createOrder
);

export default route;
