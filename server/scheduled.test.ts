// =============================================================
// Tests for the scheduled stock report route
// =============================================================

import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock the notifyOwner helper so we don't make real HTTP calls
vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

import { notifyOwner } from "./_core/notification";
import express from "express";
import request from "supertest";
import { registerScheduledRoutes } from "./scheduledRoutes";

function buildApp() {
  const app = express();
  app.use(express.json());
  registerScheduledRoutes(app as any);
  return app;
}

const sampleProducts = [
  { name: "Milo", sku: "MLO-001", stock: 0, lowStockThreshold: 10, category: "Beverages" },
  { name: "Indomie", sku: "IND-002", stock: 5, lowStockThreshold: 15, category: "Food & Beverage" },
  { name: "Frytol Oil", sku: "FRY-003", stock: 50, lowStockThreshold: 10, category: "Food & Beverage" },
];

describe("POST /api/scheduled/stock-report", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when no products are provided", async () => {
    const app = buildApp();
    const res = await request(app)
      .post("/api/scheduled/stock-report")
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
  });

  it("returns 400 when products array is empty", async () => {
    const app = buildApp();
    const res = await request(app)
      .post("/api/scheduled/stock-report")
      .send({ products: [] });
    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
  });

  it("calls notifyOwner and returns correct summary for mixed stock", async () => {
    const app = buildApp();
    const res = await request(app)
      .post("/api/scheduled/stock-report")
      .send({ products: sampleProducts, reportDate: "Monday, May 5, 2026" });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.summary).toMatchObject({
      total: 3,
      outOfStock: 1,
      lowStock: 1,
      healthy: 1,
    });
    expect(notifyOwner).toHaveBeenCalledOnce();
    const call = (notifyOwner as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.title).toContain("OUT OF STOCK");
    expect(call.content).toContain("Milo");
    expect(call.content).toContain("Indomie");
  });

  it("sends a healthy report when all products are well-stocked", async () => {
    const app = buildApp();
    const healthyProducts = [
      { name: "Frytol Oil", sku: "FRY-003", stock: 50, lowStockThreshold: 10, category: "Food & Beverage" },
      { name: "Omo Detergent", sku: "OMO-004", stock: 30, lowStockThreshold: 8, category: "Household" },
    ];
    const res = await request(app)
      .post("/api/scheduled/stock-report")
      .send({ products: healthyProducts });

    expect(res.status).toBe(200);
    expect(res.body.summary.outOfStock).toBe(0);
    expect(res.body.summary.lowStock).toBe(0);
    expect(res.body.summary.healthy).toBe(2);
    const call = (notifyOwner as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.title).toContain("All Stock Healthy");
  });
});
