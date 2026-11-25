import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  COMPOSIO_TOOLKIT_MAP,
  buildComposioCallbackUrl,
  composioToolkitToPlatform,
  normalizePlatformAndToolkit,
  resolveAppOrigin,
  sanitizeNextPath,
} from '../lib/composio.ts';

test('Composio MCP Toolkit mapping covers all social platforms + gmail', () => {
  const platforms = [
    'instagram',
    'facebook',
    'linkedin',
    'twitter',
    'tiktok',
    'whatsapp',
    'google_business',
    'gmail',
    'youtube',
    'pinterest',
    'threads',
  ];

  for (const p of platforms) {
    assert.ok(COMPOSIO_TOOLKIT_MAP[p], `Platform ${p} should have a corresponding Composio toolkit`);
  }
  assert.equal(normalizePlatformAndToolkit('google_business')?.toolkitSlug, 'googlemybusiness');
  assert.equal(composioToolkitToPlatform('googlemybusiness'), 'google_business');
  assert.equal(normalizePlatformAndToolkit('unknown_net'), null);
});

test('Composio callbackUrl builder and Open-Redirect sanitizer enforce safe paths', () => {
  assert.equal(sanitizeNextPath('/settings?tab=accounts'), '/settings?tab=accounts');
  assert.equal(sanitizeNextPath('/chat'), '/chat');
  assert.equal(sanitizeNextPath('https://evil.com/phish'), '/settings');
  assert.equal(sanitizeNextPath('//evil.com'), '/settings');
  assert.equal(sanitizeNextPath('/\\evil.com'), '/settings');
  assert.equal(sanitizeNextPath('settings'), '/settings');

  const cb = buildComposioCallbackUrl('https://vista-social-app.vercel.app/', {
    next: '/settings',
    toolkit: 'instagram',
    platform: 'instagram',
  });
  assert.equal(
    cb,
    'https://vista-social-app.vercel.app/api/composio/callback?next=%2Fsettings&toolkit=instagram&platform=instagram'
  );
});

test('resolveAppOrigin prefers localhost in dev and never embeds hardcoded userId', () => {
  assert.equal(
    resolveAppOrigin({ url: 'http://localhost:3000/api/composio/connect' }),
    'http://localhost:3000'
  );

  const libSrc = fs.readFileSync('src/lib/composio.ts', 'utf-8');
  assert.equal(/user_123|entityId\s*[:=]\s*['"]default/i.test(libSrc), false);
});

test('Composio Connect MCP SSE parser extracts live redirect_url cleanly', () => {
  const mockSse = `event: message\ndata: {"result":{"content":[{"type":"text","text":"{\\"successful\\":true,\\"data\\":{\\"results\\":{\\"instagram\\":{\\"toolkit\\":\\"instagram\\",\\"status\\":\\"initiated\\",\\"redirect_url\\":\\"https://connect.composio.dev/link/lk_test123\\"}}}}"}]}}\n\n`;

  let redirectUrl = null;
  for (const line of mockSse.split('\n')) {
    if (line.startsWith('data: ')) {
      const data = JSON.parse(line.slice(6));
      const resText = data?.result?.content?.[0]?.text;
      if (resText) {
        const parsed = JSON.parse(resText);
        redirectUrl = parsed?.data?.results?.['instagram']?.redirect_url || null;
      }
    }
  }

  assert.equal(redirectUrl, 'https://connect.composio.dev/link/lk_test123');
});

test('Composio Connect MCP parser handles custom auth requirement for Twitter/TikTok', () => {
  const mockErrorResponse = JSON.stringify({
    successful: true,
    data: {
      results: {
        twitter: {
          toolkit: 'twitter',
          status: 'failed',
          error_message: "Composio does not have managed auth for 'twitter', so the user must set up their own auth config before connecting. Show the user this link: https://dashboard.composio.dev/~/org/connect/apps/twitter?open=true",
        },
      },
    },
  });

  const parsed = JSON.parse(mockErrorResponse);
  const twitterData = parsed.data.results.twitter;
  assert.equal(twitterData.status, 'failed');
  assert.ok(twitterData.error_message.includes('dashboard.composio.dev'));
});
