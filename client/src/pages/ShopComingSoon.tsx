// =============================================================
// Shop temporarily disabled — Coming Soon page
// =============================================================

import { ShoppingCart, Clock, Phone, Instagram, Facebook } from "lucide-react";

export default function ShopComingSoon() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: "linear-gradient(135deg, #1A3FA8 0%, #0D1B2A 60%, #2DB84B 100%)" }}>

      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/10 border-2 border-white/30 mb-4">
          <ShoppingCart className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-4xl font-extrabold text-white tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          Kennie<span className="text-green-400">fresh</span>
        </h1>
        <p className="text-white/60 text-sm mt-1 tracking-widest uppercase">Home of Living Water</p>
      </div>

      {/* Coming Soon card */}
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-amber-400 animate-pulse" />
          <span className="text-amber-400 font-semibold text-sm uppercase tracking-widest">Coming Soon</span>
        </div>

        <h2 className="text-2xl font-bold text-white mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          Our Online Shop is Almost Ready!
        </h2>

        <p className="text-white/70 text-sm leading-relaxed mb-6">
          We are putting the finishing touches on our online store. Very soon you will be able to browse and order all your favourite groceries — local and foreign goods — right from your phone.
        </p>

        <div className="border-t border-white/20 pt-5 mt-2 space-y-3">
          <p className="text-white/60 text-xs uppercase tracking-widest">In the meantime, reach us on</p>

          <div className="flex items-center justify-center gap-2 text-white font-semibold">
            <Phone className="w-4 h-4 text-green-400" />
            <a href="tel:0538979775" className="hover:text-green-400 transition-colors">0538979775</a>
            <span className="text-white/30">/</span>
            <a href="tel:0205153749" className="hover:text-green-400 transition-colors">0205153749</a>
          </div>

          <div className="flex items-center justify-center gap-4 mt-2">
            <a href="https://instagram.com/kennie_fresh" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-white/70 hover:text-pink-400 transition-colors text-sm">
              <Instagram className="w-4 h-4" />
              @kennie_fresh
            </a>
            <a href="https://facebook.com/kenniefresh" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-white/70 hover:text-blue-400 transition-colors text-sm">
              <Facebook className="w-4 h-4" />
              kenniefresh
            </a>
          </div>
        </div>
      </div>

      <p className="text-white/30 text-xs mt-8">© 2026 Kenniefresh.biz — All rights reserved</p>
    </div>
  );
}
