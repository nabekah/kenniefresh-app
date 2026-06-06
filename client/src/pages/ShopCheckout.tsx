// =============================================================
// Kenniefresh.biz — Checkout & Order Confirmation
// Supports: Card, MTN MoMo, Telecel Cash, Cash on Delivery
// =============================================================

import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  ArrowLeft, CheckCircle, ShoppingBag, CreditCard, Truck,
  Package, Smartphone, ChevronRight, Loader2, AlertCircle,
} from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { addOnlineOrder, fmt, type OnlineOrder } from "@/lib/store";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────

type PaymentMethod = OnlineOrder["paymentMethod"];
type MoMoProvider = "MTN MoMo" | "Telecel Cash";
type CheckoutStep = "form" | "momo-verify" | "momo-processing" | "confirmed";

const CATEGORY_EMOJI: Record<string, string> = {
  "Food & Beverage": "🍱", "Beverages": "🥤", "Water": "💧", "Dairy": "🥛",
  "Household": "🧹", "Cleaning": "🧴", "Baby Care": "👶", "Rice & Staples": "🍚",
  "Snacks": "🍪", "Cooking Oil": "🫙", "Bath & Body": "🧼", "Other": "📦",
};

const MOMO_PROVIDERS: { id: MoMoProvider; color: string; bg: string; border: string; logo: string; prefix: string }[] = [
  {
    id: "MTN MoMo",
    color: "text-yellow-800",
    bg: "bg-yellow-400",
    border: "border-yellow-400",
    logo: "MTN",
    prefix: "024 / 054 / 055 / 059",
  },
  {
    id: "Telecel Cash",
    color: "text-red-100",
    bg: "bg-red-600",
    border: "border-red-500",
    logo: "Telecel",
    prefix: "020 / 050",
  },
];

const emptyForm = {
  name: "", email: "", phone: "", address: "", city: "", zip: "", notes: "",
};

// ─── MoMo Processing Screen ───────────────────────────────────

function MoMoProcessing({
  provider, momoPhone, total, onSuccess, onFail,
}: {
  provider: MoMoProvider;
  momoPhone: string;
  total: number;
  onSuccess: () => void;
  onFail: () => void;
}) {
  const [stage, setStage] = useState<"prompt" | "waiting" | "success" | "failed">("prompt");
  const isMTN = provider === "MTN MoMo";

  function simulatePayment(approve: boolean) {
    setStage("waiting");
    setTimeout(() => {
      if (approve) { setStage("success"); setTimeout(onSuccess, 1500); }
      else { setStage("failed"); }
    }, 3000);
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full overflow-hidden">
        {/* Provider Header */}
        <div className={cn("px-6 py-5 text-center", isMTN ? "bg-yellow-400" : "bg-red-600")}>
          <div className={cn("text-2xl font-black tracking-tight", isMTN ? "text-yellow-900" : "text-white")}>
            {isMTN ? "MTN MoMo" : "Telecel Cash"}
          </div>
          <div className={cn("text-sm mt-0.5 font-medium", isMTN ? "text-yellow-800" : "text-red-100")}>
            Mobile Money Payment
          </div>
        </div>

        <div className="p-6">
          {stage === "prompt" && (
            <>
              <div className="text-center mb-5">
                <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                  <Smartphone className="w-7 h-7 text-gray-500" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">Approve Payment</h2>
                <p className="text-sm text-gray-500 mt-1">
                  A payment prompt has been sent to
                </p>
                <p className="text-base font-bold text-gray-900 mt-0.5">{momoPhone}</p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 mb-5 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Merchant</span>
                  <span className="font-semibold text-gray-900">Kenniefresh.biz</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Amount</span>
                  <span className="font-bold text-gray-900 text-base">{fmt(total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Network</span>
                  <span className="font-semibold text-gray-900">{provider}</span>
                </div>
              </div>

              <p className="text-xs text-center text-gray-400 mb-4">
                Check your phone and enter your {isMTN ? "MoMo" : "Telecel Cash"} PIN to approve.
              </p>

              {/* Simulate buttons — in production these would be replaced by real webhook callbacks */}
              <div className="space-y-2">
                <button onClick={() => simulatePayment(true)}
                  className={cn("w-full py-3 rounded-xl font-semibold text-sm transition-all",
                    isMTN ? "bg-yellow-400 hover:bg-yellow-500 text-yellow-900" : "bg-red-600 hover:bg-red-700 text-white")}>
                  ✓ I've Approved on My Phone
                </button>
                <button onClick={() => simulatePayment(false)}
                  className="w-full py-2.5 rounded-xl font-medium text-sm text-gray-400 hover:text-gray-600 transition-colors">
                  I didn't receive a prompt
                </button>
              </div>
            </>
          )}

          {stage === "waiting" && (
            <div className="text-center py-8">
              <Loader2 className="w-12 h-12 mx-auto text-amber-500 animate-spin mb-4" />
              <h2 className="text-lg font-bold text-gray-900">Verifying Payment…</h2>
              <p className="text-sm text-gray-400 mt-1">Please wait while we confirm your payment</p>
            </div>
          )}

          {stage === "success" && (
            <div className="text-center py-8">
              <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-8 h-8 text-emerald-500" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Payment Confirmed!</h2>
              <p className="text-sm text-gray-400 mt-1">Placing your order…</p>
            </div>
          )}

          {stage === "failed" && (
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Payment Failed</h2>
              <p className="text-sm text-gray-400 mt-2 mb-5">
                The payment was not approved or timed out. Please try again.
              </p>
              <button onClick={onFail}
                className="w-full py-3 rounded-xl font-semibold text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors">
                ← Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Checkout Component ───────────────────────────────────

export default function ShopCheckout() {
  const { items, subtotal, clearCart } = useCart();
  const [, navigate] = useLocation();

  const [form, setForm] = useState({ ...emptyForm });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Card");
  const [momoProvider, setMomoProvider] = useState<MoMoProvider>("MTN MoMo");
  const [momoPhone, setMomoPhone] = useState("");
  const [momoPhoneError, setMomoPhoneError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState<CheckoutStep>("form");
  const [confirmedOrder, setConfirmedOrder] = useState<OnlineOrder | null>(null);

  const shippingFee = subtotal > 50 ? 0 : 5.99;
  const tax = 0;
  const total = subtotal + shippingFee;

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Full name is required";
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = "Valid email is required";
    if (!form.phone.trim()) e.phone = "Phone number is required";
    if (!form.address.trim()) e.address = "Street address is required";
    if (!form.city.trim()) e.city = "City is required";
    if (!form.zip.trim()) e.zip = "ZIP / Postal code is required";
    if (paymentMethod === "Mobile" && !momoPhone.trim()) {
      e.momoPhone = "Please enter your MoMo phone number";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleProceed() {
    if (items.length === 0) { navigate("/shop"); return; }
    if (!validate()) return;

    if (paymentMethod === "Mobile") {
      // Validate MoMo phone
      const cleaned = momoPhone.replace(/\s/g, "");
      if (!/^0[0-9]{9}$/.test(cleaned)) {
        setMomoPhoneError("Enter a valid 10-digit Ghanaian phone number (e.g. 0244123456)");
        return;
      }
      setMomoPhoneError("");
      setStep("momo-verify");
    } else {
      placeOrder();
    }
  }

  function placeOrder() {
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
      paymentMethod: paymentMethod === "Mobile" ? `${momoProvider}` as PaymentMethod : paymentMethod,
      status: "Pending",
      notes: form.notes,
    });
    clearCart();
    setConfirmedOrder(order);
    setStep("confirmed");
  }

  // ── MoMo Processing Screen ──
  if (step === "momo-verify") {
    return (
      <MoMoProcessing
        provider={momoProvider}
        momoPhone={momoPhone}
        total={total}
        onSuccess={placeOrder}
        onFail={() => setStep("form")}
      />
    );
  }

  // ── Order Confirmation Screen ──
  if (step === "confirmed" && confirmedOrder) {
    const isMomo = confirmedOrder.paymentMethod.includes("MoMo") || confirmedOrder.paymentMethod.includes("Telecel");
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-9 h-9 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
          <p className="text-gray-500 text-sm mb-1">
            Thank you, <strong>{confirmedOrder.customerName}</strong>!
          </p>
          <p className="text-gray-400 text-xs mb-5">
            Confirmation sent to <strong>{confirmedOrder.customerEmail}</strong>
          </p>

          <div className="bg-amber-50 rounded-xl p-4 mb-4 text-left space-y-2">
            <div className="flex justify-between">
              <span className="text-xs text-gray-500">Order Number</span>
              <span className="font-bold text-amber-700 text-sm">{confirmedOrder.orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-gray-500">Total Paid</span>
              <span className="font-bold text-gray-900">{fmt(confirmedOrder.total)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-gray-500">Payment</span>
              <span className={cn("text-sm font-semibold px-2 py-0.5 rounded-full text-xs",
                isMomo
                  ? confirmedOrder.paymentMethod.includes("MTN")
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-red-100 text-red-700"
                  : "bg-gray-100 text-gray-700")}>
                {confirmedOrder.paymentMethod}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-gray-500">Status</span>
              <span className="bg-amber-200 text-amber-800 text-xs font-bold px-2 py-0.5 rounded-full">Pending</span>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 mb-5 text-left">
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
              <Truck className="w-3.5 h-3.5" /> Delivering to:
            </div>
            <p className="text-sm font-medium text-gray-700">{confirmedOrder.shippingAddress}</p>
          </div>

          <Link href="/shop">
            <button className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 rounded-xl transition-all">
              Continue Shopping
            </button>
          </Link>
        </div>
      </div>
    );
  }

  // ── Empty Cart Guard ──
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
        <div className="text-center">
          <ShoppingBag className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 mb-4">Your cart is empty</p>
          <Link href="/shop">
            <button className="bg-amber-500 text-white px-5 py-2.5 rounded-xl font-semibold">Go Shopping</button>
          </Link>
        </div>
      </div>
    );
  }

  // ── Main Checkout Form ──
  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      {/* Header */}
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
          {/* ── Left: Form ── */}
          <div className="flex-1 space-y-5">

            {/* Contact Info */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h2 className="font-bold text-gray-900 mb-4">Contact Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { key: "name",  label: "Full Name",      placeholder: "Kwame Mensah",          type: "text",  span: false },
                  { key: "email", label: "Email Address",  placeholder: "kwame@example.com",     type: "email", span: true  },
                  { key: "phone", label: "Phone Number",   placeholder: "+233 24 123 4567",      type: "tel",   span: false },
                ].map(({ key, label, placeholder, type, span }) => (
                  <div key={key} className={span ? "sm:col-span-2" : ""}>
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
              <h2 className="font-bold text-gray-900 mb-4">Delivery Address</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Street / Area *</label>
                  <input type="text" value={form.address} placeholder="e.g. 14 Osu Oxford Street, Cantonments"
                    onChange={e => { setForm(f => ({ ...f, address: e.target.value })); setErrors(er => ({ ...er, address: "" })); }}
                    className={cn("w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400",
                      errors.address ? "border-red-300 bg-red-50" : "border-gray-200 bg-gray-50")} />
                  {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">City / Town *</label>
                    <input type="text" value={form.city} placeholder="Accra"
                      onChange={e => { setForm(f => ({ ...f, city: e.target.value })); setErrors(er => ({ ...er, city: "" })); }}
                      className={cn("w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400",
                        errors.city ? "border-red-300 bg-red-50" : "border-gray-200 bg-gray-50")} />
                    {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Digital Address / Postcode *</label>
                    <input type="text" value={form.zip} placeholder="GA-123-4567"
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

              {/* Top-level method selector */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                {([
                  { value: "Mobile",           icon: Smartphone,  label: "Mobile Money" },
                  { value: "Card",             icon: CreditCard,  label: "Card" },
                  { value: "Cash on Delivery", icon: Truck,       label: "Cash on Delivery" },
                ] as { value: PaymentMethod; icon: React.ElementType; label: string }[]).map(({ value, icon: Icon, label }) => (
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

              {/* Mobile Money sub-panel */}
              {paymentMethod === "Mobile" && (
                <div className="border border-amber-200 bg-amber-50/50 rounded-xl p-4 space-y-4">
                  {/* Provider selection */}
                  <div>
                    <p className="text-xs font-semibold text-gray-600 mb-2">Select Network</p>
                    <div className="grid grid-cols-2 gap-3">
                      {MOMO_PROVIDERS.map(p => (
                        <button key={p.id} onClick={() => setMomoProvider(p.id)}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-xl border-2 transition-all",
                            momoProvider === p.id
                              ? `${p.border} ${p.bg.replace("bg-", "bg-opacity-20 border-")} shadow-sm`
                              : "border-gray-200 bg-white hover:border-gray-300"
                          )}>
                          <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center font-black text-xs flex-shrink-0", p.bg, p.color)}>
                            {p.logo}
                          </div>
                          <div className="text-left">
                            <div className={cn("text-sm font-bold", momoProvider === p.id ? "text-gray-900" : "text-gray-700")}>{p.id}</div>
                            <div className="text-xs text-gray-400">{p.prefix}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* MoMo phone number */}
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1.5 block">
                      {momoProvider} Phone Number *
                    </label>
                    <div className="flex items-center gap-2">
                      <div className={cn("flex items-center justify-center w-10 h-10 rounded-xl font-black text-xs flex-shrink-0",
                        momoProvider === "MTN MoMo" ? "bg-yellow-400 text-yellow-900" : "bg-red-600 text-white")}>
                        {momoProvider === "MTN MoMo" ? "MTN" : "TEL"}
                      </div>
                      <input
                        type="tel"
                        value={momoPhone}
                        onChange={e => { setMomoPhone(e.target.value); setMomoPhoneError(""); setErrors(er => ({ ...er, momoPhone: "" })); }}
                        placeholder={momoProvider === "MTN MoMo" ? "0244 123 456" : "0201 234 567"}
                        className={cn(
                          "flex-1 border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400",
                          momoPhoneError || errors.momoPhone ? "border-red-300 bg-red-50" : "border-gray-200 bg-white"
                        )}
                      />
                    </div>
                    {(momoPhoneError || errors.momoPhone) && (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {momoPhoneError || errors.momoPhone}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-1.5">
                      You will receive a payment prompt on this number. Enter your PIN to approve.
                    </p>
                  </div>

                  {/* How it works */}
                  <div className="bg-white rounded-xl p-3 border border-amber-100">
                    <p className="text-xs font-semibold text-gray-600 mb-2">How it works</p>
                    <ol className="text-xs text-gray-500 space-y-1 list-none">
                      {[
                        "Enter your MoMo number above",
                        "Click \"Place Order\" — a payment prompt is sent to your phone",
                        "Open your phone and approve with your PIN",
                        "Your order is confirmed instantly",
                      ].map((step, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className={cn("w-4 h-4 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 mt-0.5 text-[10px]",
                            momoProvider === "MTN MoMo" ? "bg-yellow-400 text-yellow-900" : "bg-red-500")}>
                            {i + 1}
                          </span>
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              )}

              {paymentMethod === "Card" && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-xs text-blue-700">
                  <strong>Card payment</strong> — You will be redirected to a secure payment page after placing your order.
                </div>
              )}

              {paymentMethod === "Cash on Delivery" && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-xs text-gray-600">
                  <strong>Cash on Delivery</strong> — Pay in cash when your order arrives at your doorstep. Our rider will collect the exact amount.
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h2 className="font-bold text-gray-900 mb-3">
                Order Notes <span className="text-gray-400 font-normal text-sm">(optional)</span>
              </h2>
              <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2}
                placeholder="Any special delivery instructions…"
                className="w-full border border-gray-200 bg-gray-50 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none" />
            </div>
          </div>

          {/* ── Right: Order Summary ── */}
          <div className="lg:w-80">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 sticky top-20">
              <h2 className="font-bold text-gray-900 mb-4">Order Summary</h2>
              <div className="space-y-3 mb-4 max-h-48 overflow-y-auto pr-1">
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
                  <span>Delivery</span>
                  <span className={shippingFee === 0 ? "text-emerald-500 font-medium" : "font-medium text-gray-900"}>
                    {shippingFee === 0 ? "FREE" : fmt(shippingFee)}
                  </span>
                </div>
                <div className="flex justify-between text-gray-500">
                   <span>Tax</span><span className="font-medium text-gray-900">GHS 0.00</span>
                </div>
                <div className="border-t border-gray-100 pt-2 flex justify-between font-bold text-gray-900 text-base">
                  <span>Total</span><span>{fmt(total)}</span>
                </div>
              </div>

              <button onClick={handleProceed}
                className="w-full mt-5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-semibold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 text-sm">
                {paymentMethod === "Mobile"
                  ? <><Smartphone className="w-4 h-4" /> Pay with {momoProvider} — {fmt(total)}</>
                  : <><Package className="w-4 h-4" /> Place Order — {fmt(total)}</>
                }
                <ChevronRight className="w-4 h-4" />
              </button>
              <p className="text-xs text-gray-400 text-center mt-3">🔒 Secure checkout</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
