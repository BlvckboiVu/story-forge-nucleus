
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Outline from '../../components/Outline';
import { EnhancedOutlineService } from '../../utils/outlineDb';

vi.mock('../../utils/outlineDb');
vi.mock('../../utils/optimizedOpenRouter');
vi.mock('../../hooks/use-toast');
vi.mock('@dnd-kit/core');
vi.mock('@dnd-kit/sortable');

const mockOutline = {
  id: 'outline-1',
  projectId: 'project-1',
  title: 'Test Outline',
  totalScenes: 3,
  maxScenes: 100,
  structure: 'custom',
  parts: [
    {
      id: 'part-1',
      title: 'Part I',
      summary: 'Beginning',
      order: 0,
      chapters: [
        {
          id: 'chapter-1',
          title: 'Chapter 1',
          summary: 'Opening',
          order: 0,
          scenes: [
            {
              id: 'scene-1',
              title: 'Scene 1',
              summary: 'Opening scene',
              order: 0,
              status: 'planned',
            },
          ],
        },
      ],
    },
  ],
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('Outline Component', () => {
  beforeEach(() => {
    EnhancedOutlineService.getProjectOutlines.mockResolvedValue([mockOutline]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders outline structure correctly', async () => {
    render(<Outline projectId="project-1" />);

    await waitFor(() => {
      expect(screen.getByText('Story Outline')).toBeInTheDocument();
    });

    expect(screen.getByText('Part I')).toBeInTheDocument();
    expect(screen.getByText('3/100 scenes')).toBeInTheDocument();
  });

  it('handles scene selection correctly', async () => {
    const mockOnSceneSelect = vi.fn();
    const user = userEvent.setup();
    
    render(<Outline projectId="project-1" onSceneSelect={mockOnSceneSelect} />);

    await waitFor(() => {
      expect(screen.getByText('Scene 1')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Scene 1'));

    expect(mockOnSceneSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'scene-1',
        title: 'Scene 1',
      }),
      'Chapter 1',
      'Part I'
    );
  });
});
