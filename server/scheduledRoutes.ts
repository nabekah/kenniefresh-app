// =============================================================
// Kenniefresh.biz — Scheduled Task Routes
// POST /api/scheduled/stock-report
// Called daily at 8 AM by the Manus scheduled task agent.
// Accepts a JSON body with product stock data and sends an
// owner notification summarising the day's stock status.
// =============================================================

import type { Express, Request, Response } from "express";
import { notifyOwner } from "./_core/notification";

type StockProduct = {
  name: string;
  sku: string;
  stock: number;
  lowStockThreshold: number;
  category: string;
};

export function registerScheduledRoutes(app: Express) {
  // ── Daily Stock Report ──────────────────────────────────────
  app.post("/api/scheduled/stock-report", async (req: Request, res: Response) => {
    try {
      const { products, reportDate } = req.body as {
        products: StockProduct[];
        reportDate?: string;
      };

      if (!Array.isArray(products) || products.length === 0) {
        res.status(400).json({ ok: false, error: "No products provided" });
        return;
      }

      const outOfStock = products.filter(p => p.stock === 0);
      const lowStock = products.filter(p => p.stock > 0 && p.stock <= p.lowStockThreshold);
      const healthy = products.filter(p => p.stock > p.lowStockThreshold);

      const date = reportDate ?? new Date().toLocaleDateString("en-GH", {
        timeZone: "Africa/Accra",
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      // Build the notification message
      const title = outOfStock.length > 0
        ? `🚨 Kenniefresh Morning Report — ${outOfStock.length} OUT OF STOCK`
        : lowStock.length > 0
          ? `⚠️ Kenniefresh Morning Report — ${lowStock.length} Low Stock`
          : `✅ Kenniefresh Morning Report — All Stock Healthy`;

      let content = `📅 ${date}\n`;
      content += `📦 Total Products: ${products.length} | ✅ Healthy: ${healthy.length} | ⚠️ Low: ${lowStock.length} | 🚨 Out: ${outOfStock.length}\n\n`;

      if (outOfStock.length > 0) {
        content += `🚨 OUT OF STOCK (${outOfStock.length} items):\n`;
        outOfStock.forEach(p => {
          content += `  • ${p.name} (SKU: ${p.sku}) — ZERO STOCK\n`;
        });
        content += "\n";
      }

      if (lowStock.length > 0) {
        content += `⚠️ LOW STOCK (${lowStock.length} items):\n`;
        lowStock.forEach(p => {
          content += `  • ${p.name} (SKU: ${p.sku}) — ${p.stock} left (min: ${p.lowStockThreshold})\n`;
        });
        content += "\n";
      }

      if (outOfStock.length === 0 && lowStock.length === 0) {
        content += `✅ All ${healthy.length} products are well-stocked. Great job!\n`;
      } else {
        content += `👉 Please restock the items above before opening the shop today.`;
      }

      await notifyOwner({ title, content });

      res.json({
        ok: true,
        summary: {
          total: products.length,
          outOfStock: outOfStock.length,
          lowStock: lowStock.length,
          healthy: healthy.length,
        },
      });
    } catch (err) {
      console.error("[Scheduled] stock-report error:", err);
      res.status(500).json({ ok: false, error: String(err) });
    }
  });
}
