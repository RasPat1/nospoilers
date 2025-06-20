/**
 * Safely convert vote_average to a number and format it
 * Handles both string and number inputs from database
 */
export function formatVoteAverage(voteAverage: string | number | undefined): string | null {
  if (!voteAverage) return null;
  
  const numValue = typeof voteAverage === 'string' ? parseFloat(voteAverage) : voteAverage;
  
  if (isNaN(numValue) || numValue <= 0) return null;
  
  return numValue.toFixed(1);
}

/**
 * Check if vote average is valid for display
 */
export function hasValidVoteAverage(voteAverage: string | number | undefined): boolean {
  if (!voteAverage) return false;
  
  const numValue = typeof voteAverage === 'string' ? parseFloat(voteAverage) : voteAverage;
  
  return !isNaN(numValue) && numValue > 0;
}