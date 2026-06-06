import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { suppliers } from "../../drizzle/schema";
import { eq, like, or, desc } from "drizzle-orm";

const SupplierInput = z.object({
  name: z.string().min(1, "Name is required"),
  contactName: z.string().default(""),
  email: z.string().email().or(z.literal("")).default(""),
  phone: z.string().default(""),
  address: z.string().default(""),
});

export const suppliersRouter = router({
  list: protectedProcedure
    .input(z.object({ search: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      if (input?.search) {
        return db.select().from(suppliers)
          .where(or(
            like(suppliers.name, `%${input.search}%`),
            like(suppliers.contactName, `%${input.search}%`),
            like(suppliers.email, `%${input.search}%`),
          ))
          .orderBy(desc(suppliers.createdAt));
      }
      return db.select().from(suppliers).orderBy(desc(suppliers.createdAt));
    }),

  create: protectedProcedure
    .input(SupplierInput)
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const result = await db.insert(suppliers).values({
        name: input.name,
        contactName: input.contactName,
        email: input.email,
        phone: input.phone,
        address: input.address,
      });
      const id = (result as any)[0]?.insertId ?? 0;
      const rows = await db.select().from(suppliers).where(eq(suppliers.id, id)).limit(1);
      return rows[0];
    }),

  update: protectedProcedure
    .input(z.object({ id: z.number(), data: SupplierInput }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.update(suppliers).set({
        name: input.data.name,
        contactName: input.data.contactName,
        email: input.data.email,
        phone: input.data.phone,
        address: input.data.address,
      }).where(eq(suppliers.id, input.id));
      const rows = await db.select().from(suppliers).where(eq(suppliers.id, input.id)).limit(1);
      return rows[0];
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.delete(suppliers).where(eq(suppliers.id, input.id));
      return { success: true };
    }),
});
