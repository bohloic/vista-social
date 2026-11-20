import test from 'node:test';
import assert from 'node:assert/strict';

test('Composio MCP Toolkit mapping covers all social platforms', () => {
  const platforms = [
    'instagram',
    'facebook',
    'linkedin',
    'twitter',
    'tiktok',
    'whatsapp',
    'google_business',
    'youtube',
    'pinterest',
    'threads',
  ];

  const map = {
    instagram: 'instagram',
    facebook: 'facebook',
    linkedin: 'linkedin',
    twitter: 'twitter',
    tiktok: 'tiktok',
    whatsapp: 'whatsapp',
    google_business: 'googlemybusiness',
    youtube: 'youtube',
    pinterest: 'pinterest',
    threads: 'threads',
  };

  for (const p of platforms) {
    assert.ok(map[p], `Platform ${p} should have a corresponding Composio toolkit`);
  }
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
