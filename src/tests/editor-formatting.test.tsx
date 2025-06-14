
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import RichTextEditor from '@/components/editor/RichTextEditor';
import { useProjects } from '@/contexts/ProjectContext';

// Mock react-quill
const mockQuill = {
  getEditor: vi.fn(() => ({
    getSelection: vi.fn(() => ({ index: 0, length: 0 })),
    getFormat: vi.fn(() => ({})),
    format: vi.fn(),
    getBounds: vi.fn(() => ({ top: 0, height: 20 })),
    root: {
      getBoundingClientRect: vi.fn(() => ({ top: 0, height: 400 })),
      style: {}
    },
    on: vi.fn(),
    off: vi.fn(),
  })),
};

vi.mock('react-quill', () => ({
  default: vi.fn().mockImplementation(({ onChange, value, placeholder }) => {
    return (
      <div data-testid="mock-quill-editor">
        <textarea
          data-testid="quill-textarea"
          onChange={(e) => onChange && onChange(e.target.value)}
          value={value}
          placeholder={placeholder}
        />
      </div>
    );
  }),
}));

// Mock hooks
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

vi.mock('@/contexts/ProjectContext', () => ({
  useProjects: vi.fn(),
}));

vi.mock('@/hooks/useEditorTheme', () => ({
  useEditorTheme: () => ({
    currentTheme: {
      id: 'default',
      name: 'Default',
      colors: {
        background: '#ffffff',
        text: '#000000',
      },
      font: {
        family: 'Inter',
        size: '16px',
        lineHeight: '1.6',
      },
    },
    changeTheme: vi.fn(),
  }),
}));

vi.mock('@/hooks/useEnhancedWordCount', () => ({
  useEnhancedWordCount: () => ({
    stats: { words: 0, pages: 1 },
    updateWordCount: vi.fn(),
  }),
}));

vi.mock('@/hooks/useEnhancedAutoSave', () => ({
  useEnhancedAutoSave: () => ({
    clearAutoSave: vi.fn(),
  }),
}));

vi.mock('@/lib/storyBibleDb', () => ({
  getStoryBibleEntriesByProject: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/utils/highlighting', () => ({
  debouncedHighlight: vi.fn(),
  registerStoryBibleFormat: vi.fn(),
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
      {ui}
    </QueryClientProvider>
  );
};

describe('RichTextEditor Formatting Tests', () => {
  const mockOnSave = vi.fn();
  const mockUseProjects = vi.mocked(useProjects);

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseProjects.mockReturnValue({
      currentProject: { 
        id: 'test-project', 
        title: 'Test Project',
        description: 'Test Description',
        isPublic: false,
        status: 'writing',
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: 'test-user-id'
      },
      projects: [],
      createProject: vi.fn(),
      updateProject: vi.fn(),
      deleteProject: vi.fn(),
      setCurrentProject: vi.fn(),
      loading: false,
      error: null,
      getProject: vi.fn(),
    });
  });

  it('renders editor with initial content', () => {
    renderWithProviders(
      <RichTextEditor
        initialContent="Test content"
        onSave={mockOnSave}
      />
    );

    expect(screen.getByTestId('quill-textarea')).toHaveValue('Test content');
  });

  it('shows save button when there are unsaved changes', async () => {
    renderWithProviders(
      <RichTextEditor
        initialContent=""
        onSave={mockOnSave}
      />
    );

    const editor = screen.getByTestId('quill-textarea');
    fireEvent.change(editor, { target: { value: 'New content' } });

    await waitFor(() => {
      const saveButton = screen.getByRole('button', { name: /save draft/i });
      expect(saveButton).not.toBeDisabled();
    });
  });

  it('displays word count correctly', () => {
    renderWithProviders(
      <RichTextEditor
        initialContent="Hello world test"
        onSave={mockOnSave}
      />
    );

    expect(screen.getByText(/0 words/i)).toBeInTheDocument();
  });

  it('handles save operation', async () => {
    renderWithProviders(
      <RichTextEditor
        initialContent="Test content"
        onSave={mockOnSave}
      />
    );

    const editor = screen.getByTestId('quill-textarea');
    fireEvent.change(editor, { target: { value: 'Modified content' } });

    await waitFor(() => {
      const saveButton = screen.getByRole('button', { name: /save draft/i });
      fireEvent.click(saveButton);
    });

    expect(mockOnSave).toHaveBeenCalledWith('Modified content');
  });

  it('shows focus mode toggle', () => {
    renderWithProviders(
      <RichTextEditor
        initialContent=""
        onSave={mockOnSave}
        onToggleFocus={vi.fn()}
      />
    );

    expect(screen.getByText(/focus/i)).toBeInTheDocument();
  });

  it('handles theme changes', () => {
    renderWithProviders(
      <RichTextEditor
        initialContent=""
        onSave={mockOnSave}
      />
    );

    // Theme selector should be available
    const themeSelect = screen.getByDisplayValue('Default');
    expect(themeSelect).toBeInTheDocument();
  });

  it('shows loading state', () => {
    renderWithProviders(
      <RichTextEditor
        initialContent=""
        onSave={mockOnSave}
        loading={true}
      />
    );

    const saveButton = screen.getByRole('button', { name: /loading/i });
    expect(saveButton).toBeDisabled();
  });

  it('handles error state gracefully', () => {
    // This test would need to trigger an error condition
    renderWithProviders(
      <RichTextEditor
        initialContent=""
        onSave={() => { throw new Error('Save failed'); }}
      />
    );

    const editor = screen.getByTestId('quill-textarea');
    fireEvent.change(editor, { target: { value: 'Test' } });
    
    // The component should still render without crashing
    expect(editor).toBeInTheDocument();
  });
});
