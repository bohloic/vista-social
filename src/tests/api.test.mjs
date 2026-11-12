import test from 'node:test';
import assert from 'node:assert/strict';

test('1. Health Check Endpoint Nominal Test', async () => {
  const { GET } = await import('../app/api/health/route.ts');
  const response = await GET();
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.status, 'healthy');
  assert.equal(data.service, 'vista-social-cm');
});

test('2. Posts API Nominal Creation (201 Created)', async () => {
  const { POST, GET } = await import('../app/api/posts/route.ts');
  const validPayload = {
    workspace_id: 'ws-test',
    author_name: 'Test CM',
    content: 'Annonce exclusive pour notre communauté ! 🚀',
    post_type: 'reel',
    media_urls: ['https://example.com/video.mp4'],
    status: 'scheduled',
    scheduled_for: new Date(Date.now() + 3600000).toISOString(),
    target_accounts: ['acc-ig-1'],
    first_comment: '#test #vistasocial',
  };

  const req = new Request('http://localhost:3000/api/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(validPayload),
  });

  const response = await POST(req);
  assert.equal(response.status, 201);
  const data = await response.json();
  assert.ok(data.post.id);
  assert.equal(data.post.content, validPayload.content);

  // Test GET retrieves posts list
  const getRes = await GET();
  assert.equal(getRes.status, 200);
  const getBody = await getRes.json();
  assert.ok(Array.isArray(getBody.posts));
});

test('3. Posts API Negative Validation (400 Bad Request)', async () => {
  const { POST } = await import('../app/api/posts/route.ts');
  
  // Empty content & empty target accounts
  const invalidPayload = {
    content: '',
    target_accounts: [],
  };

  const req = new Request('http://localhost:3000/api/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(invalidPayload),
  });

  const response = await POST(req);
  assert.equal(response.status, 400);
  const data = await response.json();
  assert.ok(data.error);
});

test('4. AI Caption Generation Schema Validation', async () => {
  const { POST } = await import('../app/api/ai/generate-caption/route.ts');

  // Negative test: missing topic
  const invalidReq = new Request('http://localhost:3000/api/ai/generate-caption', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic: '' }),
  });

  const negResponse = await POST(invalidReq);
  assert.equal(negResponse.status, 400);

  // Nominal test
  const validReq = new Request('http://localhost:3000/api/ai/generate-caption', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      topic: 'Lancement nouvelle offre éco-responsable',
      tone: 'engaging',
      platforms: ['instagram', 'linkedin'],
      includeHashtags: true,
      includeEmojis: true,
    }),
  });

  const posResponse = await POST(validReq);
  assert.equal(posResponse.status, 200);
  const body = await posResponse.json();
  assert.ok(body.caption);
  assert.ok(Array.isArray(body.hashtags));
});

test('5. AI Smart Reply Schema Validation', async () => {
  const { POST } = await import('../app/api/ai/smart-reply/route.ts');

  const validReq = new Request('http://localhost:3000/api/ai/smart-reply', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customerName: 'Thomas Martin',
      customerMessage: 'Quels sont vos délais de livraison ?',
      sentiment: 'neutral',
      channel: 'Instagram DM',
    }),
  });

  const response = await POST(validReq);
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.ok(Array.isArray(body.replies));
  assert.ok(body.replies.length >= 1);
});

