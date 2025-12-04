/**
 * TikTok Slide Templates for Tech Upkeep Blog Posts
 *
 * These templates generate 1080x1920 (9:16) slides optimized for TikTok
 * using your brand colors and design system
 */

import React, { ReactNode } from "react";

// Brand colors from your design system
const COLORS = {
  background: "#111827", // gray-900
  backgroundLight: "#1f2937", // gray-800
  primary: "#3b82f6", // blue-500
  accent: "#9333ea", // purple-600
  text: "#f9fafb", // gray-50
  textMuted: "#9ca3af", // gray-400
  success: "#10b981", // green-500
};

// Slide dimensions for TikTok (9:16 aspect ratio)
export const SLIDE_WIDTH = 1080;
export const SLIDE_HEIGHT = 1920;

interface BaseSlideProps {
  brandName?: string;
}

// Helper to render text with **bold** and *italic* markers
function renderFormattedText(text: string, baseStyle: any): ReactNode[] {
  const parts: ReactNode[] = [];
  let remaining = text;
  let key = 0;

  // Match **bold** or *italic*
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(remaining)) !== null) {
    // Add text before match
    if (match.index > lastIndex) {
      parts.push(
        <span key={key++} style={baseStyle}>
          {remaining.slice(lastIndex, match.index)}
        </span>
      );
    }

    // Add formatted text
    if (match[2]) {
      // **bold**
      parts.push(
        <span
          key={key++}
          style={{ ...baseStyle, fontWeight: 800, color: COLORS.text }}
        >
          {match[2]}
        </span>
      );
    } else if (match[3]) {
      // *italic*
      parts.push(
        <span key={key++} style={{ ...baseStyle, fontStyle: "italic" }}>
          {match[3]}
        </span>
      );
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < remaining.length) {
    parts.push(
      <span key={key++} style={baseStyle}>
        {remaining.slice(lastIndex)}
      </span>
    );
  }

  return parts.length > 0
    ? parts
    : [
        <span key={0} style={baseStyle}>
          {text}
        </span>,
      ];
}

/**
 * Title Slide - Opens the presentation with the blog post title
 */
export function TitleSlide({
  title,
  subtitle,
  brandName = "Tech Upkeep",
}: BaseSlideProps & {
  title: string;
  subtitle?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        background: `linear-gradient(135deg, ${COLORS.background} 0%, ${COLORS.backgroundLight} 100%)`,
        padding: "60px",
        justifyContent: "space-between",
      }}
    >
      {/* Brand */}
      <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
        <div
          style={{
            width: "70px",
            height: "70px",
            background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.accent} 100%)`,
            borderRadius: "18px",
          }}
        />
        <span
          style={{
            fontSize: "42px",
            fontWeight: 700,
            color: COLORS.text,
          }}
        >
          {brandName}
        </span>
      </div>

      {/* Title */}
      <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
        <h1
          style={{
            fontSize: "88px",
            fontWeight: 800,
            lineHeight: 1.15,
            color: COLORS.text,
            margin: 0,
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            style={{
              fontSize: "48px",
              color: COLORS.textMuted,
              margin: 0,
              lineHeight: 1.4,
            }}
          >
            {subtitle}
          </p>
        )}
      </div>

      {/* Gradient accent bar */}
      <div
        style={{
          width: "100%",
          height: "10px",
          background: `linear-gradient(90deg, ${COLORS.primary} 0%, ${COLORS.accent} 100%)`,
          borderRadius: "5px",
        }}
      />
    </div>
  );
}

/**
 * Content Slide - Main content with numbered points
 */
export function ContentSlide({
  title,
  content,
  number,
  brandName = "Tech Upkeep",
  imageSrc,
  blocks,
}: BaseSlideProps & {
  title: string;
  content: string;
  number: number;
  imageSrc?: string;
  blocks?: Array<
    | { type: "p"; content: string }
    | { type: "ul"; items: string[] }
    | { type: "ol"; items: string[] }
    | { type: "code"; content: string }
  >;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        background: `linear-gradient(135deg, ${COLORS.background} 0%, ${COLORS.backgroundLight} 100%)`,
        padding: "60px",
        justifyContent: "space-between",
      }}
    >
      {/* Header with number badge */}
      <div style={{ display: "flex", alignItems: "center", gap: "28px" }}>
        <div
          style={{
            width: "90px",
            height: "90px",
            background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.accent} 100%)`,
            borderRadius: "22px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "54px",
            fontWeight: 800,
            color: COLORS.text,
          }}
        >
          {number}
        </div>
        <h2
          style={{
            fontSize: "62px",
            fontWeight: 700,
            color: COLORS.text,
            margin: 0,
            flex: 1,
            lineHeight: 1.15,
          }}
        >
          {title}
        </h2>
      </div>

      {/* Content */}
      <div
        style={{
          display: "flex",
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingTop: "40px",
          paddingBottom: "40px",
        }}
      >
        {blocks && blocks.length > 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "28px",
              width: "100%",
            }}
          >
            {blocks.map((b, idx) => {
              if (b.type === "p") {
                return (
                  <p
                    key={idx}
                    style={{
                      fontSize: "56px",
                      lineHeight: 1.45,
                      color: COLORS.text,
                      margin: 0,
                      marginBottom: "24px",
                    }}
                  >
                    {renderFormattedText(b.content, { color: COLORS.text })}
                  </p>
                );
              }
              if (b.type === "code") {
                return (
                  <pre
                    key={idx}
                    style={{
                      background: COLORS.backgroundLight,
                      padding: "42px",
                      borderRadius: "20px",
                      fontSize: "46px",
                      color: COLORS.text,
                      whiteSpace: "pre-wrap",
                      marginBottom: "24px",
                    }}
                  >
                    {b.content}
                  </pre>
                );
              }
              if (b.type === "ul") {
                return (
                  <ul
                    key={idx}
                    style={{
                      margin: 0,
                      marginBottom: "24px",
                      paddingLeft: "60px",
                    }}
                  >
                    {b.items.map((it, i2) => (
                      <li
                        key={i2}
                        style={{
                          fontSize: "54px",
                          color: COLORS.text,
                          lineHeight: 1.45,
                          marginBottom: "18px",
                        }}
                      >
                        {renderFormattedText(it, { color: COLORS.text })}
                      </li>
                    ))}
                  </ul>
                );
              }
              if (b.type === "ol") {
                return (
                  <ol
                    key={idx}
                    style={{
                      margin: 0,
                      marginBottom: "24px",
                      paddingLeft: "60px",
                    }}
                  >
                    {b.items.map((it, i2) => (
                      <li
                        key={i2}
                        style={{
                          fontSize: "54px",
                          color: COLORS.text,
                          lineHeight: 1.45,
                          marginBottom: "18px",
                        }}
                      >
                        {renderFormattedText(it, { color: COLORS.text })}
                      </li>
                    ))}
                  </ol>
                );
              }
              return null;
            })}
          </div>
        ) : (
          <p
            style={{
              fontSize: "52px",
              lineHeight: 1.45,
              color: COLORS.text,
              margin: 0,
            }}
          >
            {content}
          </p>
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span
          style={{
            fontSize: "36px",
            color: COLORS.textMuted,
          }}
        >
          {brandName}
        </span>
        <div
          style={{
            width: "220px",
            height: "10px",
            background: `linear-gradient(90deg, ${COLORS.primary} 0%, ${COLORS.accent} 100%)`,
            borderRadius: "5px",
          }}
        />
      </div>
    </div>
  );
}

/**
 * List Slide - Bullet points or numbered list
 */
export function ListSlide({
  title,
  items,
  brandName = "Tech Upkeep",
  colorTheme = "slate",
  number,
  imageUrl,
}: BaseSlideProps & {
  title: string;
  items: string[];
  colorTheme?: string;
  number?: number;
  imageUrl?: string;
}) {
  // Color theme gradients with accent colors
  const themeConfig: Record<string, { gradient: string; accent: string; light: string }> = {
    slate: {
      gradient: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
      accent: "#3b82f6",
      light: "#64748b"
    },
    purple: {
      gradient: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
      accent: "#a78bfa",
      light: "#c4b5fd"
    },
    blue: {
      gradient: "linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)",
      accent: "#38bdf8",
      light: "#7dd3fc"
    },
    green: {
      gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
      accent: "#34d399",
      light: "#6ee7b7"
    },
    orange: {
      gradient: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
      accent: "#fb923c",
      light: "#fdba74"
    },
    pink: {
      gradient: "linear-gradient(135deg, #ec4899 0%, #db2777 100%)",
      accent: "#f472b6",
      light: "#f9a8d4"
    },
    red: {
      gradient: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
      accent: "#f87171",
      light: "#fca5a5"
    },
  };

  const theme = themeConfig[colorTheme] || themeConfig.slate;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        background: theme.gradient,
        padding: "60px",
        justifyContent: "space-between",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative background shapes */}
      <div
        style={{
          position: "absolute",
          top: "-200px",
          right: "-200px",
          width: "600px",
          height: "600px",
          borderRadius: "50%",
          background: theme.accent,
          opacity: 0.1,
          display: "flex",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-150px",
          left: "-150px",
          width: "500px",
          height: "500px",
          borderRadius: "50%",
          background: theme.light,
          opacity: 0.08,
          display: "flex",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "30%",
          right: "10%",
          width: "300px",
          height: "300px",
          background: `linear-gradient(45deg, ${theme.accent}30, transparent)`,
          transform: "rotate(45deg)",
          display: "flex",
        }}
      />

      {/* Custom background image (if provided) */}
      {imageUrl && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundImage: `url(${imageUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: 0.15,
            display: "flex",
          }}
        />
      )}
      {imageUrl && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: `linear-gradient(135deg, ${theme.gradient.split(",")[0].split("(")[1]} 0%, transparent 60%)`,
            display: "flex",
          }}
        />
      )}

      {/* Content container - positioned above background shapes */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          position: "relative",
          zIndex: 10,
          height: "100%",
          justifyContent: "space-between",
        }}
      >
        {/* Title with glow effect */}
        <h2
          style={{
            fontSize: "72px",
            fontWeight: 800,
            color: COLORS.text,
            margin: 0,
            marginBottom: "60px",
            lineHeight: 1.1,
            textShadow: `0 0 40px ${theme.accent}40`,
          }}
        >
          {title}
        </h2>

        {/* List items with enhanced bullets */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "42px",
            flex: 1,
          }}
        >
          {items.map((item, index) => (
            <div
              key={index}
              style={{
                display: "flex",
                gap: "32px",
                alignItems: "flex-start",
                background: `linear-gradient(90deg, ${theme.accent}15, transparent)`,
                padding: "24px",
                borderRadius: "20px",
                backdropFilter: "blur(10px)",
              }}
            >
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  background: `linear-gradient(135deg, ${theme.accent}, ${theme.light})`,
                  borderRadius: "16px",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: `0 8px 24px ${theme.accent}40`,
                  fontSize: "36px",
                  fontWeight: 900,
                  color: "#ffffff",
                }}
              >
                {index + 1}
              </div>
              <p
                style={{
                  fontSize: "48px",
                  lineHeight: 1.4,
                  color: COLORS.text,
                  margin: 0,
                  fontWeight: 600,
                }}
              >
                {item}
              </p>
            </div>
          ))}
        </div>

        {/* Footer with gradient bar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "60px",
          }}
        >
          <span
            style={{
              fontSize: "38px",
              color: COLORS.text,
              fontWeight: 700,
              opacity: 0.8,
            }}
          >
            {brandName}
          </span>
          <div
            style={{
              width: "280px",
              height: "12px",
              background: `linear-gradient(90deg, ${theme.accent}, ${theme.light})`,
              borderRadius: "6px",
              boxShadow: `0 4px 16px ${theme.accent}50`,
              display: "flex",
            }}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Quote Slide - Highlight a key quote or insight
 */
export function QuoteSlide({
  quote,
  author,
  brandName = "Tech Upkeep",
}: BaseSlideProps & {
  quote: string;
  author?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        background: `linear-gradient(135deg, ${COLORS.background} 0%, ${COLORS.backgroundLight} 100%)`,
        padding: "60px",
        justifyContent: "space-between",
      }}
    >
      {/* Quote mark */}
      <div
        style={{
          fontSize: "180px",
          color: COLORS.primary,
          lineHeight: 1,
          opacity: 0.3,
        }}
      >
        "
      </div>

      {/* Quote content */}
      <div
        style={{
          display: "flex",
          flex: 1,
          flexDirection: "column",
          justifyContent: "center",
          gap: "48px",
          marginTop: "-80px",
        }}
      >
        <p
          style={{
            fontSize: "60px",
            lineHeight: 1.35,
            color: COLORS.text,
            margin: 0,
            fontStyle: "italic",
          }}
        >
          {quote}
        </p>
        {author && (
          <p
            style={{
              fontSize: "42px",
              color: COLORS.textMuted,
              margin: 0,
            }}
          >
            — {author}
          </p>
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span
          style={{
            fontSize: "36px",
            color: COLORS.textMuted,
          }}
        >
          {brandName}
        </span>
        <div
          style={{
            width: "220px",
            height: "10px",
            background: `linear-gradient(90deg, ${COLORS.primary} 0%, ${COLORS.accent} 100%)`,
            borderRadius: "5px",
          }}
        />
      </div>
    </div>
  );
}

/**
 * CTA Slide - Call to action (outro)
 */
export function CTASlide({
  title,
  subtitle,
  ctaText,
  brandName = "Tech Upkeep",
  website = "techupkeep.dev",
}: BaseSlideProps & {
  title: string;
  subtitle?: string;
  ctaText: string;
  website?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        background: `linear-gradient(135deg, ${COLORS.background} 0%, ${COLORS.backgroundLight} 100%)`,
        padding: "60px",
        justifyContent: "space-between",
        alignItems: "center",
        textAlign: "center",
      }}
    >
      {/* Logo/Brand */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "28px",
        }}
      >
        <div
          style={{
            width: "140px",
            height: "140px",
            background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.accent} 100%)`,
            borderRadius: "35px",
          }}
        />
        <span
          style={{
            fontSize: "54px",
            fontWeight: 700,
            color: COLORS.text,
          }}
        >
          {brandName}
        </span>
      </div>

      {/* Main CTA */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "48px",
          alignItems: "center",
        }}
      >
        <h2
          style={{
            fontSize: "76px",
            fontWeight: 800,
            lineHeight: 1.15,
            color: COLORS.text,
            margin: 0,
          }}
        >
          {title}
        </h2>
        {subtitle && (
          <p
            style={{
              fontSize: "48px",
              color: COLORS.textMuted,
              margin: 0,
              lineHeight: 1.4,
            }}
          >
            {subtitle}
          </p>
        )}

        {/* CTA Button */}
        <div
          style={{
            padding: "38px 90px",
            background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.accent} 100%)`,
            borderRadius: "24px",
            fontSize: "52px",
            fontWeight: 700,
            color: COLORS.text,
            marginTop: "48px",
          }}
        >
          {ctaText}
        </div>
      </div>

      {/* Website */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "24px",
        }}
      >
        <div
          style={{
            width: "320px",
            height: "10px",
            background: `linear-gradient(90deg, ${COLORS.primary} 0%, ${COLORS.accent} 100%)`,
            borderRadius: "5px",
          }}
        />
        <span
          style={{
            fontSize: "42px",
            color: COLORS.textMuted,
          }}
        >
          {website}
        </span>
      </div>
    </div>
  );
}
