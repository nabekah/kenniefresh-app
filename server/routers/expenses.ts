import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { expenses } from "../../drizzle/schema";
import { eq, desc, gte, lte, and, like, or } from "drizzle-orm";

const EXPENSE_CATEGORIES = [
  "Rent", "Utilities", "Salaries", "Supplies", "Marketing",
  "Transport", "Maintenance", "Insurance", "Taxes", "Other",
] as const;

const ExpenseInput = z.object({
  category: z.string().default("Other"),
  description: z.string().default(""),
  amount: z.number().min(0),
  paymentMethod: z.enum(["Cash", "Card", "Bank Transfer", "Mobile"]).default("Cash"),
  vendor: z.string().optional(),
  receiptRef: z.string().optional(),
  expenseDate: z.string().optional(),
  notes: z.string().default(""),
});

function generateExpenseNumber(): string {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `EXP-${y}${m}-${rand}`;
}

export const expensesRouter = router({
  list: protectedProcedure
    .input(z.object({
      search: z.string().optional(),
      category: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      limit: z.number().int().min(1).max(500).default(200),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const conditions = [];
      if (input?.startDate) conditions.push(gte(expenses.expenseDate, new Date(input.startDate)));
      if (input?.endDate) {
        const end = new Date(input.endDate);
        end.setHours(23, 59, 59, 999);
        conditions.push(lte(expenses.expenseDate, end));
      }
      if (input?.category && input.category !== "All") {
        conditions.push(eq(expenses.category, input.category));
      }
      if (input?.search) {
        conditions.push(or(
          like(expenses.description, `%${input.search}%`),
          like(expenses.expenseNumber, `%${input.search}%`),
          like(expenses.vendor, `%${input.search}%`),
        ));
      }
      let query = db.select().from(expenses).orderBy(desc(expenses.expenseDate)).limit(input?.limit ?? 200);
      if (conditions.length > 0) query = query.where(and(...conditions)) as any;
      return query;
    }),

  create: protectedProcedure
    .input(ExpenseInput)
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const expenseNumber = generateExpenseNumber();
      const expenseDate = input.expenseDate ? new Date(input.expenseDate) : new Date();
      const result = await db.insert(expenses).values({
        expenseNumber,
        category: input.category,
        description: input.description,
        amount: String(input.amount),
        paymentMethod: input.paymentMethod,
        vendor: input.vendor ?? null,
        receiptRef: input.receiptRef ?? null,
        expenseDate,
        notes: input.notes,
        createdBy: ctx.user?.id ?? null,
      });
      const id = (result as any)[0]?.insertId ?? 0;
      const rows = await db.select().from(expenses).where(eq(expenses.id, id)).limit(1);
      return rows[0];
    }),

  update: protectedProcedure
    .input(z.object({ id: z.number(), data: ExpenseInput }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const expenseDate = input.data.expenseDate ? new Date(input.data.expenseDate) : new Date();
      await db.update(expenses).set({
        category: input.data.category,
        description: input.data.description,
        amount: String(input.data.amount),
        paymentMethod: input.data.paymentMethod,
        vendor: input.data.vendor ?? null,
        receiptRef: input.data.receiptRef ?? null,
        expenseDate,
        notes: input.data.notes,
      }).where(eq(expenses.id, input.id));
      const rows = await db.select().from(expenses).where(eq(expenses.id, input.id)).limit(1);
      return rows[0];
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.delete(expenses).where(eq(expenses.id, input.id));
      return { success: true };
    }),

  categories: protectedProcedure.query(() => EXPENSE_CATEGORIES),
});
