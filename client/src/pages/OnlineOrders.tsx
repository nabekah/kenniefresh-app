// =============================================================
// DESIGN SYSTEM: Industrial Ledger
// Admin: Online Orders — view, filter, update status, details
// =============================================================

import { useState, useMemo } from "react";
import { Search, ExternalLink, ChevronDown, ChevronUp, Package, Truck, CheckCircle, XCircle, Clock, ShoppingBag } from "lucide-react";
import { getOnlineOrders, updateOnlineOrder, fmt, type OnlineOrder } from "@/lib/store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Link } from "wouter";

const STATUS_CONFIG: Record<OnlineOrder["status"], { label: string; color: string; icon: React.ReactNode }> = {
  Pending:    { label: "Pending",    color: "bg-amber-500/20 text-amber-400 border-amber-500/30",    icon: <Clock className="w-3 h-3" /> },
  Processing: { label: "Processing", color: "bg-blue-500/20 text-blue-400 border-blue-500/30",       icon: <Package className="w-3 h-3" /> },
  Shipped:    { label: "Shipped",    color: "bg-purple-500/20 text-purple-400 border-purple-500/30", icon: <Truck className="w-3 h-3" /> },
  Delivered:  { label: "Delivered",  color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", icon: <CheckCircle className="w-3 h-3" /> },
  Cancelled:  { label: "Cancelled",  color: "bg-red-500/20 text-red-400 border-red-500/30",          icon: <XCircle className="w-3 h-3" /> },
};

const STATUS_FLOW: OnlineOrder["status"][] = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"];

function StatusBadge({ status }: { status: OnlineOrder["status"] }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium", cfg.color)}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

function OrderRow({ order, onUpdate }: { order: OnlineOrder; onUpdate: () => void }) {
  const [expanded, setExpanded] = useState(false);

  function changeStatus(status: OnlineOrder["status"]) {
    updateOnlineOrder(order.id, { status });
    onUpdate();
    toast.success(`Order ${order.orderNumber} marked as ${status}`);
  }

  return (
    <>
      <tr className="border-b border-border/50 hover:bg-secondary/30 transition-colors cursor-pointer" onClick={() => setExpanded(e => !e)}>
        <td className="px-4 py-3 data-num text-xs font-medium text-primary">{order.orderNumber}</td>
        <td className="px-4 py-3">
          <div className="text-sm font-medium text-foreground">{order.customerName}</div>
          <div className="text-xs text-muted-foreground">{order.customerEmail}</div>
        </td>
        <td className="px-4 py-3 text-xs text-muted-foreground">
          {new Date(order.orderDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </td>
        <td className="px-4 py-3 text-xs text-muted-foreground">{order.items.length} item{order.items.length !== 1 ? "s" : ""}</td>
        <td className="px-4 py-3 data-num font-bold text-foreground text-right">{fmt(order.total)}</td>
        <td className="px-4 py-3 text-center"><StatusBadge status={order.status} /></td>
        <td className="px-4 py-3 text-center text-muted-foreground">
          {expanded ? <ChevronUp className="w-4 h-4 mx-auto" /> : <ChevronDown className="w-4 h-4 mx-auto" />}
        </td>
      </tr>
      {expanded && (
        <tr className="border-b border-border bg-secondary/20">
          <td colSpan={7} className="px-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Items */}
              <div className="md:col-span-2">
                <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Order Items</h4>
                <div className="space-y-2">
                  {order.items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between bg-card rounded-lg px-3 py-2">
                      <div>
                        <span className="text-sm font-medium text-foreground">{item.productName}</span>
                        <span className="text-xs text-muted-foreground ml-2">× {item.quantity}</span>
                      </div>
                      <span className="data-num text-sm font-bold text-foreground">{fmt(item.unitPrice * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span>Subtotal: <strong className="text-foreground">{fmt(order.subtotal)}</strong></span>
                  <span>Shipping: <strong className="text-foreground">{order.shippingFee === 0 ? "FREE" : fmt(order.shippingFee)}</strong></span>
                  <span>Tax: <strong className="text-foreground">{fmt(order.tax)}</strong></span>
                  <span>Payment: <strong className={cn("px-1.5 py-0.5 rounded-full font-bold",
                    order.paymentMethod === "MTN MoMo" ? "bg-yellow-400/20 text-yellow-400" :
                    order.paymentMethod === "Telecel Cash" ? "bg-red-500/20 text-red-400" :
                    "text-foreground")}>{order.paymentMethod}</strong></span>
                </div>
              </div>
              {/* Customer & Status */}
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Customer & Shipping</h4>
                <div className="bg-card rounded-lg p-3 text-xs space-y-1 mb-3">
                  <div><span className="text-muted-foreground">Phone:</span> <span className="text-foreground">{order.customerPhone}</span></div>
                  <div><span className="text-muted-foreground">Address:</span> <span className="text-foreground">{order.shippingAddress}</span></div>
                  {order.notes && <div><span className="text-muted-foreground">Notes:</span> <span className="text-foreground">{order.notes}</span></div>}
                </div>
                <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Update Status</h4>
                <div className="flex flex-wrap gap-1.5">
                  {STATUS_FLOW.filter(s => s !== order.status).map(s => (
                    <button key={s} onClick={e => { e.stopPropagation(); changeStatus(s); }}
                      className={cn("text-xs px-2.5 py-1 rounded-full border font-medium transition-colors hover:opacity-80", STATUS_CONFIG[s].color)}>
                      → {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function OnlineOrders() {
  const [orders, setOrders] = useState(() => getOnlineOrders());
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | OnlineOrder["status"]>("All");

  function refresh() { setOrders(getOnlineOrders()); }

  const filtered = useMemo(() => {
    return orders.filter(o => {
      const q = search.toLowerCase();
      const matchSearch = !q || o.orderNumber.toLowerCase().includes(q) || o.customerName.toLowerCase().includes(q) || o.customerEmail.toLowerCase().includes(q);
      const matchStatus = statusFilter === "All" || o.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [orders, search, statusFilter]);

  const stats = useMemo(() => {
    const pending = orders.filter(o => o.status === "Pending").length;
    const processing = orders.filter(o => o.status === "Processing").length;
    const shipped = orders.filter(o => o.status === "Shipped").length;
    const revenue = orders.filter(o => o.status !== "Cancelled").reduce((s, o) => s + o.total, 0);
    return { pending, processing, shipped, revenue, total: orders.length };
  }, [orders]);

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Online Orders</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage customer orders from the online shop</p>
        </div>
        <Link href="/shop">
          <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors">
            <ExternalLink className="w-4 h-4" /> Visit Shop
          </button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Total Orders", value: stats.total, icon: ShoppingBag },
          { label: "Pending", value: stats.pending, icon: Clock, color: "text-amber-400" },
          { label: "Processing", value: stats.processing, icon: Package, color: "text-blue-400" },
          { label: "Shipped", value: stats.shipped, icon: Truck, color: "text-purple-400" },
          { label: "Total Revenue", value: fmt(stats.revenue), icon: CheckCircle, color: "text-emerald-400", highlight: true },
        ].map(({ label, value, icon: Icon, color, highlight }) => (
          <div key={label} className={cn("bg-card border border-border rounded-lg p-4", highlight && "amber-glow border-primary/30")}>
            <div className="flex items-center gap-2 mb-2">
              <Icon className={cn("w-4 h-4", color ?? (highlight ? "text-primary" : "text-muted-foreground"))} />
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
            <div className="data-num text-2xl font-bold text-foreground">{value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by order #, customer name, or email..."
            className="w-full bg-card border border-border rounded-md pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(["All", ...STATUS_FLOW] as const).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={cn("text-xs px-3 py-1.5 rounded-full border font-medium transition-colors",
                statusFilter === s
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:border-primary/40")}>
              {s}
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
                <th className="text-left text-xs text-muted-foreground font-medium px-4 py-3">Customer</th>
                <th className="text-left text-xs text-muted-foreground font-medium px-4 py-3">Date</th>
                <th className="text-left text-xs text-muted-foreground font-medium px-4 py-3">Items</th>
                <th className="text-right text-xs text-muted-foreground font-medium px-4 py-3">Total</th>
                <th className="text-center text-xs text-muted-foreground font-medium px-4 py-3">Status</th>
                <th className="text-center text-xs text-muted-foreground font-medium px-4 py-3">Details</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-muted-foreground">
                    <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    {orders.length === 0 ? "No online orders yet. Share your shop link to start receiving orders!" : "No orders match your filter"}
                  </td>
                </tr>
              ) : filtered.map(order => (
                <OrderRow key={order.id} order={order} onUpdate={refresh} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
