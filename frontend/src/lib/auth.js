// Mock authentication service - localStorage based
const STORAGE_KEY = 'kwe_user';

const TEST_ACCOUNTS = [
  {
    id: 'u_admin',
    email: 'admin@kwe.com',
    password: 'password123',
    name: 'Balaram Nandamuri',
    role: 'admin',
    company: 'KWE Platform',
    avatar: 'MT',
  },
];


export function getStoredUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function login(email, password) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const normalizedEmail = String(email || '').trim().toLowerCase();
      const normalizedPassword = String(password || '').trim();
      const account = TEST_ACCOUNTS.find(
        (a) => a.email.toLowerCase() === normalizedEmail && a.password === normalizedPassword
      );
      if (!account) {
        reject(new Error('Invalid email or password'));
        return;
      }
      const { password: _, ...safe } = account;
      const session = { ...safe, token: `mock-token-${Date.now()}` };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      resolve(session);
    }, 600);
  });
}

export function logout() {
  localStorage.removeItem(STORAGE_KEY);
}

export function requestPasswordReset(email) {
  return new Promise((resolve) => {
    setTimeout(() => resolve({ email, sent: true }), 600);
  });
}

export function resetPassword(token, newPassword) {
  return new Promise((resolve) => {
    setTimeout(() => resolve({ success: true }), 600);
  });
}

export const TEST_CREDENTIALS = TEST_ACCOUNTS.map(({ password, ...rest }) => ({ ...rest, password }));
