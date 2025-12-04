import puppeteer from "puppeteer";
import { HTMLSlideGenerator } from "./html-slide-generator";
import { AIImageGenerator } from "./ai-image-generator";
import { SlideContentAnalyzer } from "./slide-content-analyzer";

interface SlideImage {
  index: number;
  buffer: Buffer;
  filename: string;
}

export type ImageGenerationMode = "html" | "ai";

export class ImageGenerator {
  private htmlGenerator = new HTMLSlideGenerator();
  private aiGenerator = new AIImageGenerator();
  private contentAnalyzer = new SlideContentAnalyzer();

  /**
   * Generate PNG images from social media content
   * @param mode - "html" for HTML mockups (default), "ai" for AI-generated images
   * @param hookPatternId - Optional hook pattern ID for variety in content generation
   */
  async generateImages(
    platform: string,
    textContent: string,
    subject: string,
    hashtags: string,
    articles?: Array<{ title: string; summary: string; category?: string }>,
    mode: ImageGenerationMode = "html",
    hookPatternId?: string
  ): Promise<SlideImage[]> {
    // Try AI generation first if mode is "ai"
    if (
      mode === "ai" &&
      process.env.HUGGINGFACE_API_KEY &&
      articles &&
      articles.length > 0
    ) {
      try {
        return await this.generateAIImages(platform, articles, hookPatternId);
      } catch (error) {
        console.error(
          "AI image generation failed, falling back to HTML:",
          error
        );
        // Fall through to HTML generation
      }
    }

    // Default: HTML-based generation
    return await this.generateHTMLImages(
      platform,
      textContent,
      subject,
      hashtags,
      articles
    );
  }

  /**
   * Generate AI-powered images using HuggingFace FLUX.1-schnell
   */
  private async generateAIImages(
    platform: string,
    articles: Array<{
      title: string;
      summary: string;
      category?: string;
      thumbnailUrl?: string | null;
      source?: string;
      link?: string;
    }>,
    hookPatternId?: string
  ): Promise<SlideImage[]> {
    console.log("🎨 Generating AI-powered slide images...");

    const { width, height } = this.getDimensions(platform);

    // Analyze articles and generate slide data
    const slideData = await this.contentAnalyzer.analyzeAndGenerate(
      articles,
      hookPatternId
    );

    const images: SlideImage[] = [];

    // Launch Puppeteer browser for compositing
    const puppeteer = (await import("puppeteer")).default;
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    try {
      // 1. FIRST SLIDE: AI background + intro summary text
      console.log("Generating slide 1: Intro summary with AI background...");
      const hookBgImage = await this.aiGenerator.generateSlideImage(
        {
          title: slideData.hook,
          description: "Tech news background",
          mockupType: "none",
          mockupData: {},
          backgroundColor: "#000000",
          index: 0,
        },
        width,
        height
      );

      const hookSlideHTML = this.generateTextOverlayHTML(
        "What this video covers",
        slideData.hook,
        hookBgImage,
        width,
        height,
        "intro",
        undefined // no key points for intro
      );

      const hookSlide = await this.renderHTMLToImage(
        browser,
        hookSlideHTML,
        width,
        height
      );
      images.push({
        index: 0,
        buffer: hookSlide,
        filename: `slide-1-of-${articles.length + 2}.png`,
      });

      // 2. CONTENT SLIDES: AI image (top) + text (bottom)
      for (let i = 0; i < slideData.slides.length; i++) {
        const slide = slideData.slides[i];
        const article = articles[i];

        console.log(
          `Generating slide ${i + 2}: ${slide.title.substring(0, 50)}...`
        );

        let topImage: Buffer;

        // Prefer article thumbnail; on failure, fallback to AI background
        if (article?.thumbnailUrl) {
          try {
            console.log(`Using thumbnail: ${article.thumbnailUrl}`);
            topImage = await this.downloadImage(article.thumbnailUrl);
          } catch (err) {
            console.warn(
              `Thumbnail download failed (${(err as Error).message}). Falling back to AI background.`
            );
            topImage = await this.aiGenerator.generateSlideImage(
              {
                title: slide.title,
                description: slide.description,
                mockupType: "none",
                mockupData: {},
                backgroundColor: slide.backgroundColor,
                index: i + 1,
              },
              width,
              height
            );
          }
        } else {
          topImage = await this.aiGenerator.generateSlideImage(
            {
              title: slide.title,
              description: slide.description,
              mockupType: "none",
              mockupData: {},
              backgroundColor: slide.backgroundColor,
              index: i + 1,
            },
            width,
            height
          );
        }

        const contentSlideHTML = this.generateTextOverlayHTML(
          slide.title,
          slide.description,
          topImage,
          width,
          height,
          "content",
          slide.keyPoints,
          slide.source,
          slide.link
        );

        const contentSlide = await this.renderHTMLToImage(
          browser,
          contentSlideHTML,
          width,
          height
        );
        images.push({
          index: i + 1,
          buffer: contentSlide,
          filename: `slide-${i + 2}-of-${articles.length + 2}.png`,
        });
      }

      // 3. LAST SLIDE: Simple background + CTA
      console.log("Generating final slide: CTA...");
      const ctaBgImage = await this.aiGenerator.generateSlideImage(
        {
          title: "Subscribe to tech newsletter",
          description: "Call to action background",
          mockupType: "none",
          mockupData: {},
          backgroundColor: "#000000",
          index: slideData.slides.length + 1,
        },
        width,
        height
      );

      const ctaSlideHTML = this.generateTextOverlayHTML(
        slideData.cta.title,
        slideData.cta.subtitle + "\n" + slideData.cta.link,
        ctaBgImage,
        width,
        height,
        "cta",
        undefined // no key points for CTA
      );

      const ctaSlide = await this.renderHTMLToImage(
        browser,
        ctaSlideHTML,
        width,
        height
      );
      images.push({
        index: articles.length + 1,
        buffer: ctaSlide,
        filename: `slide-${articles.length + 2}-of-${articles.length + 2}.png`,
      });
    } finally {
      await browser.close();
    }

    return images;
  }

  /**
   * Generate HTML-based images using Puppeteer (original method)
   */
  private async generateHTMLImages(
    platform: string,
    textContent: string,
    subject: string,
    hashtags: string,
    articles?: Array<{ title: string; summary: string; category?: string }>
  ): Promise<SlideImage[]> {
    // Map platform to HTML slide platform
    let htmlPlatform:
      | "tiktok"
      | "instagram-square"
      | "instagram-story"
      | "twitter";

    switch (platform) {
      case "tiktok":
        htmlPlatform = "tiktok";
        break;
      case "instagram-feed":
        htmlPlatform = "instagram-square";
        break;
      case "instagram-stories":
      case "instagram-reels":
        htmlPlatform = "instagram-story";
        break;
      case "twitter-thread":
      case "twitter-single":
        htmlPlatform = "twitter";
        break;
      default:
        htmlPlatform = "tiktok";
    }

    // If we have articles, still analyze to get a strong hook and slide data
    const analyzedSlideData = articles && articles.length > 0
      ? await this.contentAnalyzer.analyzeAndGenerate(articles)
      : undefined;

    // Generate slide configuration (now async)
    const slideConfig = await this.htmlGenerator.parseContentToSlides(
      htmlPlatform,
      textContent,
      subject,
      hashtags,
      articles,
      analyzedSlideData
    );

    const { width, height } = this.getDimensions(htmlPlatform);

    // Launch Puppeteer browser
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const images: SlideImage[] = [];

    try {
      // Generate each slide as a separate image
      for (let i = 0; i < slideConfig.slides.length; i++) {
        const slide = slideConfig.slides[i];

        // Generate HTML for single slide
        const slideHTML = this.generateSingleSlideHTML(
          slide,
          i,
          slideConfig,
          width,
          height
        );

        // Create new page
        const page = await browser.newPage();

        // Set viewport to exact dimensions
        await page.setViewport({
          width,
          height,
          deviceScaleFactor: 2, // For high-resolution images
        });

        // Set content
        await page.setContent(slideHTML, {
          waitUntil: "networkidle0",
        });

        // Take screenshot
        const screenshot = await page.screenshot({
          type: "png",
          fullPage: false,
        });

        images.push({
          index: i,
          buffer: screenshot as Buffer,
          filename: `slide-${i + 1}-of-${slideConfig.slides.length}.png`,
        });

        await page.close();
      }
    } finally {
      await browser.close();
    }

    return images;
  }

  /**
   * Download image from URL
   */
  private async downloadImage(url: string): Promise<Buffer> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  /**
   * Render HTML to image using Puppeteer
   */
  private async renderHTMLToImage(
    browser: Awaited<ReturnType<typeof import("puppeteer").default.launch>>,
    html: string,
    width: number,
    height: number
  ): Promise<Buffer> {
    const page = await browser.newPage();
    await page.setViewport({
      width,
      height,
      deviceScaleFactor: 2,
    });
    await page.setContent(html, { waitUntil: "networkidle0" });
    const screenshot = await page.screenshot({
      type: "png",
      fullPage: false,
    });
    await page.close();
    return screenshot as Buffer;
  }

  /**
   * Generate HTML with image background and text overlay
   * Layout: Image on top half, text on bottom half (for content slides)
   * Layout: Centered text on background (for intro/cta slides)
   */
  private generateTextOverlayHTML(
    title: string,
    description: string | null,
    backgroundImage: Buffer,
    width: number,
    height: number,
    type: "intro" | "content" | "cta",
    keyPoints?: string[],
    source?: string,
    link?: string
  ): string {
    const base64Image = backgroundImage.toString("base64");
    const imageDataUrl = `data:image/png;base64,${base64Image}`;

    if (type === "intro") {
      // Intro: Logo at top, hook in center
      return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: ${width}px;
      height: ${height}px;
      background-image: url('${imageDataUrl}');
      background-size: cover;
      background-position: center;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .overlay {
      background: rgba(0, 0, 0, 0.6);
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px;
      text-align: center;
      position: relative;
    }
    .logo {
      position: absolute;
      top: 60px;
      font-size: 48px;
      font-weight: 900;
      color: white;
      text-shadow: 0 4px 20px rgba(0,0,0,0.8);
      letter-spacing: -0.02em;
    }
    h1 {
      color: white;
      font-size: 80px;
      font-weight: 900;
      line-height: 1.05;
      letter-spacing: -0.04em;
      text-shadow: 0 4px 20px rgba(0,0,0,0.8);
    }
  </style>
</head>
<body>
  <div class="overlay">
    <div class="logo">tech<span style="color: #00ff88;">Upkeep</span>()</div>
    <h1>${title}</h1>
  </div>
</body>
</html>`;
    } else if (type === "cta") {
      // CTA: Better value prop
      return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: ${width}px;
      height: ${height}px;
      background-image: url('${imageDataUrl}');
      background-size: cover;
      background-position: center;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .overlay {
      background: rgba(0, 0, 0, 0.6);
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 80px;
      text-align: center;
    }
    h1 {
      color: white;
      font-size: 72px;
      font-weight: 900;
      line-height: 1.1;
      letter-spacing: -0.03em;
      text-shadow: 0 4px 20px rgba(0,0,0,0.8);
      margin-bottom: 30px;
    }
    p {
      color: white;
      font-size: 36px;
      font-weight: 600;
      text-shadow: 0 2px 10px rgba(0,0,0,0.8);
      line-height: 1.4;
      white-space: pre-line;
    }
  </style>
</head>
<body>
  <div class="overlay">
    <h1>${title}</h1>
    ${description ? `<p>${description}</p>` : ""}
  </div>
</body>
</html>`;
    } else {
      // Content slide: 60% image, 40% text with 2x larger fonts
      // Shorten URL for display
      const displayLink = link
        ? link.replace(/^https?:\/\/(www\.)?/, "").substring(0, 40)
        : "";

      return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: ${width}px;
      height: ${height}px;
      display: flex;
      flex-direction: column;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #000;
    }
    .image-section {
      height: 60%;
      background-image: url('${imageDataUrl}');
      background-size: cover;
      background-position: center;
      position: relative;
    }
    .text-section {
      height: 40%;
      background: #000;
      padding: 40px 50px;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    .content-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    h2 {
      color: white;
      font-size: 40px;
      font-weight: 900;
      line-height: 1.1;
      letter-spacing: -0.02em;
      margin-bottom: 20px;
    }
    .description {
      color: rgba(255,255,255,0.95);
      font-size: 40px;
      font-weight: 600;
      line-height: 1.3;
      letter-spacing: -0.01em;
    }
    .metadata {
      border-top: 2px solid rgba(255,255,255,0.2);
      padding-top: 18px;
      margin-top: 18px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .source {
      color: rgba(255,255,255,0.9);
      font-size: 24px;
      font-weight: 700;
    }
    .source-label {
      color: rgba(255,255,255,0.6);
      font-size: 22px;
      font-weight: 600;
      margin-right: 10px;
    }
    .read-more {
      color: #00ff88;
      font-size: 24px;
      font-weight: 700;
    }
  </style>
</head>
<body>
  <div class="image-section"></div>
  <div class="text-section">
    <div class="content-area">
      <h2>${title}</h2>
      <div class="description">${description || ""}</div>
    </div>
    <div class="metadata">
      <div>
        <span class="source-label">Source:</span>
        <span class="source">${source || "Tech News"}</span>
      </div>
      ${displayLink ? `<div class="read-more">${displayLink}</div>` : ""}
    </div>
  </div>
</body>
</html>`;
    }
  }

  /**
   * Get dimensions for platform
   */
  private getDimensions(platform: string): { width: number; height: number } {
    switch (platform) {
      case "tiktok":
      case "instagram-story":
        return { width: 1080, height: 1920 }; // 9:16 vertical
      case "instagram-square":
        return { width: 1080, height: 1080 }; // 1:1 square
      case "twitter":
        return { width: 1920, height: 1080 }; // 16:9 horizontal
      default:
        return { width: 1080, height: 1920 };
    }
  }

  /**
   * Generate mockup HTML (simplified for image generation)
   */
  private generateMockupHTML(
    type: string,
    data: Record<string, string>
  ): string {
    // Use the same mockup generation logic from HTMLSlideGenerator
    // For simplicity, inline basic versions here
    switch (type) {
      case "github":
        return `<div style="background: #0d1117; border: 1px solid #30363d; border-radius: 12px; padding: 24px; color: #c9d1d9; max-width: 700px;">
          <div style="font-size: 24px; font-weight: 600; color: #58a6ff; margin-bottom: 16px;">${data.repoName || "username/repo"}</div>
          <div style="font-size: 18px; color: #8b949e; margin-bottom: 16px;">${data.description || "Repository description"}</div>
          <div style="display: flex; gap: 20px; font-size: 16px;">
            <span>⭐ ${data.stars || "12.5k"}</span>
            <span>${data.language || "TypeScript"}</span>
          </div>
        </div>`;

      case "terminal":
        return `<div style="background: #1e1e1e; border-radius: 8px; overflow: hidden; max-width: 700px; box-shadow: 0 8px 32px rgba(0,0,0,0.4);">
          <div style="background: #323232; padding: 10px 16px; display: flex; gap: 8px;">
            <div style="width: 12px; height: 12px; border-radius: 50%; background: #ff5f57;"></div>
            <div style="width: 12px; height: 12px; border-radius: 50%; background: #ffbd2e;"></div>
            <div style="width: 12px; height: 12px; border-radius: 50%; background: #28ca42;"></div>
          </div>
          <div style="padding: 24px; font-family: monospace; font-size: 18px;">
            <div style="margin-bottom: 12px;"><span style="color: #4ec9b0;">$</span> <span style="color: #dcdcdc;">${data.command || "npm install"}</span></div>
            <div style="color: #ce9178;">${data.output || "✓ Package installed successfully"}</div>
          </div>
        </div>`;

      case "vscode":
        return `<div style="background: #1e1e1e; border-radius: 8px; overflow: hidden; max-width: 800px;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background: #2d2d30;">
            <div style="background: #1e1e1e; padding: 20px;">
              <div style="font-size: 14px; color: #8b949e; margin-bottom: 12px; text-transform: uppercase;">Before</div>
              <pre style="font-family: monospace; font-size: 16px; background: #4b1818; color: #f48771; padding: 12px; border-radius: 4px; border-left: 3px solid #f85149;">${data.beforeCode || "const value = 10;"}</pre>
            </div>
            <div style="background: #1e1e1e; padding: 20px;">
              <div style="font-size: 14px; color: #8b949e; margin-bottom: 12px; text-transform: uppercase;">After</div>
              <pre style="font-family: monospace; font-size: 16px; background: #1a4d1a; color: #8ddb8c; padding: 12px; border-radius: 4px; border-left: 3px solid #3fb950;">${data.afterCode || "const value = 100;"}</pre>
            </div>
          </div>
        </div>`;

      case "twitter":
        return `<div style="background: #000000; border: 1px solid #2f3336; border-radius: 16px; padding: 24px; max-width: 650px; color: #e7e9ea;">
          <div style="font-size: 20px; line-height: 1.5; margin-bottom: 16px;">${data.tweetText || "Breaking: Major tech announcement"}</div>
          <div style="display: flex; gap: 24px; padding-top: 12px; border-top: 1px solid #2f3336; font-size: 16px; color: #71767b;">
            <span>❤️ ${data.likes || "24.5K"}</span>
            <span>🔄 ${data.retweets || "3.2K"}</span>
          </div>
        </div>`;

      case "chart":
        const value = parseInt(data.value || "85");
        const barWidth = Math.min(100, Math.max(0, value));
        return `<div style="background: rgba(255,255,255,0.05); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 32px; max-width: 700px;">
          <div style="font-size: 24px; font-weight: 700; margin-bottom: 20px;">${data.metric || "Performance"}</div>
          <div style="background: rgba(255,255,255,0.1); border-radius: 8px; height: 60px; overflow: hidden; margin-bottom: 16px;">
            <div style="height: 100%; width: ${barWidth}%; background: linear-gradient(90deg, #00ff88 0%, #00d4ff 100%); display: flex; align-items: center; justify-content: flex-end; padding-right: 20px;">
              <span style="font-size: 28px; font-weight: 900; color: #000;">${data.value || "85%"}</span>
            </div>
          </div>
          ${data.comparison ? `<div style="font-size: 18px; opacity: 0.8;">${data.comparison}</div>` : ""}
        </div>`;

      default:
        return "";
    }
  }

  /**
   * Generate HTML for a single slide with new design
   */
  private generateSingleSlideHTML(
    slide: {
      type: string;
      title?: string;
      subtitle?: string;
      mockupType?: string;
      mockupData?: Record<string, string>;
      backgroundColor?: string;
      textColor?: string;
      cta?: string;
    },
    index: number,
    config: { branding: { logo: string } },
    width: number,
    height: number
  ): string {
    const slideClass = `slide-${slide.type}`;
    const bgColor = slide.backgroundColor || "#000000";
    const textColor = slide.textColor || "#ffffff";

    let content = "";

    if (slide.type === "intro") {
      // Hook slide - bold text
      content = `
        <div class="intro-content">
          <h1 class="intro-title">${slide.title || ""}</h1>
          ${slide.subtitle ? `<p class="intro-subtitle">${slide.subtitle}</p>` : ""}
        </div>
      `;
    } else if (slide.type === "content") {
      // Article slide - with mockup if available
      const hasMockup = slide.mockupType && slide.mockupType !== "none";

      if (hasMockup && slide.mockupType) {
        // New design with mockup
        const mockupHTML = this.generateMockupHTML(
          slide.mockupType,
          slide.mockupData || {}
        );
        content = `
          <div class="content-wrapper">
            <div class="mockup-section">${mockupHTML}</div>
            <div class="text-section">
              <h2 class="article-title">${slide.title || ""}</h2>
              ${slide.subtitle ? `<p class="article-description">${slide.subtitle}</p>` : ""}
            </div>
          </div>
        `;
      } else {
        // Fallback: simple text layout
        content = `
          <div class="content-wrapper-simple">
            <h2 class="article-title">${slide.title || ""}</h2>
            ${slide.subtitle ? `<p class="article-description">${slide.subtitle}</p>` : ""}
          </div>
        `;
      }
    } else if (slide.type === "cta") {
      // CTA slide - simple and bold
      content = `
        <div class="cta-content">
          <h1 class="cta-title">${slide.title || ""}</h1>
          ${slide.subtitle ? `<p class="cta-subtitle">${slide.subtitle}</p>` : ""}
          ${slide.cta ? `<div class="cta-link">${slide.cta}</div>` : ""}
        </div>
      `;
    }

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Slide ${index + 1}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      width: ${width}px;
      height: ${height}px;
      overflow: hidden;
    }

    .slide {
      width: 100%;
      height: 100%;
      position: relative;
      overflow: hidden;
    }

    /* Intro slide */
    .slide-intro {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .intro-content {
      text-align: center;
      padding: ${width > 1080 ? "80px" : "60px"};
      max-width: 900px;
    }

    .intro-title {
      font-size: ${width > 1080 ? "80px" : "64px"};
      font-weight: 900;
      line-height: 1.05;
      letter-spacing: -0.04em;
      margin-bottom: ${width > 1080 ? "24px" : "16px"};
    }

    .intro-subtitle {
      font-size: ${width > 1080 ? "32px" : "24px"};
      font-weight: 600;
      line-height: 1.3;
      opacity: 0.9;
    }

    /* Content slide */
    .slide-content {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .content-wrapper {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      padding: ${width > 1080 ? "60px" : "40px"};
    }

    .mockup-section {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: ${width > 1080 ? "40px" : "30px"};
    }

    .text-section {
      padding: ${width > 1080 ? "40px" : "30px"};
    }

    .content-wrapper-simple {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: ${width > 1080 ? "80px" : "60px"};
      text-align: center;
    }

    .article-title {
      font-size: ${width > 1080 ? "56px" : "44px"};
      font-weight: 900;
      line-height: 1.1;
      letter-spacing: -0.03em;
      margin-bottom: ${width > 1080 ? "16px" : "12px"};
    }

    .article-description {
      font-size: ${width > 1080 ? "24px" : "20px"};
      font-weight: 600;
      line-height: 1.3;
      opacity: 0.9;
    }

    /* CTA slide */
    .slide-cta {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .cta-content {
      text-align: center;
      padding: ${width > 1080 ? "80px" : "60px"};
      max-width: 800px;
    }

    .cta-title {
      font-size: ${width > 1080 ? "72px" : "56px"};
      font-weight: 900;
      line-height: 1.1;
      letter-spacing: -0.03em;
      margin-bottom: ${width > 1080 ? "24px" : "20px"};
    }

    .cta-subtitle {
      font-size: ${width > 1080 ? "32px" : "24px"};
      font-weight: 600;
      line-height: 1.3;
      opacity: 0.9;
      margin-bottom: ${width > 1080 ? "32px" : "24px"};
    }

    .cta-link {
      font-size: ${width > 1080 ? "40px" : "32px"};
      font-weight: 800;
      line-height: 1.2;
    }

    .logo {
      position: absolute;
      bottom: ${width > 1080 ? "40px" : "30px"};
      left: 50%;
      transform: translateX(-50%);
      font-size: ${width > 1080 ? "24px" : "20px"};
      font-weight: 700;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      letter-spacing: -0.01em;
      opacity: 0.7;
    }
  </style>
</head>
<body>
  <div class="slide ${slideClass}" style="background: ${bgColor}; color: ${textColor};">
    ${content}
    <div class="logo">${config.branding.logo}</div>
  </div>
</body>
</html>`;
  }
}
