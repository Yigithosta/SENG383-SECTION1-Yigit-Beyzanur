import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import App from './App.jsx';

const HEALTH = { status: 'ok', database: 'ok' };
const SUMMARY = {
  users: { parent: 1, child: 1, specialist: 3 },
  children: [
    {
      name: 'Ege Örnek',
      birthDate: '2018-04-12',
      parentName: 'Deniz Örnek',
      linkedSpecialists: [{ name: 'Selin Öğretmen', type: 'teacher' }],
      unlinkedSpecialists: [{ name: 'Aylin Doktor', type: 'doctor' }],
    },
  ],
};

function stubApi(summary = SUMMARY, health = HEALTH) {
  const fetchMock = vi.fn(async (path) => ({
    ok: true,
    json: async () => (path === '/api/health' ? health : summary),
  }));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('App', () => {
  it('shows data from the backend', async () => {
    stubApi();

    render(<App />);

    expect(await screen.findByRole('heading', { name: 'Ege Örnek' })).toBeInTheDocument();
    expect(screen.getByText('12 Nisan 2018', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('Ebeveyn: Deniz Örnek')).toBeInTheDocument();
    expect(screen.getByText('Kayıtlı kullanıcı').previousSibling).toHaveTextContent('5');
  });

  it('labels linked and unlinked specialists with text, not only color', async () => {
    stubApi();

    render(<App />);

    const linkedRow = (await screen.findByText('Selin Öğretmen')).closest('li');
    const unlinkedRow = screen.getByText('Aylin Doktor').closest('li');
    expect(within(linkedRow).getByText('Bağlı')).toBeInTheDocument();
    expect(within(unlinkedRow).getByText('Bağlı değil')).toBeInTheDocument();
  });

  it('reports a database problem from the health check', async () => {
    stubApi(SUMMARY, { status: 'ok', database: 'error' });

    render(<App />);

    const sqliteRow = (await screen.findByText('SQLite')).closest('li');
    expect(within(sqliteRow).getByText('Hata')).toBeInTheDocument();
  });

  it('asks to run the seed script when the database is empty', async () => {
    stubApi({ users: { parent: 0, child: 0, specialist: 0 }, children: [] });

    render(<App />);

    expect(
      await screen.findByRole('heading', { name: 'Veritabanında kayıt yok' })
    ).toBeInTheDocument();
    expect(screen.getByText('npm run seed')).toBeInTheDocument();
  });

  it('shows an error when the backend is down and recovers on retry', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    render(<App />);

    expect(await screen.findByRole('alert')).toHaveTextContent('npm run dev');
    expect(screen.getByText('Backend bağlantısı yok')).toBeInTheDocument();

    stubApi();
    await userEvent.click(screen.getByRole('button', { name: 'Tekrar dene' }));

    expect(await screen.findByRole('heading', { name: 'Ege Örnek' })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByText('Sistem çalışıyor')).toBeInTheDocument();
  });
});
