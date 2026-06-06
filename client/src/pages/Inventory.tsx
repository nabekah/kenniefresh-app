// =============================================================
// DESIGN SYSTEM: Industrial Ledger
// Inventory: Stock level overview, low-stock/out-of-stock alerts,
// quick stock adjustment, progress bars for stock levels
// DB-backed via tRPC
// =============================================================

import { useState, useMemo, useRef } from "react";
import { AlertTriangle, Package, TrendingDown, CheckCircle, Search, X, Pencil, Check } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

const fmt = (n: number | string) => `₵${parseFloat(String(n)).toFixed(2)}`;

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
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "low" | "out">("all");
  const [adjustId, setAdjustId] = useState<number | null>(null);
  const [adjustQty, setAdjustQty] = useState(0);
  const [editThresholdId, setEditThresholdId] = useState<number | null>(null);
  const [editThresholdVal, setEditThresholdVal] = useState(0);
  const thresholdInputRef = useRef<HTMLInputElement>(null);

  const utils = trpc.useUtils();

  const { data: allProducts = [], isLoading } = trpc.products.list.useQuery(
    { search: search || undefined },
    { refetchOnWindowFocus: false }
  );

  const products = useMemo(() => {
    return allProducts.filter(p => {
      if (filter === "low") return p.stock > 0 && p.stock <= p.lowStockThreshold;
      if (filter === "out") return p.stock === 0;
      return true;
    });
  }, [allProducts, filter]);

  const adjustStockMutation = trpc.products.updateStock.useMutation({
    onSuccess: () => {
      utils.products.list.invalidate();
      toast.success(`Stock adjusted successfully`);
      setAdjustId(null);
    },
    onError: (err: { message: string }) => toast.error(err.message),
  });

  const maxStock = useMemo(() => Math.max(...products.map(p => p.stock), 1), [products]);

  const stats = useMemo(() => ({
    total: products.length,
    inStock: products.filter(p => p.stock > p.lowStockThreshold).length,
    low: products.filter(p => p.stock > 0 && p.stock <= p.lowStockThreshold).length,
    out: products.filter(p => p.stock === 0).length,
    totalValue: products.reduce((s, p) => s + p.stock * parseFloat(String(p.costPrice)), 0),
  }), [products]);

  function openAdjust(p: typeof products[0]) {
    setAdjustId(p.id);
    setAdjustQty(0);
  }

  function handleAdjust() {
    if (adjustId === null) return;
    const p = products.find(pr => pr.id === adjustId);
    if (!p) return;
    adjustStockMutation.mutate({ id: adjustId, adjustment: adjustQty });
  }

  function startEditThreshold(p: typeof products[0]) {
    setEditThresholdId(p.id);
    setEditThresholdVal(p.lowStockThreshold);
    setTimeout(() => thresholdInputRef.current?.select(), 30);
  }

  function saveThreshold(p: typeof products[0]) {
    const val = Math.max(0, Math.round(editThresholdVal));
    adjustStockMutation.mutate({ id: p.id, adjustment: 0, newThreshold: val });
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
              {isLoading ? (
                <tr><td colSpan={9} className="text-center py-12 text-muted-foreground">Loading inventory...</td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-12 text-muted-foreground">
                  <Package className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  No products match your filter
                </td></tr>
              ) : products.map(p => (
                <tr key={p.id} className={cn("border-b border-border/50 hover:bg-secondary/30 transition-colors", p.stock === 0 && "bg-red-500/5")}>
                  <td className="px-4 py-3 font-medium text-foreground">{p.name}</td>
                  <td className="px-4 py-3 data-num text-xs text-muted-foreground">{p.sku}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{p.category}</td>
                  <td className="px-4 py-3 text-right data-num font-bold text-foreground">{p.stock}</td>
                  <td className="px-4 py-3 text-right">
                    {editThresholdId === p.id ? (
                      <div className="flex items-center justify-end gap-1">
                        <input
                          ref={thresholdInputRef}
                          type="number"
                          min={0}
                          value={editThresholdVal}
                          onChange={e => setEditThresholdVal(Number(e.target.value))}
                          onKeyDown={e => { if (e.key === "Enter") saveThreshold(p); if (e.key === "Escape") setEditThresholdId(null); }}
                          className="w-16 text-right data-num text-sm bg-secondary border border-primary rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                        <button onClick={() => saveThreshold(p)} className="p-0.5 rounded text-emerald-500 hover:bg-emerald-500/10"><Check className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setEditThresholdId(null)} className="p-0.5 rounded text-muted-foreground hover:bg-secondary"><X className="w-3.5 h-3.5" /></button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEditThreshold(p)}
                        className="group flex items-center justify-end gap-1 data-num text-muted-foreground hover:text-foreground transition-colors w-full"
                        title="Click to edit threshold"
                      >
                        <span>{p.lowStockThreshold}</span>
                        <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity" />
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StockBar stock={p.stock} threshold={p.lowStockThreshold} max={maxStock} />
                  </td>
                  <td className="px-4 py-3 text-right data-num text-muted-foreground">{fmt(p.stock * parseFloat(String(p.costPrice)))}</td>
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
      {adjustId !== null && adjustProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-card border border-border rounded-lg w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Adjust Stock</h2>
              <button onClick={() => setAdjustId(null)} className="p-1.5 rounded hover:bg-secondary"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium text-foreground">{adjustProduct.name}</div>
                <div className="text-xs text-muted-foreground data-num">Current stock: {adjustProduct.stock} units</div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Adjustment (+ to add, - to remove)</label>
                <input type="number" value={adjustQty} onChange={e => setAdjustQty(parseInt(e.target.value) || 0)}
                  className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm data-num focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <div className="text-xs text-muted-foreground">
                New stock: <span className="data-num font-medium text-foreground">{Math.max(0, adjustProduct.stock + adjustQty)}</span>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button onClick={() => setAdjustId(null)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-colors">Cancel</button>
              <button onClick={handleAdjust} disabled={adjustStockMutation.isPending || adjustQty === 0}
                className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium disabled:opacity-50">
                {adjustStockMutation.isPending ? "Saving..." : "Apply Adjustment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
