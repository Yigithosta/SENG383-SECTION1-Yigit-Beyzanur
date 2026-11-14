// The JWT is kept in localStorage so the session survives a page reload and
// works in a second tab. It expires after 8 hours (see backend/src/auth/tokens.js).
// Storage can be unavailable (private mode, blocked site data), so every access
// is wrapped: without storage the user simply logs in again after a reload.
const KEY = 'seng383.token';

export function getToken() {
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function setToken(token) {
  try {
    window.localStorage.setItem(KEY, token);
  } catch {
    // Ignore: the session then lasts until the page is reloaded.
  }
}

export function clearToken() {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // Ignore: nothing was stored.
  }
}
