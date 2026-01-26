

import { Schema, model } from "mongoose";
import { TUser, UserModel } from "./user.interface";
import { PROVIDER_AUTH, USER_ACCESSIBILITY, USER_ROLE } from "./user.constant";
import bcrypt from "bcrypt";
import config from "../../app/config";

// Define the TSales schema
const TUserSchema = new Schema<TUser, UserModel>({

    name: {
        type: String,
        required: [true, 'name is Required']
    },
    email: {
        type: String,
        index: true,
        required: [false, 'Email is Not Required']
    },
    password: {
        type: String,
        required: [false, 'password is Required'], select: 0
    },
    photo: {
        type: String,
        required: [false, 'photo is Required'],
        default: null
    },
    role: {
        type: String,
        required:[true , 'role is required'],
        enum: {
            values: [USER_ROLE.shop, USER_ROLE.user, USER_ROLE.admin, USER_ROLE.superAdmin],
            message: '{VALUE} is Not Required'
        },
        index: true,
        default: USER_ROLE.user
    },
    status: {
        type: String,
        required:[true, "status is required"],
        enum: {
            values: [USER_ACCESSIBILITY.isProgress, USER_ACCESSIBILITY.blocked],
            message: '{VALUE} is Not Required'
        },
        index: true,
        default: USER_ACCESSIBILITY.isProgress

    },
    provider:{
        type:String,
        required:[false , "provider is not required"],
        enum:{
            values:[PROVIDER_AUTH.googleAuth],
             message: '{VALUE} is Not Required'
        },
        index: true,
        default: null


    },
    os: {
        type: String,
        required: [false, 'os is Required'],
        default: null

    },
    browser: {
        type: String,
        require: [false, 'browser is Required'],
        default: null
    },
    device: {
        type: String,
        require: [false, 'device is required'],
        default: null
    },
    isVerify: {
        type: Boolean,
        required: [false, 'Is Verify is required'],
        index: true,
        default : false

    },
    verificationCode: {
        type: String,
        required: [false, 'verificationCode code is required'],
        index: true,
    },
    ipAddress: {
        type: String,
        index: true,
        required: [false, 'Is Verify is required'],
        default: null
    },


    isDelete: {
        type: Boolean,
        required: [false, 'isDelete  is not required'],
        default: false
    }

}, {
    timestamps: true
});



TUserSchema.set('toJSON', {
    virtuals: true,
    transform: function (doc, ret) {
        delete ret.password;
        return ret;
    },
});
// mongoose middleware
TUserSchema.pre("save", async function (next) {
  const user = this;
  if (user.isModified("password")) {
    user.password = await bcrypt.hash(
      user.password,
      Number(config.bcrypt_salt_rounds)
    );
  }
  next();
});

TUserSchema.post("save", function (doc, next) {
  doc.password = "";
  next();
});


// midlewere 
TUserSchema.pre('find', function (next) {
    this.find({ isDelete: { $ne: true } })
    next();
});
TUserSchema.pre('aggregate', function (next) {

    this.pipeline().unshift({ $match: { isDelete: { $ne: true } } })
    next();
});
TUserSchema.pre('findOne', function (next) {

    this.find({ isDelete: { $ne: true } })

    next();
});

TUserSchema.statics.isPasswordMatched = async function (
  plainTextPassword: string,
  hashPassword: string,
) {
  const password = await bcrypt.compare(plainTextPassword, hashPassword);
  return password;
};

TUserSchema.statics.isJWTIssuesBeforePasswordChange = async function (
  passwordChangeTimestamp: Date,
  jwtIssuesTime: number,
) {
  const passwordChangeTime = new Date(passwordChangeTimestamp).getTime() / 1000;
  return passwordChangeTime > jwtIssuesTime;
};



TUserSchema.statics.isUserExistByCustomId = async function (id: string) {
    return await users.findById(id).select("");
}

// Export the model

const users = model<TUser, UserModel>('users', TUserSchema);

export default users;
