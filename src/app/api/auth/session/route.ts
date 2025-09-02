import { NextResponse } from 'next/server';

export async function GET() {
  // Minimal empty session to avoid client fetch JSON parse errors
  return NextResponse.json({ user: null, expires: null });
}
