
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StoryBibleModal } from '@/components/StoryBibleModal';
import { 
  createStoryBibleEntry,
  updateStoryBibleEntry,
  getStoryBibleEntriesByProject,
  deleteStoryBibleEntry,
  StoryBibleEntry
} from '@/lib/storyBibleDb';

// Mock the database functions
vi.mock('@/lib/storyBibleDb', () => ({
  createStoryBibleEntry: vi.fn(),
  updateStoryBibleEntry: vi.fn(),
  getStoryBibleEntriesByProject: vi.fn(),
  deleteStoryBibleEntry: vi.fn(),
}));

// Mock the toast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

const mockEntry: StoryBibleEntry = {
  id: '123',
  type: 'Character',
  name: 'Test Character',
  description: 'A test character description',
  tags: ['tag1', 'tag2'],
  rules: ['rule1'],
  relations: [],
  project_id: 'project-123',
  created_at: new Date(),
  updated_at: new Date(),
};

describe('StoryBibleModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSave: vi.fn(),
    projectId: 'project-123',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders create modal correctly', () => {
    render(<StoryBibleModal {...defaultProps} />);
    
    expect(screen.getByText('Create New Entry')).toBeInTheDocument();
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument();
  });

  it('renders edit modal correctly', () => {
    render(<StoryBibleModal {...defaultProps} entry={mockEntry} />);
    
    expect(screen.getByText('Edit Entry')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Character')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /update/i })).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();
    render(<StoryBibleModal {...defaultProps} />);
    
    const submitButton = screen.getByRole('button', { name: /create/i });
    await user.click(submitButton);
    
    expect(screen.getByText('Name is required')).toBeInTheDocument();
  });

  it('validates name length', async () => {
    const user = userEvent.setup();
    render(<StoryBibleModal {...defaultProps} />);
    
    const nameInput = screen.getByLabelText(/name/i);
    await user.type(nameInput, 'a'.repeat(201));
    
    const submitButton = screen.getByRole('button', { name: /create/i });
    await user.click(submitButton);
    
    expect(screen.getByText('Name must be less than 200 characters')).toBeInTheDocument();
  });

  it('creates entry with valid data', async () => {
    const user = userEvent.setup();
    const mockOnSave = vi.fn().mockResolvedValue(undefined);
    
    render(<StoryBibleModal {...defaultProps} onSave={mockOnSave} />);
    
    await user.type(screen.getByLabelText(/name/i), 'New Character');
    await user.type(screen.getByLabelText(/description/i), 'Character description');
    
    const submitButton = screen.getByRole('button', { name: /create/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith(expect.objectContaining({
        name: 'New Character',
        description: 'Character description',
        type: 'Character',
        project_id: 'project-123',
      }));
    });
  });

  it('adds and removes tags correctly', async () => {
    const user = userEvent.setup();
    render(<StoryBibleModal {...defaultProps} />);
    
    const tagInput = screen.getByPlaceholderText('Add a tag');
    await user.type(tagInput, 'new-tag');
    
    const addButton = screen.getByRole('button', { name: '' }); // Plus button
    await user.click(addButton);
    
    expect(screen.getByText('new-tag')).toBeInTheDocument();
    
    // Remove tag
    const removeButton = screen.getByRole('button', { name: '' }); // X button in tag
    await user.click(removeButton);
    
    expect(screen.queryByText('new-tag')).not.toBeInTheDocument();
  });

  it('prevents adding duplicate tags', async () => {
    const user = userEvent.setup();
    render(<StoryBibleModal {...defaultProps} />);
    
    const tagInput = screen.getByPlaceholderText('Add a tag');
    const addButton = screen.getByRole('button', { name: '' }); // Plus button
    
    // Add first tag
    await user.type(tagInput, 'duplicate');
    await user.click(addButton);
    
    // Try to add same tag again
    await user.type(tagInput, 'duplicate');
    await user.click(addButton);
    
    const duplicateTags = screen.getAllByText('duplicate');
    expect(duplicateTags).toHaveLength(1);
  });

  it('limits number of tags', async () => {
    const user = userEvent.setup();
    render(<StoryBibleModal {...defaultProps} />);
    
    const nameInput = screen.getByLabelText(/name/i);
    await user.type(nameInput, 'Test Character');
    
    // Try to create entry with too many tags
    const formData = {
      name: 'Test Character',
      tags: Array(51).fill('tag'), // Over the limit of 50
    };
    
    const submitButton = screen.getByRole('button', { name: /create/i });
    await user.click(submitButton);
    
    // Should show validation error for too many tags
    expect(screen.getByText('Too many tags (maximum 50)')).toBeInTheDocument();
  });
});

describe('Story Bible Database Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates entry with proper validation', async () => {
    const mockCreate = vi.mocked(createStoryBibleEntry);
    mockCreate.mockResolvedValue('new-id');
    
    const entryData = {
      type: 'Character' as const,
      name: 'Test Character',
      description: 'Test description',
      tags: ['tag1'],
      rules: ['rule1'],
      relations: [],
      project_id: 'project-123',
    };
    
    const result = await createStoryBibleEntry(entryData);
    
    expect(mockCreate).toHaveBeenCalledWith(entryData);
    expect(result).toBe('new-id');
  });

  it('handles lazy loading correctly', async () => {
    const mockGetEntries = vi.mocked(getStoryBibleEntriesByProject);
    const mockEntries = Array(10).fill(null).map((_, i) => ({
      ...mockEntry,
      id: `entry-${i}`,
      name: `Entry ${i}`,
    }));
    
    mockGetEntries.mockResolvedValue(mockEntries);
    
    const result = await getStoryBibleEntriesByProject('project-123', 0, 10);
    
    expect(mockGetEntries).toHaveBeenCalledWith('project-123', 0, 10, undefined, undefined);
    expect(result).toHaveLength(10);
    expect(result[0].name).toBe('Entry 0');
  });

  it('handles search and filtering', async () => {
    const mockGetEntries = vi.mocked(getStoryBibleEntriesByProject);
    mockGetEntries.mockResolvedValue([mockEntry]);
    
    await getStoryBibleEntriesByProject('project-123', 0, 10, 'search term', 'Character');
    
    expect(mockGetEntries).toHaveBeenCalledWith(
      'project-123', 
      0, 
      10, 
      'search term', 
      'Character'
    );
  });

  it('updates entry correctly', async () => {
    const mockUpdate = vi.mocked(updateStoryBibleEntry);
    mockUpdate.mockResolvedValue(undefined);
    
    const updates = {
      name: 'Updated Name',
      description: 'Updated description',
    };
    
    await updateStoryBibleEntry('entry-123', updates);
    
    expect(mockUpdate).toHaveBeenCalledWith('entry-123', updates);
  });

  it('deletes entry correctly', async () => {
    const mockDelete = vi.mocked(deleteStoryBibleEntry);
    mockDelete.mockResolvedValue(undefined);
    
    await deleteStoryBibleEntry('entry-123');
    
    expect(mockDelete).toHaveBeenCalledWith('entry-123');
  });

  it('handles database errors gracefully', async () => {
    const mockCreate = vi.mocked(createStoryBibleEntry);
    mockCreate.mockRejectedValue(new Error('Database error'));
    
    const entryData = {
      type: 'Character' as const,
      name: 'Test Character',
      description: 'Test description',
      tags: [],
      rules: [],
      relations: [],
      project_id: 'project-123',
    };
    
    await expect(createStoryBibleEntry(entryData)).rejects.toThrow('Database error');
  });
});

describe('Input Validation and Security', () => {
  it('rejects invalid entry types', async () => {
    const invalidEntry = {
      type: 'InvalidType' as any,
      name: 'Test Name',
      description: 'Test description',
      tags: [],
      rules: [],
      relations: [],
      project_id: 'project-123',
    };
    
    await expect(createStoryBibleEntry(invalidEntry)).rejects.toThrow('Invalid entry type');
  });

  it('rejects empty names', async () => {
    const invalidEntry = {
      type: 'Character' as const,
      name: '',
      description: 'Test description',
      tags: [],
      rules: [],
      relations: [],
      project_id: 'project-123',
    };
    
    await expect(createStoryBibleEntry(invalidEntry)).rejects.toThrow('Entry name is required');
  });

  it('rejects overly long descriptions', async () => {
    const invalidEntry = {
      type: 'Character' as const,
      name: 'Test Name',
      description: 'a'.repeat(100001), // Over the limit
      tags: [],
      rules: [],
      relations: [],
      project_id: 'project-123',
    };
    
    await expect(createStoryBibleEntry(invalidEntry)).rejects.toThrow('Description exceeds maximum length');
  });

  it('sanitizes HTML in descriptions', async () => {
    const mockCreate = vi.mocked(createStoryBibleEntry);
    mockCreate.mockResolvedValue('new-id');
    
    const entryWithHTML = {
      type: 'Character' as const,
      name: 'Test Name',
      description: '<script>alert("xss")</script><p>Safe content</p>',
      tags: [],
      rules: [],
      relations: [],
      project_id: 'project-123',
    };
    
    await createStoryBibleEntry(entryWithHTML);
    
    // Should be called with sanitized description
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
      description: expect.not.stringContaining('<script>'),
    }));
  });
});
