
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

// ✅ Fix 2: Computed at call time via a function
const getCompletedOrderFilter = () => {
  const twoDayAgo = new Date();
twoDayAgo .setDate(twoDayAgo .getDate() - 2);

  return {
    "OrderPlaced.isOrderPlaced": true,
    "PaymentVerified.isPaymentVerified": false,
    "PrintingStarted.isPrintingStarted": false,
    "PrintingCompleted.isPrintingCompleted": false,
    "ReadyDelivery.isReadyDelivery": false,
    "BookReachedYourCity.isBookReachedYourCity": false,
    "OutForDelivery.isOutForDelivery": false,
    "Delivered.isDelivered": false,
    createdAt: { $lte:twoDayAgo  },
  } as const;
};

const ORDER_FILE_FIELDS = "fileData.file coverImages.front coverImages.back";


const hasFiles = ({ file, front, back }: OrderFiles): boolean =>
  Boolean(file || front || back);

const deleteOrderFiles = async ({
  file,
  front,
  back,
}: OrderFiles): Promise<DeletionResult> => {
  const [fileDeleted, frontDeleted, backDeleted] = await Promise.all([
    file ? deleteFromS3(file) : Promise.resolve(true),
    front ? deleteFileFromCloudinary(front) : Promise.resolve(true),
    back ? deleteFileFromCloudinary(back) : Promise.resolve(true),
  ]);

  return { fileDeleted, frontDeleted, backDeleted };
};

// ✅ Fix 1: Use correct fields for deletion queries
const clearOrderFiles = async (
  orderId: mongoose.Types.ObjectId,
  session: ClientSession
): Promise<void> => {
  await orders.findOneAndDelete({ _id: orderId }, { session });
  await ordertrackings.findOneAndDelete({ orderRealId: orderId }, { session });
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
    console.warn(`⚠️  Partial deletion failure for order ${order._id}`, result);
  }
};


const autoDeleteUnorganizedOrder = async (): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();


  try {
    // ✅ Fix 2: Use function to get fresh filter on each run
    const completedOrders = await ordertrackings
      .find(getCompletedOrderFilter())
      .populate({ path: "orderRealId", select: ORDER_FILE_FIELDS })
      .session(session)
      .lean();

    if (!completedOrders.length) {
      console.log("✅ No completed orders to clean.");
      await session.commitTransaction();
      return;
    }

    console.log(`🔍 Found ${completedOrders.length} completed orders to process.`);

    // ✅ Fix 3: Use sequential processing to keep transaction consistent
    for (const tracking of completedOrders) {
      try {
        await processOrder(tracking, session);
      } catch (err) {
        console.warn(`⚠️  Failed to process order, skipping:`, err);
      }
    }

    await session.commitTransaction();
    console.log("✅ autoDeleteOrder job completed.");
  } catch (error) {
    await session.abortTransaction();
    catchError(error);
  } finally {
    session.endSession();
  }
};

export default autoDeleteUnorganizedOrder;




// const autoDeleteUnorganizedOrder=async()=>{}



// import mongoose from "mongoose";
// import catchError from "../app/error/catchError";
// import ordertrackings from "../module/order_tracking/order_tracking.model";
// import { deleteFromS3 } from "./deleteFromS3";
// import deleteFileFromCloudinary from "./deleteFileFromCloudinary";
// import orders from "../module/order/order.model";
// const autoDeleteOrder = async () => {
//   const session = await mongoose.startSession();
//   try {
//     session.startTransaction();
//     const completedOrders = await ordertrackings
//       .find({
//         "OrderPlaced.isOrderPlaced": true,
//         "PaymentVerified.isPaymentVerified": true,
//         "PrintingStarted.isPrintingStarted": true,
//         "PrintingCompleted.isPrintingCompleted": true,
//         "ReadyDelivery.isReadyDelivery": true,
//         "BookReachedYourCity.isBookReachedYourCity": true,
//         "OutForDelivery.isOutForDelivery": true,
//         "Delivered.isDelivered": true,
//       })
//       .populate({
//         path: "orderRealId",
//         select: `
//           fileData.file
//           coverImages.front
//           coverImages.back
//         `,
//       })
//       .session(session);
//       console.log("completedOrders",completedOrders)
//     if (!completedOrders.length) {
//       console.log("✅ No completed orders to clean.");
//       await session.commitTransaction();
//       session.endSession();
//       return;
//     }
//     for (const tracking of completedOrders) {
//       const order = tracking.orderRealId as any;
//       if (!order) continue;
//       const file = order.fileData?.file;
//       const front = order.coverImages?.front;
//       const back = order.coverImages?.back;
//       // Skip if already cleaned
//       if (!file && !front && !back) continue;
//       let fileDeleted = false;
//       let frontDeleted = false;
//       let backDeleted = false;
//       // Delete S3 file
//       if (file) {
//         fileDeleted = await deleteFromS3(file);
//         console.log(fileDeleted);
//       }
//       // Delete Cloudinary front
//       if (front) {
//         frontDeleted = await deleteFileFromCloudinary(front);
//         console.log(frontDeleted);
//       }
//       // Delete Cloudinary back
//       if (back) {
//         backDeleted = await deleteFileFromCloudinary(back);
//         console.log(backDeleted);
//       }
//       // ✅ Only update DB if ALL deletions succeeded
//       if (fileDeleted && frontDeleted && backDeleted) {
//         await orders.findByIdAndUpdate(
//           order._id,
//           {
//             $set: {
//               "fileData.file": null,
//               "coverImages.front": null,
//               "coverImages.back": null,
//             },
//           },
//           { session }
//         );
//         console.log(`🧹 Cleaned files for order ${order._id}`);
//       } else {
//         console.warn(
//           `⚠️ Partial delete failed for order ${order._id}`,
//           { fileDeleted, frontDeleted, backDeleted }
//         );
//       }
//     }
//     await session.commitTransaction();
//     session.endSession();
//   } catch (error) {
//     await session.abortTransaction();
//     session.endSession();
//     catchError(error);
//   }
// };
// export default autoDeleteOrder;
