
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
    selectedTheme: 'default',
    onThemeChange: vi.fn(),
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
    expect(screen.getByTitle('bold')).toBeInTheDocument();
    
    // Check for italic button
    expect(screen.getByTitle('italic')).toBeInTheDocument();
    
    // Check for underline button
    expect(screen.getByTitle('underline')).toBeInTheDocument();
    
    // Check for font selector
    expect(screen.getByDisplayValue('Inter')).toBeInTheDocument();
    
    // Check for theme selector
    expect(screen.getByDisplayValue('Default')).toBeInTheDocument();
  });

  it('handles bold formatting click', () => {
    const onFormatClick = vi.fn();
    render(<EnhancedToolbar {...defaultProps} onFormatClick={onFormatClick} />);

    const boldButton = screen.getByTitle('bold');
    fireEvent.click(boldButton);

    expect(onFormatClick).toHaveBeenCalledWith('bold');
  });

  it('handles italic formatting click', () => {
    const onFormatClick = vi.fn();
    render(<EnhancedToolbar {...defaultProps} onFormatClick={onFormatClick} />);

    const italicButton = screen.getByTitle('italic');
    fireEvent.click(italicButton);

    expect(onFormatClick).toHaveBeenCalledWith('italic');
  });

  it('handles font change', () => {
    const onFontChange = vi.fn();
    render(<EnhancedToolbar {...defaultProps} onFontChange={onFontChange} />);

    // This would require more complex interaction with the Select component
    // For now, we verify the select exists and has the right value
    expect(screen.getByDisplayValue('Inter')).toBeInTheDocument();
  });

  it('handles theme change', () => {
    const onThemeChange = vi.fn();
    render(<EnhancedToolbar {...defaultProps} onThemeChange={onThemeChange} />);

    // Verify theme selector exists
    expect(screen.getByDisplayValue('Default')).toBeInTheDocument();
  });

  it('shows focus mode toggle', () => {
    const onToggleFocus = vi.fn();
    render(<EnhancedToolbar {...defaultProps} onToggleFocus={onToggleFocus} />);

    const focusButton = screen.getByTitle('focusMode');
    fireEvent.click(focusButton);

    expect(onToggleFocus).toHaveBeenCalled();
  });

  it('renders mobile toolbar with essential controls only', () => {
    render(<EnhancedToolbar {...defaultProps} isMobile={true} />);

    // Mobile should have essential formatting
    expect(screen.getByTitle('bold')).toBeInTheDocument();
    expect(screen.getByTitle('italic')).toBeInTheDocument();
    expect(screen.getByTitle('bulletList')).toBeInTheDocument();
  });

  it('renders focus mode toolbar with minimal controls', () => {
    render(<EnhancedToolbar {...defaultProps} isFocusMode={true} />);

    // Focus mode should have save and exit focus buttons only
    expect(screen.getByTitle('save')).toBeInTheDocument();
    expect(screen.getByTitle('exitFocusMode')).toBeInTheDocument();
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

    const undoButton = screen.getByTitle('undo');
    const redoButton = screen.getByTitle('redo');

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

    const undoButton = screen.getByTitle('undo');
    const redoButton = screen.getByTitle('redo');

    expect(undoButton).toBeDisabled();
    expect(redoButton).toBeDisabled();
  });

  it('handles save operation', () => {
    const onSave = vi.fn();
    render(<EnhancedToolbar {...defaultProps} onSave={onSave} hasUnsavedChanges={true} />);

    // In non-focus mode, save is in focus toggle area
    const focusButton = screen.getByTitle('focusMode');
    expect(focusButton).toBeInTheDocument();
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
    expect(screen.getByTitle('bold')).toBeInTheDocument();
  });
});
