import { db } from "@/lib/db";
import { outreachCampaigns, outreachProspects } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  name: string | null;
  company: string | null;
  blog: string;
  location: string | null;
  email: string | null;
  bio: string | null;
  public_repos: number;
  followers: number;
}

interface GitHubRepo {
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
}

// Helper function to extract email from GitHub commits
async function fetchEmailFromCommits(
  username: string,
  repoName: string | null,
  headers: HeadersInit
): Promise<string | null> {
  try {
    // Strategy 1: Try to get email from recent events
    const eventsUrl = `https://api.github.com/users/${username}/events/public`;
    const eventsResponse = await fetch(eventsUrl, { headers });

    if (eventsResponse.ok) {
      const events = await eventsResponse.json();

      // Look for PushEvent which contains commit info
      for (const event of events) {
        if (event.type === "PushEvent" && event.payload?.commits) {
          for (const commit of event.payload.commits) {
            // Check if commit author email exists and is not a noreply email
            if (
              commit.author?.email &&
              !commit.author.email.includes("noreply") &&
              !commit.author.email.includes("users.noreply")
            ) {
              console.log(
                `Found email in events for ${username}: ${commit.author.email}`
              );
              return commit.author.email;
            }
          }
        }
      }
    }

    // Strategy 2: If we have a repo, try to get email from commits in that repo
    if (repoName) {
      const commitsUrl = `https://api.github.com/repos/${username}/${repoName}/commits?per_page=10`;
      const commitsResponse = await fetch(commitsUrl, { headers });

      if (commitsResponse.ok) {
        const commits = await commitsResponse.json();

        for (const commit of commits) {
          const email = commit.commit?.author?.email;
          if (
            email &&
            !email.includes("noreply") &&
            !email.includes("users.noreply")
          ) {
            console.log(
              `Found email in repo commits for ${username}: ${email}`
            );
            return email;
          }
        }
      }
    }

    return null;
  } catch (error) {
    console.error(`Error fetching commits for ${username}:`, error);
    return null;
  }
}

async function fetchGitHubUsers(
  language: string,
  level: string,
  limit: number = 50,
  page: number = 1,
  scrapedUserIds: Set<number> = new Set()
) {
  const prospects: Array<{
    name: string | null;
    email: string | null;
    githubUrl: string;
    bio: string | null;
    topRepo: string | null;
    stack: string | null;
    level: string | null;
    location: string | null;
    userId: number;
  }> = [];

  try {
    // Build search query based on level
    // Target average users, not influencers (adjusted ranges for more realistic developers)
    const normalizedLanguage = (language || "").trim().toLowerCase();
    const includeLanguage =
      normalizedLanguage !== "" &&
      normalizedLanguage !== "all" &&
      normalizedLanguage !== "any";

    let followersQualifier = "";
    if (level === "junior") {
      followersQualifier = "followers:1..20"; // Early career devs
    } else if (level === "mid") {
      followersQualifier = "followers:20..100"; // Experienced but not famous
    } else if (level === "senior") {
      followersQualifier = "followers:100..500"; // Senior but still approachable
    } else {
      // all levels - target average developers
      followersQualifier = "followers:1..500";
    }

    // Prefer user search with followers; add language only if it's a specific value
    let query = includeLanguage
      ? `language:${language} ${followersQualifier}`
      : followersQualifier;

    // GitHub API search users endpoint with pagination
    const buildSearchUrl = (q: string, pageNum: number) =>
      `https://api.github.com/search/users?q=${encodeURIComponent(`type:user ${q}`)}&per_page=100&page=${pageNum}`;
    let searchUrl = buildSearchUrl(query, page);

    const headers: HeadersInit = {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "Tech-Upkeep-Outreach",
    };

    // Add GitHub token if available
    if (process.env.GITHUB_TOKEN) {
      headers["Authorization"] = `token ${process.env.GITHUB_TOKEN}`;
    }

    console.log(`Fetching GitHub users from page ${page}...`);
    let searchResponse = await fetch(searchUrl, { headers });

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error("GitHub search failed:", errorText);

      // Handle rate limiting specifically
      if (searchResponse.status === 429 || searchResponse.status === 403) {
        const resetTime = searchResponse.headers.get('x-ratelimit-reset');
        const retryAfter = searchResponse.headers.get('retry-after');

        let waitMessage = 'Please wait a few minutes before trying again.';
        if (resetTime) {
          const resetDate = new Date(parseInt(resetTime) * 1000);
          waitMessage = `Rate limit resets at ${resetDate.toLocaleTimeString()}`;
        } else if (retryAfter) {
          waitMessage = `Retry after ${retryAfter} seconds`;
        }

        throw new Error(`GitHub API rate limit exceeded. ${waitMessage}`);
      }

      throw new Error(`GitHub API error: ${searchResponse.status}`);
    }

    let searchData = await searchResponse.json();
    let users = searchData.items || [];

    // Fallback: if language filter yields zero, retry without language
    if (users.length === 0 && includeLanguage && page === 1) {
      console.warn(
        `No users found for query: ${query}. Retrying without language qualifier.`
      );
      const fallbackQuery = followersQualifier;
      searchUrl = buildSearchUrl(fallbackQuery, page);
      searchResponse = await fetch(searchUrl, { headers });
      if (searchResponse.ok) {
        searchData = await searchResponse.json();
        users = searchData.items || [];
      }
    }

    // Filter out already scraped users
    users = users.filter((u: any) => !scrapedUserIds.has(u.id));

    console.log(`Found ${users.length} NEW GitHub users on page ${page} (query: ${query})`);

    // Fetch detailed info for each user (with rate limiting)
    let processedUsers = 0;

    for (
      let i = 0;
      i < Math.min(users.length, limit) && prospects.length < limit;
      i++
    ) {
      const user = users[i];
      processedUsers++;

      try {
        // Small delay to avoid rate limiting
        if (i > 0 && i % 5 === 0) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        // Fetch user details
        const userResponse = await fetch(user.url, { headers });
        if (!userResponse.ok) continue;

        const userData: GitHubUser = await userResponse.json();

        // Fetch user's repos to get top repo (we need this for email extraction)
        const reposResponse = await fetch(
          `${user.url}/repos?sort=stars&per_page=5`,
          { headers }
        );
        let topRepo = null;
        let topRepoName = null;
        let stack = language;

        if (reposResponse.ok) {
          const repos: GitHubRepo[] = await reposResponse.json();
          if (repos.length > 0) {
            topRepo = repos[0].name;
            topRepoName = repos[0].name;
            // Extract tech stack from top repos
            const languages = repos
              .map((r) => r.language)
              .filter((l): l is string => l !== null)
              .filter((v, i, a) => a.indexOf(v) === i)
              .slice(0, 3);
            stack = languages.join(", ");
          }
        }

        // Try multiple strategies to get email
        let email = userData.email; // Strategy 1: Profile email

        // Strategy 2: Extract from commits
        if (!email) {
          console.log(
            `No profile email for ${userData.login}, trying commits...`
          );
          email = await fetchEmailFromCommits(
            userData.login,
            topRepoName,
            headers
          );
        }

        // Infer level from followers (adjusted for average users)
        let inferredLevel = level !== "all" ? level : null;
        if (level === "all") {
          if (userData.followers < 20) inferredLevel = "junior";
          else if (userData.followers < 100) inferredLevel = "mid";
          else inferredLevel = "senior";
        }

        // Add all prospects, even without emails (they can be useful for LinkedIn/Twitter outreach)
        prospects.push({
          name: userData.name || userData.login,
          email: email,
          githubUrl: userData.html_url,
          bio: userData.bio,
          topRepo,
          stack,
          level: inferredLevel,
          location: userData.location,
          userId: userData.id,
        });

        if (email) {
          console.log(`✓ Added ${userData.login} with email: ${email}`);
        } else {
          console.log(
            `⚠ Added ${userData.login} WITHOUT email (can reach via GitHub/LinkedIn)`
          );
        }
      } catch (err) {
        console.error(`Error fetching user ${user.login}:`, err);
        continue;
      }
    }

    const withEmails = prospects.filter((p) => p.email).length;
    console.log(
      `Processed ${processedUsers} users, found ${prospects.length} prospects (${withEmails} with emails, ${prospects.length - withEmails} without)`
    );

    return prospects;
  } catch (error) {
    console.error("Error fetching GitHub users:", error);
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { campaignId, limit = 50, startPage = null } = body;

    if (!campaignId) {
      return NextResponse.json(
        { error: "Campaign ID is required" },
        { status: 400 }
      );
    }

    // Get campaign details
    const [campaign] = await db
      .select()
      .from(outreachCampaigns)
      .where(eq(outreachCampaigns.id, campaignId));

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    if (campaign.target !== "github") {
      return NextResponse.json(
        { error: "Only GitHub scraping is supported" },
        { status: 400 }
      );
    }

    // Load scraped user IDs from campaign
    const scrapedUserIds = campaign.scrapedUserIds
      ? new Set<number>(JSON.parse(campaign.scrapedUserIds))
      : new Set<number>();

    // Use provided startPage, or calculate from offset
    const startingPage = startPage || Math.floor((campaign.scrapingOffset || 0) / 100) + 1;

    console.log(`Starting scrape from page ${startingPage}, already scraped ${scrapedUserIds.size} users`);

    // Keep scraping until we have inserted 'limit' eligible prospects
    let insertedCount = 0;
    let skippedDuplicates = 0;
    let skippedAlreadyContacted = 0;
    let currentPage = startingPage;
    let maxPages = 10; // Safety limit to avoid infinite loops
    let pagesScraped = 0;
    let totalScraped = 0;

    // CRITICAL: Keep scraping pages until we have enough ELIGIBLE prospects
    while (insertedCount < limit && pagesScraped < maxPages) {
      console.log(`\n📄 Scraping page ${currentPage} (inserted so far: ${insertedCount}/${limit})...`);

      // Add delay between pages to avoid rate limiting (except first page)
      if (pagesScraped > 0) {
        console.log('⏳ Waiting 2 seconds to avoid rate limiting...');
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      const prospects = await fetchGitHubUsers(
        campaign.targetLanguage || "javascript",
        campaign.targetLevel || "all",
        100, // Fetch 100 per page
        currentPage,
        scrapedUserIds
      );

      if (prospects.length === 0) {
        console.log(`No more users found on page ${currentPage}, stopping`);
        break;
      }

      totalScraped += prospects.length;
      console.log(`Found ${prospects.length} new users on page ${currentPage}`);

      // Track scraped user IDs
      prospects.forEach(p => scrapedUserIds.add(p.userId));

      // Immediately check and insert each prospect
      for (const prospect of prospects) {
        if (insertedCount >= limit) {
          console.log(`✅ Reached target of ${limit} eligible prospects!`);
          break;
        }

        try {
          // CRITICAL: Check if prospect already exists GLOBALLY (across ALL campaigns)
          let isDuplicate = false;

          // Check 1: By email (if email exists)
          if (prospect.email) {
            const existingByEmail = await db
              .select()
              .from(outreachProspects)
              .where(eq(outreachProspects.email, prospect.email))
              .limit(1);

            if (existingByEmail.length > 0) {
              isDuplicate = true;

              // Check if already contacted
              if (existingByEmail[0].status === "contacted" ||
                  existingByEmail[0].status === "responded" ||
                  existingByEmail[0].status === "converted") {
                skippedAlreadyContacted++;
                console.log(`⚠️  SKIP: ${prospect.name} (${prospect.email}) - Already contacted`);
              } else {
                skippedDuplicates++;
                console.log(`⚠️  SKIP: ${prospect.name} (${prospect.email}) - Duplicate email`);
              }
            }
          }

          // Check 2: By GitHub URL (fallback if no email)
          if (!isDuplicate && prospect.githubUrl) {
            const existingByGithub = await db
              .select()
              .from(outreachProspects)
              .where(eq(outreachProspects.githubUrl, prospect.githubUrl))
              .limit(1);

            if (existingByGithub.length > 0) {
              isDuplicate = true;
              skippedDuplicates++;
              console.log(`⚠️  SKIP: ${prospect.name} - Duplicate GitHub profile`);
            }
          }

          // Only insert if NOT a duplicate
          if (!isDuplicate) {
            await db.insert(outreachProspects).values({
              campaignId,
              ...prospect,
              status: "pending",
            });
            insertedCount++;
            console.log(`✓ INSERTED [${insertedCount}/${limit}]: ${prospect.name} ${prospect.email ? `(${prospect.email})` : '(no email)'}`);
          }
        } catch (err) {
          console.error("Error inserting prospect:", err);
        }
      }

      // Move to next page
      currentPage++;
      pagesScraped++;

      console.log(`Page ${currentPage - 1} complete: inserted ${insertedCount}/${limit}, skipped ${skippedDuplicates + skippedAlreadyContacted}`);

      // Only continue if we haven't reached the limit
      if (insertedCount >= limit) {
        console.log(`✅ Successfully inserted ${limit} eligible prospects!`);
        break;
      }
    }

    // Update campaign stats and pagination state
    const totalProspects = await db
      .select()
      .from(outreachProspects)
      .where(eq(outreachProspects.campaignId, campaignId));

    await db
      .update(outreachCampaigns)
      .set({
        totalProspects: totalProspects.length,
        scrapingOffset: (currentPage - 1) * 100,
        scrapedUserIds: JSON.stringify(Array.from(scrapedUserIds)),
      })
      .where(eq(outreachCampaigns.id, campaignId));

    return NextResponse.json({
      success: true,
      scraped: totalScraped,
      inserted: insertedCount,
      skipped: totalScraped - insertedCount,
      skippedDuplicates: skippedDuplicates,
      skippedAlreadyContacted: skippedAlreadyContacted,
      totalProspects: totalProspects.length,
      pagesScraped: pagesScraped,
      nextPage: currentPage,
      reachedTarget: insertedCount >= limit,
    });
  } catch (error) {
    console.error("Error scraping GitHub:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to scrape GitHub",
      },
      { status: 500 }
    );
  }
}
