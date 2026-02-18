import httpStatus from "http-status";
import catchError from "../../app/error/catchError";
import orders from "../order/order.model";
import { THelpDesk } from "./helpdesk.interface";
import ApiError from "../../app/error/ApiError";
import helpdesks from "./helpdesk.model";
import QueryBuilder from "../../app/builder/QueryBuilder";

const MAX_TICKETS_PER_DAY = 3;

const createHelpDeskIntoDb = async (payload: THelpDesk) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // Run independent checks in parallel
    const [orderExists, allTimeCount, todayCount] = await Promise.all([
      orders.exists({ orderId: payload.orderId }),
      helpdesks.exists({ orderId: payload.orderId }),
      helpdesks.countDocuments({
        orderId: payload.orderId,
        createdAt: { $gte: startOfDay, $lte: endOfDay },
      }),
    ]);

    if (!orderExists) {
      throw new ApiError(httpStatus.NOT_FOUND, "This Order ID is not found", "");
    }

    if (allTimeCount) {
      return { status: false, message: "This Help Desk is already recorded" };
    }

    if (todayCount >= MAX_TICKETS_PER_DAY) {
      throw new ApiError(
        httpStatus.TOO_MANY_REQUESTS,
        `You can only create ${MAX_TICKETS_PER_DAY} help desk tickets per day for this order`,
        ""
      );
    }

     await helpdesks.create(payload);

    return {
      status: true,
      message: "Help desk ticket created successfully"
    };
  } catch (error) {
    catchError(error);
  }
};


const allHelpDeskIntoDb = async (query: Record<string, unknown>) => {
  try {
    const allHelpDeskQuery = new QueryBuilder(
      helpdesks
        .find({})
        .select("-isDelete -updatedAt") // remove only what really exists
        .lean(),
      query
    )
      .search(["orderId", "subject", "category"]) // searchable fields
      .filter()   // priority, category, isSolve
      .sort()     // sort by createdAt
      .paginate()
      .fields();

    const all_help_desk = await allHelpDeskQuery.modelQuery;
    const meta = await allHelpDeskQuery.countTotal();

    return { meta, all_help_desk };
  } catch (error: unknown) {
    catchError(error, "Failed to fetch help desk tickets");
  }
};





const helpDeskServices = { createHelpDeskIntoDb, allHelpDeskIntoDb };

export default helpDeskServices;