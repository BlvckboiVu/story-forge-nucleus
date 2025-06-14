
interface StoryBibleEntry {
  id: string;
  title: string;
  content: string;
  type: string;
}

/**
 * Finds Story Bible entries that contain matching text
 * @param text - Text to search for in Story Bible entries
 * @param entries - Array of Story Bible entries to search through
 * @returns Array of matching Story Bible entries
 */
export function findStoryBibleMatches(
  text: string,
  entries: StoryBibleEntry[]
): StoryBibleEntry[] {
  return entries.filter((entry) => {
    const searchText = text.toLowerCase();
    const entryText = entry.content.toLowerCase();
    return entryText.includes(searchText);
  });
}

/**
 * Highlights text in a DOM element that matches Story Bible entries
 * Creates visual highlights with data attributes for reference
 * @param element - DOM element to highlight text within
 * @param entries - Story Bible entries to match against
 */
export function highlightStoryBibleMatches(
  element: HTMLElement,
  entries: StoryBibleEntry[]
) {
  const text = element.textContent || '';
  const matches = findStoryBibleMatches(text, entries);
  
  if (matches.length === 0) return;
  
  const range = document.createRange();
  const selection = window.getSelection();
  
  if (!selection) return;
  
  // Select the entire element content
  range.selectNodeContents(element);
  selection.removeAllRanges();
  selection.addRange(range);
  
  // Replace with highlighted version
  document.execCommand('insertHTML', false, `
    <span class="story-bible-highlight" data-entry-id="${matches[0].id}">
      ${text}
    </span>
  `);
  
  selection.removeAllRanges();
}

/**
 * Removes all Story Bible highlights from a DOM element
 * Restores original text content without highlight markup
 * @param element - DOM element to remove highlights from
 */
export function removeStoryBibleHighlights(element: HTMLElement) {
  const highlights = element.getElementsByClassName('story-bible-highlight');
  while (highlights.length > 0) {
    const highlight = highlights[0];
    const text = highlight.textContent || '';
    const textNode = document.createTextNode(text);
    highlight.parentNode?.replaceChild(textNode, highlight);
  }
}

/**
 * Extracts the Story Bible entry ID from a highlighted element
 * @param element - DOM element to check for Story Bible reference
 * @returns Story Bible entry ID or null if not found
 */
export function getStoryBibleEntryId(element: HTMLElement): string | null {
  const highlight = element.closest('.story-bible-highlight');
  return highlight?.getAttribute('data-entry-id') || null;
} 
