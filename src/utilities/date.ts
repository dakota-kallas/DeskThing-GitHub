export function formatTimeDifference(startDate: Date, endDate: Date): string {
  // Normalize to only the time portion (ignoring the date)
  const startTime = new Date(startDate);
  startTime.setFullYear(1970, 0, 1); // Set arbitrary date to focus only on the time
  const endTime = new Date(endDate);
  endTime.setFullYear(1970, 0, 1); // Same here

  // If the endTime is earlier in the day than startTime, add 24 hours to endTime
  if (endTime < startTime) {
    endTime.setDate(endTime.getDate() + 1); // Add one day to endTime
  }

  const diffInMilliseconds = endTime.getTime() - startTime.getTime();

  // Calculate time difference components
  const seconds = Math.floor(diffInMilliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  const remainingHours = hours % 24;
  const remainingMinutes = minutes % 60;

  // Construct the time difference string
  let timeDiffString = '';

  if (remainingHours > 0) {
    timeDiffString += `${remainingHours}hr`;
  }

  if (remainingMinutes > 0) {
    if (timeDiffString) timeDiffString += ' ';
    timeDiffString += `${remainingMinutes}min`;
  }

  // Handle edge case for exact 0 minutes
  if (timeDiffString === '') {
    timeDiffString = `just now`;
  }

  return timeDiffString;
}

/**
 * Given 2 time strings (HH:MM AM/PM), returns the time difference (to be dispalyed) between them
 * @param currentTime HH:MM AM/PM
 * @param diffTime HH:MM AM/PM
 * @returns
 */
export function getTimeDifference(currentTime: string, diffTime?: string) {
  let dateDisplay: string | null = null;

  if (diffTime) {
    const newsDate = new Date(`1970-01-01 ${diffTime}`);
    newsDate.setSeconds(0);
    newsDate.setMilliseconds(0);
    const date = new Date(`1970-01-01 ${currentTime}`);
    date.setSeconds(0);
    date.setMilliseconds(0);
    dateDisplay = formatTimeDifference(newsDate, date);

    if (dateDisplay !== 'just now') {
      dateDisplay += ' ago';
    }
  }

  return dateDisplay;
}
