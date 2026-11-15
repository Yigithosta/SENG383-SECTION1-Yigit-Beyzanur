
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import WeeklySchedule from './WeeklySchedule.jsx';
import { apiFetch } from '../api/client.js';

vi.mock('../api/client.js', () => ({
  apiFetch: vi.fn()
}));

vi.mock('../scheduleDates.js', async (importOriginal) => {
  const original = await importOriginal();

  return {
    ...original,
    getWeekMonday: vi.fn(() => '2026-11-16')
  };
});

describe('SCRUM-34 WeeklySchedule', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows events on the correct days in chronological order', async () => {
    apiFetch.mockResolvedValue([
      {
        id: 1,
        title: 'Afternoon lesson',
        startsAt: '2026-11-16T14:00',
        endsAt: '2026-11-16T15:00'
      },
      {
        id: 2,
        title: 'Morning lesson',
        startsAt: '2026-11-16T09:00',
        endsAt: '2026-11-16T10:00'
      },
      {
        id: 3,
        title: 'Psychology session',
        startsAt: '2026-11-18T11:00',
        endsAt: '2026-11-18T12:00'
      }
    ]);

    render(<WeeklySchedule childId={1} canCreate />);

    await waitFor(() => {
      expect(screen.getByText('Morning lesson')).toBeInTheDocument();
    });

    expect(apiFetch).toHaveBeenCalledWith(
      '/api/children/1/events?week=2026-11-16',
      expect.objectContaining({ signal: expect.anything() })
    );

    const days = screen.getAllByRole('region');
    const monday = days.find(day => day.textContent.includes('16 Kas'));
    const wednesday = days.find(day => day.textContent.includes('18 Kas'));

    expect(monday).toBeDefined();
    expect(wednesday).toBeDefined();

    expect(within(monday).getByText('Morning lesson')).toBeInTheDocument();
    expect(within(monday).getByText('Afternoon lesson')).toBeInTheDocument();
    expect(within(wednesday).getByText('Psychology session')).toBeInTheDocument();

    const mondayEvents = within(monday).getAllByRole('listitem');

    expect(mondayEvents[0]).toHaveTextContent('Morning lesson');
    expect(mondayEvents[1]).toHaveTextContent('Afternoon lesson');
  });

  it('hides the create-event form for a child', async () => {
    apiFetch.mockResolvedValue([]);

    render(<WeeklySchedule childId={1} canCreate={false} />);

    await waitFor(() => {
      expect(apiFetch).toHaveBeenCalled();
    });

    expect(screen.queryByText('Yeni Etkinlik Ekle')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Etkinlik Ekle' }))
      .not.toBeInTheDocument();
  });
});
