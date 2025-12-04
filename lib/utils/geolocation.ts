/**
 * IP Geolocation Utility
 * Provides location data from IP addresses using ipapi.co
 */

export interface LocationData {
  country: string | null; // ISO country code (e.g., 'US', 'GB')
  countryName: string | null; // Full country name
  region: string | null; // State/province
  city: string | null; // City name
  timezone: string | null; // IANA timezone
}

/**
 * Get location data from an IP address
 * Uses ipapi.co free tier (1,000 requests/day, no API key required)
 * Falls back gracefully if service is unavailable
 */
export async function getLocationFromIP(ipAddress: string | null | undefined): Promise<LocationData> {
  // Default null response
  const defaultLocation: LocationData = {
    country: null,
    countryName: null,
    region: null,
    city: null,
    timezone: null,
  };

  // Validate IP address
  if (!ipAddress || ipAddress === "::1" || ipAddress === "127.0.0.1" || ipAddress.startsWith("192.168.") || ipAddress.startsWith("10.")) {
    // Localhost or private IP - no location data
    return defaultLocation;
  }

  try {
    // Use ipapi.co for geolocation
    const response = await fetch(`https://ipapi.co/${ipAddress}/json/`, {
      headers: {
        'User-Agent': 'Tech Upkeep Newsletter/1.0',
      },
      // Timeout after 3 seconds
      signal: AbortSignal.timeout(3000),
    });

    if (!response.ok) {
      console.warn(`Geolocation API error for IP ${ipAddress}: ${response.status}`);
      return defaultLocation;
    }

    const data = await response.json();

    // Check for error in response
    if (data.error) {
      console.warn(`Geolocation error for IP ${ipAddress}:`, data.reason);
      return defaultLocation;
    }

    return {
      country: data.country_code || null,
      countryName: data.country_name || null,
      region: data.region || null,
      city: data.city || null,
      timezone: data.timezone || null,
    };
  } catch (error) {
    // Log error but don't throw - location tracking should never break the main flow
    console.error(`Failed to get location for IP ${ipAddress}:`, error);
    return defaultLocation;
  }
}

/**
 * Extract client IP address from Next.js request headers
 * Checks common headers used by proxies and load balancers
 */
export function getClientIP(headers: Headers): string | null {
  // Check common headers in order of preference
  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    // x-forwarded-for can be comma-separated list, take first IP
    const ips = forwardedFor.split(',').map(ip => ip.trim());
    return ips[0];
  }

  const realIP = headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  const cfConnectingIP = headers.get('cf-connecting-ip'); // Cloudflare
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  // Fall back to remote address if available
  const remoteAddr = headers.get('x-vercel-forwarded-for'); // Vercel
  if (remoteAddr) {
    return remoteAddr;
  }

  return null;
}

/**
 * Simple audience detection based on email domain
 * Can be enhanced with more sophisticated logic later
 */
export function detectAudience(email: string): {
  audience: string;
  companySize: string;
  seniority: string;
} {
  const domain = email.split('@')[1]?.toLowerCase();

  // Enterprise domains (rough heuristic)
  const enterpriseDomains = ['google.com', 'microsoft.com', 'amazon.com', 'apple.com', 'meta.com', 'facebook.com', 'netflix.com', 'uber.com'];

  // Free email providers
  const freeProviders = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'protonmail.com'];

  let companySize = 'unknown';
  if (domain && enterpriseDomains.includes(domain)) {
    companySize = 'enterprise';
  } else if (domain && freeProviders.includes(domain)) {
    companySize = 'unknown'; // Can't determine from free email
  }

  // Default audience for tech newsletter subscribers
  return {
    audience: 'developer', // Default assumption for tech newsletter
    companySize,
    seniority: 'unknown', // Will be enriched over time through engagement patterns
  };
}
