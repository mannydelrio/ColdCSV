# ColdCSV — Project Brief for Claude Code

## What We're Building

ColdCSV is a micro-SaaS web app where B2B sales reps and founders upload a CSV of prospects and receive a new CSV back with an AI-generated, hyper-personalized cold email opening line added to each row. It turns a full day of manual research into a 10-minute workflow.

**Domain:** coldcsv.com  
**Target user:** SDRs, B2B founders, outbound agencies  
**Core value prop:** 3–5× better reply rates through genuine personalization at scale

---

## Tech Stack

| Layer | Tool |
|---|---|
| Frontend + API routes | Next.js 14 (App Router) |
| Auth | Supabase Auth (magic link + email) |
| Database | Supabase (Postgres) |
| File handling | In-memory (no file storage — process and discard) |
| AI | Anthropic Claude API (`claude-sonnet-4-20250514`) |
| Payments | Stripe (subscription billing) |
| Deployment | Railway (auto-deploy from GitHub) |
| Styling | Tailwind CSS |

---

## Pricing Tiers

| Plan | Price | Email Credits/mo | Notes |
|---|---|---|---|
| Free | $0 | 10 | No credit card, permanent |
| Pro | $29/mo | 500 | Stripe subscription |
| Scale | $79/mo | 2,000 | Stripe subscription, 3 team seats, API access |

Free users get 10 lifetime credits (not monthly). Pro and Scale reset monthly.

---

## Database Schema (Supabase)

### `users` (extends Supabase auth.users)
```sql
id uuid references auth.users primary key,
email text,
plan text default 'free',         -- 'free' | 'pro' | 'scale'
credits_used int default 0,
credits_limit int default 10,
credits_reset_at timestamptz,     -- null for free plan
stripe_customer_id text,
stripe_subscription_id text,
created_at timestamptz default now()
```

### `jobs`
```sql
id uuid primary key default gen_random_uuid(),
user_id uuid references users(id),
status text default 'pending',    -- 'pending' | 'processing' | 'done' | 'error'
row_count int,
credits_consumed int,
created_at timestamptz default now(),
completed_at timestamptz
```

### `usage_logs`
```sql
id uuid primary key default gen_random_uuid(),
user_id uuid references users(id),
job_id uuid references jobs(id),
rows_processed int,
created_at timestamptz default now()
```

---

## App Pages & Routes

### Public pages
- `/` — Landing page (already designed, see design notes below)
- `/login` — Email magic link login
- `/signup` — Email signup → auto-login

### Authenticated pages
- `/dashboard` — Upload CSV, see credit balance, recent jobs
- `/account` — Plan info, billing portal link, usage history

### API routes
- `POST /api/process` — Main processing endpoint (auth required)
- `POST /api/webhooks/stripe` — Stripe webhook handler
- `GET /api/account` — Return user plan + credits
- `POST /api/create-portal-session` — Stripe billing portal

---

## Core Feature: CSV Processing

### Input CSV format (flexible)
The tool should accept any CSV and look for columns with these names (case-insensitive, partial match ok):
- `first_name` / `name` / `firstname`
- `company` / `company_name`
- `role` / `title` / `job_title`
- `linkedin` / `linkedin_url`
- `notes` / `context` / `custom` (optional extra context)

### Processing flow (`POST /api/process`)

1. Authenticate user, check credits
2. Parse uploaded CSV in memory (use `papaparse` or `csv-parse`)
3. Count rows — reject if row count exceeds user's remaining credits
4. For each row, call Claude API with a prompt (see below)
5. Add result as a new column: `coldcsv_opening_line`
6. Stream progress updates to frontend (Server-Sent Events or polling)
7. Return the full CSV as a downloadable file
8. Deduct credits, log job to DB
9. Discard all prospect data — never persist to DB

### Claude API Prompt (per row)

```
System: You are an expert cold email copywriter. Write a single personalized opening line for a cold email. It must:
- Be 1-2 sentences max
- Reference something specific about this person or their company
- Feel human and genuine, not like a template
- NOT start with "I" or "Hi" or "Hey"
- NOT use phrases like "I came across your profile" or "I noticed"
- End with a natural transition toward a pitch

Respond with ONLY the opening line. No explanation, no quotes, no preamble.

User: Write a personalized cold email opening line for this prospect:
Name: {first_name}
Company: {company}
Role: {role}
LinkedIn: {linkedin_url}
Additional context: {notes}
```

### Credit deduction rules
- Deduct 1 credit per row processed
- If the job fails mid-way, only deduct credits for rows successfully processed
- Free plan: 10 lifetime credits, never reset
- Pro plan: 500 credits, reset on billing cycle date
- Scale plan: 2,000 credits, reset on billing cycle date

---

## Auth Flow

1. User enters email on `/signup` or `/login`
2. Supabase sends magic link
3. On click, Supabase handles session — redirect to `/dashboard`
4. All `/dashboard` and `/account` routes require auth — redirect to `/login` if not authenticated
5. Store session in Supabase's built-in cookie-based session

---

## Stripe Integration

### Products to create in Stripe dashboard
- Product: "ColdCSV Pro" → Price: $29/mo recurring → `STRIPE_PRO_PRICE_ID`
- Product: "ColdCSV Scale" → Price: $79/mo recurring → `STRIPE_SCALE_PRICE_ID`

### Checkout flow
1. User clicks upgrade on `/account`
2. Call `/api/create-checkout-session` with plan
3. Redirect to Stripe Checkout
4. On success, Stripe webhook fires `checkout.session.completed`
5. Webhook updates `users` table: set plan, credits_limit, credits_reset_at, stripe IDs

### Webhook events to handle
- `checkout.session.completed` → activate subscription, set plan + limits
- `customer.subscription.deleted` → downgrade to free plan
- `invoice.payment_succeeded` → reset monthly credits

### Billing portal
- `/api/create-portal-session` creates a Stripe portal session
- User can cancel, update card, view invoices

---

## Dashboard UI

### Upload area
- Drag-and-drop CSV upload zone
- Show detected column mapping (which columns were found)
- Show row count and credits required
- Warn if credits insufficient
- "Process CSV" button → triggers `POST /api/process`

### Progress state
- Show processing spinner with row counter (e.g. "Processing row 24 of 100...")
- Use polling (`GET /api/jobs/:id`) every 2 seconds
- On completion: show download button for result CSV

### Credit display
- Top of dashboard: credit meter (e.g. "47 / 500 credits used")
- Show reset date for paid plans
- Upgrade CTA if on free plan

### Recent jobs table
- Job ID, date, rows processed, status, download link (if recent — within 24h)

---

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Anthropic
ANTHROPIC_API_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRO_PRICE_ID=
STRIPE_SCALE_PRICE_ID=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# App
NEXT_PUBLIC_APP_URL=https://coldcsv.com
```

---

## Design Notes

The landing page has already been designed with this aesthetic — match it throughout the app:

- **Font:** Instrument Serif (headings/display) + DM Sans (body/UI)
- **Background:** `#FAFAF8` (warm off-white)
- **Primary text:** `#1A1A18`
- **Brand accent (green):** `#2A6B4A`
- **Cards:** white `#FFFFFF` with `0.5px solid #E8E8E2` border, `16px` border radius
- **Buttons (primary):** `#1A1A18` bg, white text, pill shape (`border-radius: 100px`)
- **Buttons (CTA/accent):** `#2A6B4A` bg, white text
- **Muted text:** `#5A5A54` / `#9A9A94`
- **Light theme only** — no dark mode needed for MVP
- Clean, Apple-inspired, generous whitespace
- No gradients, no heavy shadows

---

## MVP Scope (What to Build First)

Must have for launch:
- [ ] Next.js project scaffold with Tailwind
- [ ] Supabase auth (magic link)
- [ ] Dashboard with CSV upload + processing
- [ ] Claude API integration for per-row personalization
- [ ] Credit system (check, deduct, display)
- [ ] Result CSV download
- [ ] Stripe subscriptions (Pro + Scale)
- [ ] Stripe webhooks (activate plan, reset credits, cancel)
- [ ] `/account` page with billing portal link
- [ ] Landing page connected to `/signup`

Not in MVP:
- Team seats (Scale plan feature — defer)
- API access (Scale plan feature — defer)
- Job history / re-download past jobs
- Tone customization
- Email notifications

---

## Project Structure

```
coldcsv/
├── app/
│   ├── (public)/
│   │   ├── page.tsx          # Landing page
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── (auth)/
│   │   ├── dashboard/page.tsx
│   │   └── account/page.tsx
│   └── api/
│       ├── process/route.ts
│       ├── jobs/[id]/route.ts
│       ├── account/route.ts
│       ├── create-checkout-session/route.ts
│       ├── create-portal-session/route.ts
│       └── webhooks/stripe/route.ts
├── components/
│   ├── UploadZone.tsx
│   ├── CreditMeter.tsx
│   ├── JobProgress.tsx
│   └── Nav.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   └── server.ts
│   ├── anthropic.ts          # Claude API wrapper
│   ├── stripe.ts             # Stripe client
│   └── csv.ts                # Parse + build CSV
└── middleware.ts              # Auth protection on /dashboard, /account
```

---

## First Prompt to Run in Claude Code

Paste this to get started:

```
I'm building ColdCSV (coldcsv.com) — a micro-SaaS where users upload a CSV of sales prospects and get back a CSV with AI-generated personalized cold email opening lines, one per row. 

Stack: Next.js 14 App Router, Supabase (auth + DB), Anthropic Claude API, Stripe subscriptions, Tailwind CSS, deployed on Railway.

Start by:
1. Scaffolding the full Next.js project with Tailwind
2. Setting up Supabase client (server + client)
3. Creating the database schema (users, jobs, usage_logs tables)
4. Setting up middleware to protect /dashboard and /account routes
5. Building the magic link auth pages (/login, /signup)

Use the project brief in BRIEF.md for all spec details. Do not deviate from the tech stack.
```

Save this document as `BRIEF.md` in the root of your project folder so Claude Code can reference it at any time.
