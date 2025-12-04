import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is not set. Please set a Postgres connection string in your environment."
  );
}

// Using prepare: false avoids issues with some Postgres providers and Drizzle migrations
// onnotice: suppress Neon welcome messages and other notices
const client = postgres(databaseUrl, {
  prepare: false,
  onnotice: () => {} // Suppress all NOTICE level logs (including Neon welcome message)
});

export const db = drizzle(client, { schema });

// Initialize with default categories for FullStack Engineers
export async function initializeDefaultData() {
  const defaultCategories = [
    {
      name: "System Design & Architecture",
      slug: "system-design-architecture",
      description:
        "Distributed systems, microservices, scalability patterns, architecture decisions, and design patterns",
    },
    {
      name: "Frontend Engineering",
      slug: "frontend-engineering",
      description: "React, Next.js, Vue, UI/UX, performance optimization, state management, and modern web development",
    },
    {
      name: "Backend & APIs",
      slug: "backend-apis",
      description: "Node.js, Python, Go, REST, GraphQL, databases, message queues, and server-side development",
    },
    {
      name: "Cloud & DevOps",
      slug: "cloud-devops",
      description: "AWS, Docker, Kubernetes, CI/CD, infrastructure as code, monitoring, and observability",
    },
    {
      name: "AI",
      slug: "ai-machine-learning",
      description: "LLMs, embeddings, AI agents, RAG patterns, prompt engineering, and practical ML for engineers",
    },
    {
      name: "Security",
      slug: "security",
      description: "Vulnerabilities, authentication, authorization, encryption, security best practices, and incident response",
    },
    {
      name: "Developer Tools",
      slug: "developer-tools",
      description: "VS Code, CLI tools, Git workflows, code quality tools, and developer productivity",
    },
    {
      name: "Career & Leadership",
      slug: "career-leadership",
      description: "Technical interviews, career progression, engineering management, and building technical influence",
    },
    {
      name: "Product/Culture",
      slug: "product",
      description: "Product management, startup culture, company building, user research, design thinking, and organizational dynamics",
    },
    {
      name: "Opinions & General",
      slug: "opinions-general",
      description: "Engineering perspectives, thought leadership, industry commentary, and general tech discussions",
    },
  ];

  try {
    for (const category of defaultCategories) {
      await db.insert(schema.categories).values(category).onConflictDoNothing();
    }
    console.log("✅ Default categories initialized");
  } catch (error) {
    console.error("Error initializing default data:", error);
  }
}
