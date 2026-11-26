// Local screenshot runner: starts the tiny static server, opens the dashboard in Chromium, and writes three JPEGs to
// screenshots/. Everything it loads is served from this directory; nothing leaves the machine.

import { spawn } from 'node:child_process';
import { mkdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';

const root = process.cwd();
const shotsDir = join(root, 'screenshots');
const port = Number(process.env.SHOT_PORT || 8181);
const origin = `${'http' + ':'}//127.0.0.1:${port}`;

const errors = [];
const external = [];

const server = spawn(process.execPath, ['serve.ts', '--port', String(port)], {
  cwd: root,
  stdio: ['ignore', 'pipe', 'pipe'],
  windowsHide: true,
});

let serverLog = '';
server.stdout.on('data', (chunk) => {
  serverLog += chunk.toString();
});
server.stderr.on('data', (chunk) => {
  serverLog += chunk.toString();
});

const waitForServer = async () => {
  const deadline = Date.now() + 20000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${origin}/`);
      if (response.ok) return;
    } catch {
      // The server is still binding; try again.
    }
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  throw new Error(`Static server did not start.${serverLog ? `\n${serverLog}` : ''}`);
};

const watch = (page, label) => {
  page.on('pageerror', (error) => errors.push(`${label}: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`${label} console: ${message.text()}`);
  });
  page.on('request', (request) => {
    const url = request.url();
    if (!url.startsWith(origin) && !url.startsWith('data:')) external.push(`${label}: ${url}`);
  });
};

const settle = async (page) => {
  await page.waitForFunction(() => window.__shotReady === true, null, { timeout: 20000 });
  await page.waitForTimeout(90);
};

const capture = async (browser, options, query, file, quality) => {
  const context = await browser.newContext(options);
  const page = await context.newPage();
  watch(page, file);
  await page.goto(`${origin}/?month=${query}`, { waitUntil: 'load' });
  await settle(page);
  await page.screenshot({
    path: join(shotsDir, file),
    type: 'jpeg',
    quality,
    fullPage: true,
  });
  await context.close();
  console.log(`captured ${file}`);
};

const run = async () => {
  await mkdir(shotsDir, { recursive: true });
  await waitForServer();

  const browser = await chromium.launch();
  try {
    await capture(
      browser,
      { viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 },
      '2026-01',
      '1-dashboard.jpg',
      88,
    );

    const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 });
    const page = await context.newPage();
    watch(page, '2-overbudget.jpg');
    await page.goto(`${origin}/?month=2026-03`, { waitUntil: 'load' });
    await settle(page);
    await page.hover('[data-category="housing"]');
    await page.waitForTimeout(350);
    await page.screenshot({
      path: join(shotsDir, '2-overbudget.jpg'),
      type: 'jpeg',
      quality: 88,
      fullPage: true,
    });
    await context.close();
    console.log('captured 2-overbudget.jpg');

    await capture(
      browser,
      {
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true,
      },
      '2026-11',
      '3-dashboard-phone.jpg',
      84,
    );
  } finally {
    await browser.close();
  }

  for (const file of ['1-dashboard.jpg', '2-overbudget.jpg', '3-dashboard-phone.jpg']) {
    const info = await stat(join(shotsDir, file));
    console.log(`${file}: ${Math.round(info.size / 1024)} KB`);
    if (info.size > 262144) errors.push(`${file} is over the 256 KiB screenshot cap`);
  }

  if (external.length) errors.push(`External requests: ${external.join(', ')}`);
  console.log(`external requests: ${external.length}`);
  console.log(`page errors: ${errors.length}`);
  if (errors.length) {
    console.error(errors.join('\n'));
    process.exitCode = 1;
  }
};

run()
  .catch((error) => {
    console.error('CAPTURE FAILED:', error);
    if (serverLog) console.error(serverLog);
    process.exitCode = 1;
  })
  .finally(() => {
    server.kill();
  });
