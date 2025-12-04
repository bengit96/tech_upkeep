/**
 * Structured Data Component
 * Adds JSON-LD schema for better SEO
 */

export function StructuredData() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": "https://techupkeep.dev/#website",
        "url": "https://techupkeep.dev",
        "name": "Tech Upkeep",
        "description": "Bi-weekly curated tech newsletter for software engineers",
        "publisher": {
          "@id": "https://techupkeep.dev/#organization",
        },
        "inLanguage": "en-US",
      },
      {
        "@type": "Organization",
        "@id": "https://techupkeep.dev/#organization",
        "name": "Tech Upkeep",
        "url": "https://techupkeep.dev",
        "logo": {
          "@type": "ImageObject",
          "url": "https://techupkeep.dev/og-image.png",
          "width": "1200",
          "height": "630",
        },
        "image": "https://techupkeep.dev/og-image.png",
        "description": "Curated tech newsletter for software engineers and product developers",
        "sameAs": [
          "https://x.com/benlohtechbiz",
          "https://www.tiktok.com/@techupkeep",
          "https://substack.com/@benfromtechupkeep"
        ],
      },
      {
        "@type": "WebPage",
        "@id": "https://techupkeep.dev/#webpage",
        "url": "https://techupkeep.dev",
        "name": "Tech Upkeep - Curated Tech Newsletter for Engineers",
        "isPartOf": {
          "@id": "https://techupkeep.dev/#website",
        },
        "about": {
          "@id": "https://techupkeep.dev/#organization",
        },
        "description": "Bi-weekly curated tech newsletter for software engineers. Learn from Netflix, Uber, Airbnb engineering blogs, GitHub Trending, and top tech content.",
        "inLanguage": "en-US",
      },
      {
        "@type": "NewsletterService",
        "name": "Tech Upkeep Newsletter",
        "description": "Bi-weekly curated technical content for product engineers, software engineers, and developers who want to stay updated on tech",
        "provider": {
          "@id": "https://techupkeep.dev/#organization",
        },
        "audience": {
          "@type": "Audience",
          "audienceType": "Product Engineers, Software Engineers, Full Stack Developers, Junior Developers, Backend Engineers, Frontend Engineers",
        },
        "keywords": "tech newsletter, software engineer newsletter, developer newsletter, best tech newsletter, curated tech content, engineering blogs, GitHub trending, Netflix engineering blog, Uber tech blog, Airbnb engineering, system design, tech news for developers, programming newsletter, coding newsletter, full stack newsletter, DevOps newsletter, AI ML newsletter, junior developer newsletter, senior engineer newsletter, free tech newsletter, bi-weekly newsletter, how to stay updated with tech, tech trends, software engineering best practices, developer productivity, FAANG engineering blogs, tech news aggregator, hacker news alternative",
      },
      {
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "What is Tech Upkeep?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Tech Upkeep is a bi-weekly curated tech newsletter for product engineers and software developers. We filter through thousands of tech articles, engineering blogs, and GitHub repos to bring you only the most relevant content for engineers who ship products."
            }
          },
          {
            "@type": "Question",
            "name": "Who is this newsletter for?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Tech Upkeep is designed for product engineers, software engineers, full-stack developers, and anyone who wants to stay updated on tech trends without information overload. Perfect for junior developers, senior engineers, and tech leads."
            }
          },
          {
            "@type": "Question",
            "name": "What content do you cover?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "We curate content from Netflix Engineering, Uber Engineering, Airbnb Tech Blog, GitHub Trending repositories, Hacker News, technical YouTube channels, engineering podcasts, and over 110 top tech sources. Categories include Frontend, Backend, AI/ML, DevOps, System Design, Security, and Career advice."
            }
          },
          {
            "@type": "Question",
            "name": "How often do you send newsletters?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Tech Upkeep sends bi-weekly newsletters every Tuesday and Friday. Each edition is carefully curated to save you time while keeping you updated on the latest tech trends."
            }
          },
          {
            "@type": "Question",
            "name": "Is Tech Upkeep free?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes! Tech Upkeep is completely free. No subscription fees, no paywalls, and zero spam. We believe in providing value to the engineering community without barriers."
            }
          },
          {
            "@type": "Question",
            "name": "How is Tech Upkeep different from other tech newsletters?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Tech Upkeep is the only newsletter that combines content from 110+ sources including Netflix Engineering, Uber Tech Blog, Airbnb Engineering, AND GitHub Trending repositories. We focus specifically on product engineers who ship, not just consume content. Plus, we include podcasts, YouTube channels, and Reddit discussions alongside traditional blogs."
            }
          },
          {
            "@type": "Question",
            "name": "What sources does Tech Upkeep aggregate from?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "We aggregate from 110+ top tech sources including: Netflix Engineering Blog, Uber Engineering, Airbnb Tech Blog, GitHub Trending, Hacker News top posts, tech subreddits (r/programming, r/webdev), engineering YouTube channels, tech podcasts, and blogs from Google, Meta, Amazon, Microsoft, and leading startups."
            }
          },
          {
            "@type": "Question",
            "name": "Can I unsubscribe anytime?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Absolutely! Every email has a one-click unsubscribe link at the bottom. No questions asked, no hassle. We respect your inbox and your time."
            }
          },
          {
            "@type": "Question",
            "name": "How do you curate the content?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Our curation process: 1) We aggregate 1,000+ articles daily from 110+ sources, 2) Filter by quality score (upvotes, engagement), 3) Manually review the top 50 articles, 4) Select the best 10-15 based on relevance for product engineers, 5) Categorize by topic (Frontend, Backend, DevOps, AI/ML, etc.), 6) Add summaries and key takeaways."
            }
          }
        ]
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "https://techupkeep.dev"
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "Tech Newsletter",
            "item": "https://techupkeep.dev"
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": "For Product Engineers",
            "item": "https://techupkeep.dev"
          }
        ]
      }
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
