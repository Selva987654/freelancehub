const BASE = 'http://localhost:4000/api';
let failures = 0;

async function call(method, path, body, token) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try { json = await res.json(); } catch {}
  return { status: res.status, json };
}

function check(label, cond, extra) {
  if (cond) {
    console.log(`OK   ${label}`);
  } else {
    failures++;
    console.log(`FAIL ${label}`, extra || '');
  }
}

async function main() {
  // 1. Demo logins
  const biz = await call('POST', '/auth/demo-login', { persona: 'business' });
  check('demo-login business', biz.status === 200 && biz.json.token, biz.json);
  const bizToken = biz.json.token;

  const pro = await call('POST', '/auth/demo-login', { persona: 'professional' });
  check('demo-login professional', pro.status === 200 && pro.json.token, pro.json);
  const proToken = pro.json.token;

  const admin = await call('POST', '/auth/demo-login', { persona: 'admin' });
  check('demo-login admin', admin.status === 200 && admin.json.token, admin.json);
  const adminToken = admin.json.token;

  // 2. Register a brand new client + provider to test a completely fresh flow
  const email = `smoketest-client-${Date.now()}@example.com`;
  const reg = await call('POST', '/auth/register', {
    email, password: 'testpass123', name: 'Smoke Test Client', role: 'client', businessName: 'Test Biz', businessType: 'Cafe', location: 'Test City',
  });
  check('register client', reg.status === 201 && reg.json.token, reg.json);
  const clientToken = reg.json.token;

  const proEmail = `smoketest-provider-${Date.now()}@example.com`;
  const proReg = await call('POST', '/auth/register', {
    email: proEmail, password: 'testpass123', name: 'Smoke Test Provider', role: 'provider', providerType: 'Beginner', location: 'Test City',
  });
  check('register provider', proReg.status === 201 && proReg.json.token, proReg.json);
  const newProviderToken = proReg.json.token;
  const newProviderId = proReg.json.user.id;

  // duplicate email should fail
  const dup = await call('POST', '/auth/register', { email, password: 'testpass123', name: 'Dup', role: 'client' });
  check('register duplicate email rejected (409)', dup.status === 409, dup.json);

  // 3. Categories & skills
  const cats = await call('GET', '/categories');
  check('categories list not empty', cats.status === 200 && cats.json.categories.length > 5);
  const websiteCat = cats.json.categories.find(c => c.slug === 'website');

  // 4. Create a request (I Need Something flow)
  const reqCreate = await call('POST', '/requests', {
    title: 'Need a smoke-test website',
    categorySlug: 'website',
    purpose: 'My Business',
    description: 'This is an automated smoke test request describing a website need in enough detail.',
    budgetRange: '₹5,000–₹10,000',
    timeline: '2–4 weeks',
    skillNames: ['React'],
  }, clientToken);
  check('create request', reqCreate.status === 201 && reqCreate.json.request.id, reqCreate.json);
  check('request suggestions returned', Array.isArray(reqCreate.json.suggestions) && reqCreate.json.suggestions.length > 0, reqCreate.json.suggestions);
  const requestId = reqCreate.json.request.id;

  // validation: missing description
  const badReq = await call('POST', '/requests', { budgetRange: '₹5,000–₹10,000', timeline: 'Urgent', description: 'short' }, clientToken);
  check('create request validation rejects short description', badReq.status === 400, badReq.json);

  // 5. Discover requests
  const discover = await call('GET', '/requests?category=website');
  check('discover requests by category', discover.status === 200 && discover.json.requests.some(r => r.id === requestId));

  // 6. Recommended providers for the request
  const recProviders = await call('GET', `/requests/${requestId}/recommended-providers`);
  check('recommended providers endpoint works', recProviders.status === 200 && Array.isArray(recProviders.json.providers));

  // 7. Provider sends an offer (existing seeded pro)
  const offer1 = await call('POST', `/offers/requests/${requestId}/offers`, {
    price: 7000, deliveryDays: 7, message: 'Smoke test offer 1',
    includes: ['Homepage'], milestones: [{ title: 'Delivery', amount: 7000 }],
  }, proToken);
  check('send offer (seeded pro)', offer1.status === 201 && offer1.json.offer.id, offer1.json);

  // duplicate offer should fail
  const dupOffer = await call('POST', `/offers/requests/${requestId}/offers`, { price: 1, deliveryDays: 1 }, proToken);
  check('duplicate offer rejected (409)', dupOffer.status === 409, dupOffer.json);

  // second offer from the freshly-registered provider
  const offer2 = await call('POST', `/offers/requests/${requestId}/offers`, {
    price: 6500, deliveryDays: 6, message: 'Smoke test offer 2',
    includes: ['Homepage'], milestones: [{ title: 'Delivery', amount: 6500 }],
  }, newProviderToken);
  check('send offer (new pro)', offer2.status === 201 && offer2.json.offer.id, offer2.json);

  // provider without auth cannot see offers list
  const offersNoAuth = await call('GET', `/requests/${requestId}/offers`);
  check('viewing offers without auth rejected (401)', offersNoAuth.status === 401);

  // wrong client cannot view offers
  const offersWrongUser = await call('GET', `/requests/${requestId}/offers`, null, proToken);
  check('viewing offers by non-owner rejected (403)', offersWrongUser.status === 403);

  // 8. Client views + compares offers
  const offersList = await call('GET', `/requests/${requestId}/offers`, null, clientToken);
  check('client views offers on own request', offersList.status === 200 && offersList.json.offers.length === 2, offersList.json);

  // 9. Client accepts offer1 (from seeded pro) -> creates project
  const accept = await call('PUT', `/offers/${offer1.json.offer.id}/accept`, {}, clientToken);
  check('accept offer creates project', accept.status === 200 && accept.json.project.id, accept.json);
  const projectId = accept.json.project.id;

  // Accepting the second offer should now fail (request no longer open)
  const acceptSecond = await call('PUT', `/offers/${offer2.json.offer.id}/accept`, {}, clientToken);
  check('cannot accept a second offer for same request (409)', acceptSecond.status === 409, acceptSecond.json);

  // offer2 should have been auto-declined
  const offersAfter = await call('GET', `/requests/${requestId}/offers`, null, clientToken);
  const offer2After = offersAfter.json.offers.find(o => o.id === offer2.json.offer.id);
  check('other pending offer auto-declined', offer2After.status === 'declined', offer2After);

  // 10. Project workspace
  const proj = await call('GET', `/projects/${projectId}`, null, clientToken);
  check('project workspace loads', proj.status === 200 && proj.json.project.status === 'planning', proj.json.project);
  check('milestones created from offer', proj.json.milestones.length === 1, proj.json.milestones);

  // random third party cannot view project
  const projWrongUser = await call('GET', `/projects/${projectId}`, null, newProviderToken);
  check('non-participant cannot view project (403)', projWrongUser.status === 403);

  // 11. Milestone status update by provider
  const msUpdate = await call('PUT', `/projects/milestones/${proj.json.milestones[0].id}`, { status: 'approved' }, proToken);
  check('milestone status update', msUpdate.status === 200 && msUpdate.json.milestone.status === 'approved', msUpdate.json);

  // 12. Messaging
  const conv = await call('POST', '/conversations', { otherUserId: newProviderId }, clientToken);
  check('start conversation', conv.status === 201 && conv.json.conversation.id, conv.json);
  const convId = conv.json.conversation.id;
  const sendMsg = await call('POST', `/conversations/${convId}/messages`, { content: 'Hello from smoke test!' }, clientToken);
  check('send message', sendMsg.status === 201 && sendMsg.json.message.id, sendMsg.json);
  const msgList = await call('GET', `/conversations/${convId}/messages`, null, newProviderToken);
  check('read messages as other participant', msgList.status === 200 && msgList.json.messages.length === 1, msgList.json);

  // 13. Delivery + approval -> completion -> review
  const delivery = await call('POST', `/projects/${projectId}/deliveries`, { message: 'Here it is!', files: [], links: [] }, proToken);
  check('provider submits delivery', delivery.status === 201 && delivery.json.delivery.id, delivery.json);

  const deliveryByClient = await call('POST', `/projects/${projectId}/deliveries`, { message: 'nope' }, clientToken);
  check('client cannot submit delivery (403)', deliveryByClient.status === 403, deliveryByClient.json);

  const approve = await call('PUT', `/projects/deliveries/${delivery.json.delivery.id}/approve`, {}, clientToken);
  check('client approves delivery', approve.status === 200, approve.json);

  const projAfter = await call('GET', `/projects/${projectId}`, null, clientToken);
  check('project marked completed', projAfter.json.project.status === 'completed', projAfter.json.project);

  const reqAfter = await call('GET', `/requests/${requestId}`, null, clientToken);
  check('request marked completed', reqAfter.json.request.status === 'completed', reqAfter.json.request);

  // Reviews only after completion
  const review = await call('POST', `/projects/${projectId}/reviews`, { rating: 5, comment: 'Smoke test review — great job!' }, clientToken);
  check('review after completion allowed', review.status === 201, review.json);

  const dupReview = await call('POST', `/projects/${projectId}/reviews`, { rating: 4, comment: 'again' }, clientToken);
  check('duplicate review rejected (409)', dupReview.status === 409, dupReview.json);

  // 14. Saved items
  const save = await call('POST', '/saved', { itemType: 'provider', itemId: newProviderId }, clientToken);
  check('save provider', save.status === 201, save.json);
  const savedList = await call('GET', '/saved/mine', null, clientToken);
  check('saved list contains item', savedList.json.saved.some(s => s.item_id === newProviderId), savedList.json);

  // 15. Notifications
  const notifs = await call('GET', '/notifications/mine', null, proToken);
  check('notifications listed for provider', notifs.status === 200 && notifs.json.notifications.length > 0, notifs.json);

  // 16. Dashboards
  const clientDash = await call('GET', '/dashboard/overview', null, clientToken);
  check('client dashboard overview', clientDash.status === 200 && typeof clientDash.json.completedProjects === 'number', clientDash.json);
  const proDash = await call('GET', '/dashboard/overview', null, proToken);
  check('provider dashboard overview', proDash.status === 200 && typeof proDash.json.projectValue === 'number', proDash.json);
  const recReqs = await call('GET', '/dashboard/recommended-requests', null, newProviderToken);
  check('provider recommended requests', recReqs.status === 200 && Array.isArray(recReqs.json.requests), recReqs.json);

  // 17. Not sure guided page
  const guidance = await call('POST', '/guidance', { text: 'Customers keep calling me to ask about products in my clothing shop.' });
  check('guidance endpoint returns solutions', guidance.status === 200 && guidance.json.solutions.length > 0, guidance.json);

  // 18. Global search
  const search = await call('GET', '/search?q=website');
  check('global search works', search.status === 200);

  // 19. Provider public profile
  const provProfile = await call('GET', `/providers/${U_arjun(pro.json.user.id)}`);
  check('provider profile loads', provProfile.status === 200 && provProfile.json.provider.id === pro.json.user.id, provProfile.json);

  function U_arjun(id) { return id; }

  // 20. Services CRUD
  const svcCreate = await call('POST', '/services', {
    title: 'Smoke test service', description: 'desc', categoryId: websiteCat.id, startingPrice: 1000, deliveryDays: 3, features: ['a'],
  }, newProviderToken);
  check('create service', svcCreate.status === 201, svcCreate.json);
  const svcList = await call('GET', '/services?category=website');
  check('discover services by category', svcList.status === 200 && svcList.json.services.length > 0, svcList.json);
  const svcDeleteWrongUser = await call('DELETE', `/services/${svcCreate.json.service.id}`, null, clientToken);
  check('non-provider cannot delete service (403)', svcDeleteWrongUser.status === 403, svcDeleteWrongUser.json);

  // 21. Admin
  const adminOverview = await call('GET', '/admin/overview', null, adminToken);
  check('admin overview works', adminOverview.status === 200 && adminOverview.json.users > 10, adminOverview.json);
  const adminOverviewNoAuth = await call('GET', '/admin/overview', null, clientToken);
  check('non-admin blocked from admin routes (403)', adminOverviewNoAuth.status === 403, adminOverviewNoAuth.json);
  const adminUsers = await call('GET', '/admin/users', null, adminToken);
  check('admin can list users', adminUsers.status === 200 && adminUsers.json.users.length > 0);

  // 22. Not found route
  const notFound = await call('GET', '/this-route-does-not-exist');
  check('unknown route returns 404', notFound.status === 404, notFound.json);

  console.log(`\n${failures === 0 ? 'ALL CHECKS PASSED' : failures + ' CHECK(S) FAILED'}`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => { console.error(err); process.exit(1); });
