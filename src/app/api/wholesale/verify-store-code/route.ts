import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { storeCode } = await request.json();

    if (!storeCode || typeof storeCode !== 'string') {
      return NextResponse.json({ ok: false, error: 'Store code is required' }, { status: 400 });
    }

    const validCodes = (process.env.WHOLESALE_STORE_CODES || '')
      .split(',')
      .map((c) => c.trim().toUpperCase())
      .filter(Boolean);

    if (validCodes.includes(storeCode.trim().toUpperCase())) {
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, error: 'Invalid store code' }, { status: 401 });
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request' }, { status: 400 });
  }
}
