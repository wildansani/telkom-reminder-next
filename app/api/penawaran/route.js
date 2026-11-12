import { sql } from '../../../lib/db';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ message: 'User ID diperlukan' }, { status: 400 });
  }

  try {
    const data = await sql`
      SELECT * FROM penawaran 
      WHERE user_id = ${userId} 
      ORDER BY aging_hari DESC
    `;
    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Error fetching data', error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { userId, namaKlien, layanan, agingHari } = await request.json();

    const newOffer = await sql`
      INSERT INTO penawaran (user_id, nama_klien, layanan, aging_hari, status_prospek)
      VALUES (${userId}, ${namaKlien.toUpperCase()}, ${layanan}, ${agingHari}, 'IN_PROGRESS')
      RETURNING *
    `;

    return NextResponse.json({ data: newOffer[0] }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: 'Error inserting data', error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { id, namaKlien, layanan, agingHari, statusProspek } = await request.json();

    if (!id) {
      return NextResponse.json({ message: 'ID penawaran diperlukan' }, { status: 400 });
    }

    const updatedOffer = await sql`
      UPDATE penawaran 
      SET nama_klien = ${namaKlien.toUpperCase()}, 
          layanan = ${layanan}, 
          aging_hari = ${agingHari},
          status_prospek = ${statusProspek || 'IN_PROGRESS'}
      WHERE id = ${id}
      RETURNING *
    `;

    return NextResponse.json({ data: updatedOffer[0] }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Error updating data', error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ message: 'ID penawaran diperlukan' }, { status: 400 });
    }

    await sql`DELETE FROM penawaran WHERE id = ${id}`;

    return NextResponse.json({ message: 'Berhasil dihapus' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Error deleting data', error: error.message }, { status: 500 });
  }
}
