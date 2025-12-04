import crypto from 'crypto';
import { distance } from 'fastest-levenshtein';

/**
 * Normalize URL for better duplicate detection
 * Removes tracking parameters, fragments, and trailing slashes
 */
export function normalizeURL(url: string): string {
  try {
    const urlObj = new URL(url);
    // Remove common tracking parameters
    const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
                           'ref', 'source', 'fbclid', 'gclid', 'mc_cid', 'mc_eid'];
    trackingParams.forEach(param => urlObj.searchParams.delete(param));

    // Remove fragment
    urlObj.hash = '';

    // Convert to string and remove trailing slash
    let normalized = urlObj.toString();
    if (normalized.endsWith('/')) {
      normalized = normalized.slice(0, -1);
    }

    return normalized.toLowerCase();
  } catch (error) {
    // If URL parsing fails, just return cleaned version
    return url.split('?')[0].split('#')[0].replace(/\/$/, '').toLowerCase();
  }
}

/**
 * Generate content hash from title and summary
 * Used for duplicate detection even when URLs differ
 */
export function generateContentHash(title: string, summary: string): string {
  const normalized = `${title}|${summary}`
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
  return crypto.createHash('md5').update(normalized).digest('hex');
}

/**
 * Check if two titles are similar using Levenshtein distance
 * Returns true if similarity is above threshold (default 85%)
 */
export function isSimilarTitle(title1: string, title2: string, threshold: number = 0.85): boolean {
  const t1 = title1.toLowerCase().trim();
  const t2 = title2.toLowerCase().trim();

  if (t1 === t2) return true;

  const dist = distance(t1, t2);
  const maxLen = Math.max(t1.length, t2.length);

  if (maxLen === 0) return true;

  const similarity = 1 - (dist / maxLen);
  return similarity >= threshold;
}

/**
 * Calculate quality score for content (0-100)
 * Based on source reputation, engagement, recency, and relevance
 */
export interface QualityMetrics {
  sourceType: string;
  sourceName: string;
  engagementScore: number;
  publishedAt: Date;
  title: string;
  summary: string;
}

export function calculateQualityScore(metrics: QualityMetrics): number {
  let score = 0;

  // 1. Source Reputation (0-30 points)
  score += getSourceReputationScore(metrics.sourceType, metrics.sourceName);

  // 2. Engagement Score (0-40 points)
  score += getEngagementPoints(metrics.sourceType, metrics.engagementScore);

  // 3. Recency Score (0-20 points)
  score += getRecencyScore(metrics.publishedAt);

  // 4. Relevance Score (0-10 points)
  score += getRelevanceScore(metrics.title, metrics.summary);

  return Math.min(Math.round(score), 100);
}

/**
 * Source reputation scoring
 */
function getSourceReputationScore(sourceType: string, sourceName: string): number {
  const reputationScores: Record<string, number> = {
    // Articles - top tier
    'TechCrunch': 30,
    'The Verge': 30,
    'Ars Technica': 30,
    'WIRED': 30,
    'Hacker News': 28,
    'The Guardian Tech': 28,
    'Engadget': 25,
    'ZDNet': 25,
    'The Next Web': 25,

    // Developer-focused
    'DEV Community': 25,
    'CSS-Tricks': 25,
    'Smashing Magazine': 28,

    // Substack - high quality
    'Stratechery': 30,
    'Pragmatic Engineer': 30,
    'Lenny\'s Newsletter': 28,
    'Platformer': 28,
    'The Generalist': 28,
    'Not Boring': 28,
    'Exponential View': 25,

    // Podcasts
    'Acquired': 28,
    'Lex Fridman': 30,
    'All-In': 28,
    'Lenny\'s Podcast': 28,
    '20VC': 25,
    'My First Million': 25,

    // Reddit - varies by subreddit
    'r/programming': 22,
    'r/technology': 20,
    'r/MachineLearning': 25,
    'r/webdev': 22,
    'r/artificial': 22,
    'r/datascience': 22,

    // Default scores by type
    'article_default': 20,
    'youtube_default': 18,
    'reddit_default': 15,
    'substack_default': 22,
    'podcast_default': 20,
  };

  // Check specific source
  if (reputationScores[sourceName]) {
    return reputationScores[sourceName];
  }

  // Fall back to source type default
  return reputationScores[`${sourceType}_default`] || 15;
}

/**
 * Engagement scoring (normalized to 0-40 points)
 */
function getEngagementPoints(sourceType: string, engagementScore: number): number {
  let normalizedScore = 0;

  switch (sourceType) {
    case 'reddit':
      // Reddit: 100 upvotes = 20pts, 500+ = 40pts
      normalizedScore = Math.min((engagementScore / 500) * 40, 40);
      break;

    case 'youtube':
      // YouTube: 10k views = 20pts, 100k+ = 40pts
      normalizedScore = Math.min((engagementScore / 100000) * 40, 40);
      break;

    case 'article':
      // Hacker News: 30 points = 20pts, 100+ = 40pts
      if (engagementScore > 0) {
        normalizedScore = Math.min((engagementScore / 100) * 40, 40);
      } else {
        normalizedScore = 20; // Default for articles without scores
      }
      break;

    case 'substack':
    case 'podcast':
      // For Substack/Podcasts, rely more on source reputation
      normalizedScore = 25;
      break;

    default:
      normalizedScore = 15;
  }

  return normalizedScore;
}

/**
 * Recency scoring (0-20 points)
 * Newer content scores higher
 */
function getRecencyScore(publishedAt: Date): number {
  const now = new Date();
  const ageInHours = (now.getTime() - publishedAt.getTime()) / (1000 * 60 * 60);

  if (ageInHours < 6) return 20;      // 0-6 hours: 20 points
  if (ageInHours < 12) return 18;     // 6-12 hours: 18 points
  if (ageInHours < 24) return 15;     // 12-24 hours: 15 points
  if (ageInHours < 48) return 10;     // 24-48 hours: 10 points
  if (ageInHours < 72) return 5;      // 48-72 hours: 5 points
  return 2;                            // 72+ hours: 2 points
}

/**
 * Relevance scoring based on tech keywords (0-10 points)
 */
function getRelevanceScore(title: string, summary: string): number {
  const text = `${title} ${summary}`.toLowerCase();

  const highValueKeywords = [
    'ai', 'artificial intelligence', 'machine learning', 'deep learning',
    'startup', 'funding', 'ipo', 'acquisition',
    'breakthrough', 'innovation', 'release', 'launch',
    'security breach', 'vulnerability', 'hack',
    'developer', 'programming', 'code', 'framework',
    'open source', 'github', 'api',
    'react', 'typescript', 'python', 'javascript', 'rust', 'go',
  ];

  let matches = 0;
  for (const keyword of highValueKeywords) {
    if (text.includes(keyword)) matches++;
  }

  // Cap at 10 points
  return Math.min(matches * 2, 10);
}

/**
 * Check if content passes minimum quality threshold
 */
export function meetsQualityThreshold(score: number, minThreshold: number = 50): boolean {
  return score >= minThreshold;
}

/**
 * Check if content is recent enough (within hours)
 */
export function isRecentEnough(publishedAt: Date, maxAgeInHours: number = 48): boolean {
  const now = new Date();
  const ageInHours = (now.getTime() - publishedAt.getTime()) / (1000 * 60 * 60);
  return ageInHours <= maxAgeInHours;
}
