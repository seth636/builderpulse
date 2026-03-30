export const dynamic = 'force-dynamic';

import { PrismaClient } from '@prisma/client';
import { notFound } from 'next/navigation';

const prisma = new PrismaClient();

export default async function ReportViewPage({
  params,
}: {
  params: { id: string };
}) {
  const report = await prisma.report.findUnique({
    where: { id: parseInt(params.id) },
    select: { report_html: true, period_label: true, client: { select: { name: true } } },
  });

  if (!report || !report.report_html) {
    notFound();
  }

  const toolbarStyles = `
    .hbm-toolbar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      width: 100%;
      background: white;
      box-shadow: 0 1px 4px rgba(0,0,0,0.12);
      z-index: 9999;
      padding: 8px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
    .hbm-toolbar-left {
      font-size: 14px;
      font-weight: 700;
      color: #0f172a;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .hbm-toolbar-logo {
      font-size: 16px;
      font-weight: 900;
      color: #14b8a6;
    }
    .hbm-toolbar-right button {
      background: #0f172a;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
    }
    .hbm-toolbar-right button:hover {
      background: #1e293b;
    }
    .hbm-report-wrapper {
      padding-top: 50px;
    }
    @media print {
      .hbm-toolbar { display: none !important; }
      .hbm-report-wrapper { padding-top: 0 !important; }
    }
  `;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: toolbarStyles }} />
      <div className="hbm-toolbar">
        <div className="hbm-toolbar-left">
          <span className="hbm-toolbar-logo">HBM</span>
          <span style={{ color: '#64748b' }}>Report Viewer</span>
          {report.client?.name && (
            <>
              <span style={{ color: '#cbd5e1' }}>·</span>
              <span style={{ color: '#334155' }}>{report.client.name} — {report.period_label}</span>
            </>
          )}
        </div>
        <div className="hbm-toolbar-right">
          <button onClick={() => {}} id="hbm-print-btn">Print / Save PDF</button>
        </div>
      </div>
      <div className="hbm-report-wrapper">
        <div dangerouslySetInnerHTML={{ __html: report.report_html }} />
      </div>
      <script
        dangerouslySetInnerHTML={{
          __html: `document.getElementById('hbm-print-btn').addEventListener('click', function(){ window.print(); });`,
        }}
      />
    </>
  );
}
