
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DraftModal } from '../components/editor/DraftModal';
import * as db from '../lib/db';

// Mock dependencies
vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

vi.mock('../lib/db');

describe('Draft Management', () => {
  const mockOnClose = vi.fn();
  const mockOnCreateDraft = vi.fn();
  const mockOnOpenDraft = vi.fn();

  const mockDrafts = [
    {
      id: '1',
      projectId: 'project-1',
      title: 'Chapter 1',
      content: 'Content of chapter 1',
      wordCount: 150,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-02'),
    },
    {
      id: '2',
      projectId: 'project-1',
      title: 'Chapter 2',
      content: 'Content of chapter 2',
      wordCount: 300,
      createdAt: new Date('2024-01-03'),
      updatedAt: new Date('2024-01-04'),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(db.getDrafts).mockResolvedValue(mockDrafts);
  });

  it('loads and displays drafts when modal opens', async () => {
    render(
      <DraftModal
        isOpen={true}
        onClose={mockOnClose}
        onCreateDraft={mockOnCreateDraft}
        onOpenDraft={mockOnOpenDraft}
        projectId="project-1"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Chapter 1')).toBeInTheDocument();
      expect(screen.getByText('Chapter 2')).toBeInTheDocument();
      expect(screen.getByText('150 words')).toBeInTheDocument();
      expect(screen.getByText('300 words')).toBeInTheDocument();
    });
  });

  it('creates new draft with valid title', async () => {
    render(
      <DraftModal
        isOpen={true}
        onClose={mockOnClose}
        onCreateDraft={mockOnCreateDraft}
        onOpenDraft={mockOnOpenDraft}
        projectId="project-1"
      />
    );

    const titleInput = screen.getByPlaceholderText('Draft Title');
    const createButton = screen.getByRole('button', { name: 'Create' });

    fireEvent.change(titleInput, { target: { value: 'New Chapter' } });
    fireEvent.click(createButton);

    expect(mockOnCreateDraft).toHaveBeenCalledWith('New Chapter');
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('prevents creating draft with empty title', async () => {
    render(
      <DraftModal
        isOpen={true}
        onClose={mockOnClose}
        onCreateDraft={mockOnCreateDraft}
        onOpenDraft={mockOnOpenDraft}
        projectId="project-1"
      />
    );

    const createButton = screen.getByRole('button', { name: 'Create' });
    fireEvent.click(createButton);

    expect(mockOnCreateDraft).not.toHaveBeenCalled();
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('opens selected draft', async () => {
    render(
      <DraftModal
        isOpen={true}
        onClose={mockOnClose}
        onCreateDraft={mockOnCreateDraft}
        onOpenDraft={mockOnOpenDraft}
        projectId="project-1"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Chapter 1')).toBeInTheDocument();
    });

    const draftElement = screen.getByText('Chapter 1').closest('div');
    fireEvent.click(draftElement!);

    expect(mockOnOpenDraft).toHaveBeenCalledWith(mockDrafts[0]);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('handles database errors gracefully', async () => {
    vi.mocked(db.getDrafts).mockRejectedValue(new Error('Database error'));

    render(
      <DraftModal
        isOpen={true}
        onClose={mockOnClose}
        onCreateDraft={mockOnCreateDraft}
        onOpenDraft={mockOnOpenDraft}
        projectId="project-1"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('No drafts found. Create your first draft to get started.')).toBeInTheDocument();
    });
  });

  it('shows loading state while fetching drafts', () => {
    vi.mocked(db.getDrafts).mockImplementation(() => new Promise(() => {})); // Never resolves

    render(
      <DraftModal
        isOpen={true}
        onClose={mockOnClose}
        onCreateDraft={mockOnCreateDraft}
        onOpenDraft={mockOnOpenDraft}
        projectId="project-1"
      />
    );

    expect(screen.getAllByTestId('skeleton')).toHaveLength(3);
  });
});

describe('Database Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates draft with correct structure', async () => {
    const mockDraft = {
      projectId: 'project-1',
      title: 'Test Draft',
      content: 'Test content',
      wordCount: 2,
    };

    vi.mocked(db.createDraft).mockResolvedValue('new-draft-id');

    const result = await db.createDraft(mockDraft);

    expect(db.createDraft).toHaveBeenCalledWith(mockDraft);
    expect(result).toBe('new-draft-id');
  });

  it('updates draft with new content and word count', async () => {
    const draftId = 'draft-1';
    const updates = {
      content: 'Updated content with more words',
      wordCount: 5,
    };

    vi.mocked(db.updateDraft).mockResolvedValue(1);

    const result = await db.updateDraft(draftId, updates);

    expect(db.updateDraft).toHaveBeenCalledWith(draftId, updates);
    expect(result).toBe(1);
  });

  it('retrieves draft by id', async () => {
    const mockDraft = mockDrafts[0];
    vi.mocked(db.getDraft).mockResolvedValue(mockDraft);

    const result = await db.getDraft('1');

    expect(db.getDraft).toHaveBeenCalledWith('1');
    expect(result).toEqual(mockDraft);
  });

  it('handles draft not found', async () => {
    vi.mocked(db.getDraft).mockResolvedValue(undefined);

    const result = await db.getDraft('nonexistent');

    expect(result).toBeUndefined();
  });
});
