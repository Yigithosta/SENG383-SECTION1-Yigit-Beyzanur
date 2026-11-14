import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AssignTaskForm from './AssignTaskForm.jsx';
import AssignedTasksList from './AssignedTasksList.jsx';
import { apiFetch } from '../api/client.js';

vi.mock('../api/client.js', () => ({
  apiFetch: vi.fn(),
}));

describe('SCRUM-36 Assigned Tasks UI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows a validation warning when title and description are empty', async () => {
    const user = userEvent.setup();

    render(<AssignTaskForm childId={1} onCreated={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Görev Ata' }));

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Başlık ve açıklama zorunludur.'
    );
    expect(apiFetch).not.toHaveBeenCalled();
  });

  it('shows pending and completed tasks with their details', async () => {
    apiFetch.mockResolvedValue([
      {
        id: 1,
        title: 'Hikaye anlatma',
        area: 'language',
        dueDate: '2026-11-16',
        status: 'pending',
        completedAt: null,
        assignedBy: { id: 1, name: 'Deniz Örnek' },
      },
      {
        id: 2,
        title: 'El yıkama',
        area: 'self_care',
        dueDate: '2026-11-20',
        status: 'completed',
        completedAt: '2026-11-14 10:30:00',
        assignedBy: { id: 3, name: 'Selin Öğretmen' },
      },
    ]);

    render(<AssignedTasksList childId={1} />);

    await waitFor(() => {
      expect(screen.getByText('Hikaye anlatma')).toBeInTheDocument();
    });

    expect(apiFetch).toHaveBeenCalledWith(
      '/api/children/1/tasks',
      expect.objectContaining({ signal: expect.anything() })
    );

    const pendingTask = screen.getByText('Hikaye anlatma').closest('li');
    const completedTask = screen.getByText('El yıkama').closest('li');

    expect(within(pendingTask).getByText('Dil')).toBeInTheDocument();
    expect(pendingTask).toHaveTextContent('Deniz Örnek');
    expect(pendingTask).toHaveTextContent('Bekliyor');

    expect(within(completedTask).getByText('Öz bakım')).toBeInTheDocument();
    expect(completedTask).toHaveTextContent('Selin Öğretmen');
    expect(completedTask).toHaveTextContent('Tamamlandı');
    expect(completedTask).toHaveTextContent('14 Kasım 2026');
  });

  it('shows the API error message', async () => {
    apiFetch.mockRejectedValue(new Error('Görevler yüklenemedi.'));

    render(<AssignedTasksList childId={1} />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Görevler yüklenemedi.'
    );
  });
});