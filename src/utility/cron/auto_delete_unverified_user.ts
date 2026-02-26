// auto_delete_unverified_user.ts
import httpStatus from "http-status";

import ApiError from "../../app/error/ApiError";
import catchError from "../../app/error/catchError";
import adminusers from "../../module/user/user.model";

const AUTO_DELETE_MINUTES = 10;

const auto_delete_unverified_user = async (): Promise<{
  deletedCount: number;
  message: string;
}> => {
  try {

    const thresholdTime = new Date(
      Date.now() - AUTO_DELETE_MINUTES * 60 * 1000
    );

    const deleteResult = await adminusers.deleteMany({
      isVerify: false,
      createdAt: { $lt: thresholdTime },
    });
   

    if (!deleteResult) {
      throw new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Delete operation failed",
        ""
      );
    };

    // console.log(deleteResult)

    return {
      deletedCount: deleteResult.deletedCount || 0,
      message:
        deleteResult.deletedCount && deleteResult.deletedCount > 0
          ? "Unverified users deleted successfully"
          : "No unverified users found to delete",
    };
  } catch (error: unknown) {
    catchError(error, "Cron job failed: auto_delete_unverified_user");
    // console.log("error message auto delete section ")
    return {
      deletedCount: 0,
      message: "Error occurred while deleting unverified users",
    };
  }
};

export default auto_delete_unverified_user;
