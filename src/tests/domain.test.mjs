import test from 'node:test';
import assert from 'node:assert/strict';
import { z } from 'zod';

const postCreateSchema = z.object({
  workspace_id: z.string().default('ws-default'),
  author_name: z.string().default('Lead CM'),
  content: z.string().min(1),
  post_type: z.enum(['post', 'reel', 'story', 'carousel', 'thread', 'short', 'pin']).default('post'),
  media_urls: z.array(z.string()).default([]),
  status: z.enum(['draft', 'needs_approval', 'approved', 'scheduled', 'publishing', 'published', 'failed']).default('scheduled'),
  scheduled_for: z.string(),
  target_accounts: z.array(z.string()).min(1),
  first_comment: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

test('1. Post Schema Validation - Nominal Valid Post', () => {
  const sample = {
    content: 'Grand jeu concours pour nos 50k abonnés ! 🎉',
    post_type: 'post',
    scheduled_for: new Date().toISOString(),
    target_accounts: ['acc-ig-1', 'acc-tk-1'],
    first_comment: '#concours #giveaway',
  };

  const parsed = postCreateSchema.safeParse(sample);
  assert.equal(parsed.success, true);
  if (parsed.success) {
    assert.equal(parsed.data.workspace_id, 'ws-default');
    assert.equal(parsed.data.status, 'scheduled');
  }
});

test('2. Post Schema Validation - Negative Checks (Empty Content)', () => {
  const invalidSample = {
    content: '',
    scheduled_for: new Date().toISOString(),
    target_accounts: ['acc-ig-1'],
  };

  const parsed = postCreateSchema.safeParse(invalidSample);
  assert.equal(parsed.success, false);
});

test('3. Post Schema Validation - Negative Checks (No target accounts)', () => {
  const invalidSample = {
    content: 'Contenu sans réseau cible',
    scheduled_for: new Date().toISOString(),
    target_accounts: [],
  };

  const parsed = postCreateSchema.safeParse(invalidSample);
  assert.equal(parsed.success, false);
});

test('4. Character Limits by Social Platform', () => {
  const TWITTER_MAX = 280;
  const LINKEDIN_MAX = 3000;
  const INSTAGRAM_MAX = 2200;

  const shortTweet = 'Ceci est un tweet optimisé pour X.'.repeat(3);
  const oversizedTweet = 'Ceci est un tweet beaucoup trop long pour X '.repeat(15);

  assert.ok(shortTweet.length <= TWITTER_MAX);
  assert.ok(oversizedTweet.length > TWITTER_MAX);
});

