import mongoose, { ClientSession } from "mongoose";
import ordertrackings from "../module/order_tracking/order_tracking.model";
import orders from "../module/order/order.model";
import { deleteFromS3 } from "./deleteFromS3";
import deleteFileFromCloudinary from "./deleteFileFromCloudinary";
import catchError from "../app/error/catchError";

interface OrderFiles {
  file?: string | null;
  front?: string | null;
  back?: string | null;
}

interface DeletionResult {
  fileDeleted: boolean;
  frontDeleted: boolean;
  backDeleted: boolean;
}

const COMPLETED_ORDER_FILTER = {
  "OrderPlaced.isOrderPlaced": true,
  "PaymentVerified.isPaymentVerified": true,
  "PrintingStarted.isPrintingStarted": true,
  "PrintingCompleted.isPrintingCompleted": true,
  "ReadyDelivery.isReadyDelivery": true,
  "BookReachedYourCity.isBookReachedYourCity": true,
  "OutForDelivery.isOutForDelivery": true,
  "Delivered.isDelivered": true,
} as const;

const ORDER_FILE_FIELDS = "fileData.file coverImages.front coverImages.back";

const hasFiles = ({ file, front, back }: OrderFiles): boolean =>
  Boolean(file || front || back);

// ✅ FIX: Each delete wrapped in try/catch returning boolean
// because deleteFileFromCloudinary now returns void (throws on failure)
const safeDeleteFromS3 = async (url: string): Promise<boolean> => {
  try {
    await deleteFromS3(url);
    return true;
  } catch {
    return false;
  }
};

const safeDeleteFromCloudinary = async (url: string): Promise<boolean> => {
  try {
    await deleteFileFromCloudinary(url); // returns void, throws on failure
    return true;
  } catch {
    return false;
  }
};

const deleteOrderFiles = async ({
  file,
  front,
  back,
}: OrderFiles): Promise<DeletionResult> => {
  // ✅ FIX: Use safe wrappers that always return boolean
  const [fileDeleted, frontDeleted, backDeleted] = await Promise.all([
    file ? safeDeleteFromS3(file) : Promise.resolve(true),
    front ? safeDeleteFromCloudinary(front) : Promise.resolve(true),
    back ? safeDeleteFromCloudinary(back) : Promise.resolve(true),
  ]);

  return { fileDeleted, frontDeleted, backDeleted };
};

const clearOrderFiles = async (
  orderId: mongoose.Types.ObjectId,
  session: ClientSession
): Promise<void> => {
  await orders.findByIdAndUpdate(
    orderId,
    {
      $set: {
        "fileData.file": null,
        "coverImages.front": null,
        "coverImages.back": null,
      },
    },
    { session }
  );
};

const processOrder = async (
  tracking: any,
  session: ClientSession
): Promise<void> => {
  const order = tracking.orderRealId as any;
  if (!order?._id) return;

  const files: OrderFiles = {
    file: order.fileData?.file,
    front: order.coverImages?.front,
    back: order.coverImages?.back,
  };

  if (!hasFiles(files)) {
    console.log(`⏭️  Order ${order._id} already cleaned. Skipping.`);
    return;
  }

  const result = await deleteOrderFiles(files);
  const allDeleted = Object.values(result).every(Boolean);

  if (allDeleted) {
    await clearOrderFiles(order._id, session);
    console.log(`🧹 Successfully cleaned files for order ${order._id}`);
  } else {
    // ✅ FIX: Log exactly which deletions failed for easier debugging
    console.warn(`⚠️  Partial deletion failure for order ${order._id}`, {
      s3File: result.fileDeleted ? "✅" : "❌",
      cloudinaryFront: result.frontDeleted ? "✅" : "❌",
      cloudinaryBack: result.backDeleted ? "✅" : "❌",
    });
  }
};

const autoDeleteOrder = async (): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const completedOrders = await ordertrackings
      .find(COMPLETED_ORDER_FILTER)
      .populate({ path: "orderRealId", select: ORDER_FILE_FIELDS })
      .session(session)
      .lean();

    if (!completedOrders.length) {
      console.log("✅ No completed orders to clean.");
      await session.commitTransaction();
      return;
    }

    console.log(`🔍 Found ${completedOrders.length} completed orders to process.`);

    // ✅ FIX: Use allSettled but log rejected cases so nothing is silently swallowed
    const results = await Promise.allSettled(
      completedOrders.map((tracking) => processOrder(tracking, session))
    );

    results.forEach((result, index) => {
      if (result.status === "rejected") {
        console.error(
          `❌ Failed to process order at index ${index}:`,
          result.reason
        );
      }
    });

    await session.commitTransaction();
    console.log("✅ autoDeleteOrder job completed.");
  } catch (error) {
    await session.abortTransaction();
    catchError(error);
  } finally {
    // ✅ FIX: endSession always in finally, not duplicated in try block
    session.endSession();
  }
};

export default autoDeleteOrder;