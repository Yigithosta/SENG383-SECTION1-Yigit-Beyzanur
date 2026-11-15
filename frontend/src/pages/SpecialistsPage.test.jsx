import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { installFakeBackend, storeTokenFor, USERS } from '../test/fakeBackend.js';
import { renderApp } from '../test/renderApp.jsx';

const PAGE = '/children/1/specialists';

async function openAs(user) {
  const fetchMock = installFakeBackend();
  storeTokenFor(user);
  renderApp(PAGE);
  await screen.findByTestId('specialists-list');
  return fetchMock;
}

function rowNames() {
  return within(screen.getByTestId('specialists-list'))
    .getAllByTestId('specialist-row')
    .map((row) => row.querySelector('.person-name').textContent);
}

describe('SpecialistsPage (M2)', () => {
  it('lists linked specialists with type and email (FR-M2-06)', async () => {
    await openAs(USERS.parent);

    expect(rowNames()).toEqual(['Selin Öğretmen', 'Murat Psikolog']);
    const teacherRow = screen.getByText('Selin Öğretmen').closest('li');
    expect(teacherRow).toHaveTextContent('Öğretmen · teacher@demo.test');
    expect(teacherRow).toHaveTextContent('Bağlandı: 2 Kasım 2026');
  });

  it('links a registered specialist by email (FR-M2-01)', async () => {
    const fetchMock = await openAs(USERS.parent);

    await userEvent.type(screen.getByLabelText('Uzmanın e-posta adresi'), ' Doctor@Demo.test ');
    await userEvent.click(screen.getByTestId('add-specialist'));

    expect(await screen.findByRole('status')).toHaveTextContent('Aylin Doktor Ege Örnek için bağlandı.');
    await waitFor(() => expect(rowNames()).toContain('Aylin Doktor'));
    expect(screen.getByLabelText('Uzmanın e-posta adresi')).toHaveValue('');

    const post = fetchMock.mock.calls.find(([, init]) => init?.method === 'POST' && init.body?.includes('email'));
    expect(post[0]).toBe('/api/children/1/specialists');
  });

  it('shows an error for an email that is not a registered specialist (FR-M2-05)', async () => {
    await openAs(USERS.parent);

    await userEvent.type(screen.getByLabelText('Uzmanın e-posta adresi'), 'kimse@demo.test');
    await userEvent.click(screen.getByTestId('add-specialist'));

    expect(await screen.findByTestId('specialist-error')).toHaveTextContent(
      'Bu e-posta adresiyle kayıtlı bir uzman bulunamadı.'
    );
    expect(screen.getByLabelText('Uzmanın e-posta adresi')).toHaveAttribute('aria-invalid', 'true');
    expect(rowNames()).toHaveLength(2);
  });

  it('says when the specialist is already linked', async () => {
    await openAs(USERS.parent);

    await userEvent.type(screen.getByLabelText('Uzmanın e-posta adresi'), 'teacher@demo.test');
    await userEvent.click(screen.getByTestId('add-specialist'));

    expect(await screen.findByTestId('specialist-error')).toHaveTextContent('Bu uzman çocuğa zaten bağlı.');
  });

  it('asks for an email before calling the API', async () => {
    const fetchMock = await openAs(USERS.parent);
    const callsBefore = fetchMock.mock.calls.length;

    await userEvent.click(screen.getByTestId('add-specialist'));

    expect(screen.getByTestId('specialist-error')).toHaveTextContent('Uzmanın e-posta adresini yazın.');
    expect(fetchMock.mock.calls.length).toBe(callsBefore);
  });

  it('unlinks only after confirmation (FR-M2-02, FR-M2-07)', async () => {
    const fetchMock = await openAs(USERS.parent);
    const deletes = () => fetchMock.mock.calls.filter(([, init]) => init?.method === 'DELETE');

    await userEvent.click(screen.getByRole('button', { name: 'Murat Psikolog bağlantısını kaldır' }));

    const dialog = screen.getByRole('alertdialog', { name: 'Uzman bağlantısı kaldırılsın mı?' });
    expect(dialog).toHaveTextContent('Murat Psikolog, Ege Örnek adlı çocuğun bilgilerine artık erişemeyecek.');
    expect(within(dialog).getByRole('button', { name: 'Vazgeç' })).toHaveFocus();
    expect(deletes()).toHaveLength(0);

    await userEvent.click(within(dialog).getByRole('button', { name: 'Kaldır' }));

    await waitFor(() => expect(rowNames()).toEqual(['Selin Öğretmen']));
    expect(deletes()[0][0]).toBe('/api/children/1/specialists/4');
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Murat Psikolog artık Ege Örnek için bağlı değil.');
  });

  it('keeps the link when the parent cancels or presses Escape', async () => {
    const fetchMock = await openAs(USERS.parent);

    await userEvent.click(screen.getByRole('button', { name: 'Murat Psikolog bağlantısını kaldır' }));
    await userEvent.click(screen.getByRole('button', { name: 'Vazgeç' }));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Murat Psikolog bağlantısını kaldır' }));
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();

    expect(fetchMock.mock.calls.some(([, init]) => init?.method === 'DELETE')).toBe(false);
    expect(rowNames()).toHaveLength(2);
  });

  it('shows a linked specialist the list without add or remove controls', async () => {
    await openAs(USERS.teacher);

    expect(rowNames()).toEqual(['Selin Öğretmen', 'Murat Psikolog']);
    expect(screen.getByText('Uzmanları sadece ebeveyn ekleyip kaldırabilir.')).toBeInTheDocument();
    expect(screen.queryByLabelText('Uzmanın e-posta adresi')).not.toBeInTheDocument();
    expect(screen.queryByTestId('remove-specialist')).not.toBeInTheDocument();
  });

  it('shows an empty list after the last specialist is removed', async () => {
    await openAs(USERS.parent);

    for (const name of ['Selin Öğretmen', 'Murat Psikolog']) {
      await userEvent.click(screen.getByRole('button', { name: `${name} bağlantısını kaldır` }));
      await userEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Kaldır' }));
      await waitFor(() => expect(screen.queryByText(name)).not.toBeInTheDocument());
    }

    expect(screen.getByText('Henüz bağlı uzman yok.')).toBeInTheDocument();
  });
});
