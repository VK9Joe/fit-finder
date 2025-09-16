import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the CSV file
const csvPath = path.join(__dirname, '../../Breed Size Chart rev.2025.08.27 - Chart Measurements.csv');
const csvContent = fs.readFileSync(csvPath, 'utf8');

// Parse CSV content
const lines = csvContent.split('\n');
const headers = lines[1].split(','); // Skip first line, use second line as headers
const data = [];

// Process each data row (skip header rows)
for (let i = 2; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;
  
  const values = line.split(',');
  if (values.length < headers.length) continue;
  
  const row = {};
  headers.forEach((header, index) => {
    row[header.trim()] = values[index]?.trim() || '';
  });
  data.push(row);
}

// Convert to structured JSON format
const patterns = data.map((row, index) => {
  const patternCode = row.PATTERN;
  if (!patternCode) return null;
  
  // Extract pattern category and size from pattern code
  const category = patternCode.split('-')[0];
  const size = patternCode.split('-')[1];
  
  // Map pattern codes to readable names (from official documentation)
  const categoryNames = {
    'BG': 'Beagle',
    'BT': 'Boston Terrier', 
    'BX': 'Boxer',
    'CH': 'Chihuahua',
    'DA': 'Dachshund',
    'DP': 'Doberman Pinscher',
    'EB': 'English Bulldog',
    'FB': 'French Bulldog',
    'GD': 'Great Dane',
    'GH': 'Greyhound',
    'GR': 'Golden Retriever',
    'GSP': 'German Shorthaired Pointer',
    'IG': 'Italian Greyhound',
    'JR': 'Jack Russell Terrier',
    'MD': 'Miniature Dachshund',
    'MP': 'Miniature Pinscher',
    'MPD': 'Miniature Poodle',
    'PG': 'Pug',
    'RR': 'Rhodesian Ridgeback',
    'RT': 'Rat Terrier',
    'VS': 'Vizsla',
    'WM': 'Weimaraner',
    'WP': 'Whippet'
  };
  
  const categoryName = categoryNames[category] || 'Multi-Breed Compatible';
  
  // Convert measurements to numbers
  const parseNumber = (value) => {
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  };
  
  return {
    id: `pattern-${String(index + 1).padStart(3, '0')}`,
    name: `${categoryName} - ${size}`,
    breed: 'Multi-Breed Compatible',
    size: size,
    category: categoryName,
    patternCode: patternCode,
    measurements: {
      // Length measurements (using TW_Length as primary)
      minLength: parseNumber(row.Chart_Low || row.TW_Length),
      maxLength: parseNumber(row.Chart_High || row.TW_Length),
      
      // Neck measurements
      minNeck: parseNumber(row.Acceptable_Range_Neck_Low),
      maxNeck: parseNumber(row.Acceptable_Range_Neck_High),
      
      // Chest measurements  
      minChest: parseNumber(row.Chest_Acceptable_Low),
      maxChest: parseNumber(row.Chest_Acceptable_High),
      
      // Additional detailed measurements
      idealNeckMin: parseNumber(row.Ideal_Range_Neck_Low),
      idealNeckMax: parseNumber(row.Ideal_Range_Neck_High),
      idealChestMin: parseNumber(row.PATTERN_FINISHED_CHEST_MIN),
      idealChestMax: parseNumber(row.PATTERN_FINISHED_CHEST_MAX),
      
      // Multiple length options
      twLength: parseNumber(row.TW_Length),
      rcLength: parseNumber(row.RC_Length),
      wcLength: parseNumber(row.WC_Length),
      ccLength: parseNumber(row.CC_Length),
      
      // Pattern finished measurements
      patternFinishedNeck: parseNumber(row['PATTERN_FINISHED NECK']),
      patternFinishedChestMin: parseNumber(row.PATTERN_FINISHED_CHEST_MIN),
      patternFinishedChestMax: parseNumber(row.PATTERN_FINISHED_CHEST_MAX),
      
      // Legacy measurements for comparison
      oldNeckMin: parseNumber(row.Old_Chart_Neck_Low),
      oldNeckMax: parseNumber(row.Old_Chart_Neck_High),
      oldChestMin: parseNumber(row.PATTERN_FINISHED_CHEST_MIN),
      oldChestMax: parseNumber(row.PATTERN_FINISHED_CHEST_MAX),
      oldLengthMin: parseNumber(row.Chart_Low),
      oldLengthMax: parseNumber(row.Chart_High)
    },
    productId: patternCode.toLowerCase(),
    productUrl: `/products/${patternCode.toLowerCase()}`,
    price: calculatePrice(category, size),
    imageUrl: `/images/${patternCode.toLowerCase()}.jpg`,
    description: generateDescription(categoryName, size),
    features: generateFeatures(categoryName),
    targetBreeds: generateTargetBreeds(category)
  };
}).filter(Boolean);

// Helper functions
function calculatePrice(category, size) {
  const basePrices = {
    'BG': 59.99, 'BT': 79.99, 'BX': 89.99, 'CH': 69.99,
    'DA': 74.99, 'DP': 74.99, 'EB': 74.99, 'FB': 74.99,
    'GD': 84.99, 'GH': 74.99, 'GR': 74.99, 'GSP': 74.99,
    'IG': 74.99, 'JR': 74.99, 'MD': 74.99, 'MP': 74.99,
    'MPD': 74.99, 'PG': 74.99, 'RR': 74.99, 'RT': 74.99,
    'VS': 74.99, 'WM': 74.99, 'WP': 74.99
  };
  
  const sizeMultipliers = { 'S': 1, 'M': 1.1, 'L': 1.2, 'XL': 1.3, 'XS': 0.9 };
  const basePrice = basePrices[category] || 74.99;
  const multiplier = sizeMultipliers[size] || 1;
  
  return Math.round((basePrice * multiplier) * 100) / 100;
}

function generateDescription(categoryName, _size) {
  // Generate breed-specific descriptions
  return `Specialized protection designed specifically for ${categoryName} breeds. This pattern is tailored to the unique body proportions and characteristics of ${categoryName}s, ensuring optimal fit and comfort.`;
}

function generateFeatures(categoryName) {
  const featureMap = {
    'Basic Guard': ['Water-resistant', 'Easy care', 'Comfortable fit'],
    'Boot Trekker': ['Trail-ready', 'Abrasion resistant', 'Breathable'],
    'Box Coat': ['Professional grade', 'Enhanced coverage', 'Durable construction'],
    'Chill Guard': ['Temperature regulation', 'Lightweight', 'Moisture-wicking'],
    'Daily Adventure': ['Versatile design', 'Easy on/off', 'Machine washable'],
    'Guard Dog': ['Professional design', 'High visibility', 'Secure fit'],
    'Working Military': ['Military-grade materials', 'Tactical design', 'High durability'],
    'Working Police': ['Professional grade', 'High visibility', 'Secure fit']
  };
  
  return featureMap[categoryName] || ['Quality protection', 'Comfortable fit', 'Durable design'];
}

function generateTargetBreeds(category) {
  // Use the official breed mappings from the document
  const breedMappings = {
    'BG': ['Beagle'],
    'BT': ['Boston Terrier'],
    'BX': ['Boxer'],
    'CH': ['Chihuahua'],
    'DA': ['Dachshund'],
    'DP': ['Doberman Pinscher'],
    'EB': ['English Bulldog'],
    'FB': ['French Bulldog'],
    'GD': ['Great Dane'],
    'GH': ['Greyhound'],
    'GR': ['Golden Retriever', 'Labrador Retriever'], // GR has alternative breeds
    'GSP': ['German Shorthaired Pointer', 'Dalmatian'], // GSP has alternative breeds
    'IG': ['Italian Greyhound'],
    'JR': ['Jack Russell Terrier'],
    'MD': ['Miniature Dachshund'],
    'MP': ['Miniature Pinscher'],
    'MPD': ['Miniature Poodle'],
    'PG': ['Pug'],
    'RR': ['Rhodesian Ridgeback', 'German Shepherd'], // RR has alternative breeds
    'RT': ['Rat Terrier'],
    'VS': ['Vizsla'],
    'WM': ['Weimaraner'],
    'WP': ['Whippet']
  };
  
  return breedMappings[category] || ['Multi-Breed Compatible'];
}

// Create the final JSON structure
const jsonData = {
  patterns: patterns,
  metadata: {
    generatedAt: new Date().toISOString(),
    sourceFile: 'Breed Size Chart rev.2025.08.27 - Chart Measurements.csv',
    totalPatterns: patterns.length,
    categories: [...new Set(patterns.map(p => p.category))].sort(),
    sizes: [...new Set(patterns.map(p => p.size))].sort()
  }
};

// Write to output file
const outputPath = path.join(__dirname, '../../src/data/patternsFromCsv.json');
fs.writeFileSync(outputPath, JSON.stringify(jsonData, null, 2));

// Also create a TypeScript version for direct import
const tsContent = `// Auto-generated from CSV data - DO NOT EDIT MANUALLY
// Generated on: ${new Date().toISOString()}

import { CoatPattern } from '@/types';

export const patternsFromCsv: CoatPattern[] = ${JSON.stringify(patterns, null, 2)};

// Extract unique breeds for dropdown
export const dogBreedsFromCsv = [
  ...new Set(
    patternsFromCsv.flatMap(pattern => pattern.targetBreeds)
  ),
  'Mixed Breed',
  'Other'
].sort();

// Extract categories for filtering
export const productCategoriesFromCsv = [
  ...new Set(patternsFromCsv.map(pattern => pattern.category))
].sort();
`;

const tsOutputPath = path.join(__dirname, '../../src/data/patternsFromCsv.ts');
fs.writeFileSync(tsOutputPath, tsContent);

console.log('✅ Migration completed successfully!');
console.log(`📁 JSON file created: ${outputPath}`);
console.log(`📁 TypeScript file created: ${tsOutputPath}`);
console.log(`📊 Total patterns converted: ${patterns.length}`);
console.log(`🏷️  Categories found: ${jsonData.metadata.categories.length}`);
console.log(`📏 Sizes found: ${jsonData.metadata.sizes.join(', ')}`);
