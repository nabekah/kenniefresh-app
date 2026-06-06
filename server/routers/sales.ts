import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { sales, products } from "../../drizzle/schema";
import { eq, desc, gte, lte, and, like, or } from "drizzle-orm";

const SaleItemSchema = z.object({
  productId: z.number(),
  productName: z.string(),
  sku: z.string(),
  quantity: z.number().int().min(1),
  unitPrice: z.number().min(0),
  unitCost: z.number().min(0),
});

const SaleInput = z.object({
  items: z.array(SaleItemSchema).min(1),
  subtotal: z.number().min(0),
  discount: z.number().min(0).default(0),
  tax: z.number().min(0).default(0),
  total: z.number().min(0),
  profit: z.number(),
  paymentMethod: z.enum(["Cash", "Card", "Mobile"]).default("Cash"),
  customerName: z.string().optional(),
  saleDate: z.string().optional(),
  notes: z.string().default(""),
});

function generateReceiptNumber(): string {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `RCP-${y}${m}${d}-${rand}`;
}

export const salesRouter = router({
  list: protectedProcedure
    .input(z.object({
      search: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      limit: z.number().int().min(1).max(500).default(100),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const conditions = [];
      if (input?.startDate) conditions.push(gte(sales.saleDate, new Date(input.startDate)));
      if (input?.endDate) {
        const end = new Date(input.endDate);
        end.setHours(23, 59, 59, 999);
        conditions.push(lte(sales.saleDate, end));
      }
      if (input?.search) {
        conditions.push(or(
          like(sales.receiptNumber, `%${input.search}%`),
          like(sales.customerName, `%${input.search}%`),
        ));
      }
      let query = db.select().from(sales).orderBy(desc(sales.saleDate)).limit(input?.limit ?? 100);
      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }
      return query;
    }),

  create: protectedProcedure
    .input(SaleInput)
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Deduct stock for each item
      for (const item of input.items) {
        const rows = await db.select().from(products).where(eq(products.id, item.productId)).limit(1);
        if (!rows[0]) throw new Error(`Product ${item.productName} not found`);
        if (rows[0].stock < item.quantity) {
          throw new Error(`Insufficient stock for "${item.productName}". Available: ${rows[0].stock}`);
        }
        await db.update(products).set({ stock: rows[0].stock - item.quantity }).where(eq(products.id, item.productId));
      }

      const receiptNumber = generateReceiptNumber();
      const saleDate = input.saleDate ? new Date(input.saleDate) : new Date();

      const result = await db.insert(sales).values({
        receiptNumber,
        items: input.items,
        subtotal: String(input.subtotal),
        discount: String(input.discount),
        tax: String(input.tax),
        total: String(input.total),
        profit: String(input.profit),
        paymentMethod: input.paymentMethod,
        customerName: input.customerName ?? null,
        saleDate,
        notes: input.notes,
        createdBy: ctx.user?.id ?? null,
      });

      const id = (result as any)[0]?.insertId ?? 0;
      const rows = await db.select().from(sales).where(eq(sales.id, id)).limit(1);
      return rows[0];
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.delete(sales).where(eq(sales.id, input.id));
      return { success: true };
    }),

  // Summary stats for dashboard/reports
  stats: protectedProcedure
    .input(z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { totalRevenue: 0, totalProfit: 0, totalOrders: 0, avgOrderValue: 0 };
      const conditions = [];
      if (input?.startDate) conditions.push(gte(sales.saleDate, new Date(input.startDate)));
      if (input?.endDate) {
        const end = new Date(input.endDate);
        end.setHours(23, 59, 59, 999);
        conditions.push(lte(sales.saleDate, end));
      }
      let query = db.select().from(sales);
      if (conditions.length > 0) query = query.where(and(...conditions)) as any;
      const rows = await query;
      const totalRevenue = rows.reduce((s, r) => s + parseFloat(String(r.total)), 0);
      const totalProfit = rows.reduce((s, r) => s + parseFloat(String(r.profit)), 0);
      const totalOrders = rows.length;
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
      return { totalRevenue, totalProfit, totalOrders, avgOrderValue };
    }),
});
