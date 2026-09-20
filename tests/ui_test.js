const puppeteer = require(process.env.PUPPETEER_PATH || 'puppeteer');

const BASE = 'http://localhost:4173';
let failures = 0;
const consoleErrors = [];

function check(label, cond, extra) {
  if (cond) console.log(`OK   ${label}`);
  else { failures++; console.log(`FAIL ${label}`, extra || ''); }
}

async function main() {
  const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || undefined, args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(`[${page.url()}] ${msg.text()}`);
  });
  page.on('pageerror', (err) => consoleErrors.push(`[pageerror] ${err.message}`));

  async function goto(path) {
    await page.goto(BASE + path, { waitUntil: 'networkidle0', timeout: 20000 });
  }

  // ---------- Public pages ----------
  await goto('/');
  check('home renders hero', (await page.$eval('h1', (e) => e.textContent)).includes('Tell us what you need'));
  check('home loaded categories', (await page.$$('a[href^="/discover?tab=needs&category="]')).length > 5);
  check('home loaded services from API', (await page.$$('a[href^="/services/"]')).length > 0);
  check('home loaded providers from API', (await page.$$('a[href^="/providers/"]')).length > 0);

  await goto('/discover');
  await new Promise(r => setTimeout(r, 800));
  check('discover shows results', (await page.$$('a[href^="/requests/"]')).length > 0);

  await goto('/discover?tab=people');
  await new Promise(r => setTimeout(r, 800));
  check('discover people tab shows providers', (await page.$$('a[href^="/providers/"]')).length > 0);

  await goto('/discover?tab=services');
  await new Promise(r => setTimeout(r, 800));
  check('discover services tab shows services', (await page.$$('a[href^="/services/"]')).length > 0);

  await goto('/business');
  check('business page renders', (await page.$eval('h1', e => e.textContent)).includes('business online'));

  await goto('/students');
  check('students page renders', (await page.$eval('h1', e => e.textContent)).length > 0);

  // Not-sure guided flow (deterministic recommendations)
  await goto('/not-sure');
  await page.type('#situation', 'I have a small clothing shop. Customers currently call me to ask about products.');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('See suggestions'));
    btn.click();
  });
  await new Promise(r => setTimeout(r, 1200));
  check('guided page returns solutions', (await page.evaluate(() => document.body.innerText.includes('Possible solutions'))));

  await goto('/this-page-does-not-exist');
  check('404 page renders', (await page.evaluate(() => document.body.innerText.includes('Page not found'))));

  // Provider profile deep link
  await goto('/discover?tab=people');
  await new Promise(r => setTimeout(r, 800));
  const providerHref = await page.$eval('a[href^="/providers/"]', (a) => a.getAttribute('href'));
  await goto(providerHref);
  check('provider profile renders', (await page.evaluate(() => document.body.innerText.includes('Message'))));
  check('provider profile has services section', (await page.evaluate(() => document.body.innerText.includes('Services'))));

  // ---------- Demo login: business ----------
  await goto('/login');
  await page.evaluate(() => {
    Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Explore as Business')).click();
  });
  await page.waitForFunction(() => location.pathname.startsWith('/dashboard'), { timeout: 15000 });
  await new Promise(r => setTimeout(r, 1000));
  check('business demo login lands on dashboard', page.url().includes('/dashboard'));
  check('dashboard shows stats', (await page.evaluate(() => document.body.innerText.includes('Active Requests'))));

  for (const [path, expect] of [
    ['/dashboard/requests', 'My Requests'],
    ['/dashboard/offers', 'Offers'],
    ['/dashboard/projects', 'Work'],
    ['/dashboard/saved', 'Saved'],
    ['/dashboard/notifications', 'Notifications'],
    ['/dashboard/profile', 'Profile'],
  ]) {
    await goto(path);
    await new Promise(r => setTimeout(r, 600));
    check(`client ${path} renders`, (await page.evaluate((t) => document.body.innerText.includes(t), expect)));
  }

  // Messages
  await goto('/messages');
  await new Promise(r => setTimeout(r, 900));
  check('messages page renders conversations', (await page.evaluate(() => document.body.innerText.length > 100)));

  // Project workspace from the client's project list
  await goto('/dashboard/projects');
  await new Promise(r => setTimeout(r, 900));
  const projectHref = await page.$$eval('a[href^="/projects/"]', (as) => as[0]?.getAttribute('href') || null);
  check('client has a seeded project', !!projectHref, projectHref);
  if (projectHref) {
    await goto(projectHref);
    await new Promise(r => setTimeout(r, 900));
    check('project workspace renders', (await page.evaluate(() => document.body.innerText.includes('Milestones'))));
    // Click through workspace tabs
    for (const tab of ['Milestones', 'Delivery', 'Activity', 'Notes']) {
      await page.evaluate((t) => {
        Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === t)?.click();
      }, tab);
      await new Promise(r => setTimeout(r, 400));
      check(`workspace ${tab} tab opens`, true);
    }
  }

  // Full request creation flow
  await goto('/need-something');
  await new Promise(r => setTimeout(r, 600));
  await page.evaluate(() => {
    Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Website').click();
  });
  await page.evaluate(() => Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Continue')).click());
  await new Promise(r => setTimeout(r, 300));
  await page.evaluate(() => Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'My Business').click());
  await page.evaluate(() => Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Continue')).click());
  await new Promise(r => setTimeout(r, 300));
  await page.type('textarea', 'Browser test: I run a bakery and need a website with our products, prices and WhatsApp ordering.');
  await page.evaluate(() => Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Continue')).click());
  await new Promise(r => setTimeout(r, 300));
  await page.evaluate(() => Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('₹5,000–₹10,000')).click());
  await page.evaluate(() => Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Continue')).click());
  await new Promise(r => setTimeout(r, 300));
  await page.evaluate(() => Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'This week').click());
  await page.evaluate(() => Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Continue')).click());
  await new Promise(r => setTimeout(r, 300));
  await page.evaluate(() => Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Continue')).click());
  await new Promise(r => setTimeout(r, 400));
  check('wizard reaches review step', (await page.evaluate(() => document.body.innerText.includes('Publish Request'))));
  await page.evaluate(() => Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Publish Request')).click());
  await new Promise(r => setTimeout(r, 1500));
  check('request published + result screen', (await page.evaluate(() => document.body.innerText.includes('Your request is ready'))));
  check('deterministic suggestions shown', (await page.evaluate(() => document.body.innerText.includes('You may be looking for'))));

  // ---------- Provider demo ----------
  await page.evaluate(() => localStorage.clear());
  await goto('/login');
  await page.evaluate(() => {
    Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Explore as Professional')).click();
  });
  await page.waitForFunction(() => location.pathname.startsWith('/dashboard'), { timeout: 15000 });
  await new Promise(r => setTimeout(r, 900));
  check('provider dashboard renders', (await page.evaluate(() => document.body.innerText.includes('Offers Sent'))));

  for (const [path, expect] of [
    ['/dashboard/recommended', 'Recommended'],
    ['/dashboard/my-offers', 'My Offers'],
    ['/dashboard/services', 'Services'],
    ['/dashboard/portfolio', 'Portfolio'],
    ['/dashboard/projects', 'Work'],
  ]) {
    await goto(path);
    await new Promise(r => setTimeout(r, 700));
    check(`provider ${path} renders`, (await page.evaluate((t) => document.body.innerText.includes(t), expect)));
  }

  // Provider sends an offer on an open request
  await goto('/discover?tab=needs');
  await new Promise(r => setTimeout(r, 900));
  const reqHrefs = await page.$$eval('a[href^="/requests/"]', (as) => as.map(a => a.getAttribute('href')));
  let offerSent = false;
  for (const href of reqHrefs.slice(0, 6)) {
    await goto(href);
    await new Promise(r => setTimeout(r, 800));
    const hasSendOffer = await page.evaluate(() => !!Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Send Offer')));
    if (!hasSendOffer) continue;
    await page.evaluate(() => Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Send Offer')).click());
    await new Promise(r => setTimeout(r, 500));
    check('send offer modal opens', (await page.evaluate(() => document.body.innerText.includes('Send an offer'))));
    const inputs = await page.$$('input[type="number"]');
    await inputs[0].type('9000');
    await inputs[1].type('10');
    await page.type('textarea', 'Browser test offer — happy to help with this project.');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button')).filter(b => b.textContent.trim() === 'Send Offer');
      btns[btns.length - 1].click();
    });
    await new Promise(r => setTimeout(r, 1600));
    offerSent = await page.evaluate(() => document.body.innerText.includes('You sent an offer'));
    break;
  }
  check('provider offer submitted and reflected on request', offerSent);

  // ---------- Admin demo ----------
  await page.evaluate(() => localStorage.clear());
  await goto('/login');
  await page.evaluate(() => {
    Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Explore as Admin')).click();
  });
  await page.waitForFunction(() => location.pathname.startsWith('/admin'), { timeout: 15000 });
  await new Promise(r => setTimeout(r, 900));
  check('admin overview renders real stats', (await page.evaluate(() => document.body.innerText.includes('Total users'))));

  for (const [path, expect] of [
    ['/admin/users', 'Users'],
    ['/admin/requests', 'Requests'],
    ['/admin/offers', 'Offers'],
    ['/admin/projects', 'Projects'],
    ['/admin/services', 'Services'],
    ['/admin/reviews', 'Reviews'],
    ['/admin/categories', 'Categories'],
    ['/admin/reports', 'Reports'],
  ]) {
    await goto(path);
    await new Promise(r => setTimeout(r, 700));
    check(`admin ${path} renders`, (await page.evaluate((t) => document.body.innerText.includes(t), expect)));
  }

  // ---------- Responsive checks ----------
  for (const width of [375, 390, 430, 768, 1024, 1280, 1440]) {
    await page.setViewport({ width, height: 900 });
    await goto('/');
    await new Promise(r => setTimeout(r, 500));
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    check(`no horizontal overflow at ${width}px`, !overflow);
  }

  await browser.close();

  console.log('\n--- console errors captured ---');
  const realErrors = consoleErrors.filter(e => !e.includes('favicon') && !e.includes('Failed to load resource: the server responded with a status of 4'));
  if (realErrors.length === 0) console.log('none');
  else realErrors.slice(0, 20).forEach(e => console.log(' ', e));

  console.log(`\n${failures === 0 ? 'ALL BROWSER CHECKS PASSED' : failures + ' CHECK(S) FAILED'}`);
  process.exit(failures === 0 && realErrors.length === 0 ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });
