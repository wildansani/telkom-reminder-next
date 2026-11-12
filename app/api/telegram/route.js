export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { botToken, chatId, text } = await request.json();

    if (!botToken || !chatId || !text) {
      return NextResponse.json({ message: 'Data tidak lengkap' }, { status: 400 });
    }

    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json({ message: data.description || 'Gagal mengirim ke Telegram' }, { status: res.status });
    }

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

