import { vi } from 'vitest';

// A small stand-in for the Express API, used as the global fetch in tests.
// It knows the seed accounts and answers like the real routes, including
// the { error: { code, message } } shape and the Bearer token check.

export const USERS = {
  parent: { id: 1, name: 'Deniz Örnek', email: 'parent@demo.test', role: 'parent' },
  child: { id: 2, name: 'Ege Örnek', email: 'child@demo.test', role: 'child', childId: 1 },
  teacher: {
    id: 3,
    name: 'Selin Öğretmen',
    email: 'teacher@demo.test',
    role: 'specialist',
    specialistType: 'teacher',
  },
  doctor: {
    id: 5,
    name: 'Aylin Doktor',
    email: 'doctor@demo.test',
    role: 'specialist',
    specialistType: 'doctor',
  },
};

export const PASSWORD = 'Demo1234!';
export const CHILD = { id: 1, name: 'Ege Örnek', birthDate: '2018-04-12' };

const tokenFor = (user) => `token-${user.id}`;

function json(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  };
}

const error = (status, code, message) => json(status, { error: { code, message } });

function relationOf(user) {
  if (user.role === 'parent') return 'parent';
  if (user.role === 'child') return 'self';
  if (user.id === USERS.teacher.id) return 'specialist';
  return null;
}

/**
 * Installs the fake API as global fetch and returns the vi.fn, so a test can
 * inspect calls. `routes` adds or overrides handlers: { 'GET /api/x': (req) => response }.
 */
export function installFakeBackend(routes = {}) {
  const byToken = Object.fromEntries(Object.values(USERS).map((u) => [tokenFor(u), u]));

  const fetchMock = vi.fn(async (path, init = {}) => {
    const method = init.method ?? 'GET';
    const auth = init.headers?.Authorization;
    const user = auth?.startsWith('Bearer ') ? byToken[auth.slice(7)] : undefined;
    const body = init.body ? JSON.parse(init.body) : undefined;
    const req = { method, path, body, user };

    const custom = routes[`${method} ${path}`];
    if (custom) return custom(req);

    if (method === 'POST' && path === '/api/auth/login') {
      const found = Object.values(USERS).find((u) => u.email === body.email?.trim().toLowerCase());
      if (!found || body.password !== PASSWORD) {
        return error(401, 'INVALID_CREDENTIALS', 'E-posta veya şifre hatalı.');
      }
      return json(200, { token: tokenFor(found), expiresIn: '8h', user: found });
    }

    if (!user) {
      return error(401, 'UNAUTHENTICATED', 'Bu işlem için giriş yapmalısınız.');
    }

    if (method === 'GET' && path === '/api/auth/me') {
      return json(200, { user });
    }

    if (method === 'GET' && path === '/api/children') {
      const relation = relationOf(user);
      return json(200, { children: relation ? [{ ...CHILD, relation }] : [] });
    }

    const childMatch = path.match(/^\/api\/children\/([^/]+)$/);
    if (method === 'GET' && childMatch) {
      if (childMatch[1] !== String(CHILD.id)) {
        return error(404, 'CHILD_NOT_FOUND', 'Çocuk bulunamadı.');
      }
      const relation = relationOf(user);
      if (!relation) {
        return error(403, 'NO_ACCESS', 'Bu çocuğun bilgilerine erişim izniniz yok.');
      }
      return json(200, { child: { ...CHILD, relation } });
    }

    return error(404, 'NOT_FOUND', 'İstenen kaynak bulunamadı.');
  });

  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

export function storeTokenFor(user) {
  window.localStorage.setItem('seng383.token', tokenFor(user));
}
