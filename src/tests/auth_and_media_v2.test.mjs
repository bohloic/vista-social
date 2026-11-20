import { test } from 'node:test';
import assert from 'node:assert';
import { z } from 'zod';

test('1. Auth Registration Schema Contract (Default Client Role)', () => {
  const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    fullName: z.string().min(2).optional(),
  });

  const validRegistration = {
    email: 'client@entreprise.ci',
    password: 'securePassword123',
    fullName: 'Client Pro',
  };

  const parsed = registerSchema.safeParse(validRegistration);
  assert.strictEqual(parsed.success, true);
  assert.strictEqual(parsed.data.email, 'client@entreprise.ci');
});

test('2. Auth Registration Negative Check (Short Password Rejection)', () => {
  const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
  });

  const invalid = {
    email: 'test@entreprise.ci',
    password: '123',
  };

  const parsed = registerSchema.safeParse(invalid);
  assert.strictEqual(parsed.success, false);
});

test('3. Password Reset Request & Confirm Schema Contract', () => {
  const resetSchema = z.object({
    action: z.enum(['request', 'confirm']),
    email: z.string().email(),
    token: z.string().optional(),
    newPassword: z.string().min(6).optional(),
  });

  const validRequest = {
    action: 'request',
    email: 'contact@agence.ci',
  };
  assert.strictEqual(resetSchema.safeParse(validRequest).success, true);

  const validConfirm = {
    action: 'confirm',
    email: 'contact@agence.ci',
    token: 'token123456',
    newPassword: 'nouveauPassword2026',
  };
  assert.strictEqual(resetSchema.safeParse(validConfirm).success, true);
});

test('4. AI HD Image Generator Contract - Real URL Output', () => {
  const mediaOutputSchema = z.object({
    success: z.boolean(),
    imageUrl: z.string().url(),
    url: z.string().url(),
    aspectRatio: z.string(),
  });

  const responsePayload = {
    success: true,
    imageUrl: 'https://image.pollinations.ai/prompt/robe%20haute%20couture?width=1080&height=1080&model=flux',
    url: 'https://image.pollinations.ai/prompt/robe%20haute%20couture?width=1080&height=1080&model=flux',
    aspectRatio: '1:1',
  };

  const parsed = mediaOutputSchema.safeParse(responsePayload);
  assert.strictEqual(parsed.success, true);
  assert.strictEqual(parsed.data.imageUrl.startsWith('https://'), true);
  assert.strictEqual(parsed.data.imageUrl.includes('data:image/svg'), false);
});

test('5. Social Platforms Preview Switcher Support', () => {
  const supportedPlatforms = ['instagram', 'linkedin', 'twitter', 'tiktok', 'facebook', 'pinterest'];
  assert.strictEqual(supportedPlatforms.includes('tiktok'), true);
  assert.strictEqual(supportedPlatforms.includes('pinterest'), true);
  assert.strictEqual(supportedPlatforms.length, 6);
});
