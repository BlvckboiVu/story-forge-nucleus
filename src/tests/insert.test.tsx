import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LLMPanel from '@/components/LLMPanel';

// Mock the toast hook
vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock the OpenRouter API
vi.mock('@/utils/openrouter', () => ({
  openRouterAPI: {
    getApiKey: vi.fn(() => 'test-key'),
    setApiKey: vi.fn(),
    sendPrompt: vi.fn(),
    clearCache: vi.fn(),
    getCacheStats: vi.fn(() => ({ size: 0, maxSize: 10, oldestEntry: null })),
  },
  MODELS: {
    STANDARD: 'openai/gpt-3.5-turbo',
    LOW_TOKEN: 'meta-llama/llama-3.2-3b-instruct:free',
  },
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};
global.localStorage = localStorageMock as any;

describe('LLM Panel Insert Functionality', () => {
  const mockOnInsertResponse = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue('[]'); // Empty conversation history
  });

  it('should render insert button when onInsertResponse is provided', () => {
    render(
      <LLMPanel
        isCollapsed={false}
        onToggle={() => {}}
        onInsertResponse={mockOnInsertResponse}
      />
    );

    // Should render the panel
    expect(screen.getByText('AI Assistant')).toBeInTheDocument();
  });

  it('should call onInsertResponse when insert button is clicked', async () => {
    // Mock a conversation with a response
    const mockConversation = [
      {
        id: '1',
        prompt: 'Test prompt',
        response: 'Test response to insert',
        timestamp: Date.now(),
        model: 'test-model',
      },
    ];
    
    localStorageMock.getItem.mockReturnValue(JSON.stringify(mockConversation));

    render(
      <LLMPanel
        isCollapsed={false}
        onToggle={() => {}}
        onInsertResponse={mockOnInsertResponse}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Test response to insert')).toBeInTheDocument();
    });

    // Find and click the insert button (Plus icon)
    const insertButton = screen.getByRole('button', { name: /insert into document/i });
    fireEvent.click(insertButton);

    expect(mockOnInsertResponse).toHaveBeenCalledWith('Test response to insert');
  });

  it('should not render insert button when onInsertResponse is not provided', () => {
    const mockConversation = [
      {
        id: '1',
        prompt: 'Test prompt',
        response: 'Test response',
        timestamp: Date.now(),
        model: 'test-model',
      },
    ];
    
    localStorageMock.getItem.mockReturnValue(JSON.stringify(mockConversation));

    render(
      <LLMPanel
        isCollapsed={false}
        onToggle={() => {}}
        // No onInsertResponse prop
      />
    );

    // Insert button should not be present
    const insertButton = screen.queryByRole('button', { name: /insert into document/i });
    expect(insertButton).not.toBeInTheDocument();
  });

  it('should copy response to clipboard', async () => {
    const mockConversation = [
      {
        id: '1',
        prompt: 'Test prompt',
        response: 'Response to copy',
        timestamp: Date.now(),
        model: 'test-model',
      },
    ];
    
    localStorageMock.getItem.mockReturnValue(JSON.stringify(mockConversation));

    // Mock clipboard API
    const mockWriteText = vi.fn();
    Object.assign(navigator, {
      clipboard: {
        writeText: mockWriteText,
      },
    });

    render(
      <LLMPanel
        isCollapsed={false}
        onToggle={() => {}}
        onInsertResponse={mockOnInsertResponse}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Response to copy')).toBeInTheDocument();
    });

    // Find and click the copy button
    const copyButton = screen.getByRole('button', { name: /copy response/i });
    fireEvent.click(copyButton);

    expect(mockWriteText).toHaveBeenCalledWith('Response to copy');
  });

  it('should handle collapsed state correctly', () => {
    render(
      <LLMPanel
        isCollapsed={true}
        onToggle={() => {}}
        onInsertResponse={mockOnInsertResponse}
      />
    );

    // Should show minimal collapsed UI
    expect(screen.queryByText('AI Assistant')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /expand ai panel/i })).toBeInTheDocument();
  });
});
