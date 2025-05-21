
/**
 * Format a date to a human-readable string
 * @param date - The date to format
 * @returns Formatted date string (e.g., "May 21, 2025")
 */
export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }).format(date);
};

/**
 * Format a date to a relative time string
 * @param date - The date to format
 * @returns Relative time string (e.g., "2 hours ago", "just now")
 */
export const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInSecs = Math.floor(diffInMs / 1000);
  const diffInMins = Math.floor(diffInSecs / 60);
  const diffInHours = Math.floor(diffInMins / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInSecs < 60) {
    return 'just now';
  } else if (diffInMins < 60) {
    return `${diffInMins} ${diffInMins === 1 ? 'minute' : 'minutes'} ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
  } else if (diffInDays < 30) {
    return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
  } else {
    return formatDate(date);
  }
};

/**
 * Get difference between two dates in days
 * @param date1 - The first date
 * @param date2 - The second date (defaults to now)
 * @returns Number of days between dates
 */
export const getDaysDifference = (date1: Date, date2: Date = new Date()): number => {
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

/**
 * Check if a deadline is approaching (within 7 days)
 * @param deadline - The deadline date
 * @returns Boolean indicating if the deadline is approaching
 */
export const isDeadlineApproaching = (deadline: Date): boolean => {
  const daysRemaining = getDaysDifference(new Date(), deadline);
  return daysRemaining <= 7 && daysRemaining > 0;
};

/**
 * Check if a deadline has passed
 * @param deadline - The deadline date
 * @returns Boolean indicating if the deadline has passed
 */
export const isDeadlinePassed = (deadline: Date): boolean => {
  return new Date() > deadline;
};
