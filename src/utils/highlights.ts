interface StoryBibleEntry {
  id: string;
  title: string;
  content: string;
  type: string;
}

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
  
  range.selectNodeContents(element);
  selection.removeAllRanges();
  selection.addRange(range);
  
  document.execCommand('insertHTML', false, `
    <span class="story-bible-highlight" data-entry-id="${matches[0].id}">
      ${text}
    </span>
  `);
  
  selection.removeAllRanges();
}

export function removeStoryBibleHighlights(element: HTMLElement) {
  const highlights = element.getElementsByClassName('story-bible-highlight');
  while (highlights.length > 0) {
    const highlight = highlights[0];
    const text = highlight.textContent || '';
    const textNode = document.createTextNode(text);
    highlight.parentNode?.replaceChild(textNode, highlight);
  }
}

export function getStoryBibleEntryId(element: HTMLElement): string | null {
  const highlight = element.closest('.story-bible-highlight');
  return highlight?.getAttribute('data-entry-id') || null;
} 