import express, { NextFunction, Request, Response } from 'express';
import upload from '../../utility/uplodeFile';
import ApiError from '../../app/error/ApiError';
import httpStatus from 'http-status';
import validationRequest from '../../middleware/validationRequest';
import orderZodValidation from './order.validation';
import orderController from './order.controller';

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
      /* ---------------------------------------
         1️⃣ Parse JSON from frontend
      ---------------------------------------- */

      if (req.body.data && typeof req.body.data === "string") {
        req.body = JSON.parse(req.body.data);
      }

      const files = req.files as {
        [fieldname: string]: Express.Multer.File[];
      };

      /* ---------------------------------------
         2️⃣ Inject Cover Images
      ---------------------------------------- */

      if (files?.front?.[0]) {
        req.body.coverImages = req.body.coverImages || {};
        req.body.coverImages.front = files.front[0].path.replace(/\\/g, "/");
      }

      if (files?.back?.[0]) {
        req.body.coverImages = req.body.coverImages || {};
        req.body.coverImages.back = files.back[0].path.replace(/\\/g, "/");
      }

      /* ---------------------------------------
         3️⃣ Inject FileData.file
      ---------------------------------------- */

      if (files?.file?.[0]) {
        req.body.fileData = req.body.fileData || {};
        req.body.fileData.file = files.file[0].path.replace(/\\/g, "/");
      }

      /* ---------------------------------------
         4️⃣ Inject IP Address
      ---------------------------------------- */

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


const OrderRoutes=route

export default  OrderRoutes;
