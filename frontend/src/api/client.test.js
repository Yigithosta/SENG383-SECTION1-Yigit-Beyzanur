import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, apiFetch, setUnauthorizedHandler } from './client.js';

function respond(status, body) {
  return vi.fn().mockResolvedValue({ ok: status < 300, status, json: async () => body });
}

describe('apiFetch', () => {
  afterEach(() => setUnauthorizedHandler(null));

  it('sends JSON with the stored token and returns the body', async () => {
    window.localStorage.setItem('seng383.token', 'abc');
    const fetchMock = respond(201, { id: 7 });
    vi.stubGlobal('fetch', fetchMock);

    const data = await apiFetch('/api/x', { method: 'POST', body: { a: 1 } });

    expect(data).toEqual({ id: 7 });
    const [path, init] = fetchMock.mock.calls[0];
    expect(path).toBe('/api/x');
    expect(init.method).toBe('POST');
    expect(init.body).toBe('{"a":1}');
    expect(init.headers).toMatchObject({
      Authorization: 'Bearer abc',
      'Content-Type': 'application/json',
    });
  });

  it('does not send the token when auth is false', async () => {
    window.localStorage.setItem('seng383.token', 'abc');
    const fetchMock = respond(200, {});
    vi.stubGlobal('fetch', fetchMock);

    await apiFetch('/api/auth/login', { method: 'POST', body: {}, auth: false });

    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBeUndefined();
  });

  it('returns null for 204 No Content', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 204 }));

    expect(await apiFetch('/api/x', { method: 'DELETE' })).toBeNull();
  });

  it('turns the API error shape into an ApiError', async () => {
    vi.stubGlobal('fetch', respond(404, { error: { code: 'SPECIALIST_NOT_FOUND', message: 'Bulunamadı.' } }));

    const err = await apiFetch('/api/x').catch((e) => e);

    expect(err).toBeInstanceOf(ApiError);
    expect(err).toMatchObject({ status: 404, code: 'SPECIALIST_NOT_FOUND', message: 'Bulunamadı.' });
  });

  it('still throws a readable error when the body is not JSON', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 502, json: () => Promise.reject(new SyntaxError()) }));

    await expect(apiFetch('/api/x')).rejects.toMatchObject({ status: 502, code: 'HTTP_ERROR' });
  });

  it('reports a network failure as NETWORK_ERROR', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    await expect(apiFetch('/api/x')).rejects.toMatchObject({ status: 0, code: 'NETWORK_ERROR' });
  });

  it('calls the unauthorized handler on 401 only when a token was sent', async () => {
    const handler = vi.fn();
    setUnauthorizedHandler(handler);
    vi.stubGlobal('fetch', respond(401, { error: { code: 'TOKEN_EXPIRED', message: 'x' } }));

    await apiFetch('/api/x').catch(() => {});
    expect(handler).not.toHaveBeenCalled();

    window.localStorage.setItem('seng383.token', 'old');
    await apiFetch('/api/x').catch(() => {});
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
