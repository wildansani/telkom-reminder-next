export function TelkomLogo({ light = false }) {
  return (
    <div className="flex items-center gap-3 select-none">
      {/* Emblem Telkom Stylized SVG */}
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-md ${light ? 'bg-white text-[#E4002B]' : 'bg-gradient-to-br from-[#E4002B] to-[#99001D] text-white'}`}>
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-5H7.5l5.5-7v5h3.5l-5.5 7z" />
        </svg>
      </div>
      <div>
        <div className="flex items-center gap-1.5">
          <span className={`text-lg font-black tracking-wider ${light ? 'text-white' : 'text-slate-900'}`}>
            TELKOM
          </span>
          <span className={`text-lg font-light tracking-widest ${light ? 'text-red-200' : 'text-[#E4002B]'}`}>
            INDONESIA
          </span>
        </div>
        <p className={`text-[10px] font-semibold tracking-widest uppercase -mt-1 ${light ? 'text-red-100/80' : 'text-slate-400'}`}>
          the world in your hand
        </p>
      </div>
    </div>
  );
}

export function TelkomFooter() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white py-6">
      <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#E4002B]"></span>
          <span className="font-bold text-slate-700">PT Telkom Indonesia (Persero) Tbk</span>
          <span>— Enterprise & Business Service Portal</span>
        </div>
        <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
          <span className="font-black text-[#E4002B] tracking-wider">AKHLAK</span>
          <span className="text-[10px] text-slate-500 font-semibold">
            Amanah • Kompeten • Harmonis • Loyal • Adaptif • Kolaboratif
          </span>
        </div>
      </div>
    </footer>
  );
}
