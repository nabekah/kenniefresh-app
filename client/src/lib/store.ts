// =============================================================
// DESIGN SYSTEM: Industrial Ledger
// Central data store — all app state lives here via localStorage
// =============================================================

import { nanoid } from "nanoid";

// ─── Types ────────────────────────────────────────────────────

export type Category = "Electronics" | "Clothing" | "Food & Beverage" | "Home & Garden" | "Sports" | "Beauty" | "Toys" | "Other";

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

// ─── Storage Keys ─────────────────────────────────────────────

const KEYS = {
  products: "sim_products",
  suppliers: "sim_suppliers",
  purchaseOrders: "sim_purchase_orders",
  sales: "sim_sales",
};

// ─── Seed Data ────────────────────────────────────────────────

const seedSuppliers: Supplier[] = [
  { id: "sup1", name: "TechSource Ltd", contactName: "Alice Chen", email: "alice@techsource.com", phone: "+1-555-0101", address: "123 Tech Park, San Jose, CA", createdAt: "2024-01-10T08:00:00Z" },
  { id: "sup2", name: "FashionHub Inc", contactName: "Bob Martinez", email: "bob@fashionhub.com", phone: "+1-555-0202", address: "456 Fashion Ave, New York, NY", createdAt: "2024-01-15T08:00:00Z" },
  { id: "sup3", name: "GreenGrocer Co", contactName: "Carol Smith", email: "carol@greengrocer.com", phone: "+1-555-0303", address: "789 Market St, Portland, OR", createdAt: "2024-02-01T08:00:00Z" },
  { id: "sup4", name: "HomeGoods Direct", contactName: "David Lee", email: "david@homegoods.com", phone: "+1-555-0404", address: "321 Home Blvd, Austin, TX", createdAt: "2024-02-10T08:00:00Z" },
];

const seedProducts: Product[] = [
  { id: "p1", sku: "ELEC-001", barcode: "8901234567890", name: "Wireless Headphones Pro", category: "Electronics", description: "Premium noise-cancelling wireless headphones", costPrice: 45.00, sellingPrice: 89.99, stock: 34, lowStockThreshold: 10, supplierId: "sup1", createdAt: "2024-02-01T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  { id: "p2", sku: "ELEC-002", barcode: "8901234567891", name: "USB-C Hub 7-Port", category: "Electronics", description: "7-port USB-C hub with HDMI and power delivery", costPrice: 18.00, sellingPrice: 39.99, stock: 7, lowStockThreshold: 10, supplierId: "sup1", createdAt: "2024-02-05T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  { id: "p3", sku: "ELEC-003", barcode: "8901234567892", name: "Mechanical Keyboard TKL", category: "Electronics", description: "Tenkeyless mechanical keyboard, blue switches", costPrice: 35.00, sellingPrice: 74.99, stock: 0, lowStockThreshold: 5, supplierId: "sup1", createdAt: "2024-02-10T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  { id: "p4", sku: "CLTH-001", barcode: "8901234567893", name: "Classic Denim Jacket", category: "Clothing", description: "Unisex classic blue denim jacket", costPrice: 22.00, sellingPrice: 59.99, stock: 18, lowStockThreshold: 8, supplierId: "sup2", createdAt: "2024-02-15T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  { id: "p5", sku: "CLTH-002", barcode: "8901234567894", name: "Slim Fit Chinos", category: "Clothing", description: "Men's slim fit chinos, khaki", costPrice: 15.00, sellingPrice: 44.99, stock: 3, lowStockThreshold: 8, supplierId: "sup2", createdAt: "2024-02-20T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  { id: "p6", sku: "FOOD-001", barcode: "8901234567895", name: "Organic Green Tea (50pk)", category: "Food & Beverage", description: "Premium organic green tea bags", costPrice: 4.50, sellingPrice: 12.99, stock: 62, lowStockThreshold: 20, supplierId: "sup3", createdAt: "2024-03-01T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  { id: "p7", sku: "FOOD-002", barcode: "8901234567896", name: "Cold Brew Coffee Kit", category: "Food & Beverage", description: "Cold brew coffee starter kit with jar", costPrice: 8.00, sellingPrice: 24.99, stock: 15, lowStockThreshold: 10, supplierId: "sup3", createdAt: "2024-03-05T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  { id: "p8", sku: "HOME-001", barcode: "8901234567897", name: "Bamboo Desk Organizer", category: "Home & Garden", description: "Eco-friendly bamboo desk organizer set", costPrice: 9.00, sellingPrice: 29.99, stock: 22, lowStockThreshold: 8, supplierId: "sup4", createdAt: "2024-03-10T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  { id: "p9", sku: "HOME-002", barcode: "8901234567898", name: "Scented Soy Candle Set", category: "Home & Garden", description: "Set of 3 hand-poured soy candles", costPrice: 7.50, sellingPrice: 22.99, stock: 4, lowStockThreshold: 10, supplierId: "sup4", createdAt: "2024-03-15T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
  { id: "p10", sku: "SPRT-001", barcode: "8901234567899", name: "Yoga Mat Premium", category: "Sports", description: "6mm non-slip premium yoga mat", costPrice: 14.00, sellingPrice: 39.99, stock: 11, lowStockThreshold: 5, supplierId: "sup4", createdAt: "2024-03-20T08:00:00Z", updatedAt: "2024-05-01T08:00:00Z" },
];

function generateSales(): Sale[] {
  const sales: Sale[] = [];
  const methods: ("Cash" | "Card" | "Mobile")[] = ["Cash", "Card", "Mobile"];
  const customers = ["Walk-in Customer", "John Doe", "Sarah Kim", "Mike Torres", "Emma Wilson", "Liam Brown", "Olivia Davis"];

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
    id: "po1", orderNumber: "PO-00001", supplierId: "sup1", supplierName: "TechSource Ltd",
    items: [
      { productId: "p1", productName: "Wireless Headphones Pro", sku: "ELEC-001", quantity: 50, unitCost: 45.00 },
      { productId: "p2", productName: "USB-C Hub 7-Port", sku: "ELEC-002", quantity: 30, unitCost: 18.00 },
    ],
    totalAmount: 2790.00, status: "Received", orderDate: "2024-03-01T08:00:00Z", expectedDate: "2024-03-15T08:00:00Z", receivedDate: "2024-03-14T08:00:00Z", notes: "Urgent restock",
  },
  {
    id: "po2", orderNumber: "PO-00002", supplierId: "sup2", supplierName: "FashionHub Inc",
    items: [
      { productId: "p4", productName: "Classic Denim Jacket", sku: "CLTH-001", quantity: 40, unitCost: 22.00 },
      { productId: "p5", productName: "Slim Fit Chinos", sku: "CLTH-002", quantity: 40, unitCost: 15.00 },
    ],
    totalAmount: 1480.00, status: "Pending", orderDate: "2024-04-20T08:00:00Z", expectedDate: "2024-05-10T08:00:00Z", notes: "Spring collection restock",
  },
  {
    id: "po3", orderNumber: "PO-00003", supplierId: "sup3", supplierName: "GreenGrocer Co",
    items: [
      { productId: "p6", productName: "Organic Green Tea (50pk)", sku: "FOOD-001", quantity: 100, unitCost: 4.50 },
    ],
    totalAmount: 450.00, status: "Received", orderDate: "2024-04-01T08:00:00Z", expectedDate: "2024-04-08T08:00:00Z", receivedDate: "2024-04-07T08:00:00Z", notes: "",
  },
  {
    id: "po4", orderNumber: "PO-00004", supplierId: "sup4", supplierName: "HomeGoods Direct",
    items: [
      { productId: "p9", productName: "Scented Soy Candle Set", sku: "HOME-002", quantity: 30, unitCost: 7.50 },
    ],
    totalAmount: 225.00, status: "Pending", orderDate: "2024-05-01T08:00:00Z", expectedDate: "2024-05-15T08:00:00Z", notes: "Low stock alert triggered",
  },
];

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

export function fmt(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}
