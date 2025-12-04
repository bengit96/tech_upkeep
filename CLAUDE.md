# Tech Upkeep - Claude AI Assistant Documentation

## 🎯 Project Overview

Tech Upkeep is a sophisticated tech news aggregation and newsletter platform that:
- Aggregates content from 110+ curated sources (blogs, YouTube, Reddit, podcasts, Substacks)
- Automatically categorizes content using keyword matching
- Provides manual curation interface for quality control
- Sends bi-weekly newsletters (Tuesday & Friday) via Resend
- Tracks engagement metrics (opens, clicks)
- Built with Next.js 14 App Router, TypeScript, and Drizzle ORM

## 📁 Project Structure

```
tech_upkeep/
├── app/                      # Next.js 14 App Router
│   ├── page.tsx             # Landing page (Server Component)
│   ├── layout.tsx           # Root layout with global styles
│   ├── admin/               # Admin panel (protected)
│   │   ├── page.tsx         # Dashboard with stats & controls
│   │   ├── curate/          # Content curation interface
│   │   ├── sent/            # View sent content
│   │   ├── sources/         # Manage content sources
│   │   ├── analytics/       # Email analytics
│   │   └── login/           # OTP authentication
│   └── api/                 # REST API endpoints
│       ├── users/           # User management
│       ├── admin/           # Admin operations
│       ├── auth/            # Authentication
│       └── track/           # Email tracking
├── lib/                     # Core business logic
│   ├── db/                  # Database layer
│   │   ├── schema.ts        # Drizzle ORM schema (17 tables)
│   │   └── index.ts         # DB connection & initialization
│   ├── services/            # Business services
│   │   ├── aggregator.ts    # Multi-source content fetching
│   │   ├── categorizer.ts   # AI-powered categorization
│   │   └── email.ts         # Newsletter generation & sending
│   ├── utils/               # Utility functions
│   ├── auth.ts              # JWT & OTP authentication
│   └── constants.ts         # App-wide constants
├── components/              # React components
│   ├── ui/                  # shadcn/ui components
│   └── Logo.tsx             # Brand logo component
├── scripts/                 # Database & maintenance scripts
│   └── seed-all-sources.ts  # Master source seeding
├── claude/                  # Claude AI documentation (gitignored)
└── data/                    # SQLite database files (gitignored)
```

## 🔑 Key Technical Patterns

### 1. Server Components by Default
- All pages use Server Components for optimal performance
- Client Components only for interactivity (`'use client'`)
- Server-side data fetching in components

### 2. Database Architecture
- **SQLite/LibSQL** for simplicity and portability
- **Drizzle ORM** for type-safe database operations
- 17 tables with proper relationships and indexes
- Content deduplication via hash & URL normalization

### 3. Authentication System
- OTP-based admin authentication
- JWT tokens stored in HTTP-only cookies
- Middleware protection for admin routes

### 4. Content Pipeline
```
Sources → Aggregator → Deduplication → Categorization → Curation → Newsletter
```

### 5. Email System
- **Resend API** for reliable delivery
- HTML newsletter generation with inline styles
- Click & open tracking via redirect URLs
- Unsubscribe handling

## 🎨 Design Patterns

### UI/UX
- **Dark mode** throughout admin panel
- **Glassmorphism** effects on cards
- **Gradient accents** (blue-purple theme)
- **Framer Motion** animations on landing page
- **shadcn/ui** component library

### Color Scheme
- Background: Gray 900-800
- Primary: Blue 600-500
- Accent: Purple 600-500
- Success: Green 500
- Error: Red 500

## 📊 Database Schema

### Core Tables
1. **users** - Subscribers with email & status
2. **sources** - 110+ content sources
3. **content** - Aggregated articles
4. **categories** - 10 content categories
5. **tags** - Auto-extracted keywords
6. **scrapeBatches** - Aggregation sessions
7. **newsletterSends** - Email delivery tracking

### Content States
- `pending` - Awaiting curation
- `accepted` - Approved for newsletter
- `discarded` - Rejected content
- `sent` - Already emailed

## 🚀 Key Workflows

### 1. Content Aggregation
```typescript
POST /api/admin/scrape
→ Fetch from all active sources
→ Apply time filter (5 days)
→ Check duplicates (URL, hash, title)
→ Calculate quality score
→ Auto-categorize
→ Save with status: "pending"
```

### 2. Content Curation
```
/admin/curate
→ View pending content by batch
→ Accept/Discard individually
→ Bulk operations
→ AI description generation
→ Category reassignment
```

### 3. Newsletter Sending
```typescript
POST /api/admin/send-newsletter
→ Get accepted content
→ Group by category
→ Generate HTML email
→ Send via Resend
→ Mark content as sent
→ Track delivery
```

## 🔧 Environment Variables

```env
# Required
DATABASE_URL=file:./data/tech-upkeep.db
RESEND_API_KEY=re_xxxxxxxxxxxxx
JWT_SECRET=your-secret-key-here

# Optional
OPENAI_API_KEY=sk-xxxxxxxxxxxxx
YOUTUBE_API_KEY=your-youtube-api-key
NEXT_PUBLIC_APP_URL=https://techupkeep.dev
```

## 📝 Content Sources

### Categories (7)
- `engineering` - Software engineering (17 sources)
- `ai-ml` - AI & machine learning (6 sources)
- `tools` - Developer tools (4 sources)
- `devops` - Infrastructure (3 sources)
- `product` - Product & startups (4 sources)
- `career` - Career growth (1 source)
- `news` - Industry news (1 source)

### Source Types
- **Blogs** (49) - RSS feeds from tech blogs
- **Substack** (27) - Newsletter publications
- **YouTube** (6) - Video channels
- **Podcasts** (6) - Audio content
- **Reddit** (4) - Subreddit hot posts

## 🎯 Performance Optimizations

### Database
- Indexes on frequently queried columns
- Batch operations for bulk updates
- Connection pooling
- Query optimization

### Frontend
- Server Components for initial load
- Dynamic imports for code splitting
- Image optimization
- Minimal client-side JavaScript

### API
- Response caching where appropriate
- Parallel data fetching
- Rate limiting on external APIs
- Error boundaries and fallbacks

## 🔒 Security Measures

1. **Authentication**
   - OTP for admin login
   - JWT with HTTP-only cookies
   - Session expiration

2. **Data Protection**
   - Input sanitization
   - SQL injection prevention (parameterized queries)
   - XSS protection
   - CSRF tokens

3. **API Security**
   - Rate limiting
   - Request validation
   - Error message sanitization

## 📈 Analytics & Tracking

### Metrics Tracked
- Newsletter opens (pixel tracking)
- Link clicks (redirect tracking)
- Unsubscribe rates
- Content engagement scores
- Source performance

### Admin Dashboard Stats
- Total users
- Active subscribers
- Content pipeline status
- Newsletter history
- Source activity

## 🛠️ Development Commands

```bash
# Development
npm run dev              # Start dev server
npm run db:studio        # Open Drizzle Studio

# Database
npm run db:seed          # Seed all sources
npm run db:generate      # Generate migrations
npm run db:push          # Apply migrations

# Production
npm run build            # Build for production
npm start                # Start production server
```

## 🐛 Common Issues & Solutions

### Issue: Duplicate content
**Solution**: System uses 3-layer deduplication (URL, hash, title similarity)

### Issue: Rate limiting on APIs
**Solution**: Implements delays and retry logic

### Issue: Email deliverability
**Solution**: Proper domain verification in Resend

### Issue: Memory usage with large batches
**Solution**: Pagination and batch processing

## 📚 Key Files Reference

### Core Services
- `lib/services/aggregator.ts` - Multi-source content fetching
- `lib/services/email.ts` - Newsletter generation
- `lib/services/categorizer.ts` - Content categorization

### Admin Pages
- `app/admin/page.tsx` - Main dashboard
- `app/admin/curate/page.tsx` - Content curation
- `app/admin/sources/page.tsx` - Source management

### API Endpoints
- `app/api/admin/scrape/route.ts` - Trigger aggregation
- `app/api/admin/send-newsletter/route.ts` - Send emails
- `app/api/admin/content/*/route.ts` - Content operations

## 🎯 Best Practices for Claude

1. **Always use Server Components** unless client interactivity needed
2. **Prefer Edit over Write** for existing files
3. **Run `npm run db:seed`** after schema changes
4. **Test email templates** in development first
5. **Use proper TypeScript types** from schema
6. **Handle errors gracefully** with try-catch
7. **Log important operations** for debugging
8. **Maintain backward compatibility** in schema changes

## 🚦 Current Status

- ✅ Core functionality complete
- ✅ 110 sources configured
- ✅ Email system operational
- ✅ Admin panel functional
- ✅ Analytics tracking active
- 🔄 AI categorization (optional enhancement)
- 🔄 User preference management (future)