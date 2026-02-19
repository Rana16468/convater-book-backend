import helpdesks from "../module/helpdesk/helpdesk.model";
import catchError from "../app/error/catchError";

const autoDeleteHelpDesk = async (): Promise<void> => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const result = await helpdesks.deleteMany({
      isSolve: true,
      updatedAt: { $lte: sevenDaysAgo },
    });

    if (result.deletedCount && result.deletedCount > 0) {
      console.log(`✅ Auto-delete: ${result.deletedCount} solved helpdesk records removed.`);
    } else {
      console.log("ℹ️ Auto-delete: No solved helpdesk records found.");
    }
  } catch (error) {
    console.error("❌ Auto-delete helpdesk failed:", error);
    catchError(error);
  }
};

export default autoDeleteHelpDesk;
