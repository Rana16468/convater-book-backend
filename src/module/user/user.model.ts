import { Schema, model } from "mongoose";
import bcrypt from "bcrypt";

import { TUser, UserModel } from "./user.interface";
import { USER_ACCESSIBILITY, USER_ROLE } from "./user.constant";
import config from "../../app/config";

const userSchema = new Schema<TUser, UserModel>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      select: 0, // hide password by default
    },

    photo: {
      type: String,
      required:[false, 'photo is not requited'],
      default: null
    },

    role: {
      type: String,
      enum: [USER_ROLE.admin, USER_ROLE.superAdmin,USER_ROLE.shop, USER_ROLE.user],
      default: USER_ROLE.user
    },

    status: {
      type: String,
      enum: [USER_ACCESSIBILITY.blocked, USER_ACCESSIBILITY.isProgress],
      default: USER_ACCESSIBILITY.isProgress,
    },

    provider: {
      type: String,
      enum: ["googleAuth"],
    },

    os: {
      type: String,
      required: true,
    },

    browser: {
      type: String,
      required: true,
    },
    device: {
      type: String,
      required: true,
    },

    verificationCode: {
      type: String,
      required: false,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },

    isVerify: {
      type: Boolean,
      default: false,
    },

    ipAddress: {
      type: String,
      required: false,
    },

    isDelete: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);
// hash password before save

userSchema.set('toJSON', {
  virtuals: true,
  transform: function (doc, ret) {
    delete ret.password;
    return ret;
  },
});
userSchema.pre("save", async function (next) {
  const user = this;

  if (!user.isModified("password")) {
    return next();
  }

  user.password = await bcrypt.hash(
    user.password,
    Number(config.bcrypt_salt_rounds)
  );

  next();
});


// check user exist
userSchema.statics.isUserExistByCustomId = async function (id: string) {
  return await this.findById(id).select("+password");
};

// password match
userSchema.statics.isPasswordMatched = async function (
  userSendingPassword: string,
  existingPassword: string
) {
  return await bcrypt.compare(userSendingPassword, existingPassword);
};

// check if JWT issued before password change
userSchema.statics.isJWTIssuesBeforePasswordChange = async function (
  passwordChangeTimestamp: Date,
  jwtIssuesTime: number
) {
  const passwordChangeTime = new Date(passwordChangeTimestamp).getTime() / 1000;
  return passwordChangeTime > jwtIssuesTime;
};

const adminusers = model<TUser, UserModel>('adminusers', userSchema);
export default adminusers;