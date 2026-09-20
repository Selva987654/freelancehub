const puppeteer = require(process.env.PUPPETEER_PATH || 'puppeteer');

(async () => {
  const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || undefined, args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 375, height: 800 });

  const paths = ['/', '/discover', '/business', '/students', '/not-sure', '/login', '/register'];
  for (const p of paths) {
    await page.goto('http://localhost:4173' + p, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 600));
    const info = await page.evaluate(() => {
      const vw = window.innerWidth;
      const out = [];
      document.querySelectorAll('*').forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.right > vw + 1 || r.left < -1) {
          out.push({
            tag: el.tagName,
            cls: (el.className && el.className.toString().slice(0, 90)) || '',
            left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width),
            text: (el.textContent || '').trim().slice(0, 40),
          });
        }
      });
      return { vw, scrollWidth: document.documentElement.scrollWidth, offenders: out.slice(0, 8) };
    });
    console.log(`\n=== ${p} (vw=${info.vw}, scrollWidth=${info.scrollWidth}) ===`);
    info.offenders.forEach(o => console.log(`  ${o.tag}.${o.cls} | L${o.left} R${o.right} W${o.width} | "${o.text}"`));
    if (info.offenders.length === 0) console.log('  none');
  }
  await browser.close();
})();
