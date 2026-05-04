// =============================================================
// DESIGN SYSTEM: Industrial Ledger
// Purchase Orders: Create/view orders, status management,
// receive stock (updates inventory), line items table
// =============================================================

import { useState, useMemo } from "react";
import { Plus, Search, ChevronDown, ChevronUp, X, Truck, CheckCircle, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import {
  getPurchaseOrders, addPurchaseOrder, updatePurchaseOrder,
  getSuppliers, getProducts, updateProduct,
  type PurchaseOrder, type PurchaseOrderItem, fmt,
} from "@/lib/store";
import { cn } from "@/lib/utils";

function StatusBadge({ status }: { status: PurchaseOrder["status"] }) {
  const map = {
    Pending: "badge-pending",
    Received: "badge-received",
    Cancelled: "badge-cancelled",
  };
  return <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", map[status])}>{status}</span>;
}

export default function PurchaseOrders() {
  const [orders, setOrders] = useState(() => getPurchaseOrders());
  const suppliers = useMemo(() => getSuppliers(), []);
  const products = useMemo(() => getProducts(), []);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | PurchaseOrder["status"]>("All");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Form state
  const [formSupplier, setFormSupplier] = useState("");
  const [formExpected, setFormExpected] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formItems, setFormItems] = useState<PurchaseOrderItem[]>([]);
  const [itemProductId, setItemProductId] = useState("");
  const [itemQty, setItemQty] = useState(1);
  const [itemCost, setItemCost] = useState(0);

  const filtered = useMemo(() => {
    return orders.filter(o => {
      const q = search.toLowerCase();
      const matchSearch = !q || o.orderNumber.toLowerCase().includes(q) || o.supplierName.toLowerCase().includes(q);
      const matchStatus = statusFilter === "All" || o.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [orders, search, statusFilter]);

  function openModal() {
    setFormSupplier("");
    setFormExpected("");
    setFormNotes("");
    setFormItems([]);
    setItemProductId("");
    setItemQty(1);
    setItemCost(0);
    setShowModal(true);
  }

  function addItem() {
    if (!itemProductId) { toast.error("Select a product"); return; }
    if (itemQty <= 0) { toast.error("Quantity must be > 0"); return; }
    const prod = products.find(p => p.id === itemProductId);
    if (!prod) return;
    if (formItems.find(i => i.productId === itemProductId)) { toast.error("Product already added"); return; }
    setFormItems(prev => [...prev, {
      productId: prod.id, productName: prod.name, sku: prod.sku,
      quantity: itemQty, unitCost: itemCost || prod.costPrice,
    }]);
    setItemProductId("");
    setItemQty(1);
    setItemCost(0);
  }

  function handleCreate() {
    if (!formSupplier) { toast.error("Select a supplier"); return; }
    if (formItems.length === 0) { toast.error("Add at least one item"); return; }
    const sup = suppliers.find(s => s.id === formSupplier);
    const total = formItems.reduce((s, i) => s + i.quantity * i.unitCost, 0);
    addPurchaseOrder({
      supplierId: formSupplier,
      supplierName: sup?.name ?? "",
      items: formItems,
      totalAmount: Math.round(total * 100) / 100,
      status: "Pending",
      orderDate: new Date().toISOString(),
      expectedDate: formExpected || new Date(Date.now() + 7 * 86400000).toISOString(),
      notes: formNotes,
    });
    setOrders(getPurchaseOrders());
    setShowModal(false);
    toast.success("Purchase order created");
  }

  function markReceived(id: string) {
    const order = orders.find(o => o.id === id);
    if (!order) return;
    updatePurchaseOrder(id, { status: "Received", receivedDate: new Date().toISOString() });
    // Update stock
    const prods = products;
    order.items.forEach(item => {
      const prod = prods.find(p => p.id === item.productId);
      if (prod) updateProduct(prod.id, { stock: prod.stock + item.quantity });
    });
    setOrders(getPurchaseOrders());
    toast.success("Order marked as received — stock updated");
  }

  function markCancelled(id: string) {
    updatePurchaseOrder(id, { status: "Cancelled" });
    setOrders(getPurchaseOrders());
    toast.success("Order cancelled");
  }

  const selectedProduct = products.find(p => p.id === itemProductId);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Purchase Orders</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{orders.length} total orders</p>
        </div>
        <button onClick={openModal} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" /> New Order
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {(["Pending", "Received", "Cancelled"] as const).map(s => {
          const count = orders.filter(o => o.status === s).length;
          const total = orders.filter(o => o.status === s).reduce((sum, o) => sum + o.totalAmount, 0);
          const icon = s === "Pending" ? Clock : s === "Received" ? CheckCircle : XCircle;
          const Icon = icon;
          const color = s === "Pending" ? "text-blue-400" : s === "Received" ? "text-emerald-400" : "text-red-400";
          return (
            <div key={s} className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon className={cn("w-4 h-4", color)} />
                <span className="text-xs text-muted-foreground">{s}</span>
              </div>
              <div className="data-num text-xl font-bold text-foreground">{count}</div>
              <div className="data-num text-xs text-muted-foreground mt-1">{fmt(total)}</div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search orders..."
            className="w-full bg-card border border-border rounded-md pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>
        <div className="flex gap-1 bg-card border border-border rounded-md p-1">
          {(["All", "Pending", "Received", "Cancelled"] as const).map(f => (
            <button key={f} onClick={() => setStatusFilter(f)}
              className={cn("px-3 py-1.5 text-xs rounded transition-colors",
                statusFilter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-secondary/50">
              <tr>
                <th className="text-left text-xs text-muted-foreground font-medium px-4 py-3">Order #</th>
                <th className="text-left text-xs text-muted-foreground font-medium px-4 py-3">Supplier</th>
                <th className="text-right text-xs text-muted-foreground font-medium px-4 py-3">Items</th>
                <th className="text-right text-xs text-muted-foreground font-medium px-4 py-3">Total</th>
                <th className="text-left text-xs text-muted-foreground font-medium px-4 py-3">Order Date</th>
                <th className="text-left text-xs text-muted-foreground font-medium px-4 py-3">Expected</th>
                <th className="text-center text-xs text-muted-foreground font-medium px-4 py-3">Status</th>
                <th className="text-center text-xs text-muted-foreground font-medium px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-muted-foreground">
                  <Truck className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  No purchase orders found
                </td></tr>
              ) : filtered.map(order => (
                <>
                  <tr key={order.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-3 data-num text-xs font-medium text-primary">{order.orderNumber}</td>
                    <td className="px-4 py-3 font-medium text-foreground">{order.supplierName}</td>
                    <td className="px-4 py-3 text-right data-num text-muted-foreground">{order.items.length}</td>
                    <td className="px-4 py-3 text-right data-num font-bold text-foreground">{fmt(order.totalAmount)}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(order.orderDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(order.expectedDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
                    <td className="px-4 py-3 text-center"><StatusBadge status={order.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        {order.status === "Pending" && (
                          <>
                            <button onClick={() => markReceived(order.id)} className="text-xs px-2 py-1 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded transition-colors">Receive</button>
                            <button onClick={() => markCancelled(order.id)} className="text-xs px-2 py-1 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded transition-colors">Cancel</button>
                          </>
                        )}
                        <button onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                          className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                          {expanded === order.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expanded === order.id && (
                    <tr key={`${order.id}-exp`} className="bg-secondary/20 border-b border-border">
                      <td colSpan={8} className="px-8 py-3">
                        <div className="text-xs text-muted-foreground mb-2 font-medium">Order Items:</div>
                        <div className="space-y-1">
                          {order.items.map((item, i) => (
                            <div key={i} className="flex items-center justify-between text-xs">
                              <span className="text-foreground">{item.productName} <span className="text-muted-foreground data-num">({item.sku})</span></span>
                              <span className="data-num text-muted-foreground">{item.quantity} × {fmt(item.unitCost)} = <span className="text-foreground font-medium">{fmt(item.quantity * item.unitCost)}</span></span>
                            </div>
                          ))}
                        </div>
                        {order.notes && <div className="text-xs text-muted-foreground mt-2">Note: {order.notes}</div>}
                        {order.receivedDate && <div className="text-xs text-emerald-400 mt-1">Received: {new Date(order.receivedDate).toLocaleDateString()}</div>}
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-card border border-border rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="font-bold text-lg" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>New Purchase Order</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded hover:bg-secondary"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Supplier *</label>
                  <select value={formSupplier} onChange={e => setFormSupplier(e.target.value)}
                    className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                    <option value="">Select supplier</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Expected Delivery</label>
                  <input type="date" value={formExpected} onChange={e => setFormExpected(e.target.value)}
                    className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
              </div>

              {/* Add Item */}
              <div className="border border-border rounded-lg p-4 space-y-3">
                <div className="text-sm font-medium text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Add Item</div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-3 sm:col-span-1">
                    <label className="text-xs text-muted-foreground mb-1 block">Product</label>
                    <select value={itemProductId} onChange={e => {
                      setItemProductId(e.target.value);
                      const p = products.find(pr => pr.id === e.target.value);
                      if (p) setItemCost(p.costPrice);
                    }}
                      className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                      <option value="">Select product</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Quantity</label>
                    <input type="number" min="1" value={itemQty} onChange={e => setItemQty(parseInt(e.target.value) || 1)}
                      className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm data-num focus:outline-none focus:ring-1 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Unit Cost ($)</label>
                    <input type="number" min="0" step="0.01" value={itemCost} onChange={e => setItemCost(parseFloat(e.target.value) || 0)}
                      className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm data-num focus:outline-none focus:ring-1 focus:ring-primary" />
                  </div>
                </div>
                <button onClick={addItem} className="flex items-center gap-2 text-sm px-3 py-1.5 bg-secondary hover:bg-primary hover:text-primary-foreground rounded-md transition-colors text-muted-foreground">
                  <Plus className="w-3.5 h-3.5" /> Add to Order
                </button>
              </div>

              {/* Items List */}
              {formItems.length > 0 && (
                <div className="border border-border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-secondary/50 border-b border-border">
                      <tr>
                        <th className="text-left text-xs text-muted-foreground font-medium px-4 py-2">Product</th>
                        <th className="text-right text-xs text-muted-foreground font-medium px-4 py-2">Qty</th>
                        <th className="text-right text-xs text-muted-foreground font-medium px-4 py-2">Unit Cost</th>
                        <th className="text-right text-xs text-muted-foreground font-medium px-4 py-2">Total</th>
                        <th className="px-2 py-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {formItems.map((item, i) => (
                        <tr key={i} className="border-b border-border/50">
                          <td className="px-4 py-2 text-foreground">{item.productName}</td>
                          <td className="px-4 py-2 text-right data-num text-muted-foreground">{item.quantity}</td>
                          <td className="px-4 py-2 text-right data-num text-muted-foreground">{fmt(item.unitCost)}</td>
                          <td className="px-4 py-2 text-right data-num font-medium text-foreground">{fmt(item.quantity * item.unitCost)}</td>
                          <td className="px-2 py-2">
                            <button onClick={() => setFormItems(prev => prev.filter((_, j) => j !== i))}
                              className="p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-secondary/30">
                        <td colSpan={3} className="px-4 py-2 text-right text-sm font-semibold text-foreground">Total</td>
                        <td className="px-4 py-2 text-right data-num font-bold text-primary">
                          {fmt(formItems.reduce((s, i) => s + i.quantity * i.unitCost, 0))}
                        </td>
                        <td></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Notes</label>
                <textarea value={formNotes} onChange={e => setFormNotes(e.target.value)} rows={2}
                  className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none" />
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-colors">Cancel</button>
              <button onClick={handleCreate} className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium">
                Create Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
