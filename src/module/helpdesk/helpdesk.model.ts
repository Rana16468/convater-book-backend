import { Schema, model } from "mongoose";
import { HelpDeskModel, THelpDesk } from "./helpdesk.interface";


const helpDeskSchema = new Schema<THelpDesk, HelpDeskModel>(
  {
    orderId: {
      type: String,
      required: true,
      index: true,
    },
    priority: {
      type: String,
      index:true,
      required: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
    },
    isSolve: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

helpDeskSchema.pre('find', function (next) {
    this.find({ isDelete: { $ne: true } })
    next();
});
helpDeskSchema.pre('aggregate', function (next) {

    this.pipeline().unshift({ $match: { isDelete: { $ne: true } } })
    next();
});
helpDeskSchema.pre('findOne', function (next) {

    this.find({ isDelete: { $ne: true } })

    next();
});


helpDeskSchema.statics.isOrderExistByCustomId = async function (
  id: string
) {
  return await this.findOne({ orderId: id });
};

 const helpdesks = model<THelpDesk, HelpDeskModel>(
  "helpdesks",
  helpDeskSchema
);

export default helpdesks;
