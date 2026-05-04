// =============================================================
// Kenniefresh.biz — Checkout & Order Confirmation
// =============================================================

import { useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, CheckCircle, ShoppingBag, CreditCard, Smartphone, Truck, Package } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { addOnlineOrder, fmt, type OnlineOrder } from "@/lib/store";
import { cn } from "@/lib/utils";

const CATEGORY_EMOJI: Record<string, string> = {
  "Electronics": "💻", "Clothing": "👕", "Food & Beverage": "🍎",
  "Home & Garden": "🏡", "Sports": "⚽", "Beauty": "✨", "Toys": "🧸", "Other": "📦",
};

const emptyForm = {
  name: "", email: "", phone: "", address: "", city: "", zip: "", notes: "",
};

export default function ShopCheckout() {
  const { items, subtotal, clearCart } = useCart();
  const [, navigate] = useLocation();
  const [form, setForm] = useState({ ...emptyForm });
  const [paymentMethod, setPaymentMethod] = useState<OnlineOrder["paymentMethod"]>("Card");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmedOrder, setConfirmedOrder] = useState<OnlineOrder | null>(null);
  const [loading, setLoading] = useState(false);

  const shippingFee = subtotal > 50 ? 0 : 5.99;
  const tax = subtotal * 0.08;
  const total = subtotal + shippingFee + tax;

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Full name is required";
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = "Valid email is required";
    if (!form.phone.trim()) e.phone = "Phone number is required";
    if (!form.address.trim()) e.address = "Street address is required";
    if (!form.city.trim()) e.city = "City is required";
    if (!form.zip.trim()) e.zip = "ZIP / Postal code is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handlePlaceOrder() {
    if (items.length === 0) { navigate("/shop"); return; }
    if (!validate()) return;
    setLoading(true);
    setTimeout(() => {
      const order = addOnlineOrder({
        customerName: form.name,
        customerEmail: form.email,
        customerPhone: form.phone,
        shippingAddress: `${form.address}, ${form.city} ${form.zip}`,
        items: items.map(i => ({
          productId: i.product.id,
          productName: i.product.name,
          sku: i.product.sku,
          quantity: i.quantity,
          unitPrice: i.product.sellingPrice,
          unitCost: i.product.costPrice,
        })),
        subtotal: Math.round(subtotal * 100) / 100,
        shippingFee: Math.round(shippingFee * 100) / 100,
        tax: Math.round(tax * 100) / 100,
        total: Math.round(total * 100) / 100,
        profit: Math.round(items.reduce((s, i) => s + (i.product.sellingPrice - i.product.costPrice) * i.quantity, 0) * 100) / 100,
        paymentMethod,
        status: "Pending",
        notes: form.notes,
      });
      clearCart();
      setConfirmedOrder(order);
      setLoading(false);
    }, 1200);
  }

  // Order Confirmation Screen
  if (confirmedOrder) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-9 h-9 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
          <p className="text-gray-500 text-sm mb-1">Thank you for shopping with us, <strong>{confirmedOrder.customerName}</strong>!</p>
          <p className="text-gray-400 text-xs mb-5">A confirmation will be sent to <strong>{confirmedOrder.customerEmail}</strong></p>

          <div className="bg-amber-50 rounded-xl p-4 mb-5 text-left">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-gray-500">Order Number</span>
              <span className="font-bold text-amber-700 text-sm">{confirmedOrder.orderNumber}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-gray-500">Total Paid</span>
              <span className="font-bold text-gray-900">{fmt(confirmedOrder.total)}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-gray-500">Payment</span>
              <span className="text-sm font-medium text-gray-700">{confirmedOrder.paymentMethod}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">Status</span>
              <span className="bg-amber-200 text-amber-800 text-xs font-bold px-2 py-0.5 rounded-full">Pending</span>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 mb-5 text-left">
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
              <Truck className="w-3.5 h-3.5" /> Delivering to:
            </div>
            <p className="text-sm font-medium text-gray-700">{confirmedOrder.shippingAddress}</p>
          </div>

          <div className="space-y-2">
            <Link href="/shop">
              <button className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 rounded-xl transition-all">
                Continue Shopping
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
        <div className="text-center">
          <ShoppingBag className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 mb-4">Your cart is empty</p>
          <Link href="/shop"><button className="bg-amber-500 text-white px-5 py-2.5 rounded-xl font-semibold">Go Shopping</button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link href="/shop/cart">
            <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm font-medium">
              <ArrowLeft className="w-4 h-4" /> Back to Cart
            </button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-amber-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xs">K</span>
            </div>
            <span className="font-bold text-gray-900 text-sm">Checkout</span>
          </div>
          <div className="w-24" />
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8 text-xs">
          <span className="text-gray-400">Cart</span>
          <span className="text-gray-300">›</span>
          <span className="font-semibold text-amber-600">Checkout</span>
          <span className="text-gray-300">›</span>
          <span className="text-gray-400">Confirmation</span>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left: Form */}
          <div className="flex-1 space-y-5">
            {/* Contact Info */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h2 className="font-bold text-gray-900 mb-4">Contact Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { key: "name", label: "Full Name", placeholder: "John Doe", type: "text" },
                  { key: "email", label: "Email Address", placeholder: "john@example.com", type: "email" },
                  { key: "phone", label: "Phone Number", placeholder: "+1 (555) 000-0000", type: "tel" },
                ].map(({ key, label, placeholder, type }) => (
                  <div key={key} className={key === "email" ? "sm:col-span-2" : ""}>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">{label} *</label>
                    <input type={type} value={(form as any)[key]} placeholder={placeholder}
                      onChange={e => { setForm(f => ({ ...f, [key]: e.target.value })); setErrors(er => ({ ...er, [key]: "" })); }}
                      className={cn("w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent",
                        errors[key] ? "border-red-300 bg-red-50" : "border-gray-200 bg-gray-50")} />
                    {errors[key] && <p className="text-xs text-red-500 mt-1">{errors[key]}</p>}
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h2 className="font-bold text-gray-900 mb-4">Shipping Address</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Street Address *</label>
                  <input type="text" value={form.address} placeholder="123 Main Street, Apt 4B"
                    onChange={e => { setForm(f => ({ ...f, address: e.target.value })); setErrors(er => ({ ...er, address: "" })); }}
                    className={cn("w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400",
                      errors.address ? "border-red-300 bg-red-50" : "border-gray-200 bg-gray-50")} />
                  {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">City *</label>
                    <input type="text" value={form.city} placeholder="New York"
                      onChange={e => { setForm(f => ({ ...f, city: e.target.value })); setErrors(er => ({ ...er, city: "" })); }}
                      className={cn("w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400",
                        errors.city ? "border-red-300 bg-red-50" : "border-gray-200 bg-gray-50")} />
                    {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">ZIP / Postal Code *</label>
                    <input type="text" value={form.zip} placeholder="10001"
                      onChange={e => { setForm(f => ({ ...f, zip: e.target.value })); setErrors(er => ({ ...er, zip: "" })); }}
                      className={cn("w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400",
                        errors.zip ? "border-red-300 bg-red-50" : "border-gray-200 bg-gray-50")} />
                    {errors.zip && <p className="text-xs text-red-500 mt-1">{errors.zip}</p>}
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h2 className="font-bold text-gray-900 mb-4">Payment Method</h2>
              <div className="grid grid-cols-3 gap-3">
                {([
                  { value: "Card", icon: CreditCard, label: "Credit / Debit Card" },
                  { value: "Mobile", icon: Smartphone, label: "Mobile Money" },
                  { value: "Cash on Delivery", icon: Truck, label: "Cash on Delivery" },
                ] as const).map(({ value, icon: Icon, label }) => (
                  <button key={value} onClick={() => setPaymentMethod(value)}
                    className={cn("flex flex-col items-center gap-2 p-3 rounded-xl border-2 text-xs font-medium transition-all",
                      paymentMethod === value
                        ? "border-amber-500 bg-amber-50 text-amber-700"
                        : "border-gray-200 text-gray-500 hover:border-gray-300")}>
                    <Icon className="w-5 h-5" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h2 className="font-bold text-gray-900 mb-3">Order Notes <span className="text-gray-400 font-normal text-sm">(optional)</span></h2>
              <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2}
                placeholder="Any special instructions for your order..."
                className="w-full border border-gray-200 bg-gray-50 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none" />
            </div>
          </div>

          {/* Right: Order Summary */}
          <div className="lg:w-80">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 sticky top-20">
              <h2 className="font-bold text-gray-900 mb-4">Order Summary</h2>
              <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                {items.map(({ product, quantity }) => (
                  <div key={product.id} className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center text-xl flex-shrink-0">
                      {CATEGORY_EMOJI[product.category] ?? "📦"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-800 truncate">{product.name}</p>
                      <p className="text-xs text-gray-400">Qty: {quantity}</p>
                    </div>
                    <span className="text-xs font-bold text-gray-900">{fmt(product.sellingPrice * quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-100 pt-4 space-y-2 text-sm">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal</span><span className="font-medium text-gray-900">{fmt(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Shipping</span>
                  <span className={shippingFee === 0 ? "text-emerald-500 font-medium" : "font-medium text-gray-900"}>
                    {shippingFee === 0 ? "FREE" : fmt(shippingFee)}
                  </span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Tax (8%)</span><span className="font-medium text-gray-900">{fmt(tax)}</span>
                </div>
                <div className="border-t border-gray-100 pt-2 flex justify-between font-bold text-gray-900 text-base">
                  <span>Total</span><span>{fmt(total)}</span>
                </div>
              </div>
              <button onClick={handlePlaceOrder} disabled={loading}
                className={cn("w-full mt-5 font-semibold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 text-sm",
                  loading ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-amber-500 hover:bg-amber-600 text-white active:scale-95")}>
                {loading ? (
                  <><span className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" /> Processing...</>
                ) : (
                  <><Package className="w-4 h-4" /> Place Order — {fmt(total)}</>
                )}
              </button>
              <p className="text-xs text-gray-400 text-center mt-3">🔒 Secure & encrypted checkout</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
