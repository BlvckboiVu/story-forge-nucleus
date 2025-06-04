
import { StoryBibleEntry } from '@/lib/storyBibleDb';

interface SuggestionTemplate {
  name: string;
  description: string;
  tags: string[];
  rules: string[];
}

const CHARACTER_SUGGESTIONS: SuggestionTemplate[] = [
  {
    name: 'Aria Blackwood',
    description: 'A mysterious scholar with knowledge of ancient texts and forgotten languages.',
    tags: ['scholar', 'mysterious', 'ancient knowledge'],
    rules: ['Always speaks in riddles when discussing magic', 'Never removes her silver pendant', 'Has a fear of loud noises']
  },
  {
    name: 'Marcus Ironforge',
    description: 'A gruff blacksmith whose weapons are said to hold magical properties.',
    tags: ['blacksmith', 'weapons', 'magical'],
    rules: ['Only works at dawn', 'Refuses payment in gold', 'Each weapon has a unique rune']
  },
  {
    name: 'Luna Whisperwind',
    description: 'An elven ranger who can communicate with forest creatures.',
    tags: ['elf', 'ranger', 'nature', 'animals'],
    rules: ['Never stays in cities for more than a day', 'Carries seeds from her homeland', 'Can predict weather changes']
  }
];

const LOCATION_SUGGESTIONS: SuggestionTemplate[] = [
  {
    name: 'The Whispering Library',
    description: 'An ancient library where the books seem to murmur secrets to those who listen carefully.',
    tags: ['library', 'ancient', 'magical'],
    rules: ['Books reorganize themselves at midnight', 'Only accessible during the full moon', 'Visitors must leave something precious behind']
  },
  {
    name: 'Shadowmere Tavern',
    description: 'A tavern that exists in multiple dimensions, serving travelers from all realms.',
    tags: ['tavern', 'dimensional', 'travelers'],
    rules: ['The door appears only to those who need shelter', 'Payment accepted in stories and memories', 'Time flows differently inside']
  },
  {
    name: 'Crystal Caves of Lumina',
    description: 'Underground caverns filled with luminescent crystals that respond to emotions.',
    tags: ['caves', 'crystals', 'emotions', 'underground'],
    rules: ['Crystals glow brighter with positive emotions', 'Echo chambers amplify magic', 'Some crystals store memories']
  }
];

const LORE_SUGGESTIONS: SuggestionTemplate[] = [
  {
    name: 'The Convergence',
    description: 'A prophesied event when the barriers between worlds grow thin and magic flows freely.',
    tags: ['prophecy', 'magic', 'worlds'],
    rules: ['Occurs every thousand years', 'Heralded by strange celestial events', 'Magic becomes unpredictable during this time']
  },
  {
    name: 'The Lost Language of Aethris',
    description: 'An ancient language that when spoken aloud, manifests the words into reality.',
    tags: ['language', 'ancient', 'manifestation'],
    rules: ['Only fragments remain in old texts', 'Speaking it requires great mental focus', 'Mispronunciation can be dangerous']
  }
];

const ITEM_SUGGESTIONS: SuggestionTemplate[] = [
  {
    name: 'Moonstone Compass',
    description: 'A compass that points not to magnetic north, but to what the holder most desires.',
    tags: ['compass', 'magical', 'desires'],
    rules: ['Only works under moonlight', 'Can lead the user astray if their desire is unclear', 'Glows brighter as you get closer to your goal']
  },
  {
    name: 'Cloak of Memories',
    description: 'A cloak that allows the wearer to briefly experience the memories of those who wore it before.',
    tags: ['cloak', 'memories', 'experiences'],
    rules: ['Can only hold memories for 24 hours', 'Overwhelming if worn too long', 'Some memories are more vivid than others']
  }
];

const SUGGESTION_POOLS = {
  Character: CHARACTER_SUGGESTIONS,
  Location: LOCATION_SUGGESTIONS,
  Lore: LORE_SUGGESTIONS,
  Item: ITEM_SUGGESTIONS,
  Custom: []
} as const;

export const generateSuggestion = async (
  type: StoryBibleEntry['type'],
  context?: string
): Promise<SuggestionTemplate> => {
  // In a real implementation, this would call an LLM API
  // For now, we'll return a random suggestion from our templates
  
  const suggestions = SUGGESTION_POOLS[type];
  
  if (suggestions.length === 0) {
    return {
      name: 'Custom Entry',
      description: 'A unique element specific to your story world.',
      tags: ['custom', 'unique'],
      rules: ['Define your own rules and properties']
    };
  }
  
  // Return a random suggestion
  const randomIndex = Math.floor(Math.random() * suggestions.length);
  return suggestions[randomIndex];
};

// Cache for performance optimization
const suggestionCache = new Map<string, SuggestionTemplate>();

export const getCachedSuggestion = async (
  type: StoryBibleEntry['type'],
  context?: string
): Promise<SuggestionTemplate> => {
  const cacheKey = `${type}-${context || 'default'}`;
  
  if (suggestionCache.has(cacheKey)) {
    return suggestionCache.get(cacheKey)!;
  }
  
  const suggestion = await generateSuggestion(type, context);
  suggestionCache.set(cacheKey, suggestion);
  
  // Clear cache after 5 minutes to prevent memory issues
  setTimeout(() => {
    suggestionCache.delete(cacheKey);
  }, 5 * 60 * 1000);
  
  return suggestion;
};
