'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { TelkomLogo, TelkomFooter } from '../../components/TelkomBrand';

export default function MainDashboardMenu() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ activeOffers: 0, urgentOffers: 0, unpaidBills: 0, paidBills: 0 });
  const router = useRouter();

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (!savedUser) {
      router.push('/login');
    } else {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      loadQuickStats(parsedUser.id);
    }
  }, []);

  const loadQuickStats = async (userId) => {
    try {
      const [resOffers, resPiutang] = await Promise.all([
        fetch(`/api/penawaran?userId=${userId}`),
        fetch(`/api/piutang?userId=${userId}`)
      ]);
      const dataOffers = resOffers.ok ? (await resOffers.json()).data : [];
      const dataPiutang = resPiutang.ok ? (await resPiutang.json()).data : [];

      const active = dataOffers.filter(o => !o.status_prospek || o.status_prospek === 'IN_PROGRESS');
      const urgent = active.filter(o => o.aging_hari >= 21);
      const unpaid = dataPiutang.filter(p => p.status_pembayaran === 'UNPAID');
      const paid = dataPiutang.filter(p => p.status_pembayaran === 'PAID');

      setStats({
        activeOffers: active.length,
        urgentOffers: urgent.length,
        unpaidBills: unpaid.length,
        paidBills: paid.length
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (!user) return null;

  const todayFormatted = new Date().toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col justify-between">
      <div>
        {/* Top Navbar */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
          <div className="max-w-6xl mx-auto px-4 py-3.5 flex justify-between items-center">
            <TelkomLogo />
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-extrabold text-slate-800">{user.nama_lengkap}</span>
                <span className="text-[10px] font-semibold text-[#E4002B]">Account Manager • EBS</span>
              </div>
              <button 
                onClick={handleLogout} 
                className="text-xs bg-slate-900 text-white font-bold px-4 py-2 rounded-xl hover:bg-[#E4002B] transition shadow-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Hero Banner Korporat Telkom */}
        <div className="max-w-6xl mx-auto px-4 mt-6">
          <div className="bg-gradient-to-r from-[#E4002B] via-[#B80022] to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
            <div className="absolute right-0 top-0 w-72 h-72 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4 blur-xl"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <div className="inline-flex items-center gap-2 bg-white/15 px-3 py-1 rounded-full text-[11px] font-semibold mb-3 border border-white/20">
                  <span>📅 {todayFormatted}</span>
                </div>
                <h1 className="text-2xl md:text-3xl font-black tracking-tight">
                  Semangat Pagi, {user.nama_lengkap}! 👋
                </h1>
                <p className="text-xs md:text-sm text-red-100 mt-1.5 max-w-xl">
                  Dashboard terpadu operasional Enterprise & Business Service. Pantau prospek penawaran dan percepat collection piutang dalam satu pintu.
                </p>
              </div>

              {/* Quick Stats Ringkas */}
              <div className="grid grid-cols-2 gap-3 w-full md:w-auto">
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-3.5 text-center min-w-[120px]">
                  <p className="text-2xl font-black">{stats.activeOffers}</p>
                  <p className="text-[10px] uppercase tracking-wider text-red-100 font-bold mt-0.5">Prospek Aktif</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-3.5 text-center min-w-[120px]">
                  <p className="text-2xl font-black text-amber-300">{stats.unpaidBills}</p>
                  <p className="text-[10px] uppercase tracking-wider text-red-100 font-bold mt-0.5">Tagihan Unpaid</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pilihan Modul Utama */}
        <div className="max-w-6xl mx-auto px-4 mt-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1.5 h-5 bg-[#E4002B] rounded-full"></span>
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">Pilih Modul Operasional</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Modul 1: Reminder Status Penawaran */}
            <Link 
              href="/dashboard/reminder" 
              className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-slate-200 hover:border-[#E4002B] overflow-hidden flex flex-col justify-between"
            >
              <div className="p-6 md:p-8">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-red-50 text-[#E4002B] flex items-center justify-center text-3xl group-hover:bg-[#E4002B] group-hover:text-white transition-colors">
                    🚀
                  </div>
                  {stats.urgentOffers > 0 && (
                    <span className="bg-red-100 text-[#E4002B] text-[11px] font-extrabold px-3 py-1 rounded-full animate-pulse">
                      ⚠️ {stats.urgentOffers} Urgent (≥21 Hari)
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-black text-slate-800 group-hover:text-[#E4002B] transition-colors">
                  Reminder Status Penawaran
                </h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Kelola aging proyek, pantau status prospek (In Progress, Won, Lost), import massal Excel/CSV, ekspor PDF resmi, dan kirim reminder langsung ke Telegram.
                </p>
              </div>
              <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-100 flex justify-between items-center group-hover:bg-red-50/50 transition-colors">
                <span className="text-xs font-bold text-slate-600 group-hover:text-[#E4002B]">Buka Modul Penawaran</span>
                <span className="text-sm font-bold text-[#E4002B] group-hover:translate-x-1 transition-transform">➡️</span>
              </div>
            </Link>

            {/* Modul 2: Telkom Collection & Bukpot */}
            <Link 
              href="/dashboard/collection" 
              className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-slate-200 hover:border-slate-800 overflow-hidden flex flex-col justify-between"
            >
              <div className="p-6 md:p-8">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-800 flex items-center justify-center text-3xl group-hover:bg-slate-900 group-hover:text-white transition-colors">
                    💰
                  </div>
                  <span className="bg-emerald-100 text-emerald-700 text-[11px] font-extrabold px-3 py-1 rounded-full">
                    ✅ {stats.paidBills} Lunas / Paid
                  </span>
                </div>
                <h3 className="text-xl font-black text-slate-800 group-hover:text-[#E4002B] transition-colors">
                  Telkom Collection & Bukpot
                </h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Kelola piutang bulan berjalan, tunggakan, dan Bukpot PPh. Filter broadcast per PIC/AM, rekonsiliasi pelunasan, serta pantau Collection Recovery Rate.
                </p>
              </div>
              <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-100 flex justify-between items-center group-hover:bg-slate-100 transition-colors">
                <span className="text-xs font-bold text-slate-600 group-hover:text-slate-900">Buka Modul Collection</span>
                <span className="text-sm font-bold text-slate-900 group-hover:translate-x-1 transition-transform">➡️</span>
              </div>
            </Link>
          </div>
        </div>
      </div>

      <TelkomFooter />
    </div>
  );
}
