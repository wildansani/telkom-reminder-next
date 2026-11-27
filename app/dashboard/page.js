'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { TelkomLogo, TelkomFooter } from '../../components/TelkomBrand';

export default function MainDashboardMenu() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ activeOffers: 0, urgentOffers: 0, unpaidBills: 0, paidBills: 0, indibizPending: 0 });
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
      const [resOffers, resPiutang, resIndibiz] = await Promise.all([
        fetch(`/api/penawaran?userId=${userId}`),
        fetch(`/api/piutang?userId=${userId}`),
        fetch(`/api/indibiz?userId=${userId}`)
      ]);
      const dataOffers = resOffers.ok ? (await resOffers.json()).data : [];
      const dataPiutang = resPiutang.ok ? (await resPiutang.json()).data : [];
      const dataIndibiz = resIndibiz.ok ? (await resIndibiz.json()).data : [];

      const active = dataOffers.filter(o => !o.status_prospek || o.status_prospek === 'IN_PROGRESS');
      const urgent = active.filter(o => o.aging_hari >= 21);
      const unpaid = dataPiutang.filter(p => p.status_pembayaran === 'UNPAID');
      const paid = dataPiutang.filter(p => p.status_pembayaran === 'PAID');
      const indibizPending = dataIndibiz.filter(c => !c.status_chat || c.status_chat === 'BELUM_CHAT');

      setStats({
        activeOffers: active.length,
        urgentOffers: urgent.length,
        unpaidBills: unpaid.length,
        paidBills: paid.length,
        indibizPending: indibizPending.length
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
    <div className="bg-gradient-to-br from-rose-50 via-red-50/70 to-slate-200 min-h-screen flex flex-col justify-between">
      <div>
        {/* Top Navbar */}
        <header className="bg-white/95 backdrop-blur-md border-b border-red-100 sticky top-0 z-30 shadow-sm">
          <div className="max-w-6xl mx-auto px-4 py-3.5 flex justify-between items-center">
            <TelkomLogo />
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-extrabold text-slate-800">{user.nama_lengkap}</span>
                <span className="text-[10px] font-semibold text-[#E4002B]">Account Manager • EBS</span>
              </div>
              <button
                onClick={handleLogout}
                className="text-xs bg-gradient-to-r from-[#E4002B] to-slate-900 text-white font-bold px-4 py-2 rounded-xl hover:opacity-90 transition shadow-sm"
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
                  Dashboard terpadu operasional Enterprise & Business Service. Pantau prospek penawaran, collection piutang, dan pengingat tagihan Indibiz dalam satu pintu.
                </p>
              </div>

              {/* Quick Stats Ringkas */}
              <div className="grid grid-cols-3 gap-2.5 w-full md:w-auto">
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-3 text-center min-w-[100px]">
                  <p className="text-2xl font-black">{stats.activeOffers}</p>
                  <p className="text-[10px] uppercase tracking-wider text-red-100 font-bold mt-0.5">Prospek Aktif</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-3 text-center min-w-[100px]">
                  <p className="text-2xl font-black text-amber-300">{stats.unpaidBills}</p>
                  <p className="text-[10px] uppercase tracking-wider text-red-100 font-bold mt-0.5">Unpaid</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-3 text-center min-w-[100px]">
                  <p className="text-2xl font-black text-emerald-300">{stats.indibizPending}</p>
                  <p className="text-[10px] uppercase tracking-wider text-red-100 font-bold mt-0.5">Chat Indibiz</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pilihan Modul Utama (4 Kartu Tema Merah Gradasi) */}
        <div className="max-w-6xl mx-auto px-4 mt-8 mb-10">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1.5 h-5 bg-[#E4002B] rounded-full"></span>
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">Pilih Modul Operasional</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Modul 1: Reminder Status Penawaran */}
            <Link
              href="/dashboard/reminder"
              className="group bg-gradient-to-br from-[#E4002B] via-[#B80022] to-slate-900 rounded-2xl shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border border-white/15 overflow-hidden flex flex-col justify-between text-white"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 text-white flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                    🚀
                  </div>
                  {stats.urgentOffers > 0 && (
                    <span className="bg-amber-400 text-slate-900 text-[10px] font-extrabold px-2.5 py-1 rounded-full animate-pulse">
                      ⚠️ {stats.urgentOffers} Urgent
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-black text-white">
                  Reminder Status Penawaran
                </h3>
                <p className="text-xs text-red-100/90 mt-2 leading-relaxed">
                  Kelola aging proyek, filter broadcast per PIC, pantau status prospek (Won/Lost), dan kirim reminder langsung ke Telegram.
                </p>
              </div>
              <div className="bg-black/25 px-6 py-3.5 border-t border-white/10 flex justify-between items-center group-hover:bg-black/40 transition-colors">
                <span className="text-xs font-bold text-white">Buka Modul Penawaran</span>
                <span className="text-sm font-bold text-amber-300 group-hover:translate-x-1 transition-transform">➡️</span>
              </div>
            </Link>

            {/* Modul 2: Telkom Collection & Bukpot */}
            <Link
              href="/dashboard/collection"
              className="group bg-gradient-to-br from-[#E4002B] via-[#B80022] to-slate-900 rounded-2xl shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border border-white/15 overflow-hidden flex flex-col justify-between text-white"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 text-white flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                    💰
                  </div>
                  <span className="bg-emerald-400/25 border border-emerald-300/40 text-emerald-200 text-[10px] font-extrabold px-2.5 py-1 rounded-full">
                    ✅ {stats.paidBills} Lunas
                  </span>
                </div>
                <h3 className="text-lg font-black text-white">
                  Telkom Collection & Bukpot
                </h3>
                <p className="text-xs text-red-100/90 mt-2 leading-relaxed">
                  Kelola piutang bulan berjalan, tunggakan, dan Bukpot PPh. Filter broadcast per PIC/AM serta pantau Recovery Rate.
                </p>
              </div>
              <div className="bg-black/25 px-6 py-3.5 border-t border-white/10 flex justify-between items-center group-hover:bg-black/40 transition-colors">
                <span className="text-xs font-bold text-white">Buka Modul Collection</span>
                <span className="text-sm font-bold text-amber-300 group-hover:translate-x-1 transition-transform">➡️</span>
              </div>
            </Link>

            {/* Modul 3: Indibiz Billing Reminder */}
            <Link
              href="/dashboard/indibiz"
              className="group bg-gradient-to-br from-[#E4002B] via-[#B80022] to-slate-900 rounded-2xl shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border border-white/15 overflow-hidden flex flex-col justify-between text-white"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 text-white flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                    💬
                  </div>
                  <span className="bg-amber-400/25 border border-amber-300/40 text-amber-200 text-[10px] font-extrabold px-2.5 py-1 rounded-full">
                    ⏳ {stats.indibizPending} Belum Chat
                  </span>
                </div>
                <h3 className="text-lg font-black text-white">
                  Indibiz Billing Reminder
                </h3>
                <p className="text-xs text-red-100/90 mt-2 leading-relaxed">
                  Auto-generator chat tagihan Indibiz (Billing Telkom Priangan Timur). Pilih pelanggan dari master data, revisi nominal, dan kirim via WhatsApp.
                </p>
              </div>
              <div className="bg-black/25 px-6 py-3.5 border-t border-white/10 flex justify-between items-center group-hover:bg-black/40 transition-colors">
                <span className="text-xs font-bold text-white">Buka Generator Chat</span>
                <span className="text-sm font-bold text-amber-300 group-hover:translate-x-1 transition-transform">➡️</span>
              </div>
            </Link>

            {/* Modul 4: Auto Surat Tagihan Resmi */}
            <Link
              href="/dashboard/surat-tagihan"
              className="group bg-gradient-to-br from-[#E4002B] via-[#B80022] to-slate-900 rounded-2xl shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border border-white/15 overflow-hidden flex flex-col justify-between text-white"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 text-white flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                    📄
                  </div>
                  <span className="bg-white/20 border border-white/30 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full">
                    PDF A4 Resmi
                  </span>
                </div>
                <h3 className="text-lg font-black text-white">
                  Auto Surat Tagihan
                </h3>
                <p className="text-xs text-red-100/90 mt-2 leading-relaxed">
                  Buat surat resmi Penyelesaian Tunggakan Layanan Telkom (Witel Priangan Timur) lengkap dengan tabel bulan, upload TTD, QR bayar, dan cetak PDF.
                </p>
              </div>
              <div className="bg-black/25 px-6 py-3.5 border-t border-white/10 flex justify-between items-center group-hover:bg-black/40 transition-colors">
                <span className="text-xs font-bold text-white">Buat Surat Tagihan</span>
                <span className="text-sm font-bold text-amber-300 group-hover:translate-x-1 transition-transform">➡️</span>
              </div>
            </Link>
          </div>
        </div>
      </div>

              {/* Banner Modul Unggulan: Executive Payment Collection & Analytics */}
        <div className="max-w-6xl mx-auto px-4 mb-10">
          <Link
            href="/dashboard/executive-collection"
            className="group block bg-gradient-to-r from-slate-900 via-[#800018] to-[#E4002B] rounded-3xl p-6 md:p-7 text-white shadow-xl hover:shadow-2xl transition-all border border-white/15"
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center text-3xl shrink-0 group-hover:scale-110 transition-transform">
                  📊
                </div>
                <div>
                  <div className="inline-flex items-center gap-2 bg-amber-400 text-slate-900 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider mb-1.5">
                    Executive BI & Field Tracking
                  </div>
                  <h3 className="text-xl font-black tracking-tight">
                    Payment Collection (Caring & Visit) + Grafik & Ranking PIC/AM
                  </h3>
                  <p className="text-xs text-red-100 mt-1 max-w-2xl leading-relaxed">
                    Dashboard analitik eksekutif lengkap dengan Donut Chart distribusi status, grafik perbandingan Caring per Datel, tren Collection Rate vs target 98%, tracking kunjungan Visit, leaderboard kinerja PIC, dan mode Sensor Data presentasi.
                  </p>
                </div>
              </div>
              <div className="bg-white text-[#E4002B] font-black text-xs px-5 py-3 rounded-xl shadow group-hover:bg-amber-300 group-hover:text-slate-900 transition shrink-0">
                Buka Executive Analytics ➡️
              </div>
            </div>
          </Link>
        </div>

      <TelkomFooter />
    </div>
  );
}

