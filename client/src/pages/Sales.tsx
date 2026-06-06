// =============================================================
// DESIGN SYSTEM: Industrial Ledger
// Sales: POS-style new sale panel (left) + sales history table (right)
// Receipt viewer modal, payment method badges, profit tracking
// DB-backed via tRPC
// =============================================================

import { useState, useMemo } from "react";
import {
  ShoppingCart, Plus, Trash2, Search, Receipt,
  CreditCard, Banknote, Smartphone, ChevronDown, ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

const fmt = (n: number | string) => `₵${parseFloat(String(n)).toFixed(2)}`;

function PayBadge({ method }: { method: string }) {
  const map: Record<string, string> = {
    Cash: "badge-in-stock",
    Card: "badge-pending",
    Mobile: "badge-low-stock",
  };
  return <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", map[method] ?? "badge-in-stock")}>{method}</span>;
}

type CartItem = {
  productId: number;
  productName: string;
  sku: string;
  sellingPrice: number;
  costPrice: number;
  stock: number;
  qty: number;
};

export default function Sales() {
  const [tab, setTab] = useState<"new" | "history">("new");

  // POS state
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [discount, setDiscount] = useState(0);
  const [payMethod, setPayMethod] = useState<"Cash" | "Card" | "Mobile">("Cash");
  const [customerName, setCustomerName] = useState("");
  const [notes, setNotes] = useState("");

  // History state
  const [histSearch, setHistSearch] = useState("");
  const [expandedSale, setExpandedSale] = useState<number | null>(null);

  const utils = trpc.useUtils();

  const { data: products = [] } = trpc.products.list.useQuery(undefined, { refetchOnWindowFocus: false });
  const { data: salesData, isLoading: salesLoading } = trpc.sales.list.useQuery(
    { search: histSearch || undefined },
    { refetchOnWindowFocus: false }
  );
  const sales = Array.isArray(salesData) ? salesData : [];

  const createSaleMutation = trpc.sales.create.useMutation({
    onSuccess: () => {
      utils.sales.list.invalidate();
      utils.products.list.invalidate();
      setCartItems([]);
      setDiscount(0);
      setCustomerName("");
      setNotes("");
      toast.success("Sale recorded successfully!");
      setTab("history");
    },
    onError: (e) => toast.error(e.message),
  });

  const productResults = useMemo(() => {
    if (!productSearch.trim()) return [];
    const q = productSearch.toLowerCase();
    return products.filter(p =>
      p.stock > 0 &&
      (p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || (p.barcode ?? "").includes(q))
    ).slice(0, 6);
  }, [products, productSearch]);

  const subtotal = cartItems.reduce((s, i) => s + i.sellingPrice * i.qty, 0);
  const discountAmt = Math.min(discount, subtotal);
  const taxAmt = 0;
  const total = subtotal - discountAmt;
  const profit = cartItems.reduce((s, i) => s + (i.sellingPrice - i.costPrice) * i.qty, 0) - discountAmt;

  function addToCart(p: typeof products[0]) {
    setCartItems(prev => {
      const existing = prev.find(i => i.productId === p.id);
      if (existing) return prev.map(i => i.productId === p.id ? { ...i, qty: Math.min(i.qty + 1, p.stock) } : i);
      return [...prev, {
        productId: p.id, productName: p.name, sku: p.sku,
        sellingPrice: parseFloat(String(p.sellingPrice)),
        costPrice: parseFloat(String(p.costPrice)),
        stock: p.stock, qty: 1,
      }];
    });
    setProductSearch("");
  }

  function updateQty(productId: number, qty: number) {
    if (qty <= 0) { setCartItems(prev => prev.filter(i => i.productId !== productId)); return; }
    const p = products.find(pr => pr.id === productId);
    setCartItems(prev => prev.map(i => i.productId === productId ? { ...i, qty: Math.min(qty, p?.stock ?? qty) } : i));
  }

  function handleCheckout() {
    if (cartItems.length === 0) { toast.error("Cart is empty"); return; }
    createSaleMutation.mutate({
      items: cartItems.map(i => ({
        productId: i.productId, productName: i.productName, sku: i.sku,
        quantity: i.qty, unitPrice: i.sellingPrice, unitCost: i.costPrice,
      })),
      subtotal: Math.round(subtotal * 100) / 100,
      discount: Math.round(discountAmt * 100) / 100,
      tax: Math.round(taxAmt * 100) / 100,
      total: Math.round(total * 100) / 100,
      profit: Math.round(profit * 100) / 100,
      paymentMethod: payMethod,
      customerName: customerName || undefined,
      notes: notes || "",
    });
  }

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Sales</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{sales.length} total transactions</p>
        </div>
        <div className="flex gap-1 bg-card border border-border rounded-md p-1">
          {(["new", "history"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={cn("px-4 py-1.5 text-sm rounded transition-colors capitalize",
                tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
              {t === "new" ? "New Sale" : "History"}
            </button>
          ))}
        </div>
      </div>

      {/* New Sale POS */}
      {tab === "new" && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* Product Search */}
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-card border border-border rounded-lg p-5">
              <h2 className="font-semibold mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Add Products</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input value={productSearch} onChange={e => setProductSearch(e.target.value)}
                  placeholder="Search by name, SKU, or barcode..."
                  className="w-full bg-secondary border border-border rounded-md pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              {productResults.length > 0 && (
                <div className="mt-2 border border-border rounded-md overflow-hidden">
                  {productResults.map(p => (
                    <button key={p.id} onClick={() => addToCart(p)}
                      className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-secondary transition-colors text-left border-b border-border/50 last:border-0">
                      <div>
                        <div className="text-sm font-medium text-foreground">{p.name}</div>
                        <div className="text-xs text-muted-foreground data-num">{p.sku} · Stock: {p.stock}</div>
                      </div>
                      <div className="text-right">
                        <div className="data-num font-bold text-primary">{fmt(p.sellingPrice)}</div>
                        <Plus className="w-3.5 h-3.5 text-muted-foreground ml-auto" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Cart */}
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="px-5 py-3 border-b border-border flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-primary" />
                <span className="font-semibold text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Cart ({cartItems.length} items)</span>
              </div>
              {cartItems.length === 0 ? (
                <div className="py-10 text-center text-muted-foreground text-sm">
                  <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  Search and add products above
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-secondary/50 border-b border-border">
                    <tr>
                      <th className="text-left text-xs text-muted-foreground font-medium px-4 py-2">Product</th>
                      <th className="text-right text-xs text-muted-foreground font-medium px-4 py-2">Price</th>
                      <th className="text-center text-xs text-muted-foreground font-medium px-4 py-2">Qty</th>
                      <th className="text-right text-xs text-muted-foreground font-medium px-4 py-2">Total</th>
                      <th className="px-2 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cartItems.map(item => (
                      <tr key={item.productId} className="border-b border-border/50">
                        <td className="px-4 py-2.5">
                          <div className="font-medium text-foreground text-xs">{item.productName}</div>
                          <div className="text-xs text-muted-foreground data-num">{item.sku}</div>
                        </td>
                        <td className="px-4 py-2.5 text-right data-num text-muted-foreground">{fmt(item.sellingPrice)}</td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => updateQty(item.productId, item.qty - 1)} className="w-6 h-6 rounded bg-secondary hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-colors text-xs">−</button>
                            <span className="data-num w-8 text-center text-sm">{item.qty}</span>
                            <button onClick={() => updateQty(item.productId, item.qty + 1)} className="w-6 h-6 rounded bg-secondary hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-colors text-xs">+</button>
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-right data-num font-medium text-foreground">{fmt(item.sellingPrice * item.qty)}</td>
                        <td className="px-2 py-2.5">
                          <button onClick={() => updateQty(item.productId, 0)} className="p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Checkout Panel */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-card border border-border rounded-lg p-5 space-y-4">
              <h2 className="font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Order Summary</h2>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span><span className="data-num">{fmt(subtotal)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Discount (₵)</span>
                  <input type="number" min="0" max={subtotal} step="0.01" value={discount}
                    onChange={e => setDiscount(parseFloat(e.target.value) || 0)}
                    className="w-24 bg-secondary border border-border rounded px-2 py-1 text-sm data-num text-right focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Tax</span><span className="data-num">GHS 0.00</span>
                </div>
                <div className="border-t border-border pt-2 flex justify-between font-bold text-foreground text-base">
                  <span>Total</span><span className="data-num">{fmt(total)}</span>
                </div>
                <div className="flex justify-between text-xs text-emerald-400">
                  <span>Est. Profit</span><span className="data-num">{fmt(profit)}</span>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="text-xs text-muted-foreground mb-2 block">Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["Cash", "Card", "Mobile"] as const).map(m => (
                    <button key={m} onClick={() => setPayMethod(m)}
                      className={cn("flex flex-col items-center gap-1 py-2.5 rounded-md border text-xs transition-colors",
                        payMethod === m ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/50")}>
                      {m === "Cash" ? <Banknote className="w-4 h-4" /> : m === "Card" ? <CreditCard className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Customer Name</label>
                <input value={customerName} onChange={e => setCustomerName(e.target.value)}
                  placeholder="Walk-in Customer"
                  className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Notes</label>
                <input value={notes} onChange={e => setNotes(e.target.value)}
                  placeholder="Optional notes..."
                  className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>

              <button onClick={handleCheckout} disabled={cartItems.length === 0 || createSaleMutation.isPending}
                className="w-full py-3 bg-primary text-primary-foreground rounded-md font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                <Receipt className="w-4 h-4" />
                {createSaleMutation.isPending ? "Processing..." : `Complete Sale · ${fmt(total)}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History */}
      {tab === "history" && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={histSearch} onChange={e => setHistSearch(e.target.value)}
              placeholder="Search by receipt, customer, or product..."
              className="w-full bg-card border border-border rounded-md pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>

          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-secondary/50">
                  <tr>
                    <th className="text-left text-xs text-muted-foreground font-medium px-4 py-3">Receipt</th>
                    <th className="text-left text-xs text-muted-foreground font-medium px-4 py-3">Date & Time</th>
                    <th className="text-left text-xs text-muted-foreground font-medium px-4 py-3">Customer</th>
                    <th className="text-right text-xs text-muted-foreground font-medium px-4 py-3">Items</th>
                    <th className="text-right text-xs text-muted-foreground font-medium px-4 py-3">Total</th>
                    <th className="text-right text-xs text-muted-foreground font-medium px-4 py-3">Profit</th>
                    <th className="text-center text-xs text-muted-foreground font-medium px-4 py-3">Payment</th>
                    <th className="text-center text-xs text-muted-foreground font-medium px-4 py-3">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {salesLoading ? (
                    <tr><td colSpan={8} className="text-center py-12 text-muted-foreground">Loading sales...</td></tr>
                  ) : sales.length === 0 ? (
                    <tr><td colSpan={8} className="text-center py-12 text-muted-foreground">
                      <Receipt className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      No sales found
                    </td></tr>
                  ) : sales.map(sale => (
                    <>
                      <tr key={sale.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                        <td className="px-4 py-3 data-num text-xs font-medium text-primary">{sale.receiptNumber}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {new Date(sale.saleDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          <div className="data-num">{new Date(sale.saleDate).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</div>
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground">{sale.customerName || "—"}</td>
                        <td className="px-4 py-3 text-right data-num text-muted-foreground">
                          {Array.isArray(sale.items) ? sale.items.reduce((s: number, i: any) => s + i.quantity, 0) : 0}
                        </td>
                        <td className="px-4 py-3 text-right data-num font-bold text-foreground">{fmt(sale.total)}</td>
                        <td className="px-4 py-3 text-right data-num text-emerald-400">{fmt(sale.profit)}</td>
                        <td className="px-4 py-3 text-center"><PayBadge method={sale.paymentMethod} /></td>
                        <td className="px-4 py-3 text-center">
                          <button onClick={() => setExpandedSale(expandedSale === sale.id ? null : sale.id)}
                            className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                            {expandedSale === sale.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        </td>
                      </tr>
                      {expandedSale === sale.id && (
                        <tr key={`${sale.id}-exp`} className="bg-secondary/20 border-b border-border">
                          <td colSpan={8} className="px-8 py-3">
                            <div className="text-xs text-muted-foreground mb-2 font-medium">Items in this sale:</div>
                            <div className="space-y-1">
                              {Array.isArray(sale.items) && (sale.items as any[]).map((item, i: number) => (
                                <div key={i} className="flex items-center justify-between text-xs">
                                  <span className="text-foreground">{item.productName} <span className="text-muted-foreground data-num">({item.sku})</span></span>
                                  <span className="data-num text-muted-foreground">{item.quantity} × {fmt(item.unitPrice)} = <span className="text-foreground font-medium">{fmt(item.quantity * item.unitPrice)}</span></span>
                                </div>
                              ))}
                            </div>
                            {parseFloat(String(sale.discount)) > 0 && <div className="text-xs text-amber-400 mt-1">Discount: -{fmt(sale.discount)}</div>}
                            {sale.notes && <div className="text-xs text-muted-foreground mt-1">Note: {sale.notes}</div>}
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
