// =============================================================
// Kenniefresh.biz — Inventory Alerts Router
// Handles: low-stock detection, owner notifications, alert history
// =============================================================

import { publicProcedure, router } from "../_core/trpc";
// Use Railway-compatible in-app notification (no external service required)
import { notifyOwner } from "../railwayNotification";
import { z } from "zod";

// ─── In-memory alert log (survives server restarts via client localStorage) ──
// We keep a simple server-side deduplication map so we don't spam
// the owner with the same alert every minute.
const notifiedSkus = new Map<string, number>(); // sku -> last notified timestamp
const NOTIFY_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour between repeat alerts per SKU

const LowStockItemSchema = z.object({
  id: z.string(),
  sku: z.string(),
  name: z.string(),
  stock: z.number(),
  lowStockThreshold: z.number(),
  category: z.string(),
});

export const alertsRouter = router({

  // ── Check a list of products and notify owner for low/out-of-stock ──
  checkAndNotify: publicProcedure
    .input(z.object({
      products: z.array(LowStockItemSchema),
    }))
    .mutation(async ({ input }) => {
      const now = Date.now();
      const outOfStock: typeof input.products = [];
      const lowStock: typeof input.products = [];

      for (const p of input.products) {
        if (p.stock === 0) outOfStock.push(p);
        else if (p.stock <= p.lowStockThreshold) lowStock.push(p);
      }

      const toNotify = [...outOfStock, ...lowStock].filter(p => {
        const last = notifiedSkus.get(p.sku) ?? 0;
        return now - last > NOTIFY_COOLDOWN_MS;
      });

      if (toNotify.length === 0) {
        return { notified: false, outOfStock: outOfStock.length, lowStock: lowStock.length };
      }

      // Build notification message
      const outLines = outOfStock
        .filter(p => toNotify.includes(p))
        .map(p => `• ${p.name} (SKU: ${p.sku}) — OUT OF STOCK`);
      const lowLines = lowStock
        .filter(p => toNotify.includes(p))
        .map(p => `• ${p.name} (SKU: ${p.sku}) — ${p.stock} left (threshold: ${p.lowStockThreshold})`);

      const allLines = [...outLines, ...lowLines];
      const title = outOfStock.length > 0
        ? `🚨 Kenniefresh: ${outOfStock.length} item(s) OUT OF STOCK`
        : `⚠️ Kenniefresh: ${lowStock.length} item(s) running LOW`;

      const content =
        `Inventory Alert — ${new Date().toLocaleString("en-GH", { timeZone: "Africa/Accra" })}\n\n` +
        allLines.join("\n") +
        `\n\nPlease restock these items to avoid stockouts.`;

      try {
        await notifyOwner({ title, content });
        // Mark as notified
        for (const p of toNotify) {
          notifiedSkus.set(p.sku, now);
        }
      } catch (err) {
        console.warn("[Alerts] notifyOwner failed:", err);
      }

      return {
        notified: true,
        outOfStock: outOfStock.length,
        lowStock: lowStock.length,
        alertedItems: toNotify.map(p => p.name),
      };
    }),

  // ── Get current low-stock summary (for UI badge) ──
  getLowStockSummary: publicProcedure
    .input(z.object({
      products: z.array(LowStockItemSchema),
    }))
    .query(({ input }) => {
      const outOfStock = input.products.filter(p => p.stock === 0);
      const lowStock = input.products.filter(p => p.stock > 0 && p.stock <= p.lowStockThreshold);
      return {
        outOfStockCount: outOfStock.length,
        lowStockCount: lowStock.length,
        totalAlerts: outOfStock.length + lowStock.length,
        items: [
          ...outOfStock.map(p => ({ ...p, alertType: "out" as const })),
          ...lowStock.map(p => ({ ...p, alertType: "low" as const })),
        ],
      };
    }),
});
