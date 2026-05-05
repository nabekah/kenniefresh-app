// =============================================================
// StockAlertBell — notification bell for low/out-of-stock items
// Shows a badge count, dropdown panel, and triggers owner notify
// =============================================================

import { useState, useEffect, useRef } from "react";
import { Bell, BellRing, AlertTriangle, PackageX, X, CheckCheck } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { getProducts } from "@/lib/store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type AlertItem = {
  id: string;
  sku: string;
  name: string;
  stock: number;
  lowStockThreshold: number;
  category: string;
  alertType: "out" | "low";
};

export function StockAlertBell() {
  const [open, setOpen] = useState(false);
  const [products] = useState(() => getProducts());
  const [lastNotified, setLastNotified] = useState<number | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Build alert items from localStorage products
  const alertItems: AlertItem[] = products
    .filter(p => p.stock === 0 || p.stock <= p.lowStockThreshold)
    .map(p => ({
      id: p.id,
      sku: p.sku,
      name: p.name,
      stock: p.stock,
      lowStockThreshold: p.lowStockThreshold,
      category: p.category,
      alertType: (p.stock === 0 ? "out" : "low") as "out" | "low",
    }))
    .sort((a, b) => (a.alertType === "out" ? -1 : 1) - (b.alertType === "out" ? -1 : 1));

  const outCount = alertItems.filter(a => a.alertType === "out").length;
  const lowCount = alertItems.filter(a => a.alertType === "low").length;
  const totalAlerts = alertItems.length;

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const notifyMutation = trpc.alerts.checkAndNotify.useMutation({
    onSuccess: (data) => {
      if (data.notified) {
        toast.success(`Owner notified about ${data.alertedItems?.length ?? 0} item(s)!`);
        setLastNotified(Date.now());
      } else {
        toast.info("No new alerts to send (already notified recently).");
      }
    },
    onError: () => toast.error("Failed to send notification"),
  });

  function handleNotify() {
    notifyMutation.mutate({ products: alertItems });
  }

  if (totalAlerts === 0) {
    return (
      <button
        className="relative p-2 rounded-full hover:bg-secondary transition-colors text-muted-foreground"
        title="No stock alerts"
      >
        <Bell className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(o => !o)}
        className={cn(
          "relative p-2 rounded-full transition-colors",
          outCount > 0
            ? "text-red-500 hover:bg-red-500/10 animate-pulse"
            : "text-amber-500 hover:bg-amber-500/10"
        )}
        title={`${totalAlerts} stock alert${totalAlerts !== 1 ? "s" : ""}`}
      >
        <BellRing className="w-5 h-5" />
        {/* Badge */}
        <span className={cn(
          "absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full text-[10px] font-bold flex items-center justify-center text-white px-1",
          outCount > 0 ? "bg-red-500" : "bg-amber-500"
        )}>
          {totalAlerts > 99 ? "99+" : totalAlerts}
        </span>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-secondary/50">
            <div className="flex items-center gap-2">
              <BellRing className="w-4 h-4 text-amber-500" />
              <span className="font-semibold text-sm text-foreground">Stock Alerts</span>
              <span className={cn(
                "text-xs px-1.5 py-0.5 rounded-full font-medium",
                outCount > 0 ? "bg-red-500/20 text-red-500" : "bg-amber-500/20 text-amber-500"
              )}>
                {totalAlerts}
              </span>
            </div>
            <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-secondary text-muted-foreground">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Summary row */}
          <div className="flex gap-3 px-4 py-2.5 border-b border-border/50 bg-secondary/20">
            {outCount > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-red-500">
                <PackageX className="w-3.5 h-3.5" />
                <span className="font-medium">{outCount} Out of Stock</span>
              </div>
            )}
            {lowCount > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-amber-500">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span className="font-medium">{lowCount} Low Stock</span>
              </div>
            )}
          </div>

          {/* Alert list */}
          <div className="max-h-64 overflow-y-auto divide-y divide-border/50">
            {alertItems.map(item => (
              <div key={item.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-secondary/30 transition-colors">
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                  item.alertType === "out" ? "bg-red-500/15" : "bg-amber-500/15"
                )}>
                  {item.alertType === "out"
                    ? <PackageX className="w-4 h-4 text-red-500" />
                    : <AlertTriangle className="w-4 h-4 text-amber-500" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">{item.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {item.alertType === "out"
                      ? "No stock remaining"
                      : `${item.stock} left · threshold: ${item.lowStockThreshold}`
                    }
                  </div>
                </div>
                <span className={cn(
                  "text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0",
                  item.alertType === "out"
                    ? "bg-red-500/20 text-red-500"
                    : "bg-amber-500/20 text-amber-500"
                )}>
                  {item.alertType === "out" ? "OUT" : "LOW"}
                </span>
              </div>
            ))}
          </div>

          {/* Footer — notify button */}
          <div className="px-4 py-3 border-t border-border bg-secondary/30">
            <button
              onClick={handleNotify}
              disabled={notifyMutation.isPending}
              className={cn(
                "w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors",
                notifyMutation.isPending
                  ? "bg-secondary text-muted-foreground cursor-not-allowed"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
            >
              <CheckCheck className="w-4 h-4" />
              {notifyMutation.isPending ? "Sending notification…" : "Notify Me Now"}
            </button>
            {lastNotified && (
              <p className="text-center text-xs text-muted-foreground mt-1.5">
                Last notified: {new Date(lastNotified).toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
