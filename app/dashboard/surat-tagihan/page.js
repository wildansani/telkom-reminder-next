'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SuratTagihanPage() {
  const [user, setUser] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  
  // State Data Surat
  const [nomorSurat, setNomorSurat] = useState('');
  const [tanggalSurat, setTanggalSurat] = useState(new Date().toISOString().slice(0, 10));
  const [namaPelanggan, setNamaPelanggan] = useState('');
  const [nomorLayanan, setNomorLayanan] = useState('');
  const [alamat, setAlamat] = useState('');
  const [periode, setPeriode] = useState('');
  const [totalTagihan, setTotalTagihan] = useState('');
  const [jatuhTempo, setJatuhTempo] = useState('');
  
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
  }, []);

  // Karena API baru memisahkan mode, kita minta mode=table dengan limit besar untuk dropdown
  const fetchCustomers = async (userId) => {
    try {
      const res = await fetch(`/api/indibiz?userId=${userId}&mode=table&limit=10000`);
      const json = await res.json();
      if (res.ok) {
        setCustomers(json.data || []);
      }
    } catch (err) {
      console.error('Gagal memuat pelanggan:', err);
    }
  };

  const handleSelectCustomer = (custId) => {
    setSelectedCustomerId(custId);
    const found = customers.find((c) => String(c.id) === String(custId));
    if (found) {
      setNamaPelanggan(found.nama_pelanggan || '');
      setNomorLayanan(found.nomor_layanan || '');
      setAlamat(found.alamat || '');
      setPeriode(found.periode || '');
      setTotalTagihan(found.nominal ? String(found.nominal) : '');
    }
  };

  const formatRupiah = (val) => {
    const num = parseInt(String(val).replace(/\D/g, ''), 10);
    if (isNaN(num)) return 'Rp 0';
    return 'Rp ' + num.toLocaleString('id-ID');
  };

  const handlePrint = () => {
    window.print();
  };

  if (!user) return null;

  return (
    <div className="bg-gray-100 min-h-screen pb-10">
      {/* Header Non-Print */}
      <header className="bg-gradient-to-r from-[#E4002B] via-[#B80022] to-slate-900 text-white shadow-md print:hidden">
        <div className="max-w-4xl mx-auto p-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-black tracking-wide">AUTO SURAT TAGIHAN</h1>
            <p className="text-xs text-red-100">Generator Surat Penagihan Otomatis</p>
          </div>
          <Link href="/dashboard" className="text-xs bg-white text-[#E4002B] font-bold px-3 py-1.5 rounded hover:bg-gray-100 transition shadow">
            🔙 Menu Utama
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-4 mt-4 space-y-4 print:hidden">
        {/* Panel Form */}
        <div className="bg-white rounded-xl shadow p-5 space-y-4 border border-slate-200">
          <div className="border-b pb-3">
            <h3 className="font-bold text-gray-800 text-sm">📝 Form Data Surat</h3>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-[#E4002B] mb-1">
                Pilih dari Master Pelanggan (Otomatis Isi Form)
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => handleSelectCustomer(e.target.value)}
                className="w-full border-2 border-red-200 bg-red-50/40 rounded-lg p-2.5 text-xs font-bold text-gray-800 focus:border-[#E4002B] outline-none"
              >
                <option value="">-- Pilih Pelanggan Terdaftar (Opsional) --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nama_pelanggan} ({c.nomor_layanan})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Nomor Surat</label>
                <input type="text" value={nomorSurat} onChange={(e) => setNomorSurat(e.target.value)} placeholder="Contoh: 001/TELKOM/XI/2026" className="w-full border rounded-lg p-2 text-xs focus:ring-2 focus:ring-[#E4002B] outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Tanggal Surat</label>
                <input type="date" value={tanggalSurat} onChange={(e) => setTanggalSurat(e.target.value)} className="w-full border rounded-lg p-2 text-xs focus:ring-2 focus:ring-[#E4002B] outline-none" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Nama Pelanggan</label>
                <input type="text" value={namaPelanggan} onChange={(e) => setNamaPelanggan(e.target.value)} className="w-full border rounded-lg p-2 text-xs font-bold focus:ring-2 focus:ring-[#E4002B] outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Nomor Layanan</label>
                <input type="text" value={nomorLayanan} onChange={(e) => setNomorLayanan(e.target.value)} className="w-full border rounded-lg p-2 text-xs font-mono focus:ring-2 focus:ring-[#E4002B] outline-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Alamat Pelanggan</label>
              <textarea value={alamat} onChange={(e) => setAlamat(e.target.value)} rows="2" className="w-full border rounded-lg p-2 text-xs focus:ring-2 focus:ring-[#E4002B] outline-none"></textarea>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Periode Tagihan</label>
                <input type="text" value={periode} onChange={(e) => setPeriode(e.target.value)} className="w-full border rounded-lg p-2 text-xs focus:ring-2 focus:ring-[#E4002B] outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Total Tagihan (Rp)</label>
                <input type="number" value={totalTagihan} onChange={(e) => setTotalTagihan(e.target.value)} className="w-full border rounded-lg p-2 text-xs font-bold focus:ring-2 focus:ring-[#E4002B] outline-none" />
                <span className="text-[10px] text-emerald-700 font-semibold">{formatRupiah(totalTagihan)}</span>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Jatuh Tempo</label>
                <input type="date" value={jatuhTempo} onChange={(e) => setJatuhTempo(e.target.value)} className="w-full border rounded-lg p-2 text-xs focus:ring-2 focus:ring-[#E4002B] outline-none" />
              </div>
            </div>
          </div>

          <button
            onClick={handlePrint}
            className="w-full bg-[#E4002B] hover:bg-[#B80022] text-white font-bold py-2.5 rounded-lg text-xs transition shadow"
          >
            🖨️ Cetak / Simpan sebagai PDF
          </button>
        </div>
      </div>

      {/* AREA HASIL PRINT (Tampil saat Print) */}
      <div className="max-w-4xl mx-auto bg-white p-8 shadow border print:shadow-none print:border-none print:p-0 mt-6">
        {/* Kop Surat */}
        <div className="border-b-4 border-double border-gray-800 pb-4 mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-[#E4002B]">TELKOM INDONESIA</h2>
            <p className="text-xs text-gray-600 mt-1">PT Telekomunikasi Indonesia (Persero) Tbk</p>
            <p className="text-xs text-gray-600">Divisi Enterprise & Business Service</p>
            <p className="text-xs text-gray-600">Priangan Timur</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold">{nomorSurat || 'No. Surat Belum Diisi'}</p>
            <p className="text-xs text-gray-600">{new Date(tanggalSurat).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
        </div>

        {/* Isi Surat */}
        <div className="text-sm text-gray-800 leading-relaxed space-y-4">
          <p>Kepada Yth,</p>
          <p className="font-bold text-base">{namaPelanggan || '[Nama Pelanggan]'}</p>
          <p className="whitespace-pre-wrap">{alamat || '[Alamat Pelanggan]'}</p>
          <p className="font-mono">No. Layanan: {nomorLayanan || '[Nomor Layanan]'}</p>

          <p className="pt-4">Dengan hormat,</p>
          <p>
            Berdasarkan catatan administrasi kami, saat ini terdapat tagihan layanan Indibiz yang belum diselesaikan dengan rincian sebagai berikut:
          </p>

          <table className="w-full border-collapse border border-gray-300">
            <tbody>
              <tr>
                <td className="border border-gray-300 p-2 font-bold bg-gray-50 w-1/3">Periode Tagihan</td>
                <td className="border border-gray-300 p-2">{periode || '-'}</td>
              </tr>
              <tr>
                <td className="border border-gray-300 p-2 font-bold bg-gray-50">Total Tagihan</td>
                <td className="border border-gray-300 p-2 font-black text-[#E4002B]">{formatRupiah(totalTagihan)}</td>
              </tr>
              <tr>
                <td className="border border-gray-300 p-2 font-bold bg-gray-50">Batas Jatuh Tempo</td>
                <td className="border border-gray-300 p-2">{jatuhTempo ? new Date(jatuhTempo).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}</td>
              </tr>
            </tbody>
          </table>

          <p className="pt-4">
            Kami mohon kesediaan Bapak/Ibu untuk dapat menyelesaikan pembayaran tagihan tersebut sebelum tanggal jatuh tempo. Apabila pembayaran telah dilakukan, mohon dapat mengabaikan surat ini atau mengirimkan bukti transfer kepada kami.
          </p>
          <p>
            Demikian surat ini kami sampaikan. Atas perhatian dan kerja sama Bapak/Ibu, kami ucapkan terima kasih.
          </p>
        </div>

        {/* Tanda Tangan */}
        <div className="mt-12 flex justify-end">
          <div className="text-center">
            <p className="text-sm">Hormat kami,</p>
            <p className="text-sm font-bold mt-1">PT TELKOM INDONESIA</p>
            <div className="h-20"></div>
            <p className="text-sm font-bold underline">Account Manager</p>
          </div>
        </div>
      </div>
      
      {/* CSS Print Khusus */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body { background-color: white !important; }
          @page { size: A4; margin: 20mm; }
          .print\\:hidden { display: none !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:border-none { border: none !important; }
          .print\\:p-0 { padding: 0 !important; }
        }
      `}} />
    </div>
  );
}
