'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CollectionPage() {
  const [user, setUser] = useState(null);
  const [piutang, setPiutang] = useState([]);
  
  // Form States
  const [idPelanggan, setIdPelanggan] = useState('');
  const [namaPelanggan, setNamaPelanggan] = useState('');
  const [kategori, setKategori] = useState('Piutang Bulan Berjalan');
  const [keterangan, setKeterangan] = useState('');
  const [picAm, setPicAm] = useState('');
  
  // Tab & Filter States
  const [activeTab, setActiveTab] = useState('UNPAID'); // 'UNPAID', 'PAID', atau 'ANALYTICS'
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPic, setFilterPic] = useState('ALL');

  // State Telegram Direct Send
  const [botToken, setBotToken] = useState('9139282100:AAEK1AgC1kLGIW-aKcYJ2siFJP2P1OXXS50');
  const [chatId, setChatId] = useState('6505318721');
  const [isSending, setIsSending] = useState(false);
  
  // Dynamic Header Broadcast State
  const today = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
  const [customHeaderText, setCustomHeaderText] = useState(
`Bismillah... Semangat Pagi Rekans!
Izin mengingatkan kembali untuk Piutang Bulan Berjalan, Piutang Tunggakan > 1 BLN & Piutang Bukpot PPh Layanan Nonpots yang masih UNPAID / PARTIAL hingga hari ini Tgl, ${today}.
Mohon bantuannya untuk remind pelanggannya masing-masing agar segera melakukan pembayaran atau menyetorkan bukpot PPh ke kami untuk menghindari Suspend Layanan. Haturnuhun 🙏

BS : @kaniaaudrya 
GS : @Mike_hartono @meitamaharani
Tasikmalaya : @diinannur
Banjar : @Zidannoufal
Singaparna : @Khamid21 @Wiratamaaa
Garut : @adiprayit
Majalengka: @dwikresnaw
Indramayu: @naldycakep
Kuningan : @fauzansonikurnia

cc : @Hdy9616 @aisyahiribaram 

Link monitoring CYC Priti : https://bit.ly/Monit_CYC_Priti`
  );

  const router = useRouter();

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (!savedUser) {
      router.push('/login');
    } else {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      fetchPiutang(parsedUser.id);
    }

    const scriptXlsx = document.createElement('script');
    scriptXlsx.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
    document.body.appendChild(scriptXlsx);
  }, []);

  const fetchPiutang = async (userId) => {
    const res = await fetch(`/api/piutang?userId=${userId}`);
    const result = await res.json();
    if (res.ok) setPiutang(result.data);
  };

  const handleAddData = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/piutang', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id, idPelanggan, namaPelanggan, kategori, keterangan, picAm
      }),
    });
    if (res.ok) {
      setIdPelanggan(''); setNamaPelanggan(''); setKeterangan(''); setPicAm('');
      fetchPiutang(user.id);
    }
  };

  const handleMarkStatus = async (item, status) => {
    const res = await fetch('/api/piutang', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: item.id,
        idPelanggan: item.id_pelanggan,
        namaPelanggan: item.nama_pelanggan,
        kategori: item.kategori,
        keterangan: item.keterangan_bulan || '',
        picAm: item.pic_am,
        statusPembayaran: status
      }),
    });
    if (res.ok) fetchPiutang(user.id);
  };

  const handleDelete = async (id) => {
    if (!confirm('Hapus data tagihan ini?')) return;
    const res = await fetch(`/api/piutang?id=${id}`, { method: 'DELETE' });
    if (res.ok) fetchPiutang(user.id);
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
        const idPel = row.id_pelanggan || row['ID Pelanggan'] || '';
        const namaPel = row.nama_pelanggan || row['Nama Pelanggan'] || '';
        const kat = row.kategori || row['Kategori'] || 'Piutang Bulan Berjalan';
        const ket = row.keterangan_bulan || row['Keterangan'] || '';
        const pic = row.pic_am || row['PIC'] || 'AM';

        if (idPel && namaPel) {
          await fetch('/api/piutang', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user.id,
              idPelanggan: String(idPel),
              namaPelanggan: String(namaPel),
              kategori: kat,
              keterangan: String(ket),
              picAm: String(pic)
            }),
          });
          count++;
        }
      }
      alert(`Berhasil mengimpor ${count} data tagihan!`);
      fetchPiutang(user.id);
    };
    reader.readAsBinaryString(file);
  };

  if (!user) return null;

  const unpaidData = piutang.filter(p => p.status_pembayaran === 'UNPAID');
  const paidData = piutang.filter(p => p.status_pembayaran === 'PAID');
  
  const currentTabRawData = activeTab === 'UNPAID' ? unpaidData : paidData;
  const filteredTableData = currentTabRawData.filter(p => 
    p.nama_pelanggan.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.id_pelanggan.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.pic_am.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredBroadcastData = filterPic === 'ALL' 
    ? unpaidData 
    : unpaidData.filter(p => p.pic_am.toLowerCase().includes(filterPic.toLowerCase()));

  const bbList = filteredBroadcastData.filter(p => p.kategori === 'Piutang Bulan Berjalan');
  const bpList = filteredBroadcastData.filter(p => p.kategori === 'Piutang Bukpot PPh');
  const tggList = filteredBroadcastData.filter(p => p.kategori === 'Piutang Tunggakan > 1 BLN');

  let broadcastText = `${customHeaderText}\n\n`;
  if (filterPic !== 'ALL') broadcastText += `=== ${filterPic.toUpperCase()} ===\n\n`;

  if (bbList.length > 0) {
    broadcastText += `Piutang Bulan Berjalan :\n` + bbList.map(item => `${item.id_pelanggan}  ${item.nama_pelanggan}`).join('\n') + `\n\n`;
  }
  if (bpList.length > 0) {
    broadcastText += `Piutang Bukpot PPh :\n` + bpList.map(item => `${item.id_pelanggan}  ${item.nama_pelanggan} : (${item.keterangan_bulan || ''})`).join('\n') + `\n\n`;
  }
  if (tggList.length > 0) {
    broadcastText += `Piutang Tunggakan > 1 BLN :\n` + tggList.map(item => `${item.id_pelanggan}  ${item.nama_pelanggan} : ${item.keterangan_bulan || ''}`).join('\n') + `\n\n`;
  }

  const uniquePics = [...new Set(unpaidData.map(item => item.pic_am).filter(Boolean))];

  // Send Direct Telegram Handler
  const handleSendTelegram = async () => {
    if (!botToken || !chatId) {
      alert('Masukkan Bot Token dan Chat ID terlebih dahulu!');
      return;
    }
    setIsSending(true);
    try {
      const res = await fetch('/api/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botToken, chatId, text: broadcastText }),
      });
      const data = await res.json();
      if (res.ok) {
        alert('🚀 Pesan Broadcast Collection Berhasil Terkirim ke Telegram!');
      } else {
        alert('❌ Gagal mengirim: ' + data.message);
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setIsSending(false);
    }
  };

  // Ekspor Excel Collection Report
  const exportCollectionToExcel = () => {
    if (!window.XLSX) return alert('Modul Excel sedang dimuat...');
    const excelData = piutang.map((item, idx) => ({
      No: idx + 1,
      'ID Pelanggan': item.id_pelanggan,
      'Nama Klien': item.nama_pelanggan,
      Kategori: item.kategori,
      Keterangan: item.keterangan_bulan || '-',
      'PIC AM': item.pic_am,
      Status: item.status_pembayaran,
      'Waktu Diinput': new Date(item.created_at).toLocaleString('id-ID'),
    }));
    const worksheet = window.XLSX.utils.json_to_sheet(excelData);
    const workbook = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekap Collection');
    window.XLSX.writeFile(workbook, `Laporan_Collection_Telkom_${user.nama_lengkap.replace(/\s+/g, '_')}.xlsx`);
  };

  // Ekspor PDF Collection Report
  const exportCollectionToPDF = () => {
    const printWindow = window.open('', '_blank');
    const tableRows = piutang.map((item, idx) => `
      <tr>
        <td style="padding: 6px; border: 1px solid #ddd; text-align: center;">${idx + 1}</td>
        <td style="padding: 6px; border: 1px solid #ddd; font-family: monospace;">${item.id_pelanggan}</td>
        <td style="padding: 6px; border: 1px solid #ddd; font-weight: bold;">${item.nama_pelanggan}</td>
        <td style="padding: 6px; border: 1px solid #ddd;">${item.kategori}</td>
        <td style="padding: 6px; border: 1px solid #ddd; text-align: center;">${item.pic_am}</td>
        <td style="padding: 6px; border: 1px solid #ddd; text-align: center; font-weight: bold; color: ${item.status_pembayaran === 'PAID' ? '#059669' : '#dc2626'};">
          ${item.status_pembayaran}
        </td>
      </tr>
    `).join('');

    const htmlContent = `
      <html>
        <head>
          <title>Laporan Collection Telkom - ${user.nama_lengkap}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
            .header { border-bottom: 3px solid #E4002B; padding-bottom: 10px; margin-bottom: 15px; }
            .header h1 { color: #E4002B; margin: 0; font-size: 18px; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 10px; }
            th { background-color: #E4002B; color: white; padding: 8px; border: 1px solid #E4002B; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>PT TELKOM INDONESIA (PERSERO) TBK - REKAP AUDIT COLLECTION & PIUTANG</h1>
            <p style="font-size: 11px; margin: 5px 0;">Cetak: ${new Date().toLocaleDateString('id-ID')} | Total Record: ${piutang.length}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>No</th><th>ID Pelanggan</th><th>Nama Pelanggan</th><th>Kategori</th><th>PIC AM</th><th>Status</th>
              </tr>
            </thead>
            <tbody>${tableRows}</tbody>
          </table>
          <script>window.onload = function() { window.print(); setTimeout(() => { window.close(); }, 500); };</script>
        </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // Analytics Metrics
  const totalItems = piutang.length;
  const recoveryRate = totalItems > 0 ? ((paidData.length / totalItems) * 100).toFixed(1) : 0;
  
  // Outstanding AM breakdown
  const amMap = {};
  unpaidData.forEach(item => {
    amMap[item.pic_am] = (amMap[item.pic_am] || 0) + 1;
  });
  const topAmList = Object.entries(amMap).sort((a, b) => b[1] - a[1]);

  return (
    <div className="bg-gray-100 min-h-screen pb-10">
      <header className="bg-gradient-to-r from-[#E4002B] to-[#99001D] text-white shadow-md">
        <div className="max-w-6xl mx-auto p-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-black tracking-wide">TELKOM COLLECTION</h1>
            <p className="text-xs text-red-100">Piutang & Bukpot Generator</p>
          </div>
          <div className="flex gap-3">
            <Link href="/dashboard" className="text-xs bg-white text-[#E4002B] font-bold px-3 py-1.5 rounded hover:bg-gray-100 transition shadow">
              🔙 Ke Menu Utama
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-4 space-y-6 mt-4">
        
        {/* Form & Preview Text */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow p-5 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-gray-800 text-sm">➕ Input Data Piutang Klien</h3>
              
              <label className="cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow transition">
                📥 Bulk Import (Excel/CSV)
                <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>

            <form onSubmit={handleAddData} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">ID Pelanggan</label>
                  <input type="text" placeholder="Contoh: 5013136" value={idPelanggan} onChange={(e)=>setIdPelanggan(e.target.value)} required className="w-full border rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-[#E4002B] outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Nama PIC (Mas Ibay dsb)</label>
                  <input type="text" placeholder="Contoh: Mas Wildan" value={picAm} onChange={(e)=>setPicAm(e.target.value)} required className="w-full border rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-[#E4002B] outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Nama Pelanggan</label>
                <input type="text" placeholder="Contoh: PT.HOME WELL INDONESIA" value={namaPelanggan} onChange={(e)=>setNamaPelanggan(e.target.value)} required className="w-full border rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-[#E4002B] outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Kategori Piutang</label>
                <select value={kategori} onChange={(e)=>setKategori(e.target.value)} className="w-full border rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-[#E4002B] outline-none bg-white">
                  <option value="Piutang Bulan Berjalan">Piutang Bulan Berjalan</option>
                  <option value="Piutang Bukpot PPh">Piutang Bukpot PPh</option>
                  <option value="Piutang Tunggakan > 1 BLN">Piutang Tunggakan {'>'} 1 BLN</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Keterangan / Bulan (Opsional)</label>
                <input type="text" placeholder="Contoh: Tggkn Sept, Okt" value={keterangan} onChange={(e)=>setKeterangan(e.target.value)} className="w-full border rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-[#E4002B] outline-none" />
              </div>
              <button type="submit" className="w-full bg-[#E4002B] text-white font-bold py-2.5 rounded-lg text-xs hover:bg-gradient-to-r from-[#E4002B] to-[#99001D] transition shadow">
                + Tambah Tagihan Manual
              </button>
            </form>
          </div>

          {/* Live Preview + Input Text Editor Header Broadcast + Send Direct Telegram */}
          <div className="bg-gray-900 text-indigo-300 p-5 rounded-xl shadow font-mono text-xs flex flex-col justify-between space-y-3">
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-gray-400 font-sans font-bold text-xs">📱 Live Preview Broadcast:</span>
                <button onClick={() => { navigator.clipboard.writeText(broadcastText); alert('Teks broadcast disalin!'); }} className="bg-[#E4002B] hover:bg-[#c70025] text-white px-3 py-1.5 rounded text-xs font-sans font-bold transition shadow">
                  Copy Broadcast
                </button>
              </div>
              
              <div className="mb-3 font-sans">
                <select value={filterPic} onChange={(e) => setFilterPic(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-xs text-white font-bold focus:outline-none">
                  <option value="ALL">-- Generate Semua PIC --</option>
                  {uniquePics.map((pic, i) => (
                    <option key={i} value={pic}>Khusus {pic}</option>
                  ))}
                </select>
              </div>

              <pre className="whitespace-pre-wrap max-h-44 overflow-auto border-t border-gray-800 pt-3">{broadcastText}</pre>
            </div>

            {/* Send Direct to Telegram Box */}
            <div className="pt-2 border-t border-gray-800 font-sans space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <input type="text" placeholder="Bot Token" value={botToken} onChange={(e)=>setBotToken(e.target.value)} className="bg-gray-800 text-white text-[11px] p-2 rounded border border-gray-700 outline-none" />
                <input type="text" placeholder="Chat ID" value={chatId} onChange={(e)=>setChatId(e.target.value)} className="bg-gray-800 text-white text-[11px] p-2 rounded border border-gray-700 outline-none" />
              </div>
              <button onClick={handleSendTelegram} disabled={isSending} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded text-xs transition shadow">
                {isSending ? 'Mengirim...' : '✈️ Send Direct to Telegram'}
              </button>
            </div>

            {/* Editor Full Teks Pembuka Broadcast */}
            <div className="pt-2 border-t border-gray-800 font-sans">
              <label className="block text-[11px] text-gray-400 mb-1 font-semibold">✏️ Edit Kalimat Pembuka & Tag Broadcast (Manual):</label>
              <textarea
                rows="4"
                value={customHeaderText}
                onChange={(e) => setCustomHeaderText(e.target.value)}
                className="w-full bg-gray-800 text-white text-xs p-2 rounded border border-gray-700 focus:outline-none font-mono"
                placeholder="Ketik kalimat pembuka broadcast di sini..."
              ></textarea>
            </div>
          </div>
        </div>

        {/* Tabel Data Piutang + Analytics + Export */}
        <div className="bg-white rounded-xl shadow p-5 space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b pb-4">
            
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveTab('UNPAID')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
                  activeTab === 'UNPAID' ? 'bg-[#E4002B] text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                🔴 Tagihan Aktif ({unpaidData.length})
              </button>
              <button
                onClick={() => setActiveTab('PAID')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
                  activeTab === 'PAID' ? 'bg-emerald-600 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                ✅ Arsip Pelunasan ({paidData.length})
              </button>
              <button
                onClick={() => setActiveTab('ANALYTICS')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
                  activeTab === 'ANALYTICS' ? 'bg-gray-800 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                📊 Collection Analytics
              </button>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <button onClick={exportCollectionToExcel} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-2 rounded-lg transition shadow">
                📊 Excel
              </button>
              <button onClick={exportCollectionToPDF} className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-2 rounded-lg transition shadow">
                📄 PDF
              </button>
              <input
                type="text"
                placeholder="🔍 Cari ID / Nama / PIC..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full md:w-48 border rounded-lg p-2 text-xs focus:ring-2 focus:ring-[#E4002B] outline-none"
              />
            </div>
          </div>

          {/* Tab 3: Performance Analytics Dashboard */}
          {activeTab === 'ANALYTICS' ? (
            <div className="space-y-6 py-2">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 text-center">
                  <p className="text-3xl font-extrabold text-[#E4002B]">{totalItems}</p>
                  <p className="text-xs font-bold text-gray-600 mt-1">Total Entri Tagihan</p>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                  <p className="text-3xl font-extrabold text-emerald-600">{recoveryRate}%</p>
                  <p className="text-xs font-bold text-gray-600 mt-1">Collection Recovery Rate</p>
                </div>
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-center">
                  <p className="text-3xl font-extrabold text-rose-600">{unpaidData.length}</p>
                  <p className="text-xs font-bold text-gray-600 mt-1">Sisa Tagihan UNPAID</p>
                </div>
              </div>

              {/* Outstanding AM Summary */}
              <div className="bg-gray-50 border rounded-xl p-4 space-y-3">
                <h4 className="font-bold text-gray-800 text-xs">🏆 Outstanding AM Breakdown (Daftar Tunggakan Terbanyak)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {topAmList.length === 0 ? (
                    <p className="text-xs text-gray-500">Tidak ada tunggakan aktif.</p>
                  ) : (
                    topAmList.map(([am, count], idx) => (
                      <div key={idx} className="bg-white p-3 rounded-lg border flex justify-between items-center">
                        <span className="font-bold text-xs text-gray-700">{idx + 1}. {am}</span>
                        <span className="bg-red-100 text-red-700 text-xs font-bold px-2.5 py-1 rounded-full">{count} Tagihan</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Tab 1 & 2: Data Table */
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b bg-gray-50 text-gray-600">
                    <th className="p-3">PIC / AM</th>
                    <th className="p-3">ID Pelanggan</th>
                    <th className="p-3">Nama Klien</th>
                    <th className="p-3">Kategori</th>
                    <th className="p-3">Keterangan</th>
                    <th className="p-3">Timestamp Diinput</th>
                    <th className="p-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTableData.length === 0 ? (
                    <tr><td colSpan="7" className="text-center p-4 text-gray-500">Tidak ada data ditemukan</td></tr>
                  ) : (
                    filteredTableData.map((row) => (
                      <tr key={row.id} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-bold text-[#E4002B]">{row.pic_am}</td>
                        <td className="p-3 font-mono">{row.id_pelanggan}</td>
                        <td className="p-3 font-bold text-gray-800">{row.nama_pelanggan}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${row.kategori.includes('Bukpot') ? 'bg-amber-100 text-amber-700' : row.kategori.includes('Tunggakan') ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{row.kategori}</span>
                        </td>
                        <td className="p-3 text-gray-600">{row.keterangan_bulan || '-'}</td>
                        <td className="p-3 text-gray-500 text-[11px]">
                          {new Date(row.created_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {activeTab === 'UNPAID' ? (
                              <button 
                                onClick={() => handleMarkStatus(row, 'PAID')} 
                                className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-3 py-1.5 rounded-lg shadow transition"
                              >
                                ✅ TANDAI LUNAS
                              </button>
                            ) : (
                              <button 
                                onClick={() => handleMarkStatus(row, 'UNPAID')} 
                                className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-3 py-1.5 rounded-lg shadow transition"
                              >
                                ↩️ KEMBALIKAN UNPAID
                              </button>
                            )}
                            <button 
                              onClick={() => handleDelete(row.id)} 
                              className="bg-red-500 hover:bg-red-600 text-white font-bold px-3 py-1.5 rounded-lg shadow transition"
                              title="Hapus"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

