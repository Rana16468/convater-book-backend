import mongoose from "mongoose";
import users from "../user/user.model";
import { USER_ACCESSIBILITY } from "../user/user.constant";
import { jwtHelpers } from "../../helper/jwtHelpers";
import ApiError from "../../app/error/ApiError";
import httpStatus from "http-status";
import config from "../../app/config";
import {  RequestWithFile } from "./auth.interface";
import { user_search_filed } from "./auth.constant";
import QueryBuilder from "../../app/builder/QueryBuilder";
import { TUser } from "../user/user.interface";
import { sendFileToCloudinary } from "../../utility/sendFileToCloudinary";
import catchError from "../../app/error/catchError";


// ============== SECURITY CONSTANTS ==============
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// ============== LOGIN SERVICE ==============
const loginUserIntoDb = async (payload: {
  email: string;
  password: string;
}) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const isUserExist = await users.findOne(
      {
        $and: [
          { email: payload.email },
          { isVerify: true },
          { status: USER_ACCESSIBILITY.isProgress },
        ],
      },
      { password: 1, _id: 1, isVerify: 1, email: 1, role: 1 },
      { session }
    ).lean();

    if (!isUserExist) {
      // ✅ SECURITY FIX: Generic error message (prevent user enumeration)
      throw new ApiError(
        httpStatus.UNAUTHORIZED,
        "Invalid email or password",
        ""
      );
    }

    if (
      !(await users.isPasswordMatched(payload?.password, isUserExist.password))
    ) {
      throw new ApiError(
        httpStatus.UNAUTHORIZED,
        "Invalid email or password",
        ""
      );
    }

    const jwtPayload = {
      id: isUserExist._id,
      role: isUserExist.role,
      email: isUserExist.email,
    } as any;

    let accessToken: string | null = null;
    let refreshToken: string | null = null;

    if (isUserExist.isVerify) {
      try {
        accessToken = jwtHelpers.generateToken(
          jwtPayload,
          config.jwt_access_secret as string,
          config.expires_in as string
        );

        refreshToken = jwtHelpers.generateToken(
          jwtPayload,
          config.jwt_refresh_secret as string,
          config.refresh_expires_in as string
        );
      } catch (error:unknown) {
         catchError(error, 'login section issues ,generate jwt issues')
        
      }
    }

    await session.commitTransaction();

    return {
      accessToken,
      refreshToken,
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

// ============== REFRESH TOKEN SERVICE ==============
const refreshTokenIntoDb = async (token: string) => {
  try {
    const decoded = jwtHelpers.verifyToken(
      token,
      config.jwt_refresh_secret as string
    );

    const { id } = decoded;
    const isUserExist = await users.findOne(
      {
        $and: [
          { _id: id },
          { isVerify: true },
          { status: USER_ACCESSIBILITY.isProgress },
          { isDelete: false },
        ],
      },
      { _id: 1, isVerify: 1, email: 1, role: 1 }
    );

    if (!isUserExist) {
      throw new ApiError(httpStatus.NOT_FOUND, "User not found", "");
    }

    let accessToken: string | null = null;

    if (isUserExist.isVerify) {
      const jwtPayload = {
        id: isUserExist._id,
        role: isUserExist.role,
        email: isUserExist.email,
      } as any;

      try {
        accessToken = jwtHelpers.generateToken(
          jwtPayload,
          config.jwt_access_secret as string,
          config.expires_in as string
        );
      } catch (error:unknown) {
        catchError(error, "Token generation failed")
      }
    }

    return {
      accessToken,
    };
  } catch (error: unknown) {
     catchError(error,'Invalid or expired refresh token');
  }
};

// ============== GET MY PROFILE SERVICE ==============
const myprofileIntoDb = async (id: string) => {
  try {
    const profile = await users
      .findById(id)
      .select("name email phoneNumber dateOfBirth photo location");

    if (!profile) {
      throw new ApiError(httpStatus.NOT_FOUND, "User not found", "");
    }

    return profile;
  } catch (error: unknown) {
     catchError(error, 'Failed to fetch profile')
  }
};

// ============== UPDATE PROFILE SERVICE ==============
const changeMyProfileIntoDb = async (
  req: RequestWithFile,
  id: string
) => {
  try {
  

    const file = req.file;
    const { name } = req.body as {
      name?: string;
    };

    const updateData: {
      name?: string;
      photo?: string;

    } = {};

    if (name && name.trim()) {
      updateData.name = name.trim();
    }


    if (file) {

      if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          "Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed",
          ""
        );
      }

      if (file.size > MAX_FILE_SIZE) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          "File size exceeds 5MB limit",
          ""
        );
      }

       const path=file?.path?.replace(/\\/g, "/");
      const randomNumber = Math.floor(10000 + Math.random() * 90000);
      const imageName=`${`${`book`}${randomNumber}`.trim()}`;
      
        const  {secure_url}= await sendFileToCloudinary(imageName,path) 
        updateData.photo = secure_url as string
    }

    if (Object.keys(updateData).length === 0) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "No valid data provided for update",
        ""
      );
    }

    const result = await users.findByIdAndUpdate(
      id,
      { $set: { ...updateData } },
      {
        new: true,
        runValidators: true, 
      }
    );

    if (!result) {
      throw new ApiError(httpStatus.NOT_FOUND, "User not found", "");
    }

    return {
      status: true,
      message: "Profile updated successfully",
    };
  } catch (error: unknown) {

    catchError(error, 'Profile update failed')
    
  }
};

// ============== GET ALL USERS (ADMIN ONLY) ==============
const findByAllUsersAdminIntoDb = async (
  query: Record<string, unknown>,
  userRole: string // ✅ SECURITY FIX: Get user role
) => {
  try {
    // ✅ SECURITY FIX: Admin role verification
    if (userRole !== "admin") {
      throw new ApiError(
        httpStatus.FORBIDDEN,
        "Only administrators can access user list",
        ""
      );
    }

    const allUsersdQuery = new QueryBuilder(
      users
        .find({ isVerify: true, isDelete: false })
        .select("-password -isDelete -createdAt -updatedAt -verificationCode") // ✅ SECURITY FIX: Exclude sensitive fields
        .lean(),
      query
    )
      .search(user_search_filed)
      .filter()
      .sort()
      .paginate()
      .fields();

    const all_users = await allUsersdQuery.modelQuery;
    const meta = await allUsersdQuery.countTotal();

    return { meta, all_users };
  } catch (error: unknown) {
     catchError(error,'Failed to fetch users')
  }
};

// ============== DELETE ACCOUNT SERVICE ==============
const deleteAccountIntoDb = async (
  userId: string,

  userRole: string
) => {
  try {
    // ✅ SECURITY FIX: Authorization - user can delete own account or admin can delete any
    if ( userRole !== "admin") {
      throw new ApiError(
        httpStatus.FORBIDDEN,
        "You are not authorized to delete this account",
        ""
      );
    }

    const user = await users.findById(userId);

    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, "User not found", "");
    }

    // ✅ SECURITY FIX: Soft delete - preserve data
    const result = await users.findByIdAndUpdate(
      userId,
      {
        isVerify: false,
        status: USER_ACCESSIBILITY.blocked, 
      },
      { new: true }
    );

    if (!result) {
      throw new ApiError(httpStatus.NOT_FOUND, "Failed to delete account", "");
    }

    return {
      success: true,
      message: "Account deleted successfully",
    };
  } catch (error: unknown) {
      catchError(error,'Account deletion failed')
  }
};

// ============== BLOCK/UNBLOCK ACCOUNT SERVICE (ADMIN ONLY) ==============
const isBlockAccountIntoDb = async (
  id: string,
  payload: Partial<TUser>,
  userRole: string // ✅ SECURITY FIX: Get user role
) => {
  try {
    // ✅ SECURITY FIX: Admin role verification
    if (userRole !== "admin") {
      throw new ApiError(
        httpStatus.FORBIDDEN,
        "Only administrators can block/unblock accounts",
        ""
      );
    }

    if (!payload.status) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Status is required",
        ""
      );
    }

    // ✅ SECURITY FIX: Validate status value
    const validStatuses = [
      USER_ACCESSIBILITY.isProgress,
      USER_ACCESSIBILITY.blocked
    ];

    if (!validStatuses.includes(payload.status)) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Invalid status value",
        ""
      );
    }

    const result = await users.findByIdAndUpdate(
      id,
      { status: payload.status },
      { new: true, runValidators: true } 
    );

    if (!result) {
      throw new ApiError(httpStatus.NOT_FOUND, "User not found", "");
    }

    return {
      success: true,
      message: `User account ${payload.status === USER_ACCESSIBILITY.blocked ? USER_ACCESSIBILITY.blocked : USER_ACCESSIBILITY.isProgress} successfully`,
    };
  } catch (error: unknown) {
      catchError(error,'Block account operation failed')
  }
};

// ============== EXPORT SERVICES ==============
const AuthServices = {
  loginUserIntoDb,
  refreshTokenIntoDb,
  myprofileIntoDb,
  changeMyProfileIntoDb,
  findByAllUsersAdminIntoDb,
  deleteAccountIntoDb,
  isBlockAccountIntoDb,
};

export default AuthServices;