import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

import { formatDistanceToNowStrict, format, differenceInHours } from "date-fns";

export function formatRelativeDate(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;

  const hoursAgo = differenceInHours(new Date(), d);

  if (hoursAgo < 24) {
    return formatDistanceToNowStrict(d, { addSuffix: true });
  }

  return format(d, "MMM d, yyyy, h:mm a");
}
