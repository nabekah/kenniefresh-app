// =============================================================
// DESIGN SYSTEM: Industrial Ledger
// Products: Full CRUD table with SKU/barcode, category filter,
// search, add/edit modal, status badges
// =============================================================

import { useState, useMemo, useRef } from "react";
import { Plus, Search, Edit2, Trash2, Package, X, Barcode, ImagePlus, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";
import {
  getProducts, addProduct, updateProduct, deleteProduct,
  getSuppliers, type Product, type Category, fmt,
} from "@/lib/store";
import { cn } from "@/lib/utils";

const CATEGORIES: Category[] = ["Food & Beverage", "Beverages", "Snacks", "Dairy", "Bakery", "Frozen", "Household", "Beauty", "Electronics", "Clothing", "Home & Garden", "Sports", "Other"];

function StockBadge({ stock, threshold }: { stock: number; threshold: number }) {
  if (stock === 0) return <span className="badge-out-of-stock text-xs px-2 py-0.5 rounded-full font-medium">Out of Stock</span>;
  if (stock <= threshold) return <span className="badge-low-stock text-xs px-2 py-0.5 rounded-full font-medium">Low Stock</span>;
  return <span className="badge-in-stock text-xs px-2 py-0.5 rounded-full font-medium">In Stock</span>;
}

const emptyForm = {
  sku: "", barcode: "", name: "", category: "Food & Beverage" as Category, description: "",
  costPrice: 0, sellingPrice: 0, stock: 0, lowStockThreshold: 10, supplierId: "", imageUrl: "",
};

export default function Products() {
  const [products, setProducts] = useState(() => getProducts());
  const suppliers = useMemo(() => getSuppliers(), []);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<string>("All");
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [imgUploading, setImgUploading] = useState(false);
  const [imgTab, setImgTab] = useState<"url" | "upload">("url");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    return products.filter(p => {
      const q = search.toLowerCase();
      const matchSearch = !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.barcode.includes(q);
      const matchCat = catFilter === "All" || p.category === catFilter;
      return matchSearch && matchCat;
    });
  }, [products, search, catFilter]);

  function openAdd() {
    setEditId(null);
    setForm({ ...emptyForm });
    setImgTab("url");
    setShowModal(true);
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB"); return; }
    setImgUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload-product-image", { method: "POST", body: fd, credentials: "include" });
      if (!res.ok) throw new Error("Upload failed");
      const { url } = await res.json() as { url: string };
      setForm(f => ({ ...f, imageUrl: url }));
      toast.success("Image uploaded!");
    } catch {
      toast.error("Upload failed. Try pasting an image URL instead.");
    } finally {
      setImgUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function openEdit(p: Product) {
    setEditId(p.id);
    setForm({
      sku: p.sku, barcode: p.barcode, name: p.name, category: p.category,
      description: p.description, costPrice: p.costPrice, sellingPrice: p.sellingPrice,
      stock: p.stock, lowStockThreshold: p.lowStockThreshold, supplierId: p.supplierId,
      imageUrl: p.imageUrl ?? "",
    });
    setImgTab("url");
    setShowModal(true);
  }

  function handleSave() {
    if (!form.name.trim() || !form.sku.trim()) {
      toast.error("Name and SKU are required");
      return;
    }
    if (form.sellingPrice <= 0) {
      toast.error("Selling price must be greater than 0");
      return;
    }
    if (editId) {
      updateProduct(editId, form);
      toast.success("Product updated");
    } else {
      addProduct(form);
      toast.success("Product added");
    }
    setProducts(getProducts());
    setShowModal(false);
  }

  function handleDelete(id: string) {
    deleteProduct(id);
    setProducts(getProducts());
    setDeleteConfirm(null);
    toast.success("Product deleted");
  }

  const margin = (p: Product) => p.sellingPrice > 0 ? ((p.sellingPrice - p.costPrice) / p.sellingPrice * 100).toFixed(1) : "0.0";

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Products</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{products.length} total products</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, SKU, or barcode..."
            className="w-full bg-card border border-border rounded-md pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <select
          value={catFilter} onChange={e => setCatFilter(e.target.value)}
          className="bg-card border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="All">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-secondary/50">
              <tr>
                <th className="text-left text-xs text-muted-foreground font-medium px-4 py-3">Product</th>
                <th className="text-left text-xs text-muted-foreground font-medium px-4 py-3">SKU / Barcode</th>
                <th className="text-left text-xs text-muted-foreground font-medium px-4 py-3">Category</th>
                <th className="text-right text-xs text-muted-foreground font-medium px-4 py-3">Cost</th>
                <th className="text-right text-xs text-muted-foreground font-medium px-4 py-3">Price</th>
                <th className="text-right text-xs text-muted-foreground font-medium px-4 py-3">Margin</th>
                <th className="text-right text-xs text-muted-foreground font-medium px-4 py-3">Stock</th>
                <th className="text-center text-xs text-muted-foreground font-medium px-4 py-3">Status</th>
                <th className="text-center text-xs text-muted-foreground font-medium px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-12 text-muted-foreground">
                  <Package className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  No products found
                </td></tr>
              ) : filtered.map(p => (
                <tr key={p.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt={p.name} className="w-10 h-10 rounded-lg object-contain bg-white border border-border flex-shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                          <Package className="w-5 h-5 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-foreground">{p.name}</div>
                        <div className="text-xs text-muted-foreground truncate max-w-[160px]">{p.description}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="data-num text-xs text-foreground font-medium">{p.sku}</div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                      <Barcode className="w-3 h-3" />{p.barcode}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{p.category}</td>
                  <td className="px-4 py-3 text-right data-num text-muted-foreground">{fmt(p.costPrice)}</td>
                  <td className="px-4 py-3 text-right data-num text-foreground font-medium">{fmt(p.sellingPrice)}</td>
                  <td className="px-4 py-3 text-right data-num text-emerald-400">{margin(p)}%</td>
                  <td className="px-4 py-3 text-right data-num text-foreground">{p.stock}</td>
                  <td className="px-4 py-3 text-center"><StockBadge stock={p.stock} threshold={p.lowStockThreshold} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => openEdit(p)} className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setDeleteConfirm(p.id)} className="p-1.5 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors">
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
          <div className="bg-card border border-border rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="font-bold text-lg" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {editId ? "Edit Product" : "Add New Product"}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded hover:bg-secondary"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="text-xs text-muted-foreground mb-1 block">Product Name *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">SKU *</label>
                <input value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))}
                  className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm data-num focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Barcode</label>
                <input value={form.barcode} onChange={e => setForm(f => ({ ...f, barcode: e.target.value }))}
                  className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm data-num focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Category</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as Category }))}
                  className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Supplier</label>
                <select value={form.supplierId} onChange={e => setForm(f => ({ ...f, supplierId: e.target.value }))}
                  className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                  <option value="">Select supplier</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Cost Price (₵)</label>
                <input type="number" min="0" step="0.01" value={form.costPrice} onChange={e => setForm(f => ({ ...f, costPrice: parseFloat(e.target.value) || 0 }))}
                  className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm data-num focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Selling Price (₵) *</label>
                <input type="number" min="0" step="0.01" value={form.sellingPrice} onChange={e => setForm(f => ({ ...f, sellingPrice: parseFloat(e.target.value) || 0 }))}
                  className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm data-num focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Current Stock</label>
                <input type="number" min="0" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: parseInt(e.target.value) || 0 }))}
                  className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm data-num focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Low Stock Threshold</label>
                <input type="number" min="1" value={form.lowStockThreshold} onChange={e => setForm(f => ({ ...f, lowStockThreshold: parseInt(e.target.value) || 1 }))}
                  className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm data-num focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs text-muted-foreground mb-1 block">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2}
                  className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none" />
              </div>
              {/* Product Image */}
              <div className="sm:col-span-2">
                <label className="text-xs text-muted-foreground mb-1 block">Product Image</label>
                <div className="flex gap-2 mb-2">
                  <button type="button" onClick={() => setImgTab("url")}
                    className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors",
                      imgTab === "url" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground")}>
                    <LinkIcon className="w-3 h-3" /> Paste URL
                  </button>
                  <button type="button" onClick={() => setImgTab("upload")}
                    className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors",
                      imgTab === "upload" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground")}>
                    <ImagePlus className="w-3 h-3" /> Upload File
                  </button>
                </div>
                {imgTab === "url" ? (
                  <input
                    value={form.imageUrl}
                    onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
                    placeholder="https://example.com/product.jpg"
                    className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                ) : (
                  <div className="flex items-center gap-3">
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                    <button type="button" onClick={() => fileInputRef.current?.click()}
                      disabled={imgUploading}
                      className="flex items-center gap-2 px-4 py-2 bg-secondary border border-dashed border-border rounded-md text-sm text-muted-foreground hover:text-foreground hover:border-primary transition-colors disabled:opacity-50">
                      <ImagePlus className="w-4 h-4" />
                      {imgUploading ? "Uploading..." : "Choose image file (max 5MB)"}
                    </button>
                    {form.imageUrl && <span className="text-xs text-green-500">✓ Image set</span>}
                  </div>
                )}
                {form.imageUrl && (
                  <div className="mt-2 flex items-center gap-3">
                    <img src={form.imageUrl} alt="Preview" className="w-16 h-16 rounded-lg object-contain bg-white border border-border" />
                    <button type="button" onClick={() => setForm(f => ({ ...f, imageUrl: "" }))}
                      className="text-xs text-destructive hover:underline">Remove image</button>
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-colors">Cancel</button>
              <button onClick={handleSave} className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium">
                {editId ? "Save Changes" : "Add Product"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-sm">
            <h3 className="font-bold text-lg mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Delete Product?</h3>
            <p className="text-sm text-muted-foreground mb-5">This action cannot be undone. The product and its data will be permanently removed.</p>
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
