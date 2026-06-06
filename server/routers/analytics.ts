import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { sales, expenses, products } from "../../drizzle/schema";
import { gte, lte, and, desc } from "drizzle-orm";

function startOfDay(d: Date) {
  const r = new Date(d); r.setHours(0, 0, 0, 0); return r;
}
function endOfDay(d: Date) {
  const r = new Date(d); r.setHours(23, 59, 59, 999); return r;
}

export const analyticsRouter = router({
  dashboard: protectedProcedure
    .input(z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return {
        totalRevenue: 0, totalProfit: 0, totalExpenses: 0, netProfit: 0,
        totalOrders: 0, avgOrderValue: 0, totalProducts: 0, lowStockCount: 0,
        revenueChart: [], categoryChart: [], topProducts: [], paymentMethods: [],
      };

      const now = new Date();
      const start = input?.startDate ? new Date(input.startDate) : new Date(now.getFullYear(), now.getMonth(), 1);
      const end = input?.endDate ? endOfDay(new Date(input.endDate)) : endOfDay(now);

      // Sales in period
      const salesRows = await db.select().from(sales)
        .where(and(gte(sales.saleDate, start), lte(sales.saleDate, end)))
        .orderBy(desc(sales.saleDate));

      // Expenses in period
      const expenseRows = await db.select().from(expenses)
        .where(and(gte(expenses.expenseDate, start), lte(expenses.expenseDate, end)));

      // Products
      const productRows = await db.select().from(products);

      const totalRevenue = salesRows.reduce((s, r) => s + parseFloat(String(r.total)), 0);
      const totalProfit = salesRows.reduce((s, r) => s + parseFloat(String(r.profit)), 0);
      const totalExpenses = expenseRows.reduce((s, r) => s + parseFloat(String(r.amount)), 0);
      const netProfit = totalProfit - totalExpenses;
      const totalOrders = salesRows.length;
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
      const totalProducts = productRows.length;
      const lowStockCount = productRows.filter(p => p.stock <= p.lowStockThreshold).length;

      // Revenue chart — group by day
      const revenueByDay: Record<string, { revenue: number; profit: number }> = {};
      for (const s of salesRows) {
        const key = s.saleDate.toISOString().slice(0, 10);
        if (!revenueByDay[key]) revenueByDay[key] = { revenue: 0, profit: 0 };
        revenueByDay[key]!.revenue += parseFloat(String(s.total));
        revenueByDay[key]!.profit += parseFloat(String(s.profit));
      }
      const revenueChart = Object.entries(revenueByDay)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, v]) => ({ date, revenue: v.revenue, profit: v.profit }));

      // Category chart — sum revenue by product category from sale items
      const categoryRevenue: Record<string, number> = {};
      for (const s of salesRows) {
        const items = s.items as Array<{ productId: number; productName: string; quantity: number; unitPrice: number }>;
        for (const item of items) {
          const product = productRows.find(p => p.id === item.productId);
          const cat = product?.category ?? "Other";
          categoryRevenue[cat] = (categoryRevenue[cat] ?? 0) + item.quantity * item.unitPrice;
        }
      }
      const categoryChart = Object.entries(categoryRevenue)
        .sort(([, a], [, b]) => b - a)
        .map(([name, value]) => ({ name, value }));

      // Top products by revenue
      const productRevenue: Record<number, { name: string; sku: string; revenue: number; units: number; profit: number }> = {};
      for (const s of salesRows) {
        const items = s.items as Array<{ productId: number; productName: string; sku: string; quantity: number; unitPrice: number; unitCost: number }>;
        for (const item of items) {
          if (!productRevenue[item.productId]) {
            productRevenue[item.productId] = { name: item.productName, sku: item.sku, revenue: 0, units: 0, profit: 0 };
          }
          productRevenue[item.productId]!.revenue += item.quantity * item.unitPrice;
          productRevenue[item.productId]!.units += item.quantity;
          productRevenue[item.productId]!.profit += item.quantity * (item.unitPrice - item.unitCost);
        }
      }
      const topProducts = Object.values(productRevenue)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      // Payment methods
      const pmRevenue: Record<string, number> = {};
      for (const s of salesRows) {
        pmRevenue[s.paymentMethod] = (pmRevenue[s.paymentMethod] ?? 0) + parseFloat(String(s.total));
      }
      const paymentMethods = Object.entries(pmRevenue).map(([method, value]) => ({ method, value }));

      return {
        totalRevenue, totalProfit, totalExpenses, netProfit,
        totalOrders, avgOrderValue, totalProducts, lowStockCount,
        revenueChart, categoryChart, topProducts, paymentMethods,
      };
    }),
});
