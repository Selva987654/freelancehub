const db = require('../db');

const BUDGET_MAP = {
  'Under ₹5,000': { min: 0, max: 5000 },
  '₹5,000–₹10,000': { min: 5000, max: 10000 },
  '₹10,000–₹25,000': { min: 10000, max: 25000 },
  '₹25,000–₹50,000': { min: 25000, max: 50000 },
  '₹50,000+': { min: 50000, max: Infinity },
  'Not sure': { min: 0, max: Infinity },
};

function budgetBounds(budgetRange) {
  return BUDGET_MAP[budgetRange] || { min: 0, max: Infinity };
}

/**
 * Rank providers for a given request using simple weighted, explainable rules.
 * This is intentionally NOT an ML/AI system — every point is traceable to a reason.
 */
function recommendProvidersForRequest(request, { limit = 8 } = {}) {
  const providers = db.prepare(
    `SELECT u.id, u.name, u.avatar_url, pp.*
     FROM users u JOIN provider_profiles pp ON pp.user_id = u.id
     WHERE u.is_active = 1`
  ).all();

  const requestSkillIds = db.prepare('SELECT skill_id FROM request_skills WHERE request_id = ?')
    .all(request.id).map(r => r.skill_id);

  const { min: bMin, max: bMax } = budgetBounds(request.budget_range);

  const scored = providers.map((p) => {
    let score = 0;
    const reasons = [];

    // Category experience: has the provider listed a service in this category?
    const catServiceCount = db.prepare(
      'SELECT COUNT(*) c FROM services WHERE provider_id = ? AND category_id = ? AND is_active = 1'
    ).get(p.id, request.category_id).c;
    if (catServiceCount > 0) {
      score += 30;
      reasons.push('Experience in this category');
    }

    // Skill overlap
    if (requestSkillIds.length > 0) {
      const providerSkillIds = db.prepare('SELECT skill_id FROM provider_skills WHERE provider_id = ?')
        .all(p.id).map(r => r.skill_id);
      const overlap = providerSkillIds.filter((s) => requestSkillIds.includes(s));
      if (overlap.length > 0) {
        score += Math.min(30, overlap.length * 12);
        const names = db.prepare(
          `SELECT name FROM skills WHERE id IN (${overlap.map(() => '?').join(',')})`
        ).all(...overlap).map(r => r.name);
        reasons.push(`Skilled in ${names.slice(0, 3).join(', ')}`);
      }
    }

    // Budget compatibility
    if (p.starting_price <= bMax) {
      score += 20;
      reasons.push('Starting price fits your budget');
    }

    // Availability
    if (p.availability === 'Available') {
      score += 10;
      reasons.push('Available to start soon');
    }

    // Rating
    if (p.rating_avg >= 4.5 && p.rating_count >= 3) {
      score += 15;
      reasons.push(`Highly rated (${p.rating_avg.toFixed(1)}★ from ${p.rating_count} reviews)`);
    } else if (p.rating_avg >= 4.0) {
      score += 8;
      reasons.push(`Well rated (${p.rating_avg.toFixed(1)}★)`);
    }

    // Remote friendliness
    if (p.remote) {
      score += 5;
      reasons.push('Works remotely');
    }

    return { provider: p, score, reasons: reasons.slice(0, 4) };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Rank open requests for a given provider — powers the "Recommended for you" dashboard section.
 */
function recommendRequestsForProvider(provider, { limit = 8 } = {}) {
  const requests = db.prepare(`SELECT * FROM requests WHERE status = 'open'`).all();
  const providerSkillIds = db.prepare('SELECT skill_id FROM provider_skills WHERE provider_id = ?')
    .all(provider.user_id).map(r => r.skill_id);
  const providerCategoryIds = db.prepare(
    'SELECT DISTINCT category_id FROM services WHERE provider_id = ?'
  ).all(provider.user_id).map(r => r.category_id);

  const scored = requests.map((r) => {
    let score = 0;
    const reasons = [];

    if (providerCategoryIds.includes(r.category_id)) {
      score += 30;
      reasons.push('Matches your service category');
    }

    const requestSkillIds = db.prepare('SELECT skill_id FROM request_skills WHERE request_id = ?')
      .all(r.id).map(x => x.skill_id);
    const overlap = requestSkillIds.filter((s) => providerSkillIds.includes(s));
    if (overlap.length > 0) {
      score += Math.min(30, overlap.length * 15);
      reasons.push('Matches your skills');
    }

    const { max } = budgetBounds(r.budget_range);
    if (provider.starting_price <= max) {
      score += 20;
      reasons.push('Budget fits your starting price');
    }

    const existingOffer = db.prepare('SELECT id FROM offers WHERE request_id = ? AND provider_id = ?')
      .get(r.id, provider.user_id);
    if (existingOffer) score = -1; // already offered — exclude

    return { request: r, score, reasons: reasons.slice(0, 3) };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * "You may be looking for" — deterministic suggestions shown right after a request is published.
 * Purely rule-based on category slug + keywords in the description. No AI is used or implied.
 */
function suggestOfferingsForRequest(request, categorySlug) {
  const text = `${request.title} ${request.description}`.toLowerCase();
  const has = (...words) => words.some((w) => text.includes(w));

  const suggestions = [];
  const push = (title, description) => suggestions.push({ title, description });

  if (categorySlug === 'website' || has('website', 'site', 'homepage')) {
    push('Business Website', 'A homepage, about and contact page that works well on mobile.');
  }
  if (categorySlug === 'business-digital-setup' || has('menu', 'restaurant', 'cafe', 'café')) {
    push('Digital Menu', 'A simple, shareable menu customers can view on their phone.');
  }
  if (has('whatsapp', 'order', 'ordering', 'call', 'phone')) {
    push('WhatsApp Ordering', 'Let customers order directly through a WhatsApp button or link.');
  }
  if (categorySlug === 'online-store' || has('shop', 'store', 'products', 'sell', 'catalogue', 'catalog')) {
    push('Product Catalogue', 'A clean list of your products with photos and prices to share as a link.');
    push('Online Store', 'A full store with cart and checkout so customers can buy directly.');
  }
  if (categorySlug === 'branding' || has('logo', 'brand', 'branding')) {
    push('Logo & Brand Identity', 'A logo, colours and a simple guide so your business looks consistent.');
  }
  if (categorySlug === 'marketing' || has('google', 'search', 'seo', 'social media', 'instagram')) {
    push('Google Business Presence', 'Get your business easier to find when people search nearby.');
  }
  if (categorySlug === 'mobile-app' || has('app', 'android', 'ios')) {
    push('Mobile App MVP', 'A working first version of your app idea, ready to test with real users.');
  }
  if (categorySlug === 'student-project' || has('college', 'final year', 'project', 'submission')) {
    push('Student Project Help', 'Hands-on help from students and professionals who\u2019ve done similar work.');
  }
  if (categorySlug === 'maintenance' || has('maintain', 'update', 'fix', 'bug')) {
    push('Ongoing Maintenance', 'Someone to keep things updated after launch, as and when you need it.');
  }

  // De-duplicate by title, cap at 4
  const seen = new Set();
  return suggestions.filter((s) => (seen.has(s.title) ? false : (seen.add(s.title), true))).slice(0, 4);
}

/**
 * "Not sure what I need?" guided page — deterministic keyword rules over free text.
 */
function guidedSolutions(text) {
  const t = (text || '').toLowerCase();
  const has = (...words) => words.some((w) => t.includes(w));
  const results = [];
  const push = (title, description) => results.push({ title, description });

  if (has('call', 'calling', 'phone me', 'ask about', 'keep asking')) {
    push('WhatsApp Ordering', 'Let customers browse and order without calling you for every question.');
  }
  if (has('shop', 'store', 'products', 'sell', 'clothing', 'boutique')) {
    push('Product Catalogue', 'A simple, shareable list of what you sell, with photos and prices.');
    push('Online Store', 'A full storefront with cart and checkout if you want to sell online directly.');
  }
  if (has('restaurant', 'cafe', 'café', 'menu', 'food')) {
    push('Digital Menu', 'A menu customers can view on their phone before or during their visit.');
  }
  if (has('website', 'online presence', 'no website', "don't have a site")) {
    push('Business Website', 'A simple site with what you offer, your location and how to reach you.');
  }
  if (has('search', 'google', 'find us', 'find me')) {
    push('Google Business Presence', 'Show up when nearby customers search for what you do.');
  }
  if (has('app', 'mobile', 'android', 'ios')) {
    push('Mobile App', 'A dedicated app if your customers would use it often.');
  }
  if (has('social', 'instagram', 'facebook', 'posts')) {
    push('Social Media Marketing', 'Regular posts and a simple plan to stay visible to customers.');
  }
  if (results.length === 0) {
    push('Business Website', 'A good starting point for most small businesses getting online.');
    push('Not sure yet?', 'Try posting a request in your own words — you\u2019ll get tailored offers from providers.');
  }

  const seen = new Set();
  return results.filter((s) => (seen.has(s.title) ? false : (seen.add(s.title), true))).slice(0, 4);
}

module.exports = { recommendProvidersForRequest, recommendRequestsForProvider, suggestOfferingsForRequest, guidedSolutions, budgetBounds };
