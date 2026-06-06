// =============================================================
// DESIGN SYSTEM: Industrial Ledger
// Suppliers: CRUD table with contact info, linked products count
// DB-backed via tRPC
// =============================================================

import { useState, useMemo } from "react";
import { Plus, Search, Edit2, Trash2, Truck, Mail, Phone, MapPin, X } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

const emptyForm = { name: "", contactName: "", email: "", phone: "", address: "" };

export default function Suppliers() {
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const utils = trpc.useUtils();

  const { data: suppliers = [], isLoading } = trpc.suppliers.list.useQuery(undefined, { refetchOnWindowFocus: false });
  const { data: products = [] } = trpc.products.list.useQuery(undefined, { refetchOnWindowFocus: false });

  const createMutation = trpc.suppliers.create.useMutation({
    onSuccess: () => { utils.suppliers.list.invalidate(); toast.success("Supplier added"); setShowModal(false); },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.suppliers.update.useMutation({
    onSuccess: () => { utils.suppliers.list.invalidate(); toast.success("Supplier updated"); setShowModal(false); },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.suppliers.delete.useMutation({
    onSuccess: () => { utils.suppliers.list.invalidate(); setDeleteConfirm(null); toast.success("Supplier deleted"); },
    onError: (e) => toast.error(e.message),
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return suppliers;
    return suppliers.filter(s =>
      s.name.toLowerCase().includes(q) ||
      (s.contactName ?? "").toLowerCase().includes(q) ||
      (s.email ?? "").toLowerCase().includes(q)
    );
  }, [suppliers, search]);

  function productCount(supplierId: number) {
    return products.filter(p => p.supplierId === supplierId).length;
  }

  function openAdd() {
    setEditId(null);
    setForm({ ...emptyForm });
    setShowModal(true);
  }

  function openEdit(s: typeof suppliers[0]) {
    setEditId(s.id);
    setForm({ name: s.name, contactName: s.contactName ?? "", email: s.email ?? "", phone: s.phone ?? "", address: s.address ?? "" });
    setShowModal(true);
  }

  function handleSave() {
    if (!form.name.trim()) { toast.error("Supplier name is required"); return; }
    if (editId !== null) {
      updateMutation.mutate({ id: editId, data: form });
    } else {
      createMutation.mutate(form);
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Suppliers</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{suppliers.length} registered suppliers</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" /> Add Supplier
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search suppliers..."
          className="w-full bg-card border border-border rounded-md pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">Loading suppliers...</div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            <Truck className="w-8 h-8 mx-auto mb-2 opacity-40" />
            No suppliers found
          </div>
        ) : filtered.map(s => (
          <div key={s.id} className="bg-card border border-border rounded-lg p-5 hover:border-primary/40 transition-colors group">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Truck className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="font-semibold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{s.name}</div>
                  <div className="text-xs text-muted-foreground">{s.contactName}</div>
                </div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEdit(s)} className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setDeleteConfirm(s.id)} className="p-1.5 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="space-y-1.5 text-xs text-muted-foreground">
              {s.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{s.email}</span>
                </div>
              )}
              {s.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{s.phone}</span>
                </div>
              )}
              {s.address && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{s.address}</span>
                </div>
              )}
            </div>
            <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Products supplied</span>
              <span className="data-num text-sm font-bold text-foreground">{productCount(s.id)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-card border border-border rounded-lg w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="font-bold text-lg" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {editId !== null ? "Edit Supplier" : "Add Supplier"}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded hover:bg-secondary"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-4">
              {[
                { label: "Company Name *", key: "name", placeholder: "e.g. TechSource Ltd" },
                { label: "Contact Person", key: "contactName", placeholder: "e.g. Alice Chen" },
                { label: "Email", key: "email", placeholder: "contact@supplier.com" },
                { label: "Phone", key: "phone", placeholder: "+1-555-0000" },
                { label: "Address", key: "address", placeholder: "123 Street, City, State" },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
                  <input value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium disabled:opacity-50">
                {isSaving ? "Saving..." : (editId !== null ? "Save Changes" : "Add Supplier")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-sm">
            <h3 className="font-bold text-lg mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Delete Supplier?</h3>
            <p className="text-sm text-muted-foreground mb-5">This will remove the supplier record. Products linked to this supplier will remain.</p>
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
