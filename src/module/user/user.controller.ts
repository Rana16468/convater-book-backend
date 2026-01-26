import { RequestHandler } from 'express';
import catchAsync from '../../utility/catchAsync';
import UserServices from './user.services';

import httpStatus from 'http-status';
import config from '../../app/config';
import sendResponse from '../../utility/sendResponse';

const createUser: RequestHandler = catchAsync(async (req, res) => {
  const result = await UserServices.createUserIntoDb(req.body);
 sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Successfully Change Onboarding Status',
    data: result,
  });
});

const userVarification: RequestHandler = catchAsync(async (req, res) => {
  const result = await UserServices.userVarificationIntoDb(
    req.body.verificationCode
  );
 sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Successfully Varified Your Account",
    data: result,
  });
});




const changePassword: RequestHandler = catchAsync(async (req, res) => {
  const result = await UserServices.changePasswordIntoDb(req.body, req.user.id);
 sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Successfully Change Password",
    data: result,
  });
});

const forgotPassword: RequestHandler = catchAsync(async (req, res) => {
  const result = await UserServices.forgotPasswordIntoDb(req.body);
 sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Successfully Send Email",
    data: result,
  });
});

const verificationForgotUser: RequestHandler = catchAsync(async (req, res) => {
  const result = await UserServices.verificationForgotUserIntoDb(req.body);
 sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Successfully Verify User",
    data: result,
  });
});

const resetPassword: RequestHandler = catchAsync(async (req, res) => {
  const result = await UserServices.resetPasswordIntoDb(req.body);
 sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Successfully Reset Password",
    data: result,
  });
});

const googleAuth: RequestHandler = catchAsync(async (req, res) => {
  const result = await UserServices.googleAuthIntoDb(req.body);

  const { refreshToken, accessToken } = result  as any;
  res.cookie("refreshToken", refreshToken, {
    secure: config?.NODE_ENV === "production",
    httpOnly: true,
  });
 sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Successfully Login",
    data: {
      accessToken,
    },
  });
});


const getUserGrowth: RequestHandler = catchAsync(async (req, res) => {

  const result = await UserServices.getUserGrowthIntoDb(req.query);
 sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Successfully  Find User Growth",
    data: result,
  });

});


const resendVerificationOtp:RequestHandler=catchAsync(async(req , res)=>{

     const result=await UserServices.resendVerificationOtpIntoDb(req.params.email);
     sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Successfully  Resend Verification OTP",
      data: result,
  });
});

const UserController = {
  createUser,
  userVarification,
   changePassword,
   forgotPassword,
   verificationForgotUser,
   resetPassword,
   googleAuth,
   getUserGrowth,
   resendVerificationOtp
};

export default UserController;
