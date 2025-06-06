// Helper function to get color based on days since last contact/action
export function getTimeBasedColor(lastDate: number | undefined, maxDays: number, baseColor: string) {
  if (!lastDate) return "text-gray-400";
  
  const today = new Date();
  const daysSince = Math.floor((today.getTime() - lastDate) / (1000 * 60 * 60 * 24));
  
  if (daysSince >= maxDays) {
    return "text-red-600 font-bold"; // Overdue
  } else if (daysSince >= maxDays * 0.8) {
    return "text-red-500 font-medium"; // 80-100% of time elapsed
  } else if (daysSince >= maxDays * 0.6) {
    return "text-orange-500 font-medium"; // 60-80% of time elapsed
  } else if (daysSince >= maxDays * 0.4) {
    return "text-yellow-600 font-medium"; // 40-60% of time elapsed
  } else {
    return `${baseColor} font-medium`; // Less than 40% of time elapsed
  }
}

// Helper function to get color for upcoming dates
export function getUpcomingDateColor(futureDate: Date, daysThreshold: number, baseColor: string) {
  const today = new Date();
  const daysUntil = Math.ceil((futureDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysUntil <= 0) {
    return "text-red-600 font-bold"; // Overdue
  } else if (daysUntil <= daysThreshold * 0.2) {
    return "text-red-500 font-medium"; // Within 20% of threshold
  } else if (daysUntil <= daysThreshold * 0.4) {
    return "text-orange-500 font-medium"; // Within 40% of threshold
  } else if (daysUntil <= daysThreshold * 0.6) {
    return "text-yellow-600 font-medium"; // Within 60% of threshold
  } else {
    return `${baseColor} font-medium`; // More than 60% of time remaining
  }
} 