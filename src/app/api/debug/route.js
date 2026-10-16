import { NextResponse } from 'next/server';

// Keep internal diagnostics private. Public requests must not expose runtime configuration.
export async function GET() {
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}
