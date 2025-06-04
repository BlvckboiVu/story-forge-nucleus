
import { debounce } from 'lodash';
import { StoryBibleEntry } from '@/lib/storyBibleDb';
import { sanitizeHtml } from '@/utils/security';

export interface HighlightMatch {
  text: string;
  entry: StoryBibleEntry;
  start: number;
  end: number;
}

// Debounced function to improve performance
export const debouncedHighlight = debounce((
  quill: any,
  entries: StoryBibleEntry[],
  onHighlight?: (matches: HighlightMatch[]) => void
) => {
  highlightCurrentParagraph(quill, entries, onHighlight);
}, 300);

export const highlightCurrentParagraph = (
  quill: any,
  entries: StoryBibleEntry[],
  onHighlight?: (matches: HighlightMatch[]) => void
): HighlightMatch[] => {
  if (!quill || !entries.length) return [];

  const selection = quill.getSelection();
  if (!selection) return [];

  try {
    // Get current line/paragraph
    const [line] = quill.getLine(selection.index);
    if (!line) return [];

    const lineStart = quill.getIndex(line);
    const lineLength = line.length();
    const lineText = quill.getText(lineStart, lineLength);

    // Limit to 1000 words for performance
    const words = lineText.split(/\s+/);
    const limitedText = words.slice(0, 1000).join(' ');

    // Clear existing highlights in current paragraph
    clearHighlights(quill, lineStart, lineLength);

    // Find matches
    const matches = findMatches(limitedText, entries, lineStart);

    // Apply highlights
    matches.forEach(match => {
      applyHighlight(quill, match);
    });

    if (onHighlight) {
      onHighlight(matches);
    }

    return matches;
  } catch (error) {
    console.error('Error highlighting paragraph:', error);
    return [];
  }
};

export const findMatches = (
  text: string,
  entries: StoryBibleEntry[],
  offset: number
): HighlightMatch[] => {
  const matches: HighlightMatch[] = [];
  
  entries.forEach(entry => {
    // Search for entry name and tags
    const searchTerms = [entry.name, ...entry.tags];
    
    searchTerms.forEach(term => {
      if (term.length < 3) return; // Skip very short terms
      
      const regex = new RegExp(`\\b${escapeRegExp(term)}\\b`, 'gi');
      let match;
      
      while ((match = regex.exec(text)) !== null) {
        matches.push({
          text: match[0],
          entry,
          start: offset + match.index,
          end: offset + match.index + match[0].length
        });
      }
    });
  });

  // Sort by position and remove overlaps
  return removeDuplicates(matches.sort((a, b) => a.start - b.start));
};

export const removeDuplicates = (matches: HighlightMatch[]): HighlightMatch[] => {
  const filtered: HighlightMatch[] = [];
  
  matches.forEach(match => {
    const hasOverlap = filtered.some(existing => 
      (match.start >= existing.start && match.start < existing.end) ||
      (match.end > existing.start && match.end <= existing.end)
    );
    
    if (!hasOverlap) {
      filtered.push(match);
    }
  });
  
  return filtered;
};

const applyHighlight = (quill: any, match: HighlightMatch) => {
  try {
    quill.formatText(
      match.start,
      match.end - match.start,
      {
        'story-bible-highlight': {
          title: createTooltipContent(match.entry)
        }
      }
    );
  } catch (error) {
    console.error('Error applying highlight:', error);
  }
};

const clearHighlights = (quill: any, start: number, length: number) => {
  try {
    quill.formatText(start, length, {
      'story-bible-highlight': false
    });
  } catch (error) {
    console.error('Error clearing highlights:', error);
  }
};

const createTooltipContent = (entry: StoryBibleEntry): string => {
  const description = entry.description.replace(/<[^>]*>/g, ''); // Strip HTML
  const shortDescription = description.length > 200 
    ? description.substring(0, 197) + '...' 
    : description;
  
  return sanitizeHtml(`${entry.name}: ${shortDescription}`);
};

const escapeRegExp = (string: string): string => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

// Custom Quill format for Story Bible highlights
export const registerStoryBibleFormat = (Quill: any) => {
  try {
    const Inline = Quill.import('blots/inline');
    
    class StoryBibleHighlight extends Inline {
      static create(value: any) {
        const node = super.create();
        node.setAttribute('style', 'border-bottom: 2px dotted #3b82f6; cursor: help;');
        if (value && value.title) {
          node.setAttribute('title', value.title);
        }
        return node;
      }
      
      static formats(node: HTMLElement) {
        return {
          title: node.getAttribute('title')
        };
      }
      
      format(name: string, value: any) {
        if (name !== this.statics.blotName || !value) {
          super.format(name, value);
        } else {
          this.domNode.setAttribute('title', value.title || '');
        }
      }
    }
    
    StoryBibleHighlight.blotName = 'story-bible-highlight';
    StoryBibleHighlight.tagName = 'span';
    
    Quill.register(StoryBibleHighlight, true);
  } catch (error) {
    console.error('Error registering Story Bible format:', error);
  }
};
