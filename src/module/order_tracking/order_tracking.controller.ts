import { RequestHandler } from "express";
import catchAsync from "../../utility/catchAsync";
import orderTrackingServices from "./order_tracking.services";
import sendResponse from "../../utility/sendResponse";
import httpStatus from "http-status";



const forgotOrderAuthenticator:RequestHandler=catchAsync(async(req , res)=>{

      const result=await orderTrackingServices.forgotOrderAuthenticatorIntoDb(req.body);
     sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: 'Successfully Login',
    data: result,
  });

});


const findByMyOrderTracking:RequestHandler=catchAsync(async(req , res)=>{


  const result=await orderTrackingServices.findByMyOrderTrackingIntoDb(req.user.phone, req.query);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Successfully Find By My TAll Order',
    data: result,
  });
});

const OrderTracking:RequestHandler=catchAsync(async(req , res)=>{

    const result=await orderTrackingServices.OrderTrackingIntoDb(req.params.orderId);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Successfully Find By Order Tracking',
    data: result,
  });
});


const changeOrderTrackingStatus:RequestHandler=catchAsync(async(req , res)=>{


    const result=await orderTrackingServices.changeOrderTrackingStatusIntoDb(req.params.orderId, req.body);
    sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Successfully Change Tracking Status',
    data: result,
  });

})




const orderTrackingController={
     forgotOrderAuthenticator,
     findByMyOrderTracking,
      OrderTracking,
      changeOrderTrackingStatus
};

export default orderTrackingController;