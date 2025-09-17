/**
 * Comprehensive list of dog breeds for autocomplete functionality
 * Based on the provided breed list with enhanced fuzzy matching support
 */

export const COMPREHENSIVE_BREED_LIST = [
  'breed not listed',
  'mixed breed',
  'affenpinscher',
  'afghan hound',
  'airedale terrier',
  'akita',
  'alaskan malamute',
  'american bulldog',
  'american eskimo dog',
  'american pit bull terrier',
  'american staffordshire terrier',
  'australian cattle dog',
  'australian shepherd',
  'basenji',
  'basset hound',
  'beagle',
  'belgian malinois',
  'bernese mountain dog',
  'bichon frise',
  'bloodhound',
  'border collie',
  'border terrier',
  'boston terrier',
  'boxer',
  'brussels griffon',
  'bull terrier',
  'bulldog',
  'cairn terrier',
  'cane corso',
  'cardigan welsh corgi',
  'catahoula leopard dog',
  'cavalier king charles spaniel',
  'chihuahua',
  'chinese crested',
  'chow chow',
  'cocker spaniel',
  'collie',
  'dachshund',
  'dalmatian',
  'doberman pinscher',
  'english bulldog',
  'english cocker spaniel',
  'english setter',
  'english springer spaniel',
  'fox terrier',
  'french bulldog',
  'german shepherd',
  'german shorthaired pointer',
  'german wirehaired pointer',
  'golden retriever',
  'great dane',
  'great pyrenees',
  'greyhound',
  'havanese',
  'husky',
  'siberian husky',
  'irish setter',
  'irish terrier',
  'irish wolfhound',
  'italian greyhound',
  'jack russell terrier',
  'japanese chin',
  'japanese spitz',
  'keeshond',
  'labrador retriever',
  'maltese',
  'miniature dachshund',
  'miniature pinscher',
  'miniature poodle',
  'miniature schnauzer',
  'newfoundland',
  'papillon',
  'pekingese',
  'pembroke welsh corgi',
  'pointer',
  'portuguese water dog',
  'pug',
  'rat terrier',
  'rhodesian ridgeback',
  'rottweiler',
  'saint bernard',
  'samoyed',
  'scottish terrier',
  'shetland sheepdog',
  'shiba inu',
  'shih tzu',
  'staffordshire bull terrier',
  'standard poodle',
  'toy poodle',
  'poodle',
  'vizsla',
  'weimaraner',
  'welsh springer spaniel',
  'west highland white terrier',
  'whippet',
  'wirehaired dachshund',
  'yorkshire terrier'
] as const;

/**
 * Common breed abbreviations and alternate names for fuzzy matching
 */
export const BREED_ALIASES: Record<string, string[]> = {
  'golden retriever': ['golden', 'goldens', 'retriever'],
  'labrador retriever': ['lab', 'labrador', 'labs', 'labradors'],
  'german shepherd': ['gsd', 'german shepard', 'german sheperd', 'shepherd'],
  'boston terrier': ['boston', 'bostons'],
  'jack russell terrier': ['jack russell', 'jrt', 'jack russel'],
  'yorkshire terrier': ['yorkie', 'yorkies', 'york terrier'],
  'west highland white terrier': ['westie', 'westies', 'west highland'],
  'american staffordshire terrier': ['amstaff', 'am staff'],
  'english springer spaniel': ['springer spaniel', 'springer'],
  'welsh springer spaniel': ['welsh springer'],
  'cavalier king charles spaniel': ['cavalier', 'cavaliers', 'king charles'],
  'american pit bull terrier': ['pit bull', 'pitbull', 'pittie'],
  'portuguese water dog': ['portie', 'porties', 'portuguese water'],
  'chinese crested': ['chinese crested dog'],
  'cardigan welsh corgi': ['cardigan corgi', 'cardigan'],
  'pembroke welsh corgi': ['pembroke corgi', 'pembroke', 'corgi'],
  'miniature dachshund': ['mini dachshund', 'mini doxie'],
  'wirehaired dachshund': ['wire dachshund', 'wirehair dachshund'],
  'miniature pinscher': ['min pin', 'miniature pin'],
  'doberman pinscher': ['doberman', 'dobermann', 'dobie'],
  'german shorthaired pointer': ['gsp', 'german pointer'],
  'german wirehaired pointer': ['gwp', 'german wirehair'],
  'great dane': ['dane', 'danes'],
  'great pyrenees': ['pyr', 'pyrs', 'pyrenees'],
  'saint bernard': ['st bernard', 'saint'],
  'italian greyhound': ['iggy', 'iggies', 'italian grey'],
  'french bulldog': ['frenchie', 'frenchies', 'french bull'],
  'english bulldog': ['english bull', 'bulldog'],
  'bull terrier': ['bully', 'bull terr'],
  'staffordshire bull terrier': ['staffy', 'staffie', 'staff'],
  'brussels griffon': ['brussels griff', 'griffon'],
  'bichon frise': ['bichon'],
  'shih tzu': ['shitzu', 'shih-tzu'],
  'shetland sheepdog': ['sheltie', 'shelties', 'shetland'],
  'standard poodle': ['standard pood', 'poodle'],
  'miniature poodle': ['mini poodle', 'toy poodle'],
  'australian cattle dog': ['acd', 'blue heeler', 'red heeler', 'cattle dog'],
  'australian shepherd': ['aussie', 'aussies', 'australian shep'],
  'belgian malinois': ['malinois', 'mal', 'belgian mal'],
  'rhodesian ridgeback': ['ridgeback', 'rhodesian'],
  'alaskan malamute': ['malamute', 'mal'],
  'bernese mountain dog': ['berner', 'berners', 'bernese'],
  'catahoula leopard dog': ['catahoula'],
  'american eskimo dog': ['eskie', 'eskies', 'american eskimo'],
  'siberian husky': ['husky', 'huskies'],
  'poodle': ['pood', 'standard poodle', 'toy poodle', 'miniature poodle']
};

/**
 * Calculate similarity score between two strings using Levenshtein distance
 * and additional fuzzy matching techniques
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix = [];
  
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[b.length][a.length];
}

/**
 * Calculate fuzzy match score between search term and breed name
 * Returns a score between 0 and 1 (1 = perfect match)
 */
function calculateMatchScore(searchTerm: string, breedName: string): number {
  const search = searchTerm.toLowerCase().trim();
  const breed = breedName.toLowerCase();
  
  // Exact match
  if (search === breed) return 1.0;
  
  // Starts with match
  if (breed.startsWith(search)) return 0.95;
  
  // Contains match
  if (breed.includes(search)) return 0.85;
  
  // Check aliases
  const aliases = BREED_ALIASES[breedName] || [];
  for (const alias of aliases) {
    const aliasLower = alias.toLowerCase();
    if (aliasLower === search) return 0.9;
    if (aliasLower.startsWith(search)) return 0.8;
    if (aliasLower.includes(search)) return 0.7;
  }
  
  // Word-based matching (useful for multi-word breeds)
  const searchWords = search.split(/\s+/);
  const breedWords = breed.split(/\s+/);
  
  let wordMatches = 0;
  for (const searchWord of searchWords) {
    for (const breedWord of breedWords) {
      if (breedWord.startsWith(searchWord)) {
        wordMatches++;
        break;
      }
    }
  }
  
  if (wordMatches > 0) {
    const wordMatchRatio = wordMatches / searchWords.length;
    return 0.6 * wordMatchRatio;
  }
  
  // Levenshtein distance-based fuzzy matching
  const maxLength = Math.max(search.length, breed.length);
  if (maxLength > 0) {
    const distance = levenshteinDistance(search, breed);
    const similarity = 1 - (distance / maxLength);
    
    // Only consider if similarity is reasonable
    if (similarity > 0.6) {
      return similarity * 0.5;
    }
  }
  
  return 0;
}

/**
 * Search for breeds using fuzzy matching
 * Returns sorted results by relevance score
 */
export function searchBreeds(searchTerm: string, maxResults: number = 10): Array<{
  breed: string;
  score: number;
}> {
  if (!searchTerm.trim()) {
    return COMPREHENSIVE_BREED_LIST.slice(0, maxResults).map(breed => ({
      breed,
      score: 1
    }));
  }
  
  const results = COMPREHENSIVE_BREED_LIST
    .map(breed => ({
      breed,
      score: calculateMatchScore(searchTerm, breed)
    }))
    .filter(result => result.score > 0.3) // Only include reasonable matches
    .sort((a, b) => b.score - a.score) // Sort by score descending
    .slice(0, maxResults);
  
  // Always ensure "breed not listed" appears if no good matches and search is long enough
  if (results.length === 0 && searchTerm.trim().length > 2) {
    results.push({ breed: 'breed not listed', score: 0.5 });
  }
  
  return results;
}

/**
 * Format breed name for display (capitalize first letter of each word)
 */
export function formatBreedName(breed: string): string {
  return breed
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
