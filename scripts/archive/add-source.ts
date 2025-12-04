import { db } from "../lib/db/index";
import { sources } from "../lib/db/schema";

async function addNewSources() {
  try {
    // Add Surfing Complexity blog
    await db.insert(sources).values({
      name: "Surfing Complexity",
      slug: "surfing-complexity",
      type: "blog",
      url: "https://surfingcomplexity.blog/feed/",
      isActive: true,
      description: "Essays on engineering, systems thinking, and managing complexity in software",
    }).onConflictDoNothing();

    console.log("✅ Added Surfing Complexity blog");

    // Add Airbnb Engineering blog
    await db.insert(sources).values({
      name: "Airbnb Engineering",
      slug: "airbnb-engineering",
      type: "blog",
      url: "https://medium.com/feed/airbnb-engineering",
      isActive: true,
      description: "Technical blog from Airbnb's engineering team covering system design, infrastructure, and product development",
    }).onConflictDoNothing();

    console.log("✅ Added Airbnb Engineering blog");

    // Add Mitchell Hashimoto's blog
    await db.insert(sources).values({
      name: "Mitchell Hashimoto",
      slug: "mitchell-hashimoto",
      type: "blog",
      url: "https://mitchellh.com/feed.xml",
      isActive: true,
      description: "Personal blog of Mitchell Hashimoto (creator of Vagrant, Terraform, Consul). Deep dives on infrastructure, developer tools, and system design",
    }).onConflictDoNothing();

    console.log("✅ Added Mitchell Hashimoto's blog");

    // Add PyTorch blog
    await db.insert(sources).values({
      name: "PyTorch Blog",
      slug: "pytorch-blog",
      type: "blog",
      url: "https://pytorch.org/blog/feed.xml",
      isActive: true,
      description: "Official PyTorch blog covering deep learning, model training, performance optimization, and AI/ML research",
    }).onConflictDoNothing();

    console.log("✅ Added PyTorch blog");
    console.log("\n🎉 All sources added successfully!");
  } catch (error) {
    console.error("❌ Error adding sources:", error);
  }
  process.exit(0);
}

addNewSources();
