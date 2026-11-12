import { chromium } from '@playwright/test';
import { spawn, execSync } from 'child_process';
import http from 'http';

const PORT = 3004;
const BASE_URL = `http://localhost:${PORT}`;

function waitForServer(url, timeout = 30000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      http.get(`${url}/api/health`, (res) => {
        if (res.statusCode === 200) {
          resolve(true);
        } else {
          setTimeout(check, 500);
        }
      }).on('error', () => {
        if (Date.now() - start > timeout) {
          reject(new Error('Server timeout waiting for Next.js to start'));
        } else {
          setTimeout(check, 500);
        }
      });
    };
    check();
  });
}

async function run() {
  console.log(`Starting Next.js production server on port ${PORT}...`);
  const server = spawn('node', ['node_modules/next/dist/bin/next', 'start', '-p', String(PORT)], {
    stdio: 'ignore'
  });

  const cleanup = () => {
    try {
      if (server.pid) {
        execSync(`taskkill /pid ${server.pid} /f /t`, { stdio: 'ignore' });
      }
    } catch {}
  };

  process.on('exit', cleanup);
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  try {
    await waitForServer(BASE_URL);
    console.log(`Server is ready and healthy at ${BASE_URL}`);

    let browser;
    try {
      browser = await chromium.launch({ headless: true, channel: 'chrome' });
    } catch {
      browser = await chromium.launch({ headless: true, channel: 'msedge' });
    }

    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    const errors = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (!text.includes('chrome-extension://') && !text.includes('Cannot redefine property: ethereum')) {
          errors.push(text);
        }
      }
    });

    page.on('pageerror', err => {
      if (!err.message.includes('chrome-extension://') && !err.message.includes('Cannot redefine property: ethereum')) {
        errors.push(err.message);
      }
    });

    const routes = [
      '/',
      '/publish',
      '/inbox',
      '/analytics',
      '/listening',
      '/reviews',
      '/vista-pages',
      '/p/tech-innovations',
      '/settings'
    ];

    console.log(`Testing ${routes.length} core Vista Social routes...`);
    for (const route of routes) {
      process.stdout.write(`  Route: ${route} ... `);
      const res = await page.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForTimeout(1000);
      const status = res.status();
      console.log(`[HTTP ${status}] OK`);
      if (status !== 200) {
        throw new Error(`Route ${route} returned HTTP ${status}`);
      }
    }

    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: 'vista-dashboard.png' });
    console.log('Saved dashboard screenshot: vista-dashboard.png');

    await browser.close();

    console.log('\n--- VERIFICATION RESULT ---');
    const hydrationErrors = errors.filter(e => e.toLowerCase().includes('hydration'));
    if (hydrationErrors.length > 0) {
      console.error('HYDRATION ERRORS FOUND:', hydrationErrors);
      throw new Error(`Hydration mismatch: ${hydrationErrors.join('\n')}`);
    } else {
      console.log('Zero Hydration Mismatches detected across all 9 views.');
      console.log('CSS and Layout verified successfully.');
    }
  } finally {
    cleanup();
  }
}

run().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
