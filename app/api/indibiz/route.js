export const dynamic = 'force-dynamic';
import { sql } from '../../../lib/db';
import { NextResponse } from 'next/server';

async function ensureIndibizTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS indibiz_billing (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      nomor_layanan TEXT NOT NULL,
      nama_pelanggan TEXT NOT NULL,
      no_wa TEXT DEFAULT '',
      periode TEXT DEFAULT '',
      nominal BIGINT DEFAULT 0,
      status_chat TEXT DEFAULT 'BELUM_CHAT',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  await sql`ALTER TABLE indibiz_billing ALTER COLUMN nomor_layanan TYPE TEXT`;
  await sql`ALTER TABLE indibiz_billing ALTER COLUMN nama_pelanggan TYPE TEXT`;
  await sql`ALTER TABLE indibiz_billing ALTER COLUMN no_wa TYPE TEXT`;
  await sql`ALTER TABLE indibiz_billing ALTER COLUMN periode TYPE TEXT`;
  await sql`ALTER TABLE indibiz_billing ALTER COLUMN status_chat TYPE TEXT`;
  await sql`ALTER TABLE indibiz_billing ADD COLUMN IF NOT EXISTS datel_sto TEXT DEFAULT 'Priangan Timur'`;
  await sql`ALTER TABLE indibiz_billing ADD COLUMN IF NOT EXISTS status_caring TEXT DEFAULT 'BELUM_CARING'`;
  await sql`ALTER TABLE indibiz_billing ADD COLUMN IF NOT EXISTS status_visit TEXT DEFAULT 'BELUM_VISIT'`;
  await sql`ALTER TABLE indibiz_billing ADD COLUMN IF NOT EXISTS umur_tunggakan TEXT DEFAULT '1 Bulan'`;
  await sql`ALTER TABLE indibiz_billing ADD COLUMN IF NOT EXISTS pic_petugas TEXT DEFAULT 'Tim Billing'`;
  await sql`ALTER TABLE indibiz_billing ADD COLUMN IF NOT EXISTS alamat TEXT DEFAULT ''`;
  await sql`ALTER TABLE indibiz_billing ADD COLUMN IF NOT EXISTS produk TEXT DEFAULT 'Indibiz / Wireline'`;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ message: 'User ID diperlukan' }, { status: 400 });
  }

  try {
    await ensureIndibizTable();
    const data = await sql`
      SELECT * FROM indibiz_billing
      WHERE user_id = ${Number(userId)}
      ORDER BY nama_pelanggan ASC
    `;
    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error('GET /api/indibiz error:', error);
    return NextResponse.json({ message: 'Error fetching data', error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await ensureIndibizTable();
    const body = await request.json();
    const userId = Number(body.userId);

    if (!userId) {
      return NextResponse.json({ message: 'User ID tidak valid, silakan login ulang.' }, { status: 400 });
    }

    // Mode Bulk Import (Batch kecil 10 per putaran agar koneksi Neon stabil)
    if (Array.isArray(body.items)) {
      let processedCount = 0;
      const chunkSize = 10;

      for (let i = 0; i < body.items.length; i += chunkSize) {
        const chunk = body.items.slice(i, i + chunkSize);
        await Promise.all(
          chunk.map(async (item) => {
            const snd = String(item.nomorLayanan || '').trim();
            const nama = String(item.namaPelanggan || '').toUpperCase().trim();
            if (!snd || !nama) return;

            const wa = String(item.noWa || '').trim();
            const periode = String(item.periode || 'Tagihan Berjalan').trim();
            const nominal = Math.max(0, Math.round(Number(item.nominal) || 0));
            const datelSto = String(item.datelSto || 'Priangan Timur').trim();
            const statusChat = String(item.statusChat || '').trim();
            const statusCaring = String(item.statusCaring || 'BELUM_CARING').trim();
            const statusVisit = String(item.statusVisit || '').trim();
            const umurTunggakan = String(item.umurTunggakan || '1 Bulan').trim();
            const picPetugas = String(item.picPetugas || 'Tim Billing').trim();
            const alamat = String(item.alamat || '').trim();
            const produk = String(item.produk || 'Indibiz / Wireline').trim();

            if (body.upsert) {
              const existing = await sql`
                SELECT id FROM indibiz_billing
                WHERE user_id = ${userId} AND nomor_layanan = ${snd}
                LIMIT 1
              `;
              if (existing.length > 0) {
                await sql`
                  UPDATE indibiz_billing
                  SET nama_pelanggan = ${nama},
                      no_wa = COALESCE(NULLIF(${wa}, ''), no_wa),
                      periode = ${periode},
                      nominal = ${nominal},
                      status_chat = COALESCE(NULLIF(${statusChat}, ''), status_chat),
                      datel_sto = ${datelSto},
                      status_caring = ${statusCaring},
                      status_visit = COALESCE(NULLIF(${statusVisit}, ''), status_visit),
                      umur_tunggakan = ${umurTunggakan},
                      pic_petugas = ${picPetugas},
                      alamat = COALESCE(NULLIF(${alamat}, ''), alamat),
                      produk = ${produk}
                  WHERE id = ${existing[0].id}
                `;
                return;
              }
            }

            await sql`
              INSERT INTO indibiz_billing (
                user_id, nomor_layanan, nama_pelanggan, no_wa, periode, nominal,
                status_chat, datel_sto, status_caring, status_visit, umur_tunggakan, pic_petugas, alamat, produk
              )
              VALUES (
                ${userId}, ${snd}, ${nama}, ${wa}, ${periode}, ${nominal},
                ${statusChat || 'BELUM_CHAT'}, ${datelSto}, ${statusCaring}, ${statusVisit || 'BELUM_VISIT'},
                ${umurTunggakan}, ${picPetugas}, ${alamat}, ${produk}
              )
            `;
          })
        );
        processedCount += chunk.length;
      }

      return NextResponse.json({ message: 'Bulk sync sukses', count: processedCount }, { status: 201 });
    }

    // Mode Single Insert
    const {
      nomorLayanan, namaPelanggan, noWa, periode, nominal,
      datelSto, statusCaring, statusVisit, umurTunggakan, picPetugas, alamat, produk
    } = body;

    const inserted = await sql`
      INSERT INTO indibiz_billing (
        user_id, nomor_layanan, nama_pelanggan, no_wa, periode, nominal,
        status_chat, datel_sto, status_caring, status_visit, umur_tunggakan, pic_petugas, alamat, produk
      )
      VALUES (
        ${userId},
        ${String(nomorLayanan).trim()},
        ${String(namaPelanggan).toUpperCase().trim()},
        ${String(noWa || '').trim()},
        ${String(periode || '').trim()},
        ${Math.max(0, Math.round(Number(nominal) || 0))},
        'BELUM_CHAT',
        ${String(datelSto || 'Priangan Timur').trim()},
        ${String(statusCaring || 'BELUM_CARING').trim()},
        ${String(statusVisit || 'BELUM_VISIT').trim()},
        ${String(umurTunggakan || '1 Bulan').trim()},
        ${String(picPetugas || 'Tim Billing').trim()},
        ${String(alamat || '').trim()},
        ${String(produk || 'Indibiz / Wireline').trim()}
      )
      RETURNING *
    `;

    return NextResponse.json({ data: inserted[0] }, { status: 201 });
  } catch (error) {
    console.error('POST /api/indibiz error:', error);
    return NextResponse.json({ message: error.message || 'Error inserting data', error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    await ensureIndibizTable();
    const {
      id, nomorLayanan, namaPelanggan, noWa, periode, nominal, statusChat,
      datelSto, statusCaring, statusVisit, umurTunggakan, picPetugas, alamat, produk
    } = await request.json();

    if (!id) {
      return NextResponse.json({ message: 'ID diperlukan' }, { status: 400 });
    }

    const updated = await sql`
      UPDATE indibiz_billing
      SET nomor_layanan = ${String(nomorLayanan).trim()},
          nama_pelanggan = ${String(namaPelanggan).toUpperCase().trim()},
          no_wa = ${String(noWa || '').trim()},
          periode = ${String(periode || '').trim()},
          nominal = ${Math.max(0, Math.round(Number(nominal) || 0))},
          status_chat = ${statusChat || 'BELUM_CHAT'},
          datel_sto = ${String(datelSto || 'Priangan Timur').trim()},
          status_caring = ${String(statusCaring || 'BELUM_CARING').trim()},
          status_visit = ${String(statusVisit || 'BELUM_VISIT').trim()},
          umur_tunggakan = ${String(umurTunggakan || '1 Bulan').trim()},
          pic_petugas = ${String(picPetugas || 'Tim Billing').trim()},
          alamat = ${String(alamat || '').trim()},
          produk = ${String(produk || 'Indibiz / Wireline').trim()}
      WHERE id = ${Number(id)}
      RETURNING *
    `;

    return NextResponse.json({ data: updated[0] }, { status: 200 });
  } catch (error) {
    console.error('PUT /api/indibiz error:', error);
    return NextResponse.json({ message: error.message || 'Error updating data', error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const clearAllUserId = searchParams.get('clearAllUserId');

    if (clearAllUserId) {
      await sql`DELETE FROM indibiz_billing WHERE user_id = ${Number(clearAllUserId)}`;
      return NextResponse.json({ message: 'Semua data berhasil dikosongkan' }, { status: 200 });
    }

    if (!id) {
      return NextResponse.json({ message: 'ID diperlukan' }, { status: 400 });
    }

    await sql`DELETE FROM indibiz_billing WHERE id = ${Number(id)}`;
    return NextResponse.json({ message: 'Berhasil dihapus' }, { status: 200 });
  } catch (error) {
    console.error('DELETE /api/indibiz error:', error);
    return NextResponse.json({ message: error.message || 'Error deleting data', error: error.message }, { status: 500 });
  }
}
