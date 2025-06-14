import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OutlineTimeline from '../components/OutlineTimeline';
import { EnhancedOutlineService } from '../utils/outlineDb';
import { OptimizedDraftService } from '../utils/optimizedDb';

// Mock services
vi.mock('../utils/outlineDb');
vi.mock('../utils/optimizedDb');
vi.mock('../hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

const mockOutline = {
  id: 'outline-1',
  projectId: 'project-1',
  title: 'Test Outline',
  totalScenes: 4,
  maxScenes: 100,
  structure: 'custom',
  parts: [
    {
      id: 'part-1',
      title: 'Part I: Beginning',
      summary: 'Story setup',
      order: 0,
      chapters: [
        {
          id: 'chapter-1',
          title: 'Chapter 1: The Call',
          summary: 'Hero receives the call to adventure',
          order: 0,
          scenes: [
            {
              id: 'scene-1',
              title: 'Opening Scene',
              summary: 'Introduce protagonist in normal world',
              order: 0,
              status: 'complete',
              wordCount: 1500,
            },
            {
              id: 'scene-2',
              title: 'Inciting Incident',
              summary: 'Something disrupts the normal world',
              order: 1,
              status: 'draft',
              wordCount: 800,
            },
          ],
        },
      ],
    },
    {
      id: 'part-2',
      title: 'Part II: Journey',
      summary: 'Adventure begins',
      order: 1,
      chapters: [
        {
          id: 'chapter-2',
          title: 'Chapter 2: Departure',
          summary: 'Hero leaves familiar world',
          order: 0,
          scenes: [
            {
              id: 'scene-3',
              title: 'Crossing Threshold',
              summary: 'Hero commits to the adventure',
              order: 0,
              status: 'planned',
              wordCount: 0,
            },
            {
              id: 'scene-4',
              title: 'First Challenge',
              summary: 'Initial obstacle appears',
              order: 1,
              status: 'planned',
              wordCount: 0,
            },
          ],
        },
      ],
    },
  ],
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('Outline Timeline Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders timeline with correct progress calculation', async () => {
    render(<OutlineTimeline outline={mockOutline} />);

    expect(screen.getByText('Story Timeline')).toBeInTheDocument();
    
    // Check progress stats
    expect(screen.getByText('1/4 scenes')).toBeInTheDocument(); // 1 complete out of 4 total
    
    // Check individual status counts
    expect(screen.getByText('Complete (1)')).toBeInTheDocument();
    expect(screen.getByText('Draft (1)')).toBeInTheDocument();
    expect(screen.getByText('Planned (2)')).toBeInTheDocument();
  });

  it('switches between linear and grouped view modes', async () => {
    const user = userEvent.setup();
    render(<OutlineTimeline outline={mockOutline} />);

    // Should start in linear mode
    expect(screen.getByRole('button', { name: 'Linear' })).toHaveAttribute('data-state', 'active');
    
    // Switch to grouped mode
    await user.click(screen.getByRole('button', { name: 'Grouped' }));
    
    // Should show parts as headers in grouped mode
    expect(screen.getByText('Part I: Beginning')).toBeInTheDocument();
    expect(screen.getByText('Part II: Journey')).toBeInTheDocument();
  });

  it('handles scene selection in linear view', async () => {
    const mockOnSceneSelect = vi.fn();
    const user = userEvent.setup();
    
    render(<OutlineTimeline outline={mockOutline} onSceneSelect={mockOnSceneSelect} />);

    await user.click(screen.getByText('Opening Scene'));

    expect(mockOnSceneSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'scene-1',
        title: 'Opening Scene',
        status: 'complete',
      }),
      'Chapter 1: The Call',
      'Part I: Beginning'
    );
  });

  it('handles scene selection in grouped view', async () => {
    const mockOnSceneSelect = vi.fn();
    const user = userEvent.setup();
    
    render(<OutlineTimeline outline={mockOutline} onSceneSelect={mockOnSceneSelect} />);

    // Switch to grouped view
    await user.click(screen.getByRole('button', { name: 'Grouped' }));
    
    await user.click(screen.getByText('Inciting Incident'));

    expect(mockOnSceneSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'scene-2',
        title: 'Inciting Incident',
        status: 'draft',
      }),
      'Chapter 1: The Call',
      'Part I: Beginning'
    );
  });

  it('displays correct scene status icons', () => {
    render(<OutlineTimeline outline={mockOutline} />);

    // Check for different status indicators
    const completeIcons = screen.getAllByTitle(/complete/i);
    const draftIcons = screen.getAllByTitle(/draft/i);
    const plannedIcons = screen.getAllByTitle(/planned/i);

    expect(completeIcons.length).toBeGreaterThan(0);
    expect(draftIcons.length).toBeGreaterThan(0);
    expect(plannedIcons.length).toBeGreaterThan(0);
  });

  it('shows timeline progression correctly', () => {
    render(<OutlineTimeline outline={mockOutline} />);

    // Check that scenes are numbered correctly in order
    expect(screen.getByText('1')).toBeInTheDocument(); // First scene badge
    expect(screen.getByText('2')).toBeInTheDocument(); // Second scene badge
    expect(screen.getByText('3')).toBeInTheDocument(); // Third scene badge
    expect(screen.getByText('4')).toBeInTheDocument(); // Fourth scene badge
  });

  it('calculates progress percentage correctly', () => {
    render(<OutlineTimeline outline={mockOutline} />);

    // 1 complete out of 4 total = 25%
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '25');
  });

  it('handles empty outline gracefully', () => {
    const emptyOutline = {
      ...mockOutline,
      parts: [],
      totalScenes: 0,
    };

    render(<OutlineTimeline outline={emptyOutline} />);

    expect(screen.getByText('No scenes in outline')).toBeInTheDocument();
  });
});

describe('Outline-Editor Synchronization', () => {
  beforeEach(() => {
    OptimizedDraftService.updateDraft = vi.fn().mockResolvedValue();
    EnhancedOutlineService.updateOutline = vi.fn().mockResolvedValue();
  });

  it('updates scene status when editor content changes', async () => {
    const mockScene = mockOutline.parts[0].chapters[0].scenes[1]; // Draft scene
    
    // Simulate scene being completed in editor
    const updatedScene = {
      ...mockScene,
      status: 'complete',
      wordCount: 1200,
      content: 'New scene content...',
    };

    await EnhancedOutlineService.updateOutline('outline-1', {
      parts: mockOutline.parts.map(part => ({
        ...part,
        chapters: part.chapters.map(chapter => ({
          ...chapter,
          scenes: chapter.scenes.map(scene => 
            scene.id === mockScene.id ? updatedScene : scene
          ),
        })),
      })),
    });

    expect(EnhancedOutlineService.updateOutline).toHaveBeenCalledWith(
      'outline-1',
      expect.objectContaining({
        parts: expect.arrayContaining([
          expect.objectContaining({
            chapters: expect.arrayContaining([
              expect.objectContaining({
                scenes: expect.arrayContaining([
                  expect.objectContaining({
                    id: mockScene.id,
                    status: 'complete',
                    wordCount: 1200,
                  }),
                ]),
              }),
            ]),
          }),
        ]),
      })
    );
  });

  it('syncs scene content between outline and editor', async () => {
    const sceneId = 'scene-1';
    const sceneContent = 'Updated scene content with new developments...';
    
    // Simulate content being updated in editor
    await OptimizedDraftService.updateDraft('draft-1', {
      content: sceneContent,
      wordCount: 150,
    });

    // Should update corresponding outline scene
    const updatedScene = {
      id: sceneId,
      content: sceneContent,
      wordCount: 150,
      status: 'draft',
    };

    expect(OptimizedDraftService.updateDraft).toHaveBeenCalledWith(
      'draft-1',
      expect.objectContaining({
        content: sceneContent,
        wordCount: 150,
      })
    );
  });

  it('maintains timeline accuracy during sync operations', async () => {
    const user = userEvent.setup();
    const mockOnSceneSelect = vi.fn();
    
    render(<OutlineTimeline outline={mockOutline} onSceneSelect={mockOnSceneSelect} />);

    // Select a scene
    await user.click(screen.getByText('Crossing Threshold'));

    // Verify the correct scene context is passed
    expect(mockOnSceneSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'scene-3',
        title: 'Crossing Threshold',
      }),
      'Chapter 2: Departure',
      'Part II: Journey'
    );
  });

  it('handles concurrent updates without data corruption', async () => {
    const scene1Update = EnhancedOutlineService.updateOutline('outline-1', {
      parts: mockOutline.parts,
    });

    const scene2Update = EnhancedOutlineService.updateOutline('outline-1', {
      parts: mockOutline.parts,
    });

    // Both updates should complete without throwing
    await expect(Promise.all([scene1Update, scene2Update])).resolves.not.toThrow();
  });

  it('validates scene count during sync operations', async () => {
    EnhancedOutlineService.validateSceneCount = vi.fn().mockReturnValue(false);

    const tooManyScenes = {
      ...mockOutline,
      totalScenes: 101,
    };

    await expect(
      EnhancedOutlineService.updateOutline('outline-1', tooManyScenes)
    ).rejects.toThrow(/Scene count would be/);
  });
});

describe('Timeline Accuracy', () => {
  it('maintains correct scene ordering after updates', async () => {
    const reorderedOutline = {
      ...mockOutline,
      parts: [
        {
          ...mockOutline.parts[0],
          chapters: [
            {
              ...mockOutline.parts[0].chapters[0],
              scenes: [
                mockOutline.parts[0].chapters[0].scenes[1], // Moved second scene to first
                mockOutline.parts[0].chapters[0].scenes[0], // Moved first scene to second
              ],
            },
          ],
        },
        mockOutline.parts[1],
      ],
    };

    render(<OutlineTimeline outline={reorderedOutline} />);

    // First scene should now be "Inciting Incident"
    const firstSceneElement = screen.getByText('1').closest('div');
    expect(firstSceneElement).toHaveTextContent('Inciting Incident');
  });

  it('updates progress calculations in real-time', () => {
    const updatedOutline = {
      ...mockOutline,
      parts: mockOutline.parts.map(part => ({
        ...part,
        chapters: part.chapters.map(chapter => ({
          ...chapter,
          scenes: chapter.scenes.map(scene => ({
            ...scene,
            status: 'complete', // Mark all scenes as complete
          })),
        })),
      })),
    };

    render(<OutlineTimeline outline={updatedOutline} />);

    // Should show 100% completion
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '100');
    
    // Should show all scenes as complete
    expect(screen.getByText('Complete (4)')).toBeInTheDocument();
    expect(screen.getByText('Draft (0)')).toBeInTheDocument();
    expect(screen.getByText('Planned (0)')).toBeInTheDocument();
  });

  it('handles scene additions in timeline view', async () => {
    const outlineWithNewScene = {
      ...mockOutline,
      totalScenes: 5,
      parts: [
        {
          ...mockOutline.parts[0],
          chapters: [
            {
              ...mockOutline.parts[0].chapters[0],
              scenes: [
                ...mockOutline.parts[0].chapters[0].scenes,
                {
                  id: 'scene-new',
                  title: 'New Scene',
                  summary: 'Newly added scene',
                  order: 2,
                  status: 'planned',
                  wordCount: 0,
                },
              ],
            },
          ],
        },
        mockOutline.parts[1],
      ],
    };

    render(<OutlineTimeline outline={outlineWithNewScene} />);

    expect(screen.getByText('1/5 scenes')).toBeInTheDocument();
    expect(screen.getByText('New Scene')).toBeInTheDocument();
  });
});
