import { model, Model, Schema } from "mongoose";
import { OrderTrackingMethods, TOrderTracking } from "./order_tracking.interface";

const orderTrackingSchema = new Schema<
  TOrderTracking,
  Model<TOrderTracking, {}, OrderTrackingMethods>,
  OrderTrackingMethods
>(
  {
    orderId: { type: String, index:true, required: true, ref: "orders", unique: true },
    orderRealId: { type: Schema.Types.ObjectId, ref: "orders", required: true },

    OrderPlaced: {
      isOrderPlaced: { type: Boolean, default: true },
      orderPlacedDate: { type: Date },
    },
    PaymentVerified: {
      isPaymentVerified: { type: Boolean, default: false },
      PaymentVerifiedDate: { type: Date },
    },
    PrintingStarted: {
      isPrintingStarted: { type: Boolean, default: false },
      PrintingStartedDate: { type: Date },
    },
    PrintingCompleted: {
      isPrintingCompleted: { type: Boolean, default: false },
      PrintingCompletedDate: { type: Date },
    },
    ReadyDelivery: {
      isReadyDelivery: { type: Boolean, default: false },
      ReadyDeliveryDate: { type: Date },
    },
    BookReachedYourCity: {
      isBookReachedYourCity: { type: Boolean, default: false },
      BookReachedYourCityDate: { type: Date },
    },
    OutForDelivery: {
      isOutForDelivery: { type: Boolean, default: false },
      OutForDeliveryDate: { type: Date },
    },
    Delivered: {
      isDelivered: { type: Boolean, default: false },
      DeliveredDate: { type: Date },
    },
    isDelete: { type: Boolean, default: false },
  },
  { timestamps: true }
);
orderTrackingSchema.pre("save", function (next) {
  const now = new Date();

  if (this.isModified("OrderPlaced.isOrderPlaced") && this.OrderPlaced.isOrderPlaced) {
    this.OrderPlaced.orderPlacedDate = now;
  }

  if (this.isModified("PaymentVerified.isPaymentVerified") && this.PaymentVerified.isPaymentVerified) {
    this.PaymentVerified.PaymentVerifiedDate = now;
  }

  if (this.isModified("PrintingStarted.isPrintingStarted") && this.PrintingStarted.isPrintingStarted) {
    this.PrintingStarted.PrintingStartedDate = now;
  }

  if (this.isModified("PrintingCompleted.isPrintingCompleted") && this.PrintingCompleted.isPrintingCompleted) {
    this.PrintingCompleted.PrintingCompletedDate = now;
  }

  if (this.isModified("ReadyDelivery.isReadyDelivery") && this.ReadyDelivery.isReadyDelivery) {
    this.ReadyDelivery.ReadyDeliveryDate = now;
  }

  if (this.isModified("BookReachedYourCity.isBookReachedYourCity") && this.BookReachedYourCity.isBookReachedYourCity) {
    this.BookReachedYourCity.BookReachedYourCityDate = now;
  }

  if (this.isModified("OutForDelivery.isOutForDelivery") && this.OutForDelivery.isOutForDelivery) {
    this.OutForDelivery.OutForDeliveryDate = now;
  }

  if (this.isModified("Delivered.isDelivered") && this.Delivered.isDelivered) {
    this.Delivered.DeliveredDate = now;
  }

  next();
});

function excludeDeleted(this: any, next: Function) {
  this.where({ isDelete: { $ne: true } });
  next();
}

orderTrackingSchema.pre("find", excludeDeleted);
orderTrackingSchema.pre("findOne", excludeDeleted);
orderTrackingSchema.pre("findOneAndUpdate", excludeDeleted);
orderTrackingSchema.pre("aggregate", function (next) {
 this.pipeline().unshift({ $match: { isDelete: { $ne: true } } });
  next();
});


// Static method
orderTrackingSchema.statics.findByCustomOrderId = function (id: string) {
  return this.findOne({ orderId: id });
};

const ordertrackings = model<
  TOrderTracking,
  Model<TOrderTracking, {}, OrderTrackingMethods>
>("ordertrackings", orderTrackingSchema);

export default ordertrackings;
