import NextAuth, { DefaultSession, DefaultUser } from 'next-auth';
import { JWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface User extends DefaultUser {
    role?: string;
    clientId?: string | null;
    clientSlug?: string | null;
  }

  interface Session {
    user: {
      role?: string;
      clientId?: string | null;
      clientSlug?: string | null;
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: string;
    clientId?: string | null;
    clientSlug?: string | null;
  }
}
