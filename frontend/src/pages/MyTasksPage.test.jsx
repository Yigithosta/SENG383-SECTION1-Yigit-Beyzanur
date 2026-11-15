import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MyTasksPage from './MyTasksPage.jsx';
import { apiFetch } from '../api/client.js';

vi.mock('../api/client.js', () => ({
  apiFetch: vi.fn(),
}));

const demoTasks = [
  {
    id: 1,
    title: 'Hikaye anlatma',
    description: 'Kısa bir hikaye anlat.',
    area: 'language',
    dueDate: '2026-11-16',
    status: 'pending',
    completedAt: null,
  },
  {
    id: 2,
    title: 'El yıkama',
    description: 'Ellerini sabunla yıka.',
    area: 'self_care',
    dueDate: '2026-11-17',
    status: 'completed',
    completedAt: '2026-11-14 10:30:00',
  },
];

describe('SCRUM-37 MyTasksPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows pending tasks before completed tasks', async () => {
    apiFetch.mockResolvedValue([demoTasks[1], demoTasks[0]]);

    render(<MyTasksPage childId={1} />);

    await screen.findByText('Hikaye anlatma');

    const items = screen.getAllByRole('listitem');

    expect(items[0]).toHaveTextContent('Hikaye anlatma');
    expect(items[0]).toHaveTextContent('Tamamladım');
    expect(items[1]).toHaveTextContent('El yıkama');
    expect(items[1]).toHaveTextContent('Tamamlandı');
  });

  it('sends PATCH and updates the task status when completed', async () => {
    const user = userEvent.setup();

    apiFetch.mockImplementation((path, options = {}) => {
      if (options.method === 'PATCH') {
        return Promise.resolve({
          ...demoTasks[0],
          status: 'completed',
          completedAt: '2026-11-14 15:00:00',
        });
      }

      return Promise.resolve([demoTasks[0]]);
    });

    render(<MyTasksPage childId={1} />);

    const button = await screen.findByRole('button', {
      name: 'Tamamladım',
    });

    await user.click(button);

    await waitFor(() => {
      expect(apiFetch).toHaveBeenCalledWith(
        '/api/children/1/tasks/1/complete',
        { method: 'PATCH' }
      );
    });

    const task = screen.getByText('Hikaye anlatma').closest('li');

    expect(within(task).getByText(/Tamamlandı/)).toBeInTheDocument();
    expect(within(task).queryByRole('button', {
      name: 'Tamamladım',
    })).not.toBeInTheDocument();
  });

  it('shows the backend error message if completion fails', async () => {
    const user = userEvent.setup();

    apiFetch.mockImplementation((_path, options = {}) => {
      if (options.method === 'PATCH') {
        return Promise.reject(new Error('Görev tamamlanamadı.'));
      }

      return Promise.resolve([demoTasks[0]]);
    });

    render(<MyTasksPage childId={1} />);

    await user.click(await screen.findByRole('button', {
      name: 'Tamamladım',
    }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Görev tamamlanamadı.'
    );
  });
});