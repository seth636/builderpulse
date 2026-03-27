# BuilderPulse - Phase 1

HBM Client Analytics Dashboard foundation with authentication, client management, and empty dashboard shell.

## Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: NextAuth.js with JWT
- **Styling**: Tailwind CSS (Dark theme)
- **Deployment**: Railway

## Features (Phase 1)

- ✅ Authentication (email + password)
- ✅ Client management (CRUD)
- ✅ Team management (PM accounts)
- ✅ Dashboard with client cards
- ✅ Client detail pages with placeholder sections
- ✅ Role-based access (admin vs PM)
- ✅ Dark, premium UI design

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env
```

Edit `.env` with your database URL and NextAuth secret.

4. Run database migrations:

```bash
npx prisma migrate dev
```

5. Seed the database:

```bash
npm run db:seed
```

6. Start the development server:

```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000)

### Default Login

- **Email**: hammad@homebuildermarketers.com
- **Password**: BuilderPulse2026!

## Database Schema

The database includes all models for future phases:

- Clients
- Users
- SEO Rankings & Backlinks
- Site Audits
- GA4 Metrics, Pages, Sources
- Google Search Console Metrics
- Meta Ads
- GHL Leads, Appointments, Calls
- Google Reviews
- Reports & Dashboards

## Project Structure

```
/app
  /api              # API routes
  /dashboard        # Dashboard page
  /client/[slug]    # Client detail page
  /settings         # Admin settings pages
  /login            # Login page
/components         # React components
/lib                # Utility functions
/prisma             # Database schema & seed
```

## Deployment to Railway

1. Create a new project on Railway
2. Add a PostgreSQL database
3. Connect your GitHub repository
4. Railway will automatically:
   - Build the app
   - Run migrations
   - Seed the database
   - Start the server

Environment variables needed:
- `DATABASE_URL` (auto-configured by Railway)
- `NEXTAUTH_SECRET` (generate a random string)
- `NEXTAUTH_URL` (your Railway app URL)

## Next Phases

- **Phase 2**: SEO data integration (rankings, backlinks, audits)
- **Phase 3**: Analytics integration (GA4, GSC)
- **Phase 4**: Ads & Leads integration (Meta, GHL)
- **Phase 5**: Reporting & advanced features

## License

Proprietary - Home Builder Marketers
