
import { render } from '@testing-library/react';
import { screen, fireEvent, waitFor } from '@testing-library/dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Draft } from '@/lib/db';
import RichTextEditor from '@/components/editor/RichTextEditor';

// Mock react-quill
vi.mock('react-quill', () => ({
  default: vi.fn(({ onChange, value, placeholder }) => (
    <div>
      <textarea
        data-testid="mock-quill-editor"
        onChange={(e) => onChange && onChange(e.target.value)}
        value={value}
        placeholder={placeholder}
      />
    </div>
  )),
}));

// Mock the toast hook
vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

const mockDraft: Draft = {
  id: '1',
  projectId: 'project-1',
  title: 'Test Draft',
  content: 'Initial content',
  wordCount: 2,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('RichTextEditor', () => {
  const mockOnSave = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with initial content', () => {
    render(
      <RichTextEditor
        initialContent="Test content"
        onSave={mockOnSave}
        draft={mockDraft}
      />
    );

    expect(screen.getByTestId('mock-quill-editor')).toHaveValue('Test content');
  });

  it('calls onSave when save button is clicked', async () => {
    render(
      <RichTextEditor
        initialContent="Test content"
        onSave={mockOnSave}
        draft={mockDraft}
      />
    );

    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith('Test content');
    });
  });

  it('updates word count when content changes', async () => {
    render(
      <RichTextEditor
        initialContent=""
        onSave={mockOnSave}
        draft={mockDraft}
      />
    );

    const editor = screen.getByTestId('mock-quill-editor');
    fireEvent.change(editor, { target: { value: 'Hello world test' } });

    await waitFor(() => {
      expect(screen.getByText(/3 words/i)).toBeInTheDocument();
    });
  });
});
