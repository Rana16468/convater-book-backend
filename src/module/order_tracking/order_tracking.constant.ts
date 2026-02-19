import { TOrderTracking } from "./order_tracking.interface";

export const allowedFields: (keyof TOrderTracking)[] = [
  "OrderPlaced",
  "PaymentVerified",
  "PrintingStarted",
  "PrintingCompleted",
  "ReadyDelivery",
  "BookReachedYourCity",
  "OutForDelivery",
  "Delivered",
];

// Order flow sequence
export const statusFlow: readonly (keyof TOrderTracking)[] = [
  "OrderPlaced",
  "PaymentVerified",
  "PrintingStarted",
  "PrintingCompleted",
  "ReadyDelivery",
  "BookReachedYourCity",
  "OutForDelivery",
  "Delivered",
] as const;

// Mapping stage → boolean field name
export const statusBooleanFieldMap: Record<keyof TOrderTracking, string> = {
  OrderPlaced: "isOrderPlaced",
  PaymentVerified: "isPaymentVerified",
  PrintingStarted: "isPrintingStarted",
  PrintingCompleted: "isPrintingCompleted",
  ReadyDelivery: "isReadyDelivery",
  BookReachedYourCity: "isBookReachedYourCity",
  OutForDelivery: "isOutForDelivery",
  Delivered: "isDelivered",
  // Other fields in TOrderTracking are ignored
  orderId: "",
  orderRealId: "",
  isDelete: "",
};