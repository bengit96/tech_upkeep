import { db } from "../db";
import { categories } from "../db/schema";

/**
 * Categorization system for FullStack Engineers
 * 8 categories covering all domains full-stack engineers need to stay sharp on
 */
export async function categorizeContent(
  title: string,
  summary: string
): Promise<{
  categoryId: number | null;
  tagNames: string[];
}> {
  const text = `${title} ${summary}`.toLowerCase();

  // Get all categories
  const allCategories = await db.select().from(categories);

  // Comprehensive keyword mapping for 8 full-stack categories
  const categoryKeywords: Record<string, string[]> = {
    "system-design-architecture": [
      // Architecture patterns
      "architecture",
      "microservices",
      "monolith",
      "service-oriented",
      "event-driven",
      "hexagonal architecture",
      "clean architecture",
      "domain-driven design",
      "ddd",

      // Scalability & Performance
      "scalability",
      "horizontal scaling",
      "vertical scaling",
      "load balancing",
      "caching",
      "cdn",
      "distributed systems",
      "high availability",
      "fault tolerance",
      "redundancy",

      // System patterns
      "design patterns",
      "saga pattern",
      "circuit breaker",
      "bulkhead",
      "rate limiting",
      "throttling",
      "backpressure",
      "service mesh",
      "sidecar pattern",

      // Data consistency
      "consistency",
      "eventual consistency",
      "cap theorem",
      "acid",
      "base",
      "sharding",
      "partitioning",
      "replication",

      // Communication
      "message queue",
      "pub/sub",
      "event bus",
      "async communication",
      "synchronous",
      "request-response",

      // Case studies
      "how we scaled",
      "scaling to",
      "million users",
      "system architecture",
      "technical architecture",
    ],

    "frontend-engineering": [
      // Frameworks & Libraries
      "react",
      "vue",
      "angular",
      "svelte",
      "solid",
      "next.js",
      "nextjs",
      "remix",
      "nuxt",
      "gatsby",
      "astro",

      // Core technologies
      "javascript",
      "typescript",
      "html",
      "css",
      "dom",
      "browser api",
      "web api",

      // Styling
      "tailwind",
      "styled-components",
      "css-in-js",
      "sass",
      "less",
      "postcss",
      "bootstrap",
      "material-ui",
      "shadcn",

      // State & Data
      "state management",
      "redux",
      "zustand",
      "mobx",
      "recoil",
      "jotai",
      "context api",
      "tanstack query",
      "react query",
      "swr",

      // Performance
      "web performance",
      "core web vitals",
      "lcp",
      "fid",
      "cls",
      "lazy loading",
      "code splitting",
      "tree shaking",
      "ssr",
      "server-side rendering",
      "static site generation",
      "ssg",
      "isr",
      "hydration",

      // Build tools
      "webpack",
      "vite",
      "rollup",
      "parcel",
      "esbuild",
      "turbopack",

      // UI/UX
      "ui component",
      "component library",
      "design system",
      "accessibility",
      "a11y",
      "wcag",
      "responsive design",
      "mobile-first",
      "progressive enhancement",
      "animation",
      "transitions",
      "user experience",

      // Testing
      "jest",
      "vitest",
      "testing library",
      "cypress",
      "playwright",
      "e2e testing",
    ],

    "backend-apis": [
      // Languages & Runtimes
      "node.js",
      "nodejs",
      "python",
      "django",
      "flask",
      "fastapi",
      "go",
      "golang",
      "rust",
      "java",
      "spring boot",
      "dotnet",
      "php",
      "laravel",

      // Frameworks
      "express",
      "fastify",
      "nest.js",
      "nestjs",
      "koa",
      "hapi",

      // API Protocols
      "rest api",
      "restful",
      "graphql",
      "grpc",
      "websocket",
      "server-sent events",
      "sse",
      "api design",
      "api versioning",

      // Databases
      "database",
      "sql",
      "nosql",
      "postgresql",
      "postgres",
      "mysql",
      "mariadb",
      "mongodb",
      "redis",
      "memcached",
      "dynamodb",
      "cassandra",
      "elasticsearch",
      "sqlite",

      // Database Tools
      "orm",
      "odm",
      "prisma",
      "drizzle",
      "typeorm",
      "sequelize",
      "mongoose",
      "sqlalchemy",
      "query optimization",
      "indexing",

      // Auth
      "authentication",
      "authorization",
      "jwt",
      "oauth",
      "oauth2",
      "openid",
      "saml",
      "session management",
      "token",
      "refresh token",

      // Async Processing
      "background jobs",
      "worker",
      "queue",
      "bull",
      "bullmq",
      "kafka",
      "rabbitmq",
      "celery",
      "cron jobs",

      // Serverless
      "serverless",
      "lambda",
      "cloud functions",
      "edge functions",
      "vercel functions",
      "netlify functions",
    ],

    "cloud-devops": [
      // Cloud Providers
      "aws",
      "amazon web services",
      "azure",
      "microsoft azure",
      "gcp",
      "google cloud",
      "digitalocean",
      "linode",
      "heroku",
      "vercel",
      "netlify",
      "cloudflare",

      // AWS Services
      "ec2",
      "s3",
      "rds",
      "dynamodb",
      "lambda",
      "cloudfront",
      "route53",
      "vpc",
      "ecs",
      "eks",
      "fargate",
      "elasticache",

      // Containers & Orchestration
      "docker",
      "container",
      "containerization",
      "dockerfile",
      "docker-compose",
      "kubernetes",
      "k8s",
      "helm",
      "kubectl",
      "pod",
      "deployment",
      "statefulset",
      "daemonset",

      // CI/CD
      "ci/cd",
      "continuous integration",
      "continuous deployment",
      "github actions",
      "gitlab ci",
      "jenkins",
      "circleci",
      "travis ci",
      "buildkite",
      "pipeline",

      // Infrastructure as Code
      "terraform",
      "terragrunt",
      "pulumi",
      "cloudformation",
      "ansible",
      "chef",
      "puppet",
      "infrastructure as code",
      "iac",

      // Monitoring & Observability
      "monitoring",
      "observability",
      "logging",
      "tracing",
      "metrics",
      "prometheus",
      "grafana",
      "datadog",
      "new relic",
      "sentry",
      "opentelemetry",
      "elk stack",
      "splunk",

      // Networking
      "load balancer",
      "reverse proxy",
      "nginx",
      "traefik",
      "cdn",
      "dns",
      "ssl",
      "tls",
      "certificate",
      "ingress",
      "service discovery",
    ],

    "ai-machine-learning": [
      // LLMs & Models
      "llm",
      "large language model",
      "gpt",
      "claude",
      "gemini",
      "openai",
      "anthropic",
      "chatgpt",
      "prompt engineering",
      "fine-tuning",
      "model training",

      // AI Techniques
      "rag",
      "retrieval augmented generation",
      "embeddings",
      "vector database",
      "vector search",
      "semantic search",
      "neural network",
      "transformer",
      "attention mechanism",

      // AI Tools & Frameworks
      "langchain",
      "llamaindex",
      "hugging face",
      "tensorflow",
      "pytorch",
      "scikit-learn",
      "keras",

      // AI Engineering
      "ai agents",
      "autonomous agents",
      "function calling",
      "tool use",
      "ai integration",
      "copilot",
      "code generation",
      "ai assistant",

      // Vector DBs
      "pinecone",
      "weaviate",
      "qdrant",
      "milvus",
      "chroma",
      "pgvector",

      // ML Operations
      "mlops",
      "model deployment",
      "model serving",
      "inference",
      "model monitoring",

      // Practical AI
      "ai features",
      "machine learning",
      "deep learning",
      "natural language processing",
      "nlp",
      "computer vision",
      "recommendation system",
    ],

    security: [
      // Vulnerabilities
      "vulnerability",
      "cve",
      "security patch",
      "security update",
      "exploit",
      "zero-day",
      "xss",
      "csrf",
      "sql injection",
      "code injection",
      "remote code execution",
      "rce",

      // Auth & Access
      "authentication",
      "authorization",
      "access control",
      "rbac",
      "role-based",
      "permission",
      "identity management",
      "iam",
      "single sign-on",
      "sso",
      "mfa",
      "multi-factor",
      "2fa",

      // Encryption
      "encryption",
      "cryptography",
      "tls",
      "ssl",
      "https",
      "certificate",
      "key management",
      "secrets management",
      "vault",
      "hashing",
      "bcrypt",
      "argon2",

      // Security Practices
      "owasp",
      "security best practices",
      "secure coding",
      "security audit",
      "penetration testing",
      "security testing",
      "threat modeling",
      "security review",

      // Infrastructure Security
      "firewall",
      "waf",
      "ddos",
      "intrusion detection",
      "network security",
      "zero trust",
      "security group",

      // Compliance
      "gdpr",
      "hipaa",
      "soc2",
      "compliance",
      "data privacy",
      "pii",

      // Incident Response
      "security incident",
      "breach",
      "security response",
      "incident response",
      "postmortem",
    ],

    "developer-tools": [
      // IDEs & Editors
      "vs code",
      "vscode",
      "visual studio code",
      "neovim",
      "vim",
      "intellij",
      "webstorm",
      "sublime",
      "ide",
      "editor",

      // Version Control
      "git",
      "github",
      "gitlab",
      "bitbucket",
      "version control",
      "merge conflict",
      "git workflow",
      "branching strategy",
      "pull request",
      "code review",

      // CLI Tools
      "command line",
      "terminal",
      "shell",
      "bash",
      "zsh",
      "cli tool",
      "command line tool",

      // Code Quality
      "linter",
      "eslint",
      "prettier",
      "code formatting",
      "code quality",
      "static analysis",
      "sonarqube",
      "code coverage",

      // Testing Tools
      "testing",
      "unit test",
      "integration test",
      "test framework",
      "mock",
      "stub",

      // Developer Experience
      "dx",
      "developer experience",
      "developer productivity",
      "workflow automation",
      "hot reload",
      "live reload",
      "debugging",
      "debugger",

      // Documentation
      "documentation",
      "api docs",
      "swagger",
      "openapi",
      "postman",
      "insomnia",

      // Package Managers
      "npm",
      "yarn",
      "pnpm",
      "package manager",
      "monorepo",
      "turborepo",
      "nx",
    ],

    "career-leadership": [
      // Interviews
      "technical interview",
      "coding interview",
      "system design interview",
      "behavioral interview",
      "interview prep",
      "interview questions",
      "leetcode",
      "hackerrank",

      // Career Growth
      "career",
      "career growth",
      "career path",
      "promotion",
      "career ladder",
      "leveling",
      "staff engineer",
      "principal engineer",
      "senior engineer",

      // Leadership
      "engineering leadership",
      "tech lead",
      "team lead",
      "engineering manager",
      "management",
      "people management",
      "1-on-1",
      "one-on-one",
      "mentorship",
      "coaching",

      // Team & Culture
      "engineering culture",
      "team culture",
      "hiring",
      "onboarding",
      "team building",
      "collaboration",
      "communication skills",

      // Compensation
      "salary",
      "compensation",
      "negotiation",
      "stock options",
      "equity",
      "total compensation",

      // Work-Life
      "remote work",
      "work from home",
      "work-life balance",
      "burnout",
      "productivity",

      // Technical Writing
      "technical writing",
      "engineering blog",
      "writing",
      "documentation",
      "rfc",
      "design doc",
      "architecture decision",
      "adr",

      // Influence
      "technical influence",
      "thought leadership",
      "conference talk",
      "speaking",
      "open source contribution",
    ],

    product: [
      // Product Management
      "product management",
      "product manager",
      "product owner",
      "product strategy",
      "product roadmap",
      "roadmap planning",
      "product vision",
      "product metrics",
      "product analytics",

      // User Research
      "user research",
      "user testing",
      "user interview",
      "usability testing",
      "user feedback",
      "customer feedback",
      "user persona",
      "user journey",
      "customer journey",

      // Design Thinking
      "design thinking",
      "human-centered design",
      "design sprint",
      "prototyping",
      "wireframing",
      "mockup",
      "figma",
      "sketch",
      "user flow",

      // Product Development
      "product development",
      "product launch",
      "go-to-market",
      "gtm",
      "mvp",
      "minimum viable product",
      "product iteration",
      "feature flag",
      "feature toggle",
      "a/b testing",
      "experimentation",

      // Product Metrics
      "product-market fit",
      "pmf",
      "retention",
      "churn",
      "activation",
      "engagement",
      "dau",
      "mau",
      "north star metric",
      "okr",
      "kpi",

      // User Experience
      "user experience",
      "ux",
      "ui design",
      "user interface",
      "interaction design",
      "information architecture",
      "user-centric",
      "customer-centric",
      "usability",

      // Product Tools
      "linear",
      "jira",
      "asana",
      "notion",
      "productboard",
      "amplitude",
      "mixpanel",
      "heap",
      "pendo",

      // Growth & Adoption
      "product-led growth",
      "plg",
      "user onboarding",
      "user adoption",
      "product adoption",
      "viral loop",
      "referral program",
      "freemium",

      // Prioritization
      "prioritization",
      "feature prioritization",
      "backlog",
      "product backlog",
      "rice framework",
      "impact effort",
      "value vs effort",

      // Company Culture & Building
      "company culture",
      "organizational culture",
      "startup culture",
      "culture building",
      "company values",
      "mission",
      "vision statement",
      "company building",
      "scaling companies",
      "hypergrowth",

      // Team Dynamics
      "team dynamics",
      "organizational structure",
      "org design",
      "org chart",
      "remote culture",
      "distributed teams",
      "async communication",
      "company meetings",
      "all-hands",

      // Startups & Entrepreneurship
      "startup",
      "startups",
      "entrepreneurship",
      "founder",
      "co-founder",
      "founding team",
      "early stage",
      "seed stage",
      "series a",
      "series b",
      "fundraising",
      "venture capital",
      "vc",
      "investors",
      "pitch deck",

      // Company Operations
      "operations",
      "business operations",
      "go-to-market strategy",
      "sales strategy",
      "marketing strategy",
      "business model",
      "unit economics",
      "revenue model",
      "pricing strategy",

      // Growth & Scaling
      "scaling",
      "company growth",
      "business growth",
      "growth strategy",
      "market expansion",
      "international expansion",
      "acquisition",
      "merger",
      "ipo",

      // Company Health
      "company health",
      "employee engagement",
      "employee satisfaction",
      "employee retention",
      "turnover",
      "attrition",
      "employer brand",
      "talent retention",

      // Workplace & Environment
      "workplace",
      "office culture",
      "work environment",
      "company perks",
      "benefits",
      "compensation philosophy",
      "equity distribution",
      "transparent salary",

      // Company Communication
      "internal communication",
      "transparency",
      "open communication",
      "feedback culture",
      "psychological safety",
      "trust",
      "alignment",

      // Decision Making
      "decision making",
      "strategic planning",
      "strategic decisions",
      "trade-offs",
      "pivot",
      "company direction",
    ],

    "opinions-general": [
      // Opinion & Commentary
      "opinion",
      "perspective",
      "thoughts on",
      "my view",
      "hot take",
      "unpopular opinion",
      "controversial",
      "rant",
      "essay",
      "reflection",
      "commentary",

      // Industry Discussion
      "industry",
      "tech industry",
      "silicon valley",
      "startup culture",
      "tech culture",
      "engineering culture",
      "software industry",
      "tech trends",
      "future of",

      // Philosophy & Principles
      "philosophy",
      "principles",
      "best practices",
      "lessons learned",
      "things i wish",
      "advice",
      "wisdom",
      "experience",
      "why i",
      "how i think about",

      // Complexity & Systems Thinking
      "complexity",
      "complex systems",
      "systems thinking",
      "mental models",
      "trade-offs",
      "decision making",
      "problem solving",
      "critical thinking",

      // Software Craftsmanship
      "software craftsmanship",
      "engineering excellence",
      "code quality",
      "technical excellence",
      "software design",
      "clean code",
      "pragmatic",
      "simplicity",

      // Meta/Self-Referential
      "blogging",
      "writing",
      "learning",
      "teaching",
      "explaining",
      "understanding",
      "meta",

      // General Tech Discussion
      "technology",
      "software development",
      "programming",
      "engineering",
      "software engineering",
      "computer science",
      "technical discussion",
      "tech discussion",

      // Controversial Topics
      "overrated",
      "underrated",
      "myth",
      "misconception",
      "considered harmful",
      "debate",
      "discussion",

      // Career Reflections (non-specific)
      "experience report",
      "retrospective",
      "postmortem",
      "case study",
      "story",
      "journey",
      "evolution",
    ],
  };

  // Find matching category with weighted scoring
  let matchedCategory = null;
  let maxScore = 0;

  for (const [slug, keywords] of Object.entries(categoryKeywords)) {
    let score = 0;

    // Count keyword matches
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        // Give more weight to matches in the title
        if (title.toLowerCase().includes(keyword)) {
          score += 3;
        } else {
          score += 1;
        }
      }
    }

    if (score > maxScore) {
      maxScore = score;
      matchedCategory = allCategories.find((cat) => cat.slug === slug);
    }
  }

  // If no strong match (score < 2), default to Backend & APIs (most general)
  if (!matchedCategory || maxScore < 2) {
    matchedCategory = allCategories.find((cat) => cat.slug === "backend-apis");
  }

  // Generate tag based on matched category
  const tagNames: string[] = [];

  if (matchedCategory) {
    // Use the category name as the primary tag
    tagNames.push(matchedCategory.name);
  }

  return {
    categoryId: matchedCategory?.id || null,
    tagNames,
  };
}
