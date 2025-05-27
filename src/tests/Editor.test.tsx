
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import RichTextEditor from '../components/editor/RichTextEditor';
import { useDarkMode } from '../hooks/useDarkMode';
import { DarkModeToggle } from '../components/ui/DarkModeToggle';

// Mock dependencies
vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

vi.mock('react-quill', () => ({
  default: vi.fn(({ onChange, value, placeholder }) => (
    <div data-testid="quill-editor">
      <textarea
        data-testid="editor-content"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  )),
}));

vi.mock('../hooks/useDarkMode');

describe('RichTextEditor', () => {
  const mockOnSave = vi.fn();
  const mockToast = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders editor with initial content', () => {
    render(
      <RichTextEditor
        initialContent="Test content"
        onSave={mockOnSave}
      />
    );

    expect(screen.getByDisplayValue('Test content')).toBeInTheDocument();
    expect(screen.getByText('2 words | Page 1')).toBeInTheDocument();
  });

  it('updates word count when content changes', async () => {
    render(
      <RichTextEditor
        initialContent=""
        onSave={mockOnSave}
      />
    );

    const editor = screen.getByTestId('editor-content');
    fireEvent.change(editor, { target: { value: 'Hello world test content' } });

    await waitFor(() => {
      expect(screen.getByText('4 words | Page 1')).toBeInTheDocument();
    });
  });

  it('shows unsaved changes indicator', async () => {
    render(
      <RichTextEditor
        initialContent=""
        onSave={mockOnSave}
      />
    );

    const editor = screen.getByTestId('editor-content');
    fireEvent.change(editor, { target: { value: 'New content' } });

    await waitFor(() => {
      expect(screen.getByText('• Unsaved changes')).toBeInTheDocument();
    });
  });

  it('calls onSave when save button is clicked', () => {
    render(
      <RichTextEditor
        initialContent="Test content"
        onSave={mockOnSave}
      />
    );

    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);

    expect(mockOnSave).toHaveBeenCalledWith('Test content');
  });

  it('shows word limit warning near 50000 words', async () => {
    const longContent = 'word '.repeat(45000); // 45000 words (90% of limit)
    
    render(
      <RichTextEditor
        initialContent=""
        onSave={mockOnSave}
      />
    );

    const editor = screen.getByTestId('editor-content');
    fireEvent.change(editor, { target: { value: longContent } });

    await waitFor(() => {
      const wordCountElement = screen.getByText(/45,000 words/);
      expect(wordCountElement).toHaveClass('text-yellow-600');
    });
  });

  it('shows word limit exceeded at 50000+ words', async () => {
    const longContent = 'word '.repeat(50001); // Over limit
    
    render(
      <RichTextEditor
        initialContent=""
        onSave={mockOnSave}
      />
    );

    const editor = screen.getByTestId('editor-content');
    fireEvent.change(editor, { target: { value: longContent } });

    await waitFor(() => {
      const wordCountElement = screen.getByText(/50,001 words/);
      expect(wordCountElement).toHaveClass('text-red-600');
      expect(screen.getByText('(Limit: 50,000)')).toBeInTheDocument();
    });
  });
});

describe('DarkModeToggle', () => {
  const mockToggleDarkMode = vi.fn();

  beforeEach(() => {
    vi.mocked(useDarkMode).mockReturnValue({
      isDarkMode: false,
      toggleDarkMode: mockToggleDarkMode,
    });
  });

  it('renders sun icon in light mode', () => {
    render(<DarkModeToggle />);
    
    expect(screen.getByRole('button', { name: /switch to dark mode/i })).toBeInTheDocument();
  });

  it('renders moon icon in dark mode', () => {
    vi.mocked(useDarkMode).mockReturnValue({
      isDarkMode: true,
      toggleDarkMode: mockToggleDarkMode,
    });

    render(<DarkModeToggle />);
    
    expect(screen.getByRole('button', { name: /switch to light mode/i })).toBeInTheDocument();
  });

  it('calls toggleDarkMode when clicked', () => {
    render(<DarkModeToggle />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(mockToggleDarkMode).toHaveBeenCalled();
  });
});
