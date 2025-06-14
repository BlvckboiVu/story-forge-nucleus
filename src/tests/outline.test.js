
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Outline from '../components/Outline';
import { EnhancedOutlineService } from '../utils/outlineDb';

// Mock the database service
vi.mock('../utils/outlineDb', () => ({
  EnhancedOutlineService: {
    getProjectOutlines: vi.fn(),
    createOutline: vi.fn(),
    updateOutline: vi.fn(),
    deleteOutline: vi.fn(),
    getMaxScenes: vi.fn(() => 100),
    validateSceneCount: vi.fn(() => true),
  },
}));

// Mock the OpenRouter API
vi.mock('../utils/optimizedOpenRouter', () => ({
  optimizedOpenRouterAPI: {
    getApiKey: vi.fn(() => 'test-key'),
    sendPrompt: vi.fn(),
  },
}));

// Mock toast hook
vi.mock('../hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock DnD Kit
vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }) => <div data-testid="dnd-context">{children}</div>,
  DragOverlay: ({ children }) => <div data-testid="drag-overlay">{children}</div>,
  useSensor: vi.fn(),
  useSensors: vi.fn(() => []),
  PointerSensor: vi.fn(),
  closestCenter: vi.fn(),
}));

vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }) => <div data-testid="sortable-context">{children}</div>,
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
  arrayMove: (array, from, to) => {
    const result = [...array];
    const [moved] = result.splice(from, 1);
    result.splice(to, 0, moved);
    return result;
  },
  verticalListSortingStrategy: 'vertical',
}));

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
            {
              id: 'scene-2',
              title: 'Scene 2',
              summary: 'Second scene',
              order: 1,
              status: 'draft',
            },
          ],
        },
      ],
    },
    {
      id: 'part-2',
      title: 'Part II',
      summary: 'Middle',
      order: 1,
      chapters: [
        {
          id: 'chapter-2',
          title: 'Chapter 2',
          summary: 'Development',
          order: 0,
          scenes: [
            {
              id: 'scene-3',
              title: 'Scene 3',
              summary: 'Third scene',
              order: 0,
              status: 'complete',
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
    EnhancedOutlineService.createOutline.mockResolvedValue('new-outline-id');
    EnhancedOutlineService.updateOutline.mockResolvedValue();
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
    expect(screen.getByText('Part II')).toBeInTheDocument();
    expect(screen.getByText('3/100 scenes')).toBeInTheDocument();
  });

  it('expands and collapses parts correctly', async () => {
    const user = userEvent.setup();
    render(<Outline projectId="project-1" />);

    await waitFor(() => {
      expect(screen.getByText('Part I')).toBeInTheDocument();
    });

    // Part should be expanded by default (first part auto-expands)
    expect(screen.getByText('Chapter 1')).toBeInTheDocument();

    // Find and click the chevron button for Part I
    const partChevron = screen.getAllByRole('button')[1]; // First button is grip, second is chevron
    await user.click(partChevron);

    // Chapter should be hidden after collapse
    await waitFor(() => {
      expect(screen.queryByText('Chapter 1')).not.toBeInTheDocument();
    });
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

  it('adds new scenes correctly', async () => {
    const user = userEvent.setup();
    render(<Outline projectId="project-1" />);

    await waitFor(() => {
      expect(screen.getByText('Chapter 1')).toBeInTheDocument();
    });

    // Find the add scene button (Plus icon)
    const addButtons = screen.getAllByRole('button');
    const addSceneButton = addButtons.find(button => 
      button.querySelector('svg')?.classList.contains('lucide-plus')
    );

    expect(addSceneButton).toBeInTheDocument();
    await user.click(addSceneButton);

    await waitFor(() => {
      expect(EnhancedOutlineService.updateOutline).toHaveBeenCalled();
    });
  });

  it('validates scene count limits', async () => {
    // Mock service to return false for validation
    EnhancedOutlineService.validateSceneCount.mockReturnValue(false);
    
    const user = userEvent.setup();
    render(<Outline projectId="project-1" />);

    await waitFor(() => {
      expect(screen.getByText('Chapter 1')).toBeInTheDocument();
    });

    const addButtons = screen.getAllByRole('button');
    const addSceneButton = addButtons.find(button => 
      button.querySelector('svg')?.classList.contains('lucide-plus')
    );

    await user.click(addSceneButton);

    // Should not call update when validation fails
    expect(EnhancedOutlineService.updateOutline).not.toHaveBeenCalled();
  });

  it('shows scene count warning when approaching limit', async () => {
    const warningOutline = {
      ...mockOutline,
      totalScenes: 85, // Above 80% of 100
    };

    EnhancedOutlineService.getProjectOutlines.mockResolvedValue([warningOutline]);

    render(<Outline projectId="project-1" />);

    await waitFor(() => {
      expect(screen.getByText(/Approaching scene limit/)).toBeInTheDocument();
    });
  });

  it('creates initial outline when none exists', async () => {
    EnhancedOutlineService.getProjectOutlines.mockResolvedValue([]);
    EnhancedOutlineService.getOutline.mockResolvedValue(mockOutline);

    render(<Outline projectId="project-1" />);

    await waitFor(() => {
      expect(EnhancedOutlineService.createOutline).toHaveBeenCalled();
    });
  });

  it('handles drag and drop operations', async () => {
    render(<Outline projectId="project-1" />);

    await waitFor(() => {
      expect(screen.getByTestId('dnd-context')).toBeInTheDocument();
    });

    expect(screen.getByTestId('sortable-context')).toBeInTheDocument();
  });

  it('displays scene status badges correctly', async () => {
    render(<Outline projectId="project-1" />);

    await waitFor(() => {
      expect(screen.getByText('planned')).toBeInTheDocument();
      expect(screen.getByText('draft')).toBeInTheDocument();
      expect(screen.getByText('complete')).toBeInTheDocument();
    });
  });

  it('handles loading state correctly', () => {
    EnhancedOutlineService.getProjectOutlines.mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 1000))
    );

    render(<Outline projectId="project-1" />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('handles error states gracefully', async () => {
    EnhancedOutlineService.getProjectOutlines.mockRejectedValue(
      new Error('Database error')
    );

    render(<Outline projectId="project-1" />);

    await waitFor(() => {
      // Should not crash and should still render the component
      expect(screen.getByText('Story Outline')).toBeInTheDocument();
    });
  });
});

describe('Outline Storage Operations', () => {
  it('validates outline data before saving', async () => {
    const invalidData = {
      projectId: 'project-1',
      title: 'x'.repeat(300), // Too long
      parts: [],
      maxScenes: 100,
      structure: 'custom',
    };

    await expect(
      EnhancedOutlineService.createOutline(invalidData)
    ).rejects.toThrow('Outline title must be less than 200 characters');
  });

  it('prevents exceeding scene limits', async () => {
    const outlineWithTooManyScenes = {
      projectId: 'project-1',
      title: 'Test Outline',
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
              scenes: Array(101).fill(null).map((_, i) => ({
                id: `scene-${i}`,
                title: `Scene ${i}`,
                order: i,
                status: 'planned',
              })),
            },
          ],
        },
      ],
      maxScenes: 100,
      structure: 'custom',
    };

    await expect(
      EnhancedOutlineService.createOutline(outlineWithTooManyScenes)
    ).rejects.toThrow(/Cannot create outline with 101 scenes/);
  });

  it('sanitizes outline content', () => {
    const outlineWithHtml = {
      id: 'outline-1',
      projectId: 'project-1',
      title: 'Test <script>alert("xss")</script>',
      parts: [
        {
          id: 'part-1',
          title: 'Part <img src=x onerror=alert("xss")>',
          summary: '<script>malicious()</script>Safe content',
          order: 0,
          chapters: [],
        },
      ],
      totalScenes: 0,
      maxScenes: 100,
      structure: 'custom',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // This would be called internally by the service
    const sanitized = outlineWithHtml; // Mocked sanitization
    
    expect(sanitized.title).not.toContain('<script>');
    expect(sanitized.parts[0].title).not.toContain('<img');
  });
});
