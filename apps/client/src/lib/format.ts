export function formatDate(date: string, month: 'short' | 'long' = 'short'): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month,
    day: 'numeric',
  })
}
