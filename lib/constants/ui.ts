/**
 * UI configuration constants
 */

export const UI_DELAYS = {
  DIALOG_AUTO_CLOSE: 2000,
  DEBOUNCE_REFETCH: 500,
  TOAST_DISPLAY: 3000,
  ANIMATION_DURATION: 300,
} as const;

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  CONTENT_LOAD_LIMIT: 50,
} as const;

export const STATUS_LABELS: Record<string, string> = {
  pending: "Pending Review",
  accepted: "Accepted",
  discarded: "Discarded",
  sent: "Already Sent",
  draft: "Draft",
  finalized: "Ready to Send",
  scheduled: "Scheduled",
} as const;

export const MODE_LABELS: Record<string, string> = {
  auto: "Auto Selection (AI Picks)",
  manual: "Manual Selection (You Choose)",
} as const;

export const CONTENT_INSTRUCTIONS = {
  SCRAPE_STEPS: [
    "Auto-scrapes latest content from all sources",
    "Deduplicates by URL, hash, and title similarity",
    "Auto-categorizes based on keywords",
    "Calculates quality score for each article",
  ] as const,
  ARTICLE_SELECTION: [
    "Select 3-5 articles for best results",
    "Use ↑↓ buttons to reorder selected articles",
  ] as const,
  NEWSLETTER_TIPS: [
    "Edit subject line and preview text",
    "Reorganize articles by category",
    "Discard articles that don't fit",
    "Preview full newsletter before sending",
  ] as const,
} as const;
