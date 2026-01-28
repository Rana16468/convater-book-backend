


import { Model } from "mongoose";
import { USER_ROLE } from "./user.constant";
export type TUser = {

  name: string;
  email: string;
  password: string,
  photo?: string,
  role?: 'USER' | 'SHOP' | 'ADMIN',
  status:"isProgress" | "blocked"
  provider?:"googleAuth"
  os: string,
  browser: string,
  creationTime: string,
  device: string,
  verificationCode: string,
  isDeleted: boolean;
  isVerify: boolean;
  ipAddress: string;
  publicKey:string;
  privateKey:string;
  isDelete?: boolean;


}

export interface UserModel extends Model<TUser> {
  // eslint-disable-next-line no-unused-vars
  isUserExistByCustomId(id: string): Promise<TUser>,
  // eslint-disable-next-line no-unused-vars
  isPasswordMatched(
    userSendingPassword: string,
    existingPassword: string,
  ): Promise<boolean>;
  // eslint-disable-next-line no-unused-vars
  isJWTIssuesBeforePasswordChange(
    passwordChangeTimestamp: Date,
    jwtIssuesTime: number,
  ): Promise<boolean>;


}

export type TUserRole = keyof typeof USER_ROLE;

