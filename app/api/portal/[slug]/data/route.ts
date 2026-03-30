import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function getPortalSession(req: NextRequest) {
  const cookie = req.cookies.get('portal_session');
  if (!cookie) return null;
  try {
    const data = JSON.parse(Buffer.from(cookie.value, 'base64').toString('utf8'));
    return data;
  } catch {
    return null;
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const tokenParam = searchParams.get('token');
    const startDate = searchParams.get('start_date') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const endDate = searchParams.get('end_date') || new Date().toISOString().split('T')[0];

    const client = await prisma.client.findUnique({ where: { slug: params.slug } });
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Check authorization
    let authorized = false;

    // 1. Token-based access
    if (tokenParam && client.portal_enabled && client.portal_token === tokenParam) {
      authorized = true;
    }

    // 2. Portal session (client role)
    if (!authorized) {
      const portalSession = getPortalSession(req);
      if (portalSession && portalSession.role === 'client' && portalSession.clientId === client.id) {
        authorized = true;
      }
    }

    // 3. Admin/PM via NextAuth
    if (!authorized) {
      const session = await getServerSession(authOptions);
      if (session && ['admin', 'pm'].includes((session.user as any).role || '')) {
        authorized = true;
      }
    }

    if (!authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all data
    const [
      ga4Daily,
      ga4Pages,
      ga4Sources,
      gscMetrics,
      metaAds,
      ghlLeads,
      ghlAppointments,
      googleReviews,
      reports,
    ] = await Promise.all([
      client.ga4_property_id ? prisma.ga4Metric.findMany({
        where: { client_id: client.id, date: { gte: new Date(startDate), lte: new Date(endDate) } },
        orderBy: { date: 'asc' },
      }) : [],
      client.ga4_property_id ? prisma.ga4Page.findMany({
        where: { client_id: client.id, start_date: startDate, end_date: endDate },
        orderBy: { page_views: 'desc' },
        take: 50,
      }) : [],
      client.ga4_property_id ? prisma.ga4Source.findMany({
        where: { client_id: client.id, start_date: startDate, end_date: endDate },
        orderBy: { sessions: 'desc' },
      }) : [],
      client.gsc_site_url ? prisma.gscMetric.findMany({
        where: { client_id: client.id, date: { gte: new Date(startDate), lte: new Date(endDate) } },
        orderBy: { date: 'asc' },
      }) : [],
      client.meta_ad_account_id ? prisma.metaAd.findMany({
        where: { client_id: client.id, date: { gte: new Date(startDate), lte: new Date(endDate + 'T23:59:59Z') } },
        orderBy: { date: 'desc' },
      }) : [],
      client.ghl_location_id ? prisma.ghlLead.findMany({
        where: { client_id: client.id, created_date: { gte: new Date(startDate), lte: new Date(endDate + 'T23:59:59Z') } },
        orderBy: { created_date: 'desc' },
      }) : [],
      client.ghl_location_id ? prisma.ghlAppointment.findMany({
        where: { client_id: client.id, appointment_date: { gte: new Date(startDate), lte: new Date(endDate + 'T23:59:59Z') } },
        orderBy: { appointment_date: 'desc' },
      }) : [],
      prisma.googleReview.findMany({
        where: { client_id: client.id },
        orderBy: { review_date: 'desc' },
        take: 20,
      }),
      prisma.report.findMany({
        where: { client_id: client.id, status: 'sent' },
        orderBy: { period_start: 'desc' },
        take: 12,
      }),
    ]);

    // Compute summaries
    const ga4Summary = (ga4Daily as any[]).length > 0 ? {
      totalSessions: (ga4Daily as any[]).reduce((s: number, r: any) => s + r.sessions, 0),
      totalUsers: (ga4Daily as any[]).reduce((s: number, r: any) => s + r.total_users, 0),
      avgBounceRate: (ga4Daily as any[]).reduce((s: number, r: any) => s + r.bounce_rate, 0) / (ga4Daily as any[]).length,
      totalConversions: (ga4Daily as any[]).reduce((s: number, r: any) => s + r.conversions, 0),
    } : null;

    const gscSummary = (gscMetrics as any[]).length > 0 ? (() => {
      const totalClicks = (gscMetrics as any[]).reduce((s: number, r: any) => s + r.clicks, 0);
      const totalImpressions = (gscMetrics as any[]).reduce((s: number, r: any) => s + r.impressions, 0);
      const avgPosition = (gscMetrics as any[]).reduce((s: number, r: any) => s + r.position, 0) / (gscMetrics as any[]).length;
      const avgCtr = totalImpressions > 0 ? totalClicks / totalImpressions : 0;
      return { totalClicks, totalImpressions, avgPosition, avgCtr };
    })() : null;

    const metaSummary = (metaAds as any[]).length > 0 ? {
      totalSpend: (metaAds as any[]).reduce((s: number, r: any) => s + r.spend, 0),
      totalClicks: (metaAds as any[]).reduce((s: number, r: any) => s + r.clicks, 0),
      totalImpressions: (metaAds as any[]).reduce((s: number, r: any) => s + r.impressions, 0),
      totalConversions: (metaAds as any[]).reduce((s: number, r: any) => s + r.conversions, 0),
    } : null;

    const ghlSummary = (ghlLeads as any[]).length > 0 ? {
      newLeads: (ghlLeads as any[]).length,
      appointments: (ghlAppointments as any[]).length,
    } : null;

    const reviewsSummary = (googleReviews as any[]).length > 0 ? {
      totalReviews: (googleReviews as any[]).length,
      averageRating: (googleReviews as any[]).reduce((s: number, r: any) => s + r.rating, 0) / (googleReviews as any[]).length,
    } : null;

    return NextResponse.json({
      client: {
        id: client.id,
        name: client.name,
        slug: client.slug,
        website_url: client.website_url,
        ga4_property_id: client.ga4_property_id,
        gsc_site_url: client.gsc_site_url,
        meta_ad_account_id: client.meta_ad_account_id,
        ghl_location_id: client.ghl_location_id,
      },
      ga4: { daily: ga4Daily, pages: ga4Pages, sources: ga4Sources, summary: ga4Summary },
      gsc: { metrics: gscMetrics, summary: gscSummary },
      meta: { ads: metaAds, summary: metaSummary },
      ghl: { leads: ghlLeads, appointments: ghlAppointments, summary: ghlSummary },
      reviews: { items: googleReviews, summary: reviewsSummary },
      reports,
    });
  } catch (error) {
    console.error('GET /api/portal/[slug]/data error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
