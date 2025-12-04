import Link from "next/link";
import {
  ArrowLeft,
  AlertCircle,
  CircuitBoard,
  Gauge,
  ShieldAlert,
  Target,
  TrendingDown,
  Zap,
} from "lucide-react";
import Logo from "@/components/layout/Logo";
import BlogVisitTracker from "@/components/BlogVisitTracker";
import BlogSubscriptionModal from "@/components/BlogSubscriptionModal";
import OutageTimeline from "@/components/blog/OutageTimeline";

export const metadata = {
  title:
    "The Year the Internet Kept Breaking: 2025's Major Cloud Outages and the AI Factor | Tech Upkeep",
  description:
    "Four headline outages in 2025 shared the same root causes: config drift, brittle control planes, and AI-fueled load. This teardown separates the useful lessons from the noise.",
  keywords: [
    "cloud outages 2025",
    "Cloudflare outage",
    "Azure outage",
    "AWS downtime",
    "Google Cloud outage",
    "AI infrastructure",
    "cloud reliability",
    "cloud infrastructure failure",
    "configuration errors",
    "hyperscaler outages",
  ],
  openGraph: {
    title:
      "The Year the Internet Kept Breaking: 2025's Major Cloud Outages and the AI Factor",
    description:
      "Four headline outages in 2025 shared the same root causes: config drift, brittle control planes, and AI-fueled load. This teardown separates the useful lessons from the noise.",
    url: "https://www.techupkeep.dev/blog/cloud-outages-2025-ai-infrastructure",
    type: "article",
    publishedTime: "2025-11-21T00:00:00Z",
    images: [
      {
        url: "https://www.techupkeep.dev/og-image.jpeg",
        width: 1200,
        height: 630,
        alt: "The Year the Internet Kept Breaking: 2025's Major Cloud Outages",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["https://www.techupkeep.dev/og-image.jpeg"],
  },
  alternates: {
    canonical:
      "https://www.techupkeep.dev/blog/cloud-outages-2025-ai-infrastructure",
  },
};

const statHighlights = [
  {
    icon: Zap,
    label: "Hours of disruption",
    value: "31+",
    detail: "Combined multi-region downtime across the four largest incidents.",
  },
  {
    icon: TrendingDown,
    label: "Revenue impact",
    value: "$60–100B",
    detail:
      "Parametrix and insurance-industry estimates across all affected services.",
  },
  {
    icon: AlertCircle,
    label: "Config-driven incidents",
    value: "100%",
    detail:
      "Every root cause traced to control-plane changes, not external attackers.",
  },
];

const incidentBreakdowns = [
  {
    provider: "Google Cloud",
    duration: "3h of widespread API failures",
    summary:
      "Quota policy enforcement code shipped dark on May 29, then triggered mid-June when blank fields hit the control plane. Crash loops starved the us-central1 databases that coordinated restarts. Gmail, Spotify, and Discord all went down—not because of load, but because a null pointer escaped review.",
    rootCause:
      "Kill switches existed but propagated slower than the failure, so every restart re-triggered the same null pointer.",
    whatMatters:
      "Treat restart storms as incidents. Ship kill switches and blast-radius limits alongside new control-plane code.",
  },
  {
    provider: "AWS",
    duration: "14h cascading impact",
    summary:
      'Two "DNS Enactor" processes tried to publish the same plan; the older plan won and cleanup logic deleted every IP for DynamoDB regional endpoints. The irony? Those redundant Enactors were supposed to prevent exactly this kind of failure. Instead, they raced each other and both lost.',
    rootCause:
      "Redundant controllers shared mutable state without coordination, turning safety into a race condition.",
    whatMatters:
      "Redundancy without orchestration creates single points of failure. DNS changes need locking, auditing, and dry-run parity with production.",
  },
  {
    provider: "Azure",
    duration: "8.5h global degradation",
    summary:
      "Customer configs built in two different toolchains produced metadata that passed syntax checks but crashed asynchronous workers at every edge location.",
    rootCause:
      "Validation only covered synchronous submission, not the async pipeline that actually executes the config.",
    whatMatters:
      'Replay configs through the same asynchronous workers you run in production. Deterministic validation > "looks good" linting.',
  },
  {
    provider: "Cloudflare",
    duration: "5h 46m rolling 5xx errors",
    summary:
      "A routine permission change let ClickHouse duplicate metadata. The Bot Management file doubled, exceeded a hardcoded 200-feature limit, and proxies panicked. X (Twitter) and ChatGPT went dark—two of the most visible services on the internet, felled by a number someone once decided was 'big enough.'",
    rootCause:
      'Size limits were hardcoded, unobserved, and treated as "won\'t happen."',
    whatMatters:
      "Track limit utilization like any other SLO. When you breach a limit, degrade gracefully instead of panicking processes.",
  },
];

const patternCards = [
  {
    title: "Configuration drift is the default state",
    description:
      'Each outage began with a "routine" change that bypassed meaningful review because it looked safe in isolation.',
    insight:
      "Diff and lint every control-plane change the same way you treat application code, and require rollback budgets before rollout.",
  },
  {
    title: "Safety nets assume synchronous worlds",
    description:
      "Azure, Google, and Cloudflare all had validation, but it measured inputs—not how async workers and caches would behave hours later.",
    insight:
      "Shift testing closer to execution. If an async pipeline will touch it, your validation should too.",
  },
  {
    title: "Recovery can be a second incident",
    description:
      "Thundering herds and manual restarts turned short outages into all-day events at AWS and Google.",
    insight:
      "Budget for reconnection. Rate-limit clients, stage restarts, and automate partial rollbacks so humans aren’t improvising under load.",
  },
];

const signalBuckets = {
  valuable: [
    "Vendor post-mortems that quantify blast radius, recovery time, and concrete fixes.",
    "Evidence of config isolation, policy linting, or kill-switch telemetry that can be reused internally.",
    "Details about how control planes were instrumented (or not) to catch regressions before customers felt them.",
    "Numbers about reconnection load, queue depth, or other recovery bottlenecks you can benchmark against.",
  ],
  noise: [
    'Vague statements about "AI demand" with zero data about what actually failed.',
    "Hero narratives that credit war rooms but skip the bugs and missing guardrails.",
    'One-off vendor promises like "we added more capacity" with no mention of process changes.',
    "Any summary that blames rare coincidence instead of describing the config path that broke.",
  ],
};

const actionSteps = [
  {
    title: "Measure kill-switch latency",
    detail:
      "List every feature flag or kill switch tied to control-plane code and record how long it takes to propagate globally. If the number exceeds five minutes, it’s effectively useless.",
  },
  {
    title: "Rehearse config rollbacks with load",
    detail:
      "Run simulated rollbacks while synthetic clients hammer your APIs. If state rebuild floods a shared database, fix it now—not during an incident.",
  },
  {
    title: "Score dependencies by reconnection load",
    detail:
      "Quantify how many clients, workers, or devices reconnect at once when a dependency recovers. Use that score to phase restarts.",
  },
  {
    title: "Instrument the control plane first",
    detail:
      "Add alerts for config size, plan version skew, and queue depth. The application tier can’t save you if the control plane is blind.",
  },
  {
    title: "Pilot a small second provider",
    detail:
      "Not full multi-cloud—just enough critical workload to keep the lights on. Use it as leverage and as a training ground for failover procedures.",
  },
];
export default function CloudOutages2025Page() {
  return (
    <>
      <BlogVisitTracker page="cloud-outages-2025-ai-infrastructure" />
      <BlogSubscriptionModal />
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <header className="sticky top-0 z-10 border-b border-white/5 bg-slate-950/80 backdrop-blur">
          <div className="container mx-auto flex items-center justify-between px-4 py-4">
            <Link href="/">
              <Logo size="sm" variant="default" />
            </Link>
          </div>
        </header>

        <article className="container mx-auto max-w-4xl px-4 py-12">
          <Link
            href="/blog"
            className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-slate-100"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Blog
          </Link>

          <header className="mb-10 space-y-6">
            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
              <span className="rounded-full border border-fuchsia-500/40 bg-fuchsia-500/10 px-3 py-1 text-fuchsia-200">
                Infrastructure & Reliability
              </span>
              <span className="text-slate-600">•</span>
              <time>November 21, 2025</time>
              <span className="text-slate-600">•</span>
              <span>14 min read</span>
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl font-semibold leading-tight text-white md:text-5xl">
                The Year the Internet Kept Breaking: 2025's Major Cloud Outages
                and the AI Factor
              </h1>
              <p className="text-lg text-slate-300">
                AI demand made headlines, but the outages that defined 2025 were
                rooted in dull realities: control planes that ship faster than
                their safeguards, redundant systems without coordination, and
                recovery playbooks that create second incidents. I spent the
                week after the AWS outage auditing our own kill-switch
                latency—and found gaps I wish I'd caught earlier. This post
                captures the root causes and the signals worth carrying into
                your own roadmap.
              </p>
            </div>
          </header>

          <div className="space-y-16">
            <section className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900/80 via-slate-900 to-black/60 p-8 shadow-2xl shadow-blue-500/10">
              <p className="text-base text-slate-300">
                Before diving into timelines, align on what actually mattered
                this year. Ignore hype; follow the constraints.
              </p>
              <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {statHighlights.map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <div
                      key={stat.label}
                      className="rounded-2xl border border-slate-800/70 bg-black/20 p-6 shadow-inner shadow-black/40"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-xs uppercase tracking-wide text-slate-400">
                          {stat.label}
                        </p>
                        <Icon className="h-5 w-5 text-blue-300" />
                      </div>
                      <p className="mt-4 text-3xl font-semibold text-white">
                        {stat.value}
                      </p>
                      <p className="mt-2 text-sm text-slate-400">
                        {stat.detail}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="space-y-5" id="timeline">
              <div className="flex items-center gap-3">
                <div className="rounded-full border border-blue-500/30 bg-blue-500/10 p-2">
                  <CircuitBoard className="h-5 w-5 text-blue-300" />
                </div>
                <h2 className="text-2xl font-semibold text-white">
                  How 2025 actually unfolded
                </h2>
              </div>
              <p className="text-slate-300">
                Four incidents dominated the year. Each started as a routine
                change, escalated because safety nets lagged, and lingered
                because recovery plans weren’t designed for thundering herds.
                Track them chronologically to see the shared playbook.
              </p>
              <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6">
                <OutageTimeline />
              </div>
            </section>

            <section className="space-y-6" id="providers">
              <h2 className="text-2xl font-semibold text-white">
                What failed at each provider (and why it mattered)
              </h2>
              <div className="grid gap-8">
                {incidentBreakdowns.map((incident) => (
                  <article
                    key={incident.provider}
                    className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6 shadow-lg shadow-black/40"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-slate-400">
                          {incident.duration}
                        </p>
                        <h3 className="text-xl font-semibold text-white">
                          {incident.provider}
                        </h3>
                      </div>
                    </div>
                    <p className="mt-4 text-base text-slate-300">
                      {incident.summary}
                    </p>
                    <div className="mt-6 grid gap-6 md:grid-cols-2">
                      <div className="rounded-2xl border border-slate-800/70 bg-black/10 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Root cause
                        </p>
                        <p className="mt-2 text-sm text-slate-100">
                          {incident.rootCause}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-slate-800/70 bg-black/10 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Why it matters
                        </p>
                        <p className="mt-2 text-sm text-slate-100">
                          {incident.whatMatters}
                        </p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="space-y-6" id="patterns">
              <h2 className="text-2xl font-semibold text-white">
                Root-cause patterns worth stealing
              </h2>
              <p className="text-slate-300">
                After reading every post-mortem twice, three patterns kept
                surfacing. I've started using them as a checklist before any
                control-plane deploy.
              </p>
              <div className="grid gap-6 md:grid-cols-2">
                {patternCards.map((pattern) => (
                  <div
                    key={pattern.title}
                    className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6"
                  >
                    <p className="text-sm font-semibold uppercase tracking-wide text-blue-300">
                      {pattern.title}
                    </p>
                    <p className="mt-3 text-sm text-slate-300">
                      {pattern.description}
                    </p>
                    <p className="mt-4 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-3 text-sm text-blue-100">
                      {pattern.insight}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-6" id="signals">
              <h2 className="text-2xl font-semibold text-white">
                Separate the valuable signals from the noise
              </h2>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/5 p-6">
                  <div className="flex items-center gap-3 text-emerald-300">
                    <Target className="h-5 w-5" />
                    <span className="text-xs font-semibold uppercase tracking-wide">
                      Worth your attention
                    </span>
                  </div>
                  <ul className="mt-4 space-y-3 text-sm text-slate-100">
                    {signalBuckets.valuable.map((item) => (
                      <li key={item} className="flex gap-2">
                        <span className="text-emerald-300">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-3xl border border-rose-500/30 bg-rose-500/5 p-6">
                  <div className="flex items-center gap-3 text-rose-300">
                    <ShieldAlert className="h-5 w-5" />
                    <span className="text-xs font-semibold uppercase tracking-wide">
                      Skip the distractions
                    </span>
                  </div>
                  <ul className="mt-4 space-y-3 text-sm text-slate-100">
                    {signalBuckets.noise.map((item) => (
                      <li key={item} className="flex gap-2">
                        <span className="text-rose-300">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            <section className="space-y-6" id="actions">
              <div className="flex items-center gap-3">
                <div className="rounded-full border border-indigo-400/30 bg-indigo-500/10 p-2">
                  <Gauge className="h-5 w-5 text-indigo-200" />
                </div>
                <h2 className="text-2xl font-semibold text-white">
                  What reliability teams should do next
                </h2>
              </div>
              <ol className="grid gap-5">
                {actionSteps.map((step, index) => (
                  <li
                    key={step.title}
                    className="flex gap-4 rounded-3xl border border-slate-800 bg-slate-900/40 p-6"
                  >
                    <span className="text-3xl font-semibold text-slate-700">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <p className="text-lg font-semibold text-white">
                        {step.title}
                      </p>
                      <p className="mt-2 text-sm text-slate-300">
                        {step.detail}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
              <div className="rounded-3xl border border-blue-500/20 bg-blue-500/10 p-6 text-sm text-blue-100">
                <strong>The uncomfortable pattern:</strong> Every outage
                confirmed the same thing—the control plane was blind until
                customers yelled. I've shipped features that looked urgent at
                the time but added zero observability to the systems that
                actually keep the lights on. These incidents were a wake-up
                call. Instrument the boring systems first; feature launches can
                wait.
              </div>
            </section>
          </div>

          <footer className="mt-16 border-t border-slate-800 pt-8">
            <div className="flex flex-col gap-2 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p>Written by Tech Upkeep</p>
                <p className="text-xs text-slate-500">November 21, 2025</p>
              </div>
            </div>
          </footer>
        </article>

        <section className="container mx-auto max-w-4xl px-4 pb-16">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-8">
            <h2 className="text-2xl font-semibold text-white">
              Related analysis
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Pair this teardown with deeper dives on the outages that shaped
              2025.
            </p>
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              <Link
                href="/blog/aws-outage-october-2025-analysis"
                className="group flex h-full flex-col rounded-2xl border border-slate-800 bg-slate-950/40 p-5 transition duration-200 hover:border-blue-500/50 hover:bg-slate-900/60"
              >
                <h3 className="text-lg font-semibold text-white group-hover:text-blue-200">
                  AWS US-EAST-1 Outage (October 2025)
                </h3>
                <p className="mt-2 text-sm text-slate-400">
                  How a DNS race condition deleted DynamoDB’s IPs and what that
                  means for your own redundancy plans.
                </p>
              </Link>
              <Link
                href="/blog/state-of-agentic-ai-2025"
                className="group flex h-full flex-col rounded-2xl border border-slate-800 bg-slate-950/40 p-5 transition duration-200 hover:border-blue-500/50 hover:bg-slate-900/60"
              >
                <h3 className="text-lg font-semibold text-white group-hover:text-blue-200">
                  The Uncomfortable Truth About AI Agents
                </h3>
                <p className="mt-2 text-sm text-slate-400">
                  Why 90% of agentic initiatives stall before adoption—and the
                  infrastructure traps that guarantee it.
                </p>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
