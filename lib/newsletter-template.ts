import type { Content, Category, Tag } from "./db/schema";
import { CURATOR_NAME, CURATOR_EMAIL } from "./constants";

interface ContentWithDetails extends Content {
  category?: Category | null;
  tags?: Tag[];
}

interface NewsletterTemplateOptions {
  contentByCategory: Map<string, ContentWithDetails[]>;
  headerContent?: string | null;
  footerContent?: string | null;
  userId?: number;
  newsletterSendId?: number;
  includeTracking?: boolean;
}

/**
 * Generates the HTML for the newsletter template
 * Used by both the email service and the preview
 */
export function generateNewsletterHTML(
  options: NewsletterTemplateOptions
): string {
  const {
    contentByCategory,
    headerContent,
    footerContent,
    userId,
    newsletterSendId,
    includeTracking = false,
  } = options;

  // Category color schemes
  const categoryColors: Record<string, { gradient: string; accent: string }> = {
    "System Design & Architecture": {
      gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      accent: "#667eea",
    },
    "Frontend Engineering": {
      gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
      accent: "#f093fb",
    },
    "Backend & APIs": {
      gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
      accent: "#4facfe",
    },
    "Cloud & DevOps": {
      gradient: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
      accent: "#43e97b",
    },
    AI: {
      gradient: "linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)",
      accent: "#ec4899",
    },
    Security: {
      gradient: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
      accent: "#ef4444",
    },
    "Developer Tools": {
      gradient: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
      accent: "#f59e0b",
    },
    "Career & Leadership": {
      gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
      accent: "#10b981",
    },
    "Product/Culture": {
      gradient: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
      accent: "#6366f1",
    },
    "Opinions & General": {
      gradient: "linear-gradient(135deg, #fb923c 0%, #f97316 100%)",
      accent: "#fb923c",
    },
    Uncategorized: {
      gradient: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
      accent: "#a8edea",
    },
  };

  // Category icons mapping
  const categoryIcons: Record<string, string> = {
    "System Design & Architecture": "📦",
    "Frontend Engineering": "⚛️",
    "Backend & APIs": "⚙️",
    "Cloud & DevOps": "☁️",
    AI: "🤖",
    Security: "🔒",
    "Developer Tools": "🛠️",
    "Career & Leadership": "📈",
    "Product & Culture": "🚀",
    "Opinions & General": "💭",
    Uncategorized: "📰",
  };

  // Helper function to generate tracked URL
  const generateLinkUrl = (item: ContentWithDetails): string => {
    if (!includeTracking) return item.link;

    const baseUrl = "https://techupkeep.dev";

    if (userId && newsletterSendId) {
      return `${baseUrl}/api/track/${item.id}/${userId}/${newsletterSendId}`;
    } else if (userId) {
      return `${baseUrl}/api/track/${item.id}/${userId}`;
    }
    return item.link;
  };

  // Get all content items
  const allItems = Array.from(contentByCategory.values()).flat();

  // Build email preheader from the first few article summaries
  const preheaderText = allItems
    .slice(0, 3)
    .map((i) => (i.summary || i.title || "").toString())
    .filter((t) => t.trim().length > 0)
    .join(" • ")
    .slice(0, 160);

  // Get featured articles (sorted by featuredOrder)
  const featuredArticles = allItems
    .filter(
      (item) => item.featuredOrder && [1, 2, 3].includes(item.featuredOrder)
    )
    .sort((a, b) => (a.featuredOrder || 0) - (b.featuredOrder || 0));

  let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>techUpkeep() Newsletter</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1a202c;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 40px 20px;
    }
    .container {
      max-width: 680px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-align: center;
      padding: 48px 32px;
    }
    .header h1 {
      font-size: 36px;
      font-weight: 800;
      margin-bottom: 12px;
      letter-spacing: -0.5px;
    }
    .header .subtitle {
      font-size: 18px;
      opacity: 0.95;
      font-weight: 500;
      margin-bottom: 8px;
    }
    .header .date {
      font-size: 14px;
      opacity: 0.85;
      font-weight: 400;
    }
    .content-wrapper {
      padding: 40px 32px;
    }
    .category {
      margin-bottom: 48px;
    }
    .category:last-of-type {
      margin-bottom: 0;
    }
    .category-header {
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 24px;
      padding-bottom: 12px;
      border-bottom: 2px solid #e2e8f0;
    }
    .category-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      margin-right: 12px;
      display: inline-block;
      text-align: center;
      vertical-align: middle;
      line-height: 40px;
      position: relative;
      top: -1px;
      font-size: 21px;
    }
    .category-title {
      display: inline-block;
      vertical-align: middle;
      font-size: 22px;
      font-weight: 700;
      color: #1a202c;
      letter-spacing: -0.3px;
    }
    .content-item {
      margin-bottom: 16px;
      background: #ffffff;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      overflow: hidden;
      transition: all 0.3s ease;
    }
    .content-item:hover {
      border-color: #cbd5e0;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }
    .content-item:last-child {
      margin-bottom: 0;
    }
    .item-header {
      padding: 16px 20px 12px;
    }
    .content-item h3 {
      font-size: 16px;
      font-weight: 700;
      margin-bottom: 10px;
      line-height: 1.4;
    }
    .content-item h3 a {
      color: #1a202c;
      text-decoration: underline;
      font-weight: 700;
    }
    .content-item h3 a:hover {
      opacity: 0.8;
    }
    .content-meta {
      display: block;
      font-size: 13px;
      color: #718096;
      margin-bottom: 12px;
    }
    .content-meta > * { margin-right: 8px; }
    .content-meta > *:last-child { margin-right: 0; }
    .source-badge {
      display: inline-block;
      vertical-align: middle;
      padding: 4px 12px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-right: 8px;
    }
    .source-youtube { background: linear-gradient(135deg, #ff0000 0%, #cc0000 100%); color: white; }
    .source-twitter { background: linear-gradient(135deg, #1da1f2 0%, #0c85d0 100%); color: white; }
    .source-article { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; }
    .source-reddit { background: linear-gradient(135deg, #ff4500 0%, #cc3700 100%); color: white; }
    .source-substack { background: linear-gradient(135deg, #ff6719 0%, #cc5214 100%); color: white; }
    .source-podcast { background: linear-gradient(135deg, #9333ea 0%, #7928ca 100%); color: white; }
    .source-github { background: linear-gradient(135deg, #333 0%, #24292e 100%); color: white; }
    .source-medium { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; }
    .source-name {
      display: inline-block;
      vertical-align: middle;
      line-height: 1.2;
      font-weight: 600;
      color: #2d3748;
    }
    .content-summary {
      color: #4a5568;
      line-height: 1.6;
      padding: 0 24px 16px;
      font-size: 15px;
    }
    .tags {
      padding: 0 20px 16px;
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .tag {
      display: inline-block;
      background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
      color: #4a5568;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      border: 1px solid #e2e8f0;
    }
    .featured-section {
      margin-bottom: 48px;
    }
    .featured-header {
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 3px solid #fbbf24;
    }
    .featured-badge {
      display: inline-block;
      background: #fbbf24;
      color: #0a0a0a;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 16px;
    }
    .featured-item {
      margin-bottom: 20px;
      background: linear-gradient(135deg, #fff9e6 0%, #fffbf0 100%);
      border-radius: 12px;
      border: 2px solid #fbbf24;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(251, 191, 36, 0.2);
    }
    .featured-item h3 {
      font-size: 19px;
      font-weight: 700;
    }
    .featured-item h3 a {
      color: #d97706;
      background: none;
      -webkit-text-fill-color: #d97706;
      text-decoration: underline;
      font-weight: 700;
    }
    .footer {
      background: #f7fafc;
      text-align: center;
      padding: 32px;
      color: #718096;
      font-size: 14px;
      border-top: 1px solid #e2e8f0;
    }
    .footer p {
      margin-bottom: 8px;
    }
    .footer a {
      color: #667eea;
      text-decoration: none;
      font-weight: 600;
    }
    .footer a:hover {
      text-decoration: underline;
    }
    .social-links {
      display: flex;
      justify-content: center;
      gap: 16px;
      margin-top: 20px;
      margin-bottom: 20px;
    }
    .social-link {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      text-decoration: none;
      transition: transform 0.3s ease;
      font-size: 20px;
    }
    .social-link:hover {
      transform: scale(1.1);
    }
    @media only screen and (max-width: 600px) {
      body { padding: 20px 10px !important; }
      .header { padding: 32px 20px !important; }
      .content-wrapper { padding: 24px 16px !important; }
      .header h1 { font-size: 28px !important; }
      .category-title { font-size: 20px !important; }
      .content-item h3 { font-size: 16px !important; }
      .content-summary { font-size: 14px !important; padding: 0 16px 12px !important; }
      .item-header { padding: 16px !important; }
      .tags { padding: 0 16px 16px !important; }
      .content-meta {
        flex-direction: column !important;
        align-items: flex-start !important;
        gap: 6px !important;
      }
      .source-badge {
        font-size: 10px !important;
        padding: 3px 10px !important;
      }
    }
  </style>
</head>
<body>
  <!-- Preheader (hidden) -->
  <div style="display:none!important; visibility:hidden; mso-hide:all; font-size:1px; line-height:1px; color:#ffffff; max-height:0; max-width:0; opacity:0; overflow:hidden;">
    ${preheaderText}
    
  </div>
  <div class="container">
    <div class="header">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
        <tr>
          <td align="center" style="text-align:center;">
            <span style="font-size: 32px; display:inline-block; vertical-align:middle;">📦</span>
            <span style="display:inline-block; vertical-align:middle; margin-left:8px;">
              <h1 style="font-size: 32px; font-weight: 700; letter-spacing: -0.5px; font-family: monospace; margin: 0; text-align:center;">
                <span style="color: #fbbf24;">techUpkeep</span><span style="color: #f59e0b;">()</span>
              </h1>
            </span>
          </td>
        </tr>
      </table>
      <p style="font-size: 12px; color: #cbd5e1; text-align: center; font-style: italic; margin: 0;">Built for product engineers who ship</p>
    </div>
    ${
      headerContent
        ? `
    <div style="padding: 24px 32px; border-bottom: 1px solid #e2e8f0; background-color: #f7fafc;">
      <div style="font-size: 14px; color: #4a5568; line-height: 1.6; white-space: pre-wrap;">
        ${headerContent}
      </div>
    </div>
    `
        : ""
    }
    <div class="content-wrapper">
`;

  // Featured Articles Section
  if (featuredArticles.length > 0) {
    html += `
      <div class="featured-section">
        <div class="featured-header">
          <span style="font-size: 28px; margin-right: 12px;">⭐</span>
          <h2 style="font-size: 24px; font-weight: 700; color: #d97706; letter-spacing: -0.3px;">
            Featured
          </h2>
        </div>
`;

    for (const item of featuredArticles) {
      const sourceClass = `source-${item.sourceType}`;
      const linkUrl = generateLinkUrl(item);

      // Format reading time from database
      const formatReadingTime = (minutes: number | null) => {
        if (!minutes || minutes < 1) return "< 1 min";
        if (minutes === 1) return "1 min";
        return `${minutes} min`;
      };
      const readingTime = formatReadingTime(item.readingTime);

      html += `
        <div class="featured-item">
          <div class="item-header" style="padding: 24px 28px 16px;">
            <h3><a href="${linkUrl}" target="_blank">${item.title}</a></h3>
            <div class="content-meta">
              <span class="source-badge ${sourceClass}">${item.sourceType.toUpperCase()}</span>
              <span class="source-name">${item.sourceName}</span>
              <span style="color: #a0aec0;">•</span>
              <span style="color: #a0aec0; font-size: 12px;">⏱ ${readingTime}</span>
            </div>
          </div>
          <div class="content-summary">
            ${item.summary}
          </div>
        </div>
`;
    }

    html += `
      </div>
`;
  }

  // Content by Category
  for (const [categoryName, items] of contentByCategory.entries()) {
    // Filter out featured articles from category sections
    const nonFeaturedItems = items.filter((item) => !item.featuredOrder);
    if (nonFeaturedItems.length === 0) continue;

    const colors =
      categoryColors[categoryName] || categoryColors["Uncategorized"];
    const icon = categoryIcons[categoryName] || categoryIcons["Uncategorized"];

    html += `
      <div class="category">
        <div class="category-header">
          <div class="category-icon" style="background: ${colors.gradient};">${icon}</div>
          <h2 class="category-title">${categoryName}</h2>
        </div>
`;

    for (const item of nonFeaturedItems) {
      const sourceClass = `source-${item.sourceType}`;
      const linkUrl = generateLinkUrl(item);

      // Format reading time from database
      const formatReadingTime = (minutes: number | null) => {
        if (!minutes || minutes < 1) return "< 1 min";
        if (minutes === 1) return "1 min";
        return `${minutes} min`;
      };
      const readingTime = formatReadingTime(item.readingTime);

      html += `
        <div class="content-item">
          <div class="item-header">
            <h3><a href="${linkUrl}" target="_blank">${item.title}</a></h3>
            <div class="content-meta">
              <span class="source-badge ${sourceClass}">${item.sourceType.toUpperCase()}</span>
              <span class="source-name">${item.sourceName}</span>
              <span style="color: #a0aec0;">•</span>
              <span style="color: #a0aec0; font-size: 12px;">⏱ ${readingTime}</span>
            </div>
          </div>
          <div class="content-summary">
            ${item.summary}
          </div>
        </div>
`;
    }

    html += `
      </div>
`;
  }

  // Social Media Links
  const baseUrl = "https://techupkeep.dev";
  const unsubscribeUrl =
    userId && includeTracking
      ? `${baseUrl}/api/users/unsubscribe/${userId}`
      : "#";

  html += `
    </div>

    <div class="footer">
      ${
        footerContent
          ? `
      <div style="margin-bottom: 32px; padding-bottom: 24px; border-bottom: 1px solid #e2e8f0;">
        <div style="font-size: 14px; color: #4a5568; line-height: 1.6; white-space: pre-wrap; text-align: left;">
          ${footerContent}
        </div>
      </div>
      `
          : ""
      }
      <div style="margin-bottom: 24px;">
        <p style="font-size: 14px; margin-bottom: 4px;">Thanks for reading!</p>
        <p style="font-size: 14px; font-weight: 600; margin-bottom: 16px;">${CURATOR_NAME}</p>
        <p style="font-size: 12px;"><a href="mailto:${CURATOR_EMAIL}">Have feedback? Reach out</a></p>
      </div>

      ${
        includeTracking
          ? `
      <!-- Unsubscribe -->
      <div style="padding-top: 16px;">
        <a href="${unsubscribeUrl}" style="color: #a0aec0; text-decoration: none; font-size: 13px;">
          Unsubscribe
        </a>
      </div>
      `
          : `
      <div style="padding-top: 16px;">
        <p style="font-size: 11px; color: #a0aec0;">
          Unsubscribe link will be automatically added in actual emails
        </p>
      </div>
      `
      }
    </div>
  </div>`;

  // Add email open tracking pixel if tracking is enabled
  if (includeTracking && newsletterSendId) {
    html += `
  <img src="${baseUrl}/api/track/open/${newsletterSendId}" alt="" width="1" height="1" style="display:block;width:1px;height:1px;" />`;
  }

  html += `
</body>
</html>
`;

  return html;
}
