/**
 * Hook pattern types for content generation variety
 */

export interface HookPattern {
  id: string;
  name: string;
  description: string;
  examples: string[];
  prompt: string;
}

export const HOOK_PATTERNS: HookPattern[] = [
  {
    id: "numbered_list",
    name: "Numbered List",
    description: "Classic count-based hooks (3 tools, 5 tips, etc.)",
    examples: [
      "3 AI tools that beat ChatGPT",
      "5 dev tools you're missing out on",
      "7 performance wins this week",
    ],
    prompt: `Create a numbered hook (e.g., "3 tools", "5 updates") that promises specific value. Use a number that matches the article count.
Requirements:
- Use a number (3, 5, 7, etc.)
- Promise specific value or benefit
- Make it feel exclusive or scarce
- Max 8 words`,
  },
  {
    id: "provocative_statement",
    name: "Provocative Statement",
    description: "Bold claims that challenge assumptions",
    examples: [
      "Your framework choice is wrong",
      "AI just ate your job",
      "This changes everything",
      "Nobody talks about this",
    ],
    prompt: `Create a provocative statement that challenges assumptions or makes a bold claim about the theme.
Requirements:
- Make a bold, controversial (but true) claim
- Challenge common beliefs
- Create instant curiosity
- Max 7 words
- NO numbers`,
  },
  {
    id: "curiosity_gap",
    name: "Curiosity Gap",
    description: "Create information gaps that demand answers",
    examples: [
      "What Google isn't telling you",
      "The secret every senior dev knows",
      "Why everyone's switching to this",
      "What happened to TypeScript",
    ],
    prompt: `Create a hook that opens an information gap - hint at secret knowledge or hidden information.
Requirements:
- Use words like "what", "why", "how", "secret", "hidden"
- Promise exclusive insider information
- Don't reveal the full story
- Max 8 words
- NO numbers`,
  },
  {
    id: "trend_alert",
    name: "Trend Alert",
    description: "Highlight emerging trends and movements",
    examples: [
      "Everyone's moving to Rust",
      "Open source is eating the world",
      "AI development just shifted",
      "The new way to build apps",
    ],
    prompt: `Create a hook highlighting a trend or shift happening in tech right now.
Requirements:
- Use present tense action words
- Emphasize movement or change
- Make it feel current/urgent
- Max 8 words
- NO numbers`,
  },
  {
    id: "outcome_focused",
    name: "Outcome Focused",
    description: "Promise specific results or transformations",
    examples: [
      "Build faster with these tools",
      "Get promoted with this skill",
      "Ship products like senior devs",
      "Code quality just got easier",
    ],
    prompt: `Create a hook that promises a specific outcome or benefit from the content.
Requirements:
- Focus on the end result/benefit
- Use action verbs (build, ship, get, make)
- Promise transformation
- Max 8 words
- NO numbers`,
  },
  {
    id: "warning",
    name: "Warning/Caution",
    description: "Warn about risks, mistakes, or things to avoid",
    examples: [
      "Stop using this framework",
      "Your code has this bug",
      "This will break production",
      "Devs keep making this mistake",
    ],
    prompt: `Create a hook that warns about a risk, mistake, or problem to avoid.
Requirements:
- Use warning language (stop, avoid, don't, dangerous)
- Create urgency to watch
- Highlight a problem
- Max 8 words
- NO numbers`,
  },
  {
    id: "comparison",
    name: "Comparison",
    description: "Compare tools, approaches, or before/after states",
    examples: [
      "Old way vs new way",
      "Junior dev vs senior dev",
      "This beats everything else",
      "Better than the alternatives",
    ],
    prompt: `Create a hook that sets up a comparison or contrast.
Requirements:
- Use comparison language (vs, better, beats, instead)
- Set up a battle or choice
- Create competitive interest
- Max 8 words
- NO numbers unless comparing 2 specific things`,
  },
  {
    id: "insider_language",
    name: "Insider Language",
    description: "Use developer slang and community language",
    examples: [
      "This hits different",
      "Absolute game changer",
      "Not even close",
      "Peak developer experience",
      "Simply unmatched",
    ],
    prompt: `Create a hook using casual developer language and slang that feels authentic.
Requirements:
- Use conversational dev language
- Feel natural, not corporate
- Could be something a dev would say
- Max 8 words
- NO formal language
- NO numbers`,
  },
];

/**
 * Get next hook pattern in rotation
 */
export function getNextHookPattern(lastPatternId?: string): HookPattern {
  if (!lastPatternId) {
    // First time: use numbered list as default
    return HOOK_PATTERNS[0];
  }

  const currentIndex = HOOK_PATTERNS.findIndex((p) => p.id === lastPatternId);
  const nextIndex = (currentIndex + 1) % HOOK_PATTERNS.length;
  return HOOK_PATTERNS[nextIndex];
}

/**
 * Get a random hook pattern (for more variety)
 */
export function getRandomHookPattern(excludeIds: string[] = []): HookPattern {
  const available = HOOK_PATTERNS.filter((p) => !excludeIds.includes(p.id));
  if (available.length === 0) return HOOK_PATTERNS[0];
  return available[Math.floor(Math.random() * available.length)];
}

/**
 * Get hook pattern by ID
 */
export function getHookPatternById(id: string): HookPattern | undefined {
  return HOOK_PATTERNS.find((p) => p.id === id);
}
