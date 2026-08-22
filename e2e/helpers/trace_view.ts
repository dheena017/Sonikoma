import { Page } from '@playwright/test';

/**
 * Renders a visual card onto the Playwright page canvas so Trace Viewer displays
 * a styled UI screenshot and DOM snapshot for API and unit function tests.
 */
export async function renderTraceCard(
  page: Page,
  title: string,
  meta: {
    type: 'API Endpoint' | 'Unit Function';
    target: string;
    status: number | string;
    input?: any;
    output?: any;
  }
) {
  const isSuccess = typeof meta.status === 'number' ? [200, 201, 400, 401, 404, 422, 503].includes(meta.status) : meta.status === 'PASSED';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            background-color: #09090b;
            color: #f4f4f5;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 32px;
            display: flex;
            justify-content: center;
            align-items: flex-start;
          }
          .card {
            width: 100%;
            max-width: 800px;
            background: #121217;
            border: 1px solid #27272a;
            border-radius: 14px;
            padding: 24px;
            box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5);
          }
          .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 1px solid #27272a;
            padding-bottom: 16px;
            margin-bottom: 20px;
          }
          .badge {
            background: rgba(147, 51, 234, 0.2);
            color: #c084fc;
            border: 1px solid rgba(147, 51, 234, 0.35);
            padding: 4px 10px;
            border-radius: 6px;
            font-family: monospace;
            font-size: 12px;
            font-weight: bold;
          }
          .status {
            background: ${isSuccess ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.2)'};
            color: ${isSuccess ? '#6ee7b7' : '#fda4af'};
            border: 1px solid ${isSuccess ? 'rgba(16, 185, 129, 0.4)' : 'rgba(244, 63, 94, 0.4)'};
            padding: 4px 12px;
            border-radius: 999px;
            font-family: monospace;
            font-size: 12px;
            font-weight: bold;
          }
          .section-title {
            font-size: 11px;
            color: #71717a;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            margin: 14px 0 6px 0;
            font-family: monospace;
            font-weight: bold;
          }
          pre {
            background: #060608;
            border: 1px solid #27272a;
            border-radius: 8px;
            padding: 12px;
            color: #c084fc;
            font-family: 'JetBrains Mono', monospace;
            font-size: 12px;
            overflow-x: auto;
            margin: 0;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <div>
              <span class="badge">${meta.type}</span>
              <h2 style="margin: 8px 0 0 0; font-size: 18px; color: #fff;">${title}</h2>
              <div style="font-family: monospace; font-size: 13px; color: #a1a1aa; margin-top: 4px;">${meta.target}</div>
            </div>
            <div class="status">✓ STATUS: ${meta.status}</div>
          </div>
          
          ${meta.input ? `
            <div class="section-title">Input Parameters / Payload</div>
            <pre>${typeof meta.input === 'string' ? meta.input : JSON.stringify(meta.input, null, 2)}</pre>
          ` : ''}

          ${meta.output ? `
            <div class="section-title">Response / Calculated Result</div>
            <pre>${typeof meta.output === 'string' ? meta.output : JSON.stringify(meta.output, null, 2)}</pre>
          ` : ''}
        </div>
      </body>
    </html>
  `;

  await page.setContent(html);
}
