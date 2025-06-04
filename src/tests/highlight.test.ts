
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { highlightCurrentParagraph, findMatches, removeDuplicates } from '@/utils/highlighting';
import { generateSuggestion, getCachedSuggestion } from '@/utils/suggestions';
import { StoryBibleEntry } from '@/lib/storyBibleDb';

// Mock Quill editor
const createMockQuill = (text: string, selectionIndex: number = 0) => ({
  getSelection: () => ({ index: selectionIndex }),
  getLine: (index: number) => [{
    length: () => text.length
  }],
  getIndex: () => 0,
  getText: (start: number, length: number) => text.substring(start, start + length),
  formatText: vi.fn(),
});

// Mock Story Bible entries
const mockEntries: StoryBibleEntry[] = [
  {
    id: '1',
    name: 'Aria Blackwood',
    type: 'Character',
    description: 'A mysterious scholar',
    tags: ['scholar', 'mysterious'],
    rules: ['Always speaks in riddles'],
    relations: [],
    project_id: 'project1',
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: '2',
    name: 'Whispering Library',
    type: 'Location',
    description: 'An ancient library',
    tags: ['library', 'ancient'],
    rules: ['Books reorganize at midnight'],
    relations: [],
    project_id: 'project1',
    created_at: new Date(),
    updated_at: new Date(),
  },
];

describe('Story Bible Highlighting', () => {
  describe('highlightCurrentParagraph', () => {
    it('should find matches for entry names in text', () => {
      const text = 'Aria Blackwood visited the Whispering Library yesterday.';
      const quill = createMockQuill(text);
      
      const matches = highlightCurrentParagraph(quill, mockEntries);
      
      expect(matches).toHaveLength(2);
      expect(matches[0].text).toBe('Aria Blackwood');
      expect(matches[1].text).toBe('Whispering Library');
    });

    it('should find matches for tags in text', () => {
      const text = 'The scholar studied the ancient texts in the library.';
      const quill = createMockQuill(text);
      
      const matches = highlightCurrentParagraph(quill, mockEntries);
      
      expect(matches.length).toBeGreaterThan(0);
      expect(matches.some(m => m.text === 'scholar')).toBe(true);
      expect(matches.some(m => m.text === 'ancient')).toBe(true);
      expect(matches.some(m => m.text === 'library')).toBe(true);
    });

    it('should be case insensitive', () => {
      const text = 'ARIA BLACKWOOD went to the whispering library.';
      const quill = createMockQuill(text);
      
      const matches = highlightCurrentParagraph(quill, mockEntries);
      
      expect(matches.length).toBeGreaterThan(0);
      expect(matches.some(m => m.text.toLowerCase() === 'aria blackwood')).toBe(true);
    });

    it('should handle empty text', () => {
      const quill = createMockQuill('');
      
      const matches = highlightCurrentParagraph(quill, mockEntries);
      
      expect(matches).toHaveLength(0);
    });

    it('should handle no entries', () => {
      const text = 'Some random text without any matches.';
      const quill = createMockQuill(text);
      
      const matches = highlightCurrentParagraph(quill, []);
      
      expect(matches).toHaveLength(0);
    });

    it('should limit highlighting to 1000 words for performance', () => {
      const longText = 'word '.repeat(1500) + 'Aria Blackwood';
      const quill = createMockQuill(longText);
      
      const matches = highlightCurrentParagraph(quill, mockEntries);
      
      // Should not find "Aria Blackwood" because it's beyond the 1000 word limit
      expect(matches).toHaveLength(0);
    });
  });

  describe('removeDuplicates', () => {
    it('should remove overlapping matches', () => {
      const matches = [
        { text: 'Aria', entry: mockEntries[0], start: 0, end: 4 },
        { text: 'Aria Blackwood', entry: mockEntries[0], start: 0, end: 14 },
        { text: 'scholar', entry: mockEntries[0], start: 20, end: 27 },
      ];
      
      const filtered = removeDuplicates(matches);
      
      expect(filtered).toHaveLength(2);
      expect(filtered[0].text).toBe('Aria Blackwood'); // Longer match should be kept
      expect(filtered[1].text).toBe('scholar');
    });
  });
});

describe('AI Suggestions', () => {
  describe('generateSuggestion', () => {
    it('should generate character suggestions', async () => {
      const suggestion = await generateSuggestion('Character');
      
      expect(suggestion.name).toBeDefined();
      expect(suggestion.description).toBeDefined();
      expect(suggestion.tags).toBeInstanceOf(Array);
      expect(suggestion.rules).toBeInstanceOf(Array);
    });

    it('should generate location suggestions', async () => {
      const suggestion = await generateSuggestion('Location');
      
      expect(suggestion.name).toBeDefined();
      expect(suggestion.description).toBeDefined();
      expect(suggestion.tags).toBeInstanceOf(Array);
      expect(suggestion.rules).toBeInstanceOf(Array);
    });

    it('should generate lore suggestions', async () => {
      const suggestion = await generateSuggestion('Lore');
      
      expect(suggestion.name).toBeDefined();
      expect(suggestion.description).toBeDefined();
      expect(suggestion.tags).toBeInstanceOf(Array);
      expect(suggestion.rules).toBeInstanceOf(Array);
    });

    it('should generate item suggestions', async () => {
      const suggestion = await generateSuggestion('Item');
      
      expect(suggestion.name).toBeDefined();
      expect(suggestion.description).toBeDefined();
      expect(suggestion.tags).toBeInstanceOf(Array);
      expect(suggestion.rules).toBeInstanceOf(Array);
    });

    it('should handle custom type', async () => {
      const suggestion = await generateSuggestion('Custom');
      
      expect(suggestion.name).toBe('Custom Entry');
      expect(suggestion.description).toContain('unique element');
    });

    it('should generate suggestions with genre options', async () => {
      const suggestion = await generateSuggestion('Character', { genre: 'Fantasy' });
      
      expect(suggestion.name).toBeDefined();
      expect(suggestion.description).toBeDefined();
      expect(suggestion.tags).toBeInstanceOf(Array);
      expect(suggestion.rules).toBeInstanceOf(Array);
    });

    it('should generate suggestions with culture options', async () => {
      const suggestion = await generateSuggestion('Character', { culture: 'Nordic' });
      
      expect(suggestion.name).toBeDefined();
      expect(suggestion.description).toBeDefined();
      expect(suggestion.tags).toBeInstanceOf(Array);
      expect(suggestion.rules).toBeInstanceOf(Array);
    });
  });

  describe('getCachedSuggestion', () => {
    it('should cache suggestions for performance', async () => {
      const type = 'Character';
      const options = { genre: 'Fantasy' };
      
      // First call
      const suggestion1 = await getCachedSuggestion(type, options);
      
      // Second call should return the same cached result
      const suggestion2 = await getCachedSuggestion(type, options);
      
      expect(suggestion1).toEqual(suggestion2);
    });

    it('should return different suggestions for different types', async () => {
      const characterSuggestion = await getCachedSuggestion('Character');
      const locationSuggestion = await getCachedSuggestion('Location');
      
      expect(characterSuggestion.name).not.toBe(locationSuggestion.name);
    });

    it('should handle different options correctly', async () => {
      const fantasyOptions = { genre: 'Fantasy' };
      const scifiOptions = { genre: 'Sci-Fi' };
      
      const fantasySuggestion = await getCachedSuggestion('Character', fantasyOptions);
      const scifiSuggestion = await getCachedSuggestion('Character', scifiOptions);
      
      // Should be different suggestions for different genres
      expect(fantasySuggestion).toBeDefined();
      expect(scifiSuggestion).toBeDefined();
    });
  });
});

describe('Performance Tests', () => {
  it('should handle large text efficiently', () => {
    const largeText = 'word '.repeat(500) + 'Aria Blackwood ' + 'word '.repeat(500);
    const quill = createMockQuill(largeText);
    
    const startTime = performance.now();
    highlightCurrentParagraph(quill, mockEntries);
    const endTime = performance.now();
    
    // Should complete within reasonable time (100ms)
    expect(endTime - startTime).toBeLessThan(100);
  });

  it('should handle many entries efficiently', () => {
    const manyEntries = Array.from({ length: 100 }, (_, i) => ({
      ...mockEntries[0],
      id: `entry-${i}`,
      name: `Character ${i}`,
      tags: [`tag${i}`, `category${i}`],
    }));
    
    const text = 'Character 50 met tag25 at the category75 location.';
    const quill = createMockQuill(text);
    
    const startTime = performance.now();
    highlightCurrentParagraph(quill, manyEntries);
    const endTime = performance.now();
    
    // Should complete within reasonable time even with many entries
    expect(endTime - startTime).toBeLessThan(200);
  });
});
