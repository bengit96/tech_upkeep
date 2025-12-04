import { db } from '../lib/db';
import { blogPosts } from '../lib/db/schema';
import { eq } from 'drizzle-orm';

const existingBlogPosts = [
  {
    slug: 'best-tech-newsletters-for-junior-developers',
    title: '10 Best Tech Newsletters for Junior Developers in 2025',
    description: 'Discover the top tech newsletters for junior developers and bootcamp graduates. From system design to frontend tutorials, find the best curated content to accelerate your engineering career.',
    category: 'Learning',
    publishedAt: new Date('2025-10-15'),
    readTime: '8 min read',
  },
  {
    slug: 'how-to-stay-updated-as-junior-software-engineer',
    title: 'How to Stay Updated as a Junior Software Engineer',
    description: 'Learn proven strategies to stay current with tech trends without information overload. Build a sustainable learning system with newsletters, GitHub Trending, and more.',
    category: 'Career Growth',
    publishedAt: new Date('2025-10-18'),
    readTime: '10 min read',
  },
  {
    slug: 'github-trending-discover-new-tools',
    title: 'GitHub Trending: Your Secret Weapon for Discovering New Tools',
    description: 'Learn how to use GitHub Trending to discover cutting-edge tools, libraries, and frameworks before everyone else. A developer\'s guide to staying ahead of the curve.',
    category: 'Developer Tools',
    publishedAt: new Date('2025-10-21'),
    readTime: '7 min read',
  },
  {
    slug: 'aws-outage-october-2025-analysis',
    title: 'AWS US-EAST-1 Outage (October 2025): What Happened and What We Can Learn',
    description: 'Analysis of the massive AWS outage on October 20, 2025 that took down Snapchat, Roblox, Fortnite, and thousands of websites. Technical breakdown and lessons for engineering teams.',
    category: 'Infrastructure & Cloud',
    publishedAt: new Date('2025-10-21'),
    readTime: '10 min read',
  },
];

async function seedBlogPosts() {
  console.log('🌱 Seeding blog posts...');

  for (const post of existingBlogPosts) {
    try {
      // Check if post already exists
      const existing = await db
        .select()
        .from(blogPosts)
        .where(eq(blogPosts.slug, post.slug));

      if (existing.length > 0) {
        // Update existing post
        await db
          .update(blogPosts)
          .set({
            title: post.title,
            description: post.description,
            category: post.category,
            publishedAt: post.publishedAt,
            readTime: post.readTime,
            updatedAt: new Date(),
          })
          .where(eq(blogPosts.slug, post.slug));

        console.log(`✅ Updated: ${post.title}`);
      } else {
        // Create new post
        await db.insert(blogPosts).values({
          slug: post.slug,
          title: post.title,
          description: post.description,
          category: post.category,
          publishedAt: post.publishedAt,
          readTime: post.readTime,
        });

        console.log(`✨ Created: ${post.title}`);
      }
    } catch (error) {
      console.error(`❌ Error processing ${post.slug}:`, error);
    }
  }

  console.log('\n✅ Blog posts seeded successfully!');
  process.exit(0);
}

seedBlogPosts().catch((error) => {
  console.error('❌ Seeding failed:', error);
  process.exit(1);
});
