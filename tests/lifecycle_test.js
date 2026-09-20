const puppeteer = require(process.env.PUPPETEER_PATH || 'puppeteer');
const BASE = 'http://localhost:4173';
const API = 'http://localhost:4000/api';
let failures = 0;
const consoleErrors = [];

function check(label, cond, extra) {
  if (cond) console.log(`OK   ${label}`);
  else { failures++; console.log(`FAIL ${label}`, extra || ''); }
}

async function apiCall(method, path, body, token) {
  const res = await fetch(API + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, json: await res.json().catch(() => null) };
}

async function main() {
  // --- Seed a fresh request + offer via API so the UI has a clean case to drive ---
  const client = (await apiCall('POST', '/auth/register', {
    email: `ui-client-${Date.now()}@example.com`, password: 'testpass123', name: 'UI Test Client', role: 'client',
  })).json;
  const provider = (await apiCall('POST', '/auth/register', {
    email: `ui-provider-${Date.now()}@example.com`, password: 'testpass123', name: 'UI Test Provider', role: 'provider', providerType: 'Professional',
  })).json;

  const req = (await apiCall('POST', '/requests', {
    title: 'Lifecycle test request', categorySlug: 'website', purpose: 'My Business',
    description: 'End to end lifecycle test: I need a small business website with contact details.',
    budgetRange: '₹5,000–₹10,000', timeline: 'This week',
  }, client.token)).json;

  const offer = (await apiCall('POST', `/offers/requests/${req.request.id}/offers`, {
    price: 7500, deliveryDays: 5, message: 'I can build this for you.',
    includes: ['Homepage', 'Contact page'],
    milestones: [{ title: 'First draft', amount: 4000 }, { title: 'Final delivery', amount: 3500 }],
  }, provider.token)).json;

  const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || undefined, args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', (e) => consoleErrors.push('[pageerror] ' + e.message));
  page.on('response', (r) => { if (r.status() >= 400) consoleErrors.push(`HTTP ${r.status()} ${new URL(r.url()).pathname}`); });
  page.on('dialog', async (d) => { await d.accept(); }); // auto-accept confirm() dialogs

  async function loginAs(token, user) {
    await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
    await page.evaluate((t, u) => {
      localStorage.setItem('fh_token', t);
      localStorage.setItem('fh_user', JSON.stringify(u));
    }, token, user);
  }
  async function goto(p) { await page.goto(BASE + p, { waitUntil: 'networkidle0', timeout: 20000 }); await new Promise(r => setTimeout(r, 700)); }
  async function clickText(text, exact = false) {
    return page.evaluate((t, ex) => {
      const btn = Array.from(document.querySelectorAll('button, a')).find(b => ex ? b.textContent.trim() === t : b.textContent.includes(t));
      if (btn) { btn.click(); return true; }
      return false;
    }, text, exact);
  }

  // ---------- CLIENT: compare offers and accept ----------
  await loginAs(client.token, client.user);
  await goto(`/requests/${req.request.id}`);
  check('client sees offers section on own request', await page.evaluate(() => document.body.innerText.includes('Offers (1)')));
  check('offer details expandable', await clickText('Show what'));
  await new Promise(r => setTimeout(r, 400));
  check('offer milestones visible after expand', await page.evaluate(() => document.body.innerText.includes('First draft')));

  await clickText('Accept', true);
  await page.waitForFunction(() => location.pathname.startsWith('/projects/'), { timeout: 15000 });
  await new Promise(r => setTimeout(r, 1000));
  check('accepting offer navigates to project workspace', page.url().includes('/projects/'));
  const projectUrl = new URL(page.url()).pathname;
  check('workspace shows planning status', await page.evaluate(() => document.body.innerText.includes('Planning')));
  await clickText('Milestones', true);
  await new Promise(r => setTimeout(r, 600));
  check('milestones carried over from offer', await page.evaluate(() => document.body.innerText.includes('First draft')));

  // ---------- PROVIDER: start work, milestones, submit delivery ----------
  await loginAs(provider.token, provider.user);
  await goto(projectUrl);
  check('provider sees Start working', await page.evaluate(() => document.body.innerText.includes('Start working')));
  await clickText('Start working');
  await new Promise(r => setTimeout(r, 1200));
  check('project moved to Working', await page.evaluate(() => document.body.innerText.includes('Working')));

  await clickText('Milestones', true);
  await new Promise(r => setTimeout(r, 500));
  await clickText('Start', true);
  await new Promise(r => setTimeout(r, 1000));
  check('milestone advanced to in progress', await page.evaluate(() => document.body.innerText.includes('In progress')));

  await clickText('Delivery', true);
  await new Promise(r => setTimeout(r, 500));
  check('provider sees Submit Delivery form', await page.evaluate(() => document.body.innerText.includes('Submit Delivery')));
  await page.type('textarea', 'Here is the finished website, ready for your review.');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button')).filter(b => b.textContent.includes('Submit Delivery'));
    btns[btns.length - 1].click();
  });
  await new Promise(r => setTimeout(r, 1600));
  check('delivery submitted', await page.evaluate(() => document.body.innerText.includes('Submitted')));

  // ---------- CLIENT: approve delivery -> completed -> review ----------
  await loginAs(client.token, client.user);
  await goto(projectUrl);
  await clickText('Delivery', true);
  await new Promise(r => setTimeout(r, 700));
  check('client sees Approve Delivery', await page.evaluate(() => document.body.innerText.includes('Approve Delivery')));
  await clickText('Approve Delivery');
  await new Promise(r => setTimeout(r, 1800));
  check('project marked completed after approval', await page.evaluate(() => document.body.innerText.includes('Completed')));
  check('Leave a Review appears after completion', await page.evaluate(() => document.body.innerText.includes('Leave a Review')));

  await clickText('Leave a Review');
  await new Promise(r => setTimeout(r, 600));
  check('review modal opens', await page.evaluate(() => document.body.innerText.includes('Leave a review')));
  await page.type('textarea', 'Excellent work, delivered ahead of schedule.');
  await clickText('Submit review');
  await new Promise(r => setTimeout(r, 1800));
  check('review submitted (button gone)', !(await page.evaluate(() => document.body.innerText.includes('Leave a Review'))));

  // Review shows on provider's public profile
  await goto(`/providers/${provider.user.id}`);
  check('review visible on provider profile', await page.evaluate(() => document.body.innerText.includes('Excellent work')));
  check('provider rating updated from review', await page.evaluate(() => document.body.innerText.includes('5.0')));

  // ---------- MESSAGING ----------
  await goto('/messages');
  check('messages list shows the project conversation', await page.evaluate(() => document.body.innerText.includes('UI Test Provider')));
  const convLink = await page.$$eval('a[href^="/messages/"]', (as) => as[0]?.getAttribute('href') || null);
  if (convLink) {
    await goto(convLink);
    await page.type('textarea', 'Thanks again for the great work!');
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.getAttribute('aria-label') === 'Send message');
      btn?.click();
    });
    await new Promise(r => setTimeout(r, 1500));
    check('message sent and appears in thread', await page.evaluate(() => document.body.innerText.includes('Thanks again for the great work')));
  }

  // ---------- SAVED + notifications ----------
  await goto(`/providers/${provider.user.id}`);
  await clickText('Save', true);
  await new Promise(r => setTimeout(r, 1200));
  await goto('/dashboard/saved');
  check('saved provider appears in Saved', await page.evaluate(() => document.body.innerText.includes('UI Test Provider')));

  await goto('/dashboard/notifications');
  check('client has notifications', await page.evaluate(() => !document.body.innerText.includes('Nothing here yet')));

  // ---------- Business rule in UI: request no longer accepts offers ----------
  await loginAs(provider.token, provider.user);
  await goto(`/requests/${req.request.id}`);
  check('closed request does not show Send Offer', !(await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button')).some(b => b.textContent.trim() === 'Send Offer');
  })));

  await browser.close();

  console.log('\n--- console errors ---');
  const real = consoleErrors.filter(e => !e.includes('favicon') && !e.includes('/css2') && !e.includes('fonts.googleapis'));
  real.length ? real.slice(0, 10).forEach(e => console.log(' ', e)) : console.log('none');
  console.log(`\n${failures === 0 && real.length === 0 ? 'ALL LIFECYCLE CHECKS PASSED' : failures + ' failure(s), ' + real.length + ' console error(s)'}`);
  process.exit(failures === 0 && real.length === 0 ? 0 : 1);
}

main().catch(e => { console.error(e); process.exit(1); });
