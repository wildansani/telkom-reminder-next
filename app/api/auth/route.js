export const dynamic = 'force-dynamic';
import { sql } from '../../../lib/db';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    const users = await sql`
      SELECT id, username, nama_lengkap, telegram_user 
      FROM users 
      WHERE username = ${username.toLowerCase()} AND password = ${password}
    `;

    if (users.length === 0) {
      return NextResponse.json({ message: 'Username atau Password salah!' }, { status: 401 });
    }

    return NextResponse.json({ user: users[0] }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Database Error', error: error.message }, { status: 500 });
  }
}

