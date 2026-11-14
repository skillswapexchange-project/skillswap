import assert from 'node:assert/strict';
import { ApiError, formatApiError, skillsApi, exchangesApi, reviewsApi } from './client.js';

// Setup mock global fetch to verify URL building, headers, and request options
let lastFetchCall = null;
const originalFetch = globalThis.fetch;

function mockFetch(responseHandler) {
  globalThis.fetch = async (url, options) => {
    lastFetchCall = { url, options };
    return responseHandler(url, options);
  };
}

function restoreFetch() {
  globalThis.fetch = originalFetch;
  lastFetchCall = null;
}

async function runTests() {
  console.log('--- Testing formatApiError ---');
  assert.equal(formatApiError('Simple string error'), 'Simple string error');
  assert.equal(
    formatApiError([{ loc: ['body', 'skill_slug'], msg: 'Field required' }]),
    'skill_slug: Field required'
  );
  assert.equal(
    formatApiError({ message: 'Object error message' }),
    'Object error message'
  );

  console.log('--- Testing skillsApi.listSkills URL construction ---');
  mockFetch(async () => ({
    ok: true,
    status: 200,
    text: async () => JSON.stringify({ items: [], total: 0, limit: 20, offset: 0 }),
  }));

  await skillsApi.listSkills({ query: 'python', category: 'Programming', limit: 10, offset: 20 });
  assert.ok(lastFetchCall.url.includes('/skills?'));
  assert.ok(lastFetchCall.url.includes('query=python'));
  assert.ok(lastFetchCall.url.includes('category=Programming'));
  assert.ok(lastFetchCall.url.includes('limit=10'));
  assert.ok(lastFetchCall.url.includes('offset=20'));

  console.log('--- Testing skillsApi.listListings URL construction ---');
  await skillsApi.listListings({
    query: 'web',
    skill_slug: 'python',
    direction: 'OFFER',
    limit: 5,
    offset: 10,
  });
  assert.ok(lastFetchCall.url.includes('/skills/listings?'));
  assert.ok(lastFetchCall.url.includes('query=web'));
  assert.ok(lastFetchCall.url.includes('skill_slug=python'));
  assert.ok(lastFetchCall.url.includes('direction=OFFER'));
  assert.ok(lastFetchCall.url.includes('limit=5'));
  assert.ok(lastFetchCall.url.includes('offset=10'));

  console.log('--- Testing skillsApi.createListing ---');
  mockFetch(async (url, options) => {
    assert.equal(options.method, 'POST');
    assert.equal(options.headers.get('Authorization'), 'Bearer test-token');
    assert.equal(options.headers.get('Content-Type'), 'application/json');
    const body = JSON.parse(options.body);
    assert.equal(body.skill_slug, 'python');
    assert.equal(body.direction, 'OFFER');
    assert.equal(body.description, 'Teaching Python basics');
    return {
      ok: true,
      status: 201,
      text: async () =>
        JSON.stringify({
          id: 42,
          owner_id: 1,
          skill: { id: 1, name: 'Python', slug: 'python', category: 'Programming', description: '' },
          direction: 'OFFER',
          description: 'Teaching Python basics',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }),
    };
  });

  const created = await skillsApi.createListing('test-token', {
    skill_slug: 'python',
    direction: 'OFFER',
    description: 'Teaching Python basics',
  });
  assert.equal(created.id, 42);
  assert.equal(created.direction, 'OFFER');

  console.log('--- Testing skillsApi.updateListing ---');
  mockFetch(async (url, options) => {
    assert.ok(url.endsWith('/skills/listings/42'));
    assert.equal(options.method, 'PATCH');
    assert.equal(options.headers.get('Authorization'), 'Bearer test-token');
    const body = JSON.parse(options.body);
    assert.equal(body.description, 'Updated description');
    assert.equal(body.is_active, false);
    return {
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          id: 42,
          owner_id: 1,
          skill: { id: 1, name: 'Python', slug: 'python', category: 'Programming', description: '' },
          direction: 'OFFER',
          description: 'Updated description',
          is_active: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }),
    };
  });

  const updated = await skillsApi.updateListing('test-token', 42, {
    description: 'Updated description',
    is_active: false,
  });
  assert.equal(updated.description, 'Updated description');
  assert.equal(updated.is_active, false);

  console.log('--- Testing skillsApi.deleteListing ---');
  mockFetch(async (url, options) => {
    assert.ok(url.endsWith('/skills/listings/42'));
    assert.equal(options.method, 'DELETE');
    assert.equal(options.headers.get('Authorization'), 'Bearer test-token');
    return {
      ok: true,
      status: 204,
      text: async () => '',
    };
  });

  await skillsApi.deleteListing('test-token', 42);

  console.log('--- Testing Conflict Error (409) handling ---');
  mockFetch(async () => ({
    ok: false,
    status: 409,
    text: async () =>
      JSON.stringify({ detail: 'You already have a listing for this skill and direction.' }),
  }));

  await assert.rejects(
    async () => {
      await skillsApi.createListing('test-token', {
        skill_slug: 'python',
        direction: 'OFFER',
      });
    },
    (err) => {
      assert.ok(err instanceof ApiError);
      assert.equal(err.status, 409);
      assert.equal(err.message, 'You already have a listing for this skill and direction.');
      return true;
    }
  );

  console.log('--- Testing exchangesApi.list URL and auth header ---');
  mockFetch(async (url, options) => {
    assert.ok(url.includes('/exchanges?'));
    assert.ok(url.includes('limit=15'));
    assert.ok(url.includes('offset=30'));
    assert.equal(options.headers.get('Authorization'), 'Bearer test-token');
    return {
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ items: [], total: 0, limit: 15, offset: 30 }),
    };
  });

  const exchangePage = await exchangesApi.list('test-token', { limit: 15, offset: 30 });
  assert.equal(exchangePage.limit, 15);
  assert.equal(exchangePage.offset, 30);

  console.log('--- Testing exchangesApi.create request ---');
  mockFetch(async (url, options) => {
    assert.ok(url.endsWith('/exchanges'));
    assert.equal(options.method, 'POST');
    assert.equal(options.headers.get('Authorization'), 'Bearer test-token');
    assert.equal(options.headers.get('Content-Type'), 'application/json');
    const body = JSON.parse(options.body);
    assert.equal(body.listing_id, 101);
    assert.equal(body.scheduled_at, '2026-11-20T14:00:00.000Z');
    return {
      ok: true,
      status: 201,
      text: async () =>
        JSON.stringify({
          id: 7,
          learner_id: 1,
          owner_id: 2,
          listing: null,
          status: 'PENDING',
          scheduled_at: '2026-11-20T14:00:00.000Z',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }),
    };
  });

  const createdExchange = await exchangesApi.create('test-token', {
    listing_id: 101,
    scheduled_at: '2026-11-20T14:00:00.000Z',
  });
  assert.equal(createdExchange.id, 7);
  assert.equal(createdExchange.status, 'PENDING');
  assert.equal(createdExchange.scheduled_at, '2026-11-20T14:00:00.000Z');

  console.log('--- Testing exchangesApi.updateStatus transition ---');
  mockFetch(async (url, options) => {
    assert.ok(url.endsWith('/exchanges/7/status'));
    assert.equal(options.method, 'PATCH');
    assert.equal(options.headers.get('Authorization'), 'Bearer test-token');
    const body = JSON.parse(options.body);
    assert.equal(body.status, 'ACCEPTED');
    return {
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          id: 7,
          learner_id: 1,
          owner_id: 2,
          listing: null,
          status: 'ACCEPTED',
          scheduled_at: '2026-11-20T14:00:00.000Z',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }),
    };
  });

  const updatedExchange = await exchangesApi.updateStatus('test-token', 7, 'ACCEPTED');
  assert.equal(updatedExchange.status, 'ACCEPTED');

  console.log('--- Testing exchangesApi forbidden transition error (403) ---');
  mockFetch(async () => ({
    ok: false,
    status: 403,
    text: async () =>
      JSON.stringify({ detail: 'You are not allowed to perform this transition.' }),
  }));

  await assert.rejects(
    async () => {
      await exchangesApi.updateStatus('test-token', 7, 'ACCEPTED');
    },
    (err) => {
      assert.ok(err instanceof ApiError);
      assert.equal(err.status, 403);
      assert.equal(err.message, 'You are not allowed to perform this transition.');
      return true;
    }
  );

  console.log('--- Testing reviewsApi.create review submission ---');
  mockFetch(async (url, options) => {
    assert.ok(url.endsWith('/reviews'));
    assert.equal(options.method, 'POST');
    assert.equal(options.headers.get('Authorization'), 'Bearer test-token');
    const body = JSON.parse(options.body);
    assert.equal(body.exchange_id, 7);
    assert.equal(body.rating, 5);
    assert.equal(body.feedback, 'Great exchange session!');
    assert.equal(body.reviewee_id, 2);
    return {
      ok: true,
      status: 201,
      text: async () =>
        JSON.stringify({
          id: 99,
          exchange_id: 7,
          reviewer_id: 1,
          reviewee_id: 2,
          reviewer: { id: 1, first_name: 'Alex', last_name: 'Learner', profile_image: '' },
          reviewee: { id: 2, first_name: 'Sam', last_name: 'Teacher', profile_image: '' },
          rating: 5,
          feedback: 'Great exchange session!',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }),
    };
  });

  const createdReview = await reviewsApi.create('test-token', {
    exchange_id: 7,
    rating: 5,
    feedback: 'Great exchange session!',
    reviewee_id: 2,
  });
  assert.equal(createdReview.id, 99);
  assert.equal(createdReview.rating, 5);
  assert.equal(createdReview.feedback, 'Great exchange session!');

  console.log('--- Testing reviewsApi.list by exchange_id ---');
  mockFetch(async (url, options) => {
    assert.ok(url.includes('/reviews?'));
    assert.ok(url.includes('exchange_id=7'));
    assert.equal(options.headers.get('Authorization'), 'Bearer test-token');
    return {
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          items: [createdReview],
          total: 1,
          limit: 20,
          offset: 0,
        }),
    };
  });

  const reviewsList = await reviewsApi.list('test-token', { exchange_id: 7 });
  assert.equal(reviewsList.total, 1);
  assert.equal(reviewsList.items[0].id, 99);

  console.log('--- Testing reviewsApi duplicate review conflict (409) ---');
  mockFetch(async () => ({
    ok: false,
    status: 409,
    text: async () =>
      JSON.stringify({ detail: 'You have already submitted a review for this exchange.' }),
  }));

  await assert.rejects(
    async () => {
      await reviewsApi.create('test-token', {
        exchange_id: 7,
        rating: 4,
      });
    },
    (err) => {
      assert.ok(err instanceof ApiError);
      assert.equal(err.status, 409);
      assert.equal(err.message, 'You have already submitted a review for this exchange.');
      return true;
    }
  );

  restoreFetch();
  console.log('✓ All skillsApi, exchangesApi, and reviewsApi tests passed successfully!');
}

runTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});

