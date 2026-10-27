// KWE Admin authentication.
// VITE_AUTH_MODE:
//   okta   - production. Okta OIDC (Authorization Code + PKCE); Okta routes to Microsoft Entra ID.
//   static - TEMPORARY dummy logins issued by the Java backend (POST /api/v1/auth/static-login).
//   demo   - browser-only dummy logins for previews with no backend. NOT secure; never use in production.
// In okta/static mode the role always comes from the backend (GET /api/v1/auth/me), never from storage.
import { OktaAuth } from '@okta/okta-auth-js';

const env = import.meta.env;
export const AUTH_MODE = (env.VITE_AUTH_MODE || (env.DEV ? 'demo' : 'okta')).toLowerCase();
const BASE_URL = env.VITE_BACKEND_URL || '';
const STATIC_TOKEN_KEY = 'kwe_admin_static_token';
const DEMO_SESSION_KEY = 'kwe_admin_demo_session';

export const NOT_AUTHORIZED_MESSAGE =
  'You are not authorized to access the KWE Instant Quote Admin application. Please contact your administrator.';

export class AuthError extends Error {
  constructor(kind, message) {
    super(message);
    this.kind = kind; // 'unauthenticated' | 'forbidden' | 'unavailable' | 'config'
  }
}

// ---------------- Okta ----------------
let _okta = null;
function okta() {
  if (_okta) return _okta;
  if (!env.VITE_OKTA_ISSUER || !env.VITE_OKTA_CLIENT_ID) {
    throw new AuthError('config', 'Okta sign-in is not configured yet (VITE_OKTA_ISSUER / VITE_OKTA_CLIENT_ID).');
  }
  _okta = new OktaAuth({
    issuer: env.VITE_OKTA_ISSUER,
    clientId: env.VITE_OKTA_CLIENT_ID,
    redirectUri: `${window.location.origin}/login/callback`,
    postLogoutRedirectUri: `${window.location.origin}/login`,
    scopes: (env.VITE_OKTA_SCOPES || 'openid profile email').split(/\s+/),
    pkce: true,
    tokenManager: { storage: 'sessionStorage', autoRenew: true },
  });
  return _okta;
}

export function startOktaLogin(originalUri) {
  return okta().signInWithRedirect({ originalUri, idp: env.VITE_OKTA_IDP_ID || undefined });
}

/** Handles /login/callback. Returns the path the user originally asked for. */
export async function completeOktaLogin() {
  const client = okta();
  const { tokens } = await client.token.parseFromUrl();
  client.tokenManager.setTokens(tokens);
  return client.getOriginalUri() || '/';
}

// ---------------- Static (backend-issued dummy tokens) ----------------
function readStaticToken() {
  try {
    const t = JSON.parse(sessionStorage.getItem(STATIC_TOKEN_KEY) || 'null');
    if (t && t.expiresAt > Date.now()) return t.accessToken;
  } catch {
    // ignore corrupt value
  }
  sessionStorage.removeItem(STATIC_TOKEN_KEY);
  return null;
}

export async function staticLogin(email, password) {
  const res = await fetch(`${BASE_URL}/api/v1/auth/static-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  }).catch(() => {
    throw new AuthError('unavailable', 'The sign-in service is unavailable. Please try again later.');
  });
  if (!res.ok) throw new AuthError('unauthenticated', 'Invalid credentials or you are not authorized.');
  const body = await res.json();
  sessionStorage.setItem(STATIC_TOKEN_KEY, JSON.stringify({
    accessToken: body.accessToken,
    expiresAt: Date.now() + body.expiresIn * 1000,
  }));
}

// ---------------- Demo (browser only; mirrors db/900_seed_dummy_admin_users.sql) ----------------
export const DEMO_PASSWORD = 'Demo@123';
const DEMO_REGISTRY = {
  'reader@kwe.com': { role: 'READ_ONLY', active: true },
  'writer@kwe.com': { role: 'READ_WRITE', active: true },
  'inactive@kwe.com': { role: 'READ_WRITE', active: false },
  'odd@kwe.com': { role: 'SUPER_ADMIN', active: true },
};
export const DEMO_ACCOUNTS = [
  { email: 'writer@kwe.com', note: 'Read + Write' },
  { email: 'reader@kwe.com', note: 'Read-Only' },
  { email: 'inactive@kwe.com', note: 'Inactive → denied' },
  { email: 'outsider@kwe.com', note: 'No record → denied' },
];

function demoResolve(email) {
  const row = DEMO_REGISTRY[email];
  if (!row || !row.active || !VALID_ROLES.includes(row.role)) throw new AuthError('forbidden', NOT_AUTHORIZED_MESSAGE);
  return { email, role: row.role };
}

export async function demoLogin(email, password) {
  await new Promise((r) => setTimeout(r, 400));
  if (password !== DEMO_PASSWORD) throw new AuthError('unauthenticated', 'Invalid credentials.');
  sessionStorage.setItem(DEMO_SESSION_KEY, normaliseEmail(email));
}

// ---------------- Shared ----------------
export const VALID_ROLES = ['READ_ONLY', 'READ_WRITE'];
export const normaliseEmail = (e) => String(e || '').trim().toLowerCase();

export async function getAccessToken() {
  if (AUTH_MODE === 'okta') {
    const t = await okta().tokenManager.get('accessToken');
    return t?.accessToken || null;
  }
  if (AUTH_MODE === 'static') return readStaticToken();
  return null;
}

/** Resolves { email, role } from the trusted source. Throws AuthError when not signed in / not authorized. */
export async function fetchCurrentUser() {
  if (AUTH_MODE === 'demo') {
    const email = sessionStorage.getItem(DEMO_SESSION_KEY);
    if (!email) throw new AuthError('unauthenticated', 'Not signed in.');
    return demoResolve(email);
  }
  const token = await getAccessToken();
  if (!token) throw new AuthError('unauthenticated', 'Not signed in.');
  const res = await fetch(`${BASE_URL}/api/v1/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
    .catch(() => {
      throw new AuthError('unavailable', 'The authorization service is unavailable. Please try again later.');
    });
  if (res.status === 401) throw new AuthError('unauthenticated', 'Your session has expired. Please sign in again.');
  if (res.status === 403) throw new AuthError('forbidden', NOT_AUTHORIZED_MESSAGE);
  if (!res.ok) throw new AuthError('unavailable', 'The authorization service is unavailable. Please try again later.');
  const me = await res.json();
  if (!VALID_ROLES.includes(me.role)) throw new AuthError('forbidden', NOT_AUTHORIZED_MESSAGE);
  return { email: me.email, role: me.role };
}

export async function logout() {
  sessionStorage.removeItem(STATIC_TOKEN_KEY);
  sessionStorage.removeItem(DEMO_SESSION_KEY);
  sessionStorage.removeItem('iq_payload');
  if (AUTH_MODE === 'okta' && _okta) {
    await _okta.signOut({ postLogoutRedirectUri: `${window.location.origin}/login` }).catch(() => {
      _okta.tokenManager.clear();
    });
  }
}
