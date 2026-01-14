/**
 * Weighted random shuffle that prioritizes items with higher scores
 * but still introduces randomness
 * 
 * @param items - Array of items to shuffle
 * @param getScore - Function to get priority score for each item (higher = better)
 * @param randomnessFactor - How much randomness to apply (0-1, higher = more random)
 * @returns Shuffled array with weighted randomization
 */
export function weightedRandomShuffle<T>(
  items: T[],
  getScore: (item: T) => number,
  randomnessFactor: number = 0.3
): T[] {
  if (items.length === 0) return [];
  
  // Calculate scores for all items
  const itemsWithScores = items.map(item => ({
    item,
    score: getScore(item)
  }));
  
  // Normalize scores to 0-1 range
  const maxScore = Math.max(...itemsWithScores.map(i => i.score), 1);
  const normalized = itemsWithScores.map(i => ({
    ...i,
    normalizedScore: i.score / maxScore
  }));
  
  // Shuffle with weighted probability
  const shuffled: T[] = [];
  const remaining = [...normalized];
  
  while (remaining.length > 0) {
    // Calculate selection probabilities
    // Higher score = higher base probability
    // Randomness factor adds variance
    const probabilities = remaining.map(({ normalizedScore }) => {
      const baseProbability = normalizedScore;
      const randomComponent = Math.random() * randomnessFactor;
      return baseProbability + randomComponent;
    });
    
    // Normalize probabilities to sum to 1
    const sum = probabilities.reduce((a, b) => a + b, 0);
    const normalizedProbs = probabilities.map(p => p / sum);
    
    // Select item based on weighted probability
    const random = Math.random();
    let cumulative = 0;
    let selectedIndex = 0;
    
    for (let i = 0; i < normalizedProbs.length; i++) {
      cumulative += normalizedProbs[i];
      if (random <= cumulative) {
        selectedIndex = i;
        break;
      }
    }
    
    // Add selected item to result and remove from remaining
    shuffled.push(remaining[selectedIndex].item);
    remaining.splice(selectedIndex, 1);
  }
  
  return shuffled;
}

