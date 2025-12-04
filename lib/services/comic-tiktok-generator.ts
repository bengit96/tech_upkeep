import { db } from "../db";
import { content } from "../db/schema";
import { desc, eq, inArray } from "drizzle-orm";
import { chatWithModelFallback } from "../utils/ai-fallback";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ComicSlide {
  slideNumber: number;
  title: string;
  character: string; // Main character for this slide
  dialogue: string; // What the character says
  imagePrompt: string; // Detailed image prompt
  narration: string; // TikTok voice-over narration
}

export interface ComicEpisode {
  episodeNumber: number;
  newsTitle: string;
  newsSummary: string;
  mainTake: string; // Overall hot take
  hook: string; // TikTok hook
  slides: ComicSlide[];
  hashtags: string;
  theme: string; // e.g., "Corporate Life", "Tech Industry", "Startup World"
}

interface ContentItem {
  id: number;
  title: string;
  summary: string;
  sourceType: string;
}

/**
 * Generates multi-slide comic series in "The Woke Salaryman" style
 * Each episode is a 3-5 slide narrative arc with character-driven humor
 */
export class ComicTikTokGenerator {
  /**
   * Get the latest episode number
   */
  async getLatestEpisodeNumber(): Promise<number> {
    try {
      return Math.floor(Math.random() * 1000) + 1;
    } catch (error) {
      console.error("Error getting latest episode number:", error);
      return 1;
    }
  }

  /**
   * Fetch content by IDs
   */
  async getContentByIds(ids: number[]): Promise<ContentItem[]> {
    try {
      const items = await db
        .select({
          id: content.id,
          title: content.title,
          summary: content.summary,
          sourceType: content.sourceType,
        })
        .from(content)
        .where(inArray(content.id, ids));

      return items;
    } catch (error) {
      console.error("Error fetching content:", error);
      return [];
    }
  }

  /**
   * Generate main hot take
   */
  async generateMainTake(
    newsTitle: string,
    newsSummary: string
  ): Promise<string> {
    const prompt = `You are a witty tech commentator creating a contrarian take for a satirical comic series (like The Woke Salaryman).

News: "${newsTitle}"
Summary: "${newsSummary}"

Generate ONE SHORT, PUNCHY contrarian take (1-2 sentences) that:
1. Challenges the hype or obvious narrative
2. Is funny/clever but insightful
3. Could be the theme of a multi-panel comic

Examples:
- "Everyone celebrates the new AI tool, but nobody asks if we actually needed it"
- "Your startup just got funded. Time to work 80 hours for 'the mission'"
- "Senior engineers leaving for AI startups, but nobody built the fundamentals"

Return ONLY the take, no extra text.`;

    try {
      const { response } = await chatWithModelFallback(openai, {
        messages: [{ role: "user", content: prompt }],
        max_tokens: 150,
      });

      return response.choices[0]?.message?.content || "";
    } catch (error) {
      console.error("Error generating main take:", error);
      return "Plot twist: Nobody knows what's actually happening";
    }
  }

  /**
   * Generate multi-slide comic narrative
   */
  async generateComicSlides(
    newsTitle: string,
    newsSummary: string,
    mainTake: string
  ): Promise<ComicSlide[]> {
    const prompt = `Create a 4-slide satirical comic STORY in "The Woke Salaryman" style about: "${newsTitle}"

Main take: "${mainTake}"

CRITICAL: The 4 slides must form a CONTINUOUS NARRATIVE where each slide builds on the previous one.

**NARRATIVE STRUCTURE (Required):**
- SLIDE 1 (Setup): Introduce the situation/problem. Character discovers or mentions the issue.
- SLIDE 2 (Development): The problem deepens or the character reacts. Show escalation or complication.
- SLIDE 3 (Escalation): Consequences appear or the absurdity becomes clear. Build tension/humor.
- SLIDE 4 (Resolution/Punchline): Deliver the satirical payoff. Conclusion that drives home the hot take.

**EXAMPLE STORY ARC:**
Slide 1: "New AI tool launched! Everyone excited"
Slide 2: "CEO claims it will replace entire departments"
Slide 3: "Engineer realizes it just does what Excel does"
Slide 4: "Company celebrates anyway and mandates adoption"

Generate exactly 4 slides with recurring characters (same names across slides for continuity). Each slide should:
- Have a CHARACTER (e.g., "CEO", "Engineer", "Recruiter", "PM") - USE SAME CHARACTER NAMES THROUGHOUT
- Have DIALOGUE (what they say, 1-2 lines) - SHOULD REFERENCE PREVIOUS SLIDES
- Have an IMAGE PROMPT (detailed, illustrated, character-driven)
- Have NARRATION (voice-over for TikTok, 1-2 lines)

Style guidelines for IMAGE PROMPTS:
- Illustrated art style (like The Woke Salaryman comics)
- Show human characters with expressive faces and emotions
- Include background (office, startup, coffee shop, etc.)
- Add visual humor (charts, whiteboards, laptops, etc.)
- Use speech bubbles or thought bubbles
- Color palette: warm, corporate-looking with satirical touches
- Comic panel style with clean lines

Format your response EXACTLY like this:
SLIDE 1:
CHARACTER: [Name]
DIALOGUE: [What they say]
IMAGE PROMPT: [Detailed illustrated prompt]
NARRATION: [TikTok voice-over]

SLIDE 2:
CHARACTER: [Name]
DIALOGUE: [Reference slide 1 situation, show reaction/escalation]
IMAGE PROMPT: [Detailed illustrated prompt]
NARRATION: [TikTok voice-over]

SLIDE 3:
CHARACTER: [Name]
DIALOGUE: [Deepens the problem, shows absurdity]
IMAGE PROMPT: [Detailed illustrated prompt]
NARRATION: [TikTok voice-over]

SLIDE 4:
CHARACTER: [Name]
DIALOGUE: [Delivers the punchline, concludes the story]
IMAGE PROMPT: [Detailed illustrated prompt]
NARRATION: [TikTok voice-over]

REMEMBER: Each slide continues the story. The 4 slides together form ONE complete narrative arc about the problem/take.`;

    try {
      const { response } = await chatWithModelFallback(openai, {
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1200,
      });

      const text = response.choices[0]?.message?.content || "";
      const slides = this.parseComicSlides(text);
      return slides;
    } catch (error) {
      console.error("Error generating comic slides:", error);
      return [];
    }
  }

  /**
   * Parse the response into structured slides
   */
  private parseComicSlides(text: string): ComicSlide[] {
    const slides: ComicSlide[] = [];
    const slideMatches = text.match(/SLIDE \d+:([\s\S]*?)(?=SLIDE \d+:|$)/g) || [];

    slideMatches.forEach((slideText, index) => {
      const charMatch = slideText.match(/CHARACTER:\s*(.+?)(?:\n|$)/);
      const dialogueMatch = slideText.match(/DIALOGUE:\s*(.+?)(?:\nIMAGE|$)/s);
      const imageMatch = slideText.match(/IMAGE PROMPT:\s*(.+?)(?:\nNARRATION|$)/s);
      const narrationMatch = slideText.match(/NARRATION:\s*(.+?)$/s);

      if (charMatch && dialogueMatch && imageMatch && narrationMatch) {
        slides.push({
          slideNumber: index + 1,
          title: `Slide ${index + 1}`,
          character: charMatch[1].trim(),
          dialogue: dialogueMatch[1].trim(),
          imagePrompt: imageMatch[1].trim(),
          narration: narrationMatch[1].trim(),
        });
      }
    });

    return slides.length > 0 ? slides : this.generateFallbackSlides();
  }

  /**
   * Fallback slides if parsing fails - Proper narrative arc
   */
  private generateFallbackSlides(): ComicSlide[] {
    return [
      {
        slideNumber: 1,
        title: "Slide 1 - Setup",
        character: "Engineer",
        dialogue: "They launched a new 'revolutionary' product!",
        imagePrompt:
          "Illustrated comic panel: Young engineer at desk, excited expression, pointing at laptop screen with glowing app icon. Office background with whiteboards covered in sketches. Warm colors, energetic mood, comic panel style. Other colleagues in background looking at screens.",
        narration: "Everything started with an exciting announcement.",
      },
      {
        slideNumber: 2,
        title: "Slide 2 - Development",
        character: "CEO",
        dialogue: "It will replace entire departments! Incredible ROI!",
        imagePrompt:
          "Illustrated comic panel: CEO in suit confidently standing in front of massive upward arrow graph. Bright smile, pointing upward with emphasis. Modern office, expensive furniture visible. Stock charts and profit graphs surround the character. Comic art with bold, exaggerated features.",
        narration: "The CEO promised transformational impact and guaranteed success.",
      },
      {
        slideNumber: 3,
        title: "Slide 3 - Escalation",
        character: "Engineer",
        dialogue: "Wait... this just does what Excel did 5 years ago...",
        imagePrompt:
          "Illustrated comic panel: Engineer looking shocked and confused, pointing at laptop showing Excel spreadsheet next to the new product interface. Question marks and confused expression. Colleagues in background equally confused. Office setting with papers scattered. Realization mood, comic style.",
        narration: "After testing, the truth became obvious to everyone.",
      },
      {
        slideNumber: 4,
        title: "Slide 4 - Resolution",
        character: "CEO & Engineer",
        dialogue: "CEO: 'Still ship it!' Engineer: 'Of course, boss.'",
        imagePrompt:
          "Illustrated comic panel: CEO and engineer shaking hands with resigned, knowing smiles. Both looking at camera with subtle eye roll. Office meeting room background. Excel still open on screen in the background (small detail). Satirical mood, humorous resignation. Comic panel style with muted corporate colors.",
        narration: "And so the cycle of corporate innovation continued.",
      },
    ];
  }

  /**
   * Generate hook for TikTok
   */
  async generateHook(take: string, newsTitle: string): Promise<string> {
    const prompt = `Create a punchy TikTok hook (1-2 seconds max) for this take:
"${take}"

The hook should:
- Stop scrolling (shocking/funny/relatable)
- Be a question OR bold statement
- Reference the topic: ${newsTitle}

Return ONLY the hook, no extra text.`;

    try {
      const { response } = await chatWithModelFallback(openai, {
        messages: [{ role: "user", content: prompt }],
        max_tokens: 100,
      });

      return response.choices[0]?.message?.content || "Wait, is this actually...?";
    } catch (error) {
      console.error("Error generating hook:", error);
      return "Here's a wild take...";
    }
  }

  /**
   * Generate hashtags
   */
  generateHashtags(newsTitle: string, sourceType: string): string {
    const baseHashtags = [
      "#TechComedy",
      "#WorkHumor",
      "#TechIndustry",
      "#SatireComics",
      "#Startup",
    ];

    if (newsTitle.toLowerCase().includes("ai")) {
      baseHashtags.push("#AI", "#ChatGPT");
    }
    if (newsTitle.toLowerCase().includes("startup")) {
      baseHashtags.push("#Startup", "#Founder");
    }

    baseHashtags.push("#CorporateHumor", "#TechLife", "#Engineering");

    return baseHashtags.slice(0, 8).join(" ");
  }

  /**
   * Generate complete comic episode from selected content
   */
  async generateComicEpisode(
    contentIds: number[]
  ): Promise<ComicEpisode | null> {
    try {
      // Fetch the selected content
      const items = await this.getContentByIds(contentIds);
      if (items.length === 0) {
        throw new Error("No valid content found for selected IDs");
      }

      // Use the first selected item as the main story
      const mainItem = items[0];

      // Get episode number
      const episodeNumber = await this.getLatestEpisodeNumber();

      // Generate main take
      console.log("🎬 Generating contrarian take...");
      const mainTake = await this.generateMainTake(
        mainItem.title,
        mainItem.summary
      );

      // Generate multi-slide comic
      console.log("🎨 Creating comic narrative...");
      const slides = await this.generateComicSlides(
        mainItem.title,
        mainItem.summary,
        mainTake
      );

      // Generate TikTok hook
      console.log("📱 Writing TikTok hook...");
      const hook = await this.generateHook(mainTake, mainItem.title);

      // Generate hashtags
      const hashtags = this.generateHashtags(mainItem.title, mainItem.sourceType);

      return {
        episodeNumber,
        newsTitle: mainItem.title,
        newsSummary: mainItem.summary,
        mainTake,
        hook,
        slides,
        hashtags,
        theme: "Corporate Tech Life",
      };
    } catch (error) {
      console.error("Error generating comic episode:", error);
      throw error;
    }
  }

  /**
   * Get recent accepted content for selection
   */
  async getRecentContent(limit: number = 15): Promise<ContentItem[]> {
    try {
      const items = await db
        .select({
          id: content.id,
          title: content.title,
          summary: content.summary,
          sourceType: content.sourceType,
        })
        .from(content)
        .where(eq(content.status, "accepted"))
        .orderBy(desc(content.createdAt))
        .limit(limit);

      return items;
    } catch (error) {
      console.error("Error fetching recent content:", error);
      return [];
    }
  }
}
