import {
  boolean, decimal, int, json, mysqlEnum, mysqlTable,
  text, timestamp, varchar,
} from "drizzle-orm/mysql-core";

// ─── Users ────────────────────────────────────────────────────

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "sales"]).default("sales").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  passwordHash: varchar("passwordHash", { length: 255 }),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Suppliers ────────────────────────────────────────────────

export const suppliers = mysqlTable("suppliers", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  contactName: varchar("contactName", { length: 255 }).default("").notNull(),
  email: varchar("email", { length: 320 }).default("").notNull(),
  phone: varchar("phone", { length: 50 }).default("").notNull(),
  address: text("address").default("").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = typeof suppliers.$inferInsert;

// ─── Products ─────────────────────────────────────────────────

export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  sku: varchar("sku", { length: 50 }).notNull().unique(),
  barcode: varchar("barcode", { length: 100 }).default("").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }).default("Other").notNull(),
  description: text("description").default("").notNull(),
  costPrice: decimal("costPrice", { precision: 12, scale: 2 }).default("0").notNull(),
  sellingPrice: decimal("sellingPrice", { precision: 12, scale: 2 }).default("0").notNull(),
  stock: int("stock").default(0).notNull(),
  lowStockThreshold: int("lowStockThreshold").default(10).notNull(),
  supplierId: int("supplierId"),
  imageUrl: varchar("imageUrl", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

// ─── Sales ────────────────────────────────────────────────────

export const sales = mysqlTable("sales", {
  id: int("id").autoincrement().primaryKey(),
  receiptNumber: varchar("receiptNumber", { length: 50 }).notNull().unique(),
  /** JSON array of SaleItem objects */
  items: json("items").notNull(),
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).default("0").notNull(),
  discount: decimal("discount", { precision: 12, scale: 2 }).default("0").notNull(),
  tax: decimal("tax", { precision: 12, scale: 2 }).default("0").notNull(),
  total: decimal("total", { precision: 12, scale: 2 }).default("0").notNull(),
  profit: decimal("profit", { precision: 12, scale: 2 }).default("0").notNull(),
  paymentMethod: mysqlEnum("paymentMethod", ["Cash", "Card", "Mobile"]).default("Cash").notNull(),
  customerName: varchar("customerName", { length: 255 }),
  saleDate: timestamp("saleDate").defaultNow().notNull(),
  notes: text("notes").default("").notNull(),
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Sale = typeof sales.$inferSelect;
export type InsertSale = typeof sales.$inferInsert;

// ─── Expenses ─────────────────────────────────────────────────

export const expenses = mysqlTable("expenses", {
  id: int("id").autoincrement().primaryKey(),
  expenseNumber: varchar("expenseNumber", { length: 50 }).notNull().unique(),
  category: varchar("category", { length: 100 }).default("Other").notNull(),
  description: varchar("description", { length: 500 }).default("").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).default("0").notNull(),
  paymentMethod: mysqlEnum("paymentMethod", ["Cash", "Card", "Bank Transfer", "Mobile"]).default("Cash").notNull(),
  vendor: varchar("vendor", { length: 255 }),
  receiptRef: varchar("receiptRef", { length: 100 }),
  expenseDate: timestamp("expenseDate").defaultNow().notNull(),
  notes: text("notes").default("").notNull(),
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = typeof expenses.$inferInsert;

// ─── Purchase Orders ──────────────────────────────────────────

export const purchaseOrders = mysqlTable("purchase_orders", {
  id: int("id").autoincrement().primaryKey(),
  orderNumber: varchar("orderNumber", { length: 50 }).notNull().unique(),
  supplierId: int("supplierId"),
  supplierName: varchar("supplierName", { length: 255 }).default("").notNull(),
  /** JSON array of PurchaseOrderItem objects */
  items: json("items").notNull(),
  totalAmount: decimal("totalAmount", { precision: 12, scale: 2 }).default("0").notNull(),
  status: mysqlEnum("status", ["Pending", "Received", "Cancelled"]).default("Pending").notNull(),
  orderDate: timestamp("orderDate").defaultNow().notNull(),
  expectedDate: timestamp("expectedDate").defaultNow().notNull(),
  receivedDate: timestamp("receivedDate"),
  notes: text("notes").default("").notNull(),
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PurchaseOrder = typeof purchaseOrders.$inferSelect;
export type InsertPurchaseOrder = typeof purchaseOrders.$inferInsert;
