import { RequestHandler } from "express";
import catchAsync from "../../utility/catchAsync";
import orderServices from "./order.services";
import sendResponse from "../../utility/sendResponse";
import httpStatus from "http-status";



const createOrder:RequestHandler=catchAsync(async(req , res)=>{

      const result=await orderServices.createOrderIntoDb(req.body);
 sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: 'Successfully Order Recorded',
    data: result,
  });

});


const orderAuthenticator:RequestHandler=catchAsync(async(req , res)=>{

    const result=await orderServices.orderAuthenticatorIntoDb(req.body);
 sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: 'Successfully  Login',
    data: result,
  });

});

const  latestOrderTracking:RequestHandler=catchAsync(async(req , res)=>{

    const result=await orderServices.latestOrderTrackingIntoDb( req.user.orderId);
 sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: 'Successfully Find By Latest Order Tracking Data',
    data: result,
  });

})



const orderController={
    createOrder,
    orderAuthenticator,
     latestOrderTracking
};

export default orderController;