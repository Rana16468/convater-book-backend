import { Schema, model } from "mongoose";
import bcrypt from "bcrypt";
import { TOrder, OrderModel, TOrderResult } from "./order.interface";
import config from "../../app/config";




const deliverySchema = new Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    password: {
      type: String,
      required: true,
      select: false, 
    },
    district: { type: String, required: true },
    thana: { type: String, required: true },
  },
  { _id: false }
);



const orderSchema = new Schema<TOrder, OrderModel,TOrderResult >(
  {
    coverImages: {
      back: String,
      front: String,
    },

    delivery: {
      type: deliverySchema,
      index:true,

      required: true,
    },

    fileData: {
      file: { type: String, required: true },
      name: { type: String, required: true },
      pages: { type: Number, required: true },
      size: { type: String, required: true },
    },

    orderId: {
      type: String,
      required: true,
      index:true,
      unique: true,
    },

    payment: {
      method: { type: String, required: true },
      totalCost:{ type: Number, required: true },

      transactionId: { type: String, required: true },
      voucher: String,
    },

    preferences: {
      binding: String,
      bookName: String,
      location: String,
      pageType: String,
      printType: String,
      quantity: Number,
      selectedOption: Number,
    },
    
 ipAddress:{
     type: String,
     index:false,
      required: true
 },
    showErrors: Boolean,
    showToast: Boolean,
    uploadStatus: String,
  },
  {
    timestamps: true,
  }
);

/* ------------------------------------------------
   🔐 HASH PASSWORD BEFORE SAVE
------------------------------------------------- */

orderSchema.pre("save", async function (next) {
  const order = this as any;

  if (!order.isModified("delivery.password")) return next();

  order.delivery.password = await bcrypt.hash(
    order.delivery.password,
    Number(config.bcrypt_salt_rounds)
  );

  next();
});


orderSchema.pre('find', function (next) {
    this.find({ isDelete: { $ne: true } })
    next();
});
orderSchema.pre('aggregate', function (next) {

    this.pipeline().unshift({ $match: { isDelete: { $ne: true } } })
    next();
});
orderSchema.pre('findOne', function (next) {

    this.find({ isDelete: { $ne: true } })

    next();
});

/* ------------------------------------------------
   🔑 Compare Password Method
------------------------------------------------- */

orderSchema.statics.comparePassword =  async function (
  plainTextPassword: string,
  hashPassword: string,
) {
  const password = await bcrypt.compare(plainTextPassword, hashPassword);
  return password;
};

/* ------------------------------------------------
   Static Method
------------------------------------------------- */

orderSchema.statics.isOrderExistByCustomId = async function (id: string) {
  return await this.findOne({ orderId: id });
};

 const orders = model<TOrder, OrderModel>("orders", orderSchema);
 export default orders;
