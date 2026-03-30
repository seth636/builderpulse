// temp debug - check env
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
export async function GET() {
  return NextResponse.json({
    GHL_API_KEY: process.env.GHL_API_KEY ? `set (${process.env.GHL_API_KEY?.substring(0,10)}...)` : 'NOT SET',
    GOOGLE_SERVICE_ACCOUNT_JSON: process.env.GOOGLE_SERVICE_ACCOUNT_JSON ? 'set' : 'NOT SET',
    DATABASE_URL: process.env.DATABASE_URL ? 'set' : 'NOT SET',
  });
}
