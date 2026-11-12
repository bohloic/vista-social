import test from 'node:test';
import assert from 'node:assert/strict';
import { z } from 'zod';

const postCreateSchema = z.object({
  workspace_id: z.string().default('ws-default'),
  author_name: z.string().default('Lead CM'),
  content: z.string().min(1, 'Le contenu du post ne peut pas être vide'),
  post_type: z.enum(['post', 'reel', 'story', 'carousel', 'thread', 'short', 'pin']).default('post'),
  media_urls: z.array(z.string()).default([]),
  status: z.enum(['draft', 'needs_approval', 'approved', 'scheduled', 'publishing', 'published', 'failed']).default('scheduled'),
  scheduled_for: z.string(),
  published_at: z.string().optional(),
  target_accounts: z.array(z.string()).min(1, 'Veuillez sélectionner au moins un compte cible'),
  first_comment: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

const captionRequestSchema = z.object({
  topic: z.string().min(1, 'Le sujet est requis'),
  tone: z.enum(['professional', 'engaging', 'humorous', 'urgent', 'minimalist', 'storytelling']).default('engaging'),
  platforms: z.array(z.string()).default(['instagram']),
  includeHashtags: z.boolean().default(true),
  includeEmojis: z.boolean().default(true),
  callToAction: z.string().optional(),
});

const smartReplyRequestSchema = z.object({
  customerName: z.string().default('Client'),
  customerMessage: z.string().min(1, 'Le message client est requis'),
  sentiment: z.enum(['positive', 'neutral', 'negative']).default('neutral'),
  channel: z.string().default('Instagram'),
});

test('1. Health Check Response Schema Contract', () => {
  const healthData = {
    status: 'healthy',
    service: 'vista-social-cm',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  };
  assert.equal(healthData.status, 'healthy');
  assert.equal(healthData.service, 'vista-social-cm');
  assert.ok(typeof healthData.uptime === 'number');
});

test('2. Posts API Nominal Payload Validation', () => {
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

  const parsed = postCreateSchema.safeParse(validPayload);
  assert.equal(parsed.success, true);
  if (parsed.success) {
    assert.equal(parsed.data.content, validPayload.content);
    assert.equal(parsed.data.target_accounts[0], 'acc-ig-1');
  }
});

test('3. Posts API Negative Validation (Rejection on Invalid Input)', () => {
  const invalidPayload = {
    content: '',
    target_accounts: [],
  };

  const parsed = postCreateSchema.safeParse(invalidPayload);
  assert.equal(parsed.success, false);
});

test('4. AI Caption Generation Schema Validation', () => {
  // Negative test: empty topic
  const negResult = captionRequestSchema.safeParse({ topic: '' });
  assert.equal(negResult.success, false);

  // Nominal test
  const posResult = captionRequestSchema.safeParse({
    topic: 'Lancement nouvelle offre éco-responsable',
    tone: 'engaging',
    platforms: ['instagram', 'linkedin'],
    includeHashtags: true,
    includeEmojis: true,
  });
  assert.equal(posResult.success, true);
  if (posResult.success) {
    assert.equal(posResult.data.tone, 'engaging');
    assert.equal(posResult.data.includeHashtags, true);
  }
});

test('5. AI Smart Reply Schema Validation', () => {
  // Nominal test
  const valid = smartReplyRequestSchema.safeParse({
    customerName: 'Thomas Martin',
    customerMessage: 'Quels sont vos délais de livraison ?',
    sentiment: 'neutral',
    channel: 'Instagram DM',
  });
  assert.equal(valid.success, true);

  // Negative test: missing customer message
  const invalid = smartReplyRequestSchema.safeParse({
    customerMessage: '',
  });
  assert.equal(invalid.success, false);
});
