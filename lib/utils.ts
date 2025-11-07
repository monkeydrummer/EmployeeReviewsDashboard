import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { CategoryRating } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Get the display text for a category rating
 */
export function getCategoryRatingText(rating: CategoryRating): string {
  if (!rating) return "Not Rated";
  
  switch (rating) {
    case "unsatisfactory":
      return "Unsatisfactory";
    case "needs-improvement":
      return "Needs Improvement";
    case "delivers":
      return "Delivers on Expectations";
    case "exceeds":
      return "Exceeds Expectations";
    case "distinguished":
      return "Distinguished";
    default:
      return "Not Rated";
  }
}

/**
 * Get the numeric level for a category rating (for PDF export)
 */
export function getCategoryRatingLevel(rating: CategoryRating): number {
  if (!rating) return 0;
  
  switch (rating) {
    case "unsatisfactory":
      return 1;
    case "needs-improvement":
      return 2;
    case "delivers":
      return 3;
    case "exceeds":
      return 4;
    case "distinguished":
      return 5;
    default:
      return 0;
  }
}

/**
 * Get the display text with level for a category rating (for PDF)
 */
export function getCategoryRatingTextWithLevel(rating: CategoryRating): string {
  if (!rating) return "Not Rated (0)";
  const text = getCategoryRatingText(rating);
  const level = getCategoryRatingLevel(rating);
  return `${text} (${level})`;
}

/**
 * Get color class for a category rating
 */
export function getCategoryRatingColor(rating: CategoryRating): string {
  if (!rating) return "bg-gray-100 text-gray-800";
  
  switch (rating) {
    case "unsatisfactory":
      return "bg-red-100 text-red-800";
    case "needs-improvement":
      return "bg-orange-100 text-orange-800";
    case "delivers":
      return "bg-yellow-100 text-yellow-800";
    case "exceeds":
      return "bg-green-100 text-green-800";
    case "distinguished":
      return "bg-blue-100 text-blue-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

/**
 * Format overall score for display
 */
export function formatOverallScore(score: number | null): string {
  if (score === null) return "Not Rated";
  return score.toFixed(2);
}

/**
 * Get status badge color
 */
export function getStatusColor(status: string): string {
  switch (status) {
    case "pending":
      return "bg-gray-100 text-gray-800";
    case "employee-submitted":
      return "bg-blue-100 text-blue-800";
    case "manager-submitted":
      return "bg-purple-100 text-purple-800";
    case "completed":
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

/**
 * Format status text for display
 */
export function formatStatus(status: string): string {
  switch (status) {
    case "pending":
      return "Pending";
    case "employee-submitted":
      return "Employee Submitted";
    case "manager-submitted":
      return "Manager Submitted";
    case "completed":
      return "Completed";
    default:
      return status;
  }
}

/**
 * Format period for display
 */
export function formatPeriod(period: string): string {
  switch (period) {
    case "mid-year":
      return "Mid-Year";
    case "end-year":
      return "End-Year";
    default:
      return period;
  }
}

