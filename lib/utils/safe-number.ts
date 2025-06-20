/**
 * Safely convert a value to a number for display with toFixed
 * @param value - The value to convert (number, string, or undefined/null)
 * @param decimals - Number of decimal places (default 1)
 * @param fallback - Fallback value if conversion fails (default '0.0')
 */
export function safeToFixed(
  value: number | string | undefined | null,
  decimals: number = 1,
  fallback: string = '0.0'
): string {
  if (value === null || value === undefined) {
    return fallback
  }

  const num = typeof value === 'number' ? value : parseFloat(value)
  
  if (isNaN(num)) {
    return fallback
  }

  return num.toFixed(decimals)
}

/**
 * Check if a value can be converted to a valid number
 */
export function isValidNumber(value: any): boolean {
  if (value === null || value === undefined) {
    return false
  }
  
  const num = typeof value === 'number' ? value : parseFloat(value)
  return !isNaN(num) && isFinite(num)
}