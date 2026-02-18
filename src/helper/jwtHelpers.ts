import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";

const generateToken = (
  payload: { email?: string; role?: string; id?: string },
  secret: string,
  expiresIn: string | number = "1h"
): string => {
  const options: {} = { expiresIn };
  return jwt.sign(payload, secret, options);
};

const verifyToken = (token: string, secret: string): JwtPayload => {
      // console.log("secret",{token,secret});
  return jwt.verify(token, secret) as JwtPayload;
};

const generateOrderToken = (
  payload: {
    orderId: string;
    name: string;
    phone: string;
    _id: string;
  },
  secret: string,
  expiresIn:  string | number = "1h"
): string => {
  const options: {} = { expiresIn };
  return jwt.sign(payload, secret, options);
};

const verifyOrderToken = (token: string, secret: string): JwtPayload => {
  return jwt.verify(token, secret) as JwtPayload;
};



export const jwtHelpers = {
  generateToken,
  verifyToken,
  generateOrderToken,
   verifyOrderToken
};