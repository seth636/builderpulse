import { PrismaClient } from '@prisma/client';
import { generateReportSummary, ReportData } from './report-ai';

const prisma = new PrismaClient();

function fmtDuration(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = Math.round(secs % 60);
  return `${m}m ${s}s`;
}

function stars(rating: number): string {
  const full = Math.round(rating);
  return '★'.repeat(full) + '☆'.repeat(5 - full);
}

function barChart(data: { label: string; value: number }[], color = '#14b8a6'): string {
  if (!data.length) return '';
  const max = Math.max(...data.map((d) => d.value), 1);
  const barW = Math.max(4, Math.floor(560 / data.length) - 4);
  const gap = Math.max(2, Math.floor(560 / data.length) - barW);
  const totalW = data.length * (barW + gap);
  const bars = data
    .map((d, i) => {
      const h = Math.max(2, Math.round((d.value / max) * 120));
      const x = 20 + i * (barW + gap);
      const y = 130 - h;
      return `<rect x="${x}" y="${y}" width="${barW}" height="${h}" fill="${color}" rx="2"/>`;
    })
    .join('');
  return `<svg viewBox="0 0 600 150" style="width:100%;height:150px;display:block">${bars}</svg>`;
}

function pieChart(data: { label: string; value: number }[]): string {
  if (!data.length) return '';
  const colors = ['#14b8a6', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#10b981', '#f97316'];
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return '';
  let angle = -Math.PI / 2;
  const cx = 80, cy = 80, r = 70;
  const paths: string[] = [];
  data.forEach((d, i) => {
    const slice = (d.value / total) * 2 * Math.PI;
    const x1 = cx + r * Math.cos(angle);
    const y1 = cy + r * Math.sin(angle);
    const x2 = cx + r * Math.cos(angle + slice);
    const y2 = cy + r * Math.sin(angle + slice);
    const large = slice > Math.PI ? 1 : 0;
    paths.push(
      `<path d="M${cx},${cy} L${x1.toFixed(2)},${y1.toFixed(2)} A${r},${r} 0 ${large},1 ${x2.toFixed(2)},${y2.toFixed(2)} Z" fill="${colors[i % colors.length]}"/>`
    );
    angle += slice;
  });
  const legend = data
    .map(
      (d, i) =>
        `<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;font-size:12px;color:#64748b">
          <div style="width:12px;height:12px;border-radius:2px;background:${colors[i % colors.length]};flex-shrink:0"></div>
          <span>${d.label} (${Math.round((d.value / total) * 100)}%)</span>
        </div>`
    )
    .join('');
  return `<div style="display:flex;align-items:center;gap:24px;flex-wrap:wrap">
    <svg viewBox="0 0 160 160" style="width:160px;height:160px;flex-shrink:0">${paths.join('')}</svg>
    <div>${legend}</div>
  </div>`;
}

function section(title: string, content: string): string {
  return `<div style="margin-bottom:40px;page-break-inside:avoid">
    <h2 style="font-size:20px;font-weight:700;color:#0f172a;margin:0 0 20px;padding-bottom:10px;border-bottom:2px solid #e2e8f0">${title}</h2>
    ${content}
  </div>`;
}

function cards(items: { label: string; value: string; sub?: string; trend?: number }[], cols = 4): string {
  const colStr = `repeat(${cols},1fr)`;
  const cardItems = items
    .map((item) => {
      const trendHtml =
        item.trend !== undefined
          ? `<div style="font-size:13px;font-weight:600;color:${item.trend >= 0 ? '#10b981' : '#ef4444'};margin-top:4px">${item.trend >= 0 ? '▲' : '▼'} ${Math.abs(item.trend)}% MoM</div>`
          : '';
      const subHtml = item.sub ? `<div style="font-size:12px;color:#94a3b8;margin-top:2px">${item.sub}</div>` : '';
      return `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px">
        <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:#64748b;font-weight:600;margin-bottom:6px">${item.label}</div>
        <div style="font-size:24px;font-weight:700;color:#0f172a">${item.value}</div>
        ${trendHtml}${subHtml}
      </div>`;
    })
    .join('');
  return `<div style="display:grid;grid-template-columns:${colStr};gap:16px;margin-bottom:24px">${cardItems}</div>`;
}

function table(headers: string[], rows: string[][]): string {
  const thead = headers
    .map(
      (h) =>
        `<th style="background:#0f172a;color:white;padding:10px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.05em">${h}</th>`
    )
    .join('');
  const tbody = rows
    .map(
      (row, i) =>
        `<tr style="background:${i % 2 === 1 ? '#f8fafc' : 'white'}">${row.map((cell) => `<td style="padding:10px 12px;font-size:13px;color:#334155;border-bottom:1px solid #f1f5f9">${cell}</td>`).join('')}</tr>`
    )
    .join('');
  return `<div style="overflow:hidden;border-radius:8px;border:1px solid #e2e8f0;margin-bottom:24px">
    <table style="width:100%;border-collapse:collapse">
      <thead><tr>${thead}</tr></thead>
      <tbody>${tbody}</tbody>
    </table>
  </div>`;
}

function buildReportHtml(
  clientName: string,
  periodLabel: string,
  data: ReportData,
  aiSummary: string,
  aiRecommendations: string
): string {
  const now = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const sections: string[] = [];

  // Executive Summary
  if (aiSummary) {
    const summaryHtml = aiSummary
      .split('\n\n')
      .map((p) => `<p style="margin:0 0 12px;line-height:1.7;color:#1e293b">${p.trim()}</p>`)
      .join('');
    sections.push(
      section(
        'Executive Summary',
        `<div style="background:#f0fdf9;border:1px solid #99f6e4;border-radius:8px;padding:20px">${summaryHtml}</div>`
      )
    );
  }

  // Website Traffic
  if (data.ga4) {
    const g = data.ga4;
    const momPct = g.sessionsPrevMonth > 0 ? Math.round(((g.sessions - g.sessionsPrevMonth) / g.sessionsPrevMonth) * 100) : 0;
    const cardHtml = cards([
      { label: 'Sessions', value: g.sessions.toLocaleString(), trend: momPct },
      { label: 'Users', value: g.users.toLocaleString() },
      { label: 'Bounce Rate', value: `${g.bounceRate.toFixed(1)}%` },
      { label: 'Avg Duration', value: fmtDuration(g.avgSessionDuration) },
    ], 4);

    const chartHtml = g.dailySessions.length
      ? `<div style="margin-bottom:24px"><div style="font-size:13px;font-weight:600;color:#64748b;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.05em">Sessions Over Time</div>${barChart(g.dailySessions.map((d) => ({ label: d.date, value: d.sessions })))}</div>`
      : '';

    const pieHtml = g.sources.length
      ? `<div style="margin-bottom:24px"><div style="font-size:13px;font-weight:600;color:#64748b;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.05em">Traffic Sources</div>${pieChart(g.sources.map((s) => ({ label: s.source, value: s.sessions })))}</div>`
      : '';

    const tableHtml = g.topPages.length
      ? table(['Page', 'Sessions'], g.topPages.slice(0, 10).map((p) => [p.page, p.sessions.toLocaleString()]))
      : '';

    sections.push(section('Website Traffic', cardHtml + chartHtml + pieHtml + tableHtml));
  }

  // SEO Performance
  if (data.gsc) {
    const g = data.gsc;
    const momPct = g.clicksPrevMonth > 0 ? Math.round(((g.clicks - g.clicksPrevMonth) / g.clicksPrevMonth) * 100) : 0;
    const cardHtml = cards([
      { label: 'Clicks', value: g.clicks.toLocaleString(), trend: momPct },
      { label: 'Impressions', value: g.impressions.toLocaleString() },
      { label: 'Avg Position', value: g.avgPosition.toFixed(1) },
    ], 3);

    const tableHtml = g.topKeywords.length
      ? table(['Keyword', 'Clicks', 'Position'], g.topKeywords.slice(0, 10).map((k) => [k.keyword, k.clicks.toLocaleString(), k.position.toFixed(1)]))
      : '';

    sections.push(section('SEO Performance', cardHtml + tableHtml));
  }

  // Advertising
  if (data.meta) {
    const m = data.meta;
    const cardHtml = cards([
      { label: 'Ad Spend', value: `$${m.spend.toFixed(2)}` },
      { label: 'Leads', value: m.leads.toLocaleString() },
      { label: 'Cost Per Lead', value: `$${m.cpl.toFixed(2)}` },
      { label: 'CTR', value: `${m.ctr.toFixed(2)}%` },
    ], 4);

    const chartHtml = m.dailySpend.length
      ? `<div style="margin-bottom:24px"><div style="font-size:13px;font-weight:600;color:#64748b;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.05em">Daily Ad Spend</div>${barChart(m.dailySpend.map((d) => ({ label: d.date, value: d.spend })), '#3b82f6')}</div>`
      : '';

    const tableHtml = m.campaigns.length
      ? table(['Campaign', 'Spend', 'Leads', 'CPL'], m.campaigns.map((c) => [c.name, `$${c.spend.toFixed(2)}`, c.leads.toLocaleString(), `$${c.cpl.toFixed(2)}`]))
      : '';

    sections.push(section('Advertising', cardHtml + chartHtml + tableHtml));
  }

  // Leads & CRM
  if (data.ghl) {
    const g = data.ghl;
    const cardHtml = cards([
      { label: 'New Leads', value: g.newLeads.toLocaleString() },
      { label: 'Appointments', value: g.appointments.toLocaleString() },
    ], 2);

    const pieHtml = g.sources.length
      ? `<div style="margin-bottom:24px"><div style="font-size:13px;font-weight:600;color:#64748b;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.05em">Lead Sources</div>${pieChart(g.sources.map((s) => ({ label: s.source || 'Unknown', value: s.count })))}</div>`
      : '';

    const tableHtml = g.recentLeads.length
      ? table(['Name', 'Source', 'Status', 'Date'], g.recentLeads.slice(0, 10).map((l) => [l.name, l.source || '-', l.status || '-', l.date]))
      : '';

    sections.push(section('Leads & CRM', cardHtml + pieHtml + tableHtml));
  }

  // Reviews
  if (data.reviews) {
    const r = data.reviews;
    const cardHtml = cards([
      { label: 'Avg Rating', value: `${r.avgRating.toFixed(1)} ★` },
      { label: 'Total Reviews', value: r.totalReviews.toLocaleString() },
      { label: 'New This Month', value: r.newReviews.toLocaleString() },
    ], 3);

    const reviewRows = r.recentReviews.slice(0, 5).map((rev) => [
      `<span style="color:#f59e0b;font-size:16px">${stars(rev.rating)}</span>`,
      rev.text ? rev.text.slice(0, 100) + (rev.text.length > 100 ? '...' : '') : '-',
      rev.date,
      rev.replied ? '<span style="color:#10b981;font-weight:600">Yes</span>' : '<span style="color:#94a3b8">No</span>',
    ]);

    const tableHtml = reviewRows.length
      ? table(['Rating', 'Review', 'Date', 'Replied'], reviewRows)
      : '';

    sections.push(section('Reviews', cardHtml + tableHtml));
  }

  // Recommendations
  if (aiRecommendations) {
    const bullets = aiRecommendations
      .split('\n')
      .filter((l) => l.trim().match(/^[\-\*\•]|^\d+\./))
      .map((l) => l.replace(/^[\-\*\•]\s*|^\d+\.\s*/, '').trim())
      .filter(Boolean);
    const bulletHtml = bullets.length
      ? `<ul style="margin:0;padding:0 0 0 20px">${bullets.map((b) => `<li style="margin-bottom:10px;line-height:1.6;color:#1e293b">${b}</li>`).join('')}</ul>`
      : `<p style="color:#1e293b">${aiRecommendations}</p>`;
    sections.push(
      section(
        'Recommendations',
        `<div style="background:#f0fdf9;border:1px solid #99f6e4;border-radius:8px;padding:20px">${bulletHtml}</div>`
      )
    );
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${clientName} — ${periodLabel} Report</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: white; color: #1e293b; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none !important; }
      .page-break { page-break-before: always; }
    }
  </style>
</head>
<body>
  <!-- Cover Page -->
  <div style="background:#0f172a;min-height:100vh;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:60px 40px;page-break-after:always">
    <div style="font-size:48px;font-weight:900;color:#14b8a6;letter-spacing:-1px;margin-bottom:40px">HBM</div>
    <div style="font-size:14px;text-transform:uppercase;letter-spacing:0.15em;color:#94a3b8;margin-bottom:16px">Monthly Performance Report</div>
    <div style="font-size:48px;font-weight:800;color:white;margin-bottom:16px;line-height:1.1">${clientName}</div>
    <div style="font-size:24px;color:#38bdf8;font-weight:600;margin-bottom:40px">${periodLabel}</div>
    <div style="width:60px;height:2px;background:#14b8a6;margin-bottom:40px"></div>
    <div style="font-size:14px;color:#64748b">Prepared by Home Builder Marketers</div>
    <div style="font-size:13px;color:#475569;margin-top:8px">Generated ${now}</div>
  </div>

  <!-- Report Body -->
  <div style="max-width:900px;margin:0 auto;padding:60px 40px">
    ${sections.join('\n')}
  </div>
</body>
</html>`;
}

export async function generateReport(
  clientId: number,
  periodStart: Date,
  periodEnd: Date
): Promise<number> {
  // Fetch client
  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client) throw new Error(`Client ${clientId} not found`);

  const startStr = periodStart.toISOString().split('T')[0];
  const endStr = periodEnd.toISOString().split('T')[0];

  // Period label
  const periodLabel = periodStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Prev month range
  const prevEnd = new Date(periodStart);
  prevEnd.setDate(prevEnd.getDate() - 1);
  const prevStart = new Date(prevEnd);
  prevStart.setDate(1);

  // ---- GA4 ----
  let ga4Data: ReportData['ga4'] | undefined;
  try {
    const ga4Rows = await prisma.ga4Metric.findMany({
      where: {
        client_id: clientId,
        date: { gte: periodStart, lte: periodEnd },
      },
    });

    if (ga4Rows.length > 0) {
      const totalSessions = ga4Rows.reduce((s, r) => s + r.sessions, 0);
      const totalUsers = ga4Rows.reduce((s, r) => s + r.total_users, 0);
      const avgBounce = ga4Rows.reduce((s, r) => s + r.bounce_rate, 0) / ga4Rows.length;
      const avgDuration = ga4Rows.reduce((s, r) => s + r.avg_session_duration, 0) / ga4Rows.length;

      // Prev month sessions
      const prevGa4 = await prisma.ga4Metric.findMany({
        where: { client_id: clientId, date: { gte: prevStart, lte: prevEnd } },
      });
      const prevSessions = prevGa4.reduce((s, r) => s + r.sessions, 0);

      // Daily sessions
      const dailySessions = ga4Rows
        .sort((a, b) => a.date.getTime() - b.date.getTime())
        .map((r) => ({
          date: r.date.toISOString().split('T')[0],
          sessions: r.sessions,
        }));

      // Top pages
      const pages = await prisma.ga4Page.findMany({
        where: {
          client_id: clientId,
          start_date: { lte: endStr },
          end_date: { gte: startStr },
        },
        orderBy: { page_views: 'desc' },
        take: 10,
      });
      const topPages = pages.map((p) => ({ page: p.page_path, sessions: p.page_views }));

      // Sources
      const srcRows = await prisma.ga4Source.findMany({
        where: {
          client_id: clientId,
          start_date: { lte: endStr },
          end_date: { gte: startStr },
        },
      });
      const srcMap: Record<string, number> = {};
      for (const s of srcRows) {
        const key = s.source || 'direct';
        srcMap[key] = (srcMap[key] || 0) + s.sessions;
      }
      const sources = Object.entries(srcMap)
        .map(([source, sessions]) => ({ source, sessions }))
        .sort((a, b) => b.sessions - a.sessions)
        .slice(0, 6);

      ga4Data = {
        sessions: totalSessions,
        sessionsPrevMonth: prevSessions,
        users: totalUsers,
        bounceRate: avgBounce,
        avgSessionDuration: avgDuration,
        topPages,
        sources,
        dailySessions,
      };
    }
  } catch (e) {
    console.error('GA4 aggregation error:', e);
  }

  // ---- GSC ----
  let gscData: ReportData['gsc'] | undefined;
  try {
    const gscRows = await prisma.gscMetric.findMany({
      where: {
        client_id: clientId,
        date: { gte: periodStart, lte: periodEnd },
      },
    });

    if (gscRows.length > 0) {
      const totalClicks = gscRows.reduce((s, r) => s + r.clicks, 0);
      const totalImpressions = gscRows.reduce((s, r) => s + r.impressions, 0);
      const avgPosition = gscRows.reduce((s, r) => s + r.position, 0) / gscRows.length;

      // Prev month clicks
      const prevGsc = await prisma.gscMetric.findMany({
        where: { client_id: clientId, date: { gte: prevStart, lte: prevEnd } },
      });
      const prevClicks = prevGsc.reduce((s, r) => s + r.clicks, 0);

      // Top keywords by clicks
      const kwMap: Record<string, { clicks: number; posSum: number; count: number }> = {};
      for (const r of gscRows) {
        if (!kwMap[r.query]) kwMap[r.query] = { clicks: 0, posSum: 0, count: 0 };
        kwMap[r.query].clicks += r.clicks;
        kwMap[r.query].posSum += r.position;
        kwMap[r.query].count += 1;
      }
      const topKeywords = Object.entries(kwMap)
        .map(([keyword, v]) => ({ keyword, clicks: v.clicks, position: v.posSum / v.count }))
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 10);

      // Top pages
      const pageMap: Record<string, number> = {};
      for (const r of gscRows) {
        pageMap[r.page] = (pageMap[r.page] || 0) + r.clicks;
      }
      const topPages = Object.entries(pageMap)
        .map(([page, clicks]) => ({ page, clicks }))
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 10);

      gscData = {
        clicks: totalClicks,
        clicksPrevMonth: prevClicks,
        impressions: totalImpressions,
        avgPosition,
        topKeywords,
        topPages,
      };
    }
  } catch (e) {
    console.error('GSC aggregation error:', e);
  }

  // ---- Meta Ads ----
  let metaData: ReportData['meta'] | undefined;
  try {
    const metaRows = await prisma.metaAd.findMany({
      where: {
        client_id: clientId,
        date: { gte: periodStart, lte: periodEnd },
      },
    });

    if (metaRows.length > 0) {
      const totalSpend = metaRows.reduce((s, r) => s + r.spend, 0);
      const totalLeads = metaRows.reduce((s, r) => s + r.conversions, 0);
      const totalClicks = metaRows.reduce((s, r) => s + r.clicks, 0);
      const totalImpressions = metaRows.reduce((s, r) => s + r.impressions, 0);
      const cpl = totalLeads > 0 ? totalSpend / totalLeads : 0;
      const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

      // Campaigns
      const campMap: Record<string, { spend: number; leads: number }> = {};
      for (const r of metaRows) {
        if (!campMap[r.campaign_name]) campMap[r.campaign_name] = { spend: 0, leads: 0 };
        campMap[r.campaign_name].spend += r.spend;
        campMap[r.campaign_name].leads += r.conversions;
      }
      const campaigns = Object.entries(campMap)
        .map(([name, v]) => ({ name, spend: v.spend, leads: v.leads, cpl: v.leads > 0 ? v.spend / v.leads : 0 }))
        .sort((a, b) => b.spend - a.spend)
        .slice(0, 10);

      // Daily spend
      const dayMap: Record<string, number> = {};
      for (const r of metaRows) {
        const d = r.date.toISOString().split('T')[0];
        dayMap[d] = (dayMap[d] || 0) + r.spend;
      }
      const dailySpend = Object.entries(dayMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, spend]) => ({ date, spend }));

      metaData = { spend: totalSpend, leads: totalLeads, cpl, ctr, campaigns, dailySpend };
    }
  } catch (e) {
    console.error('Meta aggregation error:', e);
  }

  // ---- GHL ----
  let ghlData: ReportData['ghl'] | undefined;
  try {
    const ghlLeads = await prisma.ghlLead.findMany({
      where: {
        client_id: clientId,
        created_date: { gte: periodStart, lte: periodEnd },
      },
      orderBy: { created_date: 'desc' },
    });

    const ghlAppts = await prisma.ghlAppointment.findMany({
      where: {
        client_id: clientId,
        appointment_date: { gte: periodStart, lte: periodEnd },
      },
    });

    if (ghlLeads.length > 0 || ghlAppts.length > 0) {
      // Sources
      const srcMap: Record<string, number> = {};
      for (const l of ghlLeads) {
        const key = l.source || 'Unknown';
        srcMap[key] = (srcMap[key] || 0) + 1;
      }
      const sources = Object.entries(srcMap)
        .map(([source, count]) => ({ source, count }))
        .sort((a, b) => b.count - a.count);

      const recentLeads = ghlLeads.slice(0, 10).map((l) => ({
        name: l.name,
        source: l.source || 'Unknown',
        status: l.status || '-',
        date: l.created_date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      }));

      ghlData = {
        newLeads: ghlLeads.length,
        appointments: ghlAppts.length,
        sources,
        recentLeads,
      };
    }
  } catch (e) {
    console.error('GHL aggregation error:', e);
  }

  // ---- Reviews ----
  let reviewsData: ReportData['reviews'] | undefined;
  try {
    const allReviews = await prisma.googleReview.findMany({
      where: { client_id: clientId },
      orderBy: { review_date: 'desc' },
    });

    const newReviews = allReviews.filter(
      (r) => r.review_date >= periodStart && r.review_date <= periodEnd
    );

    if (allReviews.length > 0) {
      const avgRating =
        allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length;
      const recentReviews = newReviews.slice(0, 5).map((r) => ({
        rating: r.rating,
        text: r.text || '',
        date: r.review_date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        replied: !!r.reply_text,
      }));

      reviewsData = {
        avgRating,
        totalReviews: allReviews.length,
        newReviews: newReviews.length,
        recentReviews,
      };
    }
  } catch (e) {
    console.error('Reviews aggregation error:', e);
  }

  // Build ReportData
  const reportData: ReportData = {
    clientName: client.name,
    month: periodLabel,
    ga4: ga4Data,
    gsc: gscData,
    meta: metaData,
    ghl: ghlData,
    reviews: reviewsData,
  };

  // Generate AI summary
  const { summary, recommendations } = await generateReportSummary(reportData);

  // Build HTML
  const html = buildReportHtml(client.name, periodLabel, reportData, summary, recommendations);

  // Upsert report (replace existing for same client+period)
  const existing = await prisma.report.findFirst({
    where: {
      client_id: clientId,
      period_start: periodStart,
      period_end: periodEnd,
    },
  });

  let report;
  if (existing) {
    report = await prisma.report.update({
      where: { id: existing.id },
      data: {
        period_label: periodLabel,
        status: 'draft',
        ai_summary: summary,
        ai_recommendations: recommendations,
        report_html: html,
        sent_at: null,
      },
    });
  } else {
    report = await prisma.report.create({
      data: {
        client_id: clientId,
        period_start: periodStart,
        period_end: periodEnd,
        period_label: periodLabel,
        status: 'draft',
        ai_summary: summary,
        ai_recommendations: recommendations,
        report_html: html,
      },
    });
  }

  return report.id;
}
