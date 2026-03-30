export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: { email, role: 'client' },
      include: { client: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    if (!user.client) {
      return NextResponse.json({ error: 'No client associated with this account' }, { status: 401 });
    }

    // Set a simple session cookie (JWT-less, just base64 encoded session)
    const sessionData = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      clientId: user.client_id,
      clientSlug: user.client.slug,
    };

    const sessionToken = Buffer.from(JSON.stringify(sessionData)).toString('base64');
    const response = NextResponse.json({ success: true, clientSlug: user.client.slug });
    
    response.cookies.set('portal_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch (error) {
    console.error('POST /api/portal/login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
