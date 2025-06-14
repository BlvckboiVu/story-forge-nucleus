
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import Editor from '@/pages/Editor';

// Mock all the dependencies
vi.mock('@/components/editor/RichTextEditor', () => ({
  default: ({ onSave, extraActions }: any) => (
    <div data-testid="rich-text-editor">
      <button onClick={() => onSave('test content')}>Save</button>
      {extraActions}
    </div>
  ),
}));

vi.mock('@/components/StoryBibleDrawer', () => ({
  StoryBibleDrawer: ({ projectId }: { projectId: string }) => (
    <div data-testid="story-bible-drawer">Story Bible for {projectId}</div>
  ),
}));

vi.mock('@/contexts/ProjectContext', () => ({
  useProjects: () => ({
    currentProject: { id: 'test-project', title: 'Test Project' },
    projects: [{ id: 'test-project', title: 'Test Project' }],
  }),
}));

vi.mock('@/utils/optimizedDb', () => ({
  useOptimizedDrafts: () => ({
    drafts: [{ id: 'draft-1', content: 'Test content', title: 'Test Draft' }],
    loading: false,
    error: null,
  }),
  OptimizedDraftService: {
    updateDraft: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('@/components/layout/Layout', () => ({
  Layout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="layout">{children}</div>
  ),
}));

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {ui}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Editor Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders editor with story bible integration', () => {
    renderWithProviders(<Editor />);

    expect(screen.getByTestId('rich-text-editor')).toBeInTheDocument();
    expect(screen.getByTestId('story-bible-drawer')).toBeInTheDocument();
    expect(screen.getByText('Story Bible for test-project')).toBeInTheDocument();
  });

  it('handles save operation', async () => {
    const { OptimizedDraftService } = await import('@/utils/optimizedDb');
    
    renderWithProviders(<Editor />);

    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(OptimizedDraftService.updateDraft).toHaveBeenCalled();
    });
  });

  it('renders layout correctly', () => {
    renderWithProviders(<Editor />);

    expect(screen.getByTestId('layout')).toBeInTheDocument();
  });

  it('passes project id to story bible drawer', () => {
    renderWithProviders(<Editor />);

    expect(screen.getByText('Story Bible for test-project')).toBeInTheDocument();
  });
});
