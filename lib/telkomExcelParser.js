export function parseTelkomWorkbook(XLSX, workbook, defaultUserName = 'Tim Billing', defaultPeriode = 'Tagihan Berjalan') {
  const parsedMap = new Map();

  const cleanPhone = (raw) => {
    const str = String(raw || '').trim();
    if (!str || str === '0' || str === '-') return '';
    const first = str.split(/[;,/]/)[0].replace(/\D/g, '');
    if (first.length < 7) return '';
    return first.startsWith('8') ? '0' + first : first;
  };

  const mapStatusCaring = (rawStatus) => {
    const s = String(rawStatus || '').toUpperCase().trim();
    if (!s || s === '-') return 'BELUM_CARING';
    if (s.includes('JANJI')) return 'JANJI_BAYAR';
    if (s.includes('COMPLAIN') || s.includes('KOMPLAIN')) return 'COMPLAIN_TARIF';
    return 'SUDAH_CARING';
  };

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    // Baca sebagai array of objects (membaca header SND, NAMA, ALAMAT, DATEL, TOTAL TGK, dll)
    const objRows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    if (objRows.length > 0 && ('SND' in objRows[0] || 'NAMA' in objRows[0] || 'TOTAL TGK' in objRows[0])) {
      for (const r of objRows) {
        const snd = String(r['SND'] || '').replace(/\D/g, '').trim();
        const nama = String(r['NAMA'] || r['NAMA_NCLI'] || '').replace(/\s+/g, ' ').trim();
        if (!snd || !nama) continue;

        const alamat = String(r['ALAMAT'] || '').replace(/\s+/g, ' ').trim();
        const stoDesc = String(r['STO_DESC'] || '').trim();
        const datelRaw = String(r['DATEL'] || '').trim();
        const datelClean = datelRaw.includes('-') ? datelRaw.split('-').pop().trim() : datelRaw;
        const datelSto = stoDesc ? `${datelClean || 'Priangan Timur'} (${stoDesc})` : (datelClean || 'Priangan Timur');

        const produk = String(r['PRODUK'] || r['SUMMARY_PRODUK'] || 'Indibiz / Wireline').trim();

        // Ambil TOTAL TGK, jika 0 ambil TOTAL BILL NOV atau SALDO
        const tgk = parseInt(String(r['TOTAL TGK'] || '0').replace(/\D/g, ''), 10) || 0;
        const billNov = parseInt(String(r['TOTAL BILL NOV'] || r['BILL ND NOV'] || '0').replace(/\D/g, ''), 10) || 0;
        const saldo = parseInt(String(r['SALDO'] || '0').replace(/\D/g, ''), 10) || 0;
        const nominal = tgk > 0 ? tgk : (billNov > 0 ? billNov : saldo);

        const bulanTgk = parseInt(String(r['TOTAL BULAN TGK'] || '1').replace(/\D/g, ''), 10) || 1;
        const umurTunggakan = bulanTgk > 2 ? '> 2 Bulan' : `${bulanTgk} Bulan`;

        const noWa = cleanPhone(r['CP']) || cleanPhone(r['K-KONTAK']);
        const picRaw = String(r['PIC CARING CALL'] || '').trim();
        const picPetugas = picRaw && picRaw !== '-' ? picRaw : defaultUserName;
        const statusCaring = mapStatusCaring(r['STATUS CARING']);

        parsedMap.set(snd, {
          nomorLayanan: snd,
          namaPelanggan: nama,
          noWa,
          periode: defaultPeriode,
          nominal,
          datelSto,
          statusCaring,
          statusVisit: 'BELUM_VISIT',
          umurTunggakan,
          picPetugas,
          alamat,
          produk,
        });
      }
    } else {
      // Fallback untuk Excel format lama (kolom A-E)
      const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
      for (const cols of rawRows) {
        if (!Array.isArray(cols) || cols.length === 0) continue;
        const cleanCols = cols.map((c) => String(c ?? '').trim());
        const joinedLower = cleanCols.join(' ').toLowerCase();
        if (joinedLower.includes('nomor layanan') || joinedLower.includes('nama pelanggan') || joinedLower.includes('snd')) continue;

        let nomor = '';
        let nama = '';
        let wa = '';
        let nominal = 0;

        if (cleanCols.length >= 3 && /^(unpaid|paid|partial|lunas|belum)/i.test(cleanCols[0])) {
          nomor = cleanCols[1].replace(/\D/g, '');
          nama = cleanCols[2];
          wa = cleanPhone(cleanCols[3]);
          nominal = parseInt(String(cleanCols[4] || '0').replace(/\D/g, ''), 10) || 0;
        } else {
          for (const val of cleanCols) {
            if (!val) continue;
            const digits = val.replace(/\D/g, '');
            if (!nomor && digits.length >= 7 && digits.length <= 16 && !/^(08|628|8)\d{8,12}$/.test(digits)) {
              nomor = digits;
            } else if (!wa && (/^(08|628|8)\d{7,13}/.test(digits) || val.includes(';'))) {
              wa = cleanPhone(val);
            } else if (!nama && /[a-zA-Z]{2,}/.test(val) && !/^(unpaid|paid|partial|lunas)$/i.test(val)) {
              nama = val;
            }
          }
        }

        if (nomor && nama && !parsedMap.has(nomor)) {
          parsedMap.set(nomor, {
            nomorLayanan: nomor,
            namaPelanggan: nama.replace(/\s+/g, ' '),
            noWa: wa,
            periode: defaultPeriode,
            nominal,
            datelSto: 'Priangan Timur',
            statusCaring: 'BELUM_CARING',
            statusVisit: 'BELUM_VISIT',
            umurTunggakan: '1 Bulan',
            picPetugas: defaultUserName,
            alamat: '',
            produk: 'Indibiz / Wireline',
          });
        }
      }
    }
  }

  return Array.from(parsedMap.values());
}
