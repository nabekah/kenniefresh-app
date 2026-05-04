// =============================================================
// DESIGN SYSTEM: Industrial Ledger
// Expenses: Summary cards by category, log expense modal,
// full history table with search/filter, CSV export
// =============================================================

import { useState, useMemo } from "react";
import {
  Plus, Search, Edit2, Trash2, X, Download,
  Receipt, Wallet, TrendingDown, Calendar,
  Banknote, CreditCard, Smartphone, Building2,
} from "lucide-react";
import { toast } from "sonner";
import {
  getExpenses, addExpense, updateExpense, deleteExpense,
  EXPENSE_CATEGORIES, type Expense, type ExpenseCategory, fmt,
} from "@/lib/store";
import { cn } from "@/lib/utils";

const CATEGORY_ICONS: Record<ExpenseCategory, string> = {
  Rent: "🏢", Utilities: "⚡", Salaries: "👥", Supplies: "📦",
  Marketing: "📣", Transport: "🚚", Maintenance: "🔧",
  Insurance: "🛡️", Taxes: "📋", Other: "💼",
};

const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  Rent: "text-blue-400", Utilities: "text-yellow-400", Salaries: "text-purple-400",
  Supplies: "text-emerald-400", Marketing: "text-pink-400", Transport: "text-orange-400",
  Maintenance: "text-cyan-400", Insurance: "text-indigo-400", Taxes: "text-red-400",
  Other: "text-muted-foreground",
};

const emptyForm = {
  category: "Other" as ExpenseCategory,
  description: "",
  amount: 0,
  paymentMethod: "Cash" as Expense["paymentMethod"],
  vendor: "",
  receiptRef: "",
  expenseDate: new Date().toISOString().split("T")[0],
  notes: "",
};

function PayBadge({ method }: { method: Expense["paymentMethod"] }) {
  const map: Record<string, string> = {
    Cash: "badge-in-stock",
    Card: "badge-pending",
    Mobile: "badge-low-stock",
    "Bank Transfer": "badge-received",
  };
  return <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", map[method] ?? "badge-in-stock")}>{method}</span>;
}

function exportCSV(data: object[], filename: string) {
  if (!data.length) return;
  const keys = Object.keys(data[0]);
  const rows = [keys.join(","), ...data.map(row => keys.map(k => JSON.stringify((row as any)[k] ?? "")).join(","))];
  const blob = new Blob([rows.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function Expenses() {
  const [expenses, setExpenses] = useState(() => getExpenses());
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"All" | ExpenseCategory>("All");
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Summary stats
  const stats = useMemo(() => {
    const now = new Date();
    const thisMonth = expenses.filter(e => {
      const d = new Date(e.expenseDate);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    });
    const lastMonth = expenses.filter(e => {
      const d = new Date(e.expenseDate);
      const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lme = new Date(now.getFullYear(), now.getMonth(), 0);
      return d >= lm && d <= lme;
    });
    const totalThisMonth = thisMonth.reduce((s, e) => s + e.amount, 0);
    const totalLastMonth = lastMonth.reduce((s, e) => s + e.amount, 0);
    const change = totalLastMonth > 0 ? ((totalThisMonth - totalLastMonth) / totalLastMonth) * 100 : 0;

    const byCategory = new Map<ExpenseCategory, number>();
    expenses.forEach(e => byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + e.amount));
    const topCategory = Array.from(byCategory.entries()).sort((a, b) => b[1] - a[1])[0];

    return {
      totalThisMonth: Math.round(totalThisMonth * 100) / 100,
      totalLastMonth: Math.round(totalLastMonth * 100) / 100,
      change,
      count: thisMonth.length,
      topCategory: topCategory ? { name: topCategory[0], amount: Math.round(topCategory[1] * 100) / 100 } : null,
      total: Math.round(expenses.reduce((s, e) => s + e.amount, 0) * 100) / 100,
      byCategory,
    };
  }, [expenses]);

  const filtered = useMemo(() => {
    return expenses.filter(e => {
      const q = search.toLowerCase();
      const matchSearch = !q ||
        e.description.toLowerCase().includes(q) ||
        (e.vendor ?? "").toLowerCase().includes(q) ||
        e.expenseNumber.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q);
      const matchCat = categoryFilter === "All" || e.category === categoryFilter;
      return matchSearch && matchCat;
    });
  }, [expenses, search, categoryFilter]);

  function openAdd() {
    setEditId(null);
    setForm({ ...emptyForm, expenseDate: new Date().toISOString().split("T")[0] });
    setShowModal(true);
  }

  function openEdit(e: Expense) {
    setEditId(e.id);
    setForm({
      category: e.category,
      description: e.description,
      amount: e.amount,
      paymentMethod: e.paymentMethod,
      vendor: e.vendor ?? "",
      receiptRef: e.receiptRef ?? "",
      expenseDate: e.expenseDate.split("T")[0],
      notes: e.notes,
    });
    setShowModal(true);
  }

  function handleSave() {
    if (!form.description.trim()) { toast.error("Description is required"); return; }
    if (form.amount <= 0) { toast.error("Amount must be greater than 0"); return; }
    if (editId) {
      updateExpense(editId, { ...form, expenseDate: new Date(form.expenseDate).toISOString() });
      toast.success("Expense updated");
    } else {
      addExpense({ ...form, expenseDate: new Date(form.expenseDate).toISOString() });
      toast.success("Expense logged successfully");
    }
    setExpenses(getExpenses());
    setShowModal(false);
  }

  function handleDelete(id: string) {
    deleteExpense(id);
    setExpenses(getExpenses());
    setDeleteConfirm(null);
    toast.success("Expense deleted");
  }

  function handleExport() {
    const rows = filtered.map(e => ({
      "Expense #": e.expenseNumber,
      Date: new Date(e.expenseDate).toLocaleDateString(),
      Category: e.category,
      Description: e.description,
      Vendor: e.vendor ?? "",
      Amount: e.amount,
      "Payment Method": e.paymentMethod,
      "Receipt Ref": e.receiptRef ?? "",
      Notes: e.notes,
    }));
    exportCSV(rows, "expenses-export.csv");
    toast.success("Expenses exported to CSV");
  }

  const payIcons: Record<Expense["paymentMethod"], React.ReactNode> = {
    Cash: <Banknote className="w-3.5 h-3.5" />,
    Card: <CreditCard className="w-3.5 h-3.5" />,
    Mobile: <Smartphone className="w-3.5 h-3.5" />,
    "Bank Transfer": <Building2 className="w-3.5 h-3.5" />,
  };

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Expenses</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Track and manage all shop expenses</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="flex items-center gap-2 text-sm px-3 py-2 bg-card border border-border rounded-md text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
          <button onClick={openAdd} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors">
            <Plus className="w-4 h-4" /> Log Expense
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4 amber-glow border-primary/30">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">This Month</span>
          </div>
          <div className="data-num text-2xl font-bold text-foreground">{fmt(stats.totalThisMonth)}</div>
          <div className={cn("text-xs mt-1 data-num flex items-center gap-1", stats.change > 0 ? "text-red-400" : "text-emerald-400")}>
            {stats.change > 0 ? "↑" : "↓"} {Math.abs(stats.change).toFixed(1)}% vs last month
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-4 h-4 text-red-400" />
            <span className="text-xs text-muted-foreground">Last Month</span>
          </div>
          <div className="data-num text-2xl font-bold text-foreground">{fmt(stats.totalLastMonth)}</div>
          <div className="text-xs text-muted-foreground mt-1">{stats.count} transactions this month</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Receipt className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Top Category</span>
          </div>
          {stats.topCategory ? (
            <>
              <div className="text-lg font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {CATEGORY_ICONS[stats.topCategory.name as ExpenseCategory]} {stats.topCategory.name}
              </div>
              <div className="data-num text-xs text-muted-foreground mt-1">{fmt(stats.topCategory.amount)} total</div>
            </>
          ) : <div className="text-muted-foreground text-sm">No data</div>}
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">All-Time Total</span>
          </div>
          <div className="data-num text-2xl font-bold text-foreground">{fmt(stats.total)}</div>
          <div className="text-xs text-muted-foreground mt-1">{expenses.length} total records</div>
        </div>
      </div>

      {/* Category Breakdown Bar */}
      <div className="bg-card border border-border rounded-lg p-5">
        <h2 className="font-semibold text-foreground mb-4 text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Spending by Category (All Time)</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {EXPENSE_CATEGORIES.filter(cat => (stats.byCategory.get(cat) ?? 0) > 0)
            .sort((a, b) => (stats.byCategory.get(b) ?? 0) - (stats.byCategory.get(a) ?? 0))
            .map(cat => {
              const amount = stats.byCategory.get(cat) ?? 0;
              const pct = stats.total > 0 ? (amount / stats.total) * 100 : 0;
              return (
                <button key={cat} onClick={() => setCategoryFilter(categoryFilter === cat ? "All" : cat)}
                  className={cn("text-left p-3 rounded-lg border transition-colors",
                    categoryFilter === cat ? "border-primary bg-primary/10" : "border-border hover:border-primary/40 bg-secondary/30")}>
                  <div className="text-lg mb-1">{CATEGORY_ICONS[cat]}</div>
                  <div className={cn("text-xs font-medium", CATEGORY_COLORS[cat])}>{cat}</div>
                  <div className="data-num text-sm font-bold text-foreground mt-0.5">{fmt(amount)}</div>
                  <div className="text-xs text-muted-foreground">{pct.toFixed(1)}%</div>
                  <div className="mt-2 w-full bg-border rounded-full h-1">
                    <div className="h-1 rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </button>
              );
            })}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by description, vendor, or expense #..."
            className="w-full bg-card border border-border rounded-md pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>
        {categoryFilter !== "All" && (
          <button onClick={() => setCategoryFilter("All")}
            className="flex items-center gap-2 text-sm px-3 py-2 bg-primary/10 border border-primary/30 text-primary rounded-md hover:bg-primary/20 transition-colors">
            <X className="w-3.5 h-3.5" /> Clear filter: {categoryFilter}
          </button>
        )}
      </div>

      {/* Expenses Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-secondary/50">
              <tr>
                <th className="text-left text-xs text-muted-foreground font-medium px-4 py-3">Expense #</th>
                <th className="text-left text-xs text-muted-foreground font-medium px-4 py-3">Date</th>
                <th className="text-left text-xs text-muted-foreground font-medium px-4 py-3">Category</th>
                <th className="text-left text-xs text-muted-foreground font-medium px-4 py-3">Description</th>
                <th className="text-left text-xs text-muted-foreground font-medium px-4 py-3">Vendor</th>
                <th className="text-right text-xs text-muted-foreground font-medium px-4 py-3">Amount</th>
                <th className="text-center text-xs text-muted-foreground font-medium px-4 py-3">Payment</th>
                <th className="text-left text-xs text-muted-foreground font-medium px-4 py-3">Receipt Ref</th>
                <th className="text-center text-xs text-muted-foreground font-medium px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-muted-foreground">
                    <Wallet className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    No expenses found
                  </td>
                </tr>
              ) : filtered.map(e => (
                <tr key={e.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors group">
                  <td className="px-4 py-3 data-num text-xs font-medium text-primary">{e.expenseNumber}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(e.expenseDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("text-xs font-medium flex items-center gap-1.5", CATEGORY_COLORS[e.category])}>
                      <span>{CATEGORY_ICONS[e.category]}</span>
                      {e.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground font-medium">{e.description}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{e.vendor || "—"}</td>
                  <td className="px-4 py-3 text-right data-num font-bold text-foreground">{fmt(e.amount)}</td>
                  <td className="px-4 py-3 text-center"><PayBadge method={e.paymentMethod} /></td>
                  <td className="px-4 py-3 text-xs text-muted-foreground data-num">{e.receiptRef || "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(e)} className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setDeleteConfirm(e.id)} className="p-1.5 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            {filtered.length > 0 && (
              <tfoot className="border-t border-border bg-secondary/30">
                <tr>
                  <td colSpan={5} className="px-4 py-3 text-xs font-semibold text-muted-foreground">
                    {filtered.length} expense{filtered.length !== 1 ? "s" : ""} shown
                  </td>
                  <td className="px-4 py-3 text-right data-num font-bold text-foreground">
                    {fmt(filtered.reduce((s, e) => s + e.amount, 0))}
                  </td>
                  <td colSpan={3}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-card border border-border rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="font-bold text-lg" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {editId ? "Edit Expense" : "Log New Expense"}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded hover:bg-secondary"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Category *</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as ExpenseCategory }))}
                    className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                    {EXPENSE_CATEGORIES.map(c => (
                      <option key={c} value={c}>{CATEGORY_ICONS[c]} {c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Date *</label>
                  <input type="date" value={form.expenseDate} onChange={e => setForm(f => ({ ...f, expenseDate: e.target.value }))}
                    className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Description *</label>
                <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="e.g. Monthly shop rent payment"
                  className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Amount ($) *</label>
                  <input type="number" min="0.01" step="0.01" value={form.amount || ""}
                    onChange={e => setForm(f => ({ ...f, amount: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                    className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm data-num focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Payment Method</label>
                  <select value={form.paymentMethod} onChange={e => setForm(f => ({ ...f, paymentMethod: e.target.value as Expense["paymentMethod"] }))}
                    className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                    {(["Cash", "Card", "Bank Transfer", "Mobile"] as const).map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Vendor / Payee</label>
                  <input value={form.vendor} onChange={e => setForm(f => ({ ...f, vendor: e.target.value }))}
                    placeholder="e.g. City Properties Ltd"
                    className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Receipt Reference</label>
                  <input value={form.receiptRef} onChange={e => setForm(f => ({ ...f, receiptRef: e.target.value }))}
                    placeholder="e.g. REC-ABC123"
                    className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Notes</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2}
                  placeholder="Optional additional notes..."
                  className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none" />
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-colors">Cancel</button>
              <button onClick={handleSave} className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium">
                {editId ? "Save Changes" : "Log Expense"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-sm">
            <h3 className="font-bold text-lg mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Delete Expense?</h3>
            <p className="text-sm text-muted-foreground mb-5">This expense record will be permanently removed.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-sm hover:bg-secondary rounded-md transition-colors">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="px-4 py-2 text-sm bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-colors font-medium">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
