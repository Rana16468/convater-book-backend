import httpStatus from "http-status";
import ApiError from "../../app/error/ApiError";
import catchError from "../../app/error/catchError";
import orders from "../order/order.model";
import { ForgotOrderPayload } from "./order_tracking.interface";



const forgotOrderAuthenticatorIntoDb = async (
   payload: ForgotOrderPayload
) => {
   try {

      if (!payload?.phone || !payload?.password) {
         throw new ApiError(httpStatus.BAD_REQUEST, "Invalid credentials");
      }

      const normalizedPhone = payload.phone.trim();

   
      const ordersList = await orders
         .find({ "delivery.phone": normalizedPhone })
         .select("+delivery.password orderId delivery.name delivery.phone");

      // ✅ If no orders found
      if (!ordersList.length) {
         throw new ApiError(
            httpStatus.UNAUTHORIZED,
            "Invalid phone or password"
         );
      }

      // ✅ Match password with any order
      let matchedOrder = null;

      for (const order of ordersList) {
         const isPasswordMatch = await orders.comparePassword(
            payload.password,
            order.delivery.password
         );

         if (isPasswordMatch) {
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
      const orderObj = matchedOrder.toObject();
      // then accesstoken and  refreash token create 
      

      return orderObj;

   } catch (error) {
      throw catchError(error);
   }
};


const orderTrackingServices = {
   forgotOrderAuthenticatorIntoDb
};

export default orderTrackingServices