'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { parseTelkomWorkbook } from '../../../lib/telkomExcelParser';
import { uploadItemsInChunks } from '../../../lib/chunkedSync';

export default function ExecutiveCollectionPage() {
  const [user, setUser] = useState(null);
  
  // State Data (Server-Side)
  const [summaryData, setSummaryData] = useState(null);
  const [followUpData, setFollowUpData] = useState([]);
  const [followUpTotal, setFollowUpTotal] = useState(0);
  const [piutangRecords, setPiutangRecords] = useState([]);
  const [penawaranRecords, setPenawaranRecords] = useState([]);

  // Navigasi & Filter
  const [activeSection, setActiveSection] = useState('RINGKASAN');
  const [privacyMask, setPrivacyMask] = useState(false);
  const [syncProgress, setSyncProgress] = useState('');
  
  // Filter Tindak Lanjut
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDatel, setFilterDatel] = useState('ALL');
  const [filterCaring, setFilterCaring] = useState('ALL');
  const [filterVisit, setFilterVisit] = useState('ALL');
  const [filterPic, setFilterPic] = useState('ALL');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const router = useRouter();

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (!savedUser) {
      router.push('/login');
    } else {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      loadAllData(parsedUser.id);
    }

    const scriptXlsx = document.createElement('script');
    scriptXlsx.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
    document.body.appendChild(scriptXlsx);
  }, []);

  const loadAllData = async (userId) => {
    try {
      const [resSummary, resPiutang, resPenawaran] = await Promise.all([
        fetch(`/api/indibiz?userId=${userId}&mode=summary`),
        fetch(`/api/piutang?userId=${userId}`),
        fetch(`/api/penawaran?userId=${userId}`),
      ]);
      if (resSummary.ok) setSummaryData(await resSummary.json());
      if (resPiutang.ok) setPiutangRecords((await resPiutang.json()).data || []);
      if (resPenawaran.ok) setPenawaranRecords((await resPenawaran.json()).data || []);
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch Tabel (Triggers saat filter berubah)
  useEffect(() => {
    if (user && activeSection === 'TINDAK_LANJUT') {
      fetchFollowUpData(1);
    }
  }, [user, activeSection, searchTerm, filterDatel, filterCaring, filterVisit, filterPic]);

  const fetchFollowUpData = async (page) => {
    if (!user) return;
    setCurrentPage(page);
    try {
      const query = new URLSearchParams({
        userId: user.id,
        mode: 'table',
        page: String(page),
        limit: String(itemsPerPage),
        search: searchTerm,
        datel: filterDatel,
        caring: filterCaring,
        visit: filterVisit,
        pic: filterPic
      });
      const res = await fetch(`/api/indibiz?${query.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setFollowUpData(json.data || []);
        setFollowUpTotal(json.total || 0);
      }
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
        alamat: updatedItem.alamat || '',
        produk: updatedItem.produk || 'Indibiz / Wireline',
      }),
    });
    if (res.ok) {
      // Refresh data tabel dan ringkasan karena ada perubahan
      fetchFollowUpData(currentPage);
      loadAllData(user.id);
    }
  };

  const handleMasterBulkImport = (e) => {
    const file = e.target.files[0];
    if (!file || !window.XLSX) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const bstr = evt.target.result;
      const wb = window.XLSX.read(bstr, { type: 'binary' });
      
      // Untuk sementara, kita fokus ke format standar 44 kolom Telkom
      const itemsToSync = parseTelkomWorkbook(window.XLSX, wb, user.nama_lengkap, 'Tagihan Berjalan');

      if (itemsToSync.length === 0) {
        alert('⚠️ Tidak ada baris SND / pelanggan valid yang terbaca dari file.');
        e.target.value = '';
        return;
      }

      try {
        setSyncProgress(`Memulai sinkronisasi 0 / ${itemsToSync.length} baris...`);
        await uploadItemsInChunks({
          userId: user.id,
          items: itemsToSync,
          upsert: true,
          chunkSize: 200,
          onProgress: (done, total) => setSyncProgress(`Menyinkronkan ${done} / ${total} data SND...`),
        });
        setSyncProgress('');
        alert(`🚀 Berhasil menyinkronkan ${itemsToSync.length} data SND!`);
        loadAllData(user.id);
      } catch (err) {
        setSyncProgress('');
        alert('❌ ' + err.message);
      }
      e.target.value = '';
    };
    reader.readAsBinaryString(file);
  };

  const exportFullPortalBackup = () => {
    if (!window.XLSX) return;
    const wb = window.XLSX.utils.book_new();

    // Data Piutang & Penawaran masih diambil penuh (karena biasanya tidak sebanyak Indibiz)
    const sheetCollection = piutangRecords.map((p, i) => ({
      No: i + 1, 'Nama Pelanggan': p.nama_pelanggan, 'Kategori': p.kategori || '-',
      'Nominal (Rp)': Number(p.nominal) || 0, 'Status Pembayaran': p.status_pembayaran || 'UNPAID', 'PIC / AM': p.pic_am || '-',
    }));

    const sheetPenawaran = penawaranRecords.map((o, i) => ({
      No: i + 1, 'Nama Pelanggan': o.nama_pelanggan, 'Layanan / Proyek': o.nama_layanan || '-',
      'Aging (Hari)': o.aging_hari || 0, 'Status Prospek': o.status_prospek || 'IN_PROGRESS', 'PIC / AM': o.pic_am || '-',
    }));

    // Untuk backup Indibiz, karena di-paginate, kita beri catatan agar export penuh dilakukan via Neon
    const sheetIndibiz = [{ Info: 'Data Indibiz terlalu besar untuk diexport via browser. Silakan gunakan fitur Export Excel di tab Tindak Lanjut untuk data terfilter.' }];

    window.XLSX.utils.book_append_sheet(wb, window.XLSX.utils.json_to_sheet(sheetIndibiz), '1_Indibiz_Info');
    window.XLSX.utils.book_append_sheet(wb, window.XLSX.utils.json_to_sheet(sheetCollection), '2_Piutang_&_Bukpot');
    window.XLSX.utils.book_append_sheet(wb, window.XLSX.utils.json_to_sheet(sheetPenawaran), '3_Prospek_Penawaran');

    window.XLSX.writeFile(wb, `Full_Sync_Telkom_EBS_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const exportAnalyticsExcel = () => {
    if (!window.XLSX) return;
    const rows = followUpData.map((r, idx) => ({
      No: idx + 1, 'Nomor Layanan': r.nomor_layanan, 'Nama Pelanggan': r.nama_pelanggan,
      'Datel / STO': r.datel_sto || 'Priangan Timur', 'Outstanding (Rp)': Number(r.nominal) || 0,
      'Umur Tunggakan': r.umur_tunggakan || '1 Bulan', 'Status Caring': r.status_caring || 'BELUM_CARING',
      'Status Visit': r.status_visit || 'BELUM_VISIT', 'Status Bayar': r.status_chat === 'LUNAS' ? 'LUNAS' : 'UNPAID',
      'PIC Petugas': r.pic_petugas || user.nama_lengkap,
    }));
    const ws = window.XLSX.utils.json_to_sheet(rows);
    const wb = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(wb, ws, 'Payment Collection');
    window.XLSX.writeFile(wb, `Executive_Collection_Page${currentPage}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

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

  // Ekstrak Data Summary (dari API)
  const totalPelanggan = summaryData?.summary?.total || 0;
  const lunasCount = summaryData?.summary?.lunas || 0;
  const unpaidCount = summaryData?.summary?.unpaid || 0;
  const totalOutstanding = summaryData?.summary?.total_outstanding || 0;
  const totalLunasNominal = summaryData?.summary?.total_lunas_nominal || 0;
  const sudahCaringCount = summaryData?.summary?.sudah_caring || 0;
  const belumCaringCount = Math.max(0, totalPelanggan - sudahCaringCount);
  const sudahVisitCount = summaryData?.summary?.sudah_visit || 0;
  const belumVisitCount = Math.max(0, totalPelanggan - sudahVisitCount);

  const caringPct = totalPelanggan > 0 ? ((sudahCaringCount / totalPelanggan) * 100).toFixed(1) : '0.0';
  const visitPct = totalPelanggan > 0 ? ((sudahVisitCount / totalPelanggan) * 100).toFixed(1) : '0.0';
  const lunasPct = totalPelanggan > 0 ? ((lunasCount / totalPelanggan) * 100).toFixed(1) : '0.0';
  const unpaidPct = totalPelanggan > 0 ? ((unpaidCount / totalPelanggan) * 100).toFixed(1) : '0.0';

  const datelStats = (summaryData?.datelStats || []).map(d => ({
    name: d.datel_sto || 'Priangan Timur',
    caring: Number(d.caring) || 0,
    antrean: Number(d.antrean) || 0,
    outstanding: Number(d.outstanding) || 0
  }));

  const maxDatelBar = Math.max(1, ...datelStats.map((d) => Math.max(d.caring, d.antrean)));
  const topOutstandingDatel = [...datelStats].sort((a, b) => b.outstanding - a.outstanding).slice(0, 5);
  const maxOutstandingVal = Math.max(1, ...topOutstandingDatel.map((d) => d.outstanding));

  const donutSegments = [
    { label: 'Sudah Bayar (Lunas)', count: lunasCount, color: '#10b981' },
    { label: 'Sudah Caring', count: sudahCaringCount, color: '#f59e0b' },
    { label: 'Belum Caring (Antrean)', count: belumCaringCount, color: '#E4002B' },
    { label: 'Sudah Visit', count: sudahVisitCount, color: '#3b82f6' },
  ];
  const totalSegmentSum = donutSegments.reduce((s, d) => s + d.count, 0) || 1;
  let cumulativeAngle = 0;

  // Placeholder untuk Leaderboard (Akan dibuatkan API khusus nanti)
  const picLeaderboard = [];
  const topCaringOfficer = null;
  const topVisitOfficer = null;

  const uniqueDatels = [...new Set(datelStats.map(d => d.name))];
  const uniquePics = [...new Set(followUpData.map(r => r.pic_petugas || user.nama_lengkap))]; // Hanya dari 50 data teratas

  const totalPages = Math.ceil(followUpTotal / itemsPerPage);

  return (
    <div className="bg-gradient-to-br from-rose-50 via-red-50/60 to-slate-200 min-h-screen pb-12">
      <header className="bg-gradient-to-r from-[#E4002B] via-[#B80022] to-slate-900 text-white shadow-lg sticky top-0 z-30">
        <div className="max-w-7xl mx-auto p-4 flex flex-wrap justify-between items-center gap-3">
          <div>
            <h1 className="text-xl font-black tracking-wide">PAYMENT COLLECTION & EXECUTIVE ANALYTICS</h1>
            <p className="text-xs text-red-100">Monitoring Caring, Visit, Distribusi Status & Ranking Kinerja PIC/AM • Real-Time</p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <button onClick={() => setPrivacyMask(!privacyMask)} className={`text-xs font-bold px-3.5 py-2 rounded-xl border transition shadow-sm ${privacyMask ? 'bg-amber-400 text-slate-900 border-amber-300' : 'bg-white/15 text-white border-white/25 hover:bg-white/25'}`}>
              🛡️ Sensor Data ({privacyMask ? 'Aktif' : 'Nonaktif'})
            </button>
            <button onClick={() => { loadAllData(user.id); if(activeSection === 'TINDAK_LANJUT') fetchFollowUpData(currentPage); }} className="text-xs bg-white/15 hover:bg-white/25 text-white font-bold px-3 py-2 rounded-xl border border-white/25 transition">
              🔄 Sync
            </button>
            <Link href="/dashboard" className="text-xs bg-white text-[#E4002B] font-bold px-3.5 py-2 rounded-xl hover:bg-gray-100 transition shadow">🔙 Menu Utama</Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 mt-2 space-y-6">
        {/* Sub-Navigasi Tab */}
        <div className="bg-white rounded-2xl shadow-sm p-2 flex flex-wrap gap-2 border border-red-100">
          <button onClick={() => setActiveSection('RINGKASAN')} className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center gap-2 ${activeSection === 'RINGKASAN' ? 'bg-gradient-to-r from-[#E4002B] to-[#99001D] text-white shadow' : 'text-slate-600 hover:bg-slate-100'}`}>
            <span>📊 Ringkasan Eksekutif</span>
          </button>
          <button onClick={() => setActiveSection('TINDAK_LANJUT')} className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center gap-2 ${activeSection === 'TINDAK_LANJUT' ? 'bg-gradient-to-r from-[#E4002B] to-[#99001D] text-white shadow' : 'text-slate-600 hover:bg-slate-100'}`}>
            <span>📞 Tindak Lanjut (Caring & Visit)</span>
            <span className="bg-red-100 text-[#E4002B] px-2 py-0.5 rounded-full text-[10px] font-black">{unpaidCount}</span>
          </button>
          <button onClick={() => setActiveSection('KINERJA_PIC')} className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center gap-2 ${activeSection === 'KINERJA_PIC' ? 'bg-gradient-to-r from-[#E4002B] to-[#99001D] text-white shadow' : 'text-slate-600 hover:bg-slate-100'}`}>
            <span>🏆 Ranking Kinerja PIC</span>
          </button>
          <button onClick={() => setActiveSection('INTEGRASI_DATA')} className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center gap-2 ${activeSection === 'INTEGRASI_DATA' ? 'bg-gradient-to-r from-[#E4002B] to-[#99001D] text-white shadow' : 'text-slate-600 hover:bg-slate-100'}`}>
            <span>🔄 Integrasi Data</span>
          </button>
        </div>

        {/* TAB 1: RINGKASAN */}
        {activeSection === 'RINGKASAN' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl p-5 shadow-sm border-l-4 border-indigo-600 flex justify-between items-center">
                <div><p className="text-[11px] font-extrabold text-slate-500 uppercase">Total Pelanggan</p><p className="text-3xl font-black text-indigo-700 mt-1">{totalPelanggan}</p></div>
                <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl">👥</div>
              </div>
              <div className="bg-gradient-to-br from-rose-50 to-red-100/70 rounded-2xl p-5 shadow-sm border-l-4 border-[#E4002B] flex justify-between items-center">
                <div><p className="text-[11px] font-extrabold text-slate-600 uppercase">Total Outstanding</p><p className="text-2xl font-black text-[#E4002B] mt-1">{formatRupiah(totalOutstanding)}</p></div>
                <div className="w-11 h-11 rounded-xl bg-white text-[#E4002B] flex items-center justify-center text-xl shadow-sm">💳</div>
              </div>
              <div className="bg-white rounded-2xl p-5 shadow-sm border-l-4 border-amber-500 flex justify-between items-center">
                <div><p className="text-[11px] font-extrabold text-slate-500 uppercase">Sudah Caring</p><p className="text-3xl font-black text-amber-600 mt-1">{sudahCaringCount}</p></div>
                <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl">📞</div>
              </div>
              <div className="bg-white rounded-2xl p-5 shadow-sm border-l-4 border-emerald-500 flex justify-between items-center">
                <div><p className="text-[11px] font-extrabold text-slate-500 uppercase">Sudah Bayar (Lunas)</p><p className="text-3xl font-black text-emerald-600 mt-1">{lunasCount}</p></div>
                <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl">✅</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100">
                <h3 className="text-base font-black text-slate-800">Distribusi Status</h3>
                <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-8">
                  <div className="relative w-48 h-48 shrink-0">
                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                      {donutSegments.map((seg, idx) => {
                        const pct = (seg.count / totalSegmentSum) * 100;
                        const strokeDasharray = `${pct} ${100 - pct}`;
                        const strokeDashoffset = -cumulativeAngle;
                        cumulativeAngle += pct;
                        return <circle key={idx} cx="50" cy="50" r="36" fill="transparent" stroke={seg.color} strokeWidth="14" strokeDasharray={strokeDasharray} strokeDashoffset={strokeDashoffset} pathLength="100" />;
                      })}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center"><span className="text-xl font-black text-slate-800">{totalPelanggan}</span><span className="text-[10px] font-bold text-slate-400 uppercase">Total</span></div>
                  </div>
                  <div className="space-y-2.5 w-full">
                    {donutSegments.map((seg, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs"><div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: seg.color }}></span><span className="font-bold text-slate-700">{seg.label}</span></div><span className="font-extrabold text-slate-900">{seg.count}</span></div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100">
                <h3 className="text-base font-black text-slate-800">Top Area / Datel Outstanding</h3>
                <div className="mt-6 space-y-4">
                  {topOutstandingDatel.map((d, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold"><span className="text-slate-800">{d.name}</span><span className="text-[#E4002B]">{formatRupiah(d.outstanding)}</span></div>
                      <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-[#E4002B] to-rose-400 rounded-full" style={{ width: `${Math.max(8, Math.round((d.outstanding / maxOutstandingVal) * 100))}%` }}></div></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: TINDAK LANJUT */}
        {activeSection === 'TINDAK_LANJUT' && (
          <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4 border border-slate-100">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b pb-4">
              <div><h3 className="text-base font-black text-slate-800">📋 Daftar Tindak Lanjut</h3><p className="text-xs text-slate-500">Data ditarik langsung dari server (hanya 50 per halaman).</p></div>
              <button onClick={exportAnalyticsExcel} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow transition">📊 Export Halaman Ini</button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 bg-slate-50 p-3.5 rounded-xl border">
              <input type="text" placeholder="🔍 Cari SND / Nama / PIC..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="border rounded-lg p-2 text-xs bg-white outline-none focus:ring-2 focus:ring-[#E4002B]" />
              <select value={filterDatel} onChange={(e) => setFilterDatel(e.target.value)} className="border rounded-lg p-2 text-xs bg-white outline-none"><option value="ALL">Semua Datel / STO</option>{uniqueDatels.map((d, i) => <option key={i} value={d}>{d}</option>)}</select>
              <select value={filterCaring} onChange={(e) => setFilterCaring(e.target.value)} className="border rounded-lg p-2 text-xs bg-white outline-none"><option value="ALL">Semua Status Caring</option><option value="BELUM_CARING">⏳ Belum Caring</option><option value="SUDAH_CARING">📞 Sudah Caring</option><option value="JANJI_BAYAR">🤝 Janji Bayar</option></select>
              <select value={filterVisit} onChange={(e) => setFilterVisit(e.target.value)} className="border rounded-lg p-2 text-xs bg-white outline-none"><option value="ALL">Semua Status Visit</option><option value="BELUM_VISIT">🚶 Belum Visit</option><option value="SUDAH_VISIT">📍 Sudah Visit</option><option value="LUNAS_TEMPAT">✅ Lunas di Tempat</option></select>
              <select value={filterPic} onChange={(e) => setFilterPic(e.target.value)} className="border rounded-lg p-2 text-xs bg-white outline-none"><option value="ALL">Semua Petugas / PIC</option>{uniquePics.map((p, i) => <option key={i} value={p}>{p}</option>)}</select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-900 text-white">
                    <th className="p-3 rounded-tl-lg">SND / No. Layanan</th><th className="p-3">Nama Pelanggan</th><th className="p-3">Datel / STO</th><th className="p-3">Outstanding</th><th className="p-3">Status Caring</th><th className="p-3">Status Visit</th><th className="p-3">PIC Petugas</th><th className="p-3 text-center rounded-tr-lg">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {followUpData.length === 0 ? (
                    <tr><td colSpan="8" className="text-center p-6 text-slate-500">Tidak ada data pelanggan yang sesuai filter.</td></tr>
                  ) : (
                    followUpData.map((row) => (
                      <tr key={row.id} className="border-b hover:bg-rose-50/40">
                        <td className="p-3 font-mono font-bold text-slate-700">{maskText(row.nomor_layanan)}</td>
                        <td className="p-3"><div className="font-bold text-slate-900">{row.nama_pelanggan}</div><div className="text-[11px] text-slate-500 font-mono">📞 {maskText(row.no_wa || '-')}</div></td>
                        <td className="p-3 text-[11px] font-semibold text-indigo-800">{row.datel_sto || 'Priangan Timur'}</td>
                        <td className="p-3 font-extrabold text-[#E4002B]">{formatRupiah(row.nominal)}</td>
                        <td className="p-3">
                          <select value={row.status_caring || 'BELUM_CARING'} onChange={(e) => handleUpdateRecord(row, { status_caring: e.target.value })} className="p-1.5 rounded-lg font-bold text-[11px] border bg-slate-50 outline-none">
                            <option value="BELUM_CARING">⏳ Belum Caring</option><option value="SUDAH_CARING">📞 Sudah Caring</option><option value="JANJI_BAYAR">🤝 Janji Bayar</option><option value="COMPLAIN_TARIF">⚠️ Complain Tarif</option>
                          </select>
                        </td>
                        <td className="p-3">
                          <select value={row.status_visit || 'BELUM_VISIT'} onChange={(e) => handleUpdateRecord(row, { status_visit: e.target.value, status_chat: e.target.value === 'LUNAS_TEMPAT' ? 'LUNAS' : row.status_chat })} className="p-1.5 rounded-lg font-bold text-[11px] border bg-slate-50 outline-none">
                            <option value="BELUM_VISIT">🚶 Belum Visit</option><option value="SUDAH_VISIT">📍 Sudah Visit</option><option value="LUNAS_TEMPAT">✅ Lunas di Tempat</option>
                          </select>
                        </td>
                        <td className="p-3"><input type="text" defaultValue={row.pic_petugas || user.nama_lengkap} onBlur={(e) => { if (e.target.value !== row.pic_petugas) handleUpdateRecord(row, { pic_petugas: e.target.value }); }} className="border rounded px-2 py-1 text-[11px] font-bold text-slate-800 w-28 outline-none" /></td>
                        <td className="p-3 text-center"><Link href="/dashboard/indibiz" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-1.5 rounded-lg text-[11px] shadow inline-block">💬 Hubungi</Link></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {followUpTotal > 0 && (
              <div className="flex flex-col sm:flex-row justify-between items-center mt-4 border-t pt-4 gap-3">
                <span className="text-xs text-slate-600">Menampilkan {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, followUpTotal)} dari {followUpTotal} data</span>
                <div className="flex gap-2">
                  <button onClick={() => fetchFollowUpData(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="px-3 py-1.5 text-xs font-bold bg-slate-200 text-slate-700 rounded-lg disabled:opacity-50 hover:bg-slate-300 transition">← Sebelumnya</button>
                  <span className="px-3 py-1.5 text-xs font-bold text-slate-800 bg-slate-100 rounded-lg">Hal {currentPage} / {totalPages}</span>
                  <button onClick={() => fetchFollowUpData(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages || totalPages === 0} className="px-3 py-1.5 text-xs font-bold bg-slate-200 text-slate-700 rounded-lg disabled:opacity-50 hover:bg-slate-300 transition">Selanjutnya →</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: KINERJA PIC (Placeholder) */}
        {activeSection === 'KINERJA_PIC' && (
          <div className="bg-white rounded-2xl shadow-sm p-10 text-center border border-slate-100">
            <h3 className="text-lg font-black text-slate-800">🏆 Modul Kinerja PIC / AM</h3>
            <p className="text-sm text-slate-500 mt-2">Fitur Leaderboard sedang dalam pemeliharaan untuk optimalisasi server-side.</p>
          </div>
        )}

        {/* TAB 4: INTEGRASI DATA */}
        {activeSection === 'INTEGRASI_DATA' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 bg-white rounded-2xl shadow-sm p-6 border border-slate-100 space-y-5">
              <div className="border-b pb-3"><h3 className="text-base font-black text-slate-800">🔄 Pusat Sinkronisasi Data</h3></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 flex flex-col justify-between space-y-3">
                  <div><span className="text-xs font-black text-emerald-900">📥 1. Import Excel 44-Kolom</span><p className="text-[11px] text-emerald-800 mt-1 leading-relaxed">Mendukung upload file SND/STO/DATEL/TGK Telkom.</p></div>
                  <label className="cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl text-center shadow transition">
                    {syncProgress || 'Pilih File Excel (.xlsx)'}
                    <input type="file" accept=".xlsx, .xls, .csv" onChange={handleMasterBulkImport} className="hidden" />
                  </label>
                </div>
                <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-4 flex flex-col justify-between space-y-3">
                  <div><span className="text-xs font-black text-[#E4002B]">📤 2. Export Backup Multi-Sheet</span><p className="text-[11px] text-slate-700 mt-1 leading-relaxed">Piutang & Penawaran (Indibiz diringkas).</p></div>
                  <button onClick={exportFullPortalBackup} className="bg-gradient-to-r from-[#E4002B] to-[#99001D] hover:opacity-90 text-white text-xs font-bold px-4 py-2.5 rounded-xl text-center shadow transition">⬇️ Download Backup</button>
                </div>
              </div>
            </div>
            <div className="lg:col-span-5 bg-slate-950 text-slate-200 rounded-2xl shadow-lg p-5 font-mono text-xs flex flex-col justify-between">
              <div className="space-y-2 text-[11px] leading-relaxed">
                <p className="text-slate-400">[SYNC] Menghubungkan Neon PostgreSQL Serverless...</p>
                <p className="text-purple-400">[DB] Memuat {totalPelanggan} master pelanggan.</p>
                <p className="text-emerald-400">[OK] Modul Piutang ({piutangRecords.length}) & Penawaran ({penawaranRecords.length}) aktif.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
