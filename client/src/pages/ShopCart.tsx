// =============================================================
// Kenniefresh.biz — Shopping Cart Page
// =============================================================

import { Link } from "wouter";
import { ShoppingCart, Trash2, Plus, Minus, ArrowLeft, ChevronRight, Package } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { fmt } from "@/lib/store";

export default function ShopCart() {
  const { items, removeFromCart, updateQty, subtotal, itemCount } = useCart();
  const shippingFee = subtotal > 50 ? 0 : 5.99;
  const tax = subtotal * 0.08;
  const total = subtotal + shippingFee + tax;

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link href="/shop">
            <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium">
              <ArrowLeft className="w-4 h-4" /> Continue Shopping
            </button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-amber-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xs">K</span>
            </div>
            <span className="font-bold text-gray-900 text-sm">Kenniefresh.biz</span>
          </div>
          <div className="w-24" />
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Your Cart {itemCount > 0 && <span className="text-lg text-gray-400 font-normal">({itemCount} item{itemCount !== 1 ? "s" : ""})</span>}
        </h1>

        {items.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingCart className="w-16 h-16 mx-auto text-gray-200 mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Your cart is empty</h2>
            <p className="text-gray-400 mb-6">Add some products to get started</p>
            <Link href="/shop">
              <button className="bg-amber-500 hover:bg-amber-600 text-white font-semibold px-6 py-3 rounded-xl transition-all">
                Browse Products
              </button>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Cart Items */}
            <div className="flex-1 space-y-3">
              {items.map(({ product, quantity }) => (
                <div key={product.id} className="bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm border border-gray-100">
                  <div className="w-16 h-16 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl flex items-center justify-center text-3xl flex-shrink-0">
                    {({ "Food & Beverage": "🍱", "Beverages": "🥤", "Water": "💧", "Dairy": "🥛", "Household": "🧹", "Cleaning": "🧴", "Baby Care": "👶", "Rice & Staples": "🍚", "Snacks": "🍪", "Cooking Oil": "🫙", "Bath & Body": "🧼", "Other": "📦" } as Record<string, string>)[product.category] ?? "📦"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm truncate">{product.name}</h3>
                    <p className="text-xs text-gray-400">{product.category} · SKU: {product.sku}</p>
                    <p className="text-sm font-bold text-amber-600 mt-0.5">{fmt(product.sellingPrice)}</p>
                  </div>
                  <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                    <button onClick={() => updateQty(product.id, quantity - 1)} className="px-2.5 py-1.5 hover:bg-gray-50 transition-colors">
                      <Minus className="w-3.5 h-3.5 text-gray-600" />
                    </button>
                    <span className="px-3 py-1.5 font-semibold text-gray-900 text-sm min-w-[2rem] text-center">{quantity}</span>
                    <button onClick={() => updateQty(product.id, Math.min(product.stock, quantity + 1))} className="px-2.5 py-1.5 hover:bg-gray-50 transition-colors">
                      <Plus className="w-3.5 h-3.5 text-gray-600" />
                    </button>
                  </div>
                  <div className="text-right min-w-[4rem]">
                    <div className="font-bold text-gray-900 text-sm">{fmt(product.sellingPrice * quantity)}</div>
                  </div>
                  <button onClick={() => removeFromCart(product.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:w-80">
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 sticky top-20">
                <h2 className="font-bold text-gray-900 text-base mb-4">Order Summary</h2>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal ({itemCount} items)</span>
                    <span className="font-medium text-gray-900">{fmt(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    <span className={shippingFee === 0 ? "text-emerald-500 font-medium" : "font-medium text-gray-900"}>
                      {shippingFee === 0 ? "FREE" : fmt(shippingFee)}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Tax (8%)</span>
                    <span className="font-medium text-gray-900">{fmt(tax)}</span>
                  </div>
                  {shippingFee > 0 && (
                    <div className="bg-amber-50 rounded-xl p-3 text-xs text-amber-700">
                      Add {fmt(50 - subtotal)} more for free shipping!
                    </div>
                  )}
                  <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-gray-900 text-base">
                    <span>Total</span>
                    <span>{fmt(total)}</span>
                  </div>
                </div>
                <Link href="/shop/checkout">
                  <button className="w-full mt-5 bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2">
                    Proceed to Checkout <ChevronRight className="w-4 h-4" />
                  </button>
                </Link>
                <Link href="/shop">
                  <button className="w-full mt-2 text-gray-500 hover:text-gray-700 text-sm py-2 transition-colors">
                    ← Continue Shopping
                  </button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
