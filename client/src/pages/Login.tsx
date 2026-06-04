import { useState } from "react";
import { useLocation } from "wouter";

type Mode = "login" | "register";

export default function Login() {
  const [, navigate] = useLocation();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
    const body =
      mode === "login"
        ? { email, password }
        : { name, email, password };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      // Redirect to admin dashboard
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
      style={{ background: "linear-gradient(135deg, #1a3fa8 0%, #2db84b 100%)" }}
    >
      <div
        className="w-full max-w-md mx-4 rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: "var(--color-surface, #1a1a2e)" }}
      >
        {/* Header */}
        <div className="px-8 pt-8 pb-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg"
              style={{ background: "#2db84b" }}
            >
              K
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">
              Kennie<span style={{ color: "#2db84b" }}>fresh</span>
            </span>
          </div>
          <p className="text-sm" style={{ color: "#a0a0b0" }}>
            Admin Panel — Home of Living Water
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex mx-8 mt-4 rounded-lg overflow-hidden border border-white/10">
          {(["login", "register"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(""); }}
              className="flex-1 py-2 text-sm font-medium transition-colors"
              style={{
                background: mode === m ? "#2db84b" : "transparent",
                color: mode === m ? "#fff" : "#a0a0b0",
              }}
            >
              {m === "login" ? "Sign In" : "Register"}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-8 py-6 space-y-4">
          {mode === "register" && (
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="e.g. Kennie Fresh"
                className="w-full px-4 py-2.5 rounded-lg text-white text-sm outline-none border border-white/10 focus:border-green-400 transition-colors"
                style={{ background: "#ffffff10" }}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-white/70 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@kenniefresh.biz"
              className="w-full px-4 py-2.5 rounded-lg text-white text-sm outline-none border border-white/10 focus:border-green-400 transition-colors"
              style={{ background: "#ffffff10" }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="At least 6 characters"
              className="w-full px-4 py-2.5 rounded-lg text-white text-sm outline-none border border-white/10 focus:border-green-400 transition-colors"
              style={{ background: "#ffffff10" }}
            />
          </div>

          {error && (
            <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg font-semibold text-white transition-opacity disabled:opacity-60"
            style={{ background: "#2db84b" }}
          >
            {loading
              ? "Please wait…"
              : mode === "login"
              ? "Sign In"
              : "Create Account"}
          </button>

          {mode === "register" && (
            <p className="text-xs text-center" style={{ color: "#a0a0b0" }}>
              The first registered account is automatically made an admin.
            </p>
          )}
        </form>

        <div className="px-8 pb-6 text-center text-xs" style={{ color: "#a0a0b0" }}>
          © 2026 Kenniefresh.biz · 0538979775
        </div>
      </div>
    </div>
  );
}
