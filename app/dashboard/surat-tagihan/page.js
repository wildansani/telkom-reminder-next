'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Komponen SVG Logo Telkom Indonesia ("the world in your hand") identik dengan kop surat resmi
function TelkomHandLogoSvg({ width = 175 }) {
  return (
    <svg width={width} viewBox="0 0 320 115" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Teks Telkom Indonesia */}
      <text x="195" y="48" textAnchor="end" fill="#4D4D4F" fontFamily="Arial, Helvetica, sans-serif" fontWeight="800" fontSize="31" letterSpacing="-0.8">
        Telkom
      </text>
      <text x="195" y="76" textAnchor="end" fill="#4D4D4F" fontFamily="Arial, Helvetica, sans-serif" fontWeight="800" fontSize="29" letterSpacing="-0.8">
        Indonesia
      </text>
      <text x="195" y="95" textAnchor="end" fill="#6D6E71" fontFamily="Arial, Helvetica, sans-serif" fontStyle="italic" fontSize="12.5">
        the world in your hand
      </text>

      {/* Simbol Tangan & Lengkungan Merah Telkom di sebelah kanan */}
      <g transform="translate(205, 8)">
        {/* Jari-jari tangan merah */}
        <path d="M36 6 C38 2, 43 3, 42 8 L37 28 L31 27 Z" fill="#E4002B" />
        <path d="M50 3 C53 0, 58 2, 56 7 L47 29 L41 27 Z" fill="#E4002B" />
        <path d="M64 7 C68 4, 72 7, 69 12 L56 32 L51 29 Z" fill="#E4002B" />
        <path d="M76 16 C80 14, 83 18, 79 22 L63 38 L59 34 Z" fill="#E4002B" />
        <path d="M21 15 C22 11, 27 11, 27 16 L28 33 L22 33 Z" fill="#E4002B" />

        {/* Lengkungan telapak & bola dunia */}
        <path
          d="M14 48 C14 31, 29 22, 48 24 C66 26, 79 40, 77 57 C75 72, 62 82, 46 82 C36 82, 27 77, 22 69 C28 73, 36 75, 44 74 C57 72, 66 62, 65 49 C64 37, 53 30, 41 31 C29 32, 21 41, 21 53 C21 58, 23 63, 26 67 C18 62, 14 55, 14 48 Z"
          fill="#E4002B"
        />
        {/* Aksen bayangan abu-abu khas Telkom */}
        <path
          d="M24 66 C32 76, 48 80, 61 73 C72 67, 78 55, 76 43 C81 55, 77 70, 65 79 C52 88, 34 86, 24 74 Z"
          fill="#808285"
        />
      </g>
    </svg>
  );
}

export default function SuratTagihanPage() {
  const [user, setUser] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');

  const todayIndo = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Form Data Surat
  const [nomorSurat, setNomorSurat] = useState('C.Tel. /CBN/YN 000/ T2W-0H000000/2026');
  const [kotaTanggal, setKotaTanggal] = useState(`Tasikmalaya, ${todayIndo}`);
  const [namaPelanggan, setNamaPelanggan] = useState('DINAS KESEHATAN KAB');
  const [alamatPelanggan, setAlamatPelanggan] = useState('MT HARYONO, No. NO.09 45222 KABUPATEN INDRAMAYU');
  const [nomorLayanan, setNomorLayanan] = useState('131263104356');
  const [batasWaktu, setBatasWaktu] = useState('30 November 2026');
  const [namaPic, setNamaPic] = useState('Shokikah');
  const [telpPic, setTelpPic] = useState('085137634949');
  const [qrLink, setQrLink] = useState('https://myindibiz.co.id');
  const [namaGm, setNamaGm] = useState('Nugroho Setio Budi');
  const [jabatanGm, setJabatanGm] = useState('GM Witel Priangan Timur');

  // State Upload Foto Tanda Tangan (TTD) & Opsional Custom Logo
  const [signatureDataUrl, setSignatureDataUrl] = useState('');
  const [customLogoUrl, setCustomLogoUrl] = useState('/logo-telkom.png');

  // Baris Tabel Rincian Tunggakan (Dinamis)
  const [rows, setRows] = useState([
    { bulan: 'Agustus 2026', jumlah: '763000', keterangan: 'Pemakaian bulan Mei 2026' },
    { bulan: 'September 2026', jumlah: '763000', keterangan: 'Pemakaian bulan Juni 2026' },
    { bulan: 'Oktober 2026', jumlah: '777000', keterangan: 'Pemakaian bulan Juli 2026' },
  ]);

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

    // Muat TTD & Logo tersimpan di browser jika pernah di-upload sebelumnya
    const savedTtd = localStorage.getItem('telkom_gm_signature');
    if (savedTtd) setSignatureDataUrl(savedTtd);

    const savedLogo = localStorage.getItem('telkom_custom_logo');
    if (savedLogo) setCustomLogoUrl(savedLogo);
  }, []);

  const fetchCustomers = async (userId) => {
    try {
      const res = await fetch(`/api/indibiz?userId=${userId}&mode=table&limit=10000`);
      if (res.ok) {
        const json = await res.json(); const result = json.data || json;
        setCustomers(result.data || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Handler Upload Foto TTD (Otomatis simpan ke localStorage agar tidak perlu upload berulang kali)
  const handleUploadSignature = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const base64 = evt.target.result;
      setSignatureDataUrl(base64);
      localStorage.setItem('telkom_gm_signature', base64);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveSignature = () => {
    setSignatureDataUrl('');
    localStorage.removeItem('telkom_gm_signature');
  };

  // Handler Upload Logo Custom (Opsional jika ingin pakai file gambar sendiri)
  const handleUploadLogo = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const base64 = evt.target.result;
      setCustomLogoUrl(base64);
      localStorage.setItem('telkom_custom_logo', base64);
    };
    reader.readAsDataURL(file);
  };

  const handleResetLogo = () => {
    setCustomLogoUrl('');
    setCustomLogoUrl('/logo-telkom.png'); localStorage.removeItem('telkom_custom_logo');
  };

  const handleSelectCustomer = (custId) => {
    setSelectedCustomerId(custId);
    const found = customers.find((c) => String(c.id) === String(custId));
    if (found) {
      setNamaPelanggan(found.nama_pelanggan);
      setNomorLayanan(found.nomor_layanan);
      if (found.alamat) setAlamatPelanggan(found.alamat);
      if (found.alamat) setAlamatPelanggan(found.alamat);
      if (found.nominal && Number(found.nominal) > 0) {
        setRows([
          {
            bulan: found.periode || 'Tagihan Berjalan',
            jumlah: String(found.nominal),
            keterangan: `Pemakaian layanan Indibiz (${found.periode || 'Berjalan'})`,
          },
        ]);
      }
    }
  };

  const handleRowChange = (index, field, value) => {
    const updated = [...rows];
    updated[index][field] = value;
    setRows(updated);
  };

  const addRow = () => {
    setRows([...rows, { bulan: '', jumlah: '0', keterangan: '' }]);
  };

  const removeRow = (index) => {
    if (rows.length <= 1) return;
    setRows(rows.filter((_, i) => i !== index));
  };

  const formatRupiahComma = (val) => {
    const num = parseInt(String(val).replace(/\D/g, ''), 10) || 0;
    return 'Rp ' + num.toLocaleString('en-US');
  };

  const totalTunggakan = rows.reduce((sum, r) => {
    return sum + (parseInt(String(r.jumlah).replace(/\D/g, ''), 10) || 0);
  }, 0);

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(
    qrLink || nomorLayanan
  )}`;

  const handlePrintPDF = () => {
    const tableBodyHtml = rows
      .map(
        (r) => `
        <tr>
          <td style="border: 1px solid #222; padding: 3.5px 8px; text-align: center;">${r.bulan}</td>
          <td style="border: 1px solid #222; padding: 3.5px 8px; text-align: center;">${formatRupiahComma(r.jumlah)}</td>
          <td style="border: 1px solid #222; padding: 3.5px 8px; text-align: left;">${r.keterangan}</td>
        </tr>
      `
      )
      .join('');

    const logoHtml = customLogoUrl
      ? `<img src="${customLogoUrl}" alt="Logo Telkom" style="height: 52px; object-fit: contain;" />`
      : `<svg width="160" viewBox="0 0 320 115" fill="none" xmlns="http://www.w3.org/2000/svg">
          <text x="195" y="48" text-anchor="end" fill="#4D4D4F" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="31" letter-spacing="-0.8">Telkom</text>
          <text x="195" y="76" text-anchor="end" fill="#4D4D4F" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="29" letter-spacing="-0.8">Indonesia</text>
          <text x="195" y="95" text-anchor="end" fill="#6D6E71" font-family="Arial, Helvetica, sans-serif" font-style="italic" font-size="12.5">the world in your hand</text>
          <g transform="translate(205, 8)">
            <path d="M36 6 C38 2, 43 3, 42 8 L37 28 L31 27 Z" fill="#E4002B" />
            <path d="M50 3 C53 0, 58 2, 56 7 L47 29 L41 27 Z" fill="#E4002B" />
            <path d="M64 7 C68 4, 72 7, 69 12 L56 32 L51 29 Z" fill="#E4002B" />
            <path d="M76 16 C80 14, 83 18, 79 22 L63 38 L59 34 Z" fill="#E4002B" />
            <path d="M21 15 C22 11, 27 11, 27 16 L28 33 L22 33 Z" fill="#E4002B" />
            <path d="M14 48 C14 31, 29 22, 48 24 C66 26, 79 40, 77 57 C75 72, 62 82, 46 82 C36 82, 27 77, 22 69 C28 73, 36 75, 44 74 C57 72, 66 62, 65 49 C64 37, 53 30, 41 31 C29 32, 21 41, 21 53 C21 58, 23 63, 26 67 C18 62, 14 55, 14 48 Z" fill="#E4002B" />
            <path d="M24 66 C32 76, 48 80, 61 73 C72 67, 78 55, 76 43 C81 55, 77 70, 65 79 C52 88, 34 86, 24 74 Z" fill="#808285" />
          </g>
        </svg>`;

    const signatureHtml = signatureDataUrl
      ? `<div style="height: 52px; display: flex; align-items: center; margin: 1px 0;">
           <img src="${signatureDataUrl}" alt="Tanda Tangan" style="max-height: 52px; max-width: 165px; object-fit: contain; mix-blend-mode: multiply;" />
         </div>`
      : `<div style="height: 48px;"></div>`;

    const printWindow = window.open('', '_blank');
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Surat Tagihan - ${namaPelanggan}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 11mm 17mm 10mm 17mm;
            }
            @media print {
              html, body {
                width: 210mm;
                height: 297mm;
                margin: 0;
                padding: 0;
                overflow: hidden;
              }
            }
            body {
              font-family: "Times New Roman", Times, serif;
              font-size: 10.5pt;
              line-height: 1.28;
              color: #111;
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            .header-logo {
              display: flex;
              justify-content: flex-end;
              align-items: center;
              margin-bottom: 4px;
            }
            .meta-block { margin-bottom: 6px; }
            .meta-block p { margin: 1px 0; }
            .recipient { margin: 6px 0; }
            .recipient p { margin: 1px 0; }
            .perihal { margin: 7px 0; }
            .perihal span { font-weight: bold; }
            p.paragraph {
              text-align: justify;
              margin: 6px 0;
            }
            table.billing-table {
              width: 88%;
              border-collapse: collapse;
              margin: 7px 0 3px 0;
              font-size: 10pt;
            }
            table.billing-table th {
              border: 1px solid #222;
              background-color: #e6e6e6;
              padding: 4px 8px;
              font-weight: bold;
              text-align: center;
            }
            .footnote {
              font-size: 9pt;
              font-style: italic;
              margin-bottom: 7px;
            }
            ol.consequences {
              margin: 3px 0 7px 20px;
              padding: 0;
            }
            ol.consequences li {
              margin-bottom: 2px;
              text-align: justify;
            }
            .pic-qr-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin: 7px 0;
            }
            .pic-info { max-width: 76%; }
            .pic-info p { margin: 1px 0; }
            .qr-box img {
              width: 68px;
              height: 68px;
              border: 1px solid #ccc;
              padding: 2px;
            }
            .signature-block { margin-top: 8px; }
            .gm-name { font-weight: bold; margin: 0; }
            .gm-role { font-weight: bold; margin: 0; }
          </style>
        </head>
        <body>
          <div class="header-logo">
            ${logoHtml}
          </div>

          <div class="meta-block">
            <p>Nomor : ${nomorSurat}</p>
            <p style="margin-top:5px;">${kotaTanggal}</p>
          </div>

          <div class="recipient">
            <p>Kepada Yth,</p>
            <p><b>${namaPelanggan}</b></p>
            <p>${alamatPelanggan}</p>
          </div>

          <div class="perihal">
            Perihal &nbsp;: <span>Penyelesaian Tunggakan Layanan Telkom dengan nomor ${nomorLayanan}</span>
          </div>

          <p class="paragraph">
            Sebelumnya kami mengucapkan banyak terimakasih atas kepercayaan Bapak/Ibu/Saudara/i menggunakan fasilitas jasa
            telekomunikasi dari PT. Telekomunikasi Indonesia. Kami menyadari dikarenakan kesibukan Bapak/Ibu/Sdr/i sehingga
            belum melakukan pembayaran tagihan internet. Untuk itu kami beritahukan bahwa sampai dengan saat ini didalam
            aplikasi kami Bapak/Ibu/Sdr/i masih memiliki tunggakan layanan internet dengan rincian sebagai berikut :
          </p>

          <table class="billing-table">
            <thead>
              <tr>
                <th style="width: 28%;">Bulan Tagihan</th>
                <th style="width: 26%;">Jumlah</th>
                <th style="width: 46%;">Keterangan</th>
              </tr>
            </thead>
            <tbody>
              ${tableBodyHtml}
              <tr>
                <td style="border: 1px solid #222; padding: 3.5px 8px; text-align: center; font-weight: bold;">Total</td>
                <td style="border: 1px solid #222; padding: 3.5px 8px; text-align: center; font-weight: bold;">${formatRupiahComma(totalTunggakan)}</td>
                <td style="border: 1px solid #222; padding: 3.5px 8px;"></td>
              </tr>
            </tbody>
          </table>
          <div class="footnote">*Tagihan sudah termasuk Denda, Materai.</div>

          <p class="paragraph">
            Kami mengharapkan Bapak/Ibu/Sdr/i dapat meluangkan waktu untuk segera menyelesaikan pembayaran tunggakan
            layanan internet tersebut melalui Autodebet, ATM, Mobile Banking, Internet Banking dan SMS Banking. Pembayaran
            juga bisa dilakukan melalui gerai retail Indomaret, Alfamart dan channel e-commerce melalui Tokopedia, Shopee,
            Bukalapak, Gojek &amp; LinkAja dan Plasa Telkom.
          </p>

          <p class="paragraph" style="margin-bottom:2px;">
            Perlu kami sampaikan juga bahwa konsekuensi bagi pelanggan internet Telkom yang mempunyai tunggakan tagihan,
            diantaranya :
          </p>
          <ol class="consequences">
            <li>Adanya mekanisme blacklist (daftar hitam) pelanggan, sehingga permintaan pasang baru ulang tidak bisa dilayani.</li>
            <li>Adanya biaya pendaftaran pasang baru Internet Telkom, untuk permintaan pasang baru kembali.</li>
            <li>Adanya denda penalti Rp 1.000.000,- bagi pelanggan yang berhenti berlangganan sebelum satu tahun.</li>
          </ol>

          <p class="paragraph">
            Apabila sampai dengan batas waktu pembayaran <b>${batasWaktu}</b> tunggakan Bapak / Ibu / Saudara (i) belum
            melakukan pembayaran, maka akan kami limpahkan kepada <b>KUASA HUKUM</b> untuk proses penanganan lebih lanjut.
          </p>

          <div class="pic-qr-row">
            <div class="pic-info">
              <p>Untuk informasi lebih lanjut dapat menghubungi pic : <b>${namaPic} (${telpPic})</b>.</p>
              <p>Serta pembayaran lebih mudah dengan melakukan scan QR-Code disamping</p>
            </div>
            <div class="qr-box">
              <img src="${qrImageUrl}" alt="QR Code Pembayaran" />
            </div>
          </div>

          <p class="paragraph">
            Mohon diabaikan pemberitahuan ini, apabila Bapak/Ibu/Sdr/i telah menyelesaikan pembayaran
            tagihan sebelum surat ini diterima.
          </p>

          <p class="paragraph">Demikian disampaikan, atas perhatian dan pengertiannya kami ucapkan terimakasih.</p>

          <div class="signature-block">
            <p style="margin:0;"><b>Hormat Kami,</b></p>
            ${signatureHtml}
            <p class="gm-name">${namaGm}</p>
            <p class="gm-role">${jabatanGm}</p>
          </div>

          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 450);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };
  if (!user) return null;

  return (
    <div className="bg-gradient-to-br from-rose-50 via-red-50/60 to-slate-200 min-h-screen pb-12">
      <header className="bg-gradient-to-r from-[#E4002B] via-[#B80022] to-slate-900 text-white shadow-md">
        <div className="max-w-7xl mx-auto p-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-black tracking-wide">AUTO SURAT TAGIHAN TELKOM</h1>
            <p className="text-xs text-red-100">Generator Surat Penyelesaian Tunggakan Resmi • Witel Priangan Timur</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-xs bg-white text-[#E4002B] font-bold px-3 py-1.5 rounded hover:bg-gray-100 transition shadow">
              🔙 Menu Utama
            </Link>
            <button
              onClick={handlePrintPDF}
              className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded shadow transition"
            >
              🖨️ Cetak / Simpan PDF (A4)
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 mt-4 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Panel Kiri (5 Kolom): Form Input Dinamis */}
        <div className="lg:col-span-5 bg-white rounded-xl shadow p-5 space-y-4 h-fit">
          <div className="border-b pb-3">
            <h3 className="font-bold text-gray-800 text-sm">📝 Data Surat, TTD & Rincian Tunggakan</h3>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Pilih pelanggan, upload foto TTD (otomatis tersimpan), lalu cetak ke PDF.
            </p>
          </div>

          {/* Box Upload Foto Tanda Tangan (TTD) */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-amber-900">✍️ Foto Tanda Tangan (TTD) GM</span>
              {signatureDataUrl && (
                <button
                  type="button"
                  onClick={handleRemoveSignature}
                  className="text-[11px] text-red-600 font-bold hover:underline"
                >
                  Hapus TTD
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <label className="cursor-pointer bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3 py-2 rounded-lg shadow transition shrink-0">
                📤 Upload Foto TTD
                <input type="file" accept="image/*" onChange={handleUploadSignature} className="hidden" />
              </label>

              {signatureDataUrl ? (
                <div className="bg-white border rounded-lg px-2 py-1 flex items-center gap-2">
                  <img src={signatureDataUrl} alt="Preview TTD" className="h-9 object-contain" />
                  <span className="text-[10px] text-emerald-700 font-bold">✅ TTD Terpasang</span>
                </div>
              ) : (
                <span className="text-[11px] text-amber-800">
                  Belum ada TTD. Upload foto TTD (latar putih/transparan) agar otomatis masuk ke surat.
                </span>
              )}
            </div>
          </div>

          {/* Pilih dari Master Pelanggan */}
          <div>
            <label className="block text-xs font-bold text-[#E4002B] mb-1">
              ⚡ Ambil Cepat dari Master Pelanggan ({customers.length})
            </label>
            <select
              value={selectedCustomerId}
              onChange={(e) => handleSelectCustomer(e.target.value)}
              className="w-full border-2 border-red-200 bg-red-50/40 rounded-lg p-2 text-xs font-bold text-gray-800 outline-none focus:border-[#E4002B]"
            >
              <option value="">-- Pilih Pelanggan Terdaftar (Opsional) --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nama_pelanggan} ({c.nomor_layanan})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Nomor Surat</label>
              <input
                type="text"
                value={nomorSurat}
                onChange={(e) => setNomorSurat(e.target.value)}
                className="w-full border rounded-lg p-2 text-xs outline-none focus:ring-2 focus:ring-[#E4002B]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Kota & Tanggal Surat</label>
              <input
                type="text"
                value={kotaTanggal}
                onChange={(e) => setKotaTanggal(e.target.value)}
                className="w-full border rounded-lg p-2 text-xs outline-none focus:ring-2 focus:ring-[#E4002B]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Nama Pelanggan / Instansi</label>
              <input
                type="text"
                value={namaPelanggan}
                onChange={(e) => setNamaPelanggan(e.target.value)}
                className="w-full border rounded-lg p-2 text-xs font-bold outline-none focus:ring-2 focus:ring-[#E4002B]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Nomor Layanan Telkom</label>
              <input
                type="text"
                value={nomorLayanan}
                onChange={(e) => setNomorLayanan(e.target.value)}
                className="w-full border rounded-lg p-2 text-xs font-mono outline-none focus:ring-2 focus:ring-[#E4002B]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Alamat Lengkap Pelanggan</label>
            <textarea
              rows="2"
              value={alamatPelanggan}
              onChange={(e) => setAlamatPelanggan(e.target.value)}
              className="w-full border rounded-lg p-2 text-xs outline-none focus:ring-2 focus:ring-[#E4002B]"
            />
          </div>

          {/* Rincian Tabel Tunggakan Dinamis */}
          <div className="bg-gray-50 p-3 rounded-xl border space-y-2.5">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-gray-800">📊 Tabel Rincian Tunggakan</span>
              <button
                type="button"
                onClick={addRow}
                className="bg-slate-800 hover:bg-slate-900 text-white text-[11px] font-bold px-2.5 py-1 rounded transition"
              >
                + Tambah Bulan
              </button>
            </div>

            {rows.map((r, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-1.5 items-center bg-white p-2 rounded-lg border">
                <input
                  type="text"
                  placeholder="Bulan Tagihan"
                  value={r.bulan}
                  onChange={(e) => handleRowChange(idx, 'bulan', e.target.value)}
                  className="col-span-4 border rounded p-1.5 text-[11px] outline-none"
                />
                <input
                  type="number"
                  placeholder="Jumlah (Rp)"
                  value={r.jumlah}
                  onChange={(e) => handleRowChange(idx, 'jumlah', e.target.value)}
                  className="col-span-3 border rounded p-1.5 text-[11px] font-bold outline-none"
                />
                <input
                  type="text"
                  placeholder="Keterangan"
                  value={r.keterangan}
                  onChange={(e) => handleRowChange(idx, 'keterangan', e.target.value)}
                  className="col-span-4 border rounded p-1.5 text-[11px] outline-none"
                />
                <button
                  type="button"
                  onClick={() => removeRow(idx)}
                  className="col-span-1 text-red-600 font-bold text-xs text-center hover:bg-red-50 rounded p-1"
                  title="Hapus baris"
                >
                  ✕
                </button>
              </div>
            ))}

            <div className="text-right text-xs font-extrabold text-[#E4002B] pt-1">
              Total Tunggakan: {formatRupiahComma(totalTunggakan)}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Batas Waktu Bayar</label>
              <input
                type="text"
                value={batasWaktu}
                onChange={(e) => setBatasWaktu(e.target.value)}
                className="w-full border rounded-lg p-2 text-xs outline-none focus:ring-2 focus:ring-[#E4002B]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Nama PIC</label>
              <input
                type="text"
                value={namaPic}
                onChange={(e) => setNamaPic(e.target.value)}
                className="w-full border rounded-lg p-2 text-xs outline-none focus:ring-2 focus:ring-[#E4002B]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">No. HP PIC</label>
              <input
                type="text"
                value={telpPic}
                onChange={(e) => setTelpPic(e.target.value)}
                className="w-full border rounded-lg p-2 text-xs outline-none focus:ring-2 focus:ring-[#E4002B]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Link / Data QR-Code Bayar</label>
              <input
                type="text"
                value={qrLink}
                onChange={(e) => setQrLink(e.target.value)}
                className="w-full border rounded-lg p-2 text-xs outline-none focus:ring-2 focus:ring-[#E4002B]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Penandatangan (GM)</label>
              <input
                type="text"
                value={namaGm}
                onChange={(e) => setNamaGm(e.target.value)}
                className="w-full border rounded-lg p-2 text-xs outline-none focus:ring-2 focus:ring-[#E4002B]"
              />
            </div>
          </div>

          {/* Opsional Ganti File Logo Kop */}
          <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1 border-t">
            <span>Kop Logo: {customLogoUrl ? 'Custom Upload' : 'Telkom Indonesia (Default)'}</span>
            <div className="flex items-center gap-2">
              <label className="cursor-pointer text-blue-600 font-bold hover:underline">
                Ganti File Logo
                <input type="file" accept="image/*" onChange={handleUploadLogo} className="hidden" />
              </label>
              {customLogoUrl && (
                <button type="button" onClick={handleResetLogo} className="text-red-600 font-bold hover:underline">
                  Reset
                </button>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handlePrintPDF}
            className="w-full bg-[#E4002B] hover:bg-[#B80022] text-white font-bold py-3 rounded-xl text-xs shadow-lg transition"
          >
            🖨️ Generate & Cetak Surat Tagihan Resmi (PDF)
          </button>
        </div>

        {/* Panel Kanan (7 Kolom): Live Preview Kertas A4 Surat Resmi */}
        <div className="lg:col-span-7 bg-gray-300/80 p-4 md:p-6 rounded-xl overflow-x-auto flex justify-center">
          <div
            className="bg-white shadow-2xl text-gray-900 w-full max-w-[720px] p-8 md:p-12 text-[12px] leading-relaxed"
            style={{ fontFamily: '"Times New Roman", Times, serif' }}
          >
            {/* Kop Telkom Kanan Atas (Simbol Tangan + Telkom Indonesia) */}
            <div className="flex justify-end items-center mb-3">
              {customLogoUrl ? (
                <img src={customLogoUrl} alt="Logo Telkom" className="h-14 object-contain" />
              ) : (
                <TelkomHandLogoSvg width={175} />
              )}
            </div>

            <p>Nomor : {nomorSurat}</p>
            <p className="mt-2">{kotaTanggal}</p>

            <div className="mt-3">
              <p>Kepada Yth,</p>
              <p className="font-bold">{namaPelanggan}</p>
              <p>{alamatPelanggan}</p>
            </div>

            <p className="mt-3">
              Perihal &nbsp;: <span className="font-bold">Penyelesaian Tunggakan Layanan Telkom dengan nomor {nomorLayanan}</span>
            </p>

            <p className="mt-3 text-justify">
              Sebelumnya kami mengucapkan banyak terimakasih atas kepercayaan Bapak/Ibu/Saudara/i menggunakan fasilitas jasa
              telekomunikasi dari PT. Telekomunikasi Indonesia. Kami menyadari dikarenakan kesibukan Bapak/Ibu/Sdr/i sehingga
              belum melakukan pembayaran tagihan internet. Untuk itu kami beritahukan bahwa sampai dengan saat ini didalam
              aplikasi kami Bapak/Ibu/Sdr/i masih memiliki tunggakan layanan internet dengan rincian sebagai berikut :
            </p>

            {/* Tabel Rincian Tunggakan */}
            <table className="w-full md:w-[90%] border-collapse border border-gray-800 mt-3 text-[11px]">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border border-gray-800 p-1.5 text-center">Bulan Tagihan</th>
                  <th className="border border-gray-800 p-1.5 text-center">Jumlah</th>
                  <th className="border border-gray-800 p-1.5 text-center">Keterangan</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, idx) => (
                  <tr key={idx}>
                    <td className="border border-gray-800 p-1.5 text-center">{r.bulan}</td>
                    <td className="border border-gray-800 p-1.5 text-center">{formatRupiahComma(r.jumlah)}</td>
                    <td className="border border-gray-800 p-1.5">{r.keterangan}</td>
                  </tr>
                ))}
                <tr className="font-bold">
                  <td className="border border-gray-800 p-1.5 text-center">Total</td>
                  <td className="border border-gray-800 p-1.5 text-center">{formatRupiahComma(totalTunggakan)}</td>
                  <td className="border border-gray-800 p-1.5"></td>
                </tr>
              </tbody>
            </table>
            <p className="text-[10px] italic mt-1">*Tagihan sudah termasuk Denda, Materai.</p>

            <p className="mt-3 text-justify">
              Kami mengharapkan Bapak/Ibu/Sdr/i dapat meluangkan waktu untuk segera menyelesaikan pembayaran tunggakan
              layanan internet tersebut melalui Autodebet, ATM, Mobile Banking, Internet Banking dan SMS Banking. Pembayaran
              juga bisa dilakukan melalui gerai retail Indomaret, Alfamart dan channel e-commerce melalui Tokopedia, Shopee,
              Bukalapak, Gojek &amp; LinkAja dan Plasa Telkom.
            </p>

            <p className="mt-3 text-justify">
              Perlu kami sampaikan juga bahwa konsekuensi bagi pelanggan internet Telkom yang mempunyai tunggakan tagihan,
              diantaranya :
            </p>
            <ol className="list-decimal ml-5 mt-1 space-y-0.5 text-justify">
              <li>Adanya mekanisme blacklist (daftar hitam) pelanggan, sehingga permintaan pasang baru ulang tidak bisa dilayani.</li>
              <li>Adanya biaya pendaftaran pasang baru Internet Telkom, untuk permintaan pasang baru kembali.</li>
              <li>Adanya denda penalti Rp 1.000.000,- bagi pelanggan yang berhenti berlangganan sebelum satu tahun.</li>
            </ol>

            <p className="mt-3 text-justify">
              Apabila sampai dengan batas waktu pembayaran <b>{batasWaktu}</b> tunggakan Bapak / Ibu / Saudara (i) belum
              melakukan pembayaran, maka akan kami limpahkan kepada <b>KUASA HUKUM</b> untuk proses penanganan lebih lanjut.
            </p>

            <div className="flex justify-between items-center mt-3 gap-4">
              <div>
                <p>Untuk informasi lebih lanjut dapat menghubungi pic : <b>{namaPic} ({telpPic})</b>.</p>
                <p>Serta pembayaran lebih mudah dengan melakukan scan QR-Code disamping</p>
              </div>
              <img src={qrImageUrl} alt="QR Code" className="w-16 h-16 border p-0.5 shrink-0" />
            </div>

            <p className="mt-3 text-justify">
              Mohon diabaikan pemberitahuan ini, apabila Bapak/Ibu/Sdr/i telah menyelesaikan pembayaran
              tagihan sebelum surat ini diterima.
            </p>

            <p className="mt-3">Demikian disampaikan, atas perhatian dan pengertiannya kami ucapkan terimakasih.</p>

            <div className="mt-4">
              <p className="font-bold">Hormat Kami,</p>
              {signatureDataUrl ? (
                <div className="h-16 flex items-center my-0.5">
                  <img
                    src={signatureDataUrl}
                    alt="Tanda Tangan GM"
                    className="max-h-16 max-w-[180px] object-contain mix-blend-multiply"
                  />
                </div>
              ) : (
                <div className="h-14"></div>
              )}
              <p className="font-bold">{namaGm}</p>
              <p className="font-bold">{jabatanGm}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}





