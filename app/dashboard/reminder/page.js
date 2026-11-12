'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ReminderPage() {
  const [user, setUser] = useState(null);
  const [offers, setOffers] = useState([]);
  const [clientInput, setClientInput] = useState('');
  const [productInput, setProductInput] = useState('');
  const [daysInput, setDaysInput] = useState('');
  const [picInput, setPicInput] = useState('');
  
  // State Filter & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [filterPic, setFilterPic] = useState('ALL');

  // State Modal Edit
  const [editingOffer, setEditingOffer] = useState(null);

  // State Custom Tag & Editable Telegram Text
  const [targetTags, setTargetTags] = useState('@team_support @support_it');
  const [editableTelegramText, setEditableTelegramText] = useState('');

  // State Telegram Bot Config
  const [botToken, setBotToken] = useState('9139282100:AAEK1AgC1kLGIW-aKcYJ2siFJP2P1OXXS50');
  const [chatId, setChatId] = useState('6505318721');
  const [isSending, setIsSending] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (!savedUser) {
      router.push('/login');
    } else {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      setPicInput(parsedUser.nama_lengkap || '');
      fetchOffers(parsedUser.id);
    }

    const scriptXlsx = document.createElement('script');
    scriptXlsx.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
    document.body.appendChild(scriptXlsx);
  }, []);

  const fetchOffers = async (userId) => {
    const res = await fetch(`/api/penawaran?userId=${userId}`);
    const result = await res.json();
    if (res.ok) {
      setOffers(result.data);
    }
  };

  // Sinkronisasi otomatis format Telegram saat data, tag, atau filter PIC berubah
  useEffect(() => {
    if (!user) return;
    const activeAll = offers.filter((o) => !o.status_prospek || o.status_prospek === 'IN_PROGRESS');
    const active = filterPic === 'ALL'
      ? activeAll
      : activeAll.filter((o) => (o.pic_am || user.nama_lengkap).toLowerCase().includes(filterPic.toLowerCase()));

    const urgent = active.filter((o) => o.aging_hari >= 21);
    const followUp = active.filter((o) => o.aging_hari >= 14 && o.aging_hari <= 20);
    const monitoring = active.filter((o) => o.aging_hari >= 7 && o.aging_hari <= 13);

    const picHeader = filterPic !== 'ALL' ? `\n=== PIC: ${filterPic.toUpperCase()} ===\n` : '';

    const generated = `REMINDER STATUS PENAWARAN\nAM: ${user.nama_lengkap}\nTotal Proyek Aktif: ${active.length} Proyek\n\nHalo @${user.telegram_user}\n\nMohon perhatian HOTD terkait:\n${targetTags}\n${picHeader}\nBerikut kami sampaikan daftar penawaran yang WAJIB SEGERA DI FOLLOW UP agar target deal tercapai.\n\nKeterangan Prioritas:\nUrgent : ≥21 hari\nFollow Up : 14–20 hari\nMonitoring : 7–13 hari\n\n${urgent.length > 0 ? `URGENT (${urgent.length} Proyek)\n` + urgent.map((item, i) => `${i + 1}. ${item.nama_klien} - ${item.layanan} (${item.aging_hari} Hari)`).join('\n') + '\n\n' : ''}${followUp.length > 0 ? `FOLLOW UP (${followUp.length} Proyek)\n` + followUp.map((item, i) => `${i + 1}. ${item.nama_klien} - ${item.layanan} (${item.aging_hari} Hari)`).join('\n') + '\n\n' : ''}${monitoring.length > 0 ? `MONITORING (${monitoring.length} Proyek)\n` + monitoring.map((item, i) => `${i + 1}. ${item.nama_klien} - ${item.layanan} (${item.aging_hari} Hari)`).join('\n') + '\n\n' : ''}Mohon segera update progres dan hasil tindak lanjutnya.\nTerima kasih dan tetap semangat!`;

    setEditableTelegramText(generated);
  }, [offers, targetTags, filterPic, user]);

  const handleAddOffer = async (e) => {
    e.preventDefault();
    if (!clientInput || !productInput || !daysInput) return;

    const res = await fetch('/api/penawaran', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        namaKlien: clientInput,
        layanan: productInput,
        agingHari: parseInt(daysInput),
        picAm: picInput || user.nama_lengkap,
      }),
    });

    if (res.ok) {
      setClientInput('');
      setProductInput('');
      setDaysInput('');
      fetchOffers(user.id);
    }
  };

  const handleUpdateOffer = async (e) => {
    e.preventDefault();
    if (!editingOffer) return;

    const res = await fetch('/api/penawaran', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: editingOffer.id,
        namaKlien: editingOffer.nama_klien,
        layanan: editingOffer.layanan,
        agingHari: parseInt(editingOffer.aging_hari),
        statusProspek: editingOffer.status_prospek || 'IN_PROGRESS',
        picAm: editingOffer.pic_am || user.nama_lengkap,
      }),
    });

    if (res.ok) {
      setEditingOffer(null);
      fetchOffers(user.id);
    }
  };

  const handleQuickStatusChange = async (offer, newStatus) => {
    const res = await fetch('/api/penawaran', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: offer.id,
        namaKlien: offer.nama_klien,
        layanan: offer.layanan,
        agingHari: offer.aging_hari,
        statusProspek: newStatus,
        picAm: offer.pic_am || user.nama_lengkap,
      }),
    });

    if (res.ok) {
      fetchOffers(user.id);
    }
  };

  const handleDeleteOffer = async (id) => {
    if (!confirm('Apakah kamu yakin ingin menghapus penawaran ini?')) return;

    const res = await fetch(`/api/penawaran?id=${id}`, {
      method: 'DELETE',
    });

    if (res.ok) {
      fetchOffers(user.id);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file || !window.XLSX) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const bstr = evt.target.result;
      const wb = window.XLSX.read(bstr, { type: 'binary' });
      const wsName = wb.SheetNames[0];
      const data = window.XLSX.utils.sheet_to_json(wb.Sheets[wsName]);

      let count = 0;
      for (const row of data) {
        const namaKlien = row.nama_klien || row['Nama Klien'] || row['Nama Klien/Proyek'] || '';
        const layanan = row.layanan || row['Layanan'] || row['Produk'] || '';
        const agingHari = row.aging_hari || row['Aging Hari'] || row['Aging'] || 0;
        const picAm = row.pic_am || row['PIC'] || row['PIC AM'] || user.nama_lengkap;

        if (namaKlien && layanan) {
          await fetch('/api/penawaran', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user.id,
              namaKlien: String(namaKlien),
              layanan: String(layanan),
              agingHari: parseInt(agingHari) || 0,
              picAm: String(picAm),
            }),
          });
          count++;
        }
      }
      alert(`🚀 Berhasil mengimpor ${count} data penawaran!`);
      fetchOffers(user.id);
    };
    reader.readAsBinaryString(file);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/login');
  };

  const exportToExcel = () => {
    if (!window.XLSX) {
      alert('Modul Excel sedang dimuat, coba 2 detik lagi!');
      return;
    }

    const excelData = filteredOffers.map((item, idx) => ({
      No: idx + 1,
      'PIC / AM': item.pic_am || user.nama_lengkap,
      'Nama Klien': item.nama_klien,
      Layanan: item.layanan,
      'Aging (Hari)': item.aging_hari,
      'Status Prioritas': item.aging_hari >= 21 ? 'Urgent' : item.aging_hari >= 14 ? 'Follow Up' : 'Monitoring',
      'Status Prospek': item.status_prospek || 'IN_PROGRESS',
    }));

    const worksheet = window.XLSX.utils.json_to_sheet(excelData);
    const workbook = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan Penawaran');
    window.XLSX.writeFile(workbook, `Laporan_Penawaran_Telkom_${user.nama_lengkap.replace(/\s+/g, '_')}.xlsx`);
  };

  const exportToPDF = () => {
    const printWindow = window.open('', '_blank');
    const tableRows = filteredOffers
      .map(
        (item, idx) => `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${idx + 1}</td>
        <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; color: #E4002B;">${item.pic_am || user.nama_lengkap}</td>
        <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">${item.nama_klien}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${item.layanan}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${item.aging_hari} Hari</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center; font-weight: bold; color: ${
          item.aging_hari >= 21 ? '#E4002B' : item.aging_hari >= 14 ? '#d97706' : '#0284c7'
        }">
          ${item.aging_hari >= 21 ? 'Urgent' : item.aging_hari >= 14 ? 'Follow Up' : 'Monitoring'}
        </td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center; font-weight: bold;">
          ${item.status_prospek || 'IN_PROGRESS'}
        </td>
      </tr>
    `
      )
      .join('');

    const htmlContent = `
      <html>
        <head>
          <title>Laporan Penawaran Telkom - ${user.nama_lengkap}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
            .header { border-bottom: 3px solid #E4002B; padding-bottom: 10px; margin-bottom: 20px; }
            .header h1 { color: #E4002B; margin: 0; font-size: 20px; }
            .header p { margin: 5px 0 0 0; font-size: 12px; color: #666; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
            th { background-color: #E4002B; color: white; padding: 10px; border: 1px solid #E4002B; }
            .footer { margin-top: 30px; font-size: 11px; color: #888; text-align: right; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>PT TELKOM INDONESIA (PERSERO) TBK - LAPORAN STATUS PENAWARAN EBS</h1>
            <p>Account Manager: <b>${user.nama_lengkap}</b> | Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>PIC / AM</th>
                <th>Nama Klien</th>
                <th>Layanan / Produk</th>
                <th>Aging</th>
                <th>Prioritas</th>
                <th>Status Prospek</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
          <div class="footer">
            Dokumen ini dicetak otomatis dari Telkom EBS Portal
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(() => { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  if (!user) return null;

  const activeOffers = offers.filter((o) => !o.status_prospek || o.status_prospek === 'IN_PROGRESS');
  const uniquePics = [...new Set(activeOffers.map((item) => item.pic_am || user.nama_lengkap).filter(Boolean))];

  const urgentList = activeOffers.filter((o) => o.aging_hari >= 21);
  const followUpList = activeOffers.filter((o) => o.aging_hari >= 14 && o.aging_hari <= 20);
  const monitoringList = activeOffers.filter((o) => o.aging_hari >= 7 && o.aging_hari <= 13);

  const filteredOffers = activeOffers.filter((o) => {
    const picLabel = o.pic_am || user.nama_lengkap;
    const matchesSearch = o.nama_klien.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          o.layanan.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          picLabel.toLowerCase().includes(searchTerm.toLowerCase());
    
    let status = 'MONITORING';
    if (o.aging_hari >= 21) status = 'URGENT';
    else if (o.aging_hari >= 14) status = 'FOLLOW_UP';

    const matchesStatus = statusFilter === 'ALL' || statusFilter === status;

    return matchesSearch && matchesStatus;
  });

  const handleSendTelegram = async () => {
    if (!botToken || !chatId) {
      alert('Masukkan Bot Token dan Chat ID Telegram terlebih dahulu!');
      return;
    }

    setIsSending(true);
    try {
      const res = await fetch('/api/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botToken,
          chatId,
          text: editableTelegramText,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        alert('🚀 Pesan Reminder Berhasil Terkirim ke Telegram!');
      } else {
        alert('❌ Gagal mengirim: ' + data.message);
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen pb-10">
      <header className="bg-gradient-to-r from-[#E4002B] to-[#99001D] text-white shadow-md">
        <div className="max-w-6xl mx-auto p-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-black tracking-wide">TELKOM INDONESIA</h1>
            <p className="text-xs text-red-100">Reminder Status Penawaran Bot</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-xs bg-white text-[#E4002B] font-bold px-3 py-1.5 rounded hover:bg-gray-100 transition shadow">
              🔙 Menu Utama
            </Link>
            <span className="text-xs bg-black/30 px-3 py-1 rounded-full font-bold">AM: {user.nama_lengkap}</span>
            <button onClick={handleLogout} className="text-xs bg-white text-[#E4002B] font-bold px-3 py-1 rounded hover:bg-gray-100 transition">
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-4 space-y-6">
        {/* Card Counters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
            <p className="text-3xl font-extrabold text-[#E4002B]">{urgentList.length}</p>
            <p className="text-xs font-bold text-gray-600 mt-1">Urgent (≥21 Hari)</p>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
            <p className="text-3xl font-extrabold text-amber-600">{followUpList.length}</p>
            <p className="text-xs font-bold text-gray-600 mt-1">Follow Up (14–20 Hari)</p>
          </div>
          <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 text-center">
            <p className="text-3xl font-extrabold text-sky-600">{monitoringList.length}</p>
            <p className="text-xs font-bold text-gray-600 mt-1">Monitoring (7–13 Hari)</p>
          </div>
        </div>

        {/* Input Form & Editable Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow p-5 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-gray-800 text-sm">➕ Input Penawaran Baru</h3>
              
              <label className="cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow transition">
                📥 Bulk Import (Excel/CSV)
                <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>

            <form onSubmit={handleAddOffer} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Nama PIC (Mas Ibay dsb)</label>
                  <input
                    type="text"
                    placeholder="Contoh: Mas Wildan"
                    value={picInput}
                    onChange={(e) => setPicInput(e.target.value)}
                    required
                    className="w-full border rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-[#E4002B] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Aging (Jumlah Hari)</label>
                  <input
                    type="number"
                    placeholder="Contoh: 233"
                    value={daysInput}
                    onChange={(e) => setDaysInput(e.target.value)}
                    required
                    className="w-full border rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-[#E4002B] outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Nama Klien</label>
                <input
                  type="text"
                  placeholder="Contoh: UNIVERSITAS CIPASUNG"
                  value={clientInput}
                  onChange={(e) => setClientInput(e.target.value)}
                  required
                  className="w-full border rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-[#E4002B] outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Layanan / Produk</label>
                <input
                  type="text"
                  placeholder="Contoh: Astinet + CPE"
                  value={productInput}
                  onChange={(e) => setProductInput(e.target.value)}
                  required
                  className="w-full border rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-[#E4002B] outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-emerald-600 text-white font-bold py-2.5 rounded-lg text-xs hover:bg-emerald-700 transition"
              >
                + Simpan Data Penawaran Manual
              </button>
            </form>
          </div>

          <div className="bg-gray-900 text-green-400 p-5 rounded-xl shadow font-mono text-xs flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-gray-400 font-sans font-bold text-xs">✏️ Editor & Live Preview Telegram:</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(editableTelegramText);
                    alert('Teks disalin!');
                  }}
                  className="bg-[#E4002B] hover:bg-[#c70025] text-white px-3 py-1.5 rounded text-xs font-sans font-bold transition shadow"
                >
                  Copy Text
                </button>
              </div>

              {/* Filter Generate PIC sama seperti Telkom Collection */}
              <div className="mb-3 font-sans">
                <select
                  value={filterPic}
                  onChange={(e) => setFilterPic(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-xs text-white font-bold focus:outline-none"
                >
                  <option value="ALL">-- Generate Semua PIC --</option>
                  {uniquePics.map((pic, i) => (
                    <option key={i} value={pic}>Khusus {pic}</option>
                  ))}
                </select>
              </div>

              <textarea
                rows="11"
                value={editableTelegramText}
                onChange={(e) => setEditableTelegramText(e.target.value)}
                className="w-full bg-gray-800/80 text-green-400 p-3 rounded-lg border border-gray-700 focus:border-green-500 focus:outline-none whitespace-pre-wrap font-mono text-xs leading-relaxed"
              />
            </div>

            <div className="mt-4 pt-3 border-t border-gray-800 font-sans space-y-2">
              <div>
                <label className="block text-[11px] text-gray-400 mb-1">Tag Mention HOTD / Support:</label>
                <input
                  type="text"
                  placeholder="@team_support @support_it"
                  value={targetTags}
                  onChange={(e) => setTargetTags(e.target.value)}
                  className="w-full bg-gray-800 text-white text-xs p-2 rounded border border-gray-700 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Bot Token"
                  value={botToken}
                  onChange={(e) => setBotToken(e.target.value)}
                  className="bg-gray-800 text-white text-xs p-2 rounded border border-gray-700 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Chat ID"
                  value={chatId}
                  onChange={(e) => setChatId(e.target.value)}
                  className="bg-gray-800 text-white text-xs p-2 rounded border border-gray-700 focus:outline-none"
                />
              </div>
              <button
                onClick={handleSendTelegram}
                disabled={isSending}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded text-xs transition"
              >
                {isSending ? 'Mengirim...' : '✈️ Send Direct to Telegram'}
              </button>
            </div>
          </div>
        </div>

        {/* Tabel Penawaran + Search, Filter & Export */}
        <div className="bg-white rounded-xl shadow p-5 space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <h3 className="font-bold text-gray-800 text-sm">📋 Daftar Penawaran Aktif</h3>
            
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <button
                onClick={exportToExcel}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-2 rounded-lg transition shadow"
              >
                📊 Excel
              </button>
              <button
                onClick={exportToPDF}
                className="bg-[#E4002B] hover:bg-[#B80022] text-white text-xs font-bold px-3 py-2 rounded-lg transition shadow"
              >
                📄 PDF
              </button>

              <input
                type="text"
                placeholder="🔍 Cari Klien / Layanan / PIC..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border rounded-lg p-2 text-xs w-full md:w-48 focus:ring-2 focus:ring-[#E4002B] outline-none"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border rounded-lg p-2 text-xs focus:ring-2 focus:ring-[#E4002B] outline-none bg-white"
              >
                <option value="ALL">Semua Status</option>
                <option value="URGENT">Urgent (≥21 Hari)</option>
                <option value="FOLLOW_UP">Follow Up (14-20 Hari)</option>
                <option value="MONITORING">Monitoring (7-13 Hari)</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b bg-gray-50 text-gray-600">
                  <th className="p-3">No</th>
                  <th className="p-3">PIC / AM</th>
                  <th className="p-3">Nama Klien</th>
                  <th className="p-3">Layanan</th>
                  <th className="p-3">Aging</th>
                  <th className="p-3">Prioritas</th>
                  <th className="p-3">Status Prospek</th>
                  <th className="p-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredOffers.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center p-4 text-gray-500">Tidak ada penawaran ditemukan</td>
                  </tr>
                ) : (
                  filteredOffers.map((row, idx) => {
                    let badgeClass = 'bg-sky-100 text-sky-700';
                    let statusLabel = 'Monitoring';
                    if (row.aging_hari >= 21) {
                      badgeClass = 'bg-red-100 text-[#E4002B] font-bold';
                      statusLabel = 'Urgent';
                    } else if (row.aging_hari >= 14) {
                      badgeClass = 'bg-amber-100 text-amber-700 font-bold';
                      statusLabel = 'Follow Up';
                    }

                    const prospectStatus = row.status_prospek || 'IN_PROGRESS';

                    return (
                      <tr key={row.id} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-semibold">{idx + 1}</td>
                        <td className="p-3 font-bold text-[#E4002B]">{row.pic_am || user.nama_lengkap}</td>
                        <td className="p-3 font-bold text-gray-800">{row.nama_klien}</td>
                        <td className="p-3 text-gray-600">{row.layanan}</td>
                        <td className="p-3 font-bold">{row.aging_hari} Hari</td>
                        <td className="p-3">
                          <span className={`px-2.5 py-1 rounded-full text-xs ${badgeClass}`}>{statusLabel}</span>
                        </td>
                        <td className="p-3">
                          <select
                            value={prospectStatus}
                            onChange={(e) => handleQuickStatusChange(row, e.target.value)}
                            className={`p-1.5 rounded-lg font-bold text-xs border cursor-pointer outline-none ${
                              prospectStatus === 'WON'
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : prospectStatus === 'LOST'
                                ? 'bg-rose-100 text-rose-800 border-rose-300'
                                : 'bg-blue-50 text-blue-700 border-blue-200'
                            }`}
                          >
                            <option value="IN_PROGRESS">⏳ In Progress</option>
                            <option value="WON">🎉 WON (Closing)</option>
                            <option value="LOST">❌ LOST (Batal)</option>
                          </select>
                        </td>
                        <td className="p-3 text-center space-x-2">
                          <button
                            onClick={() => setEditingOffer(row)}
                            className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-2.5 py-1 rounded text-xs transition shadow"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteOffer(row.id)}
                            className="bg-[#E4002B] hover:bg-[#B80022] text-white font-bold px-2.5 py-1 rounded text-xs transition shadow"
                          >
                            Hapus
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Edit Penawaran */}
      {editingOffer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full space-y-4">
            <h3 className="font-bold text-gray-800 text-base">✏️ Edit Data Penawaran</h3>
            <form onSubmit={handleUpdateOffer} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Nama PIC / AM</label>
                <input
                  type="text"
                  value={editingOffer.pic_am || ''}
                  onChange={(e) => setEditingOffer({ ...editingOffer, pic_am: e.target.value })}
                  required
                  className="w-full border rounded-lg p-2 text-xs focus:ring-2 focus:ring-[#E4002B] outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Nama Klien</label>
                <input
                  type="text"
                  value={editingOffer.nama_klien}
                  onChange={(e) => setEditingOffer({ ...editingOffer, nama_klien: e.target.value })}
                  required
                  className="w-full border rounded-lg p-2 text-xs focus:ring-2 focus:ring-[#E4002B] outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Layanan</label>
                <input
                  type="text"
                  value={editingOffer.layanan}
                  onChange={(e) => setEditingOffer({ ...editingOffer, layanan: e.target.value })}
                  required
                  className="w-full border rounded-lg p-2 text-xs focus:ring-2 focus:ring-[#E4002B] outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Aging (Hari)</label>
                <input
                  type="number"
                  value={editingOffer.aging_hari}
                  onChange={(e) => setEditingOffer({ ...editingOffer, aging_hari: e.target.value })}
                  required
                  className="w-full border rounded-lg p-2 text-xs focus:ring-2 focus:ring-[#E4002B] outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Status Prospek</label>
                <select
                  value={editingOffer.status_prospek || 'IN_PROGRESS'}
                  onChange={(e) => setEditingOffer({ ...editingOffer, status_prospek: e.target.value })}
                  className="w-full border rounded-lg p-2 text-xs focus:ring-2 focus:ring-[#E4002B] outline-none bg-white font-semibold"
                >
                  <option value="IN_PROGRESS">⏳ In Progress</option>
                  <option value="WON">🎉 WON (Closing)</option>
                  <option value="LOST">❌ LOST (Batal)</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingOffer(null)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold px-3 py-1.5 rounded text-xs transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded text-xs transition"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
