import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Auth disabled - allow all routes
export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
