import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CheckCircle, XCircle, TrendingUp } from "lucide-react";
import Logo from "@/components/layout/Logo";
import BlogVisitTracker from "@/components/BlogVisitTracker";
import BlogSubscriptionModal from "@/components/BlogSubscriptionModal";
import BlogInlineSubscription from "@/components/BlogInlineSubscription";

export const metadata = {
  title: "AI Coding Agents: What the Data Actually Shows | Tech Upkeep",
  description:
    "GitHub Copilot writes 46% of code at Microsoft. Google claims 2.5x productivity gains. Commonwealth Bank won't go back. Here's what's real, what's hype, and what actually works.",
  keywords: [
    "AI coding",
    "Claude Code",
    "Cursor",
    "developer productivity",
    "AI agents",
    "GitHub Copilot",
    "software development",
    "coding workflows",
    "AI assisted coding",
    "developer tools",
    "Gemini Code Assist",
  ],
  openGraph: {
    title: "AI Coding Agents: What the Data Actually Shows",
    description:
      "GitHub Copilot writes 46% of code at Microsoft. Real numbers from big tech and actual developers on what works, what doesn't.",
    url: "https://www.techupkeep.dev/blog/ai-coding-agents-reality-check",
    type: "article",
    publishedTime: "2025-11-14T00:00:00Z",
    images: [
      {
        url: "https://www.techupkeep.dev/og-image.jpeg",
        width: 1200,
        height: 630,
        alt: "AI Coding Agents: What the Data Actually Shows",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["https://www.techupkeep.dev/og-image.jpeg"],
  },
  alternates: {
    canonical: "https://www.techupkeep.dev/blog/ai-coding-agents-reality-check",
  },
};

export default function BlogPost() {
  return (
    <div className="min-h-screen bg-gray-950">
      <BlogVisitTracker page="/blog/ai-coding-agents-reality-check" />
      <BlogSubscriptionModal
        source="blog"
        sourcePage="/blog/ai-coding-agents-reality-check"
      />

      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <Link href="/">
            <Logo size="sm" variant="default" />
          </Link>
        </div>
      </header>

      <article className="container mx-auto px-4 py-12 max-w-3xl">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-blue-400 transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Blog
        </Link>

        <header className="mb-8">
          <span className="inline-block px-3 py-1 text-xs font-medium bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20 mb-4">
            Developer Productivity
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-100 mb-4 leading-tight">
            AI Coding Agents: What the Data Actually Shows
          </h1>
          <p className="text-xl text-gray-400 mb-4">
            GitHub Copilot writes 46% of code at Microsoft. Google claims 2.5x
            productivity gains. Commonwealth Bank won't go back. Here's what's
            real, what's hype, and what actually works.
          </p>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <time dateTime="2025-11-14">November 14, 2025</time>
            <span>·</span>
            <span>12 min read</span>
          </div>
        </header>

        <div className="prose prose-invert prose-lg max-w-none">
          <p className="text-gray-300 leading-relaxed mb-6">
            Over the past year, I've been building Tech Upkeep and several
            client projects with Claude Code and Cursor in the loop almost every
            day. The loudest takes about &quot;AI agents&quot; tend to argue
            about whether they will replace developers. The more useful question
            for most teams is narrower: where do these tools help right now, and
            where do they still waste time?
          </p>

          <p className="text-gray-300 leading-relaxed mb-6">
            This piece started as a response to Veith Röthlingshöfer&apos;s
            article{" "}
            <a
              href="https://octomind.dev/blog/why-agents-do-not-write-most-of-our-code-a-reality-check"
              className="text-blue-400 hover:text-blue-300 underline"
            >
              &quot;why agents DO NOT write most of our code - a reality
              check&quot;
            </a>
            . His team ran a week-long experiment trying to ship a feature
            almost entirely with agents and concluded that the current tools do
            not move the needle much. I think that conclusion mostly reflects
            how they used the tools - as relatively unconstrained agents without
            strong hooks, rather than as part of a workflow that bakes in tests,
            linting, and code review.
          </p>

          <p className="text-gray-300 leading-relaxed mb-6">
            We now have better data than hot takes. GitHub&apos;s controlled
            experiment with its Office of the Chief Economist found developers
            completed a set of coding tasks{" "}
            <strong className="text-gray-100">55% faster</strong> with Copilot
            (1h 11m vs. 2h 41m), with a statistically significant effect size{" "}
            <span className="whitespace-nowrap">(P = .0017)</span>.{" "}
            <a
              href="https://vladimirsiedykh.com/blog/ai-coding-assistant-comparison-claude-code-github-copilot-cursor-feature-analysis-2025"
              className="text-blue-400 hover:text-blue-300 underline"
            >
              Vladimir Siedykh&apos;s comparison of Claude Code, Copilot, and
              Cursor
            </a>{" "}
            walks through this research in more detail.
          </p>

          <p className="text-gray-300 leading-relaxed mb-6">
            An independent 2025 review of AI coding assistants by AI for Code
            comes to a similar conclusion from a different angle. They rank{" "}
            <strong className="text-gray-100">
              Cursor and GitHub Copilot as joint leaders at 95/100
            </strong>
            , with{" "}
            <strong className="text-gray-100">Claude Code at 90/100</strong> and
            JetBrains AI Assistant just behind. The scoring weights code
            generation quality, developer experience, advanced features,
            reliability, and value, and highlights Cursor&apos;s strength in
            multi-file refactors and Copilot&apos;s strength in IDE integration{" "}
            <a
              href="https://aiforcode.io/articles/best-ai-coding-assistants"
              className="text-blue-400 hover:text-blue-300 underline"
            >
              in their &quot;Best AI Coding Assistants 2025&quot; roundup
            </a>
            .
          </p>

          <p className="text-gray-300 leading-relaxed mb-6">
            Anthropic looked at hundreds of thousands of coding interactions
            with Claude and found that{" "}
            <strong className="text-gray-100">
              79% of conversations involved automation
            </strong>{" "}
            tasks where the AI actually executed work (editing files, running
            commands, making commits), not just suggesting snippets. That
            finding comes from{" "}
            <a
              href="https://www.anthropic.com/research/impact-software-development"
              className="text-blue-400 hover:text-blue-300 underline"
            >
              their &quot;Impact of AI on software development&quot; analysis
            </a>
            and matches what I see day to day: the biggest gains come when you
            let the tool handle repetitive changes and checks, not when you ask
            it to invent a whole system from scratch.
          </p>

          <h2 className="text-3xl font-bold text-gray-100 mb-4 mt-12">
            What the Data Actually Tells Us
          </h2>

          <p className="text-gray-300 leading-relaxed mb-6">
            If you zoom out across GitHub&apos;s research, case studies and
            independent analyses, a few themes show up repeatedly:
          </p>

          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-100 mb-3">
              GitHub Copilot in Numbers
            </h3>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-green-400">•</span>
                <span>
                  <strong>Speed:</strong> controlled experiments show{" "}
                  <strong>~55% faster task completion</strong> with Copilot
                  compared to a control group, as reported in{" "}
                  <a
                    href="https://vladimirsiedykh.com/blog/ai-coding-assistant-comparison-claude-code-github-copilot-cursor-feature-analysis-2025"
                    className="text-blue-400 hover:text-blue-300 underline"
                  >
                    Vladimir Siedykh&apos;s summary of the GitHub / Microsoft
                    study
                  </a>
                  .
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400">•</span>
                <span>
                  <strong>Adoption:</strong> Copilot now has tens of millions of
                  users and is used across a large majority of Fortune 100
                  engineering teams, according to multiple industry summaries of
                  GitHub&apos;s own data. The exact figure changes as GitHub
                  publishes new Octoverse and Copilot updates, but the direction
                  of travel is clear.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400">•</span>
                <span>
                  <strong>Risk:</strong> at least one independent analysis of
                  Copilot output found that a significant share of generated
                  Python samples contained potential security issues. That is a
                  strong argument for keeping human review, static analysis, and
                  security scanning in the loop rather than treating AI output
                  as trusted by default.
                </span>
              </li>
            </ul>
          </div>

          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-100 mb-3">
              Cursor and Claude Code in Numbers
            </h3>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-green-400">•</span>
                <span>
                  <strong>Cursor latency:</strong> autocomplete suggestions
                  around <strong>320 ms</strong>, compared to roughly{" "}
                  <strong>890 ms</strong> reported for Copilot in one benchmark,
                  which matters if you care about staying in flow. These figures
                  come from{" "}
                  <a
                    href="https://www.quickaidirectory.com/compare/github-copilot-vs-cursor"
                    className="text-blue-400 hover:text-blue-300 underline"
                  >
                    a Copilot vs Cursor comparison by Quick AI Directory
                  </a>
                  .
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400">•</span>
                <span>
                  <strong>Prediction quality:</strong> Cursor claims about{" "}
                  <strong>25% accuracy</strong> when predicting your next edits,
                  which lines up with Vladimir Siedykh&apos;s analysis of how
                  well it anticipates repeated patterns in web stacks, as
                  covered in{" "}
                  <a
                    href="https://vladimirsiedykh.com/blog/ai-coding-assistant-comparison-claude-code-github-copilot-cursor-feature-analysis-2025"
                    className="text-blue-400 hover:text-blue-300 underline"
                  >
                    his comparison of Claude Code, Copilot, and Cursor
                  </a>
                  .
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400">•</span>
                <span>
                  <strong>Claude Code limits:</strong> Anthropic has already had
                  to introduce weekly limits on certain Claude Code features
                  because a small fraction of users were running them
                  effectively nonstop. That change was described in{" "}
                  <a
                    href="https://www.tomsguide.com/ai/anthropic-is-putting-a-limit-on-a-claude-ai-feature-because-people-are-using-it-24-7"
                    className="text-blue-400 hover:text-blue-300 underline"
                  >
                    Tom&apos;s Guide&apos;s coverage of Claude Code limits
                  </a>
                  and is a good proxy for how heavily some teams lean on these
                  tools for automation.
                </span>
              </li>
            </ul>
          </div>

          <p className="text-gray-300 leading-relaxed mb-6">
            Put simply: in the aggregate, Copilot and similar tools make most
            developers faster and less frustrated, but they also happily
            generate flawed or insecure code if you let them. The numbers are
            good enough that ignoring the tools is becoming a strategic
            decision, not just a personal preference.
          </p>

          <p className="text-gray-300 leading-relaxed mb-6">
            You can see the same pattern in individual company reports. An AI
            coding assistant rollout at JPMorgan&apos;s software group, for
            example, was credited with{" "}
            <strong className="text-gray-100">
              roughly 10% to 20% efficiency gains for engineers
            </strong>{" "}
            in one public write-up from{" "}
            <a
              href="https://www.reuters.com/technology/artificial-intelligence/jpmorgan-engineers-efficiency-jumps-much-20-using-coding-assistant-2025-03-13/"
              className="text-blue-400 hover:text-blue-300 underline"
            >
              Reuters on JPMorgan&apos;s coding assistant rollout
            </a>
            . The exact numbers will differ on your team, but it is getting
            harder to argue that there is no signal underneath the hype.
          </p>

          <h2 className="text-3xl font-bold text-gray-100 mb-4 mt-12">
            Where AI Coding Tools Actually Help
          </h2>

          <p className="text-gray-300 leading-relaxed mb-6">
            When you look at how teams use Claude Code, Copilot and Cursor in
            practice (and not just in marketing demos), the wins are
            surprisingly consistent.
          </p>

          <h3 className="text-xl font-bold text-gray-100 mb-3 mt-6">
            1. Test Generation That Matches Your Style
          </h3>

          <p className="text-gray-300 leading-relaxed mb-6">
            The most reliable use case I see is test generation. If you
            hand-write 2–3 representative tests that show your patterns and
            expectations, tools like Copilot or Claude Code are very good at
            filling in the next 10–20. Roughly 70–80% of what they generate is
            acceptable with light edits. You still make the decisions about
            coverage and edge cases; the AI just saves you from typing the
            obvious variations.
          </p>

          <p className="text-gray-300 leading-relaxed mb-6">
            Not everyone is enthusiastic about letting AI write tests. Swizec
            Teller argues that using AI to generate tests can backfire when it
            produces shallow checks that do not encode real intent or edge
            cases, and that it can remove the useful &quot;head fake&quot; of
            developers thinking carefully about behaviour before coding{" "}
            <a
              href="https://swizec.com/blog/why-you-shouldnt-use-ai-to-write-your-tests/"
              className="text-blue-400 hover:text-blue-300 underline"
            >
              in his essay &quot;Why you shouldn&apos;t use AI to write your
              tests&quot;
            </a>
            . He suggests using AI instead to fuzz inputs, translate acceptance
            criteria into higher-level test scaffolds, or write code that
            satisfies tests you wrote yourself.
          </p>

          <p className="text-gray-300 leading-relaxed mb-6">
            I think these views are compatible. In practice, the setup that
            works is to keep humans responsible for deciding what needs to be
            tested and why, and to use AI only to expand obvious variations or
            mechanical cases once that intent is clear.
          </p>

          <h3 className="text-xl font-bold text-gray-100 mb-3 mt-6">
            2. Performance and Correctness Reviews
          </h3>

          <p className="text-gray-300 leading-relaxed mb-6">
            Having a second pair of eyes on pull requests used to mean finding
            another engineer with time. Now you can point Claude or Cursor at a
            diff and ask for specific checks: N+1 queries, unsafe concurrency,
            missing error handling, confusing public APIs. They will miss
            things, but they also reliably catch issues that slip past tired
            humans. I&apos;ve had Claude flag obvious N+1 queries in review that
            would have turned into slow endpoints in production.
          </p>

          <h3 className="text-xl font-bold text-gray-100 mb-3 mt-6">
            3. Eliminating &quot;Mechanical&quot; Work
          </h3>

          <p className="text-gray-300 leading-relaxed mb-6">
            Boilerplate is where AI shines. Updating DTOs and mappers after a
            schema change, wiring up dependency injection, adding logging in a
            consistent format, or porting the same pattern across 20 files are
            tedious, error-prone tasks for humans. Claude Code and Cursor, in
            particular, are very good at &quot;apply this pattern everywhere in
            this folder&quot; changes once you show them one good example.
          </p>

          <p className="text-gray-300 leading-relaxed mb-6">
            Even strong advocates of AI-assisted programming point out that the
            benefit depends heavily on how much boilerplate you write, and
            Karpathy&apos;s Nanochat project is a good example. He has talked
            about using models as an &quot;AI pair programmer&quot; for
            autocomplete and for rewriting repetitive pieces, but in this case
            Nanochat was &quot;basically entirely hand-written&quot; and
            attempts to use Claude or Codex agents were net unhelpful because
            the repository was too far off the models&apos; training
            distribution{" "}
            <a
              href="https://futurism.com/artificial-intelligence/inventor-vibe-coding-doesnt-work?nab=0"
              className="text-blue-400 hover:text-blue-300 underline"
            >
              as he explained in Futurism&apos;s write-up on Nanochat and vibe
              coding
            </a>
            . That is not an argument against AI assistance; it is a reminder
            that when your system is unique and low on boilerplate, most of the
            value still comes from small accelerations and you continue to need
            a lot of hand-written code and careful design.
          </p>

          <h3 className="text-xl font-bold text-gray-100 mb-3 mt-6">
            4. React and Frontend Cleanups
          </h3>

          <p className="text-gray-300 leading-relaxed mb-6">
            React codebases accumulate re-render problems, prop drilling, and
            awkward state management. Tools like Copilot and Cursor are weirdly
            good at spotting avoidable re-renders, missing <code>useMemo</code>/
            <code>useCallback</code> usage, and awkward dependency arrays once
            you prompt them with the right question. They are not a replacement
            for understanding React&apos;s rendering model, but they act like a
            linters-plus-advisor hybrid that can suggest concrete refactors. If
            you blindly accept every suggestion, you can still end up with
            components full of <code>useEffect</code> calls and scattered local
            state that need a human to simplify and pull back into a sane
            architecture.
          </p>

          <h3 className="text-xl font-bold text-gray-100 mb-3 mt-6">
            5. Documentation and Developer Notes
          </h3>

          <p className="text-gray-300 leading-relaxed mb-6">
            AI-generated documentation is rarely publish-ready, but it is
            excellent as a first draft. Asking Claude or Copilot to write a
            docstring, ADR outline, or README section from existing code and
            comments gets you from a blank page to &quot;good enough to
            edit&quot; in seconds. That small drop in activation energy is the
            difference between &quot;we should document this&quot; and actually
            checking in docs.
          </p>

          <h2 className="text-3xl font-bold text-gray-100 mb-4 mt-12">
            Where These Tools Still Struggle
          </h2>

          <p className="text-gray-300 leading-relaxed mb-6">
            The failure modes are also consistent. If you know them upfront, you
            avoid most of the pain.
          </p>

          <h3 className="text-2xl font-bold text-gray-100 mb-3 mt-8">
            Large, Unconstrained Feature Requests
          </h3>

          <p className="text-gray-300 leading-relaxed mb-6">
            Asking an AI assistant to &quot;build a full user management
            system&quot; across a real codebase almost always disappoints. The
            generated code tends to ignore your existing error handling
            conventions, persistence patterns, telemetry, and domain language.
            You burn time trying to retrofit the output into your architecture
            instead of guiding the design yourself. In practice, you get better
            results by treating AI as an assistant for small, composable steps
            and keeping system design in human hands.
          </p>

          <h3 className="text-2xl font-bold text-gray-100 mb-3 mt-8">
            Codebase-Wide Reasoning and Hallucinated Context
          </h3>

          <p className="text-gray-300 leading-relaxed mb-6">
            Even tools with strong codebase indexing will sometimes reference
            functions that were renamed, branches that no longer exist, or APIs
            that live in a different service. The larger your repository, the
            more likely it is that a model stitches together patterns that look
            plausible but don&apos;t match reality. You still need basic
            guardrails: grep before you blindly trust a suggestion, and keep
            tests close to behaviour.
          </p>

          <h3 className="text-2xl font-bold text-gray-100 mb-3 mt-8">
            Overconfidence and Security
          </h3>

          <p className="text-gray-300 leading-relaxed mb-6">
            The models never say &quot;I&apos;m not sure.&quot; That&apos;s a
            problem when empirical studies of tools like Copilot have found that
            a large share of generated code has security issues. One early
            paper, &quot;Asleep at the Keyboard? Assessing the Security of
            GitHub Copilot&apos;s Code Contributions,&quot; reported
            vulnerabilities in roughly 40% of the Copilot-generated solutions
            they evaluated{" "}
            <a
              href="https://arxiv.org/abs/2108.09293"
              className="text-blue-400 hover:text-blue-300 underline"
            >
              in their benchmark tasks
            </a>
            . You cannot safely adopt these tools without solid linting, code
            review, and automated security scanning. The right framing is
            simple: assume AI-written code is untrusted until it passes the same
            checks you&apos;d apply to a junior developer&apos;s work.
          </p>

          <h3 className="text-2xl font-bold text-gray-100 mb-3 mt-8">
            Closing Some Gaps With Agent Hooks
          </h3>

          <p className="text-gray-300 leading-relaxed mb-6">
            This is where I think the Octomind piece underestimates what is
            possible today. If you run an agent once, point it at a feature, and
            hope for the best, you get exactly the sort of thousand-line,
            half-working pull requests they describe{" "}
            <a
              href="https://octomind.dev/blog/why-agents-do-not-write-most-of-our-code-a-reality-check"
              className="text-blue-400 hover:text-blue-300 underline"
            >
              in Octomind&apos;s &quot;why agents DO NOT write most of our
              code&quot;
            </a>
            . The picture looks different if you wire agents into a set of
            predictable hooks and quality gates.
          </p>

          <p className="text-gray-300 leading-relaxed mb-6">
            A concrete example is{" "}
            <a
              href="https://github.com/wshobson/agents"
              className="text-blue-400 hover:text-blue-300 underline"
            >
              wshobson&apos;s &quot;agents&quot; toolkit for Claude Code
            </a>
            . It provides a catalog of agent commands and plugins that let you
            connect Claude to tests, linters, formatters, CI tasks, and external
            systems, with a configuration file that describes what
            &quot;good&quot; looks like for your project. Instead of asking an
            agent to refactor a whole feature in one go, you invoke smaller
            skills like &quot;update this file and run the tests,&quot;
            &quot;apply this migration pattern across these folders,&quot; or
            &quot;generate tests for this module and run the suite.&quot; That
            does not remove the need for review, but it addresses several of the
            specific problems the Octomind team ran into.
          </p>

          <h2 className="text-3xl font-bold text-gray-100 mb-4 mt-12">
            How Teams Are Actually Using Claude, Copilot, and Cursor
          </h2>

          <p className="text-gray-300 leading-relaxed mb-6">
            Real workflows look less like &quot;press a button and ship an
            app&quot; and more like mixing and matching tools for different
            stages of work.
          </p>

          <h3 className="text-2xl font-bold text-gray-100 mb-3 mt-8">
            The Two-Window Setup
          </h3>

          <p className="text-gray-300 leading-relaxed mb-6">
            A pattern I keep hearing: one monitor runs VS Code with Claude Code
            in the terminal, the other runs Cursor or plain VS Code with
            Copilot. Claude handles larger, multi-file changes and automation:
            &quot;update all the newsletter sources to use this new type&quot;
            or &quot;add logging around these code paths and run the
            tests.&quot; Cursor or Copilot then handle smaller edits,
            completions, and refactors while you read and tweak the changes.
          </p>

          <h3 className="text-2xl font-bold text-gray-100 mb-3 mt-8">
            A Refactor Pattern I Keep Hearing About
          </h3>

          <p className="text-gray-300 leading-relaxed mb-6">
            Several teams describe a similar pattern when they talk about using
            Cursor or Claude Code for larger refactors. A typical example is a
            payment or billing integration that used to take weeks of careful,
            manual edits across dozens of files. With agent-style workflows,
            engineers still plan the design and define the patterns, then let
            the tool apply the same refactor everywhere while they focus on
            verifying edge cases and adjusting business logic. The AI does not
            &quot;understand&quot; the domain, but it is good at consistent
            pattern application once the team provides a clear template.
          </p>

          <h3 className="text-2xl font-bold text-gray-100 mb-3 mt-8">
            A Pragmatic Personal Workflow
          </h3>

          <p className="text-gray-300 leading-relaxed mb-6">
            On this project, my own loop looks roughly like this:
          </p>

          <ul className="space-y-2 mb-6 text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-blue-400">•</span>
              <span>
                <strong>Iterate with agents:</strong> start in Claude Code,
                iterating on a plan and letting it propose concrete changes or
                drafts until I am happy with the direction.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400">•</span>
              <span>
                <strong>Review diffs, not vibes:</strong> read through the
                actual file diffs and commands the agent wants to run, accept
                only what makes sense, and discard or edit anything that does
                not match how I would structure the code.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400">•</span>
              <span>
                <strong>Implementation:</strong> once the direction is clear,
                write the core pieces myself, using AI mainly for autocomplete
                and obvious boilerplate, and keep tests, linters, and review in
                the loop.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400">•</span>
              <span>
                <strong>Cleanup:</strong> after behaviour is stable, use AI for
                mechanical refactors, dead code removal, and first-draft
                documentation while I focus on naming, structure, and edge
                cases.
              </span>
            </li>
          </ul>

          <h2 className="text-3xl font-bold text-gray-100 mb-4 mt-12">
            A Simple Rollout Plan for a Team
          </h2>

          <p className="text-gray-300 leading-relaxed mb-6">
            If you&apos;re responsible for an engineering team, you don&apos;t
            need a grand &quot;AI strategy&quot; to start seeing value. You do
            need a deliberate rollout.
          </p>

          <h3 className="text-xl font-bold text-gray-100 mb-3 mt-6">
            Step 1: Pick One Narrow Use Case
          </h3>

          <p className="text-gray-300 leading-relaxed mb-6">
            Test generation or small refactors in a non-critical service are
            usually the safest entry points. Measure something concrete: time to
            write tests, number of incidents, or time from PR opened to merged.
            Keep expectations modest for the first month.
          </p>

          <h3 className="text-xl font-bold text-gray-100 mb-3 mt-6">
            Step 2: Make Review Rules Explicit
          </h3>

          <p className="text-gray-300 leading-relaxed mb-6">
            Decide upfront how you&apos;ll treat AI suggestions in code review.
            Some teams tag AI-assisted PRs, others require tests for any
            AI-written logic, and many forbid committing AI-generated code
            without human edits in security-sensitive areas. Whatever you
            choose, write it down and apply it consistently.
          </p>

          <h3 className="text-xl font-bold text-gray-100 mb-3 mt-6">
            Step 3: Let Developers Choose Tools, Standardize the Guardrails
          </h3>

          <p className="text-gray-300 leading-relaxed mb-6">
            Developers will have preferences: some like Cursor, others prefer
            Copilot-plus-chat, others live in the terminal with Claude Code.
            That&apos;s fine. Standardize on the guardrails (testing, security
            scanning, review expectations), not the specific assistant. The
            market is moving fast; your constraints should survive tool churn.
          </p>

          <h3 className="text-xl font-bold text-gray-100 mb-3 mt-6">
            Step 4: Revisit After 3–6 Months with Real Metrics
          </h3>

          <p className="text-gray-300 leading-relaxed mb-6">
            After a few months, compare cycle times, incident rates, and
            subjective satisfaction before and after adoption. GitHub&apos;s
            research and various Copilot statistics suggest meaningful gains are
            possible, but the distribution is wide. Some teams see large
            improvements; others see little change because they never moved past
            &quot;autocomplete, but fancier.&quot;
          </p>

          <p className="text-gray-300 leading-relaxed mb-6">
            You also do not need to copy the most aggressive rollouts. Meta, for
            example, has started telling employees that performance appraisals
            will factor in how effectively they use internal AI tools{" "}
            <a
              href="https://www.financialexpress.com/life/technology-facebook-parent-meta-tells-employees-to-increase-ai-use-as-performance-appraisals-will-soon-factor-in-ai-impact-4046265/"
              className="text-blue-400 hover:text-blue-300 underline"
            >
              as reported by the Financial Express
            </a>
            . For most engineering teams, a clearer goal is to make AI
            assistance available, set sensible guardrails, and then measure
            whether it actually helps, rather than forcing usage for its own
            sake.
          </p>

          <h2 className="text-3xl font-bold text-gray-100 mb-4 mt-12">
            The Practical Takeaway
          </h2>

          <p className="text-gray-300 leading-relaxed mb-6">
            AI coding tools are already moving a measurable share of real-world
            development work. GitHub&apos;s own numbers and independent analyses
            are clear about that. They behave less like magic &quot;agents&quot;
            and more like a new layer in the tooling stack: fast pattern
            matchers and automation engines that sit beside your editor and CI.
          </p>

          <p className="text-gray-300 leading-relaxed mb-6">
            Teams that invest a little time in learning where these tools are
            reliable for tests, boilerplate, small refactors, and documentation,
            and where they are not for architecture or security-sensitive logic,
            already shipping faster with fewer frustrating chores. Teams that
            ignore them will still be able to ship software, but over the next
            few years the gap in velocity and morale is likely to become hard to
            miss.
          </p>
        </div>

        <BlogInlineSubscription
          source="blog"
          sourcePage="/blog/ai-coding-agents-reality-check"
          heading="Get the data that matters"
          description="I share real metrics and case studies from engineering teams twice a week. No vendor hype, just what's actually working in production."
        />

        <div className="mt-12 pt-8 border-t border-gray-800">
          <p className="text-gray-400 text-sm">
            Written by{" "}
            <span className="text-gray-200 font-medium">Benjamin Loh</span>,
            curator of Tech Upkeep
          </p>
        </div>
      </article>

      <footer className="border-t border-gray-800 py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-600 text-sm">
            © 2025 Tech Upkeep. Built for engineers who want real data, not
            hype.
          </p>
        </div>
      </footer>
    </div>
  );
}
