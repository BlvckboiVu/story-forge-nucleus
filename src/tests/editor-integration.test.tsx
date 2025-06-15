
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Editor from '@/pages/Editor';
import { DraftService } from '@/services/draftService';

// Mock the router
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useParams: () => ({ projectId: 'test-project' }),
  useSearchParams: () => [new URLSearchParams(), vi.fn()],
}));

// Mock the contexts
vi.mock('@/contexts/ProjectContext', () => ({
  useProjects: () => ({
    projects: [{ id: 'test-project', title: 'Test Project' }],
    currentProject: { id: 'test-project', title: 'Test Project' },
    setCurrentProject: vi.fn(),
  }),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user', email: 'test@example.com' },
  }),
}));

// Mock the DraftService
vi.mock('@/services/draftService', () => ({
  DraftService: {
    getDraftsByProject: vi.fn(),
    createDraft: vi.fn(),
    updateDraft: vi.fn(),
    getDraft: vi.fn(),
  },
}));

// Mock other hooks
vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => false,
}));

vi.mock('@/hooks/use-focus-mode', () => ({
  useFocusMode: () => ({
    isFocusMode: false,
    isPanelCollapsed: false,
    toggleFocusMode: vi.fn(),
    togglePanel: vi.fn(),
  }),
}));

describe('Editor Integration', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const renderEditor = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <Editor />
      </QueryClientProvider>
    );
  };

  it('renders editor with project context', async () => {
    vi.mocked(DraftService.getDraftsByProject).mockResolvedValue([]);
    
    renderEditor();
    
    await waitFor(() => {
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });
  });

  it('handles draft creation', async () => {
    const mockDraft = {
      id: 'new-draft',
      title: 'New Draft',
      content: '',
      projectId: 'test-project',
      wordCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(DraftService.createDraft).mockResolvedValue('new-draft');
    vi.mocked(DraftService.getDraft).mockResolvedValue(mockDraft);
    vi.mocked(DraftService.getDraftsByProject).mockResolvedValue([mockDraft]);

    renderEditor();

    await waitFor(() => {
      expect(DraftService.getDraftsByProject).toHaveBeenCalledWith('test-project');
    });
  });

  it('handles auto-save functionality', async () => {
    const mockDraft = {
      id: 'test-draft',
      title: 'Test Draft',
      content: 'Test content',
      projectId: 'test-project',
      wordCount: 2,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(DraftService.getDraft).mockResolvedValue(mockDraft);
    vi.mocked(DraftService.updateDraft).mockResolvedValue();

    renderEditor();

    await waitFor(() => {
      expect(DraftService.getDraftsByProject).toHaveBeenCalled();
    });
  });
});
