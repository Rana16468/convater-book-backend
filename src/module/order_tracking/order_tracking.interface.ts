import { Schema, model, Types, Model } from "mongoose";

/* ================================
   Type Interface
================================ */

export interface TOrderTracking {
  orderId: string; // custom id
  orderRealId: Types.ObjectId;

  OrderPlaced: {
    isOrderPlaced: boolean;
    orderPlacedDate: Date;
  };

  PaymentVerified: {
    isPaymentVerified: boolean;
    PaymentVerifiedDate: Date;
  };

  PrintingStarted: {
    isPrintingStarted: boolean;
    PrintingStartedDate: Date;
  };

  PrintingCompleted: {
    isPrintingCompleted: boolean;
    PrintingCompletedDate: Date;
  };

  ReadyDelivery: {
    isReadyDelivery: boolean;
    ReadyDeliveryDate: Date;
  };

  BookReachedYourCity: {
    isBookReachedYourCity: boolean;
    BookReachedYourCityDate: Date;
  };

  OutForDelivery: {
    isOutForDelivery: boolean;
    OutForDeliveryDate: Date;
  };

  Delivered: {
    isDelivered: boolean;
    DeliveredDate: Date;
  };
  isDelete: boolean;
}

export interface ForgotOrderPayload {
   phone: string;
   password: string;
}

export interface OrderTrackingMethods {
  isOrderTrackingByCustomId(
    id: string
  ): Promise<TOrderTracking | null>;
}

