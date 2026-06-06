import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { purchaseOrders, products } from "../../drizzle/schema";
import { eq, desc, and, like, or } from "drizzle-orm";

const POItemSchema = z.object({
  productId: z.number(),
  productName: z.string(),
  sku: z.string(),
  quantity: z.number().int().min(1),
  unitCost: z.number().min(0),
});

const POInput = z.object({
  supplierId: z.number().nullable().optional(),
  supplierName: z.string().default(""),
  items: z.array(POItemSchema).min(1),
  totalAmount: z.number().min(0),
  status: z.enum(["Pending", "Received", "Cancelled"]).default("Pending"),
  orderDate: z.string().optional(),
  expectedDate: z.string().optional(),
  notes: z.string().default(""),
});

function generateOrderNumber(): string {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `PO-${y}${m}-${rand}`;
}

export const purchaseOrdersRouter = router({
  list: protectedProcedure
    .input(z.object({
      search: z.string().optional(),
      status: z.enum(["Pending", "Received", "Cancelled", "All"]).optional(),
      limit: z.number().int().min(1).max(500).default(100),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const conditions = [];
      if (input?.status && input.status !== "All") {
        conditions.push(eq(purchaseOrders.status, input.status));
      }
      if (input?.search) {
        conditions.push(or(
          like(purchaseOrders.orderNumber, `%${input.search}%`),
          like(purchaseOrders.supplierName, `%${input.search}%`),
        ));
      }
      let query = db.select().from(purchaseOrders).orderBy(desc(purchaseOrders.orderDate)).limit(input?.limit ?? 100);
      if (conditions.length > 0) query = query.where(and(...conditions)) as any;
      return query;
    }),

  create: protectedProcedure
    .input(POInput)
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const orderNumber = generateOrderNumber();
      const orderDate = input.orderDate ? new Date(input.orderDate) : new Date();
      const expectedDate = input.expectedDate ? new Date(input.expectedDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const result = await db.insert(purchaseOrders).values({
        orderNumber,
        supplierId: input.supplierId ?? null,
        supplierName: input.supplierName,
        items: input.items,
        totalAmount: String(input.totalAmount),
        status: input.status,
        orderDate,
        expectedDate,
        notes: input.notes,
        createdBy: ctx.user?.id ?? null,
      });
      const id = (result as any)[0]?.insertId ?? 0;
      const rows = await db.select().from(purchaseOrders).where(eq(purchaseOrders.id, id)).limit(1);
      return rows[0];
    }),

  updateStatus: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["Pending", "Received", "Cancelled"]),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const rows = await db.select().from(purchaseOrders).where(eq(purchaseOrders.id, input.id)).limit(1);
      if (!rows[0]) throw new Error("Purchase order not found");
      const po = rows[0];

      // When marking as Received, increment stock for each item
      if (input.status === "Received" && po.status !== "Received") {
        const items = po.items as Array<{ productId: number; quantity: number }>;
        for (const item of items) {
          const productRows = await db.select().from(products).where(eq(products.id, item.productId)).limit(1);
          if (productRows[0]) {
            await db.update(products).set({
              stock: productRows[0].stock + item.quantity,
            }).where(eq(products.id, item.productId));
          }
        }
      }

      await db.update(purchaseOrders).set({
        status: input.status,
        receivedDate: input.status === "Received" ? new Date() : null,
      }).where(eq(purchaseOrders.id, input.id));

      const updated = await db.select().from(purchaseOrders).where(eq(purchaseOrders.id, input.id)).limit(1);
      return updated[0];
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.delete(purchaseOrders).where(eq(purchaseOrders.id, input.id));
      return { success: true };
    }),
});
