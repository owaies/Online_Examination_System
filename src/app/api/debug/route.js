import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    db_host: process.env.DB_HOST ? 'Set' : 'Unset',
    db_user: process.env.DB_USER ? 'Set' : 'Unset',
    db_name: process.env.DB_NAME ? 'Set' : 'Unset',
    db_port: process.env.DB_PORT ? 'Set' : 'Unset',
    db_pass_length: process.env.DB_PASS ? process.env.DB_PASS.length : 0,
    db_pass_start: process.env.DB_PASS ? process.env.DB_PASS[0] : null,
  });
}
