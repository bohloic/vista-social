import test from 'node:test';
import assert from 'node:assert';
import { z } from 'zod';

test('1. Team Invite Schema - Nominal Valid Data', () => {
  const inviteSchema = z.object({
    fullName: z.string().min(2),
    email: z.string().email(),
    role: z.enum(['super_admin', 'admin', 'manager', 'editor', 'client']),
    workspaceId: z.string().optional(),
  });

  const validInvite = {
    fullName: 'Sarah Koné',
    email: 'sarah.kone@pulsesocial.app',
    role: 'manager',
  };

  const parsed = inviteSchema.safeParse(validInvite);
  assert.strictEqual(parsed.success, true);
  if (parsed.success) {
    assert.strictEqual(parsed.data.fullName, 'Sarah Koné');
    assert.strictEqual(parsed.data.role, 'manager');
  }
});

test('2. Team Invite Schema - Negative Checks (Invalid Email & Role)', () => {
  const inviteSchema = z.object({
    fullName: z.string().min(2),
    email: z.string().email(),
    role: z.enum(['super_admin', 'admin', 'manager', 'editor', 'client']),
  });

  const invalidEmail = inviteSchema.safeParse({
    fullName: 'Test User',
    email: 'invalid-email',
    role: 'editor',
  });
  assert.strictEqual(invalidEmail.success, false);

  const invalidRole = inviteSchema.safeParse({
    fullName: 'Test User',
    email: 'test@pulsesocial.app',
    role: 'hacker_role',
  });
  assert.strictEqual(invalidRole.success, false);
});

test('3. AI Media Generation Schema - Nominal Valid Data', () => {
  const generateMediaSchema = z.object({
    prompt: z.string().min(3),
    aspectRatio: z.enum(['1:1', '16:9', '9:16', '4:5']).default('1:1'),
    style: z.enum(['photorealistic', 'cinematic', 'vibrant', 'luxury', 'corporate', 'minimalist']).default('photorealistic'),
    platform: z.enum(['instagram', 'facebook', 'twitter', 'linkedin', 'tiktok', 'google_business']).optional(),
  });

  const validPrompt = {
    prompt: 'Un espace de travail moderne avec néons violets et café pour community manager',
    aspectRatio: '1:1',
    style: 'cinematic',
    platform: 'instagram',
  };

  const parsed = generateMediaSchema.safeParse(validPrompt);
  assert.strictEqual(parsed.success, true);
  if (parsed.success) {
    assert.strictEqual(parsed.data.aspectRatio, '1:1');
    assert.strictEqual(parsed.data.style, 'cinematic');
  }
});

test('4. AI Media Generation Schema - Rejection of Empty Prompt', () => {
  const generateMediaSchema = z.object({
    prompt: z.string().min(3),
    aspectRatio: z.enum(['1:1', '16:9', '9:16', '4:5']).default('1:1'),
  });

  const emptyPrompt = generateMediaSchema.safeParse({
    prompt: 'ab',
    aspectRatio: '1:1',
  });
  assert.strictEqual(emptyPrompt.success, false);
});

test('5. Media File Upload Size and MIME Type Validation', () => {
  const ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/webm',
  ];
  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

  const validImage = { type: 'image/jpeg', size: 2 * 1024 * 1024 };
  const validVideo = { type: 'video/mp4', size: 35 * 1024 * 1024 };
  const oversizedFile = { type: 'video/mp4', size: 55 * 1024 * 1024 };
  const dangerousFile = { type: 'application/x-msdownload', size: 1024 };

  assert.strictEqual(ALLOWED_MIME_TYPES.includes(validImage.type) && validImage.size <= MAX_FILE_SIZE, true);
  assert.strictEqual(ALLOWED_MIME_TYPES.includes(validVideo.type) && validVideo.size <= MAX_FILE_SIZE, true);
  assert.strictEqual(oversizedFile.size <= MAX_FILE_SIZE, false);
  assert.strictEqual(ALLOWED_MIME_TYPES.includes(dangerousFile.type), false);
});
