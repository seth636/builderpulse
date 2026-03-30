import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    ghl_set: !!process.env.GHL_API_KEY,
    ghl_preview: process.env.GHL_API_KEY?.substring(0, 10) || 'not set',
    node_env: process.env.NODE_ENV,
  });
}
