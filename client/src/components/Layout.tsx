// =============================================================
// DESIGN SYSTEM: Kenniefresh Brand
// Layout: Fixed left sidebar (240px) + scrollable main content
// Brand: Royal Blue sidebar, Green accent, Kenniefresh logo
// =============================================================

import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { StockAlertBell } from "./StockAlertBell";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  BarChart3,
  Truck,
  ClipboardList,
  Menu,
  Store,
  AlertTriangle,
  Wallet,
  Globe,
  Sun,
  Moon,
  Phone,
  Users,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getProducts } from "@/lib/store";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663487009313/3xoUtJNXeqJqC5zVHr4FYi/kenniefresh-logo-DnbYmWTkhR4zZV264vT2mc.webp";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/products", label: "Products", icon: Package },
  { href: "/inventory", label: "Inventory", icon: ClipboardList },
  { href: "/sales", label: "Sales", icon: ShoppingCart },
  { href: "/suppliers", label: "Suppliers", icon: Truck },
  { href: "/purchase-orders", label: "Purchase Orders", icon: ClipboardList },
  { href: "/online-orders", label: "Online Orders", icon: Globe },
  { href: "/expenses", label: "Expenses", icon: Wallet },
  { href: "/reports", label: "Reports", icon: BarChart3 },
];

const adminNavItems = [
  { href: "/users", label: "User Management", icon: Users },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location, navigate] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { user, isAuthenticated, loading } = useAuth();

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      navigate("/login");
    },
  });

  const products = getProducts();
  const alertCount = products.filter(p => p.stock <= p.lowStockThreshold).length;

  // Redirect to login if not authenticated — must be in useEffect to avoid setState-during-render
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/login");
    }
  }, [loading, isAuthenticated, navigate]);

  // While auth is loading or redirecting, render nothing
  if (loading || !isAuthenticated) {
    return null;
  }

  const isAdmin = user?.role === "admin";

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Brand Logo */}
      <div className="flex items-center justify-center px-4 py-5 border-b border-sidebar-border" style={{ background: "white" }}>
        <img
          src={LOGO_URL}
          alt="Kenniefresh"
          className="h-16 w-auto object-contain"
        />
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 overflow-y-auto bg-sidebar">
        <div className="px-3 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider px-2" style={{ color: "oklch(0.65 0.18 145)" }}>
            Main Menu
          </span>
        </div>
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = href === "/" ? location === "/" : location.startsWith(href);
          return (
            <Link key={href} href={href} onClick={() => setMobileOpen(false)}>
              <div
                className={cn(
                  "flex items-center gap-3 mx-2 px-3 py-2.5 rounded-md text-sm transition-all duration-150",
                  isActive
                    ? "sidebar-active font-medium"
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                )}
              >
                <Icon
                  className="w-4 h-4 flex-shrink-0"
                  style={isActive ? { color: "oklch(0.58 0.18 145)" } : {}}
                />
                <span className={isActive ? "text-sidebar-foreground" : ""}>{label}</span>
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

        {/* Admin-only section */}
        {isAdmin && (
          <>
            <div className="px-3 mt-4 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider px-2 flex items-center gap-1" style={{ color: "oklch(0.65 0.18 260)" }}>
                <ShieldCheck className="w-3 h-3" /> Admin
              </span>
            </div>
            {adminNavItems.map(({ href, label, icon: Icon }) => {
              const isActive = location.startsWith(href);
              return (
                <Link key={href} href={href} onClick={() => setMobileOpen(false)}>
                  <div
                    className={cn(
                      "flex items-center gap-3 mx-2 px-3 py-2.5 rounded-md text-sm transition-all duration-150",
                      isActive
                        ? "sidebar-active font-medium"
                        : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                    )}
                  >
                    <Icon
                      className="w-4 h-4 flex-shrink-0"
                      style={isActive ? { color: "oklch(0.58 0.18 260)" } : {}}
                    />
                    <span className={isActive ? "text-sidebar-foreground" : ""}>{label}</span>
                  </div>
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-sidebar-border bg-sidebar space-y-2">
        {/* Current user info */}
        {user && (
          <div className="px-2 py-2 rounded-md bg-sidebar-accent/50 mb-1">
            <div className="text-xs font-medium text-sidebar-foreground truncate">{user.name}</div>
            <div className="text-xs text-sidebar-foreground/50 truncate">{user.email}</div>
            <div className="mt-0.5">
              {user.role === "admin" ? (
                <span className="text-xs text-blue-400 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Admin
                </span>
              ) : (
                <span className="text-xs text-green-400 flex items-center gap-1">
                  <ShoppingCart className="w-3 h-3" /> Sales
                </span>
              )}
            </div>
          </div>
        )}

        {/* Visit Shop */}
        <Link href="/shop">
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-md text-xs font-semibold transition-colors"
            style={{ background: "oklch(0.55 0.18 145)", color: "white" }}
          >
            <Store className="w-3.5 h-3.5" />
            <span>Visit Online Shop</span>
          </div>
        </Link>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-xs font-medium text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
        >
          {theme === "dark" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
        </button>

        {/* Logout */}
        <button
          onClick={() => logoutMutation.mutate()}
          disabled={logoutMutation.isPending}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-xs font-medium text-red-400/80 hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>{logoutMutation.isPending ? "Signing out..." : "Sign Out"}</span>
        </button>

        {/* Contact */}
        <div className="px-2 pt-1 border-t border-sidebar-border/50">
          <div className="flex items-center gap-1.5 text-xs text-sidebar-foreground/50 mb-0.5">
            <Phone className="w-3 h-3" />
            <span>0538979775 / 0205153749</span>
          </div>
          <div className="text-xs text-sidebar-foreground/40">© 2026 Kenniefresh.biz</div>
        </div>
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
        {/* Desktop Top Bar */}
        <header className="hidden lg:flex items-center justify-between px-6 py-2.5 border-b border-border bg-card/50 backdrop-blur-sm">
          <div className="text-sm text-muted-foreground font-medium">
            Kenniefresh.biz — {isAdmin ? "Admin Panel" : "Sales Panel"}
          </div>
          <div className="flex items-center gap-2">
            <StockAlertBell />
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
              title="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </header>
        {/* Mobile Header */}
        <header
          className="lg:hidden flex items-center gap-3 px-4 py-2 border-b border-border"
          style={{ background: "oklch(0.35 0.18 260)" }}
        >
          <button onClick={() => setMobileOpen(true)} className="p-1.5 rounded hover:bg-white/10 text-white">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1 flex items-center justify-center">
            <img
              src={LOGO_URL}
              alt="Kenniefresh"
              className="h-9 w-auto object-contain"
              style={{ filter: "brightness(0) invert(1)" }}
            />
          </div>
          <div className="flex items-center gap-1">
            <StockAlertBell />
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded hover:bg-white/10 text-white transition-colors"
              title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
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
