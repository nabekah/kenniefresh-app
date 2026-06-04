/**
 * Railway-compatible scheduled tasks using node-cron.
 * Replaces Manus heartbeat/scheduled task system.
 * Runs inside the same server process.
 */
import cron from "node-cron";
import { notifyOwner } from "./railwayNotification";

// Import store helpers — these work with localStorage-based data
// Since the frontend uses localStorage, the server generates a summary
// based on a configurable low-stock threshold

const DEFAULT_LOW_STOCK_THRESHOLD = 10;

/**
 * Generate a stock summary notification.
 * In a full DB-backed setup, this would query the database.
 * For now it sends a reminder to check the inventory dashboard.
 */
async function runDailyStockReport(): Promise<void> {
  const now = new Date();
  const timeStr = now.toLocaleString("en-GH", {
    timeZone: "Africa/Accra",
    dateStyle: "full",
    timeStyle: "short",
  });

  console.log(`[Cron] Running daily stock report at ${timeStr}`);

  await notifyOwner({
    title: "📦 Daily Stock Report — Kenniefresh",
    content: `Good morning! Your daily stock check reminder for ${timeStr}.\n\nPlease visit the Inventory page to review current stock levels, check for low-stock items, and create purchase orders for items that need restocking.\n\nVisit: /inventory`,
  });

  console.log("[Cron] Daily stock report notification sent.");
}

/**
 * Register all scheduled tasks.
 * Call this once during server startup.
 */
export function registerScheduledTasks(): void {
  // Daily stock report at 8:00 AM Ghana time (UTC+0, so 8:00 AM UTC)
  cron.schedule(
    "0 8 * * *",
    async () => {
      try {
        await runDailyStockReport();
      } catch (err) {
        console.error("[Cron] Daily stock report failed:", err);
      }
    },
    {
      timezone: "Africa/Accra",
    }
  );

  console.log("[Cron] Scheduled tasks registered: daily stock report at 08:00 Ghana time");
}
