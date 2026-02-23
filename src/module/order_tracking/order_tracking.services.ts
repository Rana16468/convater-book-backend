import httpStatus from "http-status";
import ApiError from "../../app/error/ApiError";
import catchError from "../../app/error/catchError";
import orders from "../order/order.model";
import { ForgotOrderPayload, TOrderTracking } from "./order_tracking.interface";
import { jwtHelpers } from "../../helper/jwtHelpers";
import config from "../../app/config";

import ordertrackings from "./order_tracking.model";
import { allowedFields, statusBooleanFieldMap, statusFlow } from "./order_tracking.constant";


const forgotOrderAuthenticatorIntoDb = async (
  payload: ForgotOrderPayload
) => {
  try {
    const { phone, password } = payload;

    if (!phone || !password) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Invalid credentials");
    }

    const normalizedPhone = phone.trim();

    // ✅ Find orders by phone
    const ordersList = await orders
      .find({ "delivery.phone": normalizedPhone })
      .select("orderId delivery.name delivery.phone delivery.password")
      .lean();

    if (!ordersList.length) {
      throw new ApiError(
        httpStatus.UNAUTHORIZED,
        "Invalid phone or password"
      );
    }

    let matchedOrder = null;

    for (const order of ordersList) {
      const isMatch = await orders.comparePassword(
        password,
        order.delivery.password
      );

      if (isMatch) {
        matchedOrder = order;
        break;
      }
    }

    if (!matchedOrder) {
      throw new ApiError(
        httpStatus.UNAUTHORIZED,
        "Invalid phone or password"
      );
    }

    const jwtPayload = {
      _id: matchedOrder._id.toString(),
      name: matchedOrder.delivery.name,
      phone: matchedOrder.delivery.phone,
      orderId: matchedOrder.orderId,
    };

    // ✅ Tokens
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
      accessToken,
      refreshToken,
    };

  } catch (error) {
    throw catchError(error);
  }
};
const findByMyOrderTrackingIntoDb = async (
  phone: string,

  query: Record<string, unknown>
) => {
  try {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const pipeline = [
      {
        $match: {
          "delivery.phone": phone
        }
      },
      {
        $lookup: {
          from: "ordertrackings",
          localField: "orderId",
          foreignField: "orderId",
          as: "trackingInfo"
        }
      },
      {
        $unwind: {
          path: "$trackingInfo",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $addFields: {
          currentStage: {
            $switch: {
              branches: [
                {
                  case: { $eq: ["$trackingInfo.ReadyDelivery.isReadyDelivery", true] },
                  then: "ReadyDelivery"
                },
                {
                  case: { $eq: ["$trackingInfo.PrintingCompleted.isPrintingCompleted", true] },
                  then: "PrintingCompleted"
                },
                {
                  case: { $eq: ["$trackingInfo.PrintingStarted.isPrintingStarted", true] },
                  then: "PrintingStarted"
                },
                {
                  case: { $eq: ["$trackingInfo.PaymentVerified.isPaymentVerified", true] },
                  then: "PaymentVerified"
                },
                {
                  case: { $eq: ["$trackingInfo.OrderPlaced.isOrderPlaced", true] },
                  then: "OrderPlaced"
                }
              ],
              default: "Pending"
            }
          }
        }
      },
      {
        $project: {
          orderId: 1,
          createdAt: 1,
          "fileData.pages": 1,
          "preferences.bookName": 1,
          "preferences.quantity": 1,
          "payment.totalCost": 1,
          currentStage: 1
        }
      },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit }
    ];

    const myOrderList = await orders.aggregate(pipeline as any);

    const total = await orders.countDocuments({
      "delivery.phone": phone
    });

    const meta = {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit)
    };

    return { meta, myOrderList };
  } catch (error) {
    catchError(error);
  }
};


const OrderTrackingIntoDb = async (orderId: string) => {
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
           delivery.name
          delivery.phone
          delivery.address
          delivery.district
          district.thana
        `,
      });

    return result;
  } catch (error) {
    catchError(error);
  }
};





// =========================
// CHANGE ORDER STATUS FUNCTION
// =========================
const changeOrderTrackingStatusIntoDb = async (
  orderId: string,
  payload: Partial<TOrderTracking>
) => {
  try {
    if (!orderId) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Invalid orderId");
    }

    // ✅ Filter only whitelisted fields
    const filteredPayload = Object.fromEntries(
      Object.entries(payload).filter(([key]) =>
        allowedFields.includes(key as keyof TOrderTracking)
      )
    ) as Partial<TOrderTracking>;

    if (!Object.keys(filteredPayload).length) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "No valid fields provided for update"
      );
    }

    // 🔐 Find order tracking
    const orderTrackingDoc = await ordertrackings.findOne({ orderId });

    if (!orderTrackingDoc) {
      throw new ApiError(httpStatus.NOT_FOUND, "Order tracking not found");
    }

    // 🔐 Step-by-step validation
    for (const stage of Object.keys(filteredPayload) as (keyof TOrderTracking)[]) {
      const boolField = statusBooleanFieldMap[stage];
      if (!boolField) continue; // skip if no boolean field

      const stageValue = filteredPayload[stage] as any;

      if (stageValue?.[boolField] === true) {
        const stageIndex = statusFlow.indexOf(stage);
        if (stageIndex > 0) {
          const prevStage = statusFlow[stageIndex - 1];
          const prevBoolField = statusBooleanFieldMap[prevStage];

          const prevStageValue = orderTrackingDoc.get(prevStage) as any;

          if (!prevStageValue?.[prevBoolField]) {
            throw new ApiError(
              httpStatus.BAD_REQUEST,
              `Cannot update "${stage}" before "${prevStage}" is completed`
            );
          }
        }
      }
    }

    // ✅ Update the document
    Object.assign(orderTrackingDoc, filteredPayload);
    const updatedTracking = await orderTrackingDoc.save(); // triggers pre('save')

    return {
      status: true,
      message: "Order tracking status updated successfully",
      data: updatedTracking,
    };
  } catch (error) {
    catchError(error);
    throw error;
  }
};



export const orderTrackingServices = {
  forgotOrderAuthenticatorIntoDb,
  findByMyOrderTrackingIntoDb,
  OrderTrackingIntoDb,
  changeOrderTrackingStatusIntoDb
};

export default orderTrackingServices;
