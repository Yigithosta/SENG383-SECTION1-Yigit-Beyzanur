import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { installFakeBackend, PASSWORD, storeTokenFor, USERS } from './test/fakeBackend.js';
import { renderApp } from './test/renderApp.jsx';

async function logIn(email, password = PASSWORD) {
  await userEvent.type(await screen.findByLabelText('E-posta'), email);
  await userEvent.type(screen.getByLabelText('Şifre'), password);
  await userEvent.click(screen.getByRole('button', { name: 'Giriş yap' }));
}

describe('login (FR-M1-01, FR-M1-02)', () => {
  it('logs a parent in and shows their children', async () => {
    const fetchMock = installFakeBackend();
    renderApp('/');

    await logIn('parent@demo.test');

    expect(await screen.findByRole('heading', { name: 'Çocuklarım' })).toBeInTheDocument();
    expect(await screen.findByText('Ege Örnek')).toBeInTheDocument();
    expect(window.location.pathname).toBe('/children');
    expect(window.localStorage.getItem('seng383.token')).toBe('token-1');

    // Requests after login carry the token.
    const childrenCall = fetchMock.mock.calls.find(([path]) => path === '/api/children');
    expect(childrenCall[1].headers.Authorization).toBe('Bearer token-1');
  });

  it('shows the server message for a wrong password and stores no token', async () => {
    installFakeBackend();
    renderApp('/login');

    await logIn('parent@demo.test', 'yanlis');

    expect(await screen.findByRole('alert')).toHaveTextContent('E-posta veya şifre hatalı.');
    expect(screen.getByRole('button', { name: 'Giriş yap' })).toBeEnabled();
    expect(window.localStorage.getItem('seng383.token')).toBeNull();
    expect(window.location.pathname).toBe('/login');
  });

  it('says so when the backend cannot be reached', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    renderApp('/login');

    await logIn('parent@demo.test');

    expect(await screen.findByRole('alert')).toHaveTextContent('Sunucuya ulaşılamıyor');
  });
});

describe('role-based screens (FR-M1-03)', () => {
  it('sends a child to "Görevlerim"', async () => {
    installFakeBackend();
    renderApp('/');

    await logIn('child@demo.test');

    expect(await screen.findByRole('heading', { name: 'Görevlerim' })).toBeInTheDocument();
    expect(screen.getByText('Merhaba Ege', { exact: false })).toBeInTheDocument();
    expect(window.location.pathname).toBe('/my-tasks');
  });

  it('shows a specialist the children linked to them', async () => {
    installFakeBackend();
    renderApp('/');

    await logIn('teacher@demo.test');

    expect(await screen.findByRole('heading', { name: 'Bağlı olduğum çocuklar' })).toBeInTheDocument();
    expect(await screen.findByText('Ege Örnek')).toBeInTheDocument();
    expect(screen.getByTestId('current-user')).toHaveTextContent('Uzman · Öğretmen');
  });

  it('shows an unlinked specialist an empty list', async () => {
    installFakeBackend();
    storeTokenFor(USERS.doctor);
    renderApp('/children');

    expect(await screen.findByRole('heading', { name: 'Henüz bağlı bir çocuk yok' })).toBeInTheDocument();
  });

  it('redirects a child away from the parent screens', async () => {
    installFakeBackend();
    storeTokenFor(USERS.child);
    renderApp('/children/1');

    expect(await screen.findByRole('heading', { name: 'Görevlerim' })).toBeInTheDocument();
    expect(window.location.pathname).toBe('/my-tasks');
  });

  it('opens a child page with its tabs from the list', async () => {
    installFakeBackend();
    storeTokenFor(USERS.parent);
    renderApp('/children');

    await userEvent.click(await screen.findByRole('link', { name: /Ege Örnek/ }));

    expect(await screen.findByTestId('child-name')).toHaveTextContent('Ege Örnek');
    expect(window.location.pathname).toBe('/children/1');
    const tabs = screen.getByRole('navigation', { name: 'Çocuk sayfaları' });
    expect(within(tabs).getByRole('link', { name: 'Genel bakış' })).toHaveAttribute('aria-current', 'page');

    await userEvent.click(within(tabs).getByRole('link', { name: 'Görevler' }));
    expect(window.location.pathname).toBe('/children/1/tasks');
    expect(screen.getByText('Bu ekran SCRUM-36 ile eklenecek.')).toBeInTheDocument();
  });

  it('shows the API message when a specialist opens a child they are not linked to', async () => {
    installFakeBackend();
    storeTokenFor(USERS.doctor);
    renderApp('/children/1');

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Erişim izniniz yok');
    expect(alert).toHaveTextContent('Bu çocuğun bilgilerine erişim izniniz yok.');
    expect(screen.queryByTestId('child-name')).not.toBeInTheDocument();
  });
});

describe('session (FR-M1-04)', () => {
  it('sends an anonymous visitor to login and back to the page they asked for', async () => {
    installFakeBackend();
    renderApp('/children/1');

    expect(await screen.findByRole('heading', { name: 'Giriş yap' })).toBeInTheDocument();
    expect(window.location.pathname).toBe('/login');

    await logIn('parent@demo.test');

    expect(await screen.findByTestId('child-name')).toHaveTextContent('Ege Örnek');
    expect(window.location.pathname).toBe('/children/1');
  });

  it('restores the session from the stored token after a reload', async () => {
    const fetchMock = installFakeBackend();
    storeTokenFor(USERS.parent);
    renderApp('/children');

    expect(await screen.findByText('Ege Örnek')).toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([path]) => path === '/api/auth/me')).toBe(true);
    expect(screen.getByTestId('current-user')).toHaveTextContent('Deniz Örnek');
  });

  it('drops an expired token and shows the login page', async () => {
    installFakeBackend({
      'GET /api/auth/me': async () => ({
        ok: false,
        status: 401,
        json: async () => ({ error: { code: 'TOKEN_EXPIRED', message: 'Oturumun süresi doldu.' } }),
      }),
    });
    storeTokenFor(USERS.parent);
    renderApp('/children');

    expect(await screen.findByRole('heading', { name: 'Giriş yap' })).toBeInTheDocument();
    expect(window.localStorage.getItem('seng383.token')).toBeNull();
  });

  it('logs out, forgets the token and protects the screens again', async () => {
    installFakeBackend();
    storeTokenFor(USERS.parent);
    renderApp('/children');

    await userEvent.click(await screen.findByTestId('logout-button'));

    expect(await screen.findByRole('heading', { name: 'Giriş yap' })).toBeInTheDocument();
    expect(window.localStorage.getItem('seng383.token')).toBeNull();
    expect(window.location.pathname).toBe('/login');
  });

  it('starts the next user on their own home page after a logout', async () => {
    installFakeBackend();
    storeTokenFor(USERS.parent);
    renderApp('/children/1');

    await userEvent.click(await screen.findByTestId('logout-button'));
    await logIn('doctor@demo.test');

    expect(await screen.findByRole('heading', { name: 'Henüz bağlı bir çocuk yok' })).toBeInTheDocument();
    expect(window.location.pathname).toBe('/children');
  });

  it('offers a retry when the backend is down during session restore', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    storeTokenFor(USERS.parent);
    renderApp('/children');

    expect(await screen.findByRole('alert')).toHaveTextContent('npm run dev');

    installFakeBackend();
    await userEvent.click(screen.getByRole('button', { name: 'Tekrar dene' }));

    expect(await screen.findByText('Ege Örnek')).toBeInTheDocument();
  });
});
