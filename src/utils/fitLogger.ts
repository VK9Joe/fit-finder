import { UserInput, CoatPattern, AdvancedFitResult } from '@/types';

interface ScoreBreakdown {
  neckScore: number;
  chestScore: number;
  lengthScore: number;
  finalScore: number;
  breedMatch: boolean;
  pattern: CoatPattern;
  userInput: UserInput;
}

/**
 * Log detailed scoring breakdown for a pattern fit calculation
 */
export function logScoreBreakdown(breakdown: ScoreBreakdown): void {
  const { pattern, userInput, neckScore, chestScore, lengthScore, finalScore, breedMatch } = breakdown;
  
  console.group(`🎯 Fit Analysis: ${pattern.name} (${pattern.patternCode})`);
  
  // User measurements summary
  console.log('📏 Your Dog\'s Measurements:');
  console.log(`   Neck: ${userInput.neckCircumference}"  |  Chest: ${userInput.chestCircumference}"  |  Length: ${userInput.backLength}"`);
  console.log(`   Breed: ${userInput.breed}  |  Tail: ${userInput.tailType}`);
  
  // Pattern measurements
  const measurements = pattern.measurements;
  console.log('📐 Pattern Specifications:');
  console.log(`   Neck Range: ${measurements.minNeck}" - ${measurements.maxNeck}"`);
  console.log(`   Chest Range: ${measurements.minChest}" - ${measurements.maxChest}"`);
  console.log(`   Pattern Length: ${measurements.twLength || measurements.minLength || 'N/A'}"`);
  
  // Breed matching
  console.log(`🐕 Breed Match: ${breedMatch ? '✅ Perfect match!' : '❌ No match (penalty applied)'}`);
  
  // Neck scoring breakdown
  console.group('🏷️ Neck Fit Analysis');
  console.log(`Your neck measurement: ${userInput.neckCircumference}"`);
  console.log(`Pattern neck range: ${measurements.minNeck}" to ${measurements.maxNeck}"`);
  if (measurements.idealNeckMin && measurements.idealNeckMax) {
    console.log(`Ideal range: ${measurements.idealNeckMin}" to ${measurements.idealNeckMax}"`);
  }
  
  if (userInput.neckCircumference < measurements.minNeck || userInput.neckCircumference > measurements.maxNeck) {
    console.log('❌ DISQUALIFIED: Neck measurement outside acceptable range');
  } else {
    console.log(`✅ Neck score: ${(neckScore * 100).toFixed(1)}% (using asymmetric bell curve)`);
    
    // Explain the scoring zone
    const idealLow = measurements.idealNeckMin || measurements.minNeck;
    const idealHigh = measurements.idealNeckMax || measurements.maxNeck;
    
    if (userInput.neckCircumference >= idealLow && userInput.neckCircumference <= idealHigh) {
      console.log('🎯 In ideal neck range - excellent fit!');
    } else if (userInput.neckCircumference < idealLow) {
      console.log('⚠️ Below ideal range - pattern may be slightly roomy');
    } else {
      console.log('⚠️ Above ideal range - pattern may be slightly snug');
    }
  }
  console.groupEnd();
  
  // Chest scoring breakdown
  console.group('👕 Chest Fit Analysis');
  console.log(`Your chest measurement: ${userInput.chestCircumference}"`);
  console.log(`Pattern chest range: ${measurements.minChest}" to ${measurements.maxChest}"`);
  
  const idealChest = measurements.minChest + 1.0;
  console.log(`Ideal chest measurement: ${idealChest}" (acceptable low + 1 inch)`);
  
  if (userInput.chestCircumference < measurements.minChest || userInput.chestCircumference > measurements.maxChest) {
    console.log('❌ DISQUALIFIED: Chest measurement outside acceptable range');
  } else {
    console.log(`✅ Chest score: ${(chestScore * 100).toFixed(1)}%`);
    
    const distanceFromIdeal = Math.abs(userInput.chestCircumference - idealChest);
    if (distanceFromIdeal <= 1.0) {
      console.log('🎯 Within 1" of ideal chest fit - excellent!');
    } else {
      console.log(`📏 ${distanceFromIdeal.toFixed(1)}" from ideal chest fit`);
    }
  }
  console.groupEnd();
  
  // Length scoring breakdown
  console.group('📏 Length Fit Analysis');
  const patternLength = measurements.twLength || measurements.minLength || 0;
  const lengthRatio = patternLength / userInput.backLength;
  
  console.log(`Your back length: ${userInput.backLength}"`);
  console.log(`Pattern length: ${patternLength}"`);
  console.log(`Length ratio: ${(lengthRatio * 100).toFixed(1)}% (pattern vs dog)`);
  console.log(`Tail type: ${userInput.tailType}`);
  
  // Explain ideal ranges and scoring logic based on tail type
  console.log('\n🎯 Length Matching Logic:');
  switch (userInput.tailType) {
    case 'down/tucked':
      console.log('   Ideal point: Dog length × 1.15 (115%)');
      console.log('   Scoring curve: 105-115% (rising), 115-125% (falling)');
      console.log('   Logic: Dogs with down/tucked tails can tolerate longer garments');
      break;
    case 'straight':
      console.log('   Ideal point: Dog length × 1.05 (105%)');
      console.log('   Scoring curve: 90-105% (rising), 105-110% (falling)');
      console.log('   Logic: Length must be precise to avoid interference or soiling');
      break;
    case 'bobbed/docked':
    case 'up or curly':
      console.log('   Ideal point: Dog length × 0.95 (95%)');
      console.log('   Scoring curve: 90-95% (rising), 95-105% (falling)');
      console.log('   Logic: Coverage preferred, but garment shouldn\'t extend too far');
      break;
  }
  
  // Show which scoring zone we're in
  let scoringZone = '';
  if (userInput.tailType === 'down/tucked') {
    if (lengthRatio >= 1.05 && lengthRatio < 1.15) {
      scoringZone = 'Rising curve (105-115%)';
    } else if (lengthRatio > 1.15 && lengthRatio <= 1.25) {
      scoringZone = 'Falling curve (115-125%)';
    } else if (lengthRatio === 1.15) {
      scoringZone = 'Perfect ideal point (115%)';
    } else {
      scoringZone = 'Outside ideal range (minimum score)';
    }
  } else if (userInput.tailType === 'straight') {
    if (lengthRatio >= 0.90 && lengthRatio < 1.05) {
      scoringZone = 'Rising curve (90-105%)';
    } else if (lengthRatio > 1.05 && lengthRatio <= 1.10) {
      scoringZone = 'Falling curve (105-110%)';
    } else if (lengthRatio === 1.05) {
      scoringZone = 'Perfect ideal point (105%)';
    } else {
      scoringZone = 'Outside ideal range (minimum score)';
    }
  } else if (userInput.tailType === 'bobbed/docked' || userInput.tailType === 'up or curly') {
    if (lengthRatio >= 0.90 && lengthRatio < 0.95) {
      scoringZone = 'Rising curve (90-95%)';
    } else if (lengthRatio > 0.95 && lengthRatio <= 1.05) {
      scoringZone = 'Falling curve (95-105%)';
    } else if (lengthRatio === 0.95) {
      scoringZone = 'Perfect ideal point (95%)';
    } else {
      scoringZone = 'Outside ideal range (minimum score)';
    }
  }
  
  console.log(`\n📍 Current position: ${scoringZone}`);
  console.log(`✅ Length score: ${(lengthScore * 100).toFixed(1)}%`);
  
  if (lengthScore < 0.75) {
    console.log('❌ DISQUALIFIED: Length score below 75% threshold');
  } else {
    console.log('✅ Length score meets minimum threshold');
  }
  console.groupEnd();
  
  // Final calculation
  console.group('🏁 Final Score Calculation');
  const avgScore = (neckScore + chestScore + lengthScore) / 3;
  console.log(`Average of three scores: ${(avgScore * 100).toFixed(1)}%`);
  console.log(`   (${(neckScore * 100).toFixed(1)}% + ${(chestScore * 100).toFixed(1)}% + ${(lengthScore * 100).toFixed(1)}%) ÷ 3`);
  
  if (!breedMatch) {
    console.log('❌ Breed penalty: -10% (breed doesn\'t match pattern)');
    console.log(`Final score: ${(avgScore * 100).toFixed(1)}% - 10% = ${(finalScore * 100).toFixed(1)}%`);
  } else {
    console.log(`✅ Final score: ${(finalScore * 100).toFixed(1)}% (no breed penalty)`);
  }
  
  // Fit category
  let category = '';
  if (finalScore >= 0.85) category = '🏆 Best Fit';
  else if (finalScore >= 0.65) category = '👍 Good Fit';
  else if (finalScore >= 0.5) category = '🤔 Might Fit';
  else category = '❌ Poor Fit';
  
  console.log(`Category: ${category}`);
  console.groupEnd();
  
  console.groupEnd();
}

/**
 * Log overall fit finding process
 */
export function logFitProcess(userInput: UserInput, results: AdvancedFitResult[]): void {
  console.group('🔍 Dog Coat Fit Finder - Analysis Complete');
  
  console.log('📊 Summary:');
  console.log(`   Total patterns analyzed: ${results.length}`);
  
  const qualified = results.filter(r => !r.disqualified);
  const bestFit = qualified.filter(r => r.finalScore >= 0.85);
  const goodFit = qualified.filter(r => r.finalScore >= 0.65 && r.finalScore < 0.85);
  const mightFit = qualified.filter(r => r.finalScore >= 0.5 && r.finalScore < 0.65);
  
  console.log(`   🏆 Best Fit patterns: ${bestFit.length}`);
  console.log(`   👍 Good Fit patterns: ${goodFit.length}`);
  console.log(`   🤔 Might Fit patterns: ${mightFit.length}`);
  console.log(`   ❌ Disqualified patterns: ${results.length - qualified.length}`);
  
  if (qualified.length > 0) {
    const topPattern = qualified[0];
    console.log(`\n🥇 Top recommendation: ${topPattern.pattern.name} (${(topPattern.finalScore * 100).toFixed(1)}%)`);
  }
  
  console.log('\n💡 How to read these results:');
  console.log('   • Best Fit (85%+): Excellent match, highly recommended');
  console.log('   • Good Fit (65-84%): Good match, should work well');
  console.log('   • Might Fit (50-64%): Acceptable match, some compromise');
  console.log('   • Poor Fit (<50%): Not recommended, significant fit issues');
  
  console.groupEnd();
}
