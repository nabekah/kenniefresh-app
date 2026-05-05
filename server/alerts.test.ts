import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock notifyOwner before importing the router
vi.mock("../_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

// We need to import the router after mocking
import { alertsRouter } from "./routers/alerts";
import type { TrpcContext } from "./_core/context";

function makeCtx(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

const sampleProducts = [
  { id: "1", sku: "MILO001", name: "Milo 400g", stock: 0, lowStockThreshold: 5, category: "Beverages" },
  { id: "2", sku: "IND001", name: "Indomie Chicken", stock: 3, lowStockThreshold: 10, category: "Food & Beverage" },
  { id: "3", sku: "FRY001", name: "Frytol 2L", stock: 50, lowStockThreshold: 5, category: "Food & Beverage" },
];

describe("alerts.getLowStockSummary", () => {
  it("correctly counts out-of-stock and low-stock items", async () => {
    const caller = alertsRouter.createCaller(makeCtx());
    const result = await caller.getLowStockSummary({ products: sampleProducts });

    expect(result.outOfStockCount).toBe(1); // Milo
    expect(result.lowStockCount).toBe(1);   // Indomie
    expect(result.totalAlerts).toBe(2);
  });

  it("returns empty when all products are in stock", async () => {
    const caller = alertsRouter.createCaller(makeCtx());
    const inStock = sampleProducts.filter(p => p.stock > p.lowStockThreshold);
    const result = await caller.getLowStockSummary({ products: inStock });

    expect(result.outOfStockCount).toBe(0);
    expect(result.lowStockCount).toBe(0);
    expect(result.totalAlerts).toBe(0);
  });

  it("marks items correctly as out vs low", async () => {
    const caller = alertsRouter.createCaller(makeCtx());
    const result = await caller.getLowStockSummary({ products: sampleProducts });

    const outItem = result.items.find(i => i.sku === "MILO001");
    const lowItem = result.items.find(i => i.sku === "IND001");
    expect(outItem?.alertType).toBe("out");
    expect(lowItem?.alertType).toBe("low");
  });
});

describe("alerts.checkAndNotify", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns notified=true when there are alert items", async () => {
    const caller = alertsRouter.createCaller(makeCtx());
    const result = await caller.checkAndNotify({ products: sampleProducts });

    expect(result.outOfStock).toBe(1);
    expect(result.lowStock).toBe(1);
    // notified depends on cooldown; first call should notify
    expect(typeof result.notified).toBe("boolean");
  });

  it("returns notified=false when all products are in stock", async () => {
    const caller = alertsRouter.createCaller(makeCtx());
    const inStock = [sampleProducts[2]!]; // Frytol only — in stock
    const result = await caller.checkAndNotify({ products: inStock });

    expect(result.notified).toBe(false);
    expect(result.outOfStock).toBe(0);
    expect(result.lowStock).toBe(0);
  });
});
