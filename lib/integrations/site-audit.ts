import { load } from 'cheerio';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuditIssue {
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  url: string;
  howToFix: string;
}

export async function runSiteAudit(
  clientId: number,
  websiteUrl: string
): Promise<{ healthScore: number; issuesCount: number; issues: AuditIssue[] }> {
  const issues: AuditIssue[] = [];
  const crawledUrls = new Set<string>();
  const urlsToCrawl = [websiteUrl];
  const pagesWithSlowLoad: string[] = [];

  let baseUrl: string;
  try {
    baseUrl = new URL(websiteUrl).origin;
  } catch {
    return { healthScore: 0, issuesCount: 1, issues: [{ severity: 'critical', title: 'Invalid URL', description: 'Website URL is not valid.', url: websiteUrl, howToFix: 'Update the website URL in client settings.' }] };
  }

  const fetchWithTimeout = async (url: string, timeoutMs = 10000) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const start = Date.now();
      const res = await fetch(url, { signal: controller.signal, redirect: 'follow', headers: { 'User-Agent': 'BuilderPulse-SEO-Bot/1.0' } });
      const duration = Date.now() - start;
      return { res, duration };
    } catch {
      return null;
    } finally {
      clearTimeout(timeout);
    }
  };

  // Check robots.txt
  const robotsResult = await fetchWithTimeout(`${baseUrl}/robots.txt`);
  if (!robotsResult || !robotsResult.res.ok) {
    issues.push({
      severity: 'warning',
      title: 'Missing robots.txt',
      description: 'No robots.txt file found.',
      url: `${baseUrl}/robots.txt`,
      howToFix: 'Create a robots.txt file at your domain root to guide search engine crawlers.',
    });
  }

  // Check sitemap.xml
  const sitemapResult = await fetchWithTimeout(`${baseUrl}/sitemap.xml`);
  if (!sitemapResult || !sitemapResult.res.ok) {
    issues.push({
      severity: 'warning',
      title: 'Missing sitemap.xml',
      description: 'No sitemap.xml found at the standard location.',
      url: `${baseUrl}/sitemap.xml`,
      howToFix: 'Create and submit an XML sitemap to help search engines discover all your pages.',
    });
  }

  // Check SSL
  if (websiteUrl.startsWith('http://')) {
    issues.push({
      severity: 'critical',
      title: 'No SSL Certificate',
      description: 'Website is served over HTTP, not HTTPS.',
      url: websiteUrl,
      howToFix: 'Install an SSL certificate and redirect all HTTP traffic to HTTPS.',
    });
  }

  // Crawl pages (homepage + up to 9 internal pages)
  let crawlCount = 0;
  while (urlsToCrawl.length > 0 && crawlCount < 10) {
    const url = urlsToCrawl.shift()!;
    if (crawledUrls.has(url)) continue;
    crawledUrls.add(url);
    crawlCount++;

    const result = await fetchWithTimeout(url, 15000);
    if (!result) continue;

    const { res, duration } = result;

    if (duration > 3000) {
      issues.push({
        severity: 'warning',
        title: 'Slow Response Time',
        description: `Page took ${(duration / 1000).toFixed(1)}s to load (threshold: 3s).`,
        url,
        howToFix: 'Optimize server response time, enable caching, and reduce page size.',
      });
    }

    if (!res.ok && res.status >= 400) {
      issues.push({
        severity: 'critical',
        title: `Broken Page (${res.status})`,
        description: `Page returned HTTP ${res.status}.`,
        url,
        howToFix: `Fix or redirect this URL to remove the ${res.status} error.`,
      });
      continue;
    }

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) continue;

    const html = await res.text();
    const $ = load(html);

    // Title tag
    if (!$('title').text().trim()) {
      issues.push({ severity: 'critical', title: 'Missing Title Tag', description: 'Page has no <title> tag.', url, howToFix: 'Add a unique, descriptive title tag (50-60 characters) to this page.' });
    }

    // Meta description
    if (!$('meta[name="description"]').attr('content')) {
      issues.push({ severity: 'warning', title: 'Missing Meta Description', description: 'Page has no meta description.', url, howToFix: 'Add a compelling meta description (150-160 characters) to improve click-through rates.' });
    }

    // H1
    if ($('h1').length === 0) {
      issues.push({ severity: 'warning', title: 'Missing H1 Tag', description: 'Page has no H1 heading.', url, howToFix: 'Add a single H1 tag that describes the main topic of this page.' });
    }

    // Open Graph
    if (!$('meta[property="og:title"]').attr('content')) {
      issues.push({ severity: 'info', title: 'Missing Open Graph Tags', description: 'Page is missing og:title meta tag.', url, howToFix: 'Add Open Graph meta tags to improve social media sharing appearance.' });
    }

    // Canonical
    if (!$('link[rel="canonical"]').attr('href')) {
      issues.push({ severity: 'info', title: 'Missing Canonical Tag', description: 'No canonical URL specified.', url, howToFix: 'Add a <link rel="canonical"> tag to prevent duplicate content issues.' });
    }

    // Viewport
    if (!$('meta[name="viewport"]').attr('content')) {
      issues.push({ severity: 'critical', title: 'Missing Viewport Meta Tag', description: 'Page is not configured for mobile devices.', url, howToFix: 'Add <meta name="viewport" content="width=device-width, initial-scale=1"> to the <head>.' });
    }

    // Favicon
    if (!$('link[rel*="icon"]').attr('href')) {
      issues.push({ severity: 'info', title: 'Missing Favicon', description: 'No favicon detected.', url, howToFix: 'Add a favicon to improve brand recognition in browser tabs.' });
    }

    // Alt text on images
    $('img').each((_, el) => {
      const alt = $(el).attr('alt');
      if (alt === undefined || alt === '') {
        const src = ($(el).attr('src') || 'unknown').substring(0, 80);
        issues.push({ severity: 'warning', title: 'Missing Image Alt Text', description: `Image missing alt text: ${src}`, url, howToFix: 'Add descriptive alt text to all images for accessibility and SEO.' });
      }
    });

    // Collect internal links for crawling
    if (crawlCount < 10) {
      $('a[href]').each((_, el) => {
        const href = $(el).attr('href') || '';
        try {
          const absolute = new URL(href, baseUrl).href;
          if (
            absolute.startsWith(baseUrl) &&
            !crawledUrls.has(absolute) &&
            !urlsToCrawl.includes(absolute) &&
            !absolute.includes('#') &&
            !absolute.match(/\.(pdf|jpg|jpeg|png|gif|svg|zip|css|js)(\?|$)/i)
          ) {
            urlsToCrawl.push(absolute);
          }
        } catch {}
      });
    }
  }

  // Deduplicate issues by title+url
  const seen = new Set<string>();
  const uniqueIssues = issues.filter((i) => {
    const key = `${i.title}:${i.url}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Count by severity
  const errorsCount = uniqueIssues.filter((i) => i.severity === 'critical').length;
  const warningsCount = uniqueIssues.filter((i) => i.severity === 'warning').length;
  const noticesCount = uniqueIssues.filter((i) => i.severity === 'info').length;

  // Calculate score
  let score = 100;
  score -= errorsCount * 10;
  score -= warningsCount * 5;
  score -= noticesCount * 2;
  score = Math.max(0, score);

  // Save to DB — store issues as JSON in a text field via overall_score etc.
  // The schema has: overall_score, errors_count, warnings_count, notices_count, pages_crawled
  // We store the full issues JSON in a separate way by using the existing fields
  // Since schema has no issues JSON column, we'll store structured data in DB fields
  // and return the issues directly. For history we store counts + score.
  await prisma.siteAudit.create({
    data: {
      client_id: clientId,
      date: new Date(),
      overall_score: score,
      errors_count: errorsCount,
      warnings_count: warningsCount,
      notices_count: noticesCount,
      pages_crawled: crawlCount,
    },
  });

  return { healthScore: score, issuesCount: uniqueIssues.length, issues: uniqueIssues };
}

export async function getLatestAuditIssues(clientId: number): Promise<{
  audit: any;
  issues: AuditIssue[];
} | null> {
  const audit = await prisma.siteAudit.findFirst({
    where: { client_id: clientId },
    orderBy: { date: 'desc' },
  });
  if (!audit) return null;

  // We don't store issues JSON in DB (schema doesn't have that column)
  // Return just the audit metadata; the UI will show counts
  return { audit, issues: [] };
}
