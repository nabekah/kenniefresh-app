// =============================================================
// DESIGN SYSTEM: Industrial Ledger
// Reports: Revenue & profit trends, category breakdown,
// top products table, payment method split, CSV export
// Period filters: Daily | Weekly | Monthly | Custom
// =============================================================

import { useState, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
} from "recharts";
import { Download, BarChart3, TrendingUp, DollarSign, ShoppingBag, TrendingDown, Calendar } from "lucide-react";
import { getSales, getProducts, getCategoryChartData, getTopProducts, getRevenueChartData, getExpenses, fmt } from "@/lib/store";
import { cn } from "@/lib/utils";

const PIE_COLORS = ["#F59E0B", "#34D399", "#60A5FA", "#A78BFA", "#F87171", "#FB923C"];

type PeriodMode = "daily" | "weekly" | "monthly" | "yearly" | "custom";

function exportCSV(data: object[], filename: string) {
  if (data.length === 0) return;
  const keys = Object.keys(data[0]);
  const rows = [keys.join(","), ...data.map(row => keys.map(k => JSON.stringify((row as any)[k] ?? "")).join(","))];
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
  const day = d.getDay(); // 0=Sun
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Mon
  const result = new Date(d);
  result.setDate(diff);
  result.setHours(0, 0, 0, 0);
  return result;
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

export default function Reports() {
  const [mode, setMode] = useState<PeriodMode>("monthly");

  // For custom range
  const today = new Date();
  const [customStart, setCustomStart] = useState(toInputDate(new Date(today.getFullYear(), today.getMonth(), 1)));
  const [customEnd, setCustomEnd] = useState(toInputDate(today));

  const sales = useMemo(() => getSales(), []);
  const products = useMemo(() => getProducts(), []);
  const expenses = useMemo(() => getExpenses(), []);

  // Compute start/end dates based on mode
  const { startDate, endDate, chartDays } = useMemo(() => {
    const now = new Date();
    if (mode === "daily") {
      const s = new Date(now); s.setHours(0, 0, 0, 0);
      const e = new Date(now); e.setHours(23, 59, 59, 999);
      return { startDate: s, endDate: e, chartDays: 1 };
    }
    if (mode === "weekly") {
      const s = startOfWeek(now);
      const e = new Date(now); e.setHours(23, 59, 59, 999);
      return { startDate: s, endDate: e, chartDays: 7 };
    }
    if (mode === "monthly") {
      const s = startOfMonth(now);
      const e = endOfMonth(now);
      return { startDate: s, endDate: e, chartDays: 30 };
    }
    if (mode === "yearly") {
      const s = new Date(now.getFullYear(), 0, 1);
      const e = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      return { startDate: s, endDate: e, chartDays: 365 };
    }
    // custom
    const s = new Date(customStart + "T00:00:00");
    const e = new Date(customEnd + "T23:59:59");
    const days = Math.max(1, Math.round((e.getTime() - s.getTime()) / 86400000) + 1);
    return { startDate: s, endDate: e, chartDays: days };
  }, [mode, customStart, customEnd]);

  const chartData = useMemo(() => getRevenueChartData(chartDays, startDate, endDate), [chartDays, startDate, endDate]);

  const categoryData = useMemo(() => {
    // Category data filtered by period
    const periodSalesLocal = sales.filter(s => {
      const d = new Date(s.saleDate);
      return d >= startDate && d <= endDate;
    });
    const catMap = new Map<string, { revenue: number; units: number }>();
    periodSalesLocal.forEach(sale => {
      sale.items.forEach(item => {
        const prod = products.find(p => p.id === item.productId);
        const cat = prod?.category ?? "Other";
        const existing = catMap.get(cat) ?? { revenue: 0, units: 0 };
        catMap.set(cat, { revenue: existing.revenue + item.unitPrice * item.quantity, units: existing.units + item.quantity });
      });
    });
    return Array.from(catMap.entries()).map(([name, data]) => ({ name, ...data })).sort((a, b) => b.revenue - a.revenue);
  }, [sales, products, startDate, endDate]);

  const topProducts = useMemo(() => {
    const periodSalesLocal = sales.filter(s => {
      const d = new Date(s.saleDate);
      return d >= startDate && d <= endDate;
    });
    const prodMap = new Map<string, { revenue: number; units: number; profit: number }>();
    periodSalesLocal.forEach(sale => {
      sale.items.forEach(item => {
        const existing = prodMap.get(item.productId) ?? { revenue: 0, units: 0, profit: 0 };
        prodMap.set(item.productId, {
          revenue: existing.revenue + item.unitPrice * item.quantity,
          units: existing.units + item.quantity,
          profit: existing.profit + (item.unitPrice - item.unitCost) * item.quantity,
        });
      });
    });
    return Array.from(prodMap.entries())
      .map(([id, data]) => ({ product: products.find(p => p.id === id), ...data }))
      .filter(d => d.product)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  }, [sales, products, startDate, endDate]);

  // Summary stats for the period
  const periodSales = useMemo(() => {
    return sales.filter(s => {
      const d = new Date(s.saleDate);
      return d >= startDate && d <= endDate;
    });
  }, [sales, startDate, endDate]);

  const totalRevenue = periodSales.reduce((s, sale) => s + sale.total, 0);
  const totalProfit = periodSales.reduce((s, sale) => s + sale.profit, 0);
  const totalOrders = periodSales.length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Expenses for the period
  const periodExpenses = useMemo(() => {
    return expenses.filter(e => {
      const d = new Date(e.expenseDate);
      return d >= startDate && d <= endDate;
    });
  }, [expenses, startDate, endDate]);
  const totalExpenses = periodExpenses.reduce((s, e) => s + e.amount, 0);
  const netProfit = totalProfit - totalExpenses;

  // Payment method breakdown
  const paymentData = useMemo(() => {
    const map = new Map<string, number>();
    periodSales.forEach(s => map.set(s.paymentMethod, (map.get(s.paymentMethod) ?? 0) + s.total));
    return Array.from(map.entries()).map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }));
  }, [periodSales]);

  // Weekly aggregation for bar chart (group by week for longer periods, by day for short)
  const barChartData = useMemo(() => {
    const totalDays = chartDays;
    if (totalDays <= 14) {
      // Show daily bars
      return chartData.map(d => ({ label: d.date, revenue: d.revenue, profit: d.profit, orders: d.orders }));
    }
    // Group into weeks
    const weeks: { label: string; revenue: number; profit: number; orders: number }[] = [];
    const numWeeks = Math.ceil(totalDays / 7);
    for (let w = 0; w < numWeeks; w++) {
      const wStart = new Date(startDate);
      wStart.setDate(wStart.getDate() + w * 7);
      const wEnd = new Date(wStart);
      wEnd.setDate(wEnd.getDate() + 6);
      const label = wStart.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const wSales = periodSales.filter(s => {
        const d = new Date(s.saleDate);
        return d >= wStart && d <= wEnd;
      });
      weeks.push({
        label,
        revenue: Math.round(wSales.reduce((s, sale) => s + sale.total, 0) * 100) / 100,
        profit: Math.round(wSales.reduce((s, sale) => s + sale.profit, 0) * 100) / 100,
        orders: wSales.length,
      });
    }
    return weeks;
  }, [chartData, chartDays, periodSales, startDate]);

  // Period label for display
  const periodLabel = useMemo(() => {
    if (mode === "daily") return `Today — ${startDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}`;
    if (mode === "weekly") return `This Week — ${startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })} to ${endDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
    if (mode === "monthly") return `This Month — ${startDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}`;
    if (mode === "yearly") return `This Year — ${startDate.getFullYear()}`;
    return `${new Date(customStart).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} — ${new Date(customEnd).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
  }, [mode, startDate, endDate, customStart, customEnd]);

  function handleExportSales() {
    const rows = periodSales.map(s => ({
      Receipt: s.receiptNumber,
      Date: new Date(s.saleDate).toLocaleDateString(),
      Customer: s.customerName ?? "",
      Items: s.items.map(i => `${i.productName}(${i.quantity})`).join("; "),
      Subtotal: s.subtotal,
      Discount: s.discount,
      Tax: s.tax,
      Total: s.total,
      Profit: s.profit,
      Payment: s.paymentMethod,
    }));
    exportCSV(rows, `sales-report-${mode}.csv`);
  }

  function handleExportProducts() {
    const rows = topProducts.map(({ product, revenue, units, profit }) => ({
      SKU: product!.sku,
      Name: product!.name,
      Category: product!.category,
      "Units Sold": units,
      Revenue: Math.round(revenue * 100) / 100,
      Profit: Math.round(profit * 100) / 100,
      "Profit Margin %": revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : "0.0",
    }));
    exportCSV(rows, `top-products-${mode}.csv`);
  }

  const tooltipStyle = {
    contentStyle: { background: "oklch(0.16 0.008 260)", border: "1px solid oklch(0.25 0.008 260)", borderRadius: "6px", fontFamily: "JetBrains Mono", fontSize: "12px" },
    labelStyle: { color: "oklch(0.92 0.005 65)" },
  };

  const PERIOD_BUTTONS: { key: PeriodMode; label: string }[] = [
    { key: "daily", label: "Daily" },
    { key: "weekly", label: "Weekly" },
    { key: "monthly", label: "Monthly" },
    { key: "yearly", label: "Yearly" },
    { key: "custom", label: "Custom" },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Reports</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{periodLabel}</p>
        </div>
        <div className="flex flex-col gap-2 items-end">
          {/* Period Mode Selector */}
          <div className="flex gap-1 bg-card border border-border rounded-md p-1">
            {PERIOD_BUTTONS.map(({ key, label }) => (
              <button key={key} onClick={() => setMode(key)}
                className={cn("px-3 py-1.5 text-xs rounded transition-colors font-medium",
                  mode === key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
                {label}
              </button>
            ))}
          </div>

          {/* Custom Date Pickers */}
          {mode === "custom" && (
            <div className="flex items-center gap-2 bg-card border border-border rounded-md px-3 py-2">
              <Calendar className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              <input
                type="date"
                value={customStart}
                max={customEnd}
                onChange={e => setCustomStart(e.target.value)}
                className="text-xs bg-transparent text-foreground border-none outline-none"
              />
              <span className="text-xs text-muted-foreground">to</span>
              <input
                type="date"
                value={customEnd}
                min={customStart}
                max={toInputDate(today)}
                onChange={e => setCustomEnd(e.target.value)}
                className="text-xs bg-transparent text-foreground border-none outline-none"
              />
            </div>
          )}

          {/* Export Button */}
          <button onClick={handleExportSales} className="flex items-center gap-2 text-sm px-3 py-2 bg-card border border-border rounded-md text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors">
            <Download className="w-3.5 h-3.5" /> Export Sales
          </button>
        </div>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {[
          { label: "Total Revenue", value: fmt(totalRevenue), icon: DollarSign, highlight: true },
          { label: "Gross Profit", value: fmt(totalProfit), icon: TrendingUp, highlight: true },
          { label: "Total Expenses", value: fmt(totalExpenses), icon: TrendingDown, danger: true },
          { label: "Net Profit", value: fmt(netProfit), icon: BarChart3, net: true },
          { label: "Total Orders", value: totalOrders, icon: ShoppingBag },
          { label: "Avg Order Value", value: fmt(avgOrderValue), icon: DollarSign },
        ].map(({ label, value, icon: Icon, highlight, danger, net }: any) => (
          <div key={label} className={cn("bg-card border border-border rounded-lg p-4",
            highlight && "amber-glow border-primary/30",
            danger && "border-red-500/20 bg-red-500/5",
            net && (netProfit >= 0 ? "border-emerald-500/20 bg-emerald-500/5" : "border-red-500/20 bg-red-500/5")
          )}>
            <div className="flex items-center gap-2 mb-2">
              <Icon className={cn("w-4 h-4",
                highlight ? "text-primary" : danger ? "text-red-400" : net ? (netProfit >= 0 ? "text-emerald-400" : "text-red-400") : "text-muted-foreground"
              )} />
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
            <div className={cn("data-num text-xl font-bold",
              danger ? "text-red-400" : net ? (netProfit >= 0 ? "text-emerald-400" : "text-red-400") : "text-foreground"
            )}>{value}</div>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Bar Chart — daily or weekly grouped */}
        <div className="xl:col-span-2 bg-card border border-border rounded-lg p-5">
          <h2 className="font-semibold text-foreground mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            {chartDays <= 14 ? "Daily Revenue & Profit" : "Weekly Revenue & Profit"}
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barChartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0.008 260)" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: "oklch(0.55 0.010 260)", fontFamily: "JetBrains Mono" }} tickLine={false} axisLine={false} interval={barChartData.length > 14 ? Math.floor(barChartData.length / 7) : 0} />
              <YAxis tick={{ fontSize: 10, fill: "oklch(0.55 0.010 260)", fontFamily: "JetBrains Mono" }} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} />
              <Tooltip {...tooltipStyle} formatter={(v: number, name: string) => [fmt(v), name === "revenue" ? "Revenue" : "Profit"]} />
              <Bar dataKey="revenue" fill="#F59E0B" radius={[3, 3, 0, 0]} />
              <Bar dataKey="profit" fill="#34D399" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="w-3 h-2 bg-amber-400 inline-block rounded-sm" />Revenue</div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="w-3 h-2 bg-emerald-400 inline-block rounded-sm" />Profit</div>
          </div>
        </div>

        {/* Payment Method Pie */}
        <div className="bg-card border border-border rounded-lg p-5">
          <h2 className="font-semibold text-foreground mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Payment Methods</h2>
          {paymentData.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">No sales in this period</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={paymentData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" paddingAngle={4}>
                    {paymentData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip {...tooltipStyle} formatter={(v: number) => [fmt(v), "Revenue"]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {paymentData.map((d, i) => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-muted-foreground">{d.name}</span>
                    </div>
                    <span className="data-num text-foreground">{fmt(d.value)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Category Revenue */}
        <div className="bg-card border border-border rounded-lg p-5">
          <h2 className="font-semibold text-foreground mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Revenue by Category</h2>
          {categoryData.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">No sales in this period</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={categoryData} layout="vertical" margin={{ top: 0, right: 20, left: 80, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0.008 260)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: "oklch(0.55 0.010 260)", fontFamily: "JetBrains Mono" }} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "oklch(0.75 0.005 65)" }} tickLine={false} axisLine={false} width={75} />
                <Tooltip {...tooltipStyle} formatter={(v: number) => [fmt(v), "Revenue"]} />
                <Bar dataKey="revenue" fill="#A78BFA" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Daily Order Volume Line */}
        <div className="bg-card border border-border rounded-lg p-5">
          <h2 className="font-semibold text-foreground mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Order Volume Trend</h2>
          {chartData.every(d => d.orders === 0) ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">No orders in this period</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0.008 260)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "oklch(0.55 0.010 260)", fontFamily: "JetBrains Mono" }} tickLine={false} axisLine={false} interval={chartData.length > 14 ? Math.floor(chartData.length / 7) : 0} />
                <YAxis tick={{ fontSize: 10, fill: "oklch(0.55 0.010 260)", fontFamily: "JetBrains Mono" }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip {...tooltipStyle} formatter={(v: number) => [v, "Orders"]} />
                <Line type="monotone" dataKey="orders" stroke="#60A5FA" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Top Products Table */}
      <div className="bg-card border border-border rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Top Products Performance</h2>
          <button onClick={handleExportProducts} className="flex items-center gap-2 text-xs px-3 py-1.5 bg-secondary hover:bg-primary hover:text-primary-foreground rounded-md transition-colors text-muted-foreground">
            <Download className="w-3 h-3" /> Export CSV
          </button>
        </div>
        {topProducts.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-sm">No product sales in this period</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border">
                <tr>
                  <th className="text-left text-xs text-muted-foreground font-medium pb-2 pr-4">#</th>
                  <th className="text-left text-xs text-muted-foreground font-medium pb-2 pr-4">Product</th>
                  <th className="text-left text-xs text-muted-foreground font-medium pb-2 pr-4">Category</th>
                  <th className="text-right text-xs text-muted-foreground font-medium pb-2 pr-4">Units Sold</th>
                  <th className="text-right text-xs text-muted-foreground font-medium pb-2 pr-4">Revenue</th>
                  <th className="text-right text-xs text-muted-foreground font-medium pb-2 pr-4">Profit</th>
                  <th className="text-right text-xs text-muted-foreground font-medium pb-2">Margin</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map(({ product, revenue, units, profit }, i) => (
                  <tr key={product!.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                    <td className="py-2.5 pr-4 data-num text-muted-foreground text-xs">{i + 1}</td>
                    <td className="py-2.5 pr-4">
                      <div className="font-medium text-foreground">{product!.name}</div>
                      <div className="data-num text-xs text-muted-foreground">{product!.sku}</div>
                    </td>
                    <td className="py-2.5 pr-4 text-sm text-muted-foreground">{product!.category}</td>
                    <td className="py-2.5 pr-4 text-right data-num text-foreground">{units}</td>
                    <td className="py-2.5 pr-4 text-right data-num text-foreground">{fmt(revenue)}</td>
                    <td className="py-2.5 pr-4 text-right data-num text-emerald-400">{fmt(profit)}</td>
                    <td className="py-2.5 text-right data-num text-muted-foreground">
                      {revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : "0.0"}%
                    </td>
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
