// =============================================================
// DESIGN SYSTEM: Industrial Ledger
// Layout: Fixed left sidebar (240px) + scrollable main content
// Active item: thick amber left border + dark bg highlight
// =============================================================

import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  BarChart3,
  Truck,
  ClipboardList,
  Menu,
  X,
  Store,
  AlertTriangle,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getProducts } from "@/lib/store";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/products", label: "Products", icon: Package },
  { href: "/inventory", label: "Inventory", icon: ClipboardList },
  { href: "/sales", label: "Sales", icon: ShoppingCart },
  { href: "/suppliers", label: "Suppliers", icon: Truck },
  { href: "/purchase-orders", label: "Purchase Orders", icon: ClipboardList },
  { href: "/expenses", label: "Expenses", icon: Wallet },
  { href: "/reports", label: "Reports", icon: BarChart3 },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const products = getProducts();
  const alertCount = products.filter(p => p.stock <= p.lowStockThreshold).length;

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-border">
        <div className="w-8 h-8 rounded bg-primary flex items-center justify-center flex-shrink-0">
          <Store className="w-4 h-4 text-primary-foreground" />
        </div>
        <div>
          <div className="font-bold text-sm text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Kenniefresh.biz
          </div>
          <div className="text-xs text-muted-foreground">Sales & Inventory</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <div className="px-3 mb-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">Main Menu</span>
        </div>
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = href === "/" ? location === "/" : location.startsWith(href);
          return (
            <Link key={href} href={href} onClick={() => setMobileOpen(false)}>
              <div
                className={cn(
                  "flex items-center gap-3 mx-2 px-3 py-2.5 rounded-md text-sm transition-all duration-150 relative group",
                  isActive
                    ? "sidebar-active text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                <Icon className={cn("w-4 h-4 flex-shrink-0", isActive ? "text-primary" : "")} />
                <span>{label}</span>
                {label === "Inventory" && alertCount > 0 && (
                  <span className="ml-auto flex items-center gap-1 text-xs badge-low-stock px-1.5 py-0.5 rounded-full">
                    <AlertTriangle className="w-3 h-3" />
                    {alertCount}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-border">
        <div className="text-xs text-muted-foreground">Kenniefresh.biz v1.0</div>
        <div className="text-xs text-muted-foreground">© 2026 All rights reserved</div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-60 flex-shrink-0 bg-sidebar border-r border-sidebar-border">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-60 bg-sidebar border-r border-sidebar-border z-10">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
          <button onClick={() => setMobileOpen(true)} className="p-1.5 rounded hover:bg-secondary">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
              <Store className="w-3 h-3 text-primary-foreground" />
            </div>
            <span className="font-bold text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Kenniefresh.biz</span>
          </div>
        </header>

        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
