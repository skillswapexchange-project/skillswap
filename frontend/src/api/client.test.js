import assert from 'node:assert/strict';
import { ApiError, formatApiError, skillsApi } from './client.js';

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

  restoreFetch();
  console.log('✓ All skillsApi tests passed successfully!');
}

runTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});

