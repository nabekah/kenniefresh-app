// =============================================================
// DESIGN SYSTEM: Industrial Ledger
// Inventory: Stock level overview, low-stock/out-of-stock alerts,
// quick stock adjustment, progress bars for stock levels
// =============================================================

import { useState, useMemo } from "react";
import { AlertTriangle, Package, TrendingDown, CheckCircle, Search, Plus, Minus, X } from "lucide-react";
import { toast } from "sonner";
import { getProducts, updateProduct, type Product, fmt } from "@/lib/store";
import { cn } from "@/lib/utils";

function StockBar({ stock, threshold, max }: { stock: number; threshold: number; max: number }) {
  const pct = max > 0 ? Math.min((stock / max) * 100, 100) : 0;
  const color = stock === 0 ? "bg-red-500" : stock <= threshold ? "bg-amber-400" : "bg-emerald-500";
  return (
    <div className="w-full bg-secondary rounded-full h-1.5 overflow-hidden">
      <div className={cn("h-full rounded-full transition-all duration-500", color)} style={{ width: `${pct}%` }} />
    </div>
  );
}

function StockBadge({ stock, threshold }: { stock: number; threshold: number }) {
  if (stock === 0) return <span className="badge-out-of-stock text-xs px-2 py-0.5 rounded-full font-medium">Out of Stock</span>;
  if (stock <= threshold) return <span className="badge-low-stock text-xs px-2 py-0.5 rounded-full font-medium">Low Stock</span>;
  return <span className="badge-in-stock text-xs px-2 py-0.5 rounded-full font-medium">In Stock</span>;
}

export default function Inventory() {
  const [products, setProducts] = useState(() => getProducts());
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "low" | "out">("all");
  const [adjustId, setAdjustId] = useState<string | null>(null);
  const [adjustQty, setAdjustQty] = useState(0);
  const [adjustNote, setAdjustNote] = useState("");

  const maxStock = useMemo(() => Math.max(...products.map(p => p.stock), 1), [products]);

  const filtered = useMemo(() => {
    return products.filter(p => {
      const q = search.toLowerCase();
      const matchSearch = !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
      if (filter === "low") return matchSearch && p.stock > 0 && p.stock <= p.lowStockThreshold;
      if (filter === "out") return matchSearch && p.stock === 0;
      return matchSearch;
    });
  }, [products, search, filter]);

  const stats = useMemo(() => ({
    total: products.length,
    inStock: products.filter(p => p.stock > p.lowStockThreshold).length,
    low: products.filter(p => p.stock > 0 && p.stock <= p.lowStockThreshold).length,
    out: products.filter(p => p.stock === 0).length,
    totalValue: products.reduce((s, p) => s + p.stock * p.costPrice, 0),
  }), [products]);

  function openAdjust(p: Product) {
    setAdjustId(p.id);
    setAdjustQty(0);
    setAdjustNote("");
  }

  function handleAdjust() {
    if (!adjustId) return;
    const p = products.find(pr => pr.id === adjustId);
    if (!p) return;
    const newStock = Math.max(0, p.stock + adjustQty);
    updateProduct(adjustId, { stock: newStock });
    setProducts(getProducts());
    toast.success(`Stock adjusted: ${p.name} → ${newStock} units`);
    setAdjustId(null);
  }

  const adjustProduct = products.find(p => p.id === adjustId);

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Inventory</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Monitor stock levels and manage adjustments</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-muted-foreground">In Stock</span>
          </div>
          <div className="data-num text-2xl font-bold text-foreground">{stats.inStock}</div>
          <div className="text-xs text-muted-foreground mt-1">products well-stocked</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-muted-foreground">Low Stock</span>
          </div>
          <div className="data-num text-2xl font-bold text-amber-400">{stats.low}</div>
          <div className="text-xs text-muted-foreground mt-1">need restocking soon</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-4 h-4 text-red-400" />
            <span className="text-xs text-muted-foreground">Out of Stock</span>
          </div>
          <div className="data-num text-2xl font-bold text-red-400">{stats.out}</div>
          <div className="text-xs text-muted-foreground mt-1">immediate action needed</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 amber-glow border-primary/30">
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">Inventory Value</span>
          </div>
          <div className="data-num text-2xl font-bold text-foreground">{fmt(stats.totalValue)}</div>
          <div className="text-xs text-muted-foreground mt-1">at cost price</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full bg-card border border-border rounded-md pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>
        <div className="flex gap-1 bg-card border border-border rounded-md p-1">
          {(["all", "low", "out"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={cn("px-3 py-1.5 text-xs rounded transition-colors capitalize",
                filter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
              {f === "all" ? "All" : f === "low" ? `Low (${stats.low})` : `Out (${stats.out})`}
            </button>
          ))}
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-secondary/50">
              <tr>
                <th className="text-left text-xs text-muted-foreground font-medium px-4 py-3">Product</th>
                <th className="text-left text-xs text-muted-foreground font-medium px-4 py-3">SKU</th>
                <th className="text-left text-xs text-muted-foreground font-medium px-4 py-3">Category</th>
                <th className="text-right text-xs text-muted-foreground font-medium px-4 py-3">Stock</th>
                <th className="text-right text-xs text-muted-foreground font-medium px-4 py-3">Threshold</th>
                <th className="text-left text-xs text-muted-foreground font-medium px-4 py-3 min-w-[120px]">Level</th>
                <th className="text-right text-xs text-muted-foreground font-medium px-4 py-3">Value</th>
                <th className="text-center text-xs text-muted-foreground font-medium px-4 py-3">Status</th>
                <th className="text-center text-xs text-muted-foreground font-medium px-4 py-3">Adjust</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-12 text-muted-foreground">
                  <Package className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  No products match your filter
                </td></tr>
              ) : filtered.map(p => (
                <tr key={p.id} className={cn("border-b border-border/50 hover:bg-secondary/30 transition-colors", p.stock === 0 && "bg-red-500/5")}>
                  <td className="px-4 py-3 font-medium text-foreground">{p.name}</td>
                  <td className="px-4 py-3 data-num text-xs text-muted-foreground">{p.sku}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{p.category}</td>
                  <td className="px-4 py-3 text-right data-num font-bold text-foreground">{p.stock}</td>
                  <td className="px-4 py-3 text-right data-num text-muted-foreground">{p.lowStockThreshold}</td>
                  <td className="px-4 py-3">
                    <StockBar stock={p.stock} threshold={p.lowStockThreshold} max={maxStock} />
                  </td>
                  <td className="px-4 py-3 text-right data-num text-muted-foreground">{fmt(p.stock * p.costPrice)}</td>
                  <td className="px-4 py-3 text-center"><StockBadge stock={p.stock} threshold={p.lowStockThreshold} /></td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => openAdjust(p)} className="text-xs px-2.5 py-1 bg-secondary hover:bg-primary hover:text-primary-foreground rounded transition-colors text-muted-foreground">
                      Adjust
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Modal */}
      {adjustId && adjustProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-card border border-border rounded-lg w-full max-w-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Adjust Stock</h2>
              <button onClick={() => setAdjustId(null)} className="p-1.5 rounded hover:bg-secondary"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <div className="font-medium text-foreground">{adjustProduct.name}</div>
                <div className="text-xs text-muted-foreground data-num">SKU: {adjustProduct.sku}</div>
              </div>
              <div className="flex items-center justify-between bg-secondary rounded-lg p-3">
                <span className="text-sm text-muted-foreground">Current Stock</span>
                <span className="data-num font-bold text-foreground text-lg">{adjustProduct.stock}</span>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-2 block">Adjustment (+ to add, - to remove)</label>
                <div className="flex items-center gap-2">
                  <button onClick={() => setAdjustQty(q => q - 1)} className="w-8 h-8 rounded bg-secondary hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-colors">
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <input type="number" value={adjustQty} onChange={e => setAdjustQty(parseInt(e.target.value) || 0)}
                    className="flex-1 bg-secondary border border-border rounded-md px-3 py-2 text-sm data-num text-center focus:outline-none focus:ring-1 focus:ring-primary" />
                  <button onClick={() => setAdjustQty(q => q + 1)} className="w-8 h-8 rounded bg-secondary hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-colors">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between bg-secondary rounded-lg p-3">
                <span className="text-sm text-muted-foreground">New Stock</span>
                <span className={cn("data-num font-bold text-lg", Math.max(0, adjustProduct.stock + adjustQty) === 0 ? "text-red-400" : Math.max(0, adjustProduct.stock + adjustQty) <= adjustProduct.lowStockThreshold ? "text-amber-400" : "text-emerald-400")}>
                  {Math.max(0, adjustProduct.stock + adjustQty)}
                </span>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Note (optional)</label>
                <input value={adjustNote} onChange={e => setAdjustNote(e.target.value)}
                  placeholder="e.g. Damaged goods, manual count..."
                  className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
            </div>
            <div className="flex gap-3 px-5 py-4 border-t border-border justify-end">
              <button onClick={() => setAdjustId(null)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-colors">Cancel</button>
              <button onClick={handleAdjust} disabled={adjustQty === 0}
                className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed">
                Apply Adjustment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
