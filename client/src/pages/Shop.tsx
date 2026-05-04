// =============================================================
// Kenniefresh.biz — Public Online Shop
// Customer-facing storefront: hero, categories, product grid,
// product detail modal, add-to-cart
// =============================================================

import { useState, useMemo } from "react";
import { ShoppingCart, Search, Star, ChevronRight, Package, X, Plus, Minus, Check, Truck, Shield, RefreshCw } from "lucide-react";
import { getProducts, type Product, type Category, fmt } from "@/lib/store";
import { useCart } from "@/contexts/CartContext";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

const HERO_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663487009313/3xoUtJNXeqJqC5zVHr4FYi/shop-hero-6zpCYwTfxygNe7mdYwA8gc.webp";
const PROMO_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663487009313/3xoUtJNXeqJqC5zVHr4FYi/shop-promo-nX3r376RkWrbLeDhJwXR2q.webp";

const CATEGORY_EMOJI: Record<string, string> = {
  "Electronics": "💻", "Clothing": "👕", "Food & Beverage": "🍎",
  "Home & Garden": "🏡", "Sports": "⚽", "Beauty": "✨", "Toys": "🧸", "Other": "📦",
};

function StarRating({ rating = 4.5 }: { rating?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Star key={s} className={cn("w-3 h-3", s <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-gray-600")} />
      ))}
      <span className="text-xs text-gray-400 ml-1">({Math.floor(Math.random() * 80 + 20)})</span>
    </div>
  );
}

function ProductCard({ product, onView }: { product: Product; onView: (p: Product) => void }) {
  const { addToCart, items } = useCart();
  const inCart = items.some(i => i.product.id === product.id);
  const outOfStock = product.stock === 0;

  return (
    <div className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col">
      <div className="relative overflow-hidden bg-gray-50 aspect-square cursor-pointer" onClick={() => onView(product)}>
        <div className="w-full h-full flex items-center justify-center text-6xl bg-gradient-to-br from-amber-50 to-orange-50">
          {CATEGORY_EMOJI[product.category] ?? "📦"}
        </div>
        {outOfStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">Out of Stock</span>
          </div>
        )}
        {!outOfStock && product.stock <= product.lowStockThreshold && (
          <div className="absolute top-2 left-2">
            <span className="bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">Low Stock</span>
          </div>
        )}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={e => { e.stopPropagation(); onView(product); }}
            className="bg-white rounded-full p-1.5 shadow-md hover:bg-amber-50 transition-colors">
            <ChevronRight className="w-4 h-4 text-gray-700" />
          </button>
        </div>
      </div>
      <div className="p-4 flex flex-col flex-1">
        <div className="text-xs text-amber-600 font-medium mb-1">{product.category}</div>
        <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-1 line-clamp-2 cursor-pointer hover:text-amber-700 transition-colors"
          onClick={() => onView(product)}>{product.name}</h3>
        <div className="mb-2"><StarRating /></div>
        <p className="text-xs text-gray-500 line-clamp-2 mb-3 flex-1">{product.description || "Quality product from Kenniefresh.biz"}</p>
        <div className="flex items-center justify-between mt-auto">
          <div>
            <span className="text-lg font-bold text-gray-900">{fmt(product.sellingPrice)}</span>
            <div className="text-xs text-gray-400">SKU: {product.sku}</div>
          </div>
          <button
            disabled={outOfStock}
            onClick={() => addToCart(product)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all",
              outOfStock ? "bg-gray-100 text-gray-400 cursor-not-allowed" :
                inCart ? "bg-emerald-500 text-white hover:bg-emerald-600" :
                  "bg-amber-500 text-white hover:bg-amber-600 active:scale-95"
            )}>
            {inCart ? <><Check className="w-3.5 h-3.5" /> Added</> : <><ShoppingCart className="w-3.5 h-3.5" /> Add</>}
          </button>
        </div>
      </div>
    </div>
  );
}

function ProductModal({ product, onClose }: { product: Product; onClose: () => void }) {
  const { addToCart, items, updateQty } = useCart();
  const [qty, setQty] = useState(1);
  const cartItem = items.find(i => i.product.id === product.id);
  const outOfStock = product.stock === 0;

  function handleAdd() {
    addToCart(product, qty);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <span className="text-xs font-medium text-amber-600 bg-amber-50 px-3 py-1 rounded-full">{product.category}</span>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors"><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        <div className="p-6">
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="sm:w-48 h-48 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl flex items-center justify-center text-7xl flex-shrink-0">
              {CATEGORY_EMOJI[product.category] ?? "📦"}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900 mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{product.name}</h2>
              <StarRating rating={4.5} />
              <div className="mt-3 mb-4">
                <span className="text-3xl font-bold text-gray-900">{fmt(product.sellingPrice)}</span>
              </div>
              <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                {product.description || `Premium quality ${product.name} available at Kenniefresh.biz. Sourced from trusted suppliers and delivered fresh to your door.`}
              </p>
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                <span className="font-medium text-gray-700">SKU:</span> {product.sku}
              </div>
              <div className="flex items-center gap-2 text-sm mb-4">
                <span className="font-medium text-gray-700">Availability:</span>
                {outOfStock ? (
                  <span className="text-red-500 font-medium">Out of Stock</span>
                ) : product.stock <= product.lowStockThreshold ? (
                  <span className="text-amber-500 font-medium">Low Stock — {product.stock} left</span>
                ) : (
                  <span className="text-emerald-500 font-medium">In Stock ({product.stock} available)</span>
                )}
              </div>
              {!outOfStock && (
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                    <button onClick={() => setQty(q => Math.max(1, q - 1))} className="px-3 py-2 hover:bg-gray-50 transition-colors">
                      <Minus className="w-4 h-4 text-gray-600" />
                    </button>
                    <span className="px-4 py-2 font-semibold text-gray-900 min-w-[3rem] text-center">{qty}</span>
                    <button onClick={() => setQty(q => Math.min(product.stock, q + 1))} className="px-3 py-2 hover:bg-gray-50 transition-colors">
                      <Plus className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                  <button onClick={handleAdd}
                    className="flex-1 flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2.5 px-5 rounded-xl transition-all active:scale-95">
                    <ShoppingCart className="w-4 h-4" />
                    {cartItem ? "Update Cart" : "Add to Cart"} — {fmt(product.sellingPrice * qty)}
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="mt-6 grid grid-cols-3 gap-3 border-t border-gray-100 pt-5">
            {[
              { icon: Truck, label: "Free Delivery", sub: "Orders over $50" },
              { icon: Shield, label: "Secure Payment", sub: "100% protected" },
              { icon: RefreshCw, label: "Easy Returns", sub: "30-day policy" },
            ].map(({ icon: Icon, label, sub }) => (
              <div key={label} className="flex flex-col items-center text-center p-3 bg-gray-50 rounded-xl">
                <Icon className="w-5 h-5 text-amber-500 mb-1" />
                <span className="text-xs font-semibold text-gray-700">{label}</span>
                <span className="text-xs text-gray-400">{sub}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Shop() {
  const products = useMemo(() => getProducts().filter(p => p.stock > 0), []);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"All" | Category>("All");
  const [viewProduct, setViewProduct] = useState<Product | null>(null);
  const { itemCount } = useCart();

  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category));
    return ["All", ...Array.from(cats)] as ("All" | Category)[];
  }, [products]);

  const filtered = useMemo(() => {
    return products.filter(p => {
      const q = search.toLowerCase();
      const matchSearch = !q || p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
      const matchCat = selectedCategory === "All" || p.category === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [products, search, selectedCategory]);

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      {/* Shop Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-amber-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-sm">K</span>
            </div>
            <div>
              <div className="font-bold text-gray-900 text-sm leading-none">Kenniefresh.biz</div>
              <div className="text-xs text-gray-400">Online Shop</div>
            </div>
          </div>
          <div className="flex-1 max-w-md hidden sm:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search products..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/shop/cart">
              <button className="relative flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all">
                <ShoppingCart className="w-4 h-4" />
                <span className="hidden sm:inline">Cart</span>
                {itemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                    {itemCount}
                  </span>
                )}
              </button>
            </Link>
            <Link href="/">
              <button className="text-xs text-gray-500 hover:text-gray-700 border border-gray-200 px-3 py-2 rounded-xl transition-colors">
                Admin
              </button>
            </Link>
          </div>
        </div>
        {/* Mobile search */}
        <div className="sm:hidden px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search products..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="relative overflow-hidden">
        <div className="relative h-64 sm:h-80 lg:h-96">
          <img src={HERO_IMG} alt="Kenniefresh.biz" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
          <div className="absolute inset-0 flex items-center">
            <div className="max-w-7xl mx-auto px-6 sm:px-8">
              <div className="max-w-lg">
                <div className="inline-block bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full mb-3">
                  🎉 Free delivery on orders over $50
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3 leading-tight">
                  Shop Fresh,<br />Shop Smart
                </h1>
                <p className="text-gray-200 text-sm sm:text-base mb-5">
                  Discover quality products at great prices. Delivered right to your door.
                </p>
                <button onClick={() => document.getElementById("products-section")?.scrollIntoView({ behavior: "smooth" })}
                  className="bg-amber-500 hover:bg-amber-600 text-white font-semibold px-6 py-3 rounded-xl transition-all flex items-center gap-2 text-sm">
                  Shop Now <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="bg-amber-500 py-3">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-6 text-white text-xs font-medium">
            {[
              { icon: "🚚", text: "Free Delivery Over $50" },
              { icon: "🔒", text: "Secure Checkout" },
              { icon: "⭐", text: "Quality Guaranteed" },
              { icon: "↩️", text: "Easy Returns" },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-1.5">{icon} {text}</div>
            ))}
          </div>
        </div>
      </section>

      {/* Category Filters */}
      <section className="bg-white border-b border-gray-100 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {categories.map(cat => (
              <button key={cat} onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                  selectedCategory === cat
                    ? "bg-amber-500 text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}>
                {cat !== "All" && <span>{CATEGORY_EMOJI[cat]}</span>}
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section id="products-section" className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {selectedCategory === "All" ? "All Products" : selectedCategory}
            </h2>
            <p className="text-sm text-gray-500">{filtered.length} product{filtered.length !== 1 ? "s" : ""} available</p>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <h3 className="text-lg font-semibold text-gray-700 mb-1">No products found</h3>
            <p className="text-sm text-gray-400">Try adjusting your search or category filter</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filtered.map(product => (
              <ProductCard key={product.id} product={product} onView={setViewProduct} />
            ))}
          </div>
        )}
      </section>

      {/* Promo Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-10">
        <div className="relative rounded-2xl overflow-hidden h-40 sm:h-52">
          <img src={PROMO_IMG} alt="Special offers" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent flex items-center">
            <div className="px-8">
              <div className="text-amber-400 text-xs font-bold mb-1 uppercase tracking-wider">Special Offer</div>
              <h3 className="text-white text-xl sm:text-2xl font-bold mb-2">New Arrivals Every Week</h3>
              <p className="text-gray-300 text-xs sm:text-sm">Check back often for fresh deals and new products</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 text-center text-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="font-bold text-white text-base mb-1">Kenniefresh.biz</div>
          <p className="text-xs mb-3">Your trusted online retail store</p>
          <p className="text-xs">© {new Date().getFullYear()} Kenniefresh.biz. All rights reserved.</p>
        </div>
      </footer>

      {/* Product Detail Modal */}
      {viewProduct && <ProductModal product={viewProduct} onClose={() => setViewProduct(null)} />}
    </div>
  );
}
