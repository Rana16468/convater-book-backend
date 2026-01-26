import httpStatus from 'http-status';
import ApiError from '../../app/error/ApiError';
import emailcontext from '../../utility/emailcontext/sendvarificationData';
import sendEmail from '../../utility/sendEmail';
import users from './user.model';
import { USER_ACCESSIBILITY } from './user.constant';
import { TUser } from './user.interface';
import mongoose from 'mongoose';
import crypto from "crypto";
import { jwtHelpers } from '../../helper/jwtHelpers';
import config from '../../app/config';
import bcrypt from 'bcrypt';
import emailContext from '../../utility/emailcontext/sendvarificationData';



 const generateOTP = (): { otp: string; hash: string } => {
  // 6-digit secure OTP
  const otp = crypto.randomInt(100000, 1000000).toString();

  // Hash OTP before storing
  const hash = crypto
    .createHash("sha256")
    .update(otp)
    .digest("hex");

  return { otp, hash };
};

const createUserIntoDb = async (payload: TUser) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();
    const isExistUser = await users.findOne(
      {
        email: payload.email,
        isVerify: true,
        status: USER_ACCESSIBILITY.isProgress,
      },
      { _id: 1 },
      { session }
    );

    if (isExistUser) {
      throw new ApiError(
        httpStatus.CONFLICT,
        "This email already exists",
        ""
      );
    }
    const { otp, hash } = generateOTP();

    payload.verificationCode = hash;
    const user = new users(payload);
    await user.save({ session });

    await session.commitTransaction();
    session.endSession();
    await sendEmail(
      payload.email,
      emailcontext.sendVerificationData(
        payload.email,
        Number(otp), // ✅ keep as string
        "User Verification Email"
      ),
      "Verification OTP Code"
    );

    return {
      status: true,
      message: "Check your email for verification code",
    };
  } catch (error: any) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();

    throw new ApiError(
      error.statusCode || httpStatus.SERVICE_UNAVAILABLE,
      error.message || "Server unavailable",
      error
    );
  }
};


const userVarificationIntoDb = async (verificationCode: string) => {
  if (!verificationCode) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Verification code is required", ""
    );
  }

  const hashedCode = crypto
    .createHash("sha256")
    .update(verificationCode)
    .digest("hex");

  const user = await users.findOneAndUpdate({
    verificationCode: hashedCode,
    
  },{isVerify:true},{new:true , upsert:true});

  if (!user) {
    throw new ApiError(
      httpStatus.UNAUTHORIZED,
      "Invalid or expired verification code", ""
    );
  }

  // One-time use


  const jwtPayload = {
    id: user._id.toString(),
    role: user.role,
    email: user.email,
  };
  
  

  const accessToken = jwtHelpers.generateToken(
    jwtPayload,
    config.jwt_access_secret as string,
    config.expires_in as string
  );

  return {
    message: "User verification successful",
    accessToken,
  };
};

const chnagePasswordIntoDb = async (
  payload: {
    newpassword: string;
    oldpassword: string;
  },
  id: string,
) => {
  try {
    const isUserExist = await users.findOne(
      {
        $and: [
          { _id: id },
          { isVerify: true },
          { status: USER_ACCESSIBILITY.isProgress },
          
        ],
      },
      { password: 1 },
    );

    if (!isUserExist) {
      throw new ApiError(httpStatus.NOT_FOUND, 'User not found', '');
    }

    if (
      !(await users.isPasswordMatched(
        payload.oldpassword,
        isUserExist?.password,
      ))
    ) {
      throw new ApiError(
        httpStatus.FORBIDDEN,
        'Old password does not match',
        '',
      );
    }

    const newHashedPassword = await bcrypt.hash(
      payload.newpassword,
      Number(config.bcrypt_salt_rounds),
    );

    const updatedUser = await users.findByIdAndUpdate(
      id,
      { password: newHashedPassword },
      { new: true, upsert: true },
    );
    if (!updatedUser) {
      throw new ApiError(
        httpStatus.FORBIDDEN,
        'password  change database error',
        '',
      );
    }

    return {
      success: true,
      message: 'Password updated successfully',
    };
  } catch (error: any) {
    throw new ApiError(
      httpStatus.SERVICE_UNAVAILABLE,
      'Password change failed',
      error,
    );
  }
};

// forgot password

const forgotPasswordIntoDb = async (payload: string | { email: string }) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    let emailString: string;

    if (typeof payload === 'string') {
      emailString = payload;
    } else if (payload && typeof payload === 'object' && 'email' in payload) {
      emailString = payload.email;
    } else {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid email format', '');
    }

    const isExistUser = await users.findOne(
      {
        $and: [
          { email: emailString },
          { isVerify: true },
          { status: USER_ACCESSIBILITY.isProgress },
        ],
      },
      { _id: 1, provider: 1 },
      { session },
    );

    if (!isExistUser) {
      throw new ApiError(httpStatus.NOT_FOUND, 'User not found', '');
    }

    const { otp, hash } = generateOTP();

    

    const result = await users.findOneAndUpdate(
      { _id: isExistUser._id },
      { verificationCode:  hash },
      {
        new: true,
        upsert: true,
        projection: { _id: 1, email: 1 },
        session,
      },
    );

    if (!result) {
      throw new ApiError(httpStatus.NOT_FOUND, 'OTP forgot section issues', '');
    }

    try {
      await sendEmail(
        emailString,
        emailContext.sendVerificationData(
          emailString,
          Number(otp),
          ' Forgot Password Email',
        ),
        'Forgot Password Verification OTP Code',
      );
    } catch (emailError: any) {
      await session.abortTransaction();
      session.endSession();
      throw new ApiError(
        httpStatus.SERVICE_UNAVAILABLE,
        'Failed to send verification email',
        emailError,
      );
    }

    await session.commitTransaction();
    session.endSession();

    return { status: true, message: 'Checked Your Email' };
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();

    throw new ApiError(
      httpStatus.SERVICE_UNAVAILABLE,
      'Password change failed',
      error,
    );
  }
};



const verificationForgotUserIntoDb = async (
  otp: string
): Promise<string> => {
  if (!otp) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "OTP is required", ""
    );
  }

  // Hash incoming OTP
  const hashedCode = crypto
    .createHash("sha256")
    .update(otp)
    .digest("hex");

  const user = await users.findOne(
    {
      verificationCode: hashedCode,
      verificationCodeExpiresAt: { $gt: new Date() },
      isVerify: true,
      status: USER_ACCESSIBILITY.isProgress,
    },
    {
      _id: 1,
      email: 1,
      role: 1,
    }
  );

  if (!user) {
    throw new ApiError(
      httpStatus.UNAUTHORIZED,
      "Invalid or expired OTP",""
    );
  }

  const jwtPayload = {
    id: user._id.toString(),
    role: user.role,
    email: user.email,
  };

  const accessToken = jwtHelpers.generateToken(
    jwtPayload,
    config.jwt_access_secret as string,
    config.expires_in as string
  );

  // One-time OTP (invalidate immediately)
  await users.updateOne(
    { _id: user._id },
    {
      $unset: {
        verificationCode: "",
        verificationCodeExpiresAt: "",
      },
    }
  );

  return accessToken;
};


const resetPasswordIntoDb = async (payload: {
  userId: string;
  password: string;
}) => {
  try {
    const isExistUser = await users.findOne(
      {
        $and: [
          { _id: payload.userId },
          { isVerify: true },
          { isDelete: false },
          { status: USER_ACCESSIBILITY.isProgress },
        ],
      },
      { _id: 1 },
    );
    if (!isExistUser) {
      throw new ApiError(
        httpStatus.NOT_FOUND,
        'some issues by the  reset password section',
        '',
      );
    }
    payload.password = await bcrypt.hash(
      payload.password,
      Number(config.bcrypt_salt_rounds),
    );

    const result = await users.findByIdAndUpdate(
      isExistUser._id,
      { password: payload.password },
      { new: true, upsert: true },
    );
    return result && { status: true, message: 'successfylly reset password' };
  } catch (error: any) {
    throw new ApiError(
      httpStatus.SERVICE_UNAVAILABLE,
      'server unavailable  reset password into db function',
      error,
    );
  }
};

const googleAuthIntoDb = async (payload: TUser) => {
  try {
   
    let user = await users.findOne(
      {
        email: payload.email,
        isVerify: true,
      },
      { _id: 1, role: 1, email: 1, isVerify: 1, },
    );

    let jwtPayload;

    if (!user) {
     
      payload.isVerify = true;
      const newUser = new users(payload);
      user = await newUser.save();
    }

    jwtPayload = {
      id: user._id.toString(),
      role: user.role,
      email: user.email,
    };
  
    if (user.isVerify) {
      const accessToken = jwtHelpers.generateToken(
        jwtPayload,
        config.jwt_access_secret as string,
        config.expires_in as string,
      );

      const refreshToken = jwtHelpers.generateToken(
        jwtPayload,
        config.jwt_refresh_secret as string,
        config.refresh_expires_in as string,
      );




      return { accessToken, refreshToken };
    }

    // If user is not verified
    return { accessToken: null, refreshToken: null };
  } catch (error: any) {
    throw new ApiError(
      httpStatus.SERVICE_UNAVAILABLE,
      error.message || "Google auth failed",
      error,
    );
  }
};




const getUserGrowthIntoDb = async (query: { year?: string }) => {
  try {
    const year = query.year ? parseInt(query.year) : new Date().getFullYear();
    const previousYear = year - 1;

    // Get current year stats
    const currentYearStats = await users.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(`${year}-01-01T00:00:00.000Z`),
            $lte: new Date(`${year}-12-31T23:59:59.999Z`),
          },
        },
      },
      {
        $group: {
          _id: { month: { $month: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          month: "$_id.month",
          count: 1,
          _id: 0,
        },
      },
      {
        $group: {
          _id: null,
          totalCount: { $sum: "$count" },
          data: { $push: { month: "$month", count: "$count" } },
        },
      },
      {
        $project: {
          totalCount: 1,
          months: {
            $map: {
              input: { $range: [1, 13] },
              as: "m",
              in: {
                year: year,
                month: "$$m",
                count: {
                  $let: {
                    vars: {
                      matched: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: "$data",
                              as: "d",
                              cond: { $eq: ["$$d.month", "$$m"] },
                            },
                          },
                          0,
                        ],
                      },
                    },
                    in: { $ifNull: ["$$matched.count", 0] },
                  },
                },
              },
            },
          },
        },
      },
    ]);

    // Get previous year total count
    const previousYearStats = await users.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(`${previousYear}-01-01T00:00:00.000Z`),
            $lte: new Date(`${previousYear}-12-31T23:59:59.999Z`),
          },
        },
      },
      {
        $count: "totalCount",
      },
    ]);

    const currentYearTotal = currentYearStats[0]?.totalCount || 0;
    const previousYearTotal = previousYearStats[0]?.totalCount || 0;

    // Calculate year-over-year growth percentage
    let yearlyGrowth = 0;
    if (previousYearTotal > 0) {
      yearlyGrowth = ((currentYearTotal - previousYearTotal) / previousYearTotal) * 100;
    } else if (currentYearTotal > 0) {
      yearlyGrowth = 100; // If no users in previous year but users exist in current year
    }

    // Extract monthly stats
    const monthlyStats = currentYearStats[0]?.months || [];

    return {
      monthlyStats,
      yearlyGrowth: parseFloat(yearlyGrowth.toFixed(2)),
      year,
    };
  } catch (error: any) {
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Failed to fetch user creation stats",
      error
    );
  }
};


const resendVerificationOtpIntoDb = async (email: string) => {
  if (!email) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Email is required",""
    );
  }

  // 1️⃣ Find user
  const user = await users.findOne(
    {
      email,
      status: USER_ACCESSIBILITY.isProgress,
    },
    { _id: 1, isVerify: 1 }
  );

  if (!user) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      "This user does not exist in our database", ""
    );
  }

  if (user.isVerify) {
    return {
      status: false,
      message: "This user is already verified",
    };
  }

  // 2️⃣ Generate OTP
  const { otp, hash } = generateOTP();

  // 3️⃣ Update OTP + expiry (invalidate old one)
  await users.updateOne(
    { _id: user._id },
    {
      verificationCode: hash,
    },
    {upsert:true}
  );

  // 4️⃣ Send email
  await sendEmail(
    email,
    emailContext.sendVerificationData(
      email,
      Number(otp),
      "User Verification Email"
    ),
    "Verification OTP Code"
  );

  return {
    status: true,
    message: "Verification OTP sent successfully",
  };
};

const UserServices = {
  createUserIntoDb,
  userVarificationIntoDb,
  resendVerificationOtpIntoDb,
  getUserGrowthIntoDb,
  googleAuthIntoDb,
  resetPasswordIntoDb,
  verificationForgotUserIntoDb,
  chnagePasswordIntoDb,
  forgotPasswordIntoDb,





};
export default UserServices;
