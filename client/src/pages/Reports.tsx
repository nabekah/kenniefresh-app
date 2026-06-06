// =============================================================
// DESIGN SYSTEM: Industrial Ledger
// Reports: Revenue & profit trends, category breakdown,
// top products table, payment method split, CSV export
// Period filters: Daily | Weekly | Monthly | Yearly | Custom
// DB-backed via tRPC analytics router
// =============================================================

import { useState, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
} from "recharts";
import { Download, BarChart3, TrendingUp, DollarSign, ShoppingBag, Calendar } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

const fmt = (n: number | string) => `₵${parseFloat(String(n)).toFixed(2)}`;
const PIE_COLORS = ["#F59E0B", "#34D399", "#60A5FA", "#A78BFA", "#F87171", "#FB923C"];

type PeriodMode = "daily" | "weekly" | "monthly" | "yearly" | "custom";

function exportCSV(data: object[], filename: string) {
  if (data.length === 0) return;
  const keys = Object.keys(data[0]!);
  const rows = [keys.join(","), ...data.map(row => keys.map(k => JSON.stringify((row as Record<string, unknown>)[k] ?? "")).join(","))];
  const blob = new Blob([rows.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function toInputDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function startOfWeek(d: Date) {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const result = new Date(d);
  result.setDate(diff);
  result.setHours(0, 0, 0, 0);
  return result;
}

export default function Reports() {
  const [mode, setMode] = useState<PeriodMode>("monthly");

  const today = new Date();
  const [customStart, setCustomStart] = useState(toInputDate(new Date(today.getFullYear(), today.getMonth(), 1)));
  const [customEnd, setCustomEnd] = useState(toInputDate(today));

  // Compute start/end dates based on mode
  const { startDate, endDate } = useMemo(() => {
    const now = new Date();
    if (mode === "daily") {
      const s = new Date(now); s.setHours(0, 0, 0, 0);
      const e = new Date(now); e.setHours(23, 59, 59, 999);
      return { startDate: toInputDate(s), endDate: toInputDate(e) };
    }
    if (mode === "weekly") {
      const s = startOfWeek(now);
      const e = new Date(now); e.setHours(23, 59, 59, 999);
      return { startDate: toInputDate(s), endDate: toInputDate(e) };
    }
    if (mode === "monthly") {
      const s = new Date(now.getFullYear(), now.getMonth(), 1);
      const e = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      return { startDate: toInputDate(s), endDate: toInputDate(e) };
    }
    if (mode === "yearly") {
      const s = new Date(now.getFullYear(), 0, 1);
      const e = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      return { startDate: toInputDate(s), endDate: toInputDate(e) };
    }
    // custom
    return { startDate: customStart, endDate: customEnd };
  }, [mode, customStart, customEnd]);

  const { data: analytics, isLoading } = trpc.analytics.dashboard.useQuery(
    { startDate, endDate },
    { refetchOnWindowFocus: false }
  );

  const revenueChart = analytics?.revenueChart ?? [];
  const categoryChart = (analytics?.categoryChart ?? []).map(c => ({ name: c.name, value: c.value }));
  const topProducts = analytics?.topProducts ?? [];
  const paymentMethods = analytics?.paymentMethods ?? [];

  // Group chart data for yearly (weekly buckets)
  const chartData = useMemo(() => {
    if (mode !== "yearly" || revenueChart.length <= 14) return revenueChart;
    // Group into weekly buckets
    const weeks: Record<string, { date: string; revenue: number; profit: number }> = {};
    for (const row of revenueChart) {
      const d = new Date(row.date);
      const weekStart = startOfWeek(d);
      const key = toInputDate(weekStart);
      if (!weeks[key]) weeks[key] = { date: key, revenue: 0, profit: 0 };
      weeks[key]!.revenue += row.revenue;
      weeks[key]!.profit += row.profit;
    }
    return Object.values(weeks).sort((a, b) => a.date.localeCompare(b.date));
  }, [revenueChart, mode]);

  const totalRevenue = analytics?.totalRevenue ?? 0;
  const totalProfit = analytics?.totalProfit ?? 0;
  const totalExpenses = analytics?.totalExpenses ?? 0;
  const netProfit = analytics?.netProfit ?? 0;
  const totalOrders = analytics?.totalOrders ?? 0;
  const avgOrderValue = analytics?.avgOrderValue ?? 0;

  const PERIODS: { key: PeriodMode; label: string }[] = [
    { key: "daily", label: "Daily" },
    { key: "weekly", label: "Weekly" },
    { key: "monthly", label: "Monthly" },
    { key: "yearly", label: "Yearly" },
    { key: "custom", label: "Custom" },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Reports
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {startDate} → {endDate}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Period selector */}
          <div className="flex gap-1 bg-secondary/50 rounded-lg p-1">
            {PERIODS.map(p => (
              <button
                key={p.key}
                onClick={() => setMode(p.key)}
                className={cn(
                  "text-xs px-3 py-1.5 rounded-md transition-colors font-medium",
                  mode === p.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
          {/* Custom date pickers */}
          {mode === "custom" && (
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <input
                type="date"
                value={customStart}
                onChange={e => setCustomStart(e.target.value)}
                className="text-xs bg-secondary border border-border rounded px-2 py-1.5 text-foreground"
              />
              <span className="text-xs text-muted-foreground">to</span>
              <input
                type="date"
                value={customEnd}
                onChange={e => setCustomEnd(e.target.value)}
                className="text-xs bg-secondary border border-border rounded px-2 py-1.5 text-foreground"
              />
            </div>
          )}
          <button
            onClick={() => exportCSV(topProducts, `sales-report-${mode}.csv`)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-secondary text-foreground hover:bg-secondary/80 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-lg p-4 h-24 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {[
            { title: "Revenue", value: fmt(totalRevenue), icon: DollarSign, highlight: true },
            { title: "Profit", value: fmt(totalProfit), icon: TrendingUp, highlight: true },
            { title: "Expenses", value: fmt(totalExpenses), icon: BarChart3 },
            { title: "Net Profit", value: fmt(netProfit), icon: TrendingUp },
            { title: "Orders", value: totalOrders, icon: ShoppingBag },
            { title: "Avg Order", value: fmt(avgOrderValue), icon: DollarSign },
          ].map(({ title, value, icon: Icon, highlight }) => (
            <div key={title} className={cn(
              "bg-card border border-border rounded-lg p-4 flex flex-col gap-2",
              highlight && "border-primary/30"
            )}>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{title}</span>
                <Icon className={cn("w-3.5 h-3.5", highlight ? "text-primary" : "text-muted-foreground")} />
              </div>
              <div className="data-num text-lg font-bold text-foreground">{value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Revenue Bar Chart */}
        <div className="xl:col-span-2 bg-card border border-border rounded-lg p-5">
          <h2 className="font-semibold text-foreground mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Revenue & Profit</h2>
          {chartData.length === 0 ? (
            <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">No data in this period</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0.008 260)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "oklch(0.55 0.010 260)", fontFamily: "JetBrains Mono" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "oklch(0.55 0.010 260)", fontFamily: "JetBrains Mono" }} tickLine={false} axisLine={false} tickFormatter={v => `₵${v}`} />
                <Tooltip
                  contentStyle={{ background: "oklch(0.16 0.008 260)", border: "1px solid oklch(0.25 0.008 260)", borderRadius: "6px", fontFamily: "JetBrains Mono", fontSize: "12px" }}
                  formatter={(value: number, name: string) => [fmt(value), name === "revenue" ? "Revenue" : "Profit"]}
                />
                <Bar dataKey="revenue" fill="#F59E0B" radius={[3, 3, 0, 0]} />
                <Bar dataKey="profit" fill="#34D399" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
          <div className="flex gap-4 mt-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="w-3 h-2 bg-amber-400 inline-block rounded-sm" />Revenue</div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="w-3 h-2 bg-emerald-400 inline-block rounded-sm" />Profit</div>
          </div>
        </div>

        {/* Payment Methods Pie */}
        <div className="bg-card border border-border rounded-lg p-5">
          <h2 className="font-semibold text-foreground mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Payment Methods</h2>
          {paymentMethods.length === 0 ? (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">No data</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={paymentMethods} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                  {paymentMethods.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "oklch(0.16 0.008 260)", border: "1px solid oklch(0.25 0.008 260)", borderRadius: "6px", fontFamily: "JetBrains Mono", fontSize: "12px" }}
                  formatter={(value: number) => [fmt(value), "Revenue"]}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
          <div className="space-y-1.5 mt-2">
            {paymentMethods.slice(0, 4).map((pm, i) => (
              <div key={pm.method} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                  <span className="text-muted-foreground capitalize">{pm.method}</span>
                </div>
                <span className="data-num text-foreground">{fmt(pm.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="bg-card border border-border rounded-lg p-5">
        <h2 className="font-semibold text-foreground mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Revenue by Category</h2>
        {categoryChart.length === 0 ? (
          <div className="h-[160px] flex items-center justify-center text-muted-foreground text-sm">No data in this period</div>
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={categoryChart} layout="vertical" margin={{ top: 0, right: 20, left: 80, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0.008 260)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: "oklch(0.55 0.010 260)", fontFamily: "JetBrains Mono" }} tickLine={false} axisLine={false} tickFormatter={v => `₵${v}`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "oklch(0.75 0.010 260)" }} tickLine={false} axisLine={false} width={75} />
              <Tooltip
                contentStyle={{ background: "oklch(0.16 0.008 260)", border: "1px solid oklch(0.25 0.008 260)", borderRadius: "6px", fontFamily: "JetBrains Mono", fontSize: "12px" }}
                formatter={(value: number) => [fmt(value), "Revenue"]}
              />
              <Bar dataKey="value" fill="#60A5FA" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Order Volume Trend */}
      {revenueChart.length > 1 && (
        <div className="bg-card border border-border rounded-lg p-5">
          <h2 className="font-semibold text-foreground mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Order Volume Trend</h2>
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={revenueChart} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0.008 260)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "oklch(0.55 0.010 260)", fontFamily: "JetBrains Mono" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "oklch(0.55 0.010 260)", fontFamily: "JetBrains Mono" }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: "oklch(0.16 0.008 260)", border: "1px solid oklch(0.25 0.008 260)", borderRadius: "6px", fontFamily: "JetBrains Mono", fontSize: "12px" }}
                formatter={(value: number) => [value, "Revenue"]}
              />
              <Line type="monotone" dataKey="revenue" stroke="#A78BFA" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Top Products Table */}
      <div className="bg-card border border-border rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Top Selling Products</h2>
          <button
            onClick={() => exportCSV(topProducts, `top-products-${mode}.csv`)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-secondary text-foreground hover:bg-secondary/80 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
        </div>
        {topProducts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">No sales data in this period</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs text-muted-foreground font-medium pb-2 pr-4">#</th>
                  <th className="text-left text-xs text-muted-foreground font-medium pb-2 pr-4">Product</th>
                  <th className="text-left text-xs text-muted-foreground font-medium pb-2 pr-4">SKU</th>
                  <th className="text-right text-xs text-muted-foreground font-medium pb-2 pr-4">Units Sold</th>
                  <th className="text-right text-xs text-muted-foreground font-medium pb-2 pr-4">Revenue</th>
                  <th className="text-right text-xs text-muted-foreground font-medium pb-2">Profit</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((p, i) => (
                  <tr key={p.name} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                    <td className="py-2.5 pr-4 data-num text-muted-foreground text-xs">{i + 1}</td>
                    <td className="py-2.5 pr-4 font-medium text-foreground">{p.name}</td>
                    <td className="py-2.5 pr-4 data-num text-muted-foreground text-xs">{p.sku}</td>
                    <td className="py-2.5 pr-4 text-right data-num text-foreground">{p.units}</td>
                    <td className="py-2.5 pr-4 text-right data-num text-foreground">{fmt(p.revenue)}</td>
                    <td className="py-2.5 text-right data-num text-emerald-400">{fmt(p.profit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
