
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OutlineTimeline from '../../components/OutlineTimeline';

const mockOutline = {
  id: 'outline-1',
  projectId: 'project-1',
  title: 'Test Outline',
  totalScenes: 2,
  maxScenes: 100,
  structure: 'custom',
  parts: [
    {
      id: 'part-1',
      title: 'Part I',
      order: 0,
      chapters: [
        {
          id: 'chapter-1',
          title: 'Chapter 1',
          order: 0,
          scenes: [
            {
              id: 'scene-1',
              title: 'Opening Scene',
              order: 0,
              status: 'complete',
            },
            {
              id: 'scene-2',
              title: 'Second Scene',
              order: 1,
              status: 'draft',
            },
          ],
        },
      ],
    },
  ],
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('Timeline Component', () => {
  it('renders timeline with correct progress', () => {
    render(<OutlineTimeline outline={mockOutline} />);

    expect(screen.getByText('Story Timeline')).toBeInTheDocument();
    expect(screen.getByText('1/2 scenes')).toBeInTheDocument();
  });

  it('switches between view modes', async () => {
    const user = userEvent.setup();
    render(<OutlineTimeline outline={mockOutline} />);

    await user.click(screen.getByRole('button', { name: 'Grouped' }));
    expect(screen.getByText('Part I')).toBeInTheDocument();
  });
});
