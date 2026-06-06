import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { products } from "../../drizzle/schema";
import { eq, like, or, desc, asc, sql } from "drizzle-orm";

const ProductInput = z.object({
  sku: z.string().min(1, "SKU is required"),
  barcode: z.string().default(""),
  name: z.string().min(1, "Name is required"),
  category: z.string().default("Other"),
  description: z.string().default(""),
  costPrice: z.number().min(0),
  sellingPrice: z.number().min(0),
  stock: z.number().int().min(0).default(0),
  lowStockThreshold: z.number().int().min(0).default(10),
  supplierId: z.number().nullable().optional(),
  imageUrl: z.string().optional().nullable(),
});

export const productsRouter = router({
  list: protectedProcedure
    .input(z.object({
      search: z.string().optional(),
      category: z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      let query = db.select().from(products);
      const conditions = [];
      if (input?.search) {
        conditions.push(or(
          like(products.name, `%${input.search}%`),
          like(products.sku, `%${input.search}%`),
          like(products.barcode, `%${input.search}%`),
        ));
      }
      if (input?.category && input.category !== "All") {
        conditions.push(eq(products.category, input.category));
      }
      if (conditions.length > 0) {
        query = query.where(conditions.length === 1 ? conditions[0]! : sql`${conditions[0]} AND ${conditions[1]}`) as any;
      }
      return query.orderBy(desc(products.createdAt));
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const rows = await db.select().from(products).where(eq(products.id, input.id)).limit(1);
      return rows[0] ?? null;
    }),

  create: protectedProcedure
    .input(ProductInput)
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      // Check SKU uniqueness
      const existing = await db.select().from(products).where(eq(products.sku, input.sku)).limit(1);
      if (existing.length > 0) throw new Error(`SKU "${input.sku}" already exists`);
      const result = await db.insert(products).values({
        sku: input.sku,
        barcode: input.barcode,
        name: input.name,
        category: input.category,
        description: input.description,
        costPrice: String(input.costPrice),
        sellingPrice: String(input.sellingPrice),
        stock: input.stock,
        lowStockThreshold: input.lowStockThreshold,
        supplierId: input.supplierId ?? null,
        imageUrl: input.imageUrl ?? null,
      });
      const id = (result as any)[0]?.insertId ?? 0;
      const rows = await db.select().from(products).where(eq(products.id, id)).limit(1);
      return rows[0];
    }),

  update: protectedProcedure
    .input(z.object({ id: z.number(), data: ProductInput }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      // Check SKU uniqueness (excluding self)
      const existing = await db.select().from(products)
        .where(eq(products.sku, input.data.sku)).limit(1);
      if (existing.length > 0 && existing[0]!.id !== input.id) {
        throw new Error(`SKU "${input.data.sku}" already exists`);
      }
      await db.update(products).set({
        sku: input.data.sku,
        barcode: input.data.barcode,
        name: input.data.name,
        category: input.data.category,
        description: input.data.description,
        costPrice: String(input.data.costPrice),
        sellingPrice: String(input.data.sellingPrice),
        stock: input.data.stock,
        lowStockThreshold: input.data.lowStockThreshold,
        supplierId: input.data.supplierId ?? null,
        imageUrl: input.data.imageUrl ?? null,
      }).where(eq(products.id, input.id));
      const rows = await db.select().from(products).where(eq(products.id, input.id)).limit(1);
      return rows[0];
    }),

  updateStock: protectedProcedure
    .input(z.object({ id: z.number(), adjustment: z.number().int(), newThreshold: z.number().int().optional() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const rows = await db.select().from(products).where(eq(products.id, input.id)).limit(1);
      if (!rows[0]) throw new Error("Product not found");
      const newStock = Math.max(0, rows[0].stock + input.adjustment);
      await db.update(products).set({
        stock: newStock,
        ...(input.newThreshold !== undefined ? { lowStockThreshold: input.newThreshold } : {}),
      }).where(eq(products.id, input.id));
      return { id: input.id, stock: newStock };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.delete(products).where(eq(products.id, input.id));
      return { success: true };
    }),

  getLowStock: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    const all = await db.select().from(products).orderBy(asc(products.stock));
    return all.filter(p => p.stock <= p.lowStockThreshold);
  }),
});
