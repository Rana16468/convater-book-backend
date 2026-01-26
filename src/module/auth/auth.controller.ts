import { RequestHandler } from "express";

import AuthServices from "./auth.services";

import httpStatus from 'http-status';
import catchAsync from "../../utility/catchAsync";
import config from "../../app/config";
import sendRespone from "../../utility/sendRespone";


const loginUser: RequestHandler = catchAsync(async (req, res) => {
  const result = await AuthServices.loginUserIntoDb(req.body);

  const { refreshToken, accessToken } = result;
  res.cookie("refreshToken", refreshToken, {
    secure: config.NODE_ENV === "production",
    httpOnly: true,
  });
  sendRespone(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Successfully Login",
    data: {
      accessToken,
    },
  });
});

const refreshToken: RequestHandler = catchAsync(async (req, res) => {
  const { refreshToken } = req.cookies;


  const result = await AuthServices.refreshTokenIntoDb(refreshToken);
  sendRespone(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Access token is Retrived Successfully",
    data: result,
  });
});

const myprofile: RequestHandler = catchAsync(async (req, res) => {
  const result = await AuthServices.myprofileIntoDb(req.user.id);
  sendRespone(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Successfully find my profile",
    data: result,
  });
});

const chnageMyProfile: RequestHandler = catchAsync(async (req, res) => {
  const result = await AuthServices.changeMyProfileIntoDb(
    req as any,
    req.user.id
  );
  sendRespone(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Successfully Change My Profile",
    data: result,
  });
});

const findByAllUsersAdmin: RequestHandler = catchAsync(async (req, res) => {
  const result = await AuthServices.findByAllUsersAdminIntoDb(req.query, req.user.role);

  sendRespone(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Successfully Find All Users",
    data: result,
  });
});

const deleteAccount: RequestHandler = catchAsync(async (req, res) => {
  const result = await AuthServices.deleteAccountIntoDb(req.params.id, req.user.role )
  sendRespone(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Successfully Delete your account ",
    data: result,
  });
});

const isBlockAccount: RequestHandler = catchAsync(async (req, res) => {
  const result = await AuthServices.isBlockAccountIntoDb(
    req.params.id,
    req.body,
    req.user.role
  );
  sendRespone(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Successfully Change Status ",
    data: result,
  });
});



const AuthController = {
  loginUser,
  refreshToken,
  myprofile,
  chnageMyProfile,
  findByAllUsersAdmin,
  deleteAccount,
   isBlockAccount

};

export default AuthController;