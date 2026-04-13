import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const scriptUrl = process.env.GOOGLE_APPS_SCRIPT_URL;
    if (!scriptUrl) {
      return NextResponse.json({ ok: false, error: 'GOOGLE_APPS_SCRIPT_URL not set' }, { status: 500 });
    }

    await fetch(scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Error logging submission to Google Sheets:', err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
