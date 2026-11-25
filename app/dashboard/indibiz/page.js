'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function IndibizBillingPage() {
  const [user, setUser] = useState(null);
  const [customers, setCustomers] = useState([]);

  // Default Periode Bulan & Tahun Berjalan
  const defaultPeriode = new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  const currentHour = new Date().getHours();
  const autoGreeting = currentHour < 11 ? 'Selamat Pagi' : currentHour < 15 ? 'Selamat Siang' : currentHour < 18 ? 'Selamat Sore' : 'Selamat Malam';

  // State Generator Chat Cepat
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [greeting, setGreeting] = useState(autoGreeting);
  const [genNomorLayanan, setGenNomorLayanan] = useState('131236110447');
  const [genNamaPelanggan, setGenNamaPelanggan] = useState('MTSN 1 CIREBON');
  const [genNoWa, setGenNoWa] = useState('');
  const [genPeriode, setGenPeriode] = useState(defaultPeriode);
  const [genNominal, setGenNominal] = useState('909090');
  const [editableMessage, setEditableMessage] = useState('');

  // State Tambah Master Pelanggan
  const [newNomor, setNewNomor] = useState('');
  const [newNama, setNewNama] = useState('');
  const [newWa, setNewWa] = useState('');
  const [newNominal, setNewNominal] = useState('');

  // State Search & Filter Tabel
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const router = useRouter();

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (!savedUser) {
      router.push('/login');
    } else {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      fetchCustomers(parsedUser.id);
    }

    const scriptXlsx = document.createElement('script');
    scriptXlsx.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
    document.body.appendChild(scriptXlsx);
  }, []);

  const fetchCustomers = async (userId) => {
    const res = await fetch(`/api/indibiz?userId=${userId}`);
    const result = await res.json();
    if (res.ok) {
      setCustomers(result.data);
    }
  };

  // Format angka ke Rupiah (contoh: 909090 -> Rp 909.090)
  const formatRupiah = (angka) => {
    const num = parseInt(String(angka).replace(/\D/g, ''), 10);
    if (isNaN(num)) return 'Rp 0';
    return 'Rp ' + num.toLocaleString('id-ID');
  };

  // Update otomatis isi template chat saat pelanggan/nominal/periode/sapaan berubah
  useEffect(() => {
    const formattedTotal = formatRupiah(genNominal);
    const msg = `${greeting} ${genNamaPelanggan}
Yth. Bapak/Ibu 
Mohon izin melakukan tindak lanjut pengingat pembayaran tagihan layanan Indibiz. Berdasarkan pengecekan pada sistem kami, saat ini belum terdapat catatan pembayaran untuk nomor layanan [${genNomorLayanan}] a.n [${genNamaPelanggan}] dengan rincian sebagai berikut:
Periode Tagihan: ${genPeriode}
Total Tagihan: ${formattedTotal}

Izin mengingatkan dan mengonfirmasi kembali terkait rencana pembayaran tagihan tersebut ya Pak/Bu. Apabila sudah melakukan pembayaran, mohon abaikan pesan ini atau dapat mengirimkan bukti transfernya.

Terima kasih.

Billing Telkom Priangan Timur`;

    setEditableMessage(msg);
  }, [greeting, genNomorLayanan, genNamaPelanggan, genPeriode, genNominal]);

  // Saat memilih pelanggan dari dropdown
  const handleSelectCustomer = (custId) => {
    setSelectedCustomerId(custId);
    const found = customers.find((c) => String(c.id) === String(custId));
    if (found) {
      setGenNomorLayanan(found.nomor_layanan);
      setGenNamaPelanggan(found.nama_pelanggan);
      setGenNoWa(found.no_wa || '');
      if (found.periode) setGenPeriode(found.periode);
      if (found.nominal) setGenNominal(String(found.nominal));
    }
  };

  // Simpan revisi nominal/periode/status ke database saat kirim/simpan
  const handleSaveAndSyncCustomer = async (newStatus = 'SUDAH_CHAT') => {
    if (!selectedCustomerId) return;
    const found = customers.find((c) => String(c.id) === String(selectedCustomerId));
    if (!found) return;

    await fetch('/api/indibiz', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: found.id,
        nomorLayanan: genNomorLayanan,
        namaPelanggan: genNamaPelanggan,
        noWa: genNoWa,
        periode: genPeriode,
        nominal: parseInt(String(genNominal).replace(/\D/g, ''), 10) || 0,
        statusChat: newStatus,
      }),
    });
    fetchCustomers(user.id);
  };

  const handleOpenWhatsApp = async () => {
    const cleanPhone = String(genNoWa).replace(/\D/g, '');
    let waPhone = cleanPhone;
    if (waPhone.startsWith('0')) {
      waPhone = '62' + waPhone.slice(1);
    }

    if (selectedCustomerId) {
      await handleSaveAndSyncCustomer('SUDAH_CHAT');
    }

    const encodedText = encodeURIComponent(editableMessage);
    const waUrl = waPhone
      ? `https://wa.me/${waPhone}?text=${encodedText}`
      : `https://wa.me/?text=${encodedText}`;

    window.open(waUrl, '_blank');
  };

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    if (!newNomor || !newNama) return;

    const res = await fetch('/api/indibiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        nomorLayanan: newNomor,
        namaPelanggan: newNama,
        noWa: newWa,
        periode: defaultPeriode,
        nominal: parseInt(String(newNominal).replace(/\D/g, ''), 10) || 0,
      }),
    });

    if (res.ok) {
      setNewNomor('');
      setNewNama('');
      setNewWa('');
      setNewNominal('');
      fetchCustomers(user.id);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file || !window.XLSX) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const bstr = evt.target.result;
      const wb = window.XLSX.read(bstr, { type: 'binary' });

      const existingIds = new Set(customers.map((c) => String(c.nomor_layanan).trim()));
      const itemsToInsert = [];

      // Baca seluruh sheet di workbook
      for (const sheetName of wb.SheetNames) {
        const rows = window.XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1, defval: '' });

        for (const cols of rows) {
          if (!Array.isArray(cols) || cols.length === 0) continue;

          const cleanCols = cols.map((c) => String(c ?? '').trim());
          const joinedLower = cleanCols.join(' ').toLowerCase();
          if (joinedLower.includes('nomor layanan') || joinedLower.includes('nama pelanggan')) continue;

          let nomor = '';
          let nama = '';
          let wa = '';
          let nominal = 0;

          // Pola 1: Kolom A adalah status (UNPAID/PAID/dll)
          if (cleanCols.length >= 3 && /^(unpaid|paid|partial|lunas|belum)/i.test(cleanCols[0])) {
            nomor = cleanCols[1].replace(/\D/g, '');
            nama = cleanCols[2];
            wa = cleanCols[3] || '';
            nominal = parseInt(String(cleanCols[4] || '0').replace(/\D/g, ''), 10) || 0;
          } else {
            // Pola 2: Deteksi fleksibel semua kolom (angka 9-16 digit = ID Layanan)
            for (const val of cleanCols) {
              if (!val) continue;
              const digits = val.replace(/\D/g, '');
              if (!nomor && digits.length >= 9 && digits.length <= 16 && !/^(08|628|8)\d{8,12}$/.test(digits)) {
                nomor = digits;
              } else if (!wa && (/^(08|628|8)\d{7,13}/.test(digits) || val.includes(';'))) {
                wa = val;
              } else if (!nama && /[a-zA-Z]{2,}/.test(val) && !/^(unpaid|paid|partial|lunas)$/i.test(val)) {
                nama = val;
              }
            }
          }

          if (wa) {
            const firstWa = wa.split(/[;,/]/)[0].replace(/\D/g, '');
            wa = firstWa.startsWith('8') ? '0' + firstWa : firstWa;
          }

          if (nomor && nama && !existingIds.has(nomor)) {
            existingIds.add(nomor);
            itemsToInsert.push({
              nomorLayanan: String(nomor),
              namaPelanggan: String(nama).replace(/\s+/g, ' '),
              noWa: String(wa),
              periode: defaultPeriode,
              nominal,
            });
          }
        }
      }

      if (itemsToInsert.length === 0) {
        alert('⚠️ Tidak ada data baru yang ditemukan (semua nomor layanan sudah ada atau format belum terbaca).');
        e.target.value = '';
        return;
      }

      const res = await fetch('/api/indibiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, items: itemsToInsert }),
      });

      if (res.ok) {
        alert(`🚀 Berhasil mengimpor ${itemsToInsert.length} master pelanggan Indibiz baru!`);
        fetchCustomers(user.id);
      } else {
        alert('❌ Gagal mengimpor data ke database.');
      }
      e.target.value = '';
    };
    reader.readAsBinaryString(file);
  };
  const handleStatusChange = async (cust, newStatus) => {
    const res = await fetch('/api/indibiz', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: cust.id,
        nomorLayanan: cust.nomor_layanan,
        namaPelanggan: cust.nama_pelanggan,
        noWa: cust.no_wa || '',
        periode: cust.periode || defaultPeriode,
        nominal: cust.nominal || 0,
        statusChat: newStatus,
      }),
    });
    if (res.ok) fetchCustomers(user.id);
  };

  const handleClearAll = async () => {
    if (!confirm('⚠️ Yakin ingin mengosongkan SEMUA data pelanggan Indibiz agar bisa import ulang dari awal?')) return;
    const res = await fetch(`/api/indibiz?clearAllUserId=${user.id}`, { method: 'DELETE' });
    if (res.ok) {
      setSelectedCustomerId('');
      fetchCustomers(user.id);
      alert('🧹 Semua data berhasil dikosongkan! Silakan import ulang file Excel kamu.');
    }
  };

  const handleDeleteCustomer = async (id) => {
    if (!confirm('Hapus data pelanggan ini dari daftar?')) return;
    const res = await fetch(`/api/indibiz?id=${id}`, { method: 'DELETE' });
    if (res.ok) fetchCustomers(user.id);
  };

  if (!user) return null;

  const filteredCustomers = customers.filter((c) => {
    const matchesSearch =
      c.nama_pelanggan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.nomor_layanan.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || (c.status_chat || 'BELUM_CHAT') === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="bg-gray-100 min-h-screen pb-10">
      <header className="bg-gradient-to-r from-[#E4002B] to-[#99001D] text-white shadow-md">
        <div className="max-w-6xl mx-auto p-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-black tracking-wide">INDIBIZ BILLING REMINDER</h1>
            <p className="text-xs text-red-100">Auto Chat Generator • Billing Telkom Priangan Timur</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-xs bg-white text-[#E4002B] font-bold px-3 py-1.5 rounded hover:bg-gray-100 transition shadow">
              🔙 Menu Utama
            </Link>
            <span className="text-xs bg-black/30 px-3 py-1 rounded-full font-bold hidden sm:inline">
              {user.nama_lengkap}
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-4 space-y-6 mt-2">
        {/* Bagian 1: Generator Chat Otomatis & Live Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Panel Kiri: Pilih Pelanggan & Revisi Nominal */}
          <div className="bg-white rounded-xl shadow p-5 space-y-4">
            <div className="border-b pb-3">
              <h3 className="font-bold text-gray-800 text-sm">⚡ Generator Chat Pengingat Pelanggan</h3>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Pilih pelanggan dari master data, cek nominal tagihan, lalu langsung kirim atau copy.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#E4002B] mb-1">
                  1. Pilih Pelanggan (Otomatis Isi Nomor Layanan & Nama)
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => handleSelectCustomer(e.target.value)}
                  className="w-full border-2 border-red-200 bg-red-50/40 rounded-lg p-2.5 text-xs font-bold text-gray-800 focus:border-[#E4002B] outline-none"
                >
                  <option value="">-- Pilih Pelanggan ({customers.length} Tersimpan) atau Isi Manual --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nama_pelanggan} ({c.nomor_layanan}) {c.status_chat === 'SUDAH_CHAT' ? '✅' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Waktu Sapaan</label>
                  <select
                    value={greeting}
                    onChange={(e) => setGreeting(e.target.value)}
                    className="w-full border rounded-lg p-2 text-xs bg-white focus:ring-2 focus:ring-[#E4002B] outline-none"
                  >
                    <option value="Selamat Pagi">Selamat Pagi</option>
                    <option value="Selamat Siang">Selamat Siang</option>
                    <option value="Selamat Sore">Selamat Sore</option>
                    <option value="Selamat Malam">Selamat Malam</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Periode Tagihan</label>
                  <input
                    type="text"
                    value={genPeriode}
                    onChange={(e) => setGenPeriode(e.target.value)}
                    placeholder="Contoh: November 2026"
                    className="w-full border rounded-lg p-2 text-xs focus:ring-2 focus:ring-[#E4002B] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Nomor Layanan (ND)</label>
                  <input
                    type="text"
                    value={genNomorLayanan}
                    onChange={(e) => setGenNomorLayanan(e.target.value)}
                    className="w-full border rounded-lg p-2 text-xs font-mono focus:ring-2 focus:ring-[#E4002B] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">No. WhatsApp (Opsional)</label>
                  <input
                    type="text"
                    placeholder="0812xxxx"
                    value={genNoWa}
                    onChange={(e) => setGenNoWa(e.target.value)}
                    className="w-full border rounded-lg p-2 text-xs font-mono focus:ring-2 focus:ring-[#E4002B] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Nama Pelanggan</label>
                  <input
                    type="text"
                    value={genNamaPelanggan}
                    onChange={(e) => setGenNamaPelanggan(e.target.value)}
                    className="w-full border rounded-lg p-2 text-xs font-bold focus:ring-2 focus:ring-[#E4002B] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-emerald-700 mb-1">
                    2. Revisi Total Tagihan (Angka)
                  </label>
                  <input
                    type="number"
                    value={genNominal}
                    onChange={(e) => setGenNominal(e.target.value)}
                    placeholder="909090"
                    className="w-full border-2 border-emerald-300 bg-emerald-50/40 rounded-lg p-2 text-xs font-extrabold text-emerald-900 focus:border-emerald-600 outline-none"
                  />
                  <span className="text-[10px] text-emerald-700 font-semibold">
                    Format: {formatRupiah(genNominal)}
                  </span>
                </div>
              </div>

              {selectedCustomerId && (
                <button
                  type="button"
                  onClick={() => {
                    handleSaveAndSyncCustomer('BELUM_CHAT');
                    alert('✅ Perubahan nominal & periode pelanggan tersimpan ke database!');
                  }}
                  className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-2 rounded-lg text-xs transition"
                >
                  💾 Simpan Update Nominal ke Master Pelanggan
                </button>
              )}
            </div>
          </div>

          {/* Panel Kanan: Live Preview & Tombol Kirim WA / Copy */}
          <div className="bg-gray-900 text-emerald-300 p-5 rounded-xl shadow flex flex-col justify-between space-y-3">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-300 font-bold text-xs">💬 Live Preview Pesan (Bisa Diedit Manual):</span>
                <button
                  onClick={async () => {
                    navigator.clipboard.writeText(editableMessage);
                    if (selectedCustomerId) await handleSaveAndSyncCustomer('SUDAH_CHAT');
                    alert('📋 Pesan berhasil disalin!');
                  }}
                  className="bg-[#E4002B] hover:bg-[#c70025] text-white px-3 py-1.5 rounded text-xs font-bold transition shadow"
                >
                  📋 Copy Pesan
                </button>
              </div>

              <textarea
                rows="14"
                value={editableMessage}
                onChange={(e) => setEditableMessage(e.target.value)}
                className="w-full bg-gray-800 text-white p-3.5 rounded-lg border border-gray-700 focus:border-emerald-400 focus:outline-none text-xs leading-relaxed font-sans"
              />
            </div>

            <button
              onClick={handleOpenWhatsApp}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-lg text-xs transition shadow flex items-center justify-center gap-2"
            >
              <span>📲 Kirim Langsung ke WhatsApp & Tandai Sudah Chat</span>
            </button>
          </div>
        </div>

        {/* Bagian 2: Master Data Pelanggan Indibiz (Input Manual & Bulk Import Excel) */}
        <div className="bg-white rounded-xl shadow p-5 space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b pb-3">
            <div>
              <h3 className="font-bold text-gray-800 text-sm">🗂️ Master Data Pelanggan Indibiz</h3>
              <p className="text-[11px] text-gray-500">
                Simpan daftar pelanggan sekali saja (atau upload Excel) agar tinggal pilih saat kirim reminder.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <label className="cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-lg shadow transition">
                📥 Import Master Pelanggan (Excel/CSV)
                <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} className="hidden" />
              </label>
              {customers.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-3.5 py-2 rounded-lg shadow transition"
                >
                  🗑️ Reset Semua ({customers.length})
                </button>
              )}
            </div>
          </div>

          {/* Form Tambah Cepat Master Pelanggan */}
          <form onSubmit={handleAddCustomer} className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 bg-gray-50 p-3 rounded-xl border">
            <input
              type="text"
              placeholder="Nomor Layanan (131236...)"
              value={newNomor}
              onChange={(e) => setNewNomor(e.target.value)}
              required
              className="border rounded-lg p-2 text-xs bg-white outline-none focus:ring-2 focus:ring-[#E4002B]"
            />
            <input
              type="text"
              placeholder="Nama Pelanggan (MTSN 1...)"
              value={newNama}
              onChange={(e) => setNewNama(e.target.value)}
              required
              className="border rounded-lg p-2 text-xs bg-white outline-none focus:ring-2 focus:ring-[#E4002B]"
            />
            <input
              type="text"
              placeholder="No. WA (0812...)"
              value={newWa}
              onChange={(e) => setNewWa(e.target.value)}
              className="border rounded-lg p-2 text-xs bg-white outline-none focus:ring-2 focus:ring-[#E4002B]"
            />
            <input
              type="number"
              placeholder="Tagihan Default (909090)"
              value={newNominal}
              onChange={(e) => setNewNominal(e.target.value)}
              className="border rounded-lg p-2 text-xs bg-white outline-none focus:ring-2 focus:ring-[#E4002B]"
            />
            <button
              type="submit"
              className="bg-[#E4002B] hover:bg-[#B80022] text-white font-bold rounded-lg p-2 text-xs transition shadow"
            >
              + Tambah Pelanggan
            </button>
          </form>

          {/* Filter & Search Tabel */}
          <div className="flex flex-wrap justify-between items-center gap-2 pt-1">
            <div className="flex gap-2">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold ${statusFilter === 'ALL' ? 'bg-slate-800 text-white' : 'bg-gray-100 text-gray-600'}`}
              >
                Semua ({customers.length})
              </button>
              <button
                onClick={() => setStatusFilter('BELUM_CHAT')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold ${statusFilter === 'BELUM_CHAT' ? 'bg-[#E4002B] text-white' : 'bg-gray-100 text-gray-600'}`}
              >
                ⏳ Belum Di-Chat ({customers.filter((c) => (c.status_chat || 'BELUM_CHAT') === 'BELUM_CHAT').length})
              </button>
              <button
                onClick={() => setStatusFilter('SUDAH_CHAT')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold ${statusFilter === 'SUDAH_CHAT' ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-600'}`}
              >
                💬 Sudah Di-Chat ({customers.filter((c) => c.status_chat === 'SUDAH_CHAT').length})
              </button>
              <button
                onClick={() => setStatusFilter('LUNAS')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold ${statusFilter === 'LUNAS' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600'}`}
              >
                ✅ Lunas ({customers.filter((c) => c.status_chat === 'LUNAS').length})
              </button>
            </div>

            <input
              type="text"
              placeholder="🔍 Cari Nomor Layanan / Nama..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border rounded-lg p-2 text-xs w-full sm:w-56 outline-none focus:ring-2 focus:ring-[#E4002B]"
            />
          </div>

          {/* Tabel Daftar Pelanggan */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b bg-gray-50 text-gray-600">
                  <th className="p-3">No</th>
                  <th className="p-3">Nomor Layanan</th>
                  <th className="p-3">Nama Pelanggan</th>
                  <th className="p-3">No. WA</th>
                  <th className="p-3">Tagihan Terakhir</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center p-4 text-gray-500">
                      Belum ada data pelanggan. Tambahkan di atas atau import file Excel.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((row, idx) => (
                    <tr key={row.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-semibold">{idx + 1}</td>
                      <td className="p-3 font-mono font-bold text-slate-700">{row.nomor_layanan}</td>
                      <td className="p-3 font-bold text-gray-800">{row.nama_pelanggan}</td>
                      <td className="p-3 font-mono text-gray-600">{row.no_wa || '-'}</td>
                      <td className="p-3 font-bold text-emerald-700">{formatRupiah(row.nominal)}</td>
                      <td className="p-3">
                        <select
                          value={row.status_chat || 'BELUM_CHAT'}
                          onChange={(e) => handleStatusChange(row, e.target.value)}
                          className={`p-1.5 rounded-lg font-bold text-xs border outline-none ${
                            row.status_chat === 'LUNAS'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : row.status_chat === 'SUDAH_CHAT'
                              ? 'bg-amber-100 text-amber-800 border-amber-300'
                              : 'bg-red-50 text-[#E4002B] border-red-200'
                          }`}
                        >
                          <option value="BELUM_CHAT">⏳ Belum Di-Chat</option>
                          <option value="SUDAH_CHAT">💬 Sudah Di-Chat</option>
                          <option value="LUNAS">✅ Lunas</option>
                        </select>
                      </td>
                      <td className="p-3 text-center space-x-1.5">
                        <button
                          onClick={() => {
                            handleSelectCustomer(row.id);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-2.5 py-1 rounded text-xs transition shadow"
                        >
                          ⚡ Pilih & Chat
                        </button>
                        <button
                          onClick={() => handleDeleteCustomer(row.id)}
                          className="bg-[#E4002B] hover:bg-[#B80022] text-white font-bold px-2.5 py-1 rounded text-xs transition shadow"
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}



