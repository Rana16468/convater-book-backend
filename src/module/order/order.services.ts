import httpStatus from "http-status";
import ApiError from "../../app/error/ApiError";
import catchError from "../../app/error/catchError";
import { sendFileToCloudinary } from "../../utility/sendFileToCloudinary";
import { TOrder } from "./order.interface";
import orders from "./order.model";
import {uploadFileToGoogleDrive} from "../../utility/uploadFileToGoogleDrive";



const createOrderIntoDb = async (
  payload: Partial<TOrder>
): Promise<TOrder> => {
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
    }

    // upload pdf
    // const fileUpload = await sendFileToCloudinary(
    //   `user-file-${Date.now()}`,
    //   filePath
    // );
    // ✅ Upload PDF to Google Drive
    const fileUpload = await uploadFileToGoogleDrive(
      `user-file-${Date.now()}`,
      filePath,
      "application/pdf"
    );

    // upload front image
    const frontUpload = await sendFileToCloudinary(
      `front-cover-${Date.now()}`,
      frontPath
    );

    // upload back image
    const backUpload = await sendFileToCloudinary(
      `back-cover-${Date.now()}`,
      backPath
    );

    const finalPayload: TOrder = {
      ...(payload as TOrder),
      fileData: {
        ...payload.fileData,
        file: fileUpload.secure_url
      },
      coverImages: {
        front: frontUpload.secure_url,
        back: backUpload.secure_url
      }
    };

    const orderBuilder = new orders(finalPayload);
    const result = await orderBuilder.save();

    if (!result) {
      throw new ApiError(
        httpStatus.NOT_EXTENDED,
        "Order record failed"
      );
    }

    return result;
  } catch (error) {
    catchError(error);
    throw error;
  }
};


const orderServices={
    createOrderIntoDb
};

export default orderServices;
