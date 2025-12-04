import type { Metadata } from "next";
import {
  Inter,
  JetBrains_Mono,
  Fira_Code,
  IBM_Plex_Mono,
  Roboto_Mono,
} from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
});

const firaCode = Fira_Code({
  subsets: ["latin"],
  variable: "--font-fira",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-ibm-plex",
});

const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  variable: "--font-roboto-mono",
});

export const metadata: Metadata = {
  title: {
    default: "Tech Upkeep - #1 Tech Newsletter for Product Engineers & Software Developers",
    template: "%s | Tech Upkeep - Newsletter for Engineers",
  },
  description:
    "★ The BEST bi-weekly tech newsletter for engineers who ship products. Get curated content from Netflix, Uber, Airbnb engineering blogs + GitHub Trending repos. Join 2,500+ product engineers staying sharp. Free, delivered Tuesday & Friday. Zero spam.",
  keywords: [
    // Primary keywords (high volume)
    "tech newsletter",
    "software engineer newsletter",
    "product engineer newsletter",
    "developer newsletter",
    "engineering newsletter",
    "programming newsletter",
    "coding newsletter",
    "web development newsletter",

    // Brand variants
    "tech upkeep",
    "techupkeep",
    "tech upkeep newsletter",

    // Long-tail keywords (high intent, easier to rank)
    "best tech newsletter",
    "best tech newsletter for developers",
    "best tech newsletter for software engineers",
    "best developer newsletter",
    "best engineering newsletter",
    "tech newsletter for software engineers",
    "curated tech newsletter",
    "bi-weekly tech newsletter",
    "free tech newsletter",
    "tech newsletter for product engineers",
    "daily tech newsletter",
    "weekly tech newsletter",

    // Problem-solving keywords (what users search)
    "keep up with tech",
    "stay updated on tech trends",
    "stay updated with technology",
    "how to stay updated as a developer",
    "how to stay updated with tech",
    "tech news for engineers",
    "tech news for developers",
    "software engineering updates",
    "latest tech trends",
    "developer resources",
    "programming resources",

    // Content source keywords
    "engineering blogs",
    "engineering blog aggregator",
    "GitHub trending",
    "GitHub trending repositories",
    "tech news curated",
    "curated tech content",
    "system design newsletter",
    "full stack newsletter",
    "backend newsletter",
    "frontend newsletter",
    "DevOps newsletter",
    "AI ML newsletter",
    "machine learning newsletter",

    // Company/source-specific
    "Netflix engineering blog",
    "Uber engineering blog",
    "Airbnb tech blog",
    "big tech engineering blogs",
    "FAANG engineering blogs",
    "startup engineering blogs",

    // Audience-specific (by experience level)
    "junior developer newsletter",
    "junior software engineer newsletter",
    "senior engineer newsletter",
    "senior developer newsletter",
    "startup engineer resources",
    "tech lead newsletter",
    "engineering manager newsletter",

    // Audience-specific (by role)
    "full stack developer newsletter",
    "backend developer newsletter",
    "frontend developer newsletter",
    "mobile developer newsletter",
    "DevOps engineer newsletter",
    "cloud engineer newsletter",
    "data engineer newsletter",
    "software architect newsletter",

    // Technology-specific
    "JavaScript newsletter",
    "React newsletter",
    "Node.js newsletter",
    "Python newsletter",
    "Go newsletter",
    "Rust newsletter",
    "TypeScript newsletter",
    "cloud computing newsletter",
    "AWS newsletter",
    "Kubernetes newsletter",
    "Docker newsletter",

    // Learning & career
    "how to ship products faster",
    "software engineering best practices",
    "coding best practices",
    "developer productivity",
    "engineering productivity",
    "learn software engineering",
    "developer career growth",
    "software engineer career",
    "tech career newsletter",

    // News & trends
    "tech industry news",
    "software development news",
    "programming news",
    "developer news",
    "tech trends 2025",
    "software engineering trends",
    "latest programming trends",

    // Comparison keywords
    "hacker news alternative",
    "reddit programming alternative",
    "tech news aggregator",
    "developer news aggregator",
    "engineering news digest",

    // Value proposition keywords
    "curated developer content",
    "handpicked tech articles",
    "quality tech content",
    "no spam newsletter",
    "ad-free newsletter",
    "free developer newsletter",
    "subscription free tech news",
  ],
  openGraph: {
    title: "Tech Upkeep - The #1 Newsletter for Engineers Who Ship Products 🚀",
    description: "Join 2,500+ product engineers getting the BEST curated tech content. Netflix, Uber, Airbnb blogs + GitHub Trending. Free. Bi-weekly. Zero spam. ⭐",
    url: "https://www.techupkeep.dev",
    siteName: "Tech Upkeep",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "https://www.techupkeep.dev/og-image.jpeg",
        width: 1200,
        height: 630,
        alt: "Tech Upkeep - #1 Curated Tech Newsletter for Product Engineers and Software Developers",
      },
    ],
  },
  other: {
    "google-site-verification": "your-verification-code-here", // TODO: Add from Google Search Console
    "facebook-domain-verification": "your-fb-verification-code", // Optional: For Facebook domain verification
    "theme-color": "#3b82f6", // Blue theme color
    "msapplication-TileColor": "#3b82f6",
    "application-name": "Tech Upkeep",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "Tech Upkeep",
    "format-detection": "telephone=no",
    "mobile-web-app-capable": "yes",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tech Upkeep - #1 Newsletter for Engineers Who Ship 🚀",
    description: "Join 2,500+ engineers getting the BEST curated tech content. Netflix, Uber, Airbnb blogs + GitHub Trending. Free bi-weekly. Zero spam.",
    images: ["https://www.techupkeep.dev/og-image.jpeg"],
    creator: "@benlohtechbiz",
    site: "@benlohtechbiz",
  },
  alternates: {
    canonical: "https://www.techupkeep.dev",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  authors: [{ name: "Benjamin Loh", url: "https://x.com/benlohtechbiz" }],
  creator: "Benjamin Loh",
  publisher: "Tech Upkeep",
  category: "Technology",
  classification: "Newsletter, Technology, Software Engineering",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${inter.className} ${jetbrainsMono.variable} ${firaCode.variable} ${ibmPlexMono.variable} ${robotoMono.variable}`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
