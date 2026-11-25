// Multi-Tenant Composio v3/v3.1 REST Client & Account Sync for PulseSocial PRO
// Strictly server-side: never import into client components or expose COMPOSIO_API_KEY.

export const COMPOSIO_TOOLKIT_MAP: Record<string, string> = {
  instagram: 'instagram',
  facebook: 'facebook',
  linkedin: 'linkedin',
  twitter: 'twitter',
  x: 'twitter',
  tiktok: 'tiktok',
  whatsapp: 'whatsapp',
  google_business: 'googlemybusiness',
  googlebusiness: 'googlemybusiness',
  googlemybusiness: 'googlemybusiness',
  gmail: 'gmail',
  youtube: 'youtube',
  pinterest: 'pinterest',
  threads: 'threads',
};

const TOOLKIT_TO_PLATFORM_MAP: Record<string, string> = {
  instagram: 'instagram',
  facebook: 'facebook',
  linkedin: 'linkedin',
  twitter: 'twitter',
  tiktok: 'tiktok',
  whatsapp: 'whatsapp',
  googlemybusiness: 'google_business',
  gmail: 'gmail',
  youtube: 'youtube',
  pinterest: 'pinterest',
  threads: 'threads',
};

export interface NormalizedComposioAccount {
  id: string;
  userId: string;
  toolkitSlug: string;
  platform: string;
  status: string;
  accountName: string;
  username: string;
  createdAt?: string;
}

export class ComposioApiError extends Error {
  status: number;
  code: string;

  constructor(message: string, status = 502, code = 'COMPOSIO_API_ERROR') {
    super(message);
    this.name = 'ComposioApiError';
    this.status = status;
    this.code = code;
  }
}

export function getComposioApiKey(): string {
  return (process.env.COMPOSIO_API_KEY || '').trim();
}

export function isComposioConfigured(): boolean {
  return getComposioApiKey().length > 8;
}

export function normalizePlatformAndToolkit(
  input: string
): { platform: string; toolkitSlug: string } | null {
  const cleaned = String(input || '')
    .toLowerCase()
    .trim()
    .replace(/[\s-]+/g, '_');

  const toolkitSlug = COMPOSIO_TOOLKIT_MAP[cleaned];
  if (!toolkitSlug) return null;

  const platform = TOOLKIT_TO_PLATFORM_MAP[toolkitSlug] || cleaned;
  return { platform, toolkitSlug };
}

export function composioToolkitToPlatform(toolkitSlug: string): string {
  const cleaned = String(toolkitSlug || '')
    .toLowerCase()
    .trim()
    .replace(/[\s-]+/g, '');
  return TOOLKIT_TO_PLATFORM_MAP[cleaned] || String(toolkitSlug || '').toLowerCase().trim();
}

/**
 * Resolves the canonical origin for OAuth callback URLs.
 * Prefers localhost origin in local dev, otherwise NEXT_PUBLIC_SITE_URL / NEXT_PUBLIC_APP_URL / request origin.
 */
export function resolveAppOrigin(req: { url: string; nextUrl?: { origin?: string } }): string {
  let reqOrigin = '';
  try {
    reqOrigin = req.nextUrl?.origin || new URL(req.url).origin;
    const host = new URL(reqOrigin).hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return reqOrigin;
    }
  } catch {
    // ignore malformed url
  }

  const configured = (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || '').trim();
  if (configured && /^https?:\/\/[^/\s]+/i.test(configured)) {
    return configured.replace(/\/+$/, '');
  }

  return reqOrigin || 'https://vista-social-app.vercel.app';
}

/**
 * Strict Open-Redirect defense for OAuth ?next=... redirect targets.
 */
export function sanitizeNextPath(raw?: string | null, fallback = '/settings'): string {
  if (!raw || typeof raw !== 'string') return fallback;
  const trimmed = raw.trim();
  if (
    !trimmed.startsWith('/') ||
    trimmed.startsWith('//') ||
    trimmed.includes('\\') ||
    trimmed.includes('://') ||
    /[\r\n\0]/.test(trimmed)
  ) {
    return fallback;
  }
  return trimmed;
}

export function buildComposioCallbackUrl(
  origin: string,
  params: { next?: string; toolkit: string; platform: string }
): string {
  const cleanOrigin = origin.replace(/\/+$/, '');
  const safeNext = sanitizeNextPath(params.next, '/settings');
  const query = new URLSearchParams({
    next: safeNext,
    toolkit: params.toolkit,
    platform: params.platform,
  });
  return `${cleanOrigin}/api/composio/callback?${query.toString()}`;
}

export function appendQueryParams(
  baseOrigin: string,
  pathWithOptionalQuery: string,
  extraParams: Record<string, string>
): string {
  const safePath = sanitizeNextPath(pathWithOptionalQuery, '/settings');
  const url = new URL(safePath, baseOrigin);
  for (const [k, v] of Object.entries(extraParams)) {
    if (v !== undefined && v !== '') {
      url.searchParams.set(k, v);
    }
  }
  return url.toString();
}

async function composioFetch(
  path: string,
  init: RequestInit & { timeoutMs?: number } = {}
): Promise<Response> {
  const apiKey = getComposioApiKey();
  if (!apiKey || apiKey.length <= 8) {
    throw new ComposioApiError(
      'Variable COMPOSIO_API_KEY manquante ou invalide côté serveur. Ajoutez-la dans Vercel → Environment Variables.',
      503,
      'COMPOSIO_NOT_CONFIGURED'
    );
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const versions = normalizedPath.startsWith('/api/v3')
    ? [normalizedPath]
    : [`/api/v3${normalizedPath}`, `/api/v3.1${normalizedPath}`];

  const { timeoutMs = 10000, headers, ...rest } = init;
  let lastRes: Response | null = null;

  for (let i = 0; i < versions.length; i++) {
    const res = await fetch(`https://backend.composio.dev${versions[i]}`, {
      ...rest,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        ...(headers || {}),
      },
      signal: AbortSignal.timeout(timeoutMs),
    });

    lastRes = res;
    if (res.status !== 404 || i === versions.length - 1) {
      return res;
    }
  }

  return lastRes!;
}

async function extractComposioErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const json = (await res.json()) as Record<string, unknown>;
    const msg =
      (typeof json?.message === 'string' && json.message) ||
      (typeof (json?.error as Record<string, unknown> | undefined)?.message === 'string' &&
        ((json.error as Record<string, unknown>).message as string)) ||
      (typeof json?.error === 'string' && json.error) ||
      (typeof json?.detail === 'string' && json.detail);
    if (msg) return msg;
  } catch {
    // ignore json parse failure
  }
  return `${fallback} (HTTP ${res.status})`;
}

export async function resolveAuthConfigId(
  toolkitSlug: string,
  explicitAuthConfigId?: string
): Promise<{ authConfigId: string; created: boolean }> {
  if (explicitAuthConfigId && /^ac_[a-zA-Z0-9_-]+$/.test(explicitAuthConfigId.trim())) {
    return { authConfigId: explicitAuthConfigId.trim(), created: false };
  }

  const upperSlug = toolkitSlug.toUpperCase().replace(/[^A-Z0-9]/g, '_');
  const envSpecific =
    process.env[`COMPOSIO_AUTH_CONFIG_${upperSlug}`] ||
    (toolkitSlug === 'googlemybusiness' ? process.env.COMPOSIO_AUTH_CONFIG_GOOGLE_BUSINESS : undefined);
  if (envSpecific && envSpecific.trim().length > 3) {
    return { authConfigId: envSpecific.trim(), created: false };
  }

  // 1. Lookup existing auth_configs for this toolkit
  const listRes = await composioFetch(
    `/auth_configs?toolkit_slug=${encodeURIComponent(toolkitSlug)}`,
    { method: 'GET' }
  );

  if (listRes.ok) {
    const data = (await listRes.json()) as Record<string, unknown>;
    const items = Array.isArray(data?.items)
      ? (data.items as Array<Record<string, unknown>>)
      : Array.isArray(data)
        ? (data as Array<Record<string, unknown>>)
        : [];

    const matching = items.filter((item) => {
      const slug =
        typeof (item?.toolkit as Record<string, unknown> | undefined)?.slug === 'string'
          ? String((item.toolkit as Record<string, unknown>).slug).toLowerCase()
          : typeof item?.toolkit_slug === 'string'
            ? String(item.toolkit_slug).toLowerCase()
            : '';
      const status = String(item?.status || 'ENABLED').toUpperCase();
      return (!slug || slug === toolkitSlug.toLowerCase()) && status !== 'DISABLED';
    });

    const selected =
      matching.find((item) => Boolean(item?.is_composio_managed)) ||
      matching[0];

    const foundId = selected?.id ? String(selected.id) : '';
    if (foundId) {
      return { authConfigId: foundId, created: false };
    }
  }

  // 2. Auto-provision a Composio Managed Auth config if none exists yet
  const createRes = await composioFetch('/auth_configs', {
    method: 'POST',
    body: JSON.stringify({
      toolkit: { slug: toolkitSlug },
      auth_config: { type: 'use_composio_managed_auth' },
    }),
  });

  if (createRes.ok) {
    const created = (await createRes.json()) as Record<string, unknown>;
    const createdId =
      (created?.auth_config as Record<string, unknown> | undefined)?.id || created?.id;
    if (createdId) {
      return { authConfigId: String(createdId), created: true };
    }
  }

  const errMsg = await extractComposioErrorMessage(
    createRes,
    `Aucune Auth Config trouvée pour "${toolkitSlug}"`
  );
  throw new ComposioApiError(
    `Auth Config Composio introuvable ou OAuth personnalisé requis pour "${toolkitSlug}" : ${errMsg}. Configurez-la dans app.composio.dev → Auth Configs.`,
    createRes.status === 401 || createRes.status === 403 ? 502 : 400,
    'AUTH_CONFIG_REQUIRED'
  );
}

export async function createComposioConnectLink(params: {
  userId: string;
  platformOrToolkit: string;
  callbackUrl: string;
  authConfigIdOverride?: string;
}): Promise<{
  redirectUrl: string;
  connectedAccountId: string | null;
  linkToken: string | null;
  authConfigId: string;
  toolkitSlug: string;
  platform: string;
}> {
  const userId = String(params.userId || '').trim();
  if (!userId) {
    throw new ComposioApiError('userId authentifié requis pour générer un lien Composio.', 401, 'USER_ID_REQUIRED');
  }

  const normalized = normalizePlatformAndToolkit(params.platformOrToolkit);
  if (!normalized) {
    throw new ComposioApiError(
      `Toolkit/plateforme non supporté : ${params.platformOrToolkit}`,
      400,
      'UNSUPPORTED_TOOLKIT'
    );
  }

  const { authConfigId } = await resolveAuthConfigId(
    normalized.toolkitSlug,
    params.authConfigIdOverride
  );

  // Use /api/v3.1/connected_accounts/link (or /api/v3 fallback) with user_id + callback_url
  let res = await composioFetch('/api/v3.1/connected_accounts/link', {
    method: 'POST',
    body: JSON.stringify({
      auth_config_id: authConfigId,
      user_id: userId,
      callback_url: params.callbackUrl,
    }),
  });

  if (res.status === 404) {
    res = await composioFetch('/api/v3/connected_accounts/link', {
      method: 'POST',
      body: JSON.stringify({
        auth_config_id: authConfigId,
        user_id: userId,
        callback_url: params.callbackUrl,
      }),
    });
  }

  if (!res.ok) {
    const errMsg = await extractComposioErrorMessage(
      res,
      `Échec création Connect Link Composio pour ${normalized.toolkitSlug}`
    );
    throw new ComposioApiError(errMsg, res.status >= 400 && res.status < 500 ? res.status : 502);
  }

  const data = (await res.json()) as Record<string, unknown>;
  const redirectUrl = String(data?.redirect_url || data?.redirectUrl || '');
  if (!redirectUrl) {
    throw new ComposioApiError(
      `Réponse Composio sans redirect_url pour ${normalized.toolkitSlug}.`,
      502,
      'MISSING_REDIRECT_URL'
    );
  }

  return {
    redirectUrl,
    connectedAccountId: data?.connected_account_id
      ? String(data.connected_account_id)
      : data?.id
        ? String(data.id)
        : null,
    linkToken: data?.link_token ? String(data.link_token) : null,
    authConfigId,
    toolkitSlug: normalized.toolkitSlug,
    platform: normalized.platform,
  };
}

function normalizeConnectedAccountItem(raw: Record<string, unknown>): NormalizedComposioAccount {
  const toolkitObj = raw?.toolkit as Record<string, unknown> | undefined;
  const toolkitSlug = String(
    toolkitObj?.slug || raw?.toolkit_slug || raw?.appName || raw?.app_name || 'composio'
  )
    .toLowerCase()
    .trim();

  const platform = composioToolkitToPlatform(toolkitSlug);
  const stateVal = raw?.data as Record<string, unknown> | undefined;
  const metaVal = raw?.metadata as Record<string, unknown> | undefined;

  const username = String(
    metaVal?.username ||
      stateVal?.username ||
      stateVal?.email ||
      raw?.alias ||
      `@${platform}.composio`
  ).trim();

  const accountName = String(
    raw?.alias ||
      metaVal?.name ||
      stateVal?.name ||
      `${platform.charAt(0).toUpperCase() + platform.slice(1)} (${username})`
  ).trim();

  return {
    id: String(raw?.id || raw?.nanoid || ''),
    userId: String(raw?.user_id || raw?.entity_id || raw?.userId || ''),
    toolkitSlug,
    platform,
    status: String(raw?.status || 'UNKNOWN').toUpperCase(),
    accountName,
    username,
    createdAt: raw?.created_at ? String(raw.created_at) : undefined,
  };
}

export async function listComposioConnectedAccounts(
  userId: string,
  statuses: string[] = ['ACTIVE']
): Promise<NormalizedComposioAccount[]> {
  const cleanUserId = String(userId || '').trim();
  if (!cleanUserId || !isComposioConfigured()) return [];

  const params = new URLSearchParams({ user_ids: cleanUserId });
  if (statuses.length > 0) {
    params.set('statuses', statuses.join(','));
  }

  const res = await composioFetch(`/connected_accounts?${params.toString()}`, {
    method: 'GET',
    timeoutMs: 6000,
  });

  if (!res.ok) {
    return [];
  }

  const data = (await res.json()) as Record<string, unknown>;
  const items = Array.isArray(data?.items)
    ? (data.items as Array<Record<string, unknown>>)
    : Array.isArray(data)
      ? (data as Array<Record<string, unknown>>)
      : [];

  return items
    .map(normalizeConnectedAccountItem)
    .filter((acc) => Boolean(acc.id) && (!acc.userId || acc.userId === cleanUserId));
}

export async function getComposioConnectedAccount(
  connectedAccountId: string
): Promise<NormalizedComposioAccount | null> {
  const cleanId = String(connectedAccountId || '').trim();
  if (!cleanId || !isComposioConfigured()) return null;

  const res = await composioFetch(`/connected_accounts/${encodeURIComponent(cleanId)}`, {
    method: 'GET',
    timeoutMs: 6000,
  });

  if (!res.ok) return null;
  const data = (await res.json()) as Record<string, unknown>;
  if (!data || typeof data !== 'object') return null;
  return normalizeConnectedAccountItem(data);
}

export async function verifyComposioAccountOwnership(
  userId: string,
  connectedAccountId: string
): Promise<{ valid: boolean; mismatch: boolean; account: NormalizedComposioAccount | null }> {
  const cleanUserId = String(userId || '').trim();
  const cleanId = String(connectedAccountId || '').trim();
  if (!cleanUserId || !cleanId) {
    return { valid: false, mismatch: false, account: null };
  }

  const allUserAccounts = await listComposioConnectedAccounts(cleanUserId, []);
  const matchedInList = allUserAccounts.find((a) => a.id === cleanId);
  if (matchedInList) {
    return { valid: true, mismatch: false, account: matchedInList };
  }

  const direct = await getComposioConnectedAccount(cleanId);
  if (!direct) {
    return { valid: false, mismatch: false, account: null };
  }

  if (direct.userId && direct.userId !== cleanUserId) {
    return { valid: false, mismatch: true, account: null };
  }

  return { valid: true, mismatch: false, account: direct };
}

export async function revokeComposioConnectedAccount(
  userId: string,
  connectedAccountId: string
): Promise<boolean> {
  const cleanUserId = String(userId || '').trim();
  const cleanId = String(connectedAccountId || '').trim();
  if (!cleanUserId || !cleanId || !isComposioConfigured()) return false;

  const ownership = await verifyComposioAccountOwnership(cleanUserId, cleanId);
  if (ownership.mismatch || !ownership.valid) {
    return false;
  }

  try {
    await composioFetch(`/connected_accounts/${encodeURIComponent(cleanId)}/revoke`, {
      method: 'POST',
      timeoutMs: 6000,
    });
  } catch {
    // try DELETE fallback below
  }

  const delRes = await composioFetch(`/connected_accounts/${encodeURIComponent(cleanId)}`, {
    method: 'DELETE',
    timeoutMs: 6000,
  });
  return delRes.ok;
}

export async function executeComposioTool(params: {
  userId: string;
  toolSlug: string;
  connectedAccountId?: string;
  arguments: Record<string, unknown>;
}): Promise<{ ok: boolean; data?: unknown; error?: string; status: number }> {
  const cleanUserId = String(params.userId || '').trim();
  if (!cleanUserId) {
    return { ok: false, error: 'userId requis', status: 401 };
  }

  const res = await composioFetch(
    `/tools/execute/${encodeURIComponent(params.toolSlug)}`,
    {
      method: 'POST',
      timeoutMs: 12000,
      body: JSON.stringify({
        user_id: cleanUserId,
        ...(params.connectedAccountId ? { connected_account_id: params.connectedAccountId } : {}),
        arguments: params.arguments || {},
      }),
    }
  );

  if (!res.ok) {
    const errMsg = await extractComposioErrorMessage(
      res,
      `Échec exécution outil Composio ${params.toolSlug}`
    );
    return { ok: false, error: errMsg, status: res.status };
  }

  const data = await res.json();
  return { ok: true, data, status: res.status };
}

export async function syncComposioAccountsToSupabase(params: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any;
  userId: string;
  workspaceId?: string;
  encryptTokenFn: (raw: string) => string;
  accounts?: NormalizedComposioAccount[];
}): Promise<{ accounts: NormalizedComposioAccount[]; activeToolkits: string[] }> {
  const activeAccounts =
    params.accounts || (await listComposioConnectedAccounts(params.userId, ['ACTIVE']));

  const activeToolkits = Array.from(
    new Set(
      activeAccounts
        .filter((a) => a.status === 'ACTIVE')
        .map((a) => a.toolkitSlug)
    )
  );

  if (!params.supabase || !params.workspaceId || activeAccounts.length === 0) {
    return { accounts: activeAccounts, activeToolkits };
  }

  const nowIso = new Date().toISOString();

  for (const acc of activeAccounts) {
    if (acc.status !== 'ACTIVE') continue;

    try {
      const encryptedToken = params.encryptTokenFn(`composio:${acc.id}`);
      const { data: existing } = await params.supabase
        .from('social_accounts')
        .select('id')
        .eq('workspace_id', params.workspaceId)
        .eq('platform', acc.platform)
        .eq('platform_account_id', acc.id)
        .maybeSingle();

      const metadata = {
        connected_via: 'composio_v3',
        composio_connection_id: acc.id,
        composio_user_id: params.userId,
        toolkit_slug: acc.toolkitSlug,
        synced_at: nowIso,
      };

      if (existing?.id) {
        await params.supabase
          .from('social_accounts')
          .update({
            account_name: acc.accountName.slice(0, 120),
            username: acc.username.slice(0, 120),
            access_token: encryptedToken,
            is_connected: true,
            status: 'active',
            metadata,
            updated_at: nowIso,
          })
          .eq('id', existing.id);
      } else {
        await params.supabase.from('social_accounts').insert({
          workspace_id: params.workspaceId,
          platform: acc.platform,
          platform_account_id: acc.id,
          account_name: acc.accountName.slice(0, 120),
          username: acc.username.slice(0, 120),
          avatar_url: '/flyers/tech-saas.svg',
          access_token: encryptedToken,
          is_connected: true,
          status: 'active',
          followers_count: 0,
          metadata,
        });
      }
    } catch {
      // non-blocking per account sync
    }
  }

  return { accounts: activeAccounts, activeToolkits };
}
