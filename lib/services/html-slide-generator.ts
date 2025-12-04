/**
 * HTML Slide Generator for Social Media Content
 *
 * Generates styled HTML slides optimized for screen recording
 * on different social media platforms (TikTok, Instagram, Twitter)
 */

interface SlideContent {
  type: "intro" | "content" | "cta";
  title?: string;
  subtitle?: string;
  points?: string[];
  cta?: string;
  icon?: string;
  mockupType?: "github" | "terminal" | "vscode" | "twitter" | "chart" | "none";
  mockupData?: {
    // GitHub mockup data
    repoName?: string;
    stars?: string;
    language?: string;
    description?: string;

    // Terminal mockup data
    command?: string;
    output?: string;

    // VS Code mockup data
    beforeCode?: string;
    afterCode?: string;

    // Twitter mockup data
    tweetText?: string;
    likes?: string;
    retweets?: string;

    // Chart mockup data
    metric?: string;
    value?: string;
    comparison?: string;
  };
  backgroundColor?: string;
  textColor?: string;
}

interface SlideConfig {
  platform: "tiktok" | "instagram-square" | "instagram-story" | "twitter";
  slides: SlideContent[];
  branding: {
    logo: string;
    primaryColor: string;
    secondaryColor: string;
  };
  metadata: {
    subject: string;
    duration: string;
  };
}

export class HTMLSlideGenerator {
  /**
   * Generate complete HTML document with slides
   */
  generateHTML(config: SlideConfig): string {
    const { width, height } = this.getDimensions(config.platform);
    const slides = config.slides.map((slide, index) =>
      this.generateSlide(slide, index, config)
    ).join("\n");

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${config.metadata.subject} - ${config.platform} Slides</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: #000;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 20px;
      overflow-x: hidden;
    }

    .slide-container {
      width: ${width}px;
      height: ${height}px;
      margin: 20px auto;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
      overflow: hidden;
      position: relative;
    }

    .slide {
      width: 100%;
      height: 100%;
      position: relative;
      overflow: hidden;
    }

    /* Intro slide - bold text on solid background */
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

    /* Content slide - mockup + text layout */
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

    /* CTA slide - simple and bold */
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


    /* Mockup Styles */

    /* GitHub Mockup */
    .github-mockup {
      background: #0d1117;
      border: 1px solid #30363d;
      border-radius: 12px;
      padding: ${width > 1080 ? "24px" : "20px"};
      max-width: 700px;
      color: #c9d1d9;
    }

    .github-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }

    .github-icon {
      color: #8b949e;
    }

    .github-repo-name {
      font-size: ${width > 1080 ? "24px" : "20px"};
      font-weight: 600;
      color: #58a6ff;
    }

    .github-description {
      font-size: ${width > 1080 ? "18px" : "16px"};
      color: #8b949e;
      margin-bottom: 16px;
      line-height: 1.5;
    }

    .github-stats {
      display: flex;
      gap: 20px;
      align-items: center;
      font-size: ${width > 1080 ? "16px" : "14px"};
    }

    .github-stat {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #8b949e;
    }

    .github-stat svg {
      fill: #8b949e;
    }

    .github-language {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .language-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
    }

    /* Terminal Mockup */
    .terminal-mockup {
      background: #1e1e1e;
      border-radius: 8px;
      overflow: hidden;
      max-width: 700px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    }

    .terminal-header {
      background: #323232;
      padding: 10px 16px;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .terminal-buttons {
      display: flex;
      gap: 8px;
    }

    .terminal-button {
      width: 12px;
      height: 12px;
      border-radius: 50%;
    }

    .terminal-button.red {
      background: #ff5f57;
    }

    .terminal-button.yellow {
      background: #ffbd2e;
    }

    .terminal-button.green {
      background: #28ca42;
    }

    .terminal-title {
      font-size: 14px;
      color: #8b949e;
      font-weight: 500;
    }

    .terminal-body {
      padding: ${width > 1080 ? "24px" : "20px"};
      font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
      font-size: ${width > 1080 ? "18px" : "16px"};
    }

    .terminal-line {
      margin-bottom: 12px;
    }

    .terminal-prompt {
      color: #4ec9b0;
      margin-right: 8px;
    }

    .terminal-command {
      color: #dcdcdc;
    }

    .terminal-output {
      color: #ce9178;
      margin-top: 8px;
      line-height: 1.6;
    }

    /* VS Code Mockup */
    .vscode-mockup {
      background: #1e1e1e;
      border-radius: 8px;
      overflow: hidden;
      max-width: 800px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    }

    .vscode-header {
      background: #2d2d30;
      padding: 8px 16px;
    }

    .vscode-tab {
      display: inline-block;
      background: #1e1e1e;
      padding: 6px 16px;
      border-radius: 4px 4px 0 0;
      font-size: ${width > 1080 ? "16px" : "14px"};
      color: #cccccc;
    }

    .vscode-diff {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1px;
      background: #2d2d30;
    }

    .vscode-before,
    .vscode-after {
      background: #1e1e1e;
      padding: ${width > 1080 ? "20px" : "16px"};
    }

    .vscode-label {
      font-size: ${width > 1080 ? "14px" : "12px"};
      color: #8b949e;
      margin-bottom: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .vscode-code {
      font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
      font-size: ${width > 1080 ? "16px" : "14px"};
      line-height: 1.6;
      margin: 0;
      padding: 12px;
      border-radius: 4px;
    }

    .vscode-code.removed {
      background: #4b1818;
      color: #f48771;
      border-left: 3px solid #f85149;
    }

    .vscode-code.added {
      background: #1a4d1a;
      color: #8ddb8c;
      border-left: 3px solid #3fb950;
    }

    /* Twitter Mockup */
    .twitter-mockup {
      background: #000000;
      border: 1px solid #2f3336;
      border-radius: 16px;
      padding: ${width > 1080 ? "24px" : "20px"};
      max-width: 650px;
      color: #e7e9ea;
    }

    .twitter-header {
      display: flex;
      gap: 12px;
      margin-bottom: 12px;
    }

    .twitter-avatar {
      width: 48px;
      height: 48px;
      background: #536471;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
    }

    .twitter-user {
      flex: 1;
    }

    .twitter-name {
      font-size: ${width > 1080 ? "18px" : "16px"};
      font-weight: 700;
      color: #e7e9ea;
    }

    .twitter-handle {
      font-size: ${width > 1080 ? "16px" : "14px"};
      color: #71767b;
    }

    .twitter-text {
      font-size: ${width > 1080 ? "20px" : "18px"};
      line-height: 1.5;
      margin-bottom: 16px;
      color: #e7e9ea;
    }

    .twitter-stats {
      display: flex;
      gap: 24px;
      padding-top: 12px;
      border-top: 1px solid #2f3336;
    }

    .twitter-stat {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #71767b;
      font-size: ${width > 1080 ? "16px" : "14px"};
    }

    .twitter-stat svg {
      fill: #71767b;
    }

    /* Chart Mockup */
    .chart-mockup {
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      padding: ${width > 1080 ? "32px" : "24px"};
      max-width: 700px;
    }

    .chart-title {
      font-size: ${width > 1080 ? "24px" : "20px"};
      font-weight: 700;
      margin-bottom: 20px;
      opacity: 0.9;
    }

    .chart-bar-container {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      height: ${width > 1080 ? "60px" : "50px"};
      overflow: hidden;
      margin-bottom: 16px;
    }

    .chart-bar {
      height: 100%;
      background: linear-gradient(90deg, #00ff88 0%, #00d4ff 100%);
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding-right: 20px;
      transition: width 0.3s ease;
    }

    .chart-value {
      font-size: ${width > 1080 ? "28px" : "24px"};
      font-weight: 900;
      color: #000;
    }

    .chart-comparison {
      font-size: ${width > 1080 ? "18px" : "16px"};
      opacity: 0.8;
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

    .instructions {
      max-width: ${width}px;
      margin: 40px auto;
      padding: 30px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      color: #fff;
      backdrop-filter: blur(10px);
    }

    .instructions h2 {
      font-size: 24px;
      margin-bottom: 15px;
      color: #fbbf24;
    }

    .instructions p {
      font-size: 16px;
      line-height: 1.6;
      margin-bottom: 10px;
      color: rgba(255, 255, 255, 0.9);
    }

    .instructions ul {
      list-style-position: inside;
      margin-left: 20px;
    }

    .instructions li {
      margin-bottom: 8px;
      font-size: 15px;
      color: rgba(255, 255, 255, 0.8);
    }

    .instructions code {
      background: rgba(0, 0, 0, 0.3);
      padding: 2px 8px;
      border-radius: 4px;
      font-family: monospace;
      color: #fbbf24;
    }

    @media (max-width: ${width + 100}px) {
      body {
        padding: 10px;
      }
      .slide-container {
        transform: scale(0.8);
      }
    }
  </style>
</head>
<body>
  <div class="instructions">
    <h2>📹 How to Record These Slides</h2>
    <p><strong>Recommended Tools:</strong></p>
    <ul>
      <li><strong>Mac:</strong> QuickTime Player (File → New Screen Recording) or <code>Cmd+Shift+5</code></li>
      <li><strong>Windows:</strong> Xbox Game Bar (<code>Win+G</code>) or OBS Studio</li>
      <li><strong>Cross-platform:</strong> OBS Studio (free) or Loom</li>
    </ul>
    <p><strong>Tips:</strong></p>
    <ul>
      <li>Set your recording area to exactly <strong>${width}x${height}px</strong></li>
      <li>Record each slide for <strong>3-5 seconds</strong></li>
      <li>Use <code>F11</code> for fullscreen mode before recording</li>
      <li>Import recordings into CapCut, InShot, or your video editor</li>
      <li>Add trending audio and you're done!</li>
    </ul>
    <p><strong>Platform:</strong> ${config.platform.toUpperCase()} (${width}x${height}px) | <strong>Duration:</strong> ${config.metadata.duration}</p>
  </div>

  ${slides}

  <div class="instructions">
    <h2>✨ Next Steps</h2>
    <p>1. Press <code>F11</code> to enter fullscreen</p>
    <p>2. Start your screen recorder</p>
    <p>3. Scroll down slowly, giving each slide 3-5 seconds</p>
    <p>4. Stop recording and edit in your favorite video editor</p>
    <p>5. Add music, transitions, and post to ${config.platform}!</p>
  </div>
</body>
</html>`;
  }

  /**
   * Generate a single slide with dynamic mockups
   */
  private generateSlide(slide: SlideContent, index: number, config: SlideConfig): string {
    const slideClass = `slide-${slide.type}`;
    const bgColor = slide.backgroundColor || "#000000";
    const textColor = slide.textColor || "#ffffff";

    let content = "";

    if (slide.type === "intro") {
      // Hook slide - full screen bold text
      content = `
        <div class="intro-content">
          <h1 class="intro-title">${slide.title || ""}</h1>
          ${slide.subtitle ? `<p class="intro-subtitle">${slide.subtitle}</p>` : ""}
        </div>
      `;
    } else if (slide.type === "content") {
      // Article slide with dynamic mockup
      const mockupHTML = this.generateMockup(slide.mockupType || "none", slide.mockupData || {});

      content = `
        <div class="content-wrapper">
          ${mockupHTML ? `<div class="mockup-section">${mockupHTML}</div>` : ""}
          <div class="text-section">
            <h2 class="article-title">${slide.title || ""}</h2>
            ${slide.subtitle ? `<p class="article-description">${slide.subtitle}</p>` : ""}
          </div>
        </div>
      `;
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

    return `
  <div class="slide-container">
    <div class="slide ${slideClass}" style="background: ${bgColor}; color: ${textColor};">
      ${content}
      <div class="logo">${config.branding.logo}</div>
    </div>
  </div>`;
  }

  /**
   * Generate dynamic mockup HTML based on type
   */
  private generateMockup(type: string, data: any): string {
    switch (type) {
      case "github":
        return this.generateGitHubMockup(data);
      case "terminal":
        return this.generateTerminalMockup(data);
      case "vscode":
        return this.generateVSCodeMockup(data);
      case "twitter":
        return this.generateTwitterMockup(data);
      case "chart":
        return this.generateChartMockup(data);
      default:
        return "";
    }
  }

  /**
   * Generate GitHub repo card mockup
   */
  private generateGitHubMockup(data: any): string {
    return `
      <div class="github-mockup">
        <div class="github-header">
          <svg class="github-icon" viewBox="0 0 16 16" width="20" height="20">
            <path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
          </svg>
          <span class="github-repo-name">${data.repoName || "username/repo"}</span>
        </div>
        <div class="github-description">${data.description || "Repository description"}</div>
        <div class="github-stats">
          <div class="github-stat">
            <svg viewBox="0 0 16 16" width="14" height="14">
              <path fill="currentColor" d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z"/>
            </svg>
            <span>${data.stars || "12.5k"}</span>
          </div>
          <div class="github-language">
            <span class="language-dot" style="background-color: #3178c6;"></span>
            <span>${data.language || "TypeScript"}</span>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Generate terminal/CLI mockup
   */
  private generateTerminalMockup(data: any): string {
    return `
      <div class="terminal-mockup">
        <div class="terminal-header">
          <div class="terminal-buttons">
            <span class="terminal-button red"></span>
            <span class="terminal-button yellow"></span>
            <span class="terminal-button green"></span>
          </div>
          <div class="terminal-title">bash</div>
        </div>
        <div class="terminal-body">
          <div class="terminal-line">
            <span class="terminal-prompt">$</span>
            <span class="terminal-command">${data.command || "npm install"}</span>
          </div>
          <div class="terminal-output">${data.output || "✓ Package installed successfully"}</div>
        </div>
      </div>
    `;
  }

  /**
   * Generate VS Code diff mockup
   */
  private generateVSCodeMockup(data: any): string {
    return `
      <div class="vscode-mockup">
        <div class="vscode-header">
          <div class="vscode-tab">app.tsx</div>
        </div>
        <div class="vscode-diff">
          <div class="vscode-before">
            <div class="vscode-label">Before</div>
            <pre class="vscode-code removed">${data.beforeCode || "const value = 10;"}</pre>
          </div>
          <div class="vscode-after">
            <div class="vscode-label">After</div>
            <pre class="vscode-code added">${data.afterCode || "const value = 100;"}</pre>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Generate Twitter/X post mockup
   */
  private generateTwitterMockup(data: any): string {
    return `
      <div class="twitter-mockup">
        <div class="twitter-header">
          <div class="twitter-avatar">👤</div>
          <div class="twitter-user">
            <div class="twitter-name">Tech News</div>
            <div class="twitter-handle">@technews</div>
          </div>
        </div>
        <div class="twitter-text">${data.tweetText || "Breaking: Major tech announcement"}</div>
        <div class="twitter-stats">
          <div class="twitter-stat">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path fill="currentColor" d="M12 21.638h-.014C9.403 21.59 1.95 14.856 1.95 8.478c0-3.064 2.525-5.754 5.403-5.754 2.29 0 3.83 1.58 4.646 2.73.814-1.148 2.354-2.73 4.645-2.73 2.88 0 5.404 2.69 5.404 5.755 0 6.376-7.454 13.11-10.037 13.157H12z"/>
            </svg>
            <span>${data.likes || "24.5K"}</span>
          </div>
          <div class="twitter-stat">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path fill="currentColor" d="M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.79-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88zM16.5 6H11V4h5.5c2.209 0 4 1.79 4 4v8.45l2.068-1.93 1.364 1.46-4.432 4.14-4.432-4.14 1.364-1.46 2.068 1.93V8c0-1.1-.896-2-2-2z"/>
            </svg>
            <span>${data.retweets || "3.2K"}</span>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Generate performance chart mockup
   */
  private generateChartMockup(data: any): string {
    const value = parseInt(data.value || "85");
    const barWidth = Math.min(100, Math.max(0, value));

    return `
      <div class="chart-mockup">
        <div class="chart-title">${data.metric || "Performance"}</div>
        <div class="chart-bar-container">
          <div class="chart-bar" style="width: ${barWidth}%;">
            <span class="chart-value">${data.value || "85%"}</span>
          </div>
        </div>
        ${data.comparison ? `<div class="chart-comparison">${data.comparison}</div>` : ""}
      </div>
    `;
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
   * Parse social media content into slides with dynamic content
   */
  async parseContentToSlides(
    platform: string,
    content: string,
    subject: string,
    hashtags: string,
    articles?: Array<{ title: string; summary: string; category?: string }>,
    slideData?: any // Pre-generated slide data from analyzer
  ): Promise<SlideConfig> {
    // Determine platform type
    let platformType: "tiktok" | "instagram-square" | "instagram-story" | "twitter" = "tiktok";
    if (platform.includes("instagram") && !platform.includes("story")) {
      platformType = "instagram-square";
    } else if (platform.includes("story")) {
      platformType = "instagram-story";
    } else if (platform.includes("twitter")) {
      platformType = "twitter";
    }

    const slides: SlideContent[] = [];

    // If we have pre-generated slide data, use it
    if (slideData) {
      // Intro slide with dynamic hook
      slides.push({
        type: "intro",
        title: slideData.hook || "This week in tech",
        subtitle: slideData.subtitle || "",
        backgroundColor: "#000000",
        textColor: "#ffffff",
      });

      // Content slides with dynamic mockups
      slideData.slides.forEach((slide: any) => {
        slides.push({
          type: "content",
          title: slide.title,
          subtitle: slide.description,
          mockupType: slide.mockupType,
          mockupData: slide.mockupData,
          backgroundColor: slide.backgroundColor,
          textColor: slide.textColor,
        });
      });

      // CTA slide
      slides.push({
        type: "cta",
        title: slideData.cta.title,
        subtitle: slideData.cta.subtitle,
        cta: slideData.cta.link,
        backgroundColor: "#000000",
        textColor: "#ffffff",
      });
    } else {
      // Fallback to simple slides if no slide data provided
      slides.push({
        type: "intro",
        title: "This week in tech",
        subtitle: "",
        backgroundColor: "#000000",
        textColor: "#ffffff",
      });

      if (articles && articles.length > 0) {
        const topArticles = articles.slice(0, 3);
        const backgroundColors = ["#000000", "#ffffff", "#0099FF"];
        const textColors = ["#ffffff", "#000000", "#ffffff"];

        topArticles.forEach((article, index) => {
          slides.push({
            type: "content",
            title: article.title,
            subtitle: article.summary?.substring(0, 70) || "",
            mockupType: "none",
            mockupData: {},
            backgroundColor: backgroundColors[index % 3],
            textColor: textColors[index % 3],
          });
        });
      }

      slides.push({
        type: "cta",
        title: "Stay ahead of the curve",
        subtitle: "",
        cta: "techupkeep.dev",
        backgroundColor: "#000000",
        textColor: "#ffffff",
      });
    }

    return {
      platform: platformType,
      slides,
      branding: {
        logo: "techUpkeep()",
        primaryColor: "#6366f1",
        secondaryColor: "#1a1a2e",
      },
      metadata: {
        subject,
        duration: `${slides.length * 4}s (${slides.length} slides × 4s each)`,
      },
    };
  }

  /**
   * Get emoji for category
   */
  private getCategoryEmoji(category?: string): string {
    const categoryMap: Record<string, string> = {
      "ai-ml": "🤖",
      "engineering": "⚙️",
      "tools": "🛠️",
      "devops": "🚀",
      "product": "📦",
      "career": "💼",
      "news": "📰",
    };
    return category ? categoryMap[category] || "💡" : "💡";
  }
}
