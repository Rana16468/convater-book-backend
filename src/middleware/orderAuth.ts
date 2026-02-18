import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import jwt, { JwtPayload } from "jsonwebtoken";
import catchAsync from "../utility/catchAsync";
import ApiError from "../app/error/ApiError";
import config from "../app/config";
import orders from "../module/order/order.model";

const orderAuth = () => {
  return catchAsync(
    async (req: Request, _res: Response, next: NextFunction) => {
      const token = req.headers.authorization;

      if (!token) {
        throw new ApiError(
          httpStatus.UNAUTHORIZED,
          "You are not authorized",
          ""
        );
      };
      

      let decoded: JwtPayload;

      try {
        decoded = jwt.verify(
          token,
          config.jwt_access_secret as string
        ) as JwtPayload;
      } catch (error) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid token", "");
      }

      const { _id, orderId } = decoded;

      if (!_id || !orderId) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid token payload", "");
      }

      const isOrderExist = await orders.findOne(
        { _id, orderId },
        { _id: 1 }
      );

      if (!isOrderExist) {
        throw new ApiError(
          httpStatus.NOT_FOUND,
          "Order not found",
          ""
        );
      }

      // attach order info to request
      req.user = decoded;

      next();
    }
  );
};

export default orderAuth;
