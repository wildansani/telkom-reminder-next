import { sql } from '../../../lib/db';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  if (!userId) return NextResponse.json({ message: 'User ID diperlukan' }, { status: 400 });

  try {
    const data = await sql`SELECT * FROM piutang WHERE user_id = ${userId} ORDER BY id DESC`;
    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { userId, idPelanggan, namaPelanggan, kategori, keterangan, picAm } = await request.json();
    const newData = await sql`
      INSERT INTO piutang (user_id, id_pelanggan, nama_pelanggan, kategori, keterangan_bulan, pic_am)
      VALUES (${userId}, ${idPelanggan}, ${namaPelanggan.toUpperCase()}, ${kategori}, ${keterangan}, ${picAm})
      RETURNING *
    `;
    return NextResponse.json({ data: newData[0] }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { id, idPelanggan, namaPelanggan, kategori, keterangan, picAm, statusPembayaran } = await request.json();
    const updated = await sql`
      UPDATE piutang 
      SET id_pelanggan = ${idPelanggan}, nama_pelanggan = ${namaPelanggan.toUpperCase()}, kategori = ${kategori}, keterangan_bulan = ${keterangan}, pic_am = ${picAm}, status_pembayaran = ${statusPembayaran}
      WHERE id = ${id} RETURNING *
    `;
    return NextResponse.json({ data: updated[0] }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    await sql`DELETE FROM piutang WHERE id = ${id}`;
    return NextResponse.json({ message: 'Dihapus' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
