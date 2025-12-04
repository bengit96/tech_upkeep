/**
 * Screenshot Blog Sections
 * Captures visual screenshots of blog post sections preserving exact design
 *
 * SIMPLIFIED APPROACH:
 * 1. Navigate to blog post
 * 2. Find the section (H2 + following content)
 * 3. Apply CSS zoom in-place (no cloning!)
 * 4. Screenshot directly
 */

import puppeteer from "puppeteer";

export interface ScreenshotOptions {
  slug: string;
  sectionIndex: number;
  width?: number;
  height?: number;
}

export async function screenshotBlogSection(
  options: ScreenshotOptions
): Promise<string> {
  const { slug, sectionIndex, width = 1080, height = 1920 } = options;

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();

    // Set viewport to ACTUAL slide size (not 3x!)
    await page.setViewport({
      width: width,
      height: height,
      deviceScaleFactor: 2  // Retina quality
    });

    // Navigate to blog post
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3030";
    const blogUrl = `${baseUrl}/blog/${slug}`;

    await page.goto(blogUrl, {
      waitUntil: "networkidle0",
      timeout: 30000,
    });

    // Wait for content to load
    await page.waitForSelector(".prose", { timeout: 10000 });

    // Prepare the section for screenshot (in-place transformation)
    const sectionInfo = await page.evaluate(
      (idx: number, slideWidth: number, slideHeight: number) => {
        const proseContainer = document.querySelector(".prose");
        if (!proseContainer) return null;

        const headers = Array.from(
          proseContainer.querySelectorAll("h2")
        ) as HTMLElement[];

        if (!headers[idx]) return null;

        const currentH2 = headers[idx];
        const nextH2 = headers[idx + 1];

        // Create a temporary container for this section
        const sectionWrapper = document.createElement("div");
        sectionWrapper.id = "tiktok-slide-section";
        sectionWrapper.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          width: ${slideWidth}px;
          height: ${slideHeight}px;
          background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
          padding: 80px 60px;
          overflow: hidden;
          z-index: 999999;
          display: flex;
          flex-direction: column;
          gap: 32px;
        `;

        // Extract H2 text content (not JSX)
        const h2Text = currentH2.textContent?.trim() || currentH2.innerText?.trim() || '';

        // Create clean H2 element with text only
        const h2Element = document.createElement("h2");
        h2Element.textContent = h2Text;
        h2Element.style.cssText = `
          font-size: 64px;
          font-weight: 900;
          line-height: 1.1;
          color: #ffffff;
          margin: 0;
          padding: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
        `;

        sectionWrapper.appendChild(h2Element);

        // Get the next 2-3 elements (p, ul, ol, etc.)
        let current = currentH2.nextElementSibling;
        let elementCount = 0;
        const MAX_ELEMENTS = 3;

        while (current && current !== nextH2 && elementCount < MAX_ELEMENTS) {
          const tagName = current.tagName?.toLowerCase();

          // Skip non-content elements
          if (tagName === 'aside' || tagName === 'nav' || tagName === 'footer' || tagName === 'script') {
            current = current.nextElementSibling;
            continue;
          }

          // Extract text content (not JSX)
          const textContent = (current as HTMLElement).textContent?.trim() ||
                             (current as HTMLElement).innerText?.trim() || '';

          // Skip empty elements or JSX-only content
          if (!textContent || textContent.includes('{') && textContent.includes('}') && textContent.length < 50) {
            current = current.nextElementSibling;
            continue;
          }

          // Create clean element with extracted text
          let cleanElement: HTMLElement;

          if (tagName === 'p') {
            cleanElement = document.createElement('p');
            cleanElement.textContent = textContent;
            cleanElement.style.cssText = `
              font-size: 32px;
              line-height: 1.6;
              color: #e2e8f0;
              margin: 0 0 24px 0;
              padding: 0;
              overflow: hidden;
              text-overflow: ellipsis;
              display: -webkit-box;
              -webkit-line-clamp: 4;
              -webkit-box-orient: vertical;
            `;
          } else if (tagName === 'ul' || tagName === 'ol') {
            cleanElement = document.createElement(tagName);

            // Extract list items
            const listItems = (current as HTMLElement).querySelectorAll('li');
            let itemCount = 0;
            const MAX_LIST_ITEMS = 4;

            listItems.forEach((li) => {
              if (itemCount >= MAX_LIST_ITEMS) return;

              const liText = li.textContent?.trim() || li.innerText?.trim() || '';
              if (liText && !liText.includes('{')) {
                const liElement = document.createElement('li');
                liElement.textContent = liText;
                liElement.style.cssText = `
                  margin-bottom: 12px;
                  color: #e2e8f0;
                  overflow: hidden;
                  text-overflow: ellipsis;
                  display: -webkit-box;
                  -webkit-line-clamp: 2;
                  -webkit-box-orient: vertical;
                `;
                cleanElement.appendChild(liElement);
                itemCount++;
              }
            });

            cleanElement.style.cssText = `
              font-size: 28px;
              line-height: 1.8;
              color: #e2e8f0;
              margin: 0 0 24px 0;
              padding-left: 40px;
            `;
          } else if (tagName === 'pre' || tagName === 'code') {
            cleanElement = document.createElement('pre');
            cleanElement.textContent = textContent.slice(0, 200) + (textContent.length > 200 ? '...' : '');
            cleanElement.style.cssText = `
              font-size: 24px;
              line-height: 1.6;
              color: #94a3b8;
              background: rgba(0, 0, 0, 0.3);
              padding: 20px;
              border-radius: 8px;
              margin: 0 0 24px 0;
              overflow: hidden;
              max-height: 300px;
              white-space: pre-wrap;
              word-wrap: break-word;
            `;
          } else {
            // Default styling for other elements
            cleanElement = document.createElement('div');
            cleanElement.textContent = textContent;
            cleanElement.style.cssText = `
              font-size: 30px;
              line-height: 1.6;
              color: #e2e8f0;
              margin: 0 0 24px 0;
              overflow: hidden;
              text-overflow: ellipsis;
              display: -webkit-box;
              -webkit-line-clamp: 3;
              -webkit-box-orient: vertical;
            `;
          }

          sectionWrapper.appendChild(cleanElement);
          elementCount++;
          current = current.nextElementSibling;
        }

        // Add branding at bottom
        const branding = document.createElement("div");
        branding.style.cssText = `
          margin-top: auto;
          padding-top: 40px;
          font-size: 24px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.6);
          text-align: center;
        `;
        branding.textContent = "Tech Upkeep";
        sectionWrapper.appendChild(branding);

        // Append to body
        document.body.appendChild(sectionWrapper);

        return { success: true };
      },
      sectionIndex,
      width,
      height
    );

    if (!sectionInfo) {
      throw new Error(`Failed to prepare section ${sectionIndex}`);
    }

    // Wait for rendering
    await new Promise(resolve => setTimeout(resolve, 800));

    // Screenshot the wrapper element directly
    const element = await page.$("#tiktok-slide-section");
    if (!element) {
      throw new Error("Section wrapper not found");
    }

    const screenshot = await element.screenshot({
      encoding: "base64",
      type: "png",
    });

    return screenshot as string;
  } finally {
    await browser.close();
  }
}
