import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Mail, Inbox, Search, Sparkles } from "lucide-react";
import Logo from "@/components/layout/Logo";
import BlogVisitTracker from "@/components/BlogVisitTracker";
import BlogSubscriptionModal from "@/components/BlogSubscriptionModal";
import BlogInlineSubscription from "@/components/BlogInlineSubscription";

export const metadata: Metadata = {
  title: "Why I Built Tech Upkeep: Fixing My Newsletter Problem | Tech Upkeep",
  description:
    "My inbox was a mess of tech newsletters, most of which I didn't read. So I built Tech Upkeep to curate the tech news I actually care about.",
  keywords: [
    "tech newsletter",
    "why build newsletter",
    "curated tech news",
    "developer newsletter",
    "tech curation",
    "newsletter problem",
  ],
  openGraph: {
    title: "Why I Built Tech Upkeep: Fixing My Newsletter Problem",
    description:
      "My inbox was a mess of tech newsletters. So I built Tech Upkeep to curate what I actually care about.",
    url: "https://www.techupkeep.dev/blog/why-i-built-tech-upkeep",
    type: "article",
    publishedTime: "2025-10-27T00:00:00Z",
    images: [
      {
        url: "https://www.techupkeep.dev/og-image.jpeg",
        width: 1200,
        height: 630,
        alt: "Why I Built Tech Upkeep - Tech Newsletter Origin Story",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["https://www.techupkeep.dev/og-image.jpeg"],
  },
  alternates: {
    canonical: "https://www.techupkeep.dev/blog/why-i-built-tech-upkeep",
  },
};

export default function BlogPost() {
  return (
    <div className="min-h-screen bg-gray-950">
      <BlogVisitTracker page="/blog/why-i-built-tech-upkeep" />
      <BlogSubscriptionModal
        source="blog"
        sourcePage="/blog/why-i-built-tech-upkeep"
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
          <span className="inline-block px-3 py-1 text-xs font-medium bg-purple-500/10 text-purple-400 rounded-full border border-purple-500/20 mb-4">
            Origin Story
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-100 mb-4 leading-tight">
            Why I Built Tech Upkeep
          </h1>
          <p className="text-xl text-gray-400 mb-4">
            My inbox was a mess. So I fixed it.
          </p>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <time dateTime="2025-10-27">October 27, 2025</time>
            <span>·</span>
            <span>8 min read</span>
          </div>
        </header>

        <div className="prose prose-invert prose-lg max-w-none">
          <p className="text-gray-300 leading-relaxed mb-6">
            I used to be subscribed to 23 different tech newsletters.
          </p>

          <p className="text-gray-300 leading-relaxed mb-6">
            Every morning, I'd wake up to an inbox full of "must-read" articles,
            "breaking news" in tech, and "exclusive insights" that weren't
            actually that exclusive. Some days I'd get 15+ newsletter emails
            before I even had my coffee.
          </p>

          <p className="text-gray-300 leading-relaxed mb-8">
            I wasn't reading most of them, I'd skim the subject lines, maybe
            open 2 or 3, and just ignore the rest.
          </p>

          <div className="bg-red-900/10 border border-red-500/20 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-100 mb-3 flex items-center gap-2">
              <Inbox className="h-5 w-5 text-red-400" />
              The Newsletter Problem
            </h3>
            <p className="text-gray-300 text-sm mb-4">
              Most tech newsletters fall into one of these buckets:
            </p>
            <ul className="space-y-2 text-gray-300 text-sm mb-0">
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-1">•</span>
                <span>
                  <strong>Too broad:</strong> They cover everything from AI to
                  blockchain to web3 to no-code. I don't care about half of it.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-1">•</span>
                <span>
                  <strong>Too narrow:</strong> Great if you're deep into one
                  niche, but I need to know what's happening across the whole
                  ecosystem.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-1">•</span>
                <span>
                  <strong>Too much noise:</strong> Some contained tech gossips
                  and interesting news that are not useful to me.
                </span>
              </li>
            </ul>
          </div>

          <h2 className="text-3xl font-bold text-gray-100 mb-4 mt-12">TLDR</h2>

          <p className="text-gray-300 mb-4">
            I tried TLDR. It's probably the closest thing to what I wanted. But
            you needed to subscribe to multiple categories separately.
          </p>

          <p className="text-gray-300 mb-4">
            Want tech news? Subscribe to TLDR Tech. Want AI updates? TLDR AI.
            Want crypto news? TLDR Crypto. Want web dev? TLDR Web Dev.
          </p>

          <p className="text-gray-300 mb-6">
            Now every morning i receive a series of newsletters and i ultimately
            ended up ignoring a few of them due to the spam.
          </p>

          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 mb-8">
            <p className="text-gray-300 text-sm italic">
              "There has to be a better way to stay updated without drowning in
              newsletters.""
            </p>
          </div>

          <h2 className="text-3xl font-bold text-gray-100 mb-4 mt-12">
            What I Actually Wanted
          </h2>

          <p className="text-gray-300 mb-4">Here's what I realized I needed:</p>

          <ul className="space-y-3 mb-8 text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-1 flex-shrink-0">✓</span>
              <span>
                <strong className="text-gray-100">
                  One email, multiple topics.
                </strong>{" "}
                Give me AI, DevOps, Web Dev, infrastructure updates - all in one
                place.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-1 flex-shrink-0">✓</span>
              <span>
                <strong className="text-gray-100">
                  Curated, not comprehensive.
                </strong>{" "}
                I don't need every article published. I need the 10-15 things
                worth my time. Something that can keep me updated on the latest
                trends, the big tech trends and the tools that are actually
                useful.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-1 flex-shrink-0">✓</span>
              <span>
                <strong className="text-gray-100">
                  Twice a week, not weekly.
                </strong>{" "}
                Tuesday and Friday. Small, digestible doses.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-1 flex-shrink-0">✓</span>
              <span>
                <strong className="text-gray-100">No fluff.</strong> No "Tesla
                may lose Elon Muusk if shareholders dont approve..."" or "OpenAI
                says yes to erotica for adult users." Just good technical
                content.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-1 flex-shrink-0">✓</span>
              <span>
                <strong className="text-gray-100">
                  Sources I actually trust.
                </strong>{" "}
                Netflix engineering blog? Yes. Random Medium post? Probably not.
              </span>
            </li>
          </ul>

          <p className="text-gray-300 mb-8">
            I wanted it to help me <strong>learn</strong>. Not just stay updated
            for the sake of it, but actually understand what's happening in tech
            and why it matters.
          </p>

          <h2 className="text-3xl font-bold text-gray-100 mb-4 mt-12">
            So I Just Built It
          </h2>

          <p className="text-gray-300 mb-4">
            Here's the thing - I was already doing this for myself anyway.
          </p>

          <p className="text-gray-300 mb-4">
            Every few days, I'd spend an hour going through my sources. Checking
            GitHub Trending. Skimming Hacker News. Reading a few engineering
            blogs. Browsing Reddit. I'd bookmark the good stuff, save them in
            google drive and read them later and ignore the rest.
          </p>

          <p className="text-gray-300 mb-6">
            Then one day I thought: "If I'm already curating this stuff for
            myself, why not just send it out to other people who might find it
            useful?"
          </p>

          <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-xl p-6 mb-10">
            <h3 className="text-xl font-bold text-gray-100 mb-3 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-400" />
              The Realization
            </h3>
            <p className="text-gray-300 text-sm">
              I wasn't trying to build a startup. I wasn't trying to "disrupt
              newsletters" or whatever. I just wanted to solve my own problem -
              and maybe help a few other developers who had the same inbox
              nightmare I did.
            </p>
          </div>

          <p className="text-gray-300 mb-8">
            So I built Tech Upkeep. Not as some grand vision, but as a tool to
            make my own life easier, and if it helps others? That's honestly
            just a bonus.
          </p>

          <h2 className="text-3xl font-bold text-gray-100 mb-4 mt-12">
            How It Actually Works
          </h2>

          <p className="text-gray-300 mb-4">
            I aggregate content from 110+ sources (I add more sources as time
            goes on). Blogs, YouTube channels, podcasts, Reddit, GitHub
            Trending, Substacks - basically everywhere good tech content lives.
          </p>

          <p className="text-gray-300 mb-4">
            Then I filter it. Hard. Out of a few hundred items per week, I send
            maybe 20-ish per newsletter. If i don't like it, it doesn't make the
            cut.
          </p>

          <p className="text-gray-300 mb-6">
            The result? Two emails a week - Tuesday and Friday - with 20-25
            articles each. Categorized by topic (AI, Web Dev, DevOps, etc.) so
            you can quickly scan for what matters to you.
          </p>

          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 mb-8">
            <h4 className="font-semibold text-gray-100 mb-3">
              What Gets Included:
            </h4>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-blue-400">•</span>
                <span>
                  Engineering blogs from companies actually building at scale
                  (Netflix, Uber, Stripe, etc.)
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400">•</span>
                <span>
                  GitHub Trending projects (because discovering new tools early
                  is fun)
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400">•</span>
                <span>
                  Deep dives and technical breakdowns (not surface-level "intro
                  to X" posts)
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400">•</span>
                <span>
                  Postmortems and war stories (we learn more from failures than
                  successes)
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400">•</span>
                <span>
                  Emerging tools and frameworks (but only if they're actually
                  interesting)
                </span>
              </li>
            </ul>
          </div>

          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 mb-8">
            <h4 className="font-semibold text-gray-100 mb-3">
              What Gets Filtered Out:
            </h4>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-red-400">•</span>
                <span>Obvious marketing disguised as content</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400">•</span>
                <span>
                  "Here's my take on [trending topic]" hot takes with no
                  substance
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400">•</span>
                <span>
                  Beginner tutorials (there are better places for those)
                </span>
              </li>
            </ul>
          </div>

          <h2 className="text-3xl font-bold text-gray-100 mb-4 mt-12">
            Why Curation Matters
          </h2>

          <p className="text-gray-300 mb-4">
            Anyone can build an RSS aggregator. That's not hard. I think the
            hard part is curation - deciding what's worth someone's time and
            what isn't. I am using myself as a benchmark so maybe it doesnt
            appeal to others so maybe this isn't for everyone.
          </p>

          <p className="text-gray-300 mb-4">
            I treat every newsletter like I'm sending it to myself. Because
            honestly, I am. I read everything I send. If it's not good enough
            for me to read, it's not good enough to send.
          </p>

          <p className="text-gray-300 mb-8">
            That's the difference between Tech Upkeep and just another "tech
            news roundup." This isn't automated.It's me, a developer, sharing
            what I think other developers should know about.
          </p>

          <h2 className="text-3xl font-bold text-gray-100 mb-4 mt-12">
            The Future
          </h2>

          <p className="text-gray-300 mb-4">
            I'm keeping it simple. No plans to scale this into some massive
            media company or whatever. No ads. No sponsored content. Just
            curating content as a byproduct of my own learning.
          </p>

          <p className="text-gray-300 mb-4">
            Will I eventually charge for it? Maybe, but quite unlikely. Right
            now it's free because I'm doing it for myself anyway. But if it
            keeps growing, I might just get sponsors or something.
          </p>

          <p className="text-gray-300 mb-8">
            For now, I'm just focused on making it the newsletter that I want. A
            simple, curated newsletter that I would want to read.
          </p>

          <div className="bg-blue-900/20 border-l-4 border-blue-500 p-6 mb-8">
            <p className="text-gray-300 text-sm">
              <strong className="text-blue-300">
                If this sounds like something you'd find useful:
              </strong>{" "}
              That's literally why I built it. Give it a shot. Worst case, you
              unsubscribe and we both move on with our lives. Best case, you
              finally fix your newsletter inbox problem like I fixed mine.
            </p>
          </div>

          <p className="text-gray-300 mb-6">
            And if you don't like it? That's cool too. Maybe you're one of those
            people who actually reads all 23 newsletters every morning. More
            power to you.
          </p>

          <p className="text-gray-300">
            But if you're like me - tired of inbox overload, tired of missing
            good content, tired of subscribing to 6 different newsletters just
            to stay updated then yeah, maybe give it a shot.
          </p>
        </div>

        <p className="text-gray-300">
          Thanks for reading! Hope you subscribe :)
        </p>

        <BlogInlineSubscription
          source="blog"
          sourcePage="/blog/why-i-built-tech-upkeep"
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
            © 2025 Tech Upkeep. Built for engineers who want to learn and grow.
          </p>
        </div>
      </footer>
    </div>
  );
}
