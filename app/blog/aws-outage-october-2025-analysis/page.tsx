import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, AlertTriangle, Cloud, TrendingDown, Clock, Globe, Server, AlertCircle } from "lucide-react";
import Logo from "@/components/layout/Logo";
import BlogVisitTracker from "@/components/BlogVisitTracker";
import BlogSubscriptionModal from "@/components/BlogSubscriptionModal";
import BlogInlineSubscription from "@/components/BlogInlineSubscription";

export const metadata: Metadata = {
  title: "AWS US-EAST-1 Outage (Oct 2025): What Happened and What We Can Learn | Tech Upkeep",
  description: "Analysis of the massive AWS outage on October 20, 2025 that took down Snapchat, Roblox, Fortnite, and thousands of websites. Technical breakdown and lessons for engineering teams.",
  keywords: [
    "aws outage 2025",
    "aws us-east-1 outage",
    "cloud infrastructure",
    "system reliability",
    "aws downtime",
    "distributed systems",
    "site reliability engineering",
    "cloud dependency",
    "aws incident",
    "infrastructure engineering",
  ],
  openGraph: {
    title: "AWS US-EAST-1 Outage (Oct 2025): What Happened and What We Can Learn",
    description: "Technical analysis of the October 2025 AWS outage that disrupted thousands of services globally. Learn what went wrong and how to build more resilient systems.",
    url: "https://www.techupkeep.dev/blog/aws-outage-october-2025-analysis",
    type: "article",
    publishedTime: "2025-10-21T00:00:00Z",
    images: [
      {
        url: "https://www.techupkeep.dev/og-image.jpeg",
        width: 1200,
        height: 630,
        alt: "AWS US-EAST-1 Outage Analysis - October 2025",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["https://www.techupkeep.dev/og-image.jpeg"],
  },
  alternates: {
    canonical: "https://www.techupkeep.dev/blog/aws-outage-october-2025-analysis",
  },
};

export default function BlogPost() {
  const impactedServices = [
    { name: "Snapchat", category: "Social Media", users: "375M daily users" },
    { name: "Roblox", category: "Gaming", users: "70M+ daily users" },
    { name: "Fortnite", category: "Gaming", users: "Millions affected" },
    { name: "Ring", category: "Smart Home", users: "Global disruption" },
    { name: "McDonald's App", category: "Food & Retail", users: "Order systems down" },
    { name: "United Airlines", category: "Travel", users: "Booking systems affected" },
    { name: "Robinhood", category: "Finance", users: "Trading disrupted" },
    { name: "Bank of Scotland", category: "Banking", users: "Service interruptions" },
  ];

  const technicalDetails = [
    {
      title: "Root Cause",
      description: "Error in AWS's EC2 internal network subsystem responsible for monitoring network load balancer health. DNS resolution failures for DynamoDB API endpoints in US-EAST-1.",
      severity: "Critical",
    },
    {
      title: "Affected Services",
      description: "14 AWS services including EC2, DynamoDB, SQS, Amazon Connect, Lambda, and S3. Cascading failures across dependent services.",
      severity: "Critical",
    },
    {
      title: "Duration",
      description: "Approximately 15 hours from first reports (3:11 AM ET) to full restoration. Partial recovery began after 8 hours.",
      severity: "High",
    },
    {
      title: "Geographic Scope",
      description: "Primary impact in US-EAST-1 (N. Virginia), but global services affected due to control plane dependencies and cross-region service dependencies.",
      severity: "High",
    },
  ];

  const lessonsLearned = [
    {
      title: "Multi-Region Architecture is Non-Negotiable",
      description: "Services running only in US-EAST-1 had zero availability. Multi-region deployments with active-active or active-passive failover could have maintained partial service.",
      actionable: "Design for multi-region from day one, even if it seems expensive. The cost of downtime far exceeds infrastructure costs.",
    },
    {
      title: "Don't Put All Dependencies in One Region",
      description: "Many services with multi-region deployments still failed because their DynamoDB databases, SQS queues, or Lambda functions were only in US-EAST-1.",
      actionable: "Map ALL dependencies. Ensure critical data stores and async processing exist in multiple regions with replication.",
    },
    {
      title: "Test Your Disaster Recovery Plan",
      description: "Having a DR plan on paper is worthless if you've never actually failed over. The outage exposed companies with untested recovery procedures.",
      actionable: "Run quarterly chaos engineering exercises. Kill US-EAST-1 deliberately and measure your actual recovery time.",
    },
    {
      title: "Control Plane vs Data Plane Awareness",
      description: "Even services in healthy regions failed because AWS's control plane operations (DNS, IAM, CloudFormation) depended on US-EAST-1 infrastructure.",
      actionable: "Understand which AWS services have regional vs global control planes. Design systems to operate during control plane outages.",
    },
    {
      title: "Monitoring and Observability Must Be External",
      description: "Many companies couldn't access their own monitoring dashboards because they were hosted on AWS infrastructure that was down.",
      actionable: "Use external observability tools (DataDog, New Relic, external status pages) that don't depend on your primary cloud provider.",
    },
    {
      title: "Communication Plans for Extended Outages",
      description: "Companies struggled to communicate with customers during the outage because their status pages, email systems, and notification services were down.",
      actionable: "Maintain status pages and communication channels on separate infrastructure (different cloud provider or on-prem).",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-950">
      <BlogVisitTracker page="/blog/aws-outage-october-2025-analysis" />
      <BlogSubscriptionModal />
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <Link href="/">
            <Logo size="sm" variant="default" />
          </Link>
        </div>
      </header>

      {/* Article */}
      <article className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Back Button */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-blue-400 transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Blog
        </Link>

        {/* Title */}
        <header className="mb-8">
          <span className="inline-block px-3 py-1 text-xs font-medium bg-red-500/10 text-red-400 rounded-full border border-red-500/20 mb-4">
            Infrastructure & Cloud
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-100 mb-4 leading-tight">
            AWS US-EAST-1 Outage (October 2025): What Happened and What We Can Learn
          </h1>
          <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
            <time dateTime="2025-10-21">October 21, 2025</time>
            <span>·</span>
            <span>10 min read</span>
          </div>

          {/* Breaking News Badge */}
          <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-yellow-200 text-sm font-medium mb-1">
                  Breaking: Post-Mortem Pending
                </p>
                <p className="text-yellow-200/80 text-sm">
                  AWS has not yet published their official post-mortem report. This analysis is based on public reports, monitoring data, and initial AWS status updates. We'll update this article once AWS releases their detailed incident report.
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Introduction */}
        <div className="prose prose-invert prose-lg max-w-none">
          <p className="text-gray-300 leading-relaxed mb-6">
            On October 20, 2025, at approximately 3:11 AM ET, Amazon Web Services experienced one of its most significant outages in recent history. For roughly 15 hours, a critical failure in the US-EAST-1 region (Northern Virginia) cascaded across the internet, taking down thousands of websites and applications that power our daily digital lives.
          </p>

          <p className="text-gray-300 leading-relaxed mb-8">
            Snapchat went dark for 375 million daily users. Fortnite and Roblox became unplayable for millions of gamers. Ring doorbells stopped recording. McDonald's mobile orders failed. United Airlines booking systems stuttered. Even the British government's tax website (HMRC) became inaccessible.
          </p>

          <p className="text-gray-300 leading-relaxed mb-8">
            <strong className="text-gray-100">The scale was staggering:</strong> Downdetector received over 6.5 million reports spanning more than 1,000 services globally. This wasn't just an AWS problem—it exposed the fragility of our cloud-dependent world.
          </p>

          {/* What Happened */}
          <h2 className="text-3xl font-bold text-gray-100 mb-6 flex items-center gap-3 mt-12">
            <AlertTriangle className="h-8 w-8 text-red-400" />
            What Happened: The Technical Breakdown
          </h2>

          <p className="text-gray-300 leading-relaxed mb-6">
            Based on AWS status updates and monitoring data from affected customers, here's what we know so far:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {technicalDetails.map((detail) => (
              <div
                key={detail.title}
                className="bg-gray-900/50 border border-gray-800 rounded-xl p-6"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-bold text-gray-100">
                    {detail.title}
                  </h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded border ${
                    detail.severity === "Critical"
                      ? "bg-red-500/10 text-red-400 border-red-500/20"
                      : "bg-orange-500/10 text-orange-400 border-orange-500/20"
                  }`}>
                    {detail.severity}
                  </span>
                </div>
                <p className="text-gray-300 text-sm leading-relaxed">
                  {detail.description}
                </p>
              </div>
            ))}
          </div>

          <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-6 mb-8">
            <h3 className="text-xl font-semibold text-gray-100 mb-3 flex items-center gap-2">
              <Server className="h-5 w-5 text-blue-400" />
              The Chain Reaction
            </h3>
            <p className="text-gray-300 leading-relaxed mb-4">
              The failure originated in a subsystem responsible for monitoring the health of network load balancers in EC2. When this subsystem failed, it triggered a cascade:
            </p>
            <ol className="space-y-3 text-gray-300 ml-6">
              <li className="list-decimal">
                <strong className="text-gray-100">Network Load Balancer monitoring failed</strong> → Load balancers couldn't properly route traffic
              </li>
              <li className="list-decimal">
                <strong className="text-gray-100">DynamoDB API endpoints became unreachable</strong> → DNS resolution failures prevented connections
              </li>
              <li className="list-decimal">
                <strong className="text-gray-100">Dependent services cascaded into failure</strong> → SQS, Lambda, S3, and others couldn't function without DynamoDB
              </li>
              <li className="list-decimal">
                <strong className="text-gray-100">Global services impacted</strong> → Even services in other regions failed due to control plane dependencies in US-EAST-1
              </li>
            </ol>
          </div>

          {/* Impact */}
          <h2 className="text-3xl font-bold text-gray-100 mb-6 flex items-center gap-3 mt-12">
            <TrendingDown className="h-8 w-8 text-red-400" />
            The Global Impact
          </h2>

          <p className="text-gray-300 leading-relaxed mb-6">
            The outage didn't just affect tech companies—it rippled through every sector of the digital economy:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {impactedServices.map((service) => (
              <div
                key={service.name}
                className="bg-gray-900/50 border border-gray-800 rounded-xl p-5"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-bold text-gray-100">
                    {service.name}
                  </h3>
                  <span className="px-2 py-1 text-xs font-medium bg-purple-500/10 text-purple-400 rounded border border-purple-500/20">
                    {service.category}
                  </span>
                </div>
                <p className="text-gray-400 text-sm">
                  {service.users}
                </p>
              </div>
            ))}
          </div>

          <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-6 mb-8">
            <h3 className="text-xl font-semibold text-gray-100 mb-3">
              Why Did Global Services Fail from a Single Region?
            </h3>
            <p className="text-gray-300 leading-relaxed mb-4">
              This is the critical question. Many affected services <em>were</em> deployed across multiple regions. So why did they still fail?
            </p>
            <div className="space-y-3 text-gray-300">
              <div className="flex items-start gap-3">
                <span className="text-red-400 text-xl flex-shrink-0">1.</span>
                <div>
                  <strong className="text-gray-100">Control Plane Dependencies:</strong> AWS's global control plane (IAM, Route53, CloudFormation) has critical infrastructure in US-EAST-1. Even healthy regions couldn't perform certain operations.
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-red-400 text-xl flex-shrink-0">2.</span>
                <div>
                  <strong className="text-gray-100">Single-Region Data Stores:</strong> Many multi-region applications kept their primary databases (DynamoDB, RDS) in US-EAST-1 only, making them single points of failure.
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-red-400 text-xl flex-shrink-0">3.</span>
                <div>
                  <strong className="text-gray-100">Configuration and Secrets:</strong> Applications in healthy regions couldn't start or scale because they relied on AWS Secrets Manager or Parameter Store in US-EAST-1.
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-red-400 text-xl flex-shrink-0">4.</span>
                <div>
                  <strong className="text-gray-100">Async Processing Bottlenecks:</strong> SQS queues and Lambda functions often centralized in US-EAST-1 for cost optimization, creating hidden dependencies.
                </div>
              </div>
            </div>
          </div>

          {/* Lessons Learned */}
          <h2 className="text-3xl font-bold text-gray-100 mb-6 flex items-center gap-3 mt-12">
            <Cloud className="h-8 w-8 text-blue-400" />
            What Engineering Teams Should Learn
          </h2>

          <p className="text-gray-300 leading-relaxed mb-6">
            This outage is a masterclass in distributed systems failure modes. Here are the critical lessons:
          </p>

          <div className="space-y-6 mb-12">
            {lessonsLearned.map((lesson, index) => (
              <div
                key={lesson.title}
                className="bg-gray-900/50 border border-gray-800 rounded-xl p-6"
              >
                <div className="flex items-start gap-4 mb-3">
                  <span className="flex-shrink-0 w-8 h-8 bg-blue-500/10 text-blue-400 rounded-full flex items-center justify-center font-bold border border-blue-500/20">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-100 mb-2">
                      {lesson.title}
                    </h3>
                    <p className="text-gray-300 leading-relaxed mb-3">
                      {lesson.description}
                    </p>
                    <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                      <p className="text-green-200 text-sm">
                        <strong className="text-green-100">Action:</strong> {lesson.actionable}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Why US-EAST-1 */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-8 mb-12">
            <h2 className="text-2xl font-bold text-gray-100 mb-4 flex items-center gap-3">
              <Globe className="h-6 w-6 text-purple-400" />
              Why US-EAST-1 Outages Are Especially Catastrophic
            </h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              US-EAST-1 (Northern Virginia) isn't just another AWS region—it's special:
            </p>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start gap-3">
                <span className="text-purple-400 text-lg flex-shrink-0">•</span>
                <div>
                  <strong className="text-gray-100">Oldest AWS Region:</strong> Launched in 2006, it has the most mature services and features launch here first.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-purple-400 text-lg flex-shrink-0">•</span>
                <div>
                  <strong className="text-gray-100">Default Region:</strong> Many AWS services default to US-EAST-1 in SDKs and console, leading to accidental dependencies.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-purple-400 text-lg flex-shrink-0">•</span>
                <div>
                  <strong className="text-gray-100">Control Plane Hub:</strong> Global AWS services (CloudFront, Route53, IAM) have critical infrastructure here.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-purple-400 text-lg flex-shrink-0">•</span>
                <div>
                  <strong className="text-gray-100">Largest Deployment:</strong> Estimated to host 30-40% of all AWS workloads globally.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-purple-400 text-lg flex-shrink-0">•</span>
                <div>
                  <strong className="text-gray-100">Cost Optimized:</strong> Lowest pricing, incentivizing companies to centralize here despite risks.
                </div>
              </li>
            </ul>
            <p className="text-gray-300 leading-relaxed mt-4">
              This combination makes US-EAST-1 outages uniquely impactful. When this region fails, the internet notices.
            </p>
          </div>

          {/* What's Next */}
          <h2 className="text-3xl font-bold text-gray-100 mb-6 flex items-center gap-3 mt-12">
            <Clock className="h-8 w-8 text-yellow-400" />
            What Happens Next?
          </h2>

          <p className="text-gray-300 leading-relaxed mb-6">
            AWS will publish a detailed post-mortem report in the coming days or weeks. These reports typically include:
          </p>

          <ul className="space-y-2 text-gray-300 mb-6 ml-6">
            <li className="list-disc">Precise timeline of events down to the minute</li>
            <li className="list-disc">Root cause analysis with technical depth</li>
            <li className="list-disc">Why detection and mitigation took so long</li>
            <li className="list-disc">What corrective actions AWS is implementing</li>
            <li className="list-disc">How they'll prevent similar failures</li>
          </ul>

          <p className="text-gray-300 leading-relaxed mb-8">
            We'll update this article once AWS releases their official incident report. In the meantime, engineering teams should be reviewing their own architectures for similar vulnerabilities.
          </p>

          <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-6 mb-12">
            <h3 className="text-xl font-semibold text-gray-100 mb-3">
              Questions AWS Needs to Answer
            </h3>
            <ol className="space-y-2 text-gray-300 ml-6">
              <li className="list-decimal">Why did a network load balancer monitoring subsystem have such broad cascading impact?</li>
              <li className="list-decimal">Why couldn't the issue be detected and isolated faster?</li>
              <li className="list-decimal">Why did services in other regions experience control plane failures?</li>
              <li className="list-decimal">What redundancy existed (or didn't exist) for this critical subsystem?</li>
              <li className="list-decimal">How will AWS improve blast radius isolation for future incidents?</li>
            </ol>
          </div>

          {/* The Bigger Picture */}
          <h2 className="text-3xl font-bold text-gray-100 mb-6 mt-12">
            The Bigger Picture: Cloud Dependency Risk
          </h2>

          <p className="text-gray-300 leading-relaxed mb-6">
            This outage exposes a fundamental tension in modern software architecture:
          </p>

          <p className="text-gray-300 leading-relaxed mb-6">
            <strong className="text-gray-100">Cloud providers promise five-nines reliability (99.999% uptime)</strong>, but achieving that requires architectural discipline that most companies don't implement. Multi-region deployments are expensive and complex. Many startups and even mature companies accept the risk of single-region deployment to move faster and reduce costs.
          </p>

          <p className="text-gray-300 leading-relaxed mb-6">
            <strong className="text-gray-100">The result?</strong> We've created a world where a networking issue in a single data center in Northern Virginia can disable critical services globally—from emergency Ring cameras to banking apps to government tax systems.
          </p>

          <p className="text-gray-300 leading-relaxed mb-8">
            As an industry, we need to have honest conversations about acceptable risk, true cost of downtime, and realistic expectations for cloud reliability.
          </p>

          {/* Stay Informed CTA */}
          <div className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 border border-blue-500/40 rounded-xl p-8 mb-12">
            <h2 className="text-2xl font-bold text-gray-100 mb-4">
              Stay Informed: Subscribe to Tech Upkeep
            </h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              This is exactly the kind of critical infrastructure news that product engineers need to know about—but often miss until it's too late.
            </p>
            <p className="text-gray-300 leading-relaxed mb-4">
              <strong className="text-gray-100">Tech Upkeep</strong> curates breaking infrastructure incidents, post-mortems from companies like AWS, Netflix, and Google, and the best engineering blog content—delivered to your inbox every Tuesday and Friday.
            </p>
            <ul className="space-y-2 text-gray-300 mb-6">
              <li className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
                <span>Breaking outage analysis like this one</span>
              </li>
              <li className="flex items-center gap-2">
                <Server className="h-5 w-5 text-blue-400" />
                <span>AWS, Google, Azure post-mortem reports explained</span>
              </li>
              <li className="flex items-center gap-2">
                <Cloud className="h-5 w-5 text-purple-400" />
                <span>Production engineering lessons from Netflix, Uber, Airbnb</span>
              </li>
              <li className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-red-400" />
                <span>System design patterns to prevent failures</span>
              </li>
            </ul>
            <p className="text-gray-400 text-sm italic">
              We'll update you the moment AWS publishes their official post-mortem for this incident.
            </p>
          </div>

          {/* Conclusion */}
          <h2 className="text-3xl font-bold text-gray-100 mb-4">
            Final Thoughts
          </h2>
          <p className="text-gray-300 leading-relaxed mb-6">
            The October 20, 2025 AWS outage will likely be studied in computer science courses for years to come. It's a stark reminder that even the world's most sophisticated cloud infrastructure has failure modes we don't fully understand until they manifest.
          </p>
          <p className="text-gray-300 leading-relaxed mb-6">
            For engineering teams, this incident should trigger honest architectural reviews. Ask yourself:
          </p>
          <ul className="space-y-2 text-gray-300 mb-6 ml-6">
            <li className="list-disc">Could our service survive a US-EAST-1 outage?</li>
            <li className="list-disc">Have we actually tested our disaster recovery procedures?</li>
            <li className="list-disc">Do we have dependencies we don't know about?</li>
            <li className="list-disc">Is our monitoring independent of our infrastructure?</li>
          </ul>
          <p className="text-gray-300 leading-relaxed mb-6">
            The best time to fix these issues is before the next major outage—not during it.
          </p>
          <p className="text-gray-400 text-sm italic">
            This article will be updated as new information becomes available and when AWS publishes their official post-mortem report. Last updated: October 21, 2025.
          </p>
        </div>

        {/* CTA */}
        <BlogInlineSubscription
          source="blog"
          sourcePage="/blog/aws-outage-october-2025-analysis"
        />

        {/* Author */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <p className="text-gray-400 text-sm">
            Written by <span className="text-gray-200 font-medium">Benjamin Loh</span>,
            curator of Tech Upkeep
          </p>
        </div>
      </article>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-600 text-sm">
            © 2025 Tech Upkeep. Built for engineers who want to stay ahead.
          </p>
        </div>
      </footer>
    </div>
  );
}
