import httpStatus from "http-status";
import mongoose from "mongoose";
import ApiError from "../../app/error/ApiError";
import catchError from "../../app/error/catchError";
import { sendFileToCloudinary } from "../../utility/sendFileToCloudinary";
import { TOrder, TOrderResult } from "./order.interface";
import orders from "./order.model";
import ordertrackings from "../order_tracking/order_tracking.model";

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

const orderServices = {
  createOrderIntoDb,
};

export default orderServices;
