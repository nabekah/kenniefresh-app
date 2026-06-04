// =============================================================
// DESIGN SYSTEM: Industrial Ledger
// Central data store — all app state lives here via localStorage
// =============================================================

import { nanoid } from "nanoid";

// ─── Types ────────────────────────────────────────────────────

export type Category = "Food & Beverage" | "Beverages" | "Water" | "Dairy" | "Household" | "Cleaning" | "Baby Care" | "Rice & Staples" | "Snacks" | "Cooking Oil" | "Bath & Body" | "Other";

export interface Product {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  category: Category;
  description: string;
  costPrice: number;
  sellingPrice: number;
  stock: number;
  lowStockThreshold: number;
  supplierId: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  createdAt: string;
}

export interface PurchaseOrderItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitCost: number;
}

export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplierId: string;
  supplierName: string;
  items: PurchaseOrderItem[];
  totalAmount: number;
  status: "Pending" | "Received" | "Cancelled";
  orderDate: string;
  expectedDate: string;
  receivedDate?: string;
  notes: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
}

export type ExpenseCategory =
  | "Rent"
  | "Utilities"
  | "Salaries"
  | "Supplies"
  | "Marketing"
  | "Transport"
  | "Maintenance"
  | "Insurance"
  | "Taxes"
  | "Other";

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  "Rent", "Utilities", "Salaries", "Supplies", "Marketing",
  "Transport", "Maintenance", "Insurance", "Taxes", "Other",
];

export interface Expense {
  id: string;
  expenseNumber: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  paymentMethod: "Cash" | "Card" | "Bank Transfer" | "Mobile";
  vendor?: string;
  receiptRef?: string;
  expenseDate: string;
  notes: string;
  createdAt: string;
}

export interface Sale {
  id: string;
  receiptNumber: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  profit: number;
  paymentMethod: "Cash" | "Card" | "Mobile";
  customerName?: string;
  saleDate: string;
  notes: string;
}

export interface OnlineOrderItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
}

export interface OnlineOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  items: OnlineOrderItem[];
  subtotal: number;
  shippingFee: number;
  tax: number;
  total: number;
  profit: number;
  paymentMethod: "Card" | "Mobile" | "MTN MoMo" | "Telecel Cash" | "Cash on Delivery";
  status: "Pending" | "Processing" | "Shipped" | "Delivered" | "Cancelled";
  notes: string;
  orderDate: string;
}

// ─── Storage Keys ─────────────────────────────────────────────

const DATA_VERSION = "v6-kenniefresh-pricelist";
const VERSION_KEY = "sim_data_version";

// Clear all stored data if the seed version has changed (forces fresh grocery data)
if (typeof localStorage !== "undefined") {
  const storedVersion = localStorage.getItem(VERSION_KEY);
  if (storedVersion !== DATA_VERSION) {
    Object.values({ products: "sim_products", suppliers: "sim_suppliers", purchaseOrders: "sim_purchase_orders", sales: "sim_sales", expenses: "sim_expenses" })
      .forEach(k => localStorage.removeItem(k));
    localStorage.setItem(VERSION_KEY, DATA_VERSION);
  }
}

const KEYS = {
  products: "sim_products",
  suppliers: "sim_suppliers",
  purchaseOrders: "sim_purchase_orders",
  sales: "sim_sales",
  expenses: "sim_expenses",
  onlineOrders: "sim_online_orders",
};

// ─── Seed Data ────────────────────────────────────────────────

const seedSuppliers: Supplier[] = [
  { id: "sup1", name: "Accra Food Distributors Ltd", contactName: "Kwame Asante", email: "kwame@accrafood.com.gh", phone: "0302-555-0101", address: "Ring Road Central, Accra", createdAt: "2024-01-10T08:00:00Z" },
  { id: "sup2", name: "Ghana Agro Supplies Co.", contactName: "Abena Mensah", email: "abena@ghanaagro.com.gh", phone: "0302-555-0202", address: "Tema Industrial Area, Tema", createdAt: "2024-01-15T08:00:00Z" },
  { id: "sup3", name: "Fresh Farms Ghana Ltd", contactName: "Kofi Boateng", email: "kofi@freshfarms.com.gh", phone: "0244-555-0303", address: "Madina Market, Accra", createdAt: "2024-02-01T08:00:00Z" },
  { id: "sup4", name: "Kente Wholesale Ltd", contactName: "Ama Owusu", email: "ama@kentewholesale.com.gh", phone: "0322-555-0404", address: "Adum, Kumasi", createdAt: "2024-02-10T08:00:00Z" },
];

const seedProducts: Product[] = [
  // ── Food & Beverage ──
  { id: "p001", sku: "KF-001", barcode: "6001234500001", name: "Yumvita", category: "Food & Beverage", description: "Yumvita nutritional supplement drink. Fortified with vitamins and minerals.", costPrice: 3.50, sellingPrice: 5.00, stock: 80, lowStockThreshold: 20, supplierId: "sup1", createdAt: "2024-01-01T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  { id: "p002", sku: "KF-002", barcode: "6001234500002", name: "Kivo Gari", category: "Rice & Staples", description: "Kivo brand garri (cassava flakes). Staple Ghanaian food. Great with soup or soaked in cold water.", costPrice: 3.50, sellingPrice: 5.00, stock: 120, lowStockThreshold: 30, supplierId: "sup2", createdAt: "2024-01-01T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  { id: "p003", sku: "KF-003", barcode: "6001234500003", name: "Oats", category: "Food & Beverage", description: "Rolled oats for a healthy breakfast. Quick to prepare, rich in fibre and nutrients.", costPrice: 18.00, sellingPrice: 25.00, stock: 60, lowStockThreshold: 15, supplierId: "sup1", createdAt: "2024-01-01T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  { id: "p004", sku: "KF-004", barcode: "6001234500004", name: "Exter (Big Size)", category: "Snacks", description: "Exter biscuit big size. Crunchy and delicious snack for all ages.", costPrice: 55.00, sellingPrice: 75.00, stock: 40, lowStockThreshold: 10, supplierId: "sup1", createdAt: "2024-01-01T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  { id: "p005", sku: "KF-005", barcode: "6001234500005", name: "Exter (Small Size)", category: "Snacks", description: "Exter biscuit small size. Crunchy and delicious snack for all ages.", costPrice: 32.00, sellingPrice: 45.00, stock: 60, lowStockThreshold: 15, supplierId: "sup1", createdAt: "2024-01-01T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  { id: "p006", sku: "KF-006", barcode: "6001234500006", name: "Enapa Mackerel (Big)", category: "Food & Beverage", description: "Enapa mackerel in tomato sauce, big size tin. Rich in omega-3 and protein.", costPrice: 17.00, sellingPrice: 24.00, stock: 80, lowStockThreshold: 20, supplierId: "sup2", createdAt: "2024-01-01T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  { id: "p007", sku: "KF-007", barcode: "6001234500007", name: "Enapa Mackerel (Small)", category: "Food & Beverage", description: "Enapa mackerel in tomato sauce, small size tin. Rich in omega-3 and protein.", costPrice: 10.00, sellingPrice: 15.00, stock: 100, lowStockThreshold: 25, supplierId: "sup2", createdAt: "2024-01-01T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  // ── Cooking Oil ──
  { id: "p008", sku: "KF-008", barcode: "6001234500008", name: "Frytol Oil (0.9L)", category: "Cooking Oil", description: "Frytol refined vegetable oil 0.9 litre. Ideal for frying and cooking. Light and cholesterol-free.", costPrice: 25.00, sellingPrice: 35.00, stock: 75, lowStockThreshold: 20, supplierId: "sup2", createdAt: "2024-01-01T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  { id: "p009", sku: "KF-009", barcode: "6001234500009", name: "Sunflower Oil (900ml)", category: "Cooking Oil", description: "Sunflower vegetable oil 900ml. Great for frying, baking and salad dressings.", costPrice: 25.00, sellingPrice: 35.00, stock: 60, lowStockThreshold: 15, supplierId: "sup2", createdAt: "2024-01-01T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  { id: "p010", sku: "KF-010", barcode: "6001234500010", name: "Unoli Oil", category: "Cooking Oil", description: "Unoli vegetable cooking oil. Refined and healthy for everyday cooking.", costPrice: 29.00, sellingPrice: 40.00, stock: 50, lowStockThreshold: 12, supplierId: "sup2", createdAt: "2024-01-01T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  // ── Beverages ──
  { id: "p011", sku: "KF-011", barcode: "6001234500011", name: "Cerelac", category: "Food & Beverage", description: "Nestlé Cerelac baby cereal. Nutritious and easy to prepare. Fortified with iron and vitamins.", costPrice: 3.50, sellingPrice: 5.00, stock: 100, lowStockThreshold: 25, supplierId: "sup1", createdAt: "2024-01-01T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  { id: "p012", sku: "KF-012", barcode: "6001234500012", name: "Don-Simon Juice (Big)", category: "Beverages", description: "Don-Simon fruit juice big size. Made from real fruit. Refreshing and nutritious.", costPrice: 28.00, sellingPrice: 40.00, stock: 50, lowStockThreshold: 12, supplierId: "sup4", createdAt: "2024-01-01T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  { id: "p013", sku: "KF-013", barcode: "6001234500013", name: "Don-Simon Juice (Medium)", category: "Beverages", description: "Don-Simon fruit juice medium size. Made from real fruit. Refreshing and nutritious.", costPrice: 14.00, sellingPrice: 20.00, stock: 70, lowStockThreshold: 18, supplierId: "sup4", createdAt: "2024-01-01T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  { id: "p014", sku: "KF-014", barcode: "6001234500014", name: "Don-Simon Juice (Small)", category: "Beverages", description: "Don-Simon fruit juice small size. Made from real fruit. Refreshing and nutritious.", costPrice: 7.00, sellingPrice: 10.00, stock: 90, lowStockThreshold: 22, supplierId: "sup4", createdAt: "2024-01-01T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  { id: "p015", sku: "KF-015", barcode: "6001234500015", name: "Ceres Juice", category: "Beverages", description: "Ceres 100% pure fruit juice. No added sugar, no preservatives. South African brand.", costPrice: 28.00, sellingPrice: 40.00, stock: 45, lowStockThreshold: 12, supplierId: "sup4", createdAt: "2024-01-01T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  // ── Water ──
  { id: "p016", sku: "KF-016", barcode: "6001234500016", name: "Voltic Pure Water (Bag)", category: "Water", description: "Voltic pure drinking water sachet bag. 30 sachets per bag. Clean and refreshing.", costPrice: 8.00, sellingPrice: 12.00, stock: 200, lowStockThreshold: 50, supplierId: "sup4", createdAt: "2024-01-01T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  { id: "p017", sku: "KF-017", barcode: "6001234500017", name: "Voltic Water (Single)", category: "Water", description: "Voltic single mineral water bottle. Pure and refreshing. 3 for ₵2.", costPrice: 1.20, sellingPrice: 2.00, stock: 300, lowStockThreshold: 80, supplierId: "sup4", createdAt: "2024-01-01T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  { id: "p018", sku: "KF-018", barcode: "6001234500018", name: "Aqua Cool (Bag)", category: "Water", description: "Aqua Cool pure water sachet bag. Clean drinking water for home and office.", costPrice: 5.50, sellingPrice: 8.00, stock: 180, lowStockThreshold: 45, supplierId: "sup4", createdAt: "2024-01-01T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  { id: "p019", sku: "KF-019", barcode: "6001234500019", name: "Aqua Cool (Single)", category: "Water", description: "Aqua Cool single water sachet. Pure and refreshing.", costPrice: 0.30, sellingPrice: 0.50, stock: 500, lowStockThreshold: 100, supplierId: "sup4", createdAt: "2024-01-01T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  { id: "p020", sku: "KF-020", barcode: "6001234500020", name: "Quatic Water (Bag)", category: "Water", description: "Quatic pure water sachet bag. Safe and clean drinking water.", costPrice: 5.00, sellingPrice: 7.00, stock: 150, lowStockThreshold: 40, supplierId: "sup4", createdAt: "2024-01-01T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  { id: "p021", sku: "KF-021", barcode: "6001234500021", name: "Quatic Water (Single)", category: "Water", description: "Quatic single water sachet. 3 for ₵1. Pure and clean.", costPrice: 0.25, sellingPrice: 1.00, stock: 600, lowStockThreshold: 150, supplierId: "sup4", createdAt: "2024-01-01T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  // ── Soft Drinks ──
  { id: "p022", sku: "KF-022", barcode: "6001234500022", name: "Bigo", category: "Beverages", description: "Bigo flavoured drink. Refreshing and fruity. Popular among children and adults.", costPrice: 2.80, sellingPrice: 4.00, stock: 120, lowStockThreshold: 30, supplierId: "sup4", createdAt: "2024-01-01T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  { id: "p023", sku: "KF-023", barcode: "6001234500023", name: "Belcola", category: "Beverages", description: "Belcola carbonated soft drink. Refreshing cola flavour.", costPrice: 2.80, sellingPrice: 4.00, stock: 100, lowStockThreshold: 25, supplierId: "sup4", createdAt: "2024-01-01T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  { id: "p024", sku: "KF-024", barcode: "6001234500024", name: "Tamarinda Drink", category: "Beverages", description: "Tamarinda tamarind-flavoured drink. Sweet and tangy. A popular Ghanaian favourite.", costPrice: 2.80, sellingPrice: 4.00, stock: 90, lowStockThreshold: 22, supplierId: "sup4", createdAt: "2024-01-01T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  { id: "p025", sku: "KF-025", barcode: "6001234500025", name: "Bel-Ice", category: "Beverages", description: "Bel-Ice flavoured drink. Cold and refreshing. Great for hot days.", costPrice: 4.20, sellingPrice: 6.00, stock: 80, lowStockThreshold: 20, supplierId: "sup4", createdAt: "2024-01-01T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  { id: "p026", sku: "KF-026", barcode: "6001234500026", name: "Guinness Malt", category: "Beverages", description: "Guinness Malta non-alcoholic malt beverage. Rich in B-vitamins and energy.", costPrice: 10.50, sellingPrice: 15.00, stock: 70, lowStockThreshold: 18, supplierId: "sup4", createdAt: "2024-01-01T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  { id: "p027", sku: "KF-027", barcode: "6001234500027", name: "Beta Malt", category: "Beverages", description: "Beta malt non-alcoholic malt drink. Energising and nutritious.", costPrice: 10.50, sellingPrice: 15.00, stock: 65, lowStockThreshold: 16, supplierId: "sup4", createdAt: "2024-01-01T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  { id: "p028", sku: "KF-028", barcode: "6001234500028", name: "Plastic Coke (Medium)", category: "Beverages", description: "Coca-Cola plastic bottle medium size. Classic refreshing cola taste.", costPrice: 7.00, sellingPrice: 10.00, stock: 100, lowStockThreshold: 25, supplierId: "sup4", createdAt: "2024-01-01T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  { id: "p029", sku: "KF-029", barcode: "6001234500029", name: "Plastic Coke (Small)", category: "Beverages", description: "Coca-Cola plastic bottle small size. Classic refreshing cola taste.", costPrice: 4.20, sellingPrice: 6.00, stock: 120, lowStockThreshold: 30, supplierId: "sup4", createdAt: "2024-01-01T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  { id: "p030", sku: "KF-030", barcode: "6001234500030", name: "Fanta (Big Size)", category: "Beverages", description: "Fanta orange carbonated drink big size bottle. Fruity and refreshing.", costPrice: 25.00, sellingPrice: 35.00, stock: 55, lowStockThreshold: 14, supplierId: "sup4", createdAt: "2024-01-01T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  // ── Dairy ──
  { id: "p031", sku: "KF-031", barcode: "6001234500031", name: "Vital Milk (Pack)", category: "Dairy", description: "Vital full cream powdered milk pack. Rich and nutritious. Great for children and adults.", costPrice: 65.00, sellingPrice: 90.00, stock: 35, lowStockThreshold: 10, supplierId: "sup1", createdAt: "2024-01-01T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  { id: "p032", sku: "KF-032", barcode: "6001234500032", name: "Vital Milk (Single)", category: "Dairy", description: "Vital full cream powdered milk single sachet. Convenient for one serving.", costPrice: 10.50, sellingPrice: 15.00, stock: 100, lowStockThreshold: 25, supplierId: "sup1", createdAt: "2024-01-01T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  { id: "p033", sku: "KF-033", barcode: "6001234500033", name: "Ideal Milk (Tin)", category: "Dairy", description: "Nestlé Ideal evaporated milk tin. Perfect for tea, coffee, porridge and cooking.", costPrice: 10.00, sellingPrice: 14.00, stock: 120, lowStockThreshold: 30, supplierId: "sup1", createdAt: "2024-01-01T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  { id: "p034", sku: "KF-034", barcode: "6001234500034", name: "Carnation Milk (Small)", category: "Dairy", description: "Nestlé Carnation evaporated milk small tin. Creamy and rich. Great for cooking and beverages.", costPrice: 7.70, sellingPrice: 11.00, stock: 90, lowStockThreshold: 22, supplierId: "sup1", createdAt: "2024-01-01T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  { id: "p035", sku: "KF-035", barcode: "6001234500035", name: "Popular Milk (Small)", category: "Dairy", description: "Popular evaporated milk small tin. Affordable and nutritious.", costPrice: 7.00, sellingPrice: 10.00, stock: 100, lowStockThreshold: 25, supplierId: "sup1", createdAt: "2024-01-01T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  { id: "p036", sku: "KF-036", barcode: "6001234500036", name: "Ideal Milk Sachet (Small)", category: "Dairy", description: "Nestlé Ideal milk sachet small size. Convenient single-use portion.", costPrice: 2.10, sellingPrice: 3.00, stock: 200, lowStockThreshold: 50, supplierId: "sup1", createdAt: "2024-01-01T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  { id: "p037", sku: "KF-037", barcode: "6001234500037", name: "Nido (350g)", category: "Dairy", description: "Nestlé Nido full cream powdered milk 350g. Fortified with vitamins and minerals for children.", costPrice: 47.00, sellingPrice: 65.00, stock: 40, lowStockThreshold: 10, supplierId: "sup1", createdAt: "2024-01-01T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  { id: "p038", sku: "KF-038", barcode: "6001234500038", name: "Nido (23g)", category: "Dairy", description: "Nestlé Nido powdered milk 23g sachet. Single-serve convenience.", costPrice: 2.80, sellingPrice: 4.00, stock: 150, lowStockThreshold: 40, supplierId: "sup1", createdAt: "2024-01-01T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  { id: "p039", sku: "KF-039", barcode: "6001234500039", name: "Nido (14g)", category: "Dairy", description: "Nestlé Nido powdered milk 14g sachet. Smallest convenient size.", costPrice: 1.75, sellingPrice: 2.50, stock: 200, lowStockThreshold: 50, supplierId: "sup1", createdAt: "2024-01-01T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  // ── Snacks & Confectionery ──
  { id: "p040", sku: "KF-040", barcode: "6001234500040", name: "Kalipo (Pack)", category: "Snacks", description: "Kalipo candy pack. Assorted flavours. Popular sweet treat for children.", costPrice: 79.00, sellingPrice: 110.00, stock: 20, lowStockThreshold: 5, supplierId: "sup1", createdAt: "2024-01-01T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  { id: "p041", sku: "KF-041", barcode: "6001234500041", name: "Kalipo (Single)", category: "Snacks", description: "Kalipo single candy. Assorted flavours. Popular sweet treat.", costPrice: 3.50, sellingPrice: 5.00, stock: 200, lowStockThreshold: 50, supplierId: "sup1", createdAt: "2024-01-01T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  { id: "p042", sku: "KF-042", barcode: "6001234500042", name: "Toffees", category: "Snacks", description: "Assorted toffee sweets. Chewy and delicious. Great for children.", costPrice: 0.35, sellingPrice: 0.50, stock: 500, lowStockThreshold: 100, supplierId: "sup1", createdAt: "2024-01-01T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  // ── Rice & Staples ──
  { id: "p043", sku: "KF-043", barcode: "6001234500043", name: "Spagati (Big Size)", category: "Food & Beverage", description: "Spagati spaghetti pasta big size. Made from durum wheat semolina. Cooks in 10 minutes.", costPrice: 5.60, sellingPrice: 8.00, stock: 80, lowStockThreshold: 20, supplierId: "sup2", createdAt: "2024-01-01T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  { id: "p044", sku: "KF-044", barcode: "6001234500044", name: "Spagati (Small Size)", category: "Food & Beverage", description: "Spagati spaghetti pasta small size. Made from durum wheat semolina.", costPrice: 4.90, sellingPrice: 7.00, stock: 100, lowStockThreshold: 25, supplierId: "sup2", createdAt: "2024-01-01T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  { id: "p045", sku: "KF-045", barcode: "6001234500045", name: "Olive Oil", category: "Cooking Oil", description: "Pure olive oil for cooking and salad dressings. Rich in healthy fats.", costPrice: 8.40, sellingPrice: 12.00, stock: 40, lowStockThreshold: 10, supplierId: "sup2", createdAt: "2024-01-01T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  { id: "p046", sku: "KF-046", barcode: "6001234500046", name: "Gari (Small)", category: "Rice & Staples", description: "Small portion garri (cassava flakes). Staple Ghanaian food.", costPrice: 0.70, sellingPrice: 1.00, stock: 300, lowStockThreshold: 80, supplierId: "sup3", createdAt: "2024-01-01T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  { id: "p047", sku: "KF-047", barcode: "6001234500047", name: "Gari (1 Tin)", category: "Rice & Staples", description: "One tin of garri (cassava flakes). Staple Ghanaian food. Great with soup or soaked in cold water.", costPrice: 21.00, sellingPrice: 30.00, stock: 60, lowStockThreshold: 15, supplierId: "sup3", createdAt: "2024-01-01T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  { id: "p048", sku: "KF-048", barcode: "6001234500048", name: "Groundnut (Small)", category: "Snacks", description: "Roasted groundnuts small portion. Nutritious snack rich in protein.", costPrice: 0.70, sellingPrice: 1.00, stock: 200, lowStockThreshold: 50, supplierId: "sup3", createdAt: "2024-01-01T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  { id: "p049", sku: "KF-049", barcode: "6001234500049", name: "Sugar (Small)", category: "Food & Beverage", description: "White granulated sugar small portion. Essential kitchen staple.", costPrice: 0.70, sellingPrice: 1.00, stock: 300, lowStockThreshold: 80, supplierId: "sup2", createdAt: "2024-01-01T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  { id: "p050", sku: "KF-050", barcode: "6001234500050", name: "Sugar (One Margarine)", category: "Food & Beverage", description: "White granulated sugar one margarine tin measure. Essential kitchen staple.", costPrice: 5.60, sellingPrice: 8.00, stock: 100, lowStockThreshold: 25, supplierId: "sup2", createdAt: "2024-01-01T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  { id: "p051", sku: "KF-051", barcode: "6001234500051", name: "Sugar (Half Margarine)", category: "Food & Beverage", description: "White granulated sugar half margarine tin measure.", costPrice: 3.50, sellingPrice: 5.00, stock: 120, lowStockThreshold: 30, supplierId: "sup2", createdAt: "2024-01-01T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  // ── Bakery ──
  { id: "p052", sku: "KF-052", barcode: "6001234500052", name: "Bread (₵12)", category: "Food & Beverage", description: "Fresh sliced bread loaf. Soft and fluffy. Perfect for sandwiches and toast.", costPrice: 8.40, sellingPrice: 12.00, stock: 30, lowStockThreshold: 8, supplierId: "sup3", createdAt: "2024-01-01T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  { id: "p053", sku: "KF-053", barcode: "6001234500053", name: "Bread (₵5)", category: "Food & Beverage", description: "Small fresh bread. Soft and fluffy. Affordable daily bread.", costPrice: 3.50, sellingPrice: 5.00, stock: 50, lowStockThreshold: 12, supplierId: "sup3", createdAt: "2024-01-01T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  { id: "p054", sku: "KF-054", barcode: "6001234500054", name: "Bread (₵6)", category: "Food & Beverage", description: "Medium fresh bread. Soft and fluffy.", costPrice: 4.20, sellingPrice: 6.00, stock: 40, lowStockThreshold: 10, supplierId: "sup3", createdAt: "2024-01-01T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  // ── Rice ──
  { id: "p055", sku: "KF-055", barcode: "6001234500055", name: "Millicent Rice (1kg)", category: "Rice & Staples", description: "Millicent brand long grain rice 1kg. Clean, sorted and ready to cook.", costPrice: 12.60, sellingPrice: 18.00, stock: 80, lowStockThreshold: 20, supplierId: "sup2", createdAt: "2024-01-01T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  { id: "p056", sku: "KF-056", barcode: "6001234500056", name: "Abena Rice (1kg)", category: "Rice & Staples", description: "Abena brand long grain rice 1kg. Affordable and good quality.", costPrice: 10.50, sellingPrice: 15.00, stock: 100, lowStockThreshold: 25, supplierId: "sup2", createdAt: "2024-01-01T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  { id: "p057", sku: "KF-057", barcode: "6001234500057", name: "Lele Rice (1kg)", category: "Rice & Staples", description: "Lele premium long grain rice 1kg. Clean and well sorted.", costPrice: 23.10, sellingPrice: 33.00, stock: 60, lowStockThreshold: 15, supplierId: "sup2", createdAt: "2024-01-01T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  { id: "p058", sku: "KF-058", barcode: "6001234500058", name: "Cindy Rice (5kg)", category: "Rice & Staples", description: "Cindy brand long grain rice 5kg bag. Great value for families.", costPrice: 59.50, sellingPrice: 85.00, stock: 40, lowStockThreshold: 10, supplierId: "sup2", createdAt: "2024-01-01T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  { id: "p059", sku: "KF-059", barcode: "6001234500059", name: "Abena Rice (5kg)", category: "Rice & Staples", description: "Abena brand long grain rice 5kg bag. Affordable family pack.", costPrice: 59.50, sellingPrice: 85.00, stock: 35, lowStockThreshold: 8, supplierId: "sup2", createdAt: "2024-01-01T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  { id: "p060", sku: "KF-060", barcode: "6001234500060", name: "K75 Rice (5kg)", category: "Rice & Staples", description: "K75 premium long grain rice 5kg bag. Top quality, clean and well sorted.", costPrice: 63.00, sellingPrice: 90.00, stock: 30, lowStockThreshold: 8, supplierId: "sup2", createdAt: "2024-01-01T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  // ── Tomato & Seasoning ──
  { id: "p061", sku: "KF-061", barcode: "6001234500061", name: "Tasty Tom Jollof Mix", category: "Food & Beverage", description: "Tasty Tom jollof rice seasoning mix. Makes the perfect Ghanaian jollof rice every time.", costPrice: 7.00, sellingPrice: 10.00, stock: 100, lowStockThreshold: 25, supplierId: "sup2", createdAt: "2024-01-01T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  { id: "p062", sku: "KF-062", barcode: "6001234500062", name: "TastyTom (Medium)", category: "Food & Beverage", description: "TastyTom tomato paste medium size tin. Rich and thick tomato paste for cooking.", costPrice: 7.00, sellingPrice: 10.00, stock: 120, lowStockThreshold: 30, supplierId: "sup2", createdAt: "2024-01-01T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  { id: "p063", sku: "KF-063", barcode: "6001234500063", name: "Egg", category: "Food & Beverage", description: "Fresh farm egg. High in protein. Essential for cooking and baking.", costPrice: 1.40, sellingPrice: 2.00, stock: 200, lowStockThreshold: 50, supplierId: "sup3", createdAt: "2024-01-01T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  { id: "p064", sku: "KF-064", barcode: "6001234500064", name: "Fry Fish", category: "Food & Beverage", description: "Dried fry fish. Essential ingredient in Ghanaian soups and stews. Rich in protein.", costPrice: 3.50, sellingPrice: 5.00, stock: 80, lowStockThreshold: 20, supplierId: "sup3", createdAt: "2024-01-01T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  { id: "p065", sku: "KF-065", barcode: "6001234500065", name: "Sprawled", category: "Food & Beverage", description: "Sprawled seasoning. Adds flavour to Ghanaian dishes.", costPrice: 4.90, sellingPrice: 7.00, stock: 60, lowStockThreshold: 15, supplierId: "sup2", createdAt: "2024-01-01T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  // ── Cleaning & Household ──
  { id: "p066", sku: "KF-066", barcode: "6001234500066", name: "Lavita Powder Soap", category: "Cleaning", description: "Lavita laundry powder soap. Effective stain removal. Gentle on fabrics.", costPrice: 3.50, sellingPrice: 5.00, stock: 100, lowStockThreshold: 25, supplierId: "sup3", createdAt: "2024-01-01T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  { id: "p067", sku: "KF-067", barcode: "6001234500067", name: "Fresh Liquid Soap", category: "Cleaning", description: "Fresh liquid soap for dishes and surfaces. Cuts through grease effectively.", costPrice: 16.80, sellingPrice: 24.00, stock: 60, lowStockThreshold: 15, supplierId: "sup3", createdAt: "2024-01-01T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  { id: "p068", sku: "KF-068", barcode: "6001234500068", name: "Palmolive Liquid Soap", category: "Bath & Body", description: "Palmolive liquid hand soap. Moisturising and gentle on skin.", costPrice: 1.40, sellingPrice: 2.00, stock: 120, lowStockThreshold: 30, supplierId: "sup3", createdAt: "2024-01-01T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  { id: "p069", sku: "KF-069", barcode: "6001234500069", name: "Madar Liquid Soap (Small)", category: "Cleaning", description: "Madar liquid soap small size. Multi-purpose cleaning liquid.", costPrice: 8.40, sellingPrice: 12.00, stock: 80, lowStockThreshold: 20, supplierId: "sup3", createdAt: "2024-01-01T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  { id: "p070", sku: "KF-070", barcode: "6001234500070", name: "Power Zone (Big)", category: "Cleaning", description: "Power Zone heavy-duty cleaning powder big size. Removes tough stains and grime.", costPrice: 17.50, sellingPrice: 25.00, stock: 50, lowStockThreshold: 12, supplierId: "sup3", createdAt: "2024-01-01T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  { id: "p071", sku: "KF-071", barcode: "6001234500071", name: "Powder Zone (Small)", category: "Cleaning", description: "Powder Zone cleaning detergent small size. Effective and affordable.", costPrice: 10.50, sellingPrice: 15.00, stock: 70, lowStockThreshold: 18, supplierId: "sup3", createdAt: "2024-01-01T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  { id: "p072", sku: "KF-072", barcode: "6001234500072", name: "Zoflora", category: "Cleaning", description: "Zoflora concentrated disinfectant. Kills 99.9% of bacteria and viruses. Leaves a fresh fragrance.", costPrice: 28.00, sellingPrice: 40.00, stock: 40, lowStockThreshold: 10, supplierId: "sup3", createdAt: "2024-01-01T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  { id: "p073", sku: "KF-073", barcode: "6001234500073", name: "Harpic Toilet Cleaner", category: "Cleaning", description: "Harpic toilet bowl cleaner. Removes limescale and kills germs. Leaves toilet sparkling clean.", costPrice: 21.00, sellingPrice: 30.00, stock: 45, lowStockThreshold: 12, supplierId: "sup3", createdAt: "2024-01-01T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  { id: "p074", sku: "KF-074", barcode: "6001234500074", name: "Glass Cleaner", category: "Cleaning", description: "Glass and surface cleaner. Leaves a streak-free shine on windows, mirrors and surfaces.", costPrice: 31.50, sellingPrice: 45.00, stock: 30, lowStockThreshold: 8, supplierId: "sup3", createdAt: "2024-01-01T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  { id: "p075", sku: "KF-075", barcode: "6001234500075", name: "Bleach Remover", category: "Cleaning", description: "Bleach-based stain remover. Whitens and brightens fabrics. Disinfects surfaces.", costPrice: 17.50, sellingPrice: 25.00, stock: 50, lowStockThreshold: 12, supplierId: "sup3", createdAt: "2024-01-01T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  { id: "p076", sku: "KF-076", barcode: "6001234500076", name: "Stain Remover", category: "Cleaning", description: "Powerful stain remover for clothes and fabrics. Removes tough stains effectively.", costPrice: 11.20, sellingPrice: 16.00, stock: 55, lowStockThreshold: 14, supplierId: "sup3", createdAt: "2024-01-01T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  { id: "p077", sku: "KF-077", barcode: "6001234500077", name: "Bine20 Cleaner", category: "Cleaning", description: "Bine20 multi-purpose cleaner. Effective on floors, tiles and surfaces.", costPrice: 11.20, sellingPrice: 16.00, stock: 45, lowStockThreshold: 12, supplierId: "sup3", createdAt: "2024-01-01T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  // ── Mosquito Control ──
  { id: "p078", sku: "KF-078", barcode: "6001234500078", name: "Heaven Mosquito Spray (Big)", category: "Household", description: "Heaven mosquito and insect repellent spray big size. Kills mosquitoes and other insects on contact.", costPrice: 31.50, sellingPrice: 45.00, stock: 30, lowStockThreshold: 8, supplierId: "sup3", createdAt: "2024-01-01T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  { id: "p079", sku: "KF-079", barcode: "6001234500079", name: "Heaven Mosquito Spray (Small)", category: "Household", description: "Heaven mosquito and insect repellent spray small size. Kills mosquitoes and insects on contact.", costPrice: 24.50, sellingPrice: 35.00, stock: 40, lowStockThreshold: 10, supplierId: "sup3", createdAt: "2024-01-01T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  { id: "p080", sku: "KF-080", barcode: "6001234500080", name: "Fatala Mosquito Spray (Big)", category: "Household", description: "Fatala mosquito spray big size. Effective protection against mosquitoes and insects.", costPrice: 31.50, sellingPrice: 45.00, stock: 25, lowStockThreshold: 6, supplierId: "sup3", createdAt: "2024-01-01T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  { id: "p081", sku: "KF-081", barcode: "6001234500081", name: "Sasol Mosquito Spray (Small)", category: "Household", description: "Sasol mosquito spray small size. Effective protection against mosquitoes.", costPrice: 24.50, sellingPrice: 35.00, stock: 35, lowStockThreshold: 9, supplierId: "sup3", createdAt: "2024-01-01T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  // ── Household Items ──
  { id: "p082", sku: "KF-082", barcode: "6001234500082", name: "Table Spoon Set", category: "Household", description: "Stainless steel table spoon set. Durable and rust-resistant. Essential kitchen utensil.", costPrice: 11.90, sellingPrice: 17.00, stock: 30, lowStockThreshold: 8, supplierId: "sup3", createdAt: "2024-01-01T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  { id: "p083", sku: "KF-083", barcode: "6001234500083", name: "Glass Bowl", category: "Household", description: "Clear glass bowl. Multi-purpose kitchen and serving bowl. Durable and easy to clean.", costPrice: 38.50, sellingPrice: 55.00, stock: 20, lowStockThreshold: 5, supplierId: "sup3", createdAt: "2024-01-01T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  { id: "p084", sku: "KF-084", barcode: "6001234500084", name: "Normal Basket", category: "Household", description: "Woven storage basket. Versatile for storage and organisation around the home.", costPrice: 56.00, sellingPrice: 80.00, stock: 15, lowStockThreshold: 4, supplierId: "sup3", createdAt: "2024-01-01T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  // ── Coffee & Hot Drinks ──
  { id: "p085", sku: "KF-085", barcode: "6001234500085", name: "Cowbell Coffee", category: "Beverages", description: "Cowbell instant coffee sachet. Rich and aromatic. Perfect morning pick-me-up.", costPrice: 3.50, sellingPrice: 5.00, stock: 100, lowStockThreshold: 25, supplierId: "sup1", createdAt: "2024-01-01T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  { id: "p086", sku: "KF-086", barcode: "6001234500086", name: "Next Coffee (Medium)", category: "Beverages", description: "Next instant coffee medium size. Smooth and rich flavour.", costPrice: 3.50, sellingPrice: 5.00, stock: 90, lowStockThreshold: 22, supplierId: "sup1", createdAt: "2024-01-01T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  { id: "p087", sku: "KF-087", barcode: "6001234500087", name: "Next Coffee (Small)", category: "Beverages", description: "Next instant coffee small size. Smooth and rich flavour.", costPrice: 1.40, sellingPrice: 2.00, stock: 150, lowStockThreshold: 40, supplierId: "sup1", createdAt: "2024-01-01T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  { id: "p088", sku: "KF-088", barcode: "6001234500088", name: "Top Choco", category: "Beverages", description: "Top Choco chocolate drink sachet. Rich and creamy hot chocolate.", costPrice: 1.05, sellingPrice: 1.50, stock: 200, lowStockThreshold: 50, supplierId: "sup1", createdAt: "2024-01-01T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  { id: "p089", sku: "KF-089", barcode: "6001234500089", name: "Lipton Tea (Box)", category: "Beverages", description: "Lipton yellow label tea box. Classic black tea. Refreshing and aromatic.", costPrice: 15.40, sellingPrice: 22.00, stock: 60, lowStockThreshold: 15, supplierId: "sup1", createdAt: "2024-01-01T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  { id: "p090", sku: "KF-090", barcode: "6001234500090", name: "Sugar Cube", category: "Food & Beverage", description: "White sugar cubes. Convenient for tea and coffee. Each cube is pre-measured.", costPrice: 17.50, sellingPrice: 25.00, stock: 50, lowStockThreshold: 12, supplierId: "sup2", createdAt: "2024-01-01T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  { id: "p091", sku: "KF-091", barcode: "6001234500091", name: "Brown Sugar (Large)", category: "Food & Beverage", description: "Brown sugar large pack. Rich molasses flavour. Great for baking and hot drinks.", costPrice: 21.00, sellingPrice: 30.00, stock: 40, lowStockThreshold: 10, supplierId: "sup2", createdAt: "2024-01-01T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  { id: "p092", sku: "KF-092", barcode: "6001234500092", name: "Brown Sugar (Small)", category: "Food & Beverage", description: "Brown sugar small pack. Rich molasses flavour. Great for baking and hot drinks.", costPrice: 17.50, sellingPrice: 25.00, stock: 60, lowStockThreshold: 15, supplierId: "sup2", createdAt: "2024-01-01T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  // ── Spreads ──
  { id: "p093", sku: "KF-093", barcode: "6001234500093", name: "Blue Band (Sachet Small)", category: "Food & Beverage", description: "Blue Band margarine spread small sachet. Smooth and creamy. Great on bread.", costPrice: 1.05, sellingPrice: 1.50, stock: 200, lowStockThreshold: 50, supplierId: "sup1", createdAt: "2024-01-01T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  { id: "p094", sku: "KF-094", barcode: "6001234500094", name: "Blue Band (Small)", category: "Food & Beverage", description: "Blue Band margarine spread small tub. Smooth and creamy. Great on bread and for cooking.", costPrice: 7.00, sellingPrice: 10.00, stock: 80, lowStockThreshold: 20, supplierId: "sup1", createdAt: "2024-01-01T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  { id: "p095", sku: "KF-095", barcode: "6001234500095", name: "Blue Band (Medium)", category: "Food & Beverage", description: "Blue Band margarine spread medium tub. Smooth and creamy.", costPrice: 12.60, sellingPrice: 18.00, stock: 60, lowStockThreshold: 15, supplierId: "sup1", createdAt: "2024-01-01T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  { id: "p096", sku: "KF-096", barcode: "6001234500096", name: "Blue Band (Large)", category: "Food & Beverage", description: "Blue Band margarine spread large tub. Smooth and creamy. Best value.", costPrice: 17.50, sellingPrice: 25.00, stock: 40, lowStockThreshold: 10, supplierId: "sup1", createdAt: "2024-01-01T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  // ── Milo & Malt ──
  { id: "p097", sku: "KF-097", barcode: "6001234500097", name: "Milo (Pillow Size)", category: "Beverages", description: "Nestlé Milo chocolate malt drink pillow size pack. Rich chocolate malt flavour, fortified with vitamins.", costPrice: 59.50, sellingPrice: 85.00, stock: 25, lowStockThreshold: 6, supplierId: "sup1", createdAt: "2024-01-01T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  { id: "p098", sku: "KF-098", barcode: "6001234500098", name: "Milo (Can)", category: "Beverages", description: "Nestlé Milo chocolate malt drink can. Ready to drink, chilled and refreshing.", costPrice: 38.50, sellingPrice: 55.00, stock: 40, lowStockThreshold: 10, supplierId: "sup1", createdAt: "2024-01-01T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  // ── Sardines ──
  { id: "p099", sku: "KF-099", barcode: "6001234500099", name: "Sardine", category: "Food & Beverage", description: "Sardines in tomato sauce. Rich in omega-3 and protein. Ready to eat.", costPrice: 7.00, sellingPrice: 10.00, stock: 100, lowStockThreshold: 25, supplierId: "sup2", createdAt: "2024-01-01T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  { id: "p100", sku: "KF-100", barcode: "6001234500100", name: "Titus Sardine", category: "Food & Beverage", description: "Titus sardines in vegetable oil. Rich in protein and omega-3. Ready to eat tin.", costPrice: 10.50, sellingPrice: 15.00, stock: 90, lowStockThreshold: 22, supplierId: "sup2", createdAt: "2024-01-01T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
];

function generateSales(): Sale[] {
  const sales: Sale[] = [];
  const methods: ("Cash" | "Card" | "Mobile")[] = ["Cash", "Card", "Mobile"];
  const customers = ["Walk-in Customer", "Kwame Asante", "Abena Mensah", "Kofi Boateng", "Ama Owusu", "Yaw Darko", "Akosua Frimpong", "Nana Ama Boateng", "Kojo Mensah", "Efua Asante"];

  for (let i = 0; i < 60; i++) {
    const daysAgo = Math.floor(Math.random() * 90);
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    date.setHours(Math.floor(Math.random() * 10) + 8, Math.floor(Math.random() * 60));

    const numItems = Math.floor(Math.random() * 3) + 1;
    const items: SaleItem[] = [];
    const usedProducts = new Set<string>();

    for (let j = 0; j < numItems; j++) {
      const prod = seedProducts[Math.floor(Math.random() * seedProducts.length)];
      if (usedProducts.has(prod.id)) continue;
      usedProducts.add(prod.id);
      const qty = Math.floor(Math.random() * 3) + 1;
      items.push({
        productId: prod.id,
        productName: prod.name,
        sku: prod.sku,
        quantity: qty,
        unitPrice: prod.sellingPrice,
        unitCost: prod.costPrice,
      });
    }

    if (items.length === 0) continue;

    const subtotal = items.reduce((s, it) => s + it.unitPrice * it.quantity, 0);
    const discount = Math.random() < 0.2 ? Math.round(subtotal * 0.1 * 100) / 100 : 0;
    const tax = Math.round((subtotal - discount) * 0.08 * 100) / 100;
    const total = Math.round((subtotal - discount + tax) * 100) / 100;
    const profit = items.reduce((s, it) => s + (it.unitPrice - it.unitCost) * it.quantity, 0) - discount;

    sales.push({
      id: nanoid(),
      receiptNumber: `RCP-${String(1000 + i).padStart(5, "0")}`,
      items,
      subtotal: Math.round(subtotal * 100) / 100,
      discount,
      tax,
      total,
      profit: Math.round(profit * 100) / 100,
      paymentMethod: methods[Math.floor(Math.random() * methods.length)],
      customerName: customers[Math.floor(Math.random() * customers.length)],
      saleDate: date.toISOString(),
      notes: "",
    });
  }

  return sales.sort((a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime());
}

const seedPurchaseOrders: PurchaseOrder[] = [
  {
    id: "po1", orderNumber: "PO-00001", supplierId: "sup1", supplierName: "Accra Food Distributors",
    items: [
      { productId: "p1",  productName: "Titus Sardines (125g)",        sku: "GRC-001", quantity: 200, unitCost: 5.50 },
      { productId: "p2",  productName: "Indomie Instant Noodles (70g)", sku: "GRC-002", quantity: 300, unitCost: 2.00 },
      { productId: "p3",  productName: "Milo Tin (400g)",               sku: "GRC-003", quantity: 80,  unitCost: 28.00 },
    ],
    totalAmount: 5940.00, status: "Received", orderDate: "2024-03-01T08:00:00Z", expectedDate: "2024-03-10T08:00:00Z", receivedDate: "2024-03-09T08:00:00Z", notes: "Monthly bulk stock",
  },
  {
    id: "po2", orderNumber: "PO-00002", supplierId: "sup2", supplierName: "Ghana Agro Supplies",
    items: [
      { productId: "p5",  productName: "Gino Tomato Paste (70g)",   sku: "GRC-005", quantity: 500, unitCost: 1.50 },
      { productId: "p6",  productName: "Golden Penny Rice (5kg)",   sku: "GRC-006", quantity: 100, unitCost: 42.00 },
      { productId: "p15", productName: "Maggi Chicken Cubes (100pk)", sku: "GRC-015", quantity: 200, unitCost: 12.00 },
    ],
    totalAmount: 7150.00, status: "Pending", orderDate: "2024-04-20T08:00:00Z", expectedDate: "2024-05-05T08:00:00Z", notes: "Restock staples before market day",
  },
  {
    id: "po3", orderNumber: "PO-00003", supplierId: "sup3", supplierName: "Fresh Farms Ghana",
    items: [
      { productId: "p8",  productName: "Omo Washing Powder (1kg)",   sku: "GRC-008", quantity: 100, unitCost: 12.00 },
      { productId: "p9",  productName: "Geisha Soap Bar (3-pack)",   sku: "GRC-009", quantity: 150, unitCost: 6.00 },
      { productId: "p10", productName: "Lifebuoy Hand Wash (250ml)", sku: "GRC-010", quantity: 100, unitCost: 8.00 },
    ],
    totalAmount: 3000.00, status: "Received", orderDate: "2024-04-01T08:00:00Z", expectedDate: "2024-04-10T08:00:00Z", receivedDate: "2024-04-09T08:00:00Z", notes: "",
  },
  {
    id: "po4", orderNumber: "PO-00004", supplierId: "sup4", supplierName: "Kente Wholesale Ltd",
    items: [
      { productId: "p14", productName: "Sunlight Dish Soap (750ml)", sku: "GRC-014", quantity: 80, unitCost: 10.00 },
      { productId: "p9",  productName: "Geisha Soap Bar (3-pack)",   sku: "GRC-009", quantity: 60, unitCost: 6.00 },
    ],
    totalAmount: 1160.00, status: "Pending", orderDate: "2024-05-01T08:00:00Z", expectedDate: "2024-05-15T08:00:00Z", notes: "Low stock alert triggered for Sunlight & Geisha",
  },
];

function generateExpenses(): Expense[] {
  const expenses: Expense[] = [];
  const methods: Expense["paymentMethod"][] = ["Cash", "Card", "Bank Transfer", "Mobile"];
  const samples: { category: ExpenseCategory; description: string; vendor: string; amount: number }[] = [
    { category: "Rent",        description: "Monthly shop rent",              vendor: "Accra Properties Ltd",        amount: 1800.00 },
    { category: "Utilities",   description: "ECG electricity bill",           vendor: "Electricity Company of Ghana",  amount: 320.00 },
    { category: "Utilities",   description: "Ghana Water bill",               vendor: "Ghana Water Company",          amount: 85.00 },
    { category: "Salaries",    description: "Staff salaries",                 vendor: "Payroll",                      amount: 3500.00 },
    { category: "Supplies",    description: "Polythene bags & packaging",     vendor: "Kantamanto Supplies",          amount: 120.00 },
    { category: "Marketing",   description: "Facebook & Instagram ads",       vendor: "Meta Ads",                     amount: 200.00 },
    { category: "Transport",   description: "Delivery motorbike fuel",        vendor: "Total Energies Ghana",         amount: 95.00 },
    { category: "Maintenance", description: "Shop AC servicing",              vendor: "CoolBreeze Services",          amount: 250.00 },
    { category: "Insurance",   description: "Shop insurance premium",         vendor: "Enterprise Insurance Ghana",   amount: 480.00 },
    { category: "Supplies",    description: "Receipt books & stationery",     vendor: "Office World Ghana",           amount: 55.00 },
    { category: "Marketing",   description: "Flyer & banner printing",        vendor: "Accra Print Hub",              amount: 110.00 },
    { category: "Transport",   description: "Goods pickup from Makola",       vendor: "Yaw Transport Services",       amount: 80.00 },
    { category: "Taxes",       description: "GRA quarterly tax payment",      vendor: "Ghana Revenue Authority",      amount: 600.00 },
    { category: "Utilities",   description: "MTN internet & phone bundle",    vendor: "MTN Ghana",                    amount: 150.00 },
    { category: "Other",       description: "Miscellaneous shop expenses",    vendor: "Various",                      amount: 65.00 },
  ];
  for (let i = 0; i < 30; i++) {
    const daysAgo = Math.floor(Math.random() * 90);
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    const sample = samples[Math.floor(Math.random() * samples.length)];
    const variance = (Math.random() - 0.5) * 0.2;
    const amount = Math.round(sample.amount * (1 + variance) * 100) / 100;
    expenses.push({
      id: nanoid(),
      expenseNumber: `EXP-${String(1000 + i).padStart(5, "0")}`,
      category: sample.category,
      description: sample.description,
      vendor: sample.vendor,
      amount,
      paymentMethod: methods[Math.floor(Math.random() * methods.length)],
      receiptRef: Math.random() > 0.5 ? `REC-${nanoid(6).toUpperCase()}` : "",
      expenseDate: date.toISOString(),
      notes: "",
      createdAt: date.toISOString(),
    });
  }
  return expenses.sort((a, b) => new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime());
}

// ─── Helpers ──────────────────────────────────────────────────

function load<T>(key: string, seed: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch { /* ignore */ }
  localStorage.setItem(key, JSON.stringify(seed));
  return seed;
}

function save<T>(key: string, data: T): void {
  localStorage.setItem(key, JSON.stringify(data));
}

// ─── API ──────────────────────────────────────────────────────

// Products
export function getProducts(): Product[] {
  return load<Product[]>(KEYS.products, seedProducts);
}
export function saveProducts(products: Product[]): void {
  save(KEYS.products, products);
}
export function addProduct(p: Omit<Product, "id" | "createdAt" | "updatedAt">): Product {
  const products = getProducts();
  const now = new Date().toISOString();
  const product: Product = { ...p, id: nanoid(), createdAt: now, updatedAt: now };
  products.unshift(product);
  saveProducts(products);
  return product;
}
export function updateProduct(id: string, updates: Partial<Product>): void {
  const products = getProducts();
  const idx = products.findIndex(p => p.id === id);
  if (idx !== -1) {
    products[idx] = { ...products[idx], ...updates, updatedAt: new Date().toISOString() };
    saveProducts(products);
  }
}
export function deleteProduct(id: string): void {
  saveProducts(getProducts().filter(p => p.id !== id));
}

// Suppliers
export function getSuppliers(): Supplier[] {
  return load<Supplier[]>(KEYS.suppliers, seedSuppliers);
}
export function saveSuppliers(suppliers: Supplier[]): void {
  save(KEYS.suppliers, suppliers);
}
export function addSupplier(s: Omit<Supplier, "id" | "createdAt">): Supplier {
  const suppliers = getSuppliers();
  const supplier: Supplier = { ...s, id: nanoid(), createdAt: new Date().toISOString() };
  suppliers.unshift(supplier);
  saveSuppliers(suppliers);
  return supplier;
}
export function updateSupplier(id: string, updates: Partial<Supplier>): void {
  const suppliers = getSuppliers();
  const idx = suppliers.findIndex(s => s.id === id);
  if (idx !== -1) {
    suppliers[idx] = { ...suppliers[idx], ...updates };
    saveSuppliers(suppliers);
  }
}
export function deleteSupplier(id: string): void {
  saveSuppliers(getSuppliers().filter(s => s.id !== id));
}

// Purchase Orders
export function getPurchaseOrders(): PurchaseOrder[] {
  return load<PurchaseOrder[]>(KEYS.purchaseOrders, seedPurchaseOrders);
}
export function savePurchaseOrders(orders: PurchaseOrder[]): void {
  save(KEYS.purchaseOrders, orders);
}
export function addPurchaseOrder(o: Omit<PurchaseOrder, "id" | "orderNumber">): PurchaseOrder {
  const orders = getPurchaseOrders();
  const num = `PO-${String(orders.length + 1).padStart(5, "0")}`;
  const order: PurchaseOrder = { ...o, id: nanoid(), orderNumber: num };
  orders.unshift(order);
  savePurchaseOrders(orders);
  return order;
}
export function updatePurchaseOrder(id: string, updates: Partial<PurchaseOrder>): void {
  const orders = getPurchaseOrders();
  const idx = orders.findIndex(o => o.id === id);
  if (idx !== -1) {
    orders[idx] = { ...orders[idx], ...updates };
    savePurchaseOrders(orders);
  }
}

// Sales
export function getSales(): Sale[] {
  return load<Sale[]>(KEYS.sales, generateSales());
}
export function saveSales(sales: Sale[]): void {
  save(KEYS.sales, sales);
}
export function addSale(s: Omit<Sale, "id" | "receiptNumber" | "saleDate">): Sale {
  const sales = getSales();
  const num = `RCP-${String(1000 + sales.length + 1).padStart(5, "0")}`;
  const sale: Sale = { ...s, id: nanoid(), receiptNumber: num, saleDate: new Date().toISOString() };
  sales.unshift(sale);
  saveSales(sales);
  // Deduct stock
  const products = getProducts();
  sale.items.forEach(item => {
    const prod = products.find(p => p.id === item.productId);
    if (prod) {
      prod.stock = Math.max(0, prod.stock - item.quantity);
      prod.updatedAt = new Date().toISOString();
    }
  });
  saveProducts(products);
  return sale;
}

// ─── Analytics helpers ────────────────────────────────────────

export function getDashboardStats() {
  const sales = getSales();
  const products = getProducts();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  const thisMonthSales = sales.filter(s => new Date(s.saleDate) >= startOfMonth);
  const lastMonthSales = sales.filter(s => {
    const d = new Date(s.saleDate);
    return d >= startOfLastMonth && d <= endOfLastMonth;
  });

  const totalRevenue = thisMonthSales.reduce((s, sale) => s + sale.total, 0);
  const lastRevenue = lastMonthSales.reduce((s, sale) => s + sale.total, 0);
  const totalProfit = thisMonthSales.reduce((s, sale) => s + sale.profit, 0);
  const lastProfit = lastMonthSales.reduce((s, sale) => s + sale.profit, 0);

  const lowStockProducts = products.filter(p => p.stock > 0 && p.stock <= p.lowStockThreshold);
  const outOfStockProducts = products.filter(p => p.stock === 0);

  const revenueChange = lastRevenue > 0 ? ((totalRevenue - lastRevenue) / lastRevenue) * 100 : 0;
  const profitChange = lastProfit > 0 ? ((totalProfit - lastProfit) / lastProfit) * 100 : 0;

  return {
    totalRevenue,
    revenueChange,
    totalProfit,
    profitChange,
    totalSales: thisMonthSales.length,
    lastMonthSales: lastMonthSales.length,
    lowStockCount: lowStockProducts.length,
    outOfStockCount: outOfStockProducts.length,
    lowStockProducts,
    outOfStockProducts,
    totalProducts: products.length,
  };
}

export function getRevenueChartData(days = 30) {
  const sales = getSales();
  const result: { date: string; revenue: number; profit: number; orders: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const daySales = sales.filter(s => {
      const sd = new Date(s.saleDate);
      return sd.getFullYear() === d.getFullYear() && sd.getMonth() === d.getMonth() && sd.getDate() === d.getDate();
    });
    result.push({
      date: label,
      revenue: Math.round(daySales.reduce((s, sale) => s + sale.total, 0) * 100) / 100,
      profit: Math.round(daySales.reduce((s, sale) => s + sale.profit, 0) * 100) / 100,
      orders: daySales.length,
    });
  }
  return result;
}

export function getCategoryChartData() {
  const products = getProducts();
  const sales = getSales();
  const catMap = new Map<string, { revenue: number; units: number }>();
  sales.forEach(sale => {
    sale.items.forEach(item => {
      const prod = products.find(p => p.id === item.productId);
      const cat = prod?.category ?? "Other";
      const existing = catMap.get(cat) ?? { revenue: 0, units: 0 };
      catMap.set(cat, { revenue: existing.revenue + item.unitPrice * item.quantity, units: existing.units + item.quantity });
    });
  });
  return Array.from(catMap.entries()).map(([name, data]) => ({ name, ...data })).sort((a, b) => b.revenue - a.revenue);
}

export function getTopProducts(limit = 5) {
  const products = getProducts();
  const sales = getSales();
  const prodMap = new Map<string, { revenue: number; units: number; profit: number }>();
  sales.forEach(sale => {
    sale.items.forEach(item => {
      const existing = prodMap.get(item.productId) ?? { revenue: 0, units: 0, profit: 0 };
      prodMap.set(item.productId, {
        revenue: existing.revenue + item.unitPrice * item.quantity,
        units: existing.units + item.quantity,
        profit: existing.profit + (item.unitPrice - item.unitCost) * item.quantity,
      });
    });
  });
  return Array.from(prodMap.entries())
    .map(([id, data]) => ({ product: products.find(p => p.id === id), ...data }))
    .filter(d => d.product)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}

// Expenses
export function getExpenses(): Expense[] {
  return load<Expense[]>(KEYS.expenses, generateExpenses());
}
export function saveExpenses(expenses: Expense[]): void {
  save(KEYS.expenses, expenses);
}
export function addExpense(e: Omit<Expense, "id" | "expenseNumber" | "createdAt">): Expense {
  const expenses = getExpenses();
  const num = `EXP-${String(1000 + expenses.length + 1).padStart(5, "0")}`;
  const expense: Expense = { ...e, id: nanoid(), expenseNumber: num, createdAt: new Date().toISOString() };
  expenses.unshift(expense);
  saveExpenses(expenses);
  return expense;
}
export function updateExpense(id: string, updates: Partial<Expense>): void {
  const expenses = getExpenses();
  const idx = expenses.findIndex(e => e.id === id);
  if (idx !== -1) {
    expenses[idx] = { ...expenses[idx], ...updates };
    saveExpenses(expenses);
  }
}
export function deleteExpense(id: string): void {
  saveExpenses(getExpenses().filter(e => e.id !== id));
}

export function getExpenseSummary(days = 30) {
  const expenses = getExpenses();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const period = expenses.filter(e => new Date(e.expenseDate) >= cutoff);
  const total = period.reduce((s, e) => s + e.amount, 0);
  const byCategory = new Map<string, number>();
  period.forEach(e => byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + e.amount));
  const categoryBreakdown = Array.from(byCategory.entries())
    .map(([name, amount]) => ({ name, amount: Math.round(amount * 100) / 100 }))
    .sort((a, b) => b.amount - a.amount);
  return { total: Math.round(total * 100) / 100, categoryBreakdown, count: period.length };
}

// Online Orders
export function getOnlineOrders(): OnlineOrder[] {
  return load<OnlineOrder[]>(KEYS.onlineOrders, []);
}
export function saveOnlineOrders(orders: OnlineOrder[]): void {
  save(KEYS.onlineOrders, orders);
}
export function addOnlineOrder(o: Omit<OnlineOrder, "id" | "orderNumber" | "orderDate">): OnlineOrder {
  const orders = getOnlineOrders();
  const num = `ONL-${String(1000 + orders.length + 1).padStart(5, "0")}`;
  const order: OnlineOrder = { ...o, id: nanoid(), orderNumber: num, orderDate: new Date().toISOString() };
  orders.unshift(order);
  saveOnlineOrders(orders);
  // Deduct stock
  const products = getProducts();
  order.items.forEach(item => {
    const prod = products.find(p => p.id === item.productId);
    if (prod) {
      prod.stock = Math.max(0, prod.stock - item.quantity);
      prod.updatedAt = new Date().toISOString();
    }
  });
  saveProducts(products);
  return order;
}
export function updateOnlineOrder(id: string, updates: Partial<OnlineOrder>): void {
  const orders = getOnlineOrders();
  const idx = orders.findIndex(o => o.id === id);
  if (idx !== -1) {
    orders[idx] = { ...orders[idx], ...updates };
    saveOnlineOrders(orders);
  }
}

export function fmt(n: number): string {
  return "\u20b5" + new Intl.NumberFormat("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}
