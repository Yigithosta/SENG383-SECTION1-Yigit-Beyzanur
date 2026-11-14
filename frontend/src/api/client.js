import { getToken } from '../auth/tokenStorage.js';

// Every API error has the shape { error: { code, message } } (docs/SDD.md).
// apiFetch turns it into an ApiError, so screens can check err.status or
// err.code and show err.message, which the backend already writes in Turkish.
export class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

let onUnauthorized = null;

// AuthProvider registers a handler that logs the user out when the API
// answers 401 to a request that carried a token (expired or invalid).
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

/**
 * Calls the backend and returns the parsed JSON body (null for 204).
 *
 *   const { children } = await apiFetch('/api/children');
 *   await apiFetch(`/api/children/${id}/tasks`, { method: 'POST', body: { title } });
 *
 * Adds "Authorization: Bearer <token>" when the user is logged in.
 * Pass { auth: false } for requests that must not send the token (login).
 * Throws ApiError; status 0 with code NETWORK_ERROR when the backend is unreachable.
 */
export async function apiFetch(path, { method = 'GET', body, signal, auth = true } = {}) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const token = auth ? getToken() : null;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let res;
  try {
    res = await fetch(path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (err) {
    if (err?.name === 'AbortError') throw err;
    throw new ApiError(0, 'NETWORK_ERROR', 'Sunucuya ulaşılamıyor. Backend çalışıyor mu?');
  }

  if (res.status === 204) {
    return null;
  }

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    if (res.status === 401 && token) {
      onUnauthorized?.();
    }
    throw new ApiError(
      res.status,
      data?.error?.code ?? 'HTTP_ERROR',
      data?.error?.message ?? `İstek başarısız oldu (${res.status}).`
    );
  }

  return data;
}
