// =============================================================
// DESIGN SYSTEM: Industrial Ledger
// Expenses: Summary cards by category, log expense modal,
// full history table with search/filter, CSV export
// DB-backed via tRPC
// =============================================================

import { useState, useMemo } from "react";
import {
  Plus, Search, Edit2, Trash2, X, Download,
  Receipt, Wallet, TrendingDown, Calendar,
  Banknote, CreditCard, Smartphone, Building2,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

type ExpenseCategory = "Rent" | "Utilities" | "Salaries" | "Supplies" | "Marketing" | "Transport" | "Maintenance" | "Insurance" | "Taxes" | "Other";
type PaymentMethod = "Cash" | "Card" | "Mobile" | "Bank Transfer";

const EXPENSE_CATEGORIES: ExpenseCategory[] = ["Rent", "Utilities", "Salaries", "Supplies", "Marketing", "Transport", "Maintenance", "Insurance", "Taxes", "Other"];

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

const fmt = (n: number | string) => `₵${parseFloat(String(n)).toFixed(2)}`;

const emptyForm = {
  category: "Other" as ExpenseCategory,
  description: "",
  amount: 0,
  paymentMethod: "Cash" as PaymentMethod,
  vendor: "",
  receiptRef: "",
  expenseDate: new Date().toISOString().split("T")[0],
  notes: "",
};

function PayBadge({ method }: { method: string }) {
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
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"All" | ExpenseCategory>("All");
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const utils = trpc.useUtils();

  const { data: expenses = [], isLoading } = trpc.expenses.list.useQuery(
    { search: search || undefined, category: categoryFilter !== "All" ? categoryFilter : undefined },
    { refetchOnWindowFocus: false }
  );

  const createMutation = trpc.expenses.create.useMutation({
    onSuccess: () => { utils.expenses.list.invalidate(); toast.success("Expense logged successfully"); setShowModal(false); },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.expenses.update.useMutation({
    onSuccess: () => { utils.expenses.list.invalidate(); toast.success("Expense updated"); setShowModal(false); },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.expenses.delete.useMutation({
    onSuccess: () => { utils.expenses.list.invalidate(); setDeleteConfirm(null); toast.success("Expense deleted"); },
    onError: (e) => toast.error(e.message),
  });

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
    const totalThisMonth = thisMonth.reduce((s, e) => s + parseFloat(String(e.amount)), 0);
    const totalLastMonth = lastMonth.reduce((s, e) => s + parseFloat(String(e.amount)), 0);
    const change = totalLastMonth > 0 ? ((totalThisMonth - totalLastMonth) / totalLastMonth) * 100 : 0;

    const byCategory = new Map<string, number>();
    expenses.forEach(e => byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + parseFloat(String(e.amount))));
    const topCategory = Array.from(byCategory.entries()).sort((a, b) => b[1] - a[1])[0];

    return {
      totalThisMonth: Math.round(totalThisMonth * 100) / 100,
      totalLastMonth: Math.round(totalLastMonth * 100) / 100,
      change,
      count: thisMonth.length,
      topCategory: topCategory ? { name: topCategory[0], amount: Math.round(topCategory[1] * 100) / 100 } : null,
      total: Math.round(expenses.reduce((s, e) => s + parseFloat(String(e.amount)), 0) * 100) / 100,
      byCategory,
    };
  }, [expenses]);

  function openAdd() {
    setEditId(null);
    setForm({ ...emptyForm, expenseDate: new Date().toISOString().split("T")[0] });
    setShowModal(true);
  }

  function openEdit(e: typeof expenses[0]) {
    setEditId(e.id);
    setForm({
      category: e.category as ExpenseCategory,
      description: e.description,
      amount: parseFloat(String(e.amount)),
      paymentMethod: e.paymentMethod as PaymentMethod,
      vendor: e.vendor ?? "",
      receiptRef: e.receiptRef ?? "",
      expenseDate: new Date(e.expenseDate).toISOString().split("T")[0],
      notes: e.notes ?? "",
    });
    setShowModal(true);
  }

  function handleSave() {
    if (!form.description.trim()) { toast.error("Description is required"); return; }
    if (form.amount <= 0) { toast.error("Amount must be greater than 0"); return; }
    const payload = {
      category: form.category,
      description: form.description,
      amount: form.amount,
      paymentMethod: form.paymentMethod,
      vendor: form.vendor || undefined,
      receiptRef: form.receiptRef || undefined,
      expenseDate: form.expenseDate,
      notes: form.notes,
    };
    if (editId !== null) {
      updateMutation.mutate({ id: editId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  function handleExport() {
    const rows = expenses.map(e => ({
      "Expense #": e.expenseNumber,
      Date: new Date(e.expenseDate).toLocaleDateString(),
      Category: e.category,
      Description: e.description,
      Vendor: e.vendor ?? "",
      Amount: parseFloat(String(e.amount)),
      "Payment Method": e.paymentMethod,
      "Receipt Ref": e.receiptRef ?? "",
      Notes: e.notes ?? "",
    }));
    exportCSV(rows, "expenses-export.csv");
    toast.success("Expenses exported to CSV");
  }

  const payIcons: Record<string, React.ReactNode> = {
    Cash: <Banknote className="w-3.5 h-3.5" />,
    Card: <CreditCard className="w-3.5 h-3.5" />,
    Mobile: <Smartphone className="w-3.5 h-3.5" />,
    "Bank Transfer": <Building2 className="w-3.5 h-3.5" />,
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

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
                {CATEGORY_ICONS[stats.topCategory.name as ExpenseCategory] ?? "💼"} {stats.topCategory.name}
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

      {/* Category Breakdown */}
      <div className="bg-card border border-border rounded-lg p-5">
        <h2 className="font-semibold text-foreground mb-4 text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Spending by Category (All Time)</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {EXPENSE_CATEGORIES.filter(c => (stats.byCategory.get(c) ?? 0) > 0).map(c => (
            <div key={c} className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50">
              <span className="text-lg">{CATEGORY_ICONS[c]}</span>
              <div>
                <div className={cn("text-xs font-medium", CATEGORY_COLORS[c])}>{c}</div>
                <div className="data-num text-xs text-foreground">{fmt(stats.byCategory.get(c) ?? 0)}</div>
              </div>
            </div>
          ))}
          {stats.byCategory.size === 0 && <div className="col-span-full text-sm text-muted-foreground">No expenses recorded yet</div>}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search expenses..."
            className="w-full bg-card border border-border rounded-md pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value as any)}
          className="bg-card border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
          <option value="All">All Categories</option>
          {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Table */}
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
                <th className="text-center text-xs text-muted-foreground font-medium px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={8} className="text-center py-12 text-muted-foreground">Loading expenses...</td></tr>
              ) : expenses.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-muted-foreground">
                  <Receipt className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  No expenses found
                </td></tr>
              ) : expenses.map(e => (
                <tr key={e.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3 data-num text-xs font-medium text-primary">{e.expenseNumber}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(e.expenseDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("text-sm font-medium", CATEGORY_COLORS[e.category as ExpenseCategory] ?? "text-muted-foreground")}>
                      {CATEGORY_ICONS[e.category as ExpenseCategory] ?? "💼"} {e.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground">{e.description}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{e.vendor ?? "—"}</td>
                  <td className="px-4 py-3 text-right data-num font-bold text-foreground">{fmt(e.amount)}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {payIcons[e.paymentMethod]}
                      <PayBadge method={e.paymentMethod} />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
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
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-card border border-border rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="font-bold text-lg" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {editId !== null ? "Edit Expense" : "Log Expense"}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded hover:bg-secondary"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Category</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as ExpenseCategory }))}
                  className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                  {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_ICONS[c]} {c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Payment Method</label>
                <select value={form.paymentMethod} onChange={e => setForm(f => ({ ...f, paymentMethod: e.target.value as PaymentMethod }))}
                  className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                  {["Cash", "Card", "Mobile", "Bank Transfer"].map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs text-muted-foreground mb-1 block">Description *</label>
                <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="What was this expense for?"
                  className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Amount (₵) *</label>
                <input type="number" min="0" step="0.01" value={form.amount}
                  onChange={e => setForm(f => ({ ...f, amount: parseFloat(e.target.value) || 0 }))}
                  className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm data-num focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Date</label>
                <input type="date" value={form.expenseDate} onChange={e => setForm(f => ({ ...f, expenseDate: e.target.value }))}
                  className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Vendor</label>
                <input value={form.vendor} onChange={e => setForm(f => ({ ...f, vendor: e.target.value }))}
                  placeholder="Supplier or vendor name"
                  className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Receipt Ref</label>
                <input value={form.receiptRef} onChange={e => setForm(f => ({ ...f, receiptRef: e.target.value }))}
                  placeholder="Receipt or invoice number"
                  className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs text-muted-foreground mb-1 block">Notes</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2}
                  className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none" />
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium disabled:opacity-50">
                {isSaving ? "Saving..." : (editId !== null ? "Save Changes" : "Log Expense")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-sm">
            <h3 className="font-bold text-lg mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Delete Expense?</h3>
            <p className="text-sm text-muted-foreground mb-5">This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-sm hover:bg-secondary rounded-md transition-colors">Cancel</button>
              <button onClick={() => deleteMutation.mutate({ id: deleteConfirm })} disabled={deleteMutation.isPending}
                className="px-4 py-2 text-sm bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-colors font-medium disabled:opacity-50">
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
