import httpStatus from "http-status";
import mongoose from "mongoose";
import ApiError from "../../app/error/ApiError";
import catchError from "../../app/error/catchError";
import { sendFileToCloudinary } from "../../utility/sendFileToCloudinary";
import { TOrder, TOrderResult } from "./order.interface";

import ordertrackings from "../order_tracking/order_tracking.model";
import orders from "./order.model";
import { jwtHelpers } from "../../helper/jwtHelpers";
import config from "../../app/config";

const createOrderIntoDb = async (
  payload: Partial<TOrder>
): Promise<TOrderResult> => {
  const session = await mongoose.startSession();
  session.startTransaction(); // Start transaction
  try {
  
    if (!payload.fileData || !payload.coverImages) {
      throw new ApiError(httpStatus.BAD_REQUEST, "File data or images missing");
    }

    const filePath = payload.fileData.file;
    const frontPath = payload.coverImages.front;
    const backPath = payload.coverImages.back;

    if (!filePath || !frontPath || !backPath) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "File, front image, or back image missing"
      );
    };



    const frontUpload = await sendFileToCloudinary(
      `front-cover-${Date.now()}`,
      frontPath
    );

    const backUpload = await sendFileToCloudinary(
      `back-cover-${Date.now()}`,
      backPath
    );

    const finalPayload: TOrder = {
      ...(payload as TOrder),
      fileData: {
        ...payload.fileData,
      },
      coverImages: {
        front: frontUpload.secure_url,
        back: backUpload.secure_url,
      },
    };

    // Save order
    const orderBuilder = new orders(finalPayload);
    const result = await orderBuilder.save({ session });

    if (!result) {
      throw new ApiError(httpStatus.NOT_EXTENDED, "Order record failed");
    }
    if (payload.payment) {
      payload.payment.totalCost = Number(payload.payment.totalCost);
}


    // Create order tracking
    const orderTrackingBuilder = new ordertrackings({
      orderId: payload.orderId,
      orderRealId: result._id,
    });

    const trackingResult = await orderTrackingBuilder.save({ session });
    if (!trackingResult) {
      throw new ApiError(httpStatus.NOT_EXTENDED, "Order tracking failed");
    }

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    return {
      status:true,
      message:`successfully recorded order & orderId :${payload.orderId}`

    };
  } catch (error) {
    // Rollback transaction
    await session.abortTransaction();
    session.endSession();

    catchError(error);
    throw error;
  }
};

const orderAuthenticatorIntoDb = async (payload: {
  orderId: string;
  password: string;
}) => {
  try {
    if (!payload.orderId || !payload.password) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Invalid credentials");
    }

    const order = await orders
      .findOne({ orderId: payload.orderId })
      .select("+delivery.password orderId delivery.name delivery.phone");

    if (!order) {
      throw new ApiError(
        httpStatus.UNAUTHORIZED,
        "Invalid orderId or password"
      );
    }

    const isPasswordValid = await orders.comparePassword(
      payload.password,
      order.delivery.password
    );

    if (!isPasswordValid) {
      throw new ApiError(
        httpStatus.UNAUTHORIZED,
        "Invalid orderId or password"
      );
    }

    const jwtPayload = {
      _id: order._id.toString(),
      name: order.delivery.name,
      phone: order.delivery.phone,
      orderId: order.orderId,
    };

    const accessToken = jwtHelpers.generateOrderToken(
      jwtPayload,
      config.jwt_access_secret as string,
      config.expires_in as string
    );

    const refreshToken = jwtHelpers.generateOrderToken(
      jwtPayload,
      config.jwt_refresh_secret as string,
      config.refresh_expires_in as string
    );

    return {
      status: true,
      message: "Login successful",
      orderId: order.orderId,
      accessToken,
      refreshToken,
    };

  } catch (error) {
    catchError(error);
  }
};
const latestOrderTrackingIntoDb = async (orderId: string) => {
  try {
    const result = await ordertrackings
      .findOne({ orderId })
      .populate({
        path: "orderRealId",
        select: `
          fileData.name
          fileData.pages
          preferences.bookName
          preferences.pageType
          preferences.printType
          preferences.quantity
          payment.totalCost
          payment.method
        `,
      });

    return result;
  } catch (error) {
    catchError(error);
  }
};





const orderServices = {
  createOrderIntoDb,
  orderAuthenticatorIntoDb,
  latestOrderTrackingIntoDb
};

export default orderServices;
