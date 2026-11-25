export const dynamic = 'force-dynamic';
import { sql } from '../../../lib/db';
import { NextResponse } from 'next/server';

async function ensureIndibizTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS indibiz_billing (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      nomor_layanan VARCHAR(100) NOT NULL,
      nama_pelanggan VARCHAR(200) NOT NULL,
      no_wa VARCHAR(50) DEFAULT '',
      periode VARCHAR(100) DEFAULT '',
      nominal BIGINT DEFAULT 0,
      status_chat VARCHAR(50) DEFAULT 'BELUM_CHAT',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
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
      WHERE user_id = ${userId}
      ORDER BY id ASC
    `;
    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Error fetching data', error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await ensureIndibizTable();
    const body = await request.json();

    // Mode Bulk Import (Array items sekaligus dalam 1 transaksi)
    if (Array.isArray(body.items)) {
      let insertedCount = 0;
      const chunkSize = 50;
      for (let i = 0; i < body.items.length; i += chunkSize) {
        const chunk = body.items.slice(i, i + chunkSize);
        await Promise.all(
          chunk.map((item) =>
            sql`
              INSERT INTO indibiz_billing (user_id, nomor_layanan, nama_pelanggan, no_wa, periode, nominal, status_chat)
              VALUES (
                ${body.userId},
                ${String(item.nomorLayanan).trim()},
                ${String(item.namaPelanggan).toUpperCase().trim()},
                ${String(item.noWa || '').trim()},
                ${String(item.periode || '').trim()},
                ${parseInt(item.nominal) || 0},
                'BELUM_CHAT'
              )
            `
          )
        );
        insertedCount += chunk.length;
      }
      return NextResponse.json({ message: 'Bulk insert sukses', count: insertedCount }, { status: 201 });
    }

    // Mode Single Insert (Manual)
    const { userId, nomorLayanan, namaPelanggan, noWa, periode, nominal } = body;
    const inserted = await sql`
      INSERT INTO indibiz_billing (user_id, nomor_layanan, nama_pelanggan, no_wa, periode, nominal, status_chat)
      VALUES (
        ${userId},
        ${String(nomorLayanan).trim()},
        ${String(namaPelanggan).toUpperCase().trim()},
        ${String(noWa || '').trim()},
        ${String(periode || '').trim()},
        ${parseInt(nominal) || 0},
        'BELUM_CHAT'
      )
      RETURNING *
    `;

    return NextResponse.json({ data: inserted[0] }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: 'Error inserting data', error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    await ensureIndibizTable();
    const { id, nomorLayanan, namaPelanggan, noWa, periode, nominal, statusChat } = await request.json();

    if (!id) {
      return NextResponse.json({ message: 'ID diperlukan' }, { status: 400 });
    }

    const updated = await sql`
      UPDATE indibiz_billing
      SET nomor_layanan = ${String(nomorLayanan).trim()},
          nama_pelanggan = ${String(namaPelanggan).toUpperCase().trim()},
          no_wa = ${String(noWa || '').trim()},
          periode = ${String(periode || '').trim()},
          nominal = ${parseInt(nominal) || 0},
          status_chat = ${statusChat || 'BELUM_CHAT'}
      WHERE id = ${id}
      RETURNING *
    `;

    return NextResponse.json({ data: updated[0] }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Error updating data', error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const clearAllUserId = searchParams.get('clearAllUserId');

    if (clearAllUserId) {
      await sql`DELETE FROM indibiz_billing WHERE user_id = ${clearAllUserId}`;
      return NextResponse.json({ message: 'Semua data berhasil dikosongkan' }, { status: 200 });
    }

    if (!id) {
      return NextResponse.json({ message: 'ID diperlukan' }, { status: 400 });
    }

    await sql`DELETE FROM indibiz_billing WHERE id = ${id}`;
    return NextResponse.json({ message: 'Berhasil dihapus' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Error deleting data', error: error.message }, { status: 500 });
  }
}

