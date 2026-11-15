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
  psychologist: {
    id: 4,
    name: 'Murat Psikolog',
    email: 'psychologist@demo.test',
    role: 'specialist',
    specialistType: 'psychologist',
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

const publicSpecialist = (u) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  specialistType: u.specialistType,
  linkedAt: '2026-11-02 09:30:00',
});

/**
 * Installs the fake API as global fetch and returns the vi.fn, so a test can
 * inspect calls. `routes` adds or overrides handlers: { 'GET /api/x': (req) => response }.
 */
export function installFakeBackend(routes = {}) {
  const byToken = Object.fromEntries(Object.values(USERS).map((u) => [tokenFor(u), u]));
  // Like the seed: the teacher and psychologist are linked, the doctor is not.
  const linked = new Set([USERS.teacher.id, USERS.psychologist.id]);

  function relationOf(user) {
    if (user.role === 'parent') return 'parent';
    if (user.role === 'child') return 'self';
    return linked.has(user.id) ? 'specialist' : null;
  }

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

    const specialistsMatch = path.match(/^\/api\/children\/1\/specialists(?:\/(\d+))?$/);
    if (specialistsMatch) {
      const relation = relationOf(user);
      if (!relation) return error(403, 'NO_ACCESS', 'Bu çocuğun bilgilerine erişim izniniz yok.');
      const allowed = method === 'GET' ? ['parent', 'specialist'] : ['parent'];
      if (!allowed.includes(relation)) return error(403, 'FORBIDDEN', 'Bu işlem için yetkiniz yok.');

      if (method === 'GET') {
        const specialists = Object.values(USERS).filter((u) => linked.has(u.id)).map(publicSpecialist);
        return json(200, { specialists });
      }
      if (method === 'POST') {
        const email = body?.email?.trim().toLowerCase();
        if (!email) return error(400, 'VALIDATION_ERROR', 'Uzmanın e-posta adresi zorunludur.');
        const found = Object.values(USERS).find((u) => u.email === email && u.role === 'specialist');
        if (!found) {
          return error(404, 'SPECIALIST_NOT_FOUND', 'Bu e-posta adresiyle kayıtlı bir uzman bulunamadı.');
        }
        if (linked.has(found.id)) return error(409, 'ALREADY_LINKED', 'Bu uzman çocuğa zaten bağlı.');
        linked.add(found.id);
        return json(201, { specialist: publicSpecialist(found) });
      }
      if (method === 'DELETE') {
        const id = Number(specialistsMatch[1]);
        if (!linked.delete(id)) return error(404, 'LINK_NOT_FOUND', 'Bu uzman çocuğa bağlı değil.');
        return { ok: true, status: 204 };
      }
    }

    return error(404, 'NOT_FOUND', 'İstenen kaynak bulunamadı.');
  });

  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

export function storeTokenFor(user) {
  window.localStorage.setItem('seng383.token', tokenFor(user));
}
