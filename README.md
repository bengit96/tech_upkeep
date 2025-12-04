# Tech Upkeep - Daily Tech News Newsletter

A comprehensive tech news aggregation and newsletter platform built with **Next.js 14**. Delivers curated content from YouTube, Twitter/X, blogs, and Reddit directly to your inbox every morning.

## 🚀 Features

- 📰 **Multi-Source Aggregation**: YouTube, RSS feeds, Reddit
- 🏷️ **Smart Categorization**: AI/ML, Web Dev, Mobile, DevOps, and 6 more categories
- 🎯 **Tag-Based Organization**: Auto-extract tags (javascript, python, docker, etc.)
- 📧 **Beautiful Newsletters**: HTML emails via Resend with category grouping
- 🎨 **Modern UI**: Next.js 14 + Tailwind CSS + shadcn/ui
- 🔧 **Admin Panel**: Manual triggers for scraping and newsletter sending
- 🐳 **Docker Ready**: Complete Docker Compose setup

## 📦 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: LibSQL (SQLite) with Drizzle ORM
- **Email**: Resend API
- **Styling**: Tailwind CSS + shadcn/ui
- **Deployment**: Docker Compose / Vercel

## 🏗️ Project Structure

```
tech_upkeep/
├── app/                      # Next.js App Router
│   ├── page.tsx             # Landing page
│   ├── admin/page.tsx       # Admin dashboard
│   └── api/                 # API routes
├── lib/
│   ├── db/                  # Database (Drizzle ORM)
│   └── services/            # Aggregator, Email, Categorizer
├── components/ui/           # shadcn/ui components
├── docker-compose.yml       # Docker setup
└── .env.example            # Environment template
```

## 🚀 Quick Start

### Option 1: Local Development (SQLite)

**1. Clone and Install**

```bash
git clone <your-repo>
cd tech_upkeep
npm install
```

**2. Configure Environment**

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
DATABASE_URL=file:./data/tech-upkeep.db
RESEND_API_KEY=re_your_api_key_here
```

**Get Resend API Key:**
1. Sign up at https://resend.com (free tier: 100 emails/day)
2. Go to API Keys → Create API Key
3. Copy and paste into `.env.local`

**3. Run Database Migrations**

```bash
npm run db:generate
npm run db:push
```

**4. Start Development Server**

```bash
npm run dev
```

Visit:
- **Landing Page**: http://localhost:3000
- **Admin Panel**: http://localhost:3000/admin

### Option 2: Docker Compose (PostgreSQL)

**1. Update `.env` for Docker**

```env
DATABASE_URL=postgres://postgres:postgres@db:5432/tech_upkeep
RESEND_API_KEY=re_your_api_key_here
```

**2. Start with Docker Compose**

```bash
docker-compose up --build
```

This starts:
- Next.js app on `localhost:3000`
- PostgreSQL on `localhost:5432`

**3. Stop Containers**

```bash
docker-compose down
```

## 📧 Resend Setup (Required for Emails)

### Step 1: Sign Up for Resend

1. Go to https://resend.com
2. Sign up (free tier: 100 emails/day, 3,000/month)
3. Verify your email

### Step 2: Add Domain (Recommended)

For production:
1. Go to **Domains** in Resend dashboard
2. Add your domain (e.g., `yourdomain.com`)
3. Add DNS records as shown
4. Wait for verification

### Step 3: Get API Key

1. Go to **API Keys**
2. Click **Create API Key**
3. Name it "Tech Upkeep"
4. Copy the key (starts with `re_`)
5. Add to `.env.local`:
   ```env
   RESEND_API_KEY=re_xxxxxxxxxxxxx
   ```

### Step 4: Update Email Address

Edit `lib/services/email.ts` line ~60:

```typescript
from: 'Tech Upkeep <newsletter@yourdomain.com>', // Update this
```

For development, use: `newsletter@resend.dev`

## 🎛️ Admin Panel

Access at http://localhost:3000/admin

Features:
- **View Statistics**: Users, content, newsletters
- **Manual Scrape**: Trigger content aggregation
- **Send Newsletter**: Send to all users immediately
- **Real-time Feedback**: See results of actions

### Manual Operations

**Scrape Content:**
- Fetches from RSS, YouTube, Reddit
- Categorizes and tags automatically
- Skips duplicates

**Send Newsletter:**
- Gets content from last 24 hours
- Generates HTML emails
- Sends to all active users

## 🔄 Automated Scheduling (Production)

For production, set up cron jobs to automate:

### Option 1: Vercel Cron (Recommended)

Create `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/admin/scrape",
      "schedule": "0 6 * * *"
    },
    {
      "path": "/api/admin/send-newsletter",
      "schedule": "0 8 * * *"
    }
  ]
}
```

- Scrapes at 6 AM daily
- Sends newsletters at 8 AM daily

### Option 2: External Cron Service

Use services like cron-job.org:

1. Create account
2. Add job: `POST https://yourdomain.com/api/admin/scrape`
3. Schedule: `0 6 * * *`
4. Repeat for newsletter endpoint

### Option 3: Docker Cron

Add to Dockerfile:

```dockerfile
RUN apt-get update && apt-get install -y cron
COPY crontab /etc/cron.d/tech-upkeep
RUN crontab /etc/cron.d/tech-upkeep
```

Create `crontab` file:

```
0 6 * * * curl -X POST http://localhost:3000/api/admin/scrape
0 8 * * * curl -X POST http://localhost:3000/api/admin/send-newsletter
```

## 📊 Database

Using Drizzle ORM with 8 tables:

- **users** - Email subscribers
- **categories** - 10 tech categories
- **tags** - Auto-extracted tags
- **content** - Aggregated news items
- **contentTags** - Content-Tag relationships
- **userCategoryPreferences** - User subscriptions
- **userTagPreferences** - User tag filters
- **newsletterSends** - Delivery tracking

### Database Commands

```bash
# Generate migration after schema changes
npm run db:generate

# Apply migrations
npm run db:push

# Open Drizzle Studio (GUI)
npm run db:studio
```

## 🔌 API Endpoints

### Public

- `POST /api/users/register` - Register new subscriber

### Admin

- `POST /api/admin/scrape` - Trigger content aggregation
- `POST /api/admin/send-newsletter` - Send newsletters
- `GET /api/admin/stats` - Get statistics

## 🌐 Content Sources

Currently aggregating from:

- **RSS Feeds**: Hacker News, TechCrunch, The Verge, Ars Technica
- **Reddit**: r/programming, r/technology, r/webdev, r/MachineLearning
- **YouTube** (optional): Y Combinator, Fireship, freeCodeCamp, The Net Ninja

### Add YouTube Support

1. Get API key from https://console.cloud.google.com/
2. Enable YouTube Data API v3
3. Add to `.env.local`:
   ```env
   YOUTUBE_API_KEY=your_key_here
   ```

## 🎨 Categories

Content is auto-categorized into:

- AI & Machine Learning
- Web Development
- Mobile Development
- DevOps & Cloud
- Programming Languages
- Cybersecurity
- Data Science
- Open Source
- Tech Industry
- Developer Tools

## 🚀 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in dashboard
```

### Docker Production

```bash
docker build -t tech-upkeep .
docker run -p 3000:3000 --env-file .env tech-upkeep
```

## 🔧 Development

### Commands

```bash
npm run dev        # Start dev server
npm run build      # Build for production
npm start          # Start production server
npm run lint       # Lint code
npm run db:studio  # Open database GUI
```

### Adding New Sources

Edit `lib/services/aggregator.ts`:

```typescript
private rssFeeds = [
  // Add new RSS feed
  { url: 'https://example.com/feed', name: 'Example', type: 'article' },
];
```

### Customizing Email Template

Edit `lib/services/email.ts` → `generateNewsletterHTML()`

## 🐛 Troubleshooting

### Emails Not Sending

1. Check `RESEND_API_KEY` in `.env.local`
2. Verify domain in Resend dashboard
3. Update `from` email in `lib/services/email.ts`
4. Check Resend dashboard logs

### Database Errors

```bash
rm -rf data/
npm run db:generate
npm run dev
```

### Docker Build Fails

```bash
docker-compose down -v
docker-compose build --no-cache
docker-compose up
```

## 📝 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | SQLite or PostgreSQL connection string |
| `RESEND_API_KEY` | Yes | Resend API key for emails |
| `YOUTUBE_API_KEY` | No | YouTube Data API v3 key |
| `OPENAI_API_KEY` | No | OpenAI API for enhanced categorization |

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT

## 🙏 Acknowledgments

- Built with Next.js 14
- Email powered by Resend
- UI components from shadcn/ui
- Database with Drizzle ORM

---

**Need Help?** Check out `CLAUDE.md` for detailed architecture docs.
