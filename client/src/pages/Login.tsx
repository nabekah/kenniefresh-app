import { useState } from "react";
import { useLocation } from "wouter";
import { Eye, EyeOff } from "lucide-react";

export default function Login() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      // Redirect to dashboard
      navigate("/");
      window.location.reload();
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "linear-gradient(135deg, #1a3fa8 0%, #0d1f5c 60%, #1a3fa8 100%)" }}
    >
      <div
        className="w-full max-w-md mx-4 rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: "rgba(15, 15, 35, 0.95)", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        {/* Header */}
        <div className="px-8 pt-10 pb-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg"
              style={{ background: "linear-gradient(135deg, #2db84b, #1a9e3f)" }}
            >
              K
            </div>
            <span className="text-3xl font-bold text-white tracking-tight">
              Kennie<span style={{ color: "#2db84b" }}>fresh</span>
            </span>
          </div>
          <p className="text-sm font-medium" style={{ color: "#8888aa" }}>
            Sales & Inventory Management
          </p>
          <div
            className="mt-3 inline-block px-3 py-1 rounded-full text-xs font-medium"
            style={{ background: "rgba(45,184,75,0.15)", color: "#2db84b", border: "1px solid rgba(45,184,75,0.3)" }}
          >
            Staff Portal
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "#c0c0d0" }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@kenniefresh.biz"
              autoComplete="email"
              className="w-full px-4 py-3 rounded-lg text-white text-sm outline-none transition-all"
              style={{
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
              onFocus={e => (e.target.style.borderColor = "#2db84b")}
              onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.12)")}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "#c0c0d0" }}>
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Enter your password"
                autoComplete="current-password"
                className="w-full px-4 py-3 pr-11 rounded-lg text-white text-sm outline-none transition-all"
                style={{
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.12)",
                }}
                onFocus={e => (e.target.style.borderColor = "#2db84b")}
                onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.12)")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                style={{ color: "#8888aa" }}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="text-sm rounded-lg px-4 py-3 flex items-start gap-2" style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)", color: "#fca5a5" }}>
              <span className="mt-0.5">⚠</span>
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg font-semibold text-white transition-all mt-2"
            style={{
              background: loading ? "#1a9e3f" : "linear-gradient(135deg, #2db84b, #1a9e3f)",
              opacity: loading ? 0.7 : 1,
              boxShadow: "0 4px 15px rgba(45,184,75,0.3)",
            }}
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>

          <p className="text-center text-xs pt-1" style={{ color: "#666680" }}>
            Contact your administrator if you need access
          </p>
        </form>

        <div className="px-8 pb-6 text-center text-xs border-t" style={{ color: "#555570", borderColor: "rgba(255,255,255,0.06)", paddingTop: "16px" }}>
          © 2026 Kenniefresh.biz · 0538979775 / 0205153749
        </div>
      </div>
    </div>
  );
}
