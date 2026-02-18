import { RequestHandler } from "express";
import catchAsync from "../../utility/catchAsync";
import helpDeskServices from "./helpdesk.services";
import sendResponse from "../../utility/sendResponse";
import httpStatus from "http-status";



const createHelpDesk:RequestHandler=catchAsync(async(req , res)=>{

      const result=await helpDeskServices.createHelpDeskIntoDb(req.body);
       sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: 'Successfully  Recorded',
    data: result,
  });
});

const  allHelpDesk:RequestHandler=catchAsync(async(req , res)=>{

      const result=await helpDeskServices.allHelpDeskIntoDb(req.query);
 sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: 'Successfully Find All Help Desk Data',
    data: result,
  });

})


const helpDeskController={
    createHelpDesk,
    allHelpDesk
};

export default helpDeskController;

