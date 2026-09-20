const bcrypt = require('bcryptjs');
const db = require('./index');
const { id } = require('../utils/ids');

const DEMO_PASSWORD = 'demo1234';

function alreadySeeded() {
  const row = db.prepare('SELECT COUNT(*) AS c FROM users').get();
  return row.c > 0;
}

function hash(pw) {
  return bcrypt.hashSync(pw, 8);
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

function daysFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function seed() {
  if (alreadySeeded() && !process.env.FORCE_RESEED) {
    console.log('[seed] Database already has data — skipping seed (set FORCE_RESEED=1 to force).');
    return;
  }

  console.log('[seed] Seeding demo data...');

  const tx = db.transaction(() => {
    // ---------- Categories ----------
    const categoryDefs = [
      ['Website', 'website', 'Globe', 'Business sites, portfolios, landing pages and web apps.'],
      ['Online Store', 'online-store', 'ShoppingBag', 'E-commerce stores and product catalogues.'],
      ['Mobile App', 'mobile-app', 'Smartphone', 'Android, iOS and cross-platform apps.'],
      ['Design', 'design', 'Palette', 'UI, product and graphic design work.'],
      ['Branding', 'branding', 'Sparkles', 'Logos, brand identity and visual language.'],
      ['Business Digital Setup', 'business-digital-setup', 'Store', 'Digital menus, WhatsApp ordering, Google presence.'],
      ['Student Project', 'student-project', 'GraduationCap', 'College and academic project help.'],
      ['Marketing', 'marketing', 'Megaphone', 'SEO, social media and digital marketing.'],
      ['Maintenance', 'maintenance', 'Wrench', 'Ongoing upkeep, fixes and hosting.'],
      ['Consulting', 'consulting', 'MessageCircle', 'Technical and product advice.'],
      ['Other', 'other', 'MoreHorizontal', 'Anything else you need done.'],
    ];
    const catInsert = db.prepare('INSERT INTO categories (id, name, slug, icon, description) VALUES (?,?,?,?,?)');
    const cat = {};
    for (const [name, slug, icon, description] of categoryDefs) {
      const cid = id('cat');
      catInsert.run(cid, name, slug, icon, description);
      cat[slug] = cid;
    }

    // ---------- Skills ----------
    const skillDefs = [
      ['React', 'website'], ['Node.js', 'website'], ['HTML/CSS', 'website'], ['WordPress', 'website'],
      ['Spring Boot', 'website'], ['PHP', 'website'], ['Java', 'website'],
      ['Shopify', 'online-store'], ['WooCommerce', 'online-store'], ['Payment Integration', 'online-store'],
      ['Flutter', 'mobile-app'], ['React Native', 'mobile-app'], ['Firebase', 'mobile-app'], ['Swift', 'mobile-app'],
      ['Figma', 'design'], ['UI Design', 'design'], ['Illustration', 'design'], ['Photoshop', 'design'], ['Canva', 'design'],
      ['Logo Design', 'branding'], ['Brand Identity', 'branding'], ['Brand Strategy', 'branding'],
      ['SEO', 'marketing'], ['Social Media', 'marketing'], ['Google Ads', 'marketing'], ['Content Writing', 'marketing'],
      ['Google My Business', 'business-digital-setup'], ['WhatsApp Business', 'business-digital-setup'], ['Digital Menu Setup', 'business-digital-setup'],
      ['Website Maintenance', 'maintenance'], ['Bug Fixing', 'maintenance'], ['Hosting Setup', 'maintenance'],
      ['Tech Consulting', 'consulting'], ['Product Strategy', 'consulting'],
      ['Documentation', 'student-project'], ['Presentation Design', 'student-project'], ['Testing & QA', 'student-project'],
      ['MySQL', 'website'], ['PostgreSQL', 'website'],
    ];
    const skillInsert = db.prepare('INSERT INTO skills (id, name, category_id) VALUES (?,?,?)');
    const skill = {};
    for (const [name, catSlug] of skillDefs) {
      const sid = id('skl');
      skillInsert.run(sid, name, cat[catSlug]);
      skill[name] = sid;
    }

    // ---------- Users ----------
    const userInsert = db.prepare(
      'INSERT INTO users (id, email, password_hash, name, role, avatar_url, phone, created_at) VALUES (?,?,?,?,?,?,?,?)'
    );
    const clientProfileInsert = db.prepare(
      'INSERT INTO client_profiles (user_id, business_name, business_type, location, about) VALUES (?,?,?,?,?)'
    );
    const providerProfileInsert = db.prepare(
      `INSERT INTO provider_profiles
       (user_id, provider_type, headline, about, starting_price, delivery_time_days, availability, location, remote, response_time, verified, rating_avg, rating_count, completed_projects, social_links)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
    );
    const providerSkillInsert = db.prepare('INSERT INTO provider_skills (provider_id, skill_id) VALUES (?,?)');

    const pw = hash(DEMO_PASSWORD);
    const U = {}; // name-key -> id

    function makeClient(key, name, email, business_name, business_type, location, about, createdDaysAgo) {
      const uid = id('usr');
      userInsert.run(uid, email, pw, name, 'client', `seed:${key}`, '+91 90000 000' + String(Object.keys(U).length).padStart(2, '0'), daysAgo(createdDaysAgo));
      clientProfileInsert.run(uid, business_name, business_type, location, about);
      U[key] = uid;
      return uid;
    }

    function makeProvider(key, name, email, opts, skillNames, createdDaysAgo) {
      const uid = id('usr');
      userInsert.run(uid, email, pw, name, 'provider', `seed:${key}`, '+91 90000 001' + String(Object.keys(U).length).padStart(2, '0'), daysAgo(createdDaysAgo));
      providerProfileInsert.run(
        uid, opts.type, opts.headline, opts.about, opts.startingPrice, opts.deliveryDays,
        opts.availability || 'Available', opts.location, opts.remote ? 1 : 0, opts.responseTime || 'Within a day',
        opts.verified ? 1 : 0, opts.ratingAvg || 0, opts.ratingCount || 0, opts.completed || 0,
        JSON.stringify(opts.social || {})
      );
      for (const s of skillNames) providerSkillInsert.run(uid, skill[s]);
      U[key] = uid;
      return uid;
    }

    // Admin
    {
      const uid = id('usr');
      userInsert.run(uid, 'admin@freelancerhub.demo', pw, 'FreelancerHub Admin', 'admin', 'seed:admin', '+91 90000 00099', daysAgo(400));
      U.admin = uid;
    }

    // Clients (business owners, students, startups, organizations)
    makeClient('arun', 'Arun Kumar', 'arun@aruncafe.demo', 'Arun Café', 'Café', 'Coimbatore, Tamil Nadu',
      'We run a cosy neighbourhood café known for filter coffee and weekend brunches.', 120);
    makeClient('meena', 'Meena Krishnan', 'meena@meenatextiles.demo', 'Meena Textiles', 'Retail — Clothing', 'Chennai, Tamil Nadu',
      'Family-run clothing store specialising in cotton sarees and daily wear.', 150);
    makeClient('kavitha', 'Kavitha Rajan', 'kavitha@kavithaskitchen.demo', "Kavitha's Kitchen", 'Restaurant', 'Bengaluru, Karnataka',
      'Home-style South Indian restaurant, dine-in and takeaway.', 95);
    makeClient('suresh', 'Suresh Babu', 'suresh@sureshelectronics.demo', 'Suresh Electronics', 'Retail — Electronics', 'Coimbatore, Tamil Nadu',
      'Neighbourhood electronics and appliance repair shop, 15 years in business.', 80);
    makeClient('rohan', 'Rohan Mehta', 'rohan@trackfit.demo', 'TrackFit', 'Startup — Fitness', 'Bengaluru, Karnataka',
      'Early-stage startup building a habit-tracking app for home workouts.', 60);
    makeClient('ananya', 'Ananya Iyer', 'ananya@student.demo', null, 'Student', 'Coimbatore, Tamil Nadu',
      'Final-year design student putting together a portfolio for placements.', 45);
    makeClient('ncc', 'Coimbatore College Tech Fest Committee', 'techfest@nccollege.demo', 'NCC Tech Fest', 'Organization — College Event', 'Coimbatore, Tamil Nadu',
      'Student committee organising the annual inter-college technical festival.', 40);

    // Providers
    makeProvider('rahul', 'Rahul Kumar', 'rahul@dev.demo', {
      type: 'Student', headline: 'Student Developer — React & Node.js',
      about: 'Final-year Computer Science student who has built 6 websites for local businesses and college clubs. I like turning simple ideas into working websites quickly.',
      startingPrice: 4000, deliveryDays: 6, location: 'Coimbatore, Tamil Nadu', remote: true,
      responseTime: 'Within a few hours', verified: true, ratingAvg: 4.8, ratingCount: 9, completed: 11,
      social: { linkedin: 'https://linkedin.com/in/rahulkumar-dev' }
    }, ['React', 'Node.js', 'HTML/CSS', 'MySQL'], 100);

    makeProvider('divya', 'Divya S', 'divya@design.demo', {
      type: 'Student', headline: 'UI & Web Designer',
      about: 'Design student specialising in clean, simple interfaces for small businesses. I focus on making things easy to use, not just pretty.',
      startingPrice: 3000, deliveryDays: 5, location: 'Chennai, Tamil Nadu', remote: true,
      responseTime: 'Within a day', verified: false, ratingAvg: 4.6, ratingCount: 7, completed: 8,
      social: { behance: 'https://behance.net/divyas' }
    }, ['Figma', 'UI Design', 'Canva'], 90);

    makeProvider('arjun', 'Arjun Raj', 'arjun@fullstack.demo', {
      type: 'Professional', headline: 'Full Stack Developer — Business Websites & Web Apps',
      about: '6 years building websites and web applications for small businesses and startups across South India. I handle everything from design to deployment.',
      startingPrice: 8000, deliveryDays: 7, location: 'Coimbatore, Tamil Nadu', remote: true,
      responseTime: 'Within a few hours', verified: true, ratingAvg: 4.9, ratingCount: 34, completed: 41,
      social: { website: 'https://arjunraj.dev', linkedin: 'https://linkedin.com/in/arjunraj' }
    }, ['React', 'Node.js', 'Spring Boot', 'MySQL', 'HTML/CSS'], 300);

    makeProvider('priya', 'Priya Nair', 'priya@branddesign.demo', {
      type: 'Professional', headline: 'UI & Brand Designer',
      about: 'I help small businesses look as good online as they do in person — logos, brand colours, and interfaces that feel consistent everywhere.',
      startingPrice: 6000, deliveryDays: 5, location: 'Kochi, Kerala', remote: true,
      responseTime: 'Within a day', verified: true, ratingAvg: 4.9, ratingCount: 27, completed: 33,
      social: { behance: 'https://behance.net/priyanair', instagram: 'https://instagram.com/priyanairdesign' }
    }, ['Figma', 'UI Design', 'Logo Design', 'Brand Identity', 'Illustration'], 260);

    makeProvider('pixelcraft', 'PixelCraft Studio', 'hello@pixelcraft.demo', {
      type: 'Agency', headline: 'Web, App & E-commerce Studio',
      about: 'A 6-person studio building websites, online stores and apps for growing businesses. One point of contact, a full team behind it.',
      startingPrice: 15000, deliveryDays: 14, location: 'Bengaluru, Karnataka', remote: true,
      responseTime: 'Within a day', verified: true, ratingAvg: 4.7, ratingCount: 19, completed: 22,
      social: { website: 'https://pixelcraftstudio.demo' }
    }, ['React', 'Shopify', 'WooCommerce', 'Flutter', 'SEO'], 220);

    makeProvider('vikram', 'Vikram Singh', 'vikram@backend.demo', {
      type: 'Professional', headline: 'Backend Developer — APIs & Databases',
      about: 'I build the reliable backend systems behind websites and apps — APIs, databases and integrations that don\u2019t fall over.',
      startingPrice: 10000, deliveryDays: 10, location: 'Pune, Maharashtra', remote: true,
      responseTime: 'Within a day', verified: true, ratingAvg: 4.8, ratingCount: 15, completed: 18,
      social: { github: 'https://github.com/vikramsingh' }
    }, ['Java', 'Spring Boot', 'Node.js', 'PostgreSQL', 'MySQL'], 200);

    makeProvider('sneha', 'Sneha Reddy', 'sneha@marketing.demo', {
      type: 'Professional', headline: 'Digital Marketer — SEO & Social Media',
      about: 'I help local businesses get found online — Google presence, social media and simple ad campaigns that fit small budgets.',
      startingPrice: 5000, deliveryDays: 30, location: 'Hyderabad, Telangana', remote: true,
      responseTime: 'Within a day', verified: false, ratingAvg: 4.5, ratingCount: 11, completed: 14,
      social: {}
    }, ['SEO', 'Social Media', 'Google Ads', 'Google My Business', 'Content Writing'], 170);

    makeProvider('karthik', 'Karthik R', 'karthik@wp.demo', {
      type: 'Beginner', headline: 'WordPress & Shopify Setup',
      about: 'Just starting out professionally after 2 years of freelance practice projects. I keep things simple, affordable and honest about timelines.',
      startingPrice: 3500, deliveryDays: 5, location: 'Madurai, Tamil Nadu', remote: true,
      responseTime: 'Within a day', verified: false, ratingAvg: 4.4, ratingCount: 5, completed: 6,
      social: {}
    }, ['WordPress', 'Shopify', 'WooCommerce'], 60);

    makeProvider('nikhil', 'Nikhil Sharma', 'nikhil@mobiledev.demo', {
      type: 'Student', headline: 'Mobile App Developer (Flutter)',
      about: 'Engineering student building Flutter apps as class projects and freelance work. Comfortable with Firebase-backed apps end to end.',
      startingPrice: 9000, deliveryDays: 15, location: 'Delhi, NCR', remote: true,
      responseTime: 'Within a day', verified: false, ratingAvg: 4.6, ratingCount: 4, completed: 5,
      social: {}
    }, ['Flutter', 'Firebase', 'React Native'], 70);

    makeProvider('codecraft', 'CodeCraft Agency', 'team@codecraft.demo', {
      type: 'Agency', headline: 'Custom Software & Enterprise Web Apps',
      about: 'A small team of engineers building custom internal tools and larger web applications for businesses that have outgrown templates.',
      startingPrice: 30000, deliveryDays: 30, location: 'Bengaluru, Karnataka', remote: true,
      responseTime: 'Within a day', verified: true, ratingAvg: 4.7, ratingCount: 8, completed: 9,
      social: { website: 'https://codecraft.demo' }
    }, ['Java', 'Spring Boot', 'React', 'PostgreSQL'], 180);

    makeProvider('deepa', 'Deepa Nair', 'deepa@graphics.demo', {
      type: 'Beginner', headline: 'Graphic & Logo Designer',
      about: 'Self-taught designer, two years into freelancing part-time. I love simple, memorable logos for small shops and cafés.',
      startingPrice: 1500, deliveryDays: 3, location: 'Kozhikode, Kerala', remote: true,
      responseTime: 'Within a day', verified: false, ratingAvg: 4.3, ratingCount: 6, completed: 7,
      social: {}
    }, ['Logo Design', 'Photoshop', 'Canva', 'Illustration'], 50);

    // ---------- Services ----------
    const serviceInsert = db.prepare(
      `INSERT INTO services (id, provider_id, category_id, title, description, starting_price, delivery_days, features, extras, cover_seed, created_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`
    );
    const S = {};
    function addService(key, providerKey, catSlug, title, description, price, days, features, extras) {
      const sid = id('svc');
      serviceInsert.run(sid, U[providerKey], cat[catSlug], title, description, price, days,
        JSON.stringify(features), JSON.stringify(extras || []), `${providerKey}-${key}`, daysAgo(Math.floor(Math.random() * 60) + 5));
      S[key] = sid;
      return sid;
    }

    addService('arjun-biz-site', 'arjun', 'website', 'Business Website',
      'A clean, mobile-friendly website for your business with everything customers need to find and contact you.',
      8000, 7, ['Business homepage', 'About section', 'Contact section', 'Mobile-friendly design', 'WhatsApp button'],
      ['Extra pages', 'Product catalogue', 'Deployment & domain setup', 'Monthly maintenance']);
    addService('arjun-webapp', 'arjun', 'website', 'Custom Web Application',
      'A full web application with user accounts, a database and an admin panel, built to your workflow.',
      25000, 21, ['Custom features to spec', 'User authentication', 'Admin dashboard', 'Database design', '2 rounds of revisions']);

    addService('priya-logo', 'priya', 'branding', 'Logo & Brand Identity',
      'A logo and simple brand kit — colours, fonts and usage guide — so your business looks consistent everywhere.',
      6000, 5, ['3 logo concepts', 'Final logo files', 'Colour palette', 'Font pairing', 'Basic brand guide']);
    addService('priya-ui', 'priya', 'design', 'UI Design for Apps & Websites',
      'Clean, modern interface design in Figma, ready to hand off to a developer.',
      15000, 10, ['Up to 8 screens', 'Mobile + desktop versions', 'Figma source file', '2 revision rounds']);

    addService('pixelcraft-store', 'pixelcraft', 'online-store', 'E-commerce Store Setup',
      'A complete online store with product catalogue, cart and checkout, ready to start selling.',
      20000, 14, ['Product catalogue (up to 50 items)', 'Cart & checkout', 'Payment gateway setup', 'Order notifications']);
    addService('pixelcraft-app', 'pixelcraft', 'mobile-app', 'Mobile App Development',
      'A cross-platform app for iOS and Android built with Flutter, from design to app-store submission.',
      40000, 30, ['iOS & Android app', 'Firebase backend', 'App store submission support', '1 month of bug fixes']);

    addService('rahul-simple-site', 'rahul', 'website', 'Simple Website for Small Business or Students',
      'A straightforward, affordable website — great for small shops, portfolios or college projects.',
      4000, 6, ['Up to 5 pages', 'Mobile-friendly', 'Contact form', 'Basic SEO setup']);

    addService('divya-ui', 'divya', 'design', 'Website & App UI Design',
      'Simple, easy-to-use interface designs for websites and apps, delivered in Figma.',
      5000, 5, ['Up to 6 screens', 'Figma file', '1 revision round']);

    addService('vikram-api', 'vikram', 'website', 'Backend API Development',
      'A reliable backend with a REST API and database, built to connect cleanly with any frontend.',
      12000, 10, ['REST API design', 'Database schema', 'Authentication', 'API documentation']);

    addService('sneha-social', 'sneha', 'marketing', 'Social Media Marketing Package',
      'A month of consistent social media presence — planned posts, captions and basic ad support.',
      5000, 30, ['12 posts/month', 'Content calendar', 'Basic ad setup', 'Monthly performance summary']);

    addService('karthik-wp', 'karthik', 'website', 'WordPress Website Setup',
      'A ready-to-use WordPress website with a theme matched to your business, set up end to end.',
      5000, 5, ['Theme setup & customisation', 'Up to 5 pages', 'Contact form', 'Basic SEO plugin setup']);

    addService('nikhil-app-mvp', 'nikhil', 'mobile-app', 'Flutter App MVP',
      'A working first version of your app idea — enough to test with real users.',
      18000, 20, ['Core screens & flows', 'Firebase backend', 'Basic authentication', 'Ready for user testing']);

    addService('codecraft-enterprise', 'codecraft', 'website', 'Enterprise Web Application',
      'A larger, custom-built web application for internal tools or customer-facing platforms.',
      60000, 45, ['Requirements workshop', 'Custom architecture', 'Admin & reporting tools', 'Post-launch support month']);

    addService('deepa-logo', 'deepa', 'branding', 'Logo Design',
      'A simple, memorable logo for your shop or small business, delivered fast.',
      1500, 3, ['2 logo concepts', 'Final files (PNG, SVG)', '1 revision round']);

    // ---------- Portfolio ----------
    const portfolioInsert = db.prepare(
      'INSERT INTO portfolio_items (id, provider_id, title, description, cover_seed, link, created_at) VALUES (?,?,?,?,?,?,?)'
    );
    function addPortfolio(providerKey, title, description) {
      portfolioInsert.run(id('pf'), U[providerKey], title, description, `${providerKey}-${title}`.toLowerCase().replace(/\s+/g, '-'), null, daysAgo(Math.floor(Math.random() * 200) + 10));
    }
    addPortfolio('arjun', 'Green Leaf Grocers Website', 'Business website with online ordering for a local grocery chain.');
    addPortfolio('arjun', 'ClinicEase Booking App', 'Web app for appointment booking used by a 3-branch clinic.');
    addPortfolio('priya', 'Coastal Coffee Rebrand', 'Full rebrand including logo, packaging and social templates.');
    addPortfolio('priya', 'Urban Threads App UI', 'App interface design for a fashion rental startup.');
    addPortfolio('divya', 'Local Bakery Landing Page', 'One-page website design for a home bakery.');
    addPortfolio('rahul', 'College Fest 2025 Website', 'Registration website for a college technical festival, 2,000+ signups.');
    addPortfolio('pixelcraft', 'Spice Route Online Store', 'E-commerce store for a spice export business.');
    addPortfolio('vikram', 'Inventory API for Retail Chain', 'REST API powering inventory across 8 store locations.');
    addPortfolio('karthik', 'Fitness Studio WordPress Site', 'Class schedule and booking site for a local gym.');
    addPortfolio('nikhil', 'Campus Food Ordering App', 'Flutter app for ordering from campus canteens.');
    addPortfolio('deepa', 'Namma Tiffin Logo', 'Logo and menu card design for a tiffin delivery service.');
    addPortfolio('sneha', 'Bloom Florist Instagram Growth', 'Grew Instagram following from 400 to 4,200 in 6 months.');

    // ---------- Requests ----------
    const requestInsert = db.prepare(
      `INSERT INTO requests (id, client_id, title, category_id, purpose, description, budget_range, timeline, extra_notes, status, created_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`
    );
    const R = {};
    function addRequest(key, clientKey, title, catSlug, purpose, description, budget, timeline, notes, status, createdDaysAgo) {
      const rid = id('req');
      requestInsert.run(rid, U[clientKey], title, cat[catSlug], purpose, description, budget, timeline, notes || null, status, daysAgo(createdDaysAgo));
      R[key] = rid;
      return rid;
    }
    const requestSkillInsert = db.prepare('INSERT INTO request_skills (request_id, skill_id) VALUES (?,?)');
    function tagSkills(reqKey, names) { for (const n of names) requestSkillInsert.run(R[reqKey], skill[n]); }

    addRequest('cafe-website', 'arun', 'Website for our café with menu and WhatsApp ordering', 'website', 'My Business',
      'I run a small café and need a website with menu, location, gallery and WhatsApp ordering. Nothing too fancy — just something customers can check before they visit.',
      '₹5,000–₹10,000', '2–4 weeks', 'We already have menu photos ready to share.', 'in_progress', 26);
    tagSkills('cafe-website', ['React', 'HTML/CSS']);

    addRequest('textile-store', 'meena', 'Online store for my clothing shop', 'online-store', 'My Business',
      'I want an online store for my clothing shop so customers can browse and order from Instagram and WhatsApp instead of calling me each time.',
      '₹10,000–₹25,000', '1–2 months', 'Around 80 products to list to start with.', 'open', 18);
    tagSkills('textile-store', ['Shopify', 'WooCommerce']);

    addRequest('kitchen-menu', 'kavitha', 'Digital menu and simple website for my restaurant', 'business-digital-setup', 'My Business',
      'Need a digital menu and simple website for my restaurant with online ordering. Most of my customers already order through WhatsApp.',
      '₹5,000–₹10,000', 'This week', null, 'open', 9);
    tagSkills('kitchen-menu', ['Digital Menu Setup', 'WhatsApp Business']);

    addRequest('electronics-google', 'suresh', 'Help getting my shop to show up on Google', 'marketing', 'My Business',
      'Need help with my Google presence — want more customers finding my shop online when they search for electronics repair nearby.',
      'Under ₹5,000', 'Flexible', null, 'open', 14);
    tagSkills('electronics-google', ['Google My Business', 'SEO']);

    addRequest('trackfit-brand', 'rohan', 'Landing page and branding for fitness startup', 'branding', 'Startup',
      'Need a landing page and branding for my fitness startup before launch — logo, colours and a simple page to collect early sign-ups.',
      '₹25,000–₹50,000', '2–4 weeks', 'Launching in 6 weeks, so timeline matters.', 'open', 12);
    tagSkills('trackfit-brand', ['Brand Identity', 'Logo Design']);

    addRequest('techfest-site', 'ncc', 'Website for our college tech fest with registration', 'student-project', 'College / Student',
      'Need a website for our annual college tech fest with an event schedule and a registration form for participants.',
      '₹5,000–₹10,000', '2–4 weeks', 'Expecting around 1,500 participants across events.', 'open', 20);
    tagSkills('techfest-site', ['React', 'HTML/CSS']);

    addRequest('cafe-maintenance', 'arun', 'Ongoing maintenance for our café website', 'maintenance', 'My Business',
      'Need someone to maintain and update our website occasionally — new menu items, seasonal photos, that kind of thing.',
      'Under ₹5,000', 'Flexible', null, 'open', 5);

    addRequest('textile-branding', 'meena', 'New logo and brand colours for my clothing shop', 'branding', 'My Business',
      'Want a new logo and brand colours for my clothing shop — the current one feels outdated and doesn\u2019t match our packaging.',
      '₹5,000–₹10,000', '1–2 months', null, 'completed', 70);
    tagSkills('textile-branding', ['Logo Design', 'Brand Identity']);

    addRequest('trackfit-app-ui', 'rohan', 'Mobile app prototype design in Figma', 'design', 'Startup',
      'Need a mobile app prototype design for the TrackFit app in Figma before we start development.',
      '₹10,000–₹25,000', '2–4 weeks', null, 'open', 8);
    tagSkills('trackfit-app-ui', ['Figma', 'UI Design']);

    addRequest('kitchen-marketing', 'kavitha', 'Social media posts and marketing plan', 'marketing', 'My Business',
      'Need social media posts and a simple marketing plan for Instagram — we barely post right now.',
      'Under ₹5,000', 'This week', null, 'open', 3);
    tagSkills('kitchen-marketing', ['Social Media', 'Content Writing']);

    addRequest('ananya-portfolio', 'ananya', 'Portfolio website for my final year submission', 'student-project', 'College / Student',
      'I need a portfolio website for my design projects for my final year submission. Want it to look professional for placements too.',
      'Under ₹5,000', 'This week', 'Need it in about a week for a review deadline.', 'in_progress', 15);
    tagSkills('ananya-portfolio', ['UI Design', 'HTML/CSS']);

    addRequest('electronics-catalogue', 'suresh', 'Simple product catalogue for WhatsApp sharing', 'business-digital-setup', 'My Business',
      'Need a simple product catalogue I can share as a link over WhatsApp — customers keep asking for prices for specific items.',
      '₹5,000–₹10,000', 'This week', null, 'open', 4);
    tagSkills('electronics-catalogue', ['WhatsApp Business']);

    // ---------- Offers ----------
    const offerInsert = db.prepare(
      `INSERT INTO offers (id, request_id, provider_id, price, delivery_days, message, includes, milestones, status, created_at)
       VALUES (?,?,?,?,?,?,?,?,?,?)`
    );
    const O = {};
    function addOffer(key, reqKey, providerKey, price, days, message, includes, milestones, status, createdDaysAgo) {
      const oid = id('off');
      offerInsert.run(oid, R[reqKey], U[providerKey], price, days, message, JSON.stringify(includes), JSON.stringify(milestones), status, daysAgo(createdDaysAgo));
      O[key] = oid;
      return oid;
    }

    // Café website — accepted offer from Arjun (becomes project), plus two other offers that got declined
    addOffer('cafe-arjun', 'cafe-website', 'arjun', 8000, 7,
      'Hi Arun, I\u2019ve built similar café sites before — happy to include the WhatsApp ordering button and a photo gallery within this price.',
      ['Homepage with menu', 'Location & hours', 'Photo gallery', 'WhatsApp ordering button', 'Mobile-friendly'],
      [{ title: 'Design mockup approved', amount: 2000 }, { title: 'Website built & content added', amount: 4000 }, { title: 'Final delivery & handover', amount: 2000 }],
      'accepted', 25);
    addOffer('cafe-rahul', 'cafe-website', 'rahul', 6000, 8,
      'I can build this within your budget — I\u2019ve made similar sites for two other local cafés.',
      ['Homepage with menu', 'Contact section', 'WhatsApp button'],
      [{ title: 'First draft', amount: 3000 }, { title: 'Final delivery', amount: 3000 }],
      'declined', 24);
    addOffer('cafe-pixelcraft', 'cafe-website', 'pixelcraft', 12000, 10,
      'Our studio can deliver a polished site with room to add online ordering later as you grow.',
      ['Homepage with menu', 'Gallery', 'WhatsApp ordering', 'Basic SEO setup'],
      [{ title: 'Kickoff & design', amount: 4000 }, { title: 'Development', amount: 6000 }, { title: 'Launch', amount: 2000 }],
      'declined', 23);

    // Textile store — three open offers
    addOffer('textile-pixelcraft', 'textile-store', 'pixelcraft', 22000, 18,
      'We can set up your catalogue with all 80 products, payment options and order notifications to your phone.',
      ['Product catalogue (80 items)', 'Cart & checkout', 'Payment gateway', 'Order notifications'],
      [{ title: 'Store setup', amount: 10000 }, { title: 'Product upload', amount: 6000 }, { title: 'Launch', amount: 6000 }],
      'pending', 15);
    addOffer('textile-vikram', 'textile-store', 'vikram', 18000, 15,
      'I can build the backend and product system, and pair it with a simple storefront your customers will find easy to use.',
      ['Product catalogue', 'Cart & checkout', 'Basic admin panel'],
      [{ title: 'Backend & database', amount: 9000 }, { title: 'Storefront & launch', amount: 9000 }],
      'pending', 14);
    addOffer('textile-karthik', 'textile-store', 'karthik', 14000, 12,
      'I specialise in WooCommerce stores — can get this live quickly with a design close to your current catalogue photos.',
      ['WooCommerce store setup', 'Product upload (80 items)', 'Payment gateway'],
      [{ title: 'Setup', amount: 7000 }, { title: 'Go live', amount: 7000 }],
      'pending', 13);

    // TrackFit branding — offers
    addOffer('trackfit-priya', 'trackfit-brand', 'priya', 28000, 18,
      'I\u2019d love to work on TrackFit — happy to include a landing page design alongside the brand identity.',
      ['Logo & brand identity', 'Landing page design', 'Brand guide'],
      [{ title: 'Brand concepts', amount: 10000 }, { title: 'Landing page design', amount: 12000 }, { title: 'Final files', amount: 6000 }],
      'pending', 10);
    addOffer('trackfit-divya', 'trackfit-brand', 'divya', 20000, 20,
      'I can put together a clean, modern brand identity and a simple sign-up landing page within your timeline.',
      ['Logo concepts', 'Colour palette', 'Landing page design'],
      [{ title: 'Concepts', amount: 8000 }, { title: 'Final delivery', amount: 12000 }],
      'pending', 9);

    // Tech fest site — offers
    addOffer('techfest-rahul', 'techfest-site', 'rahul', 7000, 12,
      'I built our own college fest site last year with a similar registration flow — happy to reuse and adapt that experience here.',
      ['Event schedule page', 'Registration form', 'Mobile-friendly design'],
      [{ title: 'Design & schedule pages', amount: 3000 }, { title: 'Registration system', amount: 3000 }, { title: 'Launch', amount: 1000 }],
      'pending', 17);
    addOffer('techfest-nikhil', 'techfest-site', 'nikhil', 8500, 14,
      'Can build this with a simple admin view so your committee can see registrations without extra tools.',
      ['Event schedule page', 'Registration form', 'Admin view of sign-ups'],
      [{ title: 'Build', amount: 5500 }, { title: 'Launch & handover', amount: 3000 }],
      'pending', 16);

    // Trackfit app UI — offers
    addOffer('trackfitui-priya', 'trackfit-app-ui', 'priya', 16000, 10,
      'Fitness apps are a favourite category of mine — I can deliver a full clickable prototype in Figma.',
      ['Up to 10 screens', 'Clickable prototype', 'Design system basics'],
      [{ title: 'Wireframes', amount: 5000 }, { title: 'Final UI & prototype', amount: 11000 }],
      'pending', 6);

    // Ananya portfolio — accepted offer from Rahul (project in review)
    addOffer('ananya-rahul', 'ananya-portfolio', 'rahul', 3500, 6,
      'I\u2019ve built portfolio sites for two classmates before — can turn this around quickly given your deadline.',
      ['Homepage with project gallery', 'About & contact section', 'Mobile-friendly'],
      [{ title: 'Layout & first draft', amount: 1500 }, { title: 'Final delivery', amount: 2000 }],
      'accepted', 14);
    addOffer('ananya-divya', 'ananya-portfolio', 'divya', 4200, 5,
      'Happy to help — I\u2019ll design it to feel more like a personal portfolio than a template.',
      ['Homepage with project gallery', 'About section'],
      [{ title: 'Design', amount: 2000 }, { title: 'Delivery', amount: 2200 }],
      'declined', 13);

    // Textile branding (completed project) — accepted offer from Priya
    addOffer('textilebrand-priya', 'textile-branding', 'priya', 7000, 9,
      'I\u2019d love to help modernise Meena Textiles\u2019 look while keeping it recognisable to your regular customers.',
      ['3 logo concepts', 'Final logo files', 'Brand colour palette', 'Basic brand guide'],
      [{ title: 'Concepts', amount: 3000 }, { title: 'Final delivery', amount: 4000 }],
      'accepted', 68);

    // ---------- Projects (from accepted offers) ----------
    const projectInsert = db.prepare(
      `INSERT INTO projects (id, request_id, offer_id, client_id, provider_id, title, price, status, notes, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`
    );
    const P = {};
    function addProject(key, reqKey, offerKey, clientKey, providerKey, title, price, status, createdDaysAgo, updatedDaysAgo) {
      const pid = id('prj');
      projectInsert.run(pid, R[reqKey], O[offerKey], U[clientKey], U[providerKey], title, price, status, null, daysAgo(createdDaysAgo), daysAgo(updatedDaysAgo));
      P[key] = pid;
      return pid;
    }

    addProject('cafe', 'cafe-website', 'cafe-arjun', 'arun', 'arjun', 'Arun Café Website', 8000, 'working', 24, 2);
    addProject('ananya', 'ananya-portfolio', 'ananya-rahul', 'ananya', 'rahul', 'Ananya\u2019s Portfolio Website', 3500, 'review', 13, 1);
    addProject('textilebrand', 'textile-branding', 'textilebrand-priya', 'meena', 'priya', 'Meena Textiles Brand Identity', 7000, 'completed', 67, 20);

    // ---------- Milestones ----------
    const milestoneInsert = db.prepare(
      `INSERT INTO milestones (id, project_id, title, description, amount, due_date, status, sort_order, created_at)
       VALUES (?,?,?,?,?,?,?,?,?)`
    );
    function addMilestone(projectKey, title, description, amount, dueInDays, status, order) {
      milestoneInsert.run(id('ms'), P[projectKey], title, description, amount, daysFromNow(dueInDays), status, order, daysAgo(20));
    }

    addMilestone('cafe', 'Design mockup approved', 'Homepage and menu page layout approved by Arun.', 2000, -18, 'approved', 1);
    addMilestone('cafe', 'Website built & content added', 'Core pages built, menu and photos added.', 4000, -3, 'in_progress', 2);
    addMilestone('cafe', 'Final delivery & handover', 'Final QA, WhatsApp button testing and handover.', 2000, 6, 'pending', 3);

    addMilestone('ananya', 'Layout & first draft', 'Homepage and project gallery layout shared for review.', 1500, -8, 'approved', 1);
    addMilestone('ananya', 'Final delivery', 'Final site with all projects and contact section.', 2000, 1, 'submitted', 2);

    addMilestone('textilebrand', 'Concepts', 'Three logo directions presented.', 3000, -55, 'approved', 1);
    addMilestone('textilebrand', 'Final delivery', 'Final logo files and brand guide delivered.', 4000, -40, 'approved', 2);

    // ---------- Deliveries ----------
    const deliveryInsert = db.prepare(
      `INSERT INTO deliveries (id, project_id, message, files, links, status, created_at) VALUES (?,?,?,?,?,?,?)`
    );
    deliveryInsert.run(id('del'), P.ananya,
      'Here\u2019s the final version of your portfolio site — added the project gallery and your contact details. Let me know if you\u2019d like any tweaks before your deadline!',
      JSON.stringify([{ name: 'ananya-portfolio-final.zip', url: '#' }]), JSON.stringify(['https://ananya-portfolio-demo.example.com']),
      'submitted', daysAgo(1));
    deliveryInsert.run(id('del'), P.textilebrand,
      'Final logo files (SVG, PNG, PDF) and the brand guide are attached. Thank you for a lovely project!',
      JSON.stringify([{ name: 'meena-textiles-brand-kit.zip', url: '#' }]), JSON.stringify([]),
      'approved', daysAgo(41));

    // ---------- Activity log ----------
    const activityInsert = db.prepare(
      `INSERT INTO activity_log (id, project_id, actor_id, event, meta, created_at) VALUES (?,?,?,?,?,?)`
    );
    function addActivity(projectKey, actorKey, event, createdDaysAgo) {
      activityInsert.run(id('act'), P[projectKey], U[actorKey], event, null, daysAgo(createdDaysAgo));
    }
    addActivity('cafe', 'arun', 'Project started', 24);
    addActivity('cafe', 'arjun', 'Milestone "Design mockup approved" submitted', 20);
    addActivity('cafe', 'arun', 'Milestone "Design mockup approved" approved', 18);
    addActivity('cafe', 'arjun', 'Started work on website build', 15);
    addActivity('ananya', 'ananya', 'Project started', 13);
    addActivity('ananya', 'rahul', 'Milestone "Layout & first draft" submitted', 9);
    addActivity('ananya', 'ananya', 'Milestone "Layout & first draft" approved', 8);
    addActivity('ananya', 'rahul', 'Delivery submitted for review', 1);
    addActivity('textilebrand', 'meena', 'Project started', 67);
    addActivity('textilebrand', 'priya', 'Delivery submitted', 41);
    addActivity('textilebrand', 'meena', 'Delivery approved — project completed', 40);

    // ---------- Conversations & Messages ----------
    const convInsert = db.prepare(
      `INSERT INTO conversations (id, project_id, client_id, provider_id, last_message_at, created_at) VALUES (?,?,?,?,?,?)`
    );
    const msgInsert = db.prepare(
      `INSERT INTO messages (id, conversation_id, sender_id, content, read_at, created_at) VALUES (?,?,?,?,?,?)`
    );
    const C = {};
    function addConversation(key, projectKey, clientKey, providerKey, createdDaysAgo) {
      const cid = id('conv');
      convInsert.run(cid, projectKey ? P[projectKey] : null, U[clientKey], U[providerKey], daysAgo(0), daysAgo(createdDaysAgo));
      C[key] = cid;
      return cid;
    }
    function addMessage(convKey, senderKey, content, createdDaysAgo, read) {
      msgInsert.run(id('msg'), C[convKey], U[senderKey], content, read ? daysAgo(createdDaysAgo) : null, daysAgo(createdDaysAgo));
    }

    addConversation('cafe', 'cafe', 'arun', 'arjun', 24);
    addMessage('cafe', 'arun', 'Hi Arjun! Excited to get started. I\u2019ve attached our menu photos in the request.', 24, true);
    addMessage('cafe', 'arjun', 'Great, got them! I\u2019ll share the first design mockup by tomorrow evening.', 23, true);
    addMessage('cafe', 'arjun', 'Mockup is ready — approved it as a milestone, take a look when you can.', 20, true);
    addMessage('cafe', 'arun', 'Looks great, approved! One small thing — can the WhatsApp button be a bit bigger on mobile?', 19, true);
    addMessage('cafe', 'arjun', 'Sure, I\u2019ll make it bigger in the build. Currently working through the content pages, should be done in a few days.', 2, false);

    addConversation('ananya', 'ananya', 'ananya', 'rahul', 13);
    addMessage('ananya', 'ananya', 'Hi Rahul, thanks for taking this on with such short notice!', 13, true);
    addMessage('ananya', 'rahul', 'No problem — I remember how stressful deadlines were last year. I\u2019ll have a draft ready in 3-4 days.', 13, true);
    addMessage('ananya', 'rahul', 'Delivered the final version — check the delivery tab whenever you get a chance!', 1, false);

    addConversation('textilebrand', 'textilebrand', 'meena', 'priya', 67);
    addMessage('textilebrand', 'meena', 'Hi Priya, loved your portfolio. Looking forward to working together.', 67, true);
    addMessage('textilebrand', 'priya', 'Thank you Meena! I\u2019ll start with a few directions based on your current packaging colours.', 66, true);
    addMessage('textilebrand', 'meena', 'This turned out even better than I imagined — thank you so much!', 40, true);

    // A pre-project inquiry conversation (no project yet)
    addConversation('rohan-priya', null, 'rohan', 'priya', 9);
    addMessage('rohan-priya', 'rohan', 'Hi Priya, saw your profile — do you have experience with fitness or wellness brands?', 9, true);
    addMessage('rohan-priya', 'priya', 'Yes! I worked on a yoga studio rebrand last year, happy to share it. Sent you an offer on your request as well.', 8, false);

    // ---------- Reviews ----------
    const reviewInsert = db.prepare(
      `INSERT INTO reviews (id, project_id, reviewer_id, reviewee_id, rating, comment, category_ratings, created_at)
       VALUES (?,?,?,?,?,?,?,?)`
    );
    reviewInsert.run(id('rev'), P.textilebrand, U.meena, U.priya, 5,
      'Priya completely understood what we needed without us having to explain everything technically. The new logo feels exactly like us, just better. Highly recommend!',
      JSON.stringify({ communication: 5, quality: 5, timeliness: 5 }), daysAgo(40));
    reviewInsert.run(id('rev'), P.textilebrand, U.priya, U.meena, 5,
      'Lovely client, clear feedback at every step and paid on time. Would love to work together again.',
      JSON.stringify({ communication: 5, quality: 5, timeliness: 5 }), daysAgo(40));

    // ---------- Notifications ----------
    const notifInsert = db.prepare(
      `INSERT INTO notifications (id, user_id, type, title, body, link, is_read, created_at) VALUES (?,?,?,?,?,?,?,?)`
    );
    function addNotif(userKey, type, title, body, link, read, createdDaysAgo) {
      notifInsert.run(id('ntf'), U[userKey], type, title, body, link, read ? 1 : 0, daysAgo(createdDaysAgo));
    }
    addNotif('arun', 'offer', 'New offer received', 'Arjun Raj sent an offer on "Website for our café with menu and WhatsApp ordering".', `/requests/${R['cafe-website']}`, true, 25);
    addNotif('arjun', 'offer_accepted', 'Offer accepted', 'Arun Kumar accepted your offer. A new project has started.', `/projects/${P.cafe}`, true, 24);
    addNotif('meena', 'offer', 'New offer received', 'PixelCraft Studio sent an offer on "Online store for my clothing shop".', `/requests/${R['textile-store']}`, false, 15);
    addNotif('meena', 'offer', 'New offer received', 'Vikram Singh sent an offer on "Online store for my clothing shop".', `/requests/${R['textile-store']}`, false, 14);
    addNotif('rohan', 'offer', 'New offer received', 'Priya Nair sent an offer on "Landing page and branding for fitness startup".', `/requests/${R['trackfit-brand']}`, false, 10);
    addNotif('rahul', 'message', 'New message', 'Ananya Iyer sent you a message.', `/messages/${C.ananya}`, true, 13);
    addNotif('ananya', 'delivery', 'Delivery submitted', 'Rahul Kumar submitted a delivery for review.', `/projects/${P.ananya}`, false, 1);
    addNotif('priya', 'review', 'New review', 'Meena Krishnan left you a 5-star review.', `/providers/${U.priya}`, true, 40);
    addNotif('meena', 'review', 'New review', 'Priya Nair left you a 5-star review.', `/providers/${U.meena}`, false, 40);
    addNotif('ncc', 'offer', 'New offer received', 'Rahul Kumar sent an offer on your tech fest website request.', `/requests/${R['techfest-site']}`, false, 17);

    // ---------- Saved items ----------
    const savedInsert = db.prepare(
      `INSERT INTO saved_items (id, user_id, item_type, item_id, created_at) VALUES (?,?,?,?,?)`
    );
    savedInsert.run(id('sav'), U.rohan, 'provider', U.priya, daysAgo(9));
    savedInsert.run(id('sav'), U.rohan, 'provider', U.pixelcraft, daysAgo(7));
    savedInsert.run(id('sav'), U.meena, 'service', S['pixelcraft-store'], daysAgo(15));
    savedInsert.run(id('sav'), U.arun, 'provider', U.priya, daysAgo(20));
    savedInsert.run(id('sav'), U.kavitha, 'service', S['sneha-social'], daysAgo(3));

    console.log('[seed] Done. Demo login password for all seeded accounts:', DEMO_PASSWORD);
  });

  tx();
}

if (require.main === module) {
  seed();
  process.exit(0);
}

module.exports = { seed, DEMO_PASSWORD };
