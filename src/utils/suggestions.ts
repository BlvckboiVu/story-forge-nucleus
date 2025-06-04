
import { StoryBibleEntry } from '@/lib/storyBibleDb';

interface SuggestionTemplate {
  name: string;
  description: string;
  tags: string[];
  rules: string[];
}

interface SuggestionOptions {
  genre?: string;
  culture?: string;
}

const GENRES = ['Fantasy', 'Sci-Fi', 'Mystery', 'Romance', 'Historical', 'Modern', 'Horror', 'Adventure'];
const CULTURES = ['Western', 'Eastern', 'Medieval', 'Futuristic', 'Ancient', 'Nordic', 'Celtic', 'Asian', 'African', 'Native American'];

const FANTASY_CHARACTER_SUGGESTIONS: SuggestionTemplate[] = [
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

const SCIFI_CHARACTER_SUGGESTIONS: SuggestionTemplate[] = [
  {
    name: 'Captain Zara Nova',
    description: 'A cybernetically enhanced starship captain with a mysterious past.',
    tags: ['captain', 'cybernetic', 'starship', 'mysterious'],
    rules: ['Never removes her neural interface headset', 'Has trust issues with AI', 'Always checks escape routes first']
  },
  {
    name: 'Dr. Chen Voss',
    description: 'A brilliant xenobiologist studying alien life forms.',
    tags: ['scientist', 'xenobiology', 'alien', 'research'],
    rules: ['Speaks to alien specimens', 'Keeps detailed digital journals', 'Refuses to weaponize discoveries']
  }
];

const FANTASY_LOCATION_SUGGESTIONS: SuggestionTemplate[] = [
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
  }
];

const SCIFI_LOCATION_SUGGESTIONS: SuggestionTemplate[] = [
  {
    name: 'Neo-Tokyo Spaceport',
    description: 'A massive orbital station serving as the gateway between Earth and the outer colonies.',
    tags: ['spaceport', 'orbital', 'gateway', 'futuristic'],
    rules: ['Artificial gravity varies by sector', 'Holographic advertisements everywhere', 'Security uses mind-scan technology']
  },
  {
    name: 'The Quantum Labs',
    description: 'Underground research facility where scientists experiment with parallel realities.',
    tags: ['laboratory', 'quantum', 'research', 'underground'],
    rules: ['Multiple versions of the same room exist', 'Time dilation effects occur randomly', 'Reality anchors prevent dimensional drift']
  }
];

const SUGGESTION_POOLS: Record<string, Record<StoryBibleEntry['type'], SuggestionTemplate[]>> = {
  Fantasy: {
    Character: FANTASY_CHARACTER_SUGGESTIONS,
    Location: FANTASY_LOCATION_SUGGESTIONS,
    Lore: [
      {
        name: 'The Convergence',
        description: 'A prophesied event when the barriers between worlds grow thin and magic flows freely.',
        tags: ['prophecy', 'magic', 'worlds'],
        rules: ['Occurs every thousand years', 'Heralded by strange celestial events', 'Magic becomes unpredictable during this time']
      }
    ],
    Item: [
      {
        name: 'Moonstone Compass',
        description: 'A compass that points not to magnetic north, but to what the holder most desires.',
        tags: ['compass', 'magical', 'desires'],
        rules: ['Only works under moonlight', 'Can lead the user astray if their desire is unclear', 'Glows brighter as you get closer to your goal']
      }
    ],
    Custom: []
  },
  'Sci-Fi': {
    Character: SCIFI_CHARACTER_SUGGESTIONS,
    Location: SCIFI_LOCATION_SUGGESTIONS,
    Lore: [
      {
        name: 'The Neural Link Protocol',
        description: 'A breakthrough technology that allows direct mind-to-machine interface.',
        tags: ['technology', 'neural', 'interface'],
        rules: ['Requires surgical implantation', 'Can be hacked by skilled cybercriminals', 'Prolonged use causes personality changes']
      }
    ],
    Item: [
      {
        name: 'Plasma Blade',
        description: 'A weapon that generates a superheated plasma edge capable of cutting through most materials.',
        tags: ['weapon', 'plasma', 'cutting'],
        rules: ['Battery lasts only 30 minutes', 'Generates extreme heat', 'Requires specialized training to use safely']
      }
    ],
    Custom: []
  }
};

// Fallback suggestions for other genres
const DEFAULT_SUGGESTIONS: Record<StoryBibleEntry['type'], SuggestionTemplate[]> = {
  Character: [
    {
      name: 'Alex Morgan',
      description: 'A determined protagonist with a complex past and unclear motivations.',
      tags: ['protagonist', 'mysterious', 'determined'],
      rules: ['Has a secret they\'re hiding', 'Always helps others in need', 'Avoids talking about their past']
    }
  ],
  Location: [
    {
      name: 'The Old Lighthouse',
      description: 'An abandoned lighthouse that holds secrets from the past.',
      tags: ['lighthouse', 'abandoned', 'secrets'],
      rules: ['Only accessible at low tide', 'Strange lights appear at midnight', 'Local legends surround it']
    }
  ],
  Lore: [
    {
      name: 'The Lost Expedition',
      description: 'A mysterious expedition that disappeared decades ago, leaving only cryptic clues.',
      tags: ['expedition', 'mystery', 'lost'],
      rules: ['Clues appear in unexpected places', 'Members had diverse backgrounds', 'Their goal remains unknown']
    }
  ],
  Item: [
    {
      name: 'Antique Pocket Watch',
      description: 'An old pocket watch with strange engravings that seems to run differently for each owner.',
      tags: ['watch', 'antique', 'time'],
      rules: ['Time moves differently when carried', 'Engravings change based on owner', 'Cannot be sold or given away easily']
    }
  ],
  Custom: [
    {
      name: 'Custom Entry',
      description: 'A unique element specific to your story world.',
      tags: ['custom', 'unique'],
      rules: ['Define your own rules and properties']
    }
  ]
};

export const generateSuggestion = async (
  type: StoryBibleEntry['type'],
  options: SuggestionOptions = {}
): Promise<SuggestionTemplate> => {
  const { genre = 'Fantasy' } = options;
  
  // Get suggestions for the specified genre, fallback to default
  const genreSuggestions = SUGGESTION_POOLS[genre] || DEFAULT_SUGGESTIONS;
  const suggestions = genreSuggestions[type] || DEFAULT_SUGGESTIONS[type];
  
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
  const suggestion = suggestions[randomIndex];
  
  // Customize based on culture if provided
  if (options.culture) {
    return customizeByCulture(suggestion, options.culture);
  }
  
  return suggestion;
};

const customizeByCulture = (suggestion: SuggestionTemplate, culture: string): SuggestionTemplate => {
  const culturalModifiers: Record<string, { namePrefix?: string, tagSuffix?: string, ruleAddition?: string }> = {
    'Nordic': { namePrefix: 'Bjorn', tagSuffix: 'nordic', ruleAddition: 'Follows ancient Nordic traditions' },
    'Celtic': { namePrefix: 'Cian', tagSuffix: 'celtic', ruleAddition: 'Connected to Celtic mysticism' },
    'Asian': { namePrefix: 'Kenji', tagSuffix: 'eastern', ruleAddition: 'Follows principles of honor and balance' },
    'African': { namePrefix: 'Amara', tagSuffix: 'african', ruleAddition: 'Respects ancestral wisdom' },
    'Medieval': { tagSuffix: 'medieval', ruleAddition: 'Bound by medieval customs and laws' },
    'Futuristic': { tagSuffix: 'futuristic', ruleAddition: 'Adapted to advanced technology' }
  };

  const modifier = culturalModifiers[culture];
  if (!modifier) return suggestion;

  return {
    ...suggestion,
    name: modifier.namePrefix ? `${modifier.namePrefix} ${suggestion.name.split(' ')[1] || suggestion.name}` : suggestion.name,
    tags: modifier.tagSuffix ? [...suggestion.tags, modifier.tagSuffix] : suggestion.tags,
    rules: modifier.ruleAddition ? [...suggestion.rules, modifier.ruleAddition] : suggestion.rules
  };
};

// Cache for performance optimization
const suggestionCache = new Map<string, SuggestionTemplate>();

export const getCachedSuggestion = async (
  type: StoryBibleEntry['type'],
  options: SuggestionOptions = {}
): Promise<SuggestionTemplate> => {
  const cacheKey = `${type}-${options.genre || 'default'}-${options.culture || 'default'}`;
  
  if (suggestionCache.has(cacheKey)) {
    return suggestionCache.get(cacheKey)!;
  }
  
  const suggestion = await generateSuggestion(type, options);
  suggestionCache.set(cacheKey, suggestion);
  
  // Clear cache after 5 minutes to prevent memory issues
  setTimeout(() => {
    suggestionCache.delete(cacheKey);
  }, 5 * 60 * 1000);
  
  return suggestion;
};

export const getAvailableGenres = () => GENRES;
export const getAvailableCultures = () => CULTURES;
