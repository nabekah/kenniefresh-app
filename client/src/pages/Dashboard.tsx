// =============================================================
// DESIGN SYSTEM: Industrial Ledger
// Dashboard: KPI mosaic cards, revenue/profit area chart,
// category pie chart, low-stock alerts, recent sales table
// Amber glow on key metrics, monospace numbers throughout
// =============================================================

import { useMemo, useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingBag,
  Package, AlertTriangle, ArrowRight, RefreshCw,
} from "lucide-react";
import { Link } from "wouter";
import { getDashboardStats, getRevenueChartData, getCategoryChartData, getTopProducts, fmt } from "@/lib/store";
import { cn } from "@/lib/utils";

const PIE_COLORS = ["#F59E0B", "#34D399", "#60A5FA", "#A78BFA", "#F87171", "#FB923C"];

function StatCard({
  title, value, change, icon: Icon, highlight = false, prefix = "",
}: {
  title: string; value: string | number; change?: number; icon: React.ElementType; highlight?: boolean; prefix?: string;
}) {
  const isPositive = (change ?? 0) >= 0;
  return (
    <div className={cn(
      "bg-card border border-border rounded-lg p-5 flex flex-col gap-3 transition-all duration-200 hover:border-primary/40",
      highlight && "amber-glow border-primary/30"
    )}>
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground font-medium">{title}</span>
        <div className={cn("w-8 h-8 rounded-md flex items-center justify-center", highlight ? "bg-primary/20" : "bg-secondary")}>
          <Icon className={cn("w-4 h-4", highlight ? "text-primary" : "text-muted-foreground")} />
        </div>
      </div>
      <div className="data-num text-2xl font-bold text-foreground">{prefix}{value}</div>
      {change !== undefined && (
        <div className={cn("flex items-center gap-1 text-xs font-medium", isPositive ? "text-emerald-400" : "text-red-400")}>
          {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          <span>{isPositive ? "+" : ""}{change.toFixed(1)}% vs last month</span>
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const [chartDays, setChartDays] = useState(30);
  const stats = useMemo(() => getDashboardStats(), []);
  const chartData = useMemo(() => getRevenueChartData(chartDays), [chartDays]);
  const categoryData = useMemo(() => getCategoryChartData(), []);
  const topProducts = useMemo(() => getTopProducts(5), []);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-secondary"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Revenue (This Month)" value={fmt(stats.totalRevenue)} change={stats.revenueChange} icon={DollarSign} highlight />
        <StatCard title="Profit (This Month)" value={fmt(stats.totalProfit)} change={stats.profitChange} icon={TrendingUp} highlight />
        <StatCard title="Sales (This Month)" value={stats.totalSales} change={stats.totalSales - stats.lastMonthSales} icon={ShoppingBag} />
        <StatCard title="Total Products" value={stats.totalProducts} icon={Package} />
      </div>

      {/* Alerts Row */}
      {(stats.lowStockCount > 0 || stats.outOfStockCount > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {stats.outOfStockCount > 0 && (
            <Link href="/inventory">
              <div className="flex items-center gap-3 p-4 rounded-lg border badge-out-of-stock cursor-pointer hover:opacity-90 transition-opacity">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">{stats.outOfStockCount} Product{stats.outOfStockCount > 1 ? "s" : ""} Out of Stock</div>
                  <div className="text-xs opacity-75">Immediate restocking required</div>
                </div>
                <ArrowRight className="w-4 h-4 flex-shrink-0" />
              </div>
            </Link>
          )}
          {stats.lowStockCount > 0 && (
            <Link href="/inventory">
              <div className="flex items-center gap-3 p-4 rounded-lg border badge-low-stock cursor-pointer hover:opacity-90 transition-opacity">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">{stats.lowStockCount} Product{stats.lowStockCount > 1 ? "s" : ""} Low on Stock</div>
                  <div className="text-xs opacity-75">Consider placing purchase orders</div>
                </div>
                <ArrowRight className="w-4 h-4 flex-shrink-0" />
              </div>
            </Link>
          )}
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Revenue Chart */}
        <div className="xl:col-span-2 bg-card border border-border rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Revenue & Profit</h2>
            <div className="flex gap-1">
              {[7, 30, 90].map(d => (
                <button
                  key={d}
                  onClick={() => setChartDays(d)}
                  className={cn(
                    "text-xs px-2.5 py-1 rounded transition-colors",
                    chartDays === d ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  )}
                >
                  {d}d
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="profGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#34D399" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#34D399" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0.008 260)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "oklch(0.55 0.010 260)", fontFamily: "JetBrains Mono" }} tickLine={false} axisLine={false} interval={chartDays === 7 ? 0 : chartDays === 30 ? 4 : 13} />
              <YAxis tick={{ fontSize: 11, fill: "oklch(0.55 0.010 260)", fontFamily: "JetBrains Mono" }} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} />
              <Tooltip
                contentStyle={{ background: "oklch(0.16 0.008 260)", border: "1px solid oklch(0.25 0.008 260)", borderRadius: "6px", fontFamily: "JetBrains Mono", fontSize: "12px" }}
                labelStyle={{ color: "oklch(0.92 0.005 65)" }}
                formatter={(value: number, name: string) => [fmt(value), name === "revenue" ? "Revenue" : "Profit"]}
              />
              <Area type="monotone" dataKey="revenue" stroke="#F59E0B" strokeWidth={2} fill="url(#revGrad)" />
              <Area type="monotone" dataKey="profit" stroke="#34D399" strokeWidth={2} fill="url(#profGrad)" />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="w-3 h-0.5 bg-amber-400 inline-block rounded" />Revenue</div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="w-3 h-0.5 bg-emerald-400 inline-block rounded" />Profit</div>
          </div>
        </div>

        {/* Category Pie */}
        <div className="bg-card border border-border rounded-lg p-5">
          <h2 className="font-semibold text-foreground mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Sales by Category</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="revenue" paddingAngle={3}>
                {categoryData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: "oklch(0.16 0.008 260)", border: "1px solid oklch(0.25 0.008 260)", borderRadius: "6px", fontFamily: "JetBrains Mono", fontSize: "12px" }}
                formatter={(value: number) => [fmt(value), "Revenue"]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {categoryData.slice(0, 4).map((cat, i) => (
              <div key={cat.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                  <span className="text-muted-foreground truncate max-w-[100px]">{cat.name}</span>
                </div>
                <span className="data-num text-foreground">{fmt(cat.revenue)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row: Top Products */}
      <div className="bg-card border border-border rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Top Selling Products</h2>
          <Link href="/reports">
            <span className="text-xs text-primary hover:underline flex items-center gap-1">View Reports <ArrowRight className="w-3 h-3" /></span>
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs text-muted-foreground font-medium pb-2 pr-4">Product</th>
                <th className="text-left text-xs text-muted-foreground font-medium pb-2 pr-4">SKU</th>
                <th className="text-right text-xs text-muted-foreground font-medium pb-2 pr-4">Units Sold</th>
                <th className="text-right text-xs text-muted-foreground font-medium pb-2 pr-4">Revenue</th>
                <th className="text-right text-xs text-muted-foreground font-medium pb-2">Profit</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.map(({ product, revenue, units, profit }, i) => (
                <tr key={product!.id} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                  <td className="py-2.5 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded bg-secondary flex items-center justify-center text-xs text-muted-foreground data-num">{i + 1}</span>
                      <span className="font-medium text-foreground truncate max-w-[180px]">{product!.name}</span>
                    </div>
                  </td>
                  <td className="py-2.5 pr-4 data-num text-muted-foreground text-xs">{product!.sku}</td>
                  <td className="py-2.5 pr-4 text-right data-num text-foreground">{units}</td>
                  <td className="py-2.5 pr-4 text-right data-num text-foreground">{fmt(revenue)}</td>
                  <td className="py-2.5 text-right data-num text-emerald-400">{fmt(profit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
