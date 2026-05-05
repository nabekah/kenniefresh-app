// =============================================================
// DESIGN SYSTEM: Industrial Ledger
// Central data store — all app state lives here via localStorage
// =============================================================

import { nanoid } from "nanoid";

// ─── Types ────────────────────────────────────────────────────

export type Category = "Electronics" | "Clothing" | "Food & Beverage" | "Home & Garden" | "Sports" | "Beauty" | "Household" | "Beverages" | "Snacks" | "Dairy" | "Bakery" | "Frozen" | "Other";

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

const DATA_VERSION = "v5-kenniefresh-ghana";
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
  // ── Beverages ──
  { id: "p1",  sku: "KF-001", barcode: "6001234500001", name: "Milo Chocolate Malt Drink (400g)",       category: "Beverages",       description: "Nestlé Milo energy drink powder. Rich chocolate malt flavour, fortified with vitamins & minerals. Popular breakfast drink.",  costPrice: 22.00, sellingPrice: 32.00, stock: 120, lowStockThreshold: 30, supplierId: "sup1", createdAt: "2024-02-01T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  { id: "p2",  sku: "KF-002", barcode: "6001234500002", name: "Malta Guinness (330ml x 24)",             category: "Beverages",       description: "Non-alcoholic malt beverage. Rich in B-vitamins and energy. Comes in a case of 24 cans.",                                  costPrice: 55.00, sellingPrice: 75.00, stock: 80,  lowStockThreshold: 20, supplierId: "sup4", createdAt: "2024-02-02T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  { id: "p3",  sku: "KF-003", barcode: "6001234500003", name: "Fanta Orange (1.5L)",                     category: "Beverages",       description: "Coca-Cola Fanta orange flavoured carbonated drink. Refreshing and fruity. 1.5 litre bottle.",                              costPrice: 8.00,  sellingPrice: 12.00, stock: 150, lowStockThreshold: 40, supplierId: "sup4", createdAt: "2024-02-03T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  { id: "p4",  sku: "KF-004", barcode: "6001234500004", name: "Sunny Mango Juice (1L)",                  category: "Beverages",       description: "Sunny tropical mango juice drink. Made with real fruit juice. 1 litre carton.",                                            costPrice: 7.00,  sellingPrice: 11.00, stock: 90,  lowStockThreshold: 25, supplierId: "sup4", createdAt: "2024-02-04T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  { id: "p5",  sku: "KF-005", barcode: "6001234500005", name: "Ideal Evaporated Milk (410g)",            category: "Dairy",           description: "Nestlé Ideal full cream evaporated milk. Perfect for tea, coffee, porridge and cooking. 410g tin.",                         costPrice: 9.00,  sellingPrice: 14.00, stock: 200, lowStockThreshold: 50, supplierId: "sup1", createdAt: "2024-02-05T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  // ── Food & Beverage ──
  { id: "p6",  sku: "KF-006", barcode: "6001234500006", name: "Indomie Instant Noodles Chicken (70g)",   category: "Food & Beverage", description: "Indomie chicken flavour instant noodles. Ready in 3 minutes. Popular quick meal for all ages.",                             costPrice: 2.50,  sellingPrice: 4.00,  stock: 300, lowStockThreshold: 80, supplierId: "sup2", createdAt: "2024-02-06T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  { id: "p7",  sku: "KF-007", barcode: "6001234500007", name: "Gino Tomato Paste (70g)",                 category: "Food & Beverage", description: "Gino rich tomato paste. Thick and flavourful, perfect for soups, stews and sauces. 70g sachet.",                           costPrice: 1.50,  sellingPrice: 2.50,  stock: 400, lowStockThreshold: 100, supplierId: "sup2", createdAt: "2024-02-07T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  { id: "p8",  sku: "KF-008", barcode: "6001234500008", name: "Heinz Baked Beans (415g)",                category: "Food & Beverage", description: "Heinz baked beans in tomato sauce. High in protein and fibre. Great with rice, bread or yam.",                             costPrice: 10.00, sellingPrice: 16.00, stock: 100, lowStockThreshold: 25, supplierId: "sup1", createdAt: "2024-02-08T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  { id: "p9",  sku: "KF-009", barcode: "6001234500009", name: "Geisha Sardines in Tomato Sauce (155g)",  category: "Food & Beverage", description: "Geisha sardines in rich tomato sauce. High in omega-3 and protein. Ready to eat from the tin.",                            costPrice: 6.00,  sellingPrice: 9.50,  stock: 180, lowStockThreshold: 45, supplierId: "sup2", createdAt: "2024-02-09T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  { id: "p10", sku: "KF-010", barcode: "6001234500010", name: "Spaghetti (500g)",                        category: "Food & Beverage", description: "Golden Penny spaghetti pasta. Made from durum wheat semolina. Cooks in 10 minutes. 500g pack.",                            costPrice: 5.00,  sellingPrice: 8.00,  stock: 150, lowStockThreshold: 40, supplierId: "sup2", createdAt: "2024-02-10T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  { id: "p11", sku: "KF-011", barcode: "6001234500011", name: "Frytol Vegetable Oil (2L)",               category: "Food & Beverage", description: "Frytol refined vegetable oil. Ideal for frying, cooking and baking. Light, healthy and cholesterol-free. 2 litre bottle.", costPrice: 28.00, sellingPrice: 42.00, stock: 75,  lowStockThreshold: 20, supplierId: "sup3", createdAt: "2024-02-11T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  { id: "p12", sku: "KF-012", barcode: "6001234500012", name: "Maggi Chicken Seasoning Cubes (100 cubes)", category: "Food & Beverage", description: "Maggi chicken-flavoured seasoning cubes. Adds rich taste to soups, stews and rice dishes. Pack of 100 cubes.",             costPrice: 8.00,  sellingPrice: 13.00, stock: 250, lowStockThreshold: 60, supplierId: "sup1", createdAt: "2024-02-12T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  { id: "p13", sku: "KF-013", barcode: "6001234500013", name: "Bourn Vita Chocolate Drink (500g)",       category: "Beverages",       description: "Cadbury Bourn Vita malted chocolate drink. Fortified with 10 essential vitamins and minerals. 500g tin.",                  costPrice: 30.00, sellingPrice: 45.00, stock: 60,  lowStockThreshold: 15, supplierId: "sup1", createdAt: "2024-02-13T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  { id: "p14", sku: "KF-014", barcode: "6001234500014", name: "Koobi (Salted Tilapia) 500g",             category: "Food & Beverage", description: "Dried and salted tilapia fish (Koobi). Essential ingredient in Ghanaian soups and stews. 500g pack.",                      costPrice: 18.00, sellingPrice: 28.00, stock: 40,  lowStockThreshold: 10, supplierId: "sup3", createdAt: "2024-02-14T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  { id: "p15", sku: "KF-015", barcode: "6001234500015", name: "Corn Flakes (500g)",                      category: "Food & Beverage", description: "Kellogg's Corn Flakes breakfast cereal. Crispy toasted corn flakes. Serve with milk for a quick nutritious breakfast.",    costPrice: 18.00, sellingPrice: 28.00, stock: 70,  lowStockThreshold: 18, supplierId: "sup2", createdAt: "2024-02-15T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  // ── Household ──
  { id: "p16", sku: "KF-016", barcode: "6001234500016", name: "Omo Washing Powder (1kg)",               category: "Household",       description: "Omo active laundry detergent powder. Removes tough stains in cold water. 1kg pack.",                                      costPrice: 12.00, sellingPrice: 19.00, stock: 100, lowStockThreshold: 25, supplierId: "sup3", createdAt: "2024-02-16T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  { id: "p17", sku: "KF-017", barcode: "6001234500017", name: "Pepsodent Toothpaste (150ml)",            category: "Household",       description: "Pepsodent cavity protection toothpaste. Fights germs and freshens breath. 150ml tube.",                                    costPrice: 5.00,  sellingPrice: 8.00,  stock: 120, lowStockThreshold: 30, supplierId: "sup3", createdAt: "2024-02-17T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  { id: "p18", sku: "KF-018", barcode: "6001234500018", name: "Tissue Paper (10 rolls)",                 category: "Household",       description: "Soft 2-ply tissue paper rolls. Gentle on skin, strong and absorbent. Pack of 10 rolls.",                                  costPrice: 14.00, sellingPrice: 22.00, stock: 80,  lowStockThreshold: 20, supplierId: "sup3", createdAt: "2024-02-18T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  { id: "p19", sku: "KF-019", barcode: "6001234500019", name: "Baby Diapers (Size 3, 40 pcs)",           category: "Household",       description: "Soft and absorbent baby diapers size 3 (4–9kg). Leak-proof with wetness indicator. Pack of 40.",                          costPrice: 45.00, sellingPrice: 65.00, stock: 35,  lowStockThreshold: 10, supplierId: "sup3", createdAt: "2024-02-19T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  // ── Water & Sachet ──
  { id: "p20", sku: "KF-020", barcode: "6001234500020", name: "Sachet Water (Pure Water, 30 pcs)",       category: "Beverages",       description: "Chilled pure drinking water sachets. 500ml each, pack of 30 sachets. Ideal for home, office and events.",                 costPrice: 4.00,  sellingPrice: 6.00,  stock: 200, lowStockThreshold: 50, supplierId: "sup4", createdAt: "2024-02-20T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  { id: "p21", sku: "KF-021", barcode: "6001234500021", name: "Mineral Water Bottle (1.5L)",             category: "Beverages",       description: "Natural mineral water. Still, pure and refreshing. 1.5 litre bottle. Great for drinking and cooking.",                    costPrice: 3.50,  sellingPrice: 5.50,  stock: 160, lowStockThreshold: 40, supplierId: "sup4", createdAt: "2024-02-21T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  // ── Rice & Staples ──
  { id: "p22", sku: "KF-022", barcode: "6001234500022", name: "Golden Penny Rice (5kg)",                 category: "Food & Beverage", description: "Golden Penny long grain parboiled rice. Clean, sorted and ready to cook. 5kg bag.",                                       costPrice: 55.00, sellingPrice: 80.00, stock: 60,  lowStockThreshold: 15, supplierId: "sup2", createdAt: "2024-02-22T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  { id: "p23", sku: "KF-023", barcode: "6001234500023", name: "Garri (Cassava Flakes) 1kg",              category: "Food & Beverage", description: "White garri (fermented cassava granules). Staple food in Ghana. Eat with soup or soak with cold water. 1kg pack.",         costPrice: 6.00,  sellingPrice: 10.00, stock: 100, lowStockThreshold: 25, supplierId: "sup3", createdAt: "2024-02-23T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  // ── Snacks ──
  { id: "p24", sku: "KF-024", barcode: "6001234500024", name: "Titus Sardines in Vegetable Oil (125g)",  category: "Food & Beverage", description: "Titus sardines in vegetable oil. Rich in protein and omega-3. Ready to eat. 125g tin.",                                    costPrice: 7.00,  sellingPrice: 11.00, stock: 150, lowStockThreshold: 35, supplierId: "sup2", createdAt: "2024-02-24T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  { id: "p25", sku: "KF-025", barcode: "6001234500025", name: "Mayonnaise (500g)",                       category: "Food & Beverage", description: "Creamy mayonnaise. Perfect for sandwiches, salads and dips. Made with real eggs. 500g jar.",                               costPrice: 12.00, sellingPrice: 19.00, stock: 55,  lowStockThreshold: 15, supplierId: "sup1", createdAt: "2024-02-25T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
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
