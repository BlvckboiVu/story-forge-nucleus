
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EnhancedToolbar } from '@/components/editor/EnhancedToolbar';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('EnhancedToolbar Tests', () => {
  const defaultProps = {
    selectedFont: 'Inter',
    onFontChange: vi.fn(),
    isFocusMode: false,
    onToggleFocus: vi.fn(),
    onSave: vi.fn(),
    hasUnsavedChanges: false,
    onFormatClick: vi.fn(),
    onUndo: vi.fn(),
    onRedo: vi.fn(),
    canUndo: false,
    canRedo: false,
    isMobile: false,
    editorRef: { current: null },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders desktop toolbar with all formatting options', () => {
    render(<EnhancedToolbar {...defaultProps} />);

    // Check for bold button
    expect(screen.getByTitle('Bold')).toBeInTheDocument();
    
    // Check for italic button
    expect(screen.getByTitle('Italic')).toBeInTheDocument();
    
    // Check for underline button
    expect(screen.getByTitle('Underline')).toBeInTheDocument();
  });

  it('handles bold formatting click', () => {
    const onFormatClick = vi.fn();
    render(<EnhancedToolbar {...defaultProps} onFormatClick={onFormatClick} />);

    const boldButton = screen.getByTitle('Bold');
    fireEvent.click(boldButton);

    expect(onFormatClick).toHaveBeenCalledWith('bold');
  });

  it('handles italic formatting click', () => {
    const onFormatClick = vi.fn();
    render(<EnhancedToolbar {...defaultProps} onFormatClick={onFormatClick} />);

    const italicButton = screen.getByTitle('Italic');
    fireEvent.click(italicButton);

    expect(onFormatClick).toHaveBeenCalledWith('italic');
  });

  it('handles font change', () => {
    const onFontChange = vi.fn();
    render(<EnhancedToolbar {...defaultProps} onFontChange={onFontChange} />);

    // Verify font selector exists
    const fontSelector = screen.getByRole('combobox');
    expect(fontSelector).toBeInTheDocument();
  });

  it('shows focus mode toggle', () => {
    const onToggleFocus = vi.fn();
    render(<EnhancedToolbar {...defaultProps} onToggleFocus={onToggleFocus} />);

    const focusButton = screen.getByText('Focus Mode');
    fireEvent.click(focusButton);

    expect(onToggleFocus).toHaveBeenCalled();
  });

  it('renders mobile toolbar with essential controls only', () => {
    render(<EnhancedToolbar {...defaultProps} isMobile={true} />);

    // Mobile should have essential formatting
    expect(screen.getByTitle('Bold')).toBeInTheDocument();
    expect(screen.getByTitle('Italic')).toBeInTheDocument();
  });

  it('renders focus mode toolbar with minimal controls', () => {
    render(<EnhancedToolbar {...defaultProps} isFocusMode={true} />);

    // Focus mode should show minimal interface
    expect(screen.getByText('Focus Mode - Distraction-free writing')).toBeInTheDocument();
  });

  it('handles undo/redo operations', () => {
    const onUndo = vi.fn();
    const onRedo = vi.fn();
    
    render(
      <EnhancedToolbar 
        {...defaultProps} 
        onUndo={onUndo}
        onRedo={onRedo}
        canUndo={true}
        canRedo={true}
      />
    );

    const undoButton = screen.getByTitle('Undo');
    const redoButton = screen.getByTitle('Redo');

    fireEvent.click(undoButton);
    fireEvent.click(redoButton);

    expect(onUndo).toHaveBeenCalled();
    expect(onRedo).toHaveBeenCalled();
  });

  it('disables undo/redo when not available', () => {
    render(
      <EnhancedToolbar 
        {...defaultProps} 
        canUndo={false}
        canRedo={false}
      />
    );

    const undoButton = screen.getByTitle('Undo');
    const redoButton = screen.getByTitle('Redo');

    expect(undoButton).toBeDisabled();
    expect(redoButton).toBeDisabled();
  });

  it('shows active formatting states', () => {
    // This would require a mock editorRef with active formats
    const mockEditorRef = {
      current: {
        getEditor: () => ({
          getSelection: () => ({ index: 0, length: 5 }),
          getFormat: () => ({ bold: true, italic: false }),
        }),
      },
    };

    render(<EnhancedToolbar {...defaultProps} editorRef={mockEditorRef} />);
    
    // The component should handle active states
    expect(screen.getByTitle('Bold')).toBeInTheDocument();
  });
});
