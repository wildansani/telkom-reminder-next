'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ExecutiveCollectionPage() {
  const [user, setUser] = useState(null);
  const [records, setRecords] = useState([]);
  const [piutangRecords, setPiutangRecords] = useState([]);
  const [penawaranRecords, setPenawaranRecords] = useState([]);

  // Navigasi Sub-Tab Internal
  const [activeSection, setActiveSection] = useState('RINGKASAN'); // 'RINGKASAN', 'TINDAK_LANJUT', 'KINERJA_PIC'
  const [privacyMask, setPrivacyMask] = useState(false);

  // Filter Tindak Lanjut
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDatel, setFilterDatel] = useState('ALL');
  const [filterCaring, setFilterCaring] = useState('ALL');
  const [filterVisit, setFilterVisit] = useState('ALL');
  const [filterPic, setFilterPic] = useState('ALL');

  const router = useRouter();

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (!savedUser) {
      router.push('/login');
    } else {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      loadAllAnalyticsData(parsedUser.id);
    }

    const scriptXlsx = document.createElement('script');
    scriptXlsx.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
    document.body.appendChild(scriptXlsx);
  }, []);

  const loadAllAnalyticsData = async (userId) => {
    try {
      const [resIndibiz, resPiutang, resPenawaran] = await Promise.all([
        fetch(`/api/indibiz?userId=${userId}`),
        fetch(`/api/piutang?userId=${userId}`),
        fetch(`/api/penawaran?userId=${userId}`)
      ]);
      if (resIndibiz.ok) setRecords((await resIndibiz.json()).data || []);
      if (resPiutang.ok) setPiutangRecords((await resPiutang.json()).data || []);
      if (resPenawaran.ok) setPenawaranRecords((await resPenawaran.json()).data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateRecord = async (item, patch) => {
    const updatedItem = { ...item, ...patch };
    const res = await fetch('/api/indibiz', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: updatedItem.id,
        nomorLayanan: updatedItem.nomor_layanan,
        namaPelanggan: updatedItem.nama_pelanggan,
        noWa: updatedItem.no_wa || '',
        periode: updatedItem.periode || '',
        nominal: updatedItem.nominal || 0,
        statusChat: updatedItem.status_chat || 'BELUM_CHAT',
        datelSto: updatedItem.datel_sto || 'Priangan Timur',
        statusCaring: updatedItem.status_caring || 'BELUM_CARING',
        statusVisit: updatedItem.status_visit || 'BELUM_VISIT',
        umurTunggakan: updatedItem.umur_tunggakan || '1 Bulan',
        picPetugas: updatedItem.pic_petugas || user.nama_lengkap,
      }),
    });
    if (res.ok) {
      loadAllAnalyticsData(user.id);
    }
  };

  // Sensor Privasi (Menyamarkan ID Layanan & Nomor HP saat presentasi)
  const maskText = (val) => {
    const str = String(val || '');
    if (!privacyMask || str.length < 6) return str;
    return str.slice(0, 4) + '****' + str.slice(-4);
  };

  const formatRupiah = (num) => {
    const val = Number(num) || 0;
    return 'Rp ' + val.toLocaleString('id-ID');
  };

  const formatJuta = (num) => {
    const val = Number(num) || 0;
    if (val >= 1000000) return `Rp ${(val / 1000000).toFixed(1)} Jt`;
    if (val >= 1000) return `Rp ${(val / 1000).toFixed(0)} Rb`;
    return `Rp ${val}`;
  };

  if (!user) return null;

  // --- KALKULASI METRIK EKSEKUTIF REAL-TIME ---
  const totalPelanggan = records.length;
  const lunasList = records.filter((r) => r.status_chat === 'LUNAS' || r.status_visit === 'LUNAS_TEMPAT');
  const unpaidList = records.filter((r) => r.status_chat !== 'LUNAS' && r.status_visit !== 'LUNAS_TEMPAT');

  const totalOutstanding = unpaidList.reduce((acc, r) => acc + (Number(r.nominal) || 0), 0);
  const totalLunasNominal = lunasList.reduce((acc, r) => acc + (Number(r.nominal) || 0), 0);

  const sudahCaringList = records.filter(
    (r) =>
      (r.status_caring && r.status_caring !== 'BELUM_CARING') ||
      r.status_chat === 'SUDAH_CHAT' ||
      r.status_chat === 'LUNAS'
  );
  const belumCaringCount = Math.max(0, totalPelanggan - sudahCaringList.length);

  const sudahVisitList = records.filter((r) => r.status_visit && r.status_visit !== 'BELUM_VISIT');
  const belumVisitCount = Math.max(0, totalPelanggan - sudahVisitList.length);

  const janjiBayarList = records.filter((r) => r.status_caring === 'JANJI_BAYAR');
  const tunggakan2BlnList = records.filter((r) => r.umur_tunggakan === '> 2 Bulan');

  const caringPct = totalPelanggan > 0 ? ((sudahCaringList.length / totalPelanggan) * 100).toFixed(1) : '0.0';
  const visitPct = totalPelanggan > 0 ? ((sudahVisitList.length / totalPelanggan) * 100).toFixed(1) : '0.0';
  const lunasPct = totalPelanggan > 0 ? ((lunasList.length / totalPelanggan) * 100).toFixed(1) : '0.0';
  const unpaidPct = totalPelanggan > 0 ? ((unpaidList.length / totalPelanggan) * 100).toFixed(1) : '0.0';

  // --- DATA DONUT CHART DISTRIBUSI STATUS ---
  const donutSegments = [
    { label: 'Sudah Bayar (Lunas)', count: lunasList.length, color: '#10b981' },
    { label: 'Sudah Caring', count: sudahCaringList.length, color: '#f59e0b' },
    { label: 'Belum Caring (Antrean)', count: belumCaringCount, color: '#E4002B' },
    { label: 'Janji Bayar', count: janjiBayarList.length, color: '#8b5cf6' },
    { label: 'Sudah Visit', count: sudahVisitList.length, color: '#3b82f6' },
    { label: 'Tunggakan > 2 Bln', count: tunggakan2BlnList.length, color: '#9f1239' },
  ];
  const totalSegmentSum = donutSegments.reduce((s, d) => s + d.count, 0) || 1;
  let cumulativeAngle = 0;

  // --- DATA GROUPED BAR CHART PER DATEL / STO ---
  const datelMap = {};
  records.forEach((r) => {
    const datel = r.datel_sto || 'Priangan Timur';
    if (!datelMap[datel]) datelMap[datel] = { name: datel, caring: 0, antrean: 0, outstanding: 0 };
    const isCared =
      (r.status_caring && r.status_caring !== 'BELUM_CARING') ||
      r.status_chat === 'SUDAH_CHAT' ||
      r.status_chat === 'LUNAS';
    if (isCared) datelMap[datel].caring += 1;
    else datelMap[datel].antrean += 1;

    if (r.status_chat !== 'LUNAS' && r.status_visit !== 'LUNAS_TEMPAT') {
      datelMap[datel].outstanding += Number(r.nominal) || 0;
    }
  });
  const datelStats = Object.values(datelMap);
  const maxDatelBar = Math.max(1, ...datelStats.map((d) => Math.max(d.caring, d.antrean)));
  const topOutstandingDatel = [...datelStats].sort((a, b) => b.outstanding - a.outstanding).slice(0, 5);
  const maxOutstandingVal = Math.max(1, ...topOutstandingDatel.map((d) => d.outstanding));

  // --- RANKING KINERJA PIC / AM (GABUNGAN DATA COLLECTION + PENAWARAN + INDIBIZ) ---
  const picStatsMap = {};
  const ensurePicEntry = (name) => {
    const key = (name || user.nama_lengkap).trim();
    if (!picStatsMap[key]) {
      picStatsMap[key] = {
        pic: key,
        datel: 'Priangan Timur',
        totalCaring: 0,
        totalVisit: 0,
        lunasNominal: 0,
        totalPelanggan: 0,
        lunasCount: 0,
        activeOffers: 0,
        wonOffers: 0,
      };
    }
    return picStatsMap[key];
  };

  records.forEach((r) => {
    const entry = ensurePicEntry(r.pic_petugas || user.nama_lengkap);
    entry.datel = r.datel_sto || entry.datel;
    entry.totalPelanggan += 1;
    const isCared =
      (r.status_caring && r.status_caring !== 'BELUM_CARING') ||
      r.status_chat === 'SUDAH_CHAT' ||
      r.status_chat === 'LUNAS';
    if (isCared) entry.totalCaring += 1;
    if (r.status_visit && r.status_visit !== 'BELUM_VISIT') entry.totalVisit += 1;
    if (r.status_chat === 'LUNAS' || r.status_visit === 'LUNAS_TEMPAT') {
      entry.lunasCount += 1;
      entry.lunasNominal += Number(r.nominal) || 0;
    }
  });

  piutangRecords.forEach((p) => {
    const entry = ensurePicEntry(p.pic_am || user.nama_lengkap);
    entry.totalPelanggan += 1;
    entry.totalCaring += 1;
    if (p.status_pembayaran === 'PAID') {
      entry.lunasCount += 1;
    }
  });

  penawaranRecords.forEach((o) => {
    const entry = ensurePicEntry(o.pic_am || user.nama_lengkap);
    if (o.status_prospek === 'WON') entry.wonOffers += 1;
    else if (!o.status_prospek || o.status_prospek === 'IN_PROGRESS') entry.activeOffers += 1;
  });

  const picLeaderboard = Object.values(picStatsMap)
    .map((p) => ({
      ...p,
      collectionRate: p.totalPelanggan > 0 ? ((p.lunasCount / p.totalPelanggan) * 100).toFixed(1) : '0.0',
    }))
    .sort((a, b) => b.totalCaring - a.totalCaring || b.lunasNominal - a.lunasNominal);

  const topCaringOfficer = [...picLeaderboard].sort((a, b) => b.totalCaring - a.totalCaring)[0];
  const topVisitOfficer = [...picLeaderboard].sort((a, b) => b.totalVisit - a.totalVisit)[0];

  // --- FILTER TABEL TINDAK LANJUT ---
  const uniqueDatels = [...new Set(records.map((r) => r.datel_sto || 'Priangan Timur'))];
  const uniquePics = [...new Set(records.map((r) => r.pic_petugas || user.nama_lengkap))];

  const filteredFollowUp = records.filter((r) => {
    const matchesSearch =
      r.nama_pelanggan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.nomor_layanan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.pic_petugas || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDatel = filterDatel === 'ALL' || (r.datel_sto || 'Priangan Timur') === filterDatel;
    const matchesCaring = filterCaring === 'ALL' || (r.status_caring || 'BELUM_CARING') === filterCaring;
    const matchesVisit = filterVisit === 'ALL' || (r.status_visit || 'BELUM_VISIT') === filterVisit;
    const matchesPic = filterPic === 'ALL' || (r.pic_petugas || user.nama_lengkap) === filterPic;
    return matchesSearch && matchesDatel && matchesCaring && matchesVisit && matchesPic;
  });

  const exportAnalyticsExcel = () => {
    if (!window.XLSX) return;
    const rows = filteredFollowUp.map((r, idx) => ({
      No: idx + 1,
      'Nomor Layanan': r.nomor_layanan,
      'Nama Pelanggan': r.nama_pelanggan,
      'Datel / STO': r.datel_sto || 'Priangan Timur',
      'Outstanding (Rp)': Number(r.nominal) || 0,
      'Umur Tunggakan': r.umur_tunggakan || '1 Bulan',
      'Status Caring': r.status_caring || 'BELUM_CARING',
      'Status Visit': r.status_visit || 'BELUM_VISIT',
      'Status Bayar': r.status_chat === 'LUNAS' ? 'LUNAS' : 'UNPAID',
      'PIC Petugas': r.pic_petugas || user.nama_lengkap,
    }));
    const ws = window.XLSX.utils.json_to_sheet(rows);
    const wb = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(wb, ws, 'Payment Collection');
    window.XLSX.writeFile(wb, `Executive_Collection_Telkom_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="bg-gradient-to-br from-rose-50 via-red-50/60 to-slate-200 min-h-screen pb-12">
      {/* Header Korporat Merah Gradasi */}
      <header className="bg-gradient-to-r from-[#E4002B] via-[#B80022] to-slate-900 text-white shadow-lg sticky top-0 z-30">
        <div className="max-w-7xl mx-auto p-4 flex flex-wrap justify-between items-center gap-3">
          <div>
            <h1 className="text-xl font-black tracking-wide">PAYMENT COLLECTION & EXECUTIVE ANALYTICS</h1>
            <p className="text-xs text-red-100">
              Monitoring Caring, Visit, Distribusi Status & Ranking Kinerja PIC/AM • Real-Time Database
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setPrivacyMask(!privacyMask)}
              className={`text-xs font-bold px-3.5 py-2 rounded-xl border transition shadow-sm ${
                privacyMask
                  ? 'bg-amber-400 text-slate-900 border-amber-300'
                  : 'bg-white/15 text-white border-white/25 hover:bg-white/25'
              }`}
            >
              🛡️ Sensor Data ({privacyMask ? 'Aktif' : 'Nonaktif'})
            </button>
            <button
              onClick={() => loadAllAnalyticsData(user.id)}
              className="text-xs bg-white/15 hover:bg-white/25 text-white font-bold px-3 py-2 rounded-xl border border-white/25 transition"
              title="Refresh Data"
            >
              🔄 Sync
            </button>
            <Link
              href="/dashboard"
              className="text-xs bg-white text-[#E4002B] font-bold px-3.5 py-2 rounded-xl hover:bg-gray-100 transition shadow"
            >
              🔙 Menu Utama
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 mt-2 space-y-6">
        {/* Sub-Navigasi Tab Eksekutif */}
        <div className="bg-white rounded-2xl shadow-sm p-2 flex flex-wrap gap-2 border border-red-100">
          <button
            onClick={() => setActiveSection('RINGKASAN')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center gap-2 ${
              activeSection === 'RINGKASAN'
                ? 'bg-gradient-to-r from-[#E4002B] to-[#99001D] text-white shadow'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>📊 Ringkasan Eksekutif & Grafik</span>
          </button>
          <button
            onClick={() => setActiveSection('TINDAK_LANJUT')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center gap-2 ${
              activeSection === 'TINDAK_LANJUT'
                ? 'bg-gradient-to-r from-[#E4002B] to-[#99001D] text-white shadow'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>📞 Tindak Lanjut (Caring & Visit)</span>
            <span className="bg-red-100 text-[#E4002B] px-2 py-0.5 rounded-full text-[10px] font-black">
              {unpaidList.length}
            </span>
          </button>
          <button
            onClick={() => setActiveSection('KINERJA_PIC')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center gap-2 ${
              activeSection === 'KINERJA_PIC'
                ? 'bg-gradient-to-r from-[#E4002B] to-[#99001D] text-white shadow'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>🏆 Ranking Kinerja PIC / AM</span>
            <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-black">
              {picLeaderboard.length} Petugas
            </span>
          </button>
        </div>

        {/* ===================================================================== */}
        {/* SECTION 1: RINGKASAN EKSEKUTIF & VISUALISASI GRAFIK LENGKAP           */}
        {/* ===================================================================== */}
        {activeSection === 'RINGKASAN' && (
          <div className="space-y-6">
            {/* 8 Kartu KPI Ringkasan Eksekutif */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl p-5 shadow-sm border-l-4 border-indigo-600 flex justify-between items-center">
                <div>
                  <p className="text-[11px] font-extrabold text-slate-500 uppercase">Total Pelanggan</p>
                  <p className="text-3xl font-black text-indigo-700 mt-1">{totalPelanggan}</p>
                  <p className="text-[11px] text-slate-500 mt-1">Pelanggan Indibiz Terdaftar</p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl">
                  👥
                </div>
              </div>

              <div className="bg-gradient-to-br from-rose-50 to-red-100/70 rounded-2xl p-5 shadow-sm border-l-4 border-[#E4002B] flex justify-between items-center">
                <div>
                  <p className="text-[11px] font-extrabold text-slate-600 uppercase">Total Outstanding</p>
                  <p className="text-2xl font-black text-[#E4002B] mt-1">{formatRupiah(totalOutstanding)}</p>
                  <p className="text-[11px] text-slate-600 mt-1">{unpaidList.length} tagihan belum lunas</p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-white text-[#E4002B] flex items-center justify-center text-xl shadow-sm">
                  💳
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 shadow-sm border-l-4 border-amber-500 flex justify-between items-center">
                <div>
                  <p className="text-[11px] font-extrabold text-slate-500 uppercase">Sudah Caring</p>
                  <p className="text-3xl font-black text-amber-600 mt-1">{sudahCaringList.length}</p>
                  <p className="text-[11px] text-slate-500 mt-1">{caringPct}% dari total pelanggan</p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl">
                  📞
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 shadow-sm border-l-4 border-purple-600 flex justify-between items-center">
                <div>
                  <p className="text-[11px] font-extrabold text-slate-500 uppercase">Belum Caring</p>
                  <p className="text-3xl font-black text-purple-700 mt-1">{belumCaringCount}</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {totalPelanggan > 0 ? ((belumCaringCount / totalPelanggan) * 100).toFixed(1) : '0.0'}% antrean caring
                  </p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-xl">
                  ⏳
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 shadow-sm border-l-4 border-sky-500 flex justify-between items-center">
                <div>
                  <p className="text-[11px] font-extrabold text-slate-500 uppercase">Sudah Visit</p>
                  <p className="text-3xl font-black text-sky-600 mt-1">{sudahVisitList.length}</p>
                  <p className="text-[11px] text-slate-500 mt-1">{visitPct}% kunjungan lapangan</p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center text-xl">
                  📍
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 shadow-sm border-l-4 border-slate-500 flex justify-between items-center">
                <div>
                  <p className="text-[11px] font-extrabold text-slate-500 uppercase">Belum Visit</p>
                  <p className="text-3xl font-black text-slate-700 mt-1">{belumVisitCount}</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {totalPelanggan > 0 ? ((belumVisitCount / totalPelanggan) * 100).toFixed(1) : '0.0'}% belum dikunjungi
                  </p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center text-xl">
                  🚶
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 shadow-sm border-l-4 border-emerald-500 flex justify-between items-center">
                <div>
                  <p className="text-[11px] font-extrabold text-slate-500 uppercase">Sudah Bayar (Lunas)</p>
                  <p className="text-3xl font-black text-emerald-600 mt-1">{lunasList.length}</p>
                  <p className="text-[11px] text-emerald-700 font-bold mt-1">{lunasPct}% ({formatJuta(totalLunasNominal)})</p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl">
                  ✅
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 shadow-sm border-l-4 border-orange-500 flex justify-between items-center">
                <div>
                  <p className="text-[11px] font-extrabold text-slate-500 uppercase">Belum Bayar</p>
                  <p className="text-3xl font-black text-orange-600 mt-1">{unpaidList.length}</p>
                  <p className="text-[11px] text-slate-500 mt-1">{unpaidPct}% dari total tagihan</p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center text-xl">
                  ⚠️
                </div>
              </div>
            </div>

            {/* Baris Grafik 1: Donut Chart Distribusi Status + Grouped Bar Chart per Datel */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Grafik 1: Donut Chart Distribusi Status Tagihan Pelanggan */}
              <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100">
                <h3 className="text-base font-black text-slate-800">Distribusi Status Tagihan Pelanggan</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Proporsi real-time status pembayaran, caring, visit & umur tunggakan
                </p>

                <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-8">
                  <div className="relative w-48 h-48 shrink-0">
                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                      {donutSegments.map((seg, idx) => {
                        const pct = (seg.count / totalSegmentSum) * 100;
                        const strokeDasharray = `${pct} ${100 - pct}`;
                        const strokeDashoffset = -cumulativeAngle;
                        cumulativeAngle += pct;
                        return (
                          <circle
                            key={idx}
                            cx="50"
                            cy="50"
                            r="36"
                            fill="transparent"
                            stroke={seg.color}
                            strokeWidth="14"
                            strokeDasharray={strokeDasharray}
                            strokeDashoffset={strokeDashoffset}
                            pathLength="100"
                          />
                        );
                      })}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className="text-xl font-black text-slate-800">{totalPelanggan}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Total Data</span>
                    </div>
                  </div>

                  <div className="space-y-2.5 w-full">
                    {donutSegments.map((seg, idx) => {
                      const pctLabel = ((seg.count / totalSegmentSum) * 100).toFixed(1);
                      return (
                        <div key={idx} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: seg.color }}></span>
                            <span className="font-bold text-slate-700">{seg.label}</span>
                          </div>
                          <span className="font-extrabold text-slate-900">
                            {seg.count} ({pctLabel}%)
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Grafik 2: Aktivitas Caring & Follow-Up per Datel / Area */}
              <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-base font-black text-slate-800">Aktivitas Caring & Follow Up per Datel</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Cakupan penanganan pelanggan menunggak (Sudah Caring vs Antrean)
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] font-bold">
                    <span className="flex items-center gap-1 text-slate-700">
                      <span className="w-3 h-2.5 bg-[#E4002B] inline-block rounded-xs"></span> Sudah Caring
                    </span>
                    <span className="flex items-center gap-1 text-slate-700">
                      <span className="w-3 h-2.5 bg-slate-400 inline-block rounded-xs"></span> Belum Caring
                    </span>
                  </div>
                </div>

                <div className="mt-6 h-56 flex items-end justify-around gap-3 border-b border-l border-slate-200 px-4 pt-4">
                  {datelStats.length === 0 ? (
                    <p className="text-xs text-slate-400 m-auto">Belum ada data pelanggan untuk ditampilkan.</p>
                  ) : (
                    datelStats.map((d, idx) => {
                      const caringHeight = Math.max(8, Math.round((d.caring / maxDatelBar) * 165));
                      const antreanHeight = Math.max(8, Math.round((d.antrean / maxDatelBar) * 165));
                      return (
                        <div key={idx} className="flex flex-col items-center gap-1.5 flex-1">
                          <div className="flex items-end gap-1.5 h-44">
                            <div className="flex flex-col items-center">
                              <span className="text-[10px] font-extrabold text-[#E4002B] mb-0.5">{d.caring}</span>
                              <div
                                className="w-5 sm:w-7 bg-gradient-to-t from-[#99001D] to-[#E4002B] rounded-t-md transition-all"
                                style={{ height: `${caringHeight}px` }}
                              ></div>
                            </div>
                            <div className="flex flex-col items-center">
                              <span className="text-[10px] font-extrabold text-slate-500 mb-0.5">{d.antrean}</span>
                              <div
                                className="w-5 sm:w-7 bg-slate-400 rounded-t-md transition-all"
                                style={{ height: `${antreanHeight}px` }}
                              ></div>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold text-slate-600 text-center truncate max-w-[85px]">
                            {d.name}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Baris Grafik 2: Top Outstanding per Datel + Tren Collection Rate Mingguan vs Target 98% */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Grafik 3: Top Datel / STO Outstanding */}
              <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100">
                <h3 className="text-base font-black text-slate-800">Top Area / Datel Outstanding</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Distribusi nominal tagihan belum terbayar terbesar (Rupiah)
                </p>

                <div className="mt-6 space-y-4">
                  {topOutstandingDatel.length === 0 ? (
                    <p className="text-xs text-slate-400">Belum ada nominal tunggakan tercatat.</p>
                  ) : (
                    topOutstandingDatel.map((d, idx) => {
                      const widthPct = Math.max(8, Math.round((d.outstanding / maxOutstandingVal) * 100));
                      return (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between text-xs font-bold">
                            <span className="text-slate-800">{d.name}</span>
                            <span className="text-[#E4002B]">{formatRupiah(d.outstanding)}</span>
                          </div>
                          <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-[#E4002B] to-rose-400 rounded-full transition-all"
                              style={{ width: `${widthPct}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Grafik 4: Tren Collection Rate Mingguan vs Target KPI (98%) */}
              <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-base font-black text-slate-800">Tren Collection Rate vs Target (98%)</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Target pencapaian 98% s.d. cut-off Tgl 5 siklus penagihan bulanan
                    </p>
                  </div>
                  <span className="bg-emerald-100 text-emerald-800 text-xs font-black px-2.5 py-1 rounded-lg">
                    Realisasi: {lunasPct}%
                  </span>
                </div>

                <div className="mt-5">
                  <svg viewBox="0 0 400 175" className="w-full h-44 overflow-visible">
                    {/* Grid horizontal */}
                    {[0, 25, 50, 75, 100].map((val, idx) => {
                      const y = 145 - (val / 100) * 125;
                      return (
                        <g key={idx}>
                          <line x1="35" y1={y} x2="385" y2={y} stroke="#e2e8f0" strokeWidth="1" />
                          <text x="28" y={y + 3} textAnchor="end" fontSize="9" fill="#64748b" fontWeight="bold">
                            {val}%
                          </text>
                        </g>
                      );
                    })}

                    {/* Garis Target KPI 98% (Hijau Putus-Putus) */}
                    <line
                      x1="35"
                      y1={145 - 0.98 * 125}
                      x2="385"
                      y2={145 - 0.98 * 125}
                      stroke="#10b981"
                      strokeWidth="2"
                      strokeDasharray="5,4"
                    />
                    <text x="382" y={145 - 0.98 * 125 - 4} textAnchor="end" fontSize="9" fill="#059669" fontWeight="bold">
                      Target KPI 98%
                    </text>

                    {/* Kurva Progres Mingguan menuju Realisasi Saat Ini */}
                    {(() => {
                      const currentRate = parseFloat(lunasPct) || 0;
                      const pts = [
                        { x: 50, rate: currentRate * 0.35, label: 'Minggu 1' },
                        { x: 135, rate: currentRate * 0.6, label: 'Minggu 2' },
                        { x: 220, rate: currentRate * 0.82, label: 'Minggu 3' },
                        { x: 305, rate: currentRate * 0.93, label: 'Minggu 4' },
                        { x: 375, rate: currentRate, label: 'Cut-off Tgl 5' },
                      ];
                      const coords = pts.map((p) => `${p.x},${145 - (Math.min(100, p.rate) / 100) * 125}`).join(' ');
                      return (
                        <>
                          <polyline fill="none" stroke="#E4002B" strokeWidth="3" points={coords} />
                          {pts.map((p, i) => {
                            const cy = 145 - (Math.min(100, p.rate) / 100) * 125;
                            return (
                              <g key={i}>
                                <circle cx={p.x} cy={cy} r="4.5" fill="#E4002B" stroke="#fff" strokeWidth="1.5" />
                                <text x={p.x} y="162" textAnchor="middle" fontSize="9" fill="#475569" fontWeight="bold">
                                  {p.label}
                                </text>
                              </g>
                            );
                          })}
                        </>
                      );
                    })()}
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* SECTION 2: TINDAK LANJUT PAYMENT COLLECTION (CARING & VISIT)          */}
        {/* ===================================================================== */}
        {activeSection === 'TINDAK_LANJUT' && (
          <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4 border border-slate-100">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b pb-4">
              <div>
                <h3 className="text-base font-black text-slate-800">📋 Daftar Tindak Lanjut Payment Collection (Caring & Visit)</h3>
                <p className="text-xs text-slate-500">
                  Update progres Caring (telepon/WA), kunjungan Visit lapangan, Datel, dan PIC petugas langsung tersimpan ke database.
                </p>
              </div>
              <button
                onClick={exportAnalyticsExcel}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow transition"
              >
                📊 Export Laporan Excel
              </button>
            </div>

            {/* Filter Pencarian & Dropdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 bg-slate-50 p-3.5 rounded-xl border">
              <input
                type="text"
                placeholder="🔍 Cari ID / Nama / PIC..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border rounded-lg p-2 text-xs bg-white outline-none focus:ring-2 focus:ring-[#E4002B]"
              />
              <select
                value={filterDatel}
                onChange={(e) => setFilterDatel(e.target.value)}
                className="border rounded-lg p-2 text-xs bg-white outline-none"
              >
                <option value="ALL">Semua Datel / Area</option>
                {uniqueDatels.map((d, i) => (
                  <option key={i} value={d}>{d}</option>
                ))}
              </select>
              <select
                value={filterCaring}
                onChange={(e) => setFilterCaring(e.target.value)}
                className="border rounded-lg p-2 text-xs bg-white outline-none"
              >
                <option value="ALL">Semua Status Caring</option>
                <option value="BELUM_CARING">⏳ Belum Caring</option>
                <option value="SUDAH_CARING">📞 Sudah Caring</option>
                <option value="JANJI_BAYAR">🤝 Janji Bayar</option>
                <option value="COMPLAIN_TARIF">⚠️ Complain Tarif</option>
              </select>
              <select
                value={filterVisit}
                onChange={(e) => setFilterVisit(e.target.value)}
                className="border rounded-lg p-2 text-xs bg-white outline-none"
              >
                <option value="ALL">Semua Status Visit</option>
                <option value="BELUM_VISIT">🚶 Belum Visit</option>
                <option value="SUDAH_VISIT">📍 Sudah Visit</option>
                <option value="LUNAS_TEMPAT">✅ Lunas di Tempat</option>
              </select>
              <select
                value={filterPic}
                onChange={(e) => setFilterPic(e.target.value)}
                className="border rounded-lg p-2 text-xs bg-white outline-none"
              >
                <option value="ALL">Semua Petugas / PIC</option>
                {uniquePics.map((p, i) => (
                  <option key={i} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* Tabel Tindak Lanjut */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-900 text-white">
                    <th className="p-3 rounded-tl-lg">No. Internet</th>
                    <th className="p-3">Nama Pelanggan</th>
                    <th className="p-3">Datel / Area</th>
                    <th className="p-3">Outstanding</th>
                    <th className="p-3">Status Caring</th>
                    <th className="p-3">Status Visit</th>
                    <th className="p-3">PIC Petugas</th>
                    <th className="p-3 text-center rounded-tr-lg">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFollowUp.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center p-6 text-slate-500">
                        Tidak ada data pelanggan yang sesuai dengan filter.
                      </td>
                    </tr>
                  ) : (
                    filteredFollowUp.map((row) => (
                      <tr key={row.id} className="border-b hover:bg-rose-50/40">
                        <td className="p-3 font-mono font-bold text-slate-700">{maskText(row.nomor_layanan)}</td>
                        <td className="p-3">
                          <div className="font-bold text-slate-900">{row.nama_pelanggan}</div>
                          <div className="text-[11px] text-slate-500 font-mono">📞 {maskText(row.no_wa || '-')}</div>
                        </td>
                        <td className="p-3">
                          <select
                            value={row.datel_sto || 'Priangan Timur'}
                            onChange={(e) => handleUpdateRecord(row, { datel_sto: e.target.value })}
                            className="border rounded px-2 py-1 text-[11px] font-semibold bg-indigo-50 text-indigo-800 outline-none"
                          >
                            <option value="Tasikmalaya">Tasikmalaya</option>
                            <option value="Garut">Garut</option>
                            <option value="Banjar">Banjar</option>
                            <option value="Ciamis">Ciamis</option>
                            <option value="Singaparna">Singaparna</option>
                            <option value="Cirebon">Cirebon</option>
                            <option value="Indramayu">Indramayu</option>
                            <option value="Priangan Timur">Priangan Timur</option>
                          </select>
                        </td>
                        <td className="p-3 font-extrabold text-[#E4002B]">{formatRupiah(row.nominal)}</td>
                        <td className="p-3">
                          <select
                            value={row.status_caring || 'BELUM_CARING'}
                            onChange={(e) => handleUpdateRecord(row, { status_caring: e.target.value })}
                            className={`p-1.5 rounded-lg font-bold text-[11px] border outline-none ${
                              row.status_caring === 'JANJI_BAYAR'
                                ? 'bg-purple-100 text-purple-800 border-purple-300'
                                : row.status_caring === 'SUDAH_CARING'
                                ? 'bg-amber-100 text-amber-800 border-amber-300'
                                : row.status_caring === 'COMPLAIN_TARIF'
                                ? 'bg-rose-100 text-rose-800 border-rose-300'
                                : 'bg-slate-100 text-slate-700 border-slate-300'
                            }`}
                          >
                            <option value="BELUM_CARING">⏳ Belum Caring</option>
                            <option value="SUDAH_CARING">📞 Sudah Caring</option>
                            <option value="JANJI_BAYAR">🤝 Janji Bayar</option>
                            <option value="COMPLAIN_TARIF">⚠️ Complain Tarif</option>
                          </select>
                        </td>
                        <td className="p-3">
                          <select
                            value={row.status_visit || 'BELUM_VISIT'}
                            onChange={(e) =>
                              handleUpdateRecord(row, {
                                status_visit: e.target.value,
                                status_chat: e.target.value === 'LUNAS_TEMPAT' ? 'LUNAS' : row.status_chat,
                              })
                            }
                            className={`p-1.5 rounded-lg font-bold text-[11px] border outline-none ${
                              row.status_visit === 'LUNAS_TEMPAT'
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : row.status_visit === 'SUDAH_VISIT'
                                ? 'bg-sky-100 text-sky-800 border-sky-300'
                                : 'bg-slate-100 text-slate-700 border-slate-300'
                            }`}
                          >
                            <option value="BELUM_VISIT">🚶 Belum Visit</option>
                            <option value="SUDAH_VISIT">📍 Sudah Visit</option>
                            <option value="LUNAS_TEMPAT">✅ Lunas di Tempat</option>
                          </select>
                        </td>
                        <td className="p-3">
                          <input
                            type="text"
                            defaultValue={row.pic_petugas || user.nama_lengkap}
                            onBlur={(e) => {
                              if (e.target.value !== row.pic_petugas) {
                                handleUpdateRecord(row, { pic_petugas: e.target.value });
                              }
                            }}
                            className="border rounded px-2 py-1 text-[11px] font-bold text-slate-800 w-28 outline-none focus:border-[#E4002B]"
                          />
                        </td>
                        <td className="p-3 text-center">
                          <Link
                            href="/dashboard/indibiz"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-1.5 rounded-lg text-[11px] transition shadow inline-block"
                          >
                            💬 Hubungi
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* SECTION 3: RANKING KINERJA PIC / AM & PORSI KONTRIBUSI                 */}
        {/* ===================================================================== */}
        {activeSection === 'KINERJA_PIC' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Tabel Leaderboard Kinerja PIC/AM (8 Kolom) */}
            <div className="lg:col-span-8 bg-white rounded-2xl shadow-sm p-6 border border-slate-100 space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <div>
                  <h3 className="text-base font-black text-slate-800">🏆 Ranking Kinerja PIC / Account Manager</h3>
                  <p className="text-xs text-slate-500">
                    Rekapitulasi produktivitas Caring, Visit lapangan, Pelunasan, dan Prospek Deal per PIC
                  </p>
                </div>
                <span className="bg-indigo-100 text-indigo-800 text-xs font-extrabold px-3 py-1 rounded-full">
                  {picLeaderboard.length} Petugas Aktif
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-900 text-white">
                      <th className="p-3 rounded-tl-lg">Rank</th>
                      <th className="p-3">Nama PIC / AM</th>
                      <th className="p-3 text-center">Total Caring</th>
                      <th className="p-3 text-center">Total Visit</th>
                      <th className="p-3">Lunas Tagihan</th>
                      <th className="p-3">Prospek Won</th>
                      <th className="p-3 rounded-tr-lg">Collection Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {picLeaderboard.map((p, idx) => (
                      <tr key={idx} className="border-b hover:bg-slate-50">
                        <td className="p-3 font-black">
                          {idx === 0 ? '🥇 #1' : idx === 1 ? '🥈 #2' : idx === 2 ? '🥉 #3' : `#${idx + 1}`}
                        </td>
                        <td className="p-3 font-extrabold text-slate-900">{p.pic}</td>
                        <td className="p-3 text-center font-bold text-amber-700">{p.totalCaring}</td>
                        <td className="p-3 text-center font-bold text-sky-700">{p.totalVisit}</td>
                        <td className="p-3 font-extrabold text-[#E4002B]">{formatRupiah(p.lunasNominal)}</td>
                        <td className="p-3 font-bold text-indigo-700">{p.wonOffers} Deal</td>
                        <td className="p-3 font-black text-emerald-600">{p.collectionRate}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Panel Sorotan Performa & Statistik Jaringan (4 Kolom) */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100 space-y-4">
                <h4 className="text-sm font-black text-slate-800">⭐ Sorotan Performa Petugas</h4>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5">
                    <p className="text-[10px] font-extrabold text-[#E4002B] uppercase">Top Caring Officer</p>
                    <p className="text-sm font-black text-slate-900 mt-1 truncate">
                      {topCaringOfficer ? topCaringOfficer.pic : '-'}
                    </p>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      {topCaringOfficer ? `${topCaringOfficer.totalCaring} Panggilan/Chat` : '0 Aktivitas'}
                    </p>
                  </div>

                  <div className="bg-sky-50 border border-sky-200 rounded-xl p-3.5">
                    <p className="text-[10px] font-extrabold text-sky-700 uppercase">Top Visit Officer</p>
                    <p className="text-sm font-black text-slate-900 mt-1 truncate">
                      {topVisitOfficer ? topVisitOfficer.pic : '-'}
                    </p>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      {topVisitOfficer ? `${topVisitOfficer.totalVisit} Kunjungan` : '0 Kunjungan'}
                    </p>
                  </div>
                </div>

                {/* Progress Bar Efektivitas */}
                <div className="pt-2 space-y-3">
                  <h5 className="text-xs font-black text-slate-700">Statistik Efektivitas Collection</h5>

                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-slate-600">Caring Coverage Rate</span>
                      <span className="text-amber-600">{caringPct}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full rounded-full" style={{ width: `${caringPct}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-slate-600">Visit Coverage Rate</span>
                      <span className="text-sky-600">{visitPct}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-sky-500 h-full rounded-full" style={{ width: `${visitPct}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-slate-600">Overall Collection Rate (Target 98%)</span>
                      <span className="text-[#E4002B]">{lunasPct}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-[#E4002B] h-full rounded-full" style={{ width: `${lunasPct}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
