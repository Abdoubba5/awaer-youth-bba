# 🕌 منصة وعي الشباب BBA
## Youth Awareness Platform — Bordj Bou Arreridj

**Under the Supervision of:** Dz Young Leaders Program  
**Led by:** Sidiali Abdelilah  
**Version:** 2.0.0 | **Last Updated:** June 2026

---

## Executive Summary

منصة وعي الشباب BBA (BBA Youth Awareness Platform) is a comprehensive digital platform designed to combat drug and psychoactive substance abuse among youth in Bordj Bou Arreridj Province, Algeria. The platform integrates public awareness, anonymous psychological counseling, volunteer management, and certificate verification into a single Progressive Web Application (PWA).

Built with a static frontend architecture (vanilla HTML/CSS/JavaScript), the platform leverages Supabase for backend-as-a-service (database, authentication, row-level security) while maintaining full offline functionality through localStorage synchronization. It serves four distinct user roles — Super Admin, Admin, Psychologist, and Volunteer — each with tailored dashboards and permission levels.

The platform features a complete Content Management System (CMS), QR-based certificate verification, municipality-based team management, points/gamification system, PDF certificate generation, and PWA capabilities including offline access and installability.

---

## Project Vision

To be the leading digital awareness platform in Bordj Bou Arreridj Province for drug prevention and mental health promotion, building a conscious and sustainable generation capable of facing challenges and making correct decisions to protect themselves and their community.

---

## Project Mission

To empower the youth of Bordj Bou Arreridj Province with the knowledge and awareness necessary to prevent drug and psychoactive substance abuse, through an integrated digital platform combining awareness, psychological counseling, and volunteer work, supervised by qualified personnel within the Dz Young Leaders Program.

---

## Problem Statement

Drug and psychoactive substance abuse is among the most dangerous challenges facing contemporary societies, especially amid increasing psychological and social pressures on youth. In Bordj Bou Arreridj Province:

- **70%+** of substance abuse cases begin before age 25
- Psychoactive pills and hallucinogens top the list of abused substances
- Urban areas record higher abuse rates than rural areas
- Recidivism rates exceed **50%** in the absence of rehabilitation programs
- There is a severe shortage of digital resources for awareness, anonymous counseling, and volunteer coordination in the region

The platform addresses these challenges through an accessible, anonymous, and comprehensive digital solution.

---

## Project Objectives

1. **Raise awareness** about the dangers of drugs and psychoactive substances among youth
2. **Promote mental health** through free, anonymous psychological counseling
3. **Provide a secure digital platform** for requesting and tracking consultations
4. **Build a volunteer team** of youth for awareness campaigns and field activities
5. **Create a digital knowledge base** with awareness articles and educational resources
6. **Establish partnerships** with educational institutions, youth centers, and local associations
7. **Develop metrics and indicators** to measure program impact on the target audience
8. **Implement a prisoner rehabilitation program** for young inmates involved in drug-related cases

---

## Target Audience

The platform serves four primary audience segments in Bordj Bou Arreridj Province:

| Segment | Age Range | Key Challenges | Approach |
|---------|-----------|----------------|----------|
| **School Students** (Middle & Secondary) | 13–18 | Peer pressure, curiosity, lack of awareness | Early awareness, refusal skills, self-confidence |
| **University Students** | 18–25 | Academic stress, future anxiety, distance from family | Mental health promotion, healthy alternatives |
| **Neighborhood Youth** | 15–35 | Unemployment, idle time, weak family oversight | Alternative activities, community engagement |
| **Young Prisoners & Ex-prisoners** | All ages | Social stigma, reintegration difficulty, lack of support | Comprehensive rehab, psychological support, vocational training |

---

## User Roles

### Super Admin
- **Access:** Full access to all dashboards and features
- **Capabilities:** All admin functions + role management + system configuration
- **Dashboard:** Supabase Auth + admin.html
- **Credentials:** Configured via Supabase Auth (default email: admin@bba.dz)

### Admin
- **Access:** Complete administrative control
- **Capabilities:**
  - Volunteer management (approve, reject, suspend, edit, delete)
  - Consultation management (view, respond, close)
  - Task management (create, assign priorities, set deadlines)
  - Activity management (log volunteer activities with points)
  - Certificate management (issue with unique IDs, PDF download, QR verification)
  - Event management (create, manage registrations, mark attendance)
  - Team management (create municipality teams, assign leaders)
  - Notification management (send to all or specific volunteers)
  - Achievement management (award badges to volunteers)
  - CMS management (articles, testimonials, FAQ, partners, gallery, videos, library, surveys, rehabilitation)
  - Report generation (weekly, monthly, yearly PDF)
  - Data export (CSV volunteer export)
  - Statistics and charts (municipality distribution, consultation status)
- **Dashboard:** admin.html

### Psychologist
- **Access:** Consultation management only
- **Capabilities:**
  - View all consultations (with anonymity preserved)
  - Filter by status (new, in progress, answered, closed)
  - Search by tracking code, alias, or subject
  - Respond to consultations with professional replies
  - Update consultation status
  - Close consultations when resolved
- **Dashboard:** psychologist.html

### Volunteer
- **Access:** Personal volunteer portal
- **Capabilities:**
  - View personal profile and volunteer ID
  - Track points, completed tasks, and activities
  - View and complete assigned tasks (toggle checkbox)
  - Register for upcoming events
  - View issued certificates and download as PDF
  - View achievements and badges
  - Receive notifications from administration
  - Track participation statistics (attendance rate, certificates count)
- **Dashboard:** portal.html (login via Volunteer ID + phone)

### Public Visitor
- **Access:** Public-facing pages only
- **Capabilities:**
  - Browse awareness articles
  - Submit anonymous consultation (receives tracking code)
  - Track consultation status via tracking code
  - Register as a volunteer
  - View public statistics and charts
  - Verify certificates via QR code or certificate number
  - Browse events, testimonials, FAQ, partners
  - Contact the team via email, WhatsApp, or phone

---

## Platform Features

### Authentication & Authorization

- **Primary:** Supabase Auth with email/password login
- **Secondary:** Legacy localStorage-based auth (development fallback)
- **Multi-factor:** Role-based access control (RBAC) via `user_roles` table
- **Session Management:** 30-minute inactivity auto-logout
- **Rate Limiting:** 5 failed login attempts → 15-minute lockout (legacy fallback)
- **Auth Guard Module:** `auth-guard.js` provides reusable `protectDashboard()` function

### Role-Based Access Control

| Role | Admin Panel | Psych Portal | Volunteer Portal | CMS | Reports |
|------|-------------|--------------|------------------|-----|---------|
| super_admin | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| admin | ✅ Full | ✅ View only | ✅ View only | ✅ Full | ✅ Full |
| psychologist | ❌ | ✅ Manage consultations | ❌ | ❌ | ❌ |
| volunteer | ❌ | ❌ | ✅ Own data | ❌ | ❌ |

Supabase RLS enforces the same roles server-side via `user_roles` table and helper functions (`has_role()`, `has_any_role()`).

### Volunteer Management

- Public registration form with validation (name, email, phone, municipality, membership type, motivation)
- 34 municipalities of Bordj Bou Arreridj supported in dropdown
- Two membership types: "عضو فعال في الإدارة" (Active Admin Member) and "عضو في التنظيم" (Organization Member)
- Admin dashboard table with search, filter by status & membership type
- Approval workflow: pending → approved/rejected with auto-generated Volunteer ID (VOL-BBA-2026-XXXX)
- Suspension toggle without data loss
- Edit volunteer details with admin notes
- Points management (add/remove with reason, full history log)
- Detailed view with participation history, points total, admin notes
- Delete with confirmation dialog

### Psychologist Portal

- Dedicated dashboard (`psychologist.html`) with statistics cards
- Full consultation list with search & status filtering
- Reply to consultations with professional responses
- Status workflow: pending → in_progress → answered → closed
- Anonymous client identity preserved throughout
- Supabase Auth + legacy fallback auth
- Integration with admin consultation management

### Admin Dashboard

- Overview widgets with real-time statistics
- Pending actions summary (pending volunteers, unanswered consultations, suspended accounts)
- Quick action buttons for common tasks
- Recent consultations and recent volunteers lists
- Full navigation sidebar with 20+ sections
- Responsive design with mobile hamburger menu

### Activities Management

- Admin creates activities with title, description, points, date, and assigned volunteer
- Activity log displayed with filters by volunteer
- Each activity automatically logs to volunteer's portal
- Delete activity with confirmation
- Points automatically credited to volunteer's points history
- Activity filter by volunteer for quick reference

### Consultations Management

- Anonymous submission with alias, age group, subject, and message
- Unique tracking code generation (`BBA-XXXX-XXXX` format) using `crypto.getRandomValues()`
- Full CRUD in admin panel: view, respond (with status update), delete
- Psychologist response workflow with extra notes
- Consultation timeline: submitted → under review → answered → closed
- Public tracking interface on homepage with timeline display
- Search by tracking code, alias, or subject
- Status filter (new, in progress, answered, closed)

### Notifications System

- Admin sends notifications with title, message, type (info, alert, new task, achievement)
- Target specific volunteers or all approved volunteers
- Urgent flag with red highlight
- Notifications appear in volunteer portal
- Unread count indicator with mark-as-read on click
- Sent notifications history in admin panel

### CMS Management

Comprehensive content management with 14 content types:

| Section | Key | Data Type | Default Items |
|---------|-----|-----------|---------------|
| Hero Settings | `bba_cms_hero` | Object | Badge, title, subtitle, button texts/links |
| Notice Bar | `bba_cms_notice_bar` | Object | Message, priority (info/alert/urgent), visibility, expiry |
| Articles | `bba_cms_articles` | Array | 6 awareness articles with HTML content |
| Testimonials | `bba_cms_testimonials` | Array | 3 default testimonials |
| FAQ | `bba_cms_faq` | Array | 4 default Q&A pairs |
| Partners | `bba_cms_partners` | Array | 2 default partners |
| Gallery | `bba_cms_gallery` | Array | Photo albums with multiple images |
| Videos | `bba_cms_videos` | Array | YouTube video library with categories |
| Library | `bba_cms_library` | Array | Digital documents with download tracking |
| Surveys | `bba_cms_surveys` | Array | Community surveys with response collection |
| Calendar | `bba_cms_calendar` | Array | Administrative calendar view |
| Achievements Page | `bba_cms_achievements_page` | Object | Year description configuration |
| Rehabilitation | `bba_cms_rehabilitation` | Array | Prisoner rehab program reports |
| Announcements | `bba_notifications_data` | Array | Announcements displayed site-wide |

### Certificate Management

- Unique certificate number generation (`CERT-BBA-2026-XXXX` with auto-increment)
- Premium landscape A4 certificate design with:
  - Gold decorative borders and corner ornaments
  - Organization logo and name
  - Volunteer name in elegant styling
  - Certificate description text
  - QR code for instant verification
  - Official seal/stamp design
  - Signature block (Sidiali Abdelilah, Program Leader)
  - Certificate metadata footer
- PDF generation using `html2canvas` + `jsPDF` libraries
- Certificate preview modal with zoom
- Reissue with updated date
- Delete with confirmation
- Auto-populates issue date

### QR Certificate Verification

- Client-side QR code generation using `qrcodejs` library
- Gold-themed QR codes (`#D4AF37` dark, `#0b101b` light)
- QR codes encode direct verification URL (`verify-certificate.html?id=CERT-...`)
- Verification page (`verify-certificate.html`) with:
  - Input field for certificate number
  - Real-time validation with loading skeleton
  - Valid result: animated checkmark, volunteer name, certificate details, QR display
  - Invalid result: clear error message with guidance
- Auto-verify from URL parameter (`?id=CERT-...`)
- Fallback to external QR API (`api.qrserver.com`) when qrcodejs unavailable

### Reports & Analytics

- **Weekly/Monthly/Yearly PDF Reports:** Generated with html2canvas + jsPDF
- Report content includes:
  - Total volunteers and approved count
  - Consultation statistics and case status
  - Activity count and awarded points
  - Certificate issuance count
  - Event execution status
  - Most active municipalities
  - Municipality teams and members
- CSV export of volunteer data with Arabic UTF-8 BOM encoding
- Chart.js integration for:
  - Municipality volunteer distribution (bar chart with gradient)
  - Consultation status breakdown (doughnut chart)
  - Real-time statistics on achievements page

### PWA Features

- **Service Worker:** Custom caching strategy with 3-tier cache:
  - `STATIC_CACHE`: Core assets (CSS, JS, manifest)
  - `DYNAMIC_CACHE`: HTML pages and images
  - `bba-platform-v2`: Named version cache
- **Offline Support:** Custom offline page (`offline.html`) with retry and home buttons
- **Manifest:** Full PWA manifest with:
  - SVG inline icons (192x192, 512x512) — maskable
  - RTL and Arabic language support
  - `standalone` display with `window-controls-overlay`
  - 3 shortcuts: Consultations, Awareness, Volunteer Portal
- **Install Prompt:** Standard `beforeinstallprompt` event supported
- **Update Notification:** Service Worker update detection with reload prompt
- **Dynamic Base Path:** SW derives paths from its own URL location

---

## Database Architecture

### Entity Relationship Overview

The database consists of **21 tables** organized into functional groups:

**Core Data Tables (10):**
- `volunteers` — Volunteer registrations and profiles
- `consultations` — Anonymous consultation requests + psychologist replies
- `certificates` — Volunteer certificates of appreciation
- `events` — Public events with registration tracking
- `tasks` — Admin-assigned tasks for volunteers
- `teams` — Municipality-based volunteer teams
- `achievements` — Badges and awards for volunteers
- `activity_log` — Volunteer activity tracking with points
- `points` — Per-volunteer points history
- `notifications` — Admin-sent notifications

**CMS Content Tables (10):**
- `cms_content` — Generic key-value store (hero, notice_bar, etc.)
- `cms_articles` — Awareness articles with HTML content
- `cms_testimonials` — Volunteer/beneficiary testimonials
- `cms_faq` — Frequently asked questions
- `cms_partners` — Partner organizations
- `cms_gallery` — Photo albums
- `cms_videos` — Educational video library
- `cms_library` — Digital document downloads
- `cms_surveys` — Community surveys
- `cms_rehabilitation` — Prisoner rehabilitation reports

**Auth Table (1):**
- `user_roles` — Links `auth.users` to application roles

### Complete Table Schema

```sql
-- 1. VOLUNTEERS
volunteers (
  id UUID PK DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  municipality TEXT NOT NULL,
  membership_type TEXT DEFAULT 'member',
  motivation TEXT DEFAULT '',
  status TEXT DEFAULT 'pending',      -- pending | approved | rejected
  suspended BOOLEAN DEFAULT false,
  volunteer_id TEXT UNIQUE,            -- VOL-BBA-2026-XXXX
  admin_notes TEXT DEFAULT '',
  participation_history JSONB DEFAULT '[]',
  date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)
-- Indexes: volunteer_id, status, municipality, email

-- 2. CONSULTATIONS
consultations (
  id UUID PK,
  tracking_code TEXT UNIQUE NOT NULL,  -- BBA-XXXX-XXXX
  alias TEXT NOT NULL,                  -- Anonymous alias
  age_group TEXT NOT NULL,              -- 13-17 | 18-25 | 26-35 | 36+
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'pending',        -- pending | in_progress | answered | closed
  specialist_response TEXT DEFAULT '',
  extra_notes TEXT DEFAULT '',
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)
-- Indexes: tracking_code, status, date

-- 3. CERTIFICATES
certificates (
  id UUID PK,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  volunteer_id TEXT NOT NULL,
  volunteer_name TEXT DEFAULT '',
  certificate_number TEXT UNIQUE NOT NULL,  -- CERT-BBA-2026-XXXX
  issue_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)
-- Indexes: volunteer_id, certificate_number

-- 4. EVENTS
events (
  id UUID PK,
  type TEXT NOT NULL,           -- حملة توعوية | دورة تدريبية | لقاء | etc.
  type_icon TEXT DEFAULT '📅',
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  date DATE NOT NULL,
  location TEXT DEFAULT '',
  municipality TEXT DEFAULT '',
  seats INTEGER DEFAULT 0,
  target_audience TEXT DEFAULT '',
  status TEXT DEFAULT 'open',    -- open | completed | cancelled
  registrations JSONB DEFAULT '[]',  -- [{ volunteerId, volunteerName, attended, registeredAt }]
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)
-- Indexes: status, date, municipality

-- 5. TASKS
tasks (
  id UUID PK,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  assigned_to TEXT DEFAULT 'all',  -- volunteer ID or 'all'
  priority TEXT DEFAULT 'medium',   -- low | medium | high | urgent
  deadline TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)
-- Indexes: assigned_to, priority

-- 6. TEAMS
teams (
  id UUID PK,
  name TEXT NOT NULL,
  municipality TEXT NOT NULL,
  leader_id TEXT DEFAULT '',
  members JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)
-- Indexes: municipality

-- 7. ACHIEVEMENTS
achievements (
  id UUID PK,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  icon TEXT DEFAULT '🏆',
  assigned_to TEXT NOT NULL,
  date_awarded TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
)
-- Indexes: assigned_to

-- 8. ACTIVITY_LOG
activity_log (
  id UUID PK,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  points INTEGER DEFAULT 0,
  date DATE,
  volunteer_id TEXT NOT NULL,
  volunteer_name TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
)
-- Indexes: volunteer_id, date

-- 9. POINTS
points (
  id UUID PK,
  volunteer_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  type TEXT DEFAULT 'add',      -- add | remove
  date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
)
-- Indexes: volunteer_id, type

-- 10. NOTIFICATIONS
notifications (
  id UUID PK,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',      -- info | alert | new_task | achievement
  target_volunteer TEXT DEFAULT 'all',
  is_urgent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
)
-- Indexes: target_volunteer, type

-- 11-20. CMS TABLES (cms_content, cms_articles, cms_testimonials, cms_faq,
--        cms_partners, cms_gallery, cms_videos, cms_library, cms_surveys,
--        cms_rehabilitation)
-- Each has id UUID PK, published BOOLEAN, and content-specific fields

-- 21. USER ROLES (Auth Integration)
user_roles (
  id UUID PK,
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('super_admin','admin','psychologist','volunteer')),
  volunteer_id TEXT DEFAULT NULL,
  display_name TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)
-- Indexes: user_id, role
```

### Relationships

```
auth.users ──1:1──> user_roles ──> role (super_admin, admin, psychologist, volunteer)
volunteers ──1:N──> activity_log (via volunteer_id)
volunteers ──1:N──> certificates (via volunteer_id)
volunteers ──1:N──> points (via volunteer_id)
volunteers ──N:N──> events (via registrations JSONB)
volunteers ──N:N──> teams (via members JSONB)
volunteers ──1:N──> achievements (via assigned_to)
volunteers/volunteerId ──1:N──> tasks (via assigned_to)
```

### Indexes

**33 indexes** across all tables for optimized queries:
- Primary indexes on all `id` UUID columns
- Unique indexes on `volunteer_id`, `certificate_number`, `tracking_code`, `content_key`
- Foreign-key-like indexes on `volunteer_id` in certificates, activity_log, points
- Status and date indexes for filtering/sorting performance
- Role and category indexes for CMS filtering

### Security Policies (RLS)

**Strategy:** Role-based access with 4 tiers, enforced via `supabase-rls-migration.sql`

| Access Level | Tables | Operations | Implementation |
|-------------|--------|------------|----------------|
| **Public (Anonymous)** | volunteers, consultations | INSERT only | `TO anon WITH CHECK (true)` |
| **Public (Anonymous)** | certificates, cms_content | SELECT | `TO anon USING (true)` |
| **Public (Anonymous)** | cms_articles, testimonials, faq, partners, gallery, videos, library, surveys, rehab | SELECT published only | `TO anon USING (published = true)` |
| **Public (Anonymous)** | events | SELECT where status = 'open' | `TO anon USING (status = 'open')` |
| **super_admin** | All 21 tables | ALL (CREATE, READ, UPDATE, DELETE) | `TO authenticated USING (has_role('super_admin'))` |
| **admin** | All 21 tables | ALL | `TO authenticated USING (has_role('admin'))` |
| **psychologist** | consultations | SELECT, UPDATE | `TO authenticated USING (has_role('psychologist'))` |
| **volunteer** | volunteers | SELECT own, UPDATE own profile | `TO authenticated WHERE user_roles.volunteer_id = volunteers.volunteer_id` |

**6 helper functions created:**
- `get_user_role(uid)` — Returns role string for a given user ID
- `set_user_role(...)` — Creates/updates user role assignment
- `has_role(required_role)` — Checks if current user has a specific role
- `has_any_role(required_roles[])` — Checks if current user has any of the specified roles
- `rls_policy_summary` — View to inspect all active RLS policies

### Supabase Integration

- **Client:** `@supabase/supabase-js` v2 (UMD CDN build)
- **Initialization:** In `database.js` with `createClient(url, anonKey, { auth: { autoRefreshToken, persistSession, detectSessionInUrl } })`
- **Sync Mechanism:** localStorage `setItem` monkey-patch for automatic bi-directional sync
- **Sync Interval:** Every 30 seconds via `platform-core.js`
- **Sync Queue:** Debounced with 2-second cooldown per key
- **Batch Operations:** Items inserted in batches of 50
- **Points Sync:** Collection from all `bba_points_*` keys into unified `points` table
- **Auth:** Session restore via `supabaseClient.auth.getSession()`, role fetch from `user_roles`

---

## Technical Architecture

### Frontend Structure

```
C:\Users\abdelilah\code-server\
├── index.html               # Public homepage (hero, articles, forms, charts)
├── about.html                # Project about page
├── target-audience.html      # Target audience information
├── achievements.html         # Annual achievements & statistics
├── admin.html                # Admin dashboard (lock screen + full panel)
├── portal.html               # Volunteer portal
├── psychologist.html         # Psychologist dashboard
├── verify-certificate.html   # Certificate verification
├── offline.html              # PWA offline fallback page
├── manifest.json             # PWA manifest
├── service-worker.js         # PWA service worker
│
├── css/
│   └── styles.css            # Complete design system (700+ lines)
│
├── js/
│   ├── config.js             # Production configuration module
│   ├── database.js           # Supabase client + localStorage + Auth
│   ├── platform-core.js      # Theme engine, animations, security, PWA
│   ├── app.js                # Frontend app (articles, forms, charts, contact)
│   ├── admin.js              # Admin dashboard (30+ management functions)
│   ├── cms.js                # Content management system (14 CMS types)
│   ├── auth-guard.js         # Auth guard for dashboards
│   ├── qr-utils.js           # QR code generation utilities
│   └── test-data.js          # Test data seeding (seedAll, seedFlowDemo)
│
├── supabase-schema.sql       # Complete database schema (21 tables)
├── supabase-rls-migration.sql # RLS security policies migration
├── .env.example              # Environment variable documentation
├── DEPLOYMENT.md             # Deployment guide
└── PROJECT_MASTER_DOCUMENTATION.md  # This document
```

### JavaScript Modules

| Module | File | Purpose | Dependencies | Key Exports |
|--------|------|---------|-------------|-------------|
| **Config** | `config.js` | Environment configuration, runtime overrides | None | `BBA.Config` |
| **Database** | `database.js` | Supabase client, localStorage sync, auth, RBAC | `config.js`, Supabase CDN | `BBA.DB`, `BBA.Auth` |
| **Platform Core** | `platform-core.js` | Theme engine, animations, anti-spam, security, PWA | None | `BBA.Theme`, `BBA.Animations`, `BBA.AntiSpam`, `BBA.Security` |
| **App** | `app.js` | Public-facing features: articles, forms, toasts, navigation | `database.js`, `platform-core.js`, Chart.js | `showToast()`, `openArticleModal()`, `generateTrackingCode()` |
| **Admin** | `admin.js` | Full admin dashboard with all management modules | `database.js`, `platform-core.js`, Chart.js, html2canvas, jsPDF | — (self-executing) |
| **CMS** | `cms.js` | Content Management System with 14 content types | `admin.js` | `window.CMS` |
| **Auth Guard** | `auth-guard.js` | Reusable dashboard protection | `database.js` | `BBA.AuthGuard` |
| **QR Utils** | `qr-utils.js` | Client-side QR code generation | qrcodejs CDN | `BBA.QR` |
| **Test Data** | `test-data.js` | Seed data for testing flows | `database.js` | `seedAll()`, `seedFlowDemo()` |

### Module Load Order

```
1. Supabase CDN (supabase-js v2 UMD)
2. Chart.js CDN (for admin/achievements pages)
3. config.js
4. database.js (initializes BBA.DB, BBA.Auth)
5. platform-core.js (theme, animations, anti-spam, PWA registration)
6. app.js / admin.js / cms.js / qr-utils.js (page-specific)
7. auth-guard.js (dashboard protection)
8. test-data.js (optional, for testing)
```

### Supabase Services

| Service | Usage | Configuration |
|---------|-------|---------------|
| **Database** | PostgreSQL with 21 tables, 33 indexes | `supabase-schema.sql` |
| **Auth** | Email/password authentication, session management | `database.js` → Supabase Auth client |
| **Row-Level Security** | Role-based access on all tables | `supabase-rls-migration.sql` |
| **Realtime** | Not used (polling-based sync via localStorage patch) | — |
| **Storage** | Not used (inline SVG icons, external images) | — |

### Authentication Flow

```
1. User visits protected page (admin.html, portal.html, psychologist.html)
2. Auth Guard / inline auth script initializes
3. Checks Supabase session: supabaseClient.auth.getSession()
4. If session exists → fetches role from user_roles table → shows dashboard
5. If no session → shows login form
6. On login submit:
   a. Try Supabase Auth: signInWithPassword(email, password)
   b. If successful → fetch role from user_roles table
   c. Verify role matches required role for dashboard
   d. If wrong role → logout and redirect
   e. If Supabase offline → fallback to legacy localStorage auth
7. Inactivity timer: 30 minutes → auto-logout with notification
8. Logout: clear all session storage → redirect to login
```

### Data Flow

```
USER ACTION (form submit, button click)
    │
    ▼
app.js / admin.js / portal.js (business logic)
    │
    ├── localStorage.setItem() (original write)
    │       │
    │       ▼
    │   Monkey-patched setItem() (database.js)
    │       │
    │       ├── BBA_SYNC_KEYS check
    │       │       │
    │       │       ▼
    │       │   queueSync(localKey) → debounced (1s)
    │       │       │
    │       │       ▼
    │       │   processSyncQueue() → pushTable() / pushCmsContent() / pushPoints()
    │       │       │
    │       │       ▼
    │       │   Supabase REST INSERT/UPDATE
    │       │
    │       └── (auto-sync timer: every 30 seconds)
    │
    ▼
UI updates (read from localStorage)
    │
    ▼
    ADMIN DASHBOARD / VOLUNTEER PORTAL
```

### API Structure

The platform does not use a custom API server. All data operations are:

1. **Local:** `localStorage.getItem()` / `localStorage.setItem()` for immediate reads/writes
2. **Remote:** Direct Supabase REST API calls via `@supabase/supabase-js` client
3. **Sync:** Automatic bi-directional sync between localStorage and Supabase

**Supabase Table Endpoints (via JS client):**
- `supabaseClient.from('volunteers').select('*')`
- `supabaseClient.from('consultations').insert({...})`
- `supabaseClient.from('certificates').update({...}).eq('id', id)`
- `supabaseClient.from('events').delete().neq('id', '00000000-...')`

**External CDN Dependencies:**
- `cdn.jsdelivr.net/npm/@supabase/supabase-js@2` — Supabase client
- `cdn.jsdelivr.net/npm/chart.js@4.4.1` — Charts
- `cdn.jsdelivr.net/npm/qrcodejs@1.0.0` — QR code generation
- `cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1` — PDF screenshots
- `cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1` — PDF generation
- `cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1` — Icons
- `fonts.googleapis.com/css2?family=Cairo` — Arabic font

---

## Security Architecture

### Authentication Protection

| Layer | Implementation | Status |
|-------|---------------|--------|
| **Primary Auth** | Supabase Auth (email/password) with session management | ✅ Complete |
| **Fallback Auth** | Legacy localStorage credentials (`admin@bba.dz / bba2026`) | ✅ Complete |
| **Password Security** | Rate limited (5 attempts → 15-min lockout) | ✅ Complete |
| **Session Persistence** | Supabase `autoRefreshToken: true`, `persistSession: true` | ✅ Complete |
| **Inactivity Logout** | 30-minute timer on admin dashboard | ✅ Complete |

### Dashboard Protection

| Dashboard | Protection Mechanism | Required Role |
|-----------|---------------------|---------------|
| **Admin** (`admin.html`) | Supabase Auth → role check → legacy fallback → rate-limited login | super_admin, admin |
| **Psychologist** (`psychologist.html`) | Supabase Auth → role check → legacy fallback | psychologist, super_admin |
| **Volunteer Portal** (`portal.html`) | Supabase Auth → role check → ID + phone login | volunteer |

### Hidden Page Protection

- Admin dashboard links are conditionally rendered based on auth status
- Quick links and footer links for admin/psychologist only appear when logged in
- Volunteer portal link appears only when authenticated
- All dashboards use server-side RLS for data protection (when Supabase is connected)

### Role Permissions (Client-Side)

```
super_admin:
  ├── admin.html (full access)
  ├── psychologist.html (full access)
  └── portal.html (full access)

admin:
  ├── admin.html (full access)
  ├── psychologist.html (view only)
  └── portal.html (view only)

psychologist:
  ├── admin.html (no access)
  ├── psychologist.html (consultations only)
  └── portal.html (no access)

volunteer:
  ├── admin.html (no access)
  ├── psychologist.html (no access)
  └── portal.html (own data only)
```

### Session Management

- **Storage:** `sessionStorage` for auth tokens (cleared on tab close)
- **Supabase Session:** Automatically restored via `getSession()` with token refresh
- **Legacy Session:** `bba_admin_auth`, `bba_psych_auth`, `bba_portal_session` — single session flags
- **Role Cache:** `bba_auth_role`, `bba_auth_role_data` — cached from `user_roles` table
- **Inactivity:** 30-minute idle timer triggers auto-logout with toast notification
- **Activity Listeners:** click, keydown, scroll, mousemove reset inactivity timer

### Validation Rules

| Field | Validation Rule | Error Message |
|-------|----------------|---------------|
| Full Name | Min 3 characters | الاسم الكامل يجب أن يكون 3 أحرف على الأقل |
| Email | Regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` | يرجى إدخال بريد إلكتروني صحيح |
| Phone | Algerian format: `05|06|07` + 8 digits | يرجى إدخال رقم هاتف جزائري صحيح |
| Consultation Subject | Min 3 characters | عنوان الاستشارة قصير جداً |
| Consultation Message | Min 10 characters | الرسالة قصيرة جداً |
| All Required Fields | Check for empty values | يرجى ملء جميع الحقول المطلوبة |
| HTML Sanitization | Strip all `<tag>` patterns | Via `Security.secureField()` |
| XSS Prevention | `escapeHtml()` on all user text | Via `escapeHtml()` utility |
| Duplicate Submission | Text content dedup check (5-min window) | Via `AntiSpam.isDuplicate()` |
| Rate Limiting | 20 submissions/hour, 30s cooldown | Via `AntiSpam.canSubmit()` |

---

## User Flows

### Volunteer Journey

```
1. DISCOVERY
   ├── Lands on index.html → reads awareness articles
   ├── Browses events and statistics
   └── Decides to join

2. REGISTRATION
   ├── Scrolls to التطوع معنا section
   ├── Fills registration form (name, email, phone, municipality, membership type, motivation)
   ├── Submits form → data saved to localStorage → synced to Supabase
   └── Notification: "تم تسجيلك كمتطوع بنجاح! سنتواصل معك قريباً"

3. APPROVAL (Admin side)
   ├── Admin reviews volunteer in admin dashboard
   ├── Admin approves → generates Volunteer ID (VOL-BBA-2026-XXXX)
   ├── OR admin rejects with no ID assigned
   └── Volunteer status changes to 'approved'

4. PORTAL ACCESS
   ├── Visits portal.html
   ├── Logs in with Volunteer ID + Phone number
   ├── Views dashboard: profile, points, tasks, activities, certificates, events
   └── Can toggle task completion, register for events

5. PARTICIPATION
   ├── Admin creates activities with points
   ├── Volunteer sees activities in portal
   ├── Volunteer attends events (admin marks attendance → +10 points)
   ├── Volunteer completes tasks (toggle checkbox in portal)
   └── Points accumulate

6. RECOGNITION
   ├── Admin issues certificate with unique number
   ├── Volunteer views certificate in portal → can download PDF
   ├── Admin awards achievements/badges
   └── Certificate can be verified via QR code by anyone
```

### Psychologist Journey

```
1. ACCESS
   ├── Visits psychologist.html
   ├── Logs in via Supabase Auth (psychologist@bba.dz / password)
   └── OR legacy fallback (psychologist@bba.dz / bba2026)

2. DASHBOARD
   ├── Views statistics: total consultations, new, in progress, answered/closed
   ├── Search bar for finding specific consultations
   └── Status filter dropdown

3. CONSULTATION MANAGEMENT
   ├── Reviews consultation requests (anonymous, with alias, age group)
   ├── Reads subject and full message
   ├── Clicks "رد" (Respond) → opens response modal
   ├── Writes professional response
   ├── Updates status: in_progress → answered
   └── Can close completed cases

4. NOTIFICATIONS (via admin)
   ├── Admin can send notifications to specific psychologist
   └── No self-service notification system
```

### Administrator Journey

```
1. ACCESS
   ├── Visits admin.html
   ├── Logs in via Supabase Auth (admin@bba.dz / password)
   └── OR legacy fallback with rate limiting

2. DASHBOARD OVERVIEW
   ├── Statistics cards: volunteers, consultations, pending, approved
   ├── Recent consultations list
   ├── Pending actions summary
   ├── Recent volunteers
   ├── Upcoming events
   └── Quick action buttons

3. MANAGEMENT MODULES (20+ sections in sidebar)
   ├── المتطوعون — Approve/reject, edit, delete, suspend, manage points
   ├── الاستشارات — View, respond, update status, delete
   ├── الإحصائيات — Municipality distribution chart
   ├── التصدير — CSV export of volunteer data
   ├── المهام — Create, assign, priority, deadlines
   ├── النشاطات — Log activities with points
   ├── الإشعارات — Send notifications to volunteers
   ├── الإنجازات — Award badges and achievements
   ├── الشهادات — Issue certificates with PDF/QR
   ├── الفعاليات — Create events, manage registrations, mark attendance
   ├── فرق البلديات — Create municipality teams
   └── CMS — Manage all content (home page, articles, etc.)

4. CMS MANAGEMENT (14 sections)
   ├── الصفحة الرئيسية — Hero section, notice bar, testimonials
   ├── المقالات — Create/edit/publish articles
   ├── الأخبار — Announcements
   ├── الصور — Photo albums
   ├── الفيديوهات — Video library
   ├── الشركاء — Partner organizations
   ├── الأسئلة الشائعة — FAQ management
   ├── المكتبة الرقمية — Document downloads
   ├── الاستبيانات — Community surveys
   ├── التقويم — Calendar view
   └── إعادة التأهيل — Prisoner rehabilitation reports

5. REPORTING
   ├── Weekly/Monthly/Yearly PDF reports with all statistics
   ├── CSV export for volunteer data
   └── Chart.js visualizations

6. SETTINGS
   ├── Notifications settings
   ├── Admin profile
   ├── Theme switching
   ├── Data backup (JSON)
   ├── Reset statistics
   └── Language
```

### Certificate Verification Journey

```
1. QR SCAN OR MANUAL ENTRY
   ├── Option A: Scan QR code on printed certificate
   │     → URL encoded: verify-certificate.html?id=CERT-BBA-2026-XXXX
   │     → Auto-loads verification page with pre-filled certificate number
   │
   └── Option B: Manual entry
         → Visit verify-certificate.html
         → Type certificate number (CERT-BBA-2026-XXXX)
         → Click تحقق من الشهادة

2. VERIFICATION PROCESS
   ├── Loading skeleton displayed
   ├── System searches localStorage/Supabase for certificate
   └── Results:

   VALID:
   ├── Animated checkmark ✓
   ├── "شهادة صالحة ومعتمدة" (Valid and Certified)
   ├── Volunteer name displayed prominently in gold
   ├── Certificate title
   ├── Certificate number (monospace, gold)
   ├── Issue date
   ├── Issuing authority
   ├── Description
   ├── Status badge: صالحة ومعتمدة
   ├── QR code generated client-side
   └── Verification URL for sharing

   INVALID:
   ├── X icon
   ├── "شهادة غير صالحة" (Invalid Certificate)
   ├── Error message
   └── Guidance to contact administration
```

---

## UI/UX Design System

### Colors

| Token | Dark Theme | Light Theme | Usage |
|-------|-----------|-------------|-------|
| `--bg` | `#06090e` | `#f8f6f1` | Page background |
| `--surface` | `rgba(11,16,27,0.75)` | `rgba(255,255,255,0.9)` | Glass cards, nav, panels |
| `--surface-solid` | `#0b101b` | `#f0ede7` | Solid surface sections |
| `--gold` | `#D4AF37` | `#D4AF37` | Primary accent, links, values |
| `--gold-hover` | `#B3922E` | `#B3922E` | Hover state for gold elements |
| `--gold-light` | `rgba(212,175,55,0.12)` | `rgba(212,175,55,0.15)` | Subtle gold backgrounds |
| `--success` | `#10b981` | `#10b981` | Success states, approved badges |
| `--danger` | `#ef4444` | `#ef4444` | Error states, rejected badges |
| `--text` | `#ffffff` | `#1a1a2e` | Primary text |
| `--text-secondary` | `#e2e8f0` | `#2d2d44` | Secondary text |
| `--muted` | `#94a3b8` | `#6b7280` | Muted text, labels |
| `--border` | `rgba(212,175,55,0.15)` | `rgba(212,175,55,0.25)` | Card borders |
| `--border-light` | `rgba(255,255,255,0.06)` | `rgba(0,0,0,0.08)` | Subtle dividers |

### Typography

- **Font Family:** `'Cairo', sans-serif` (Arabic-optimized Google Font)
- **Scale:** Modular scale with `clamp()` for responsive sizing:
  - h1: `clamp(1.75rem, 4.5vw, 3rem)`
  - h2: `clamp(1.5rem, 3.5vw, 2.25rem)`
  - h3: `clamp(1.25rem, 2.5vw, 1.5rem)`
  - Body: `clamp(0.9rem, 1.2vw, 1rem)`
- **Direction:** RTL (`direction: rtl`)
- **Language:** Arabic (Algerian dialect, `ar_DZ` locale)

### Components

| Component | Description | Key Features |
|-----------|-------------|--------------|
| **Glass Navigation** | Fixed top nav with backdrop-filter blur | Sticky, blur(16px), gold border bottom |
| **Mobile Bottom Nav** | 5-tab bottom navigation on mobile | Fixed bottom, SVG icons, Arabic labels |
| **Parallax Hero** | Full-screen hero with mouse tracking | Floating gradient shapes, mouse-responsive transform, scroll depth |
| **Glass Cards** | Semi-transparent cards with blur | backdrop-filter, gold border, hover elevation |
| **Stat Cards** | Statistics with neon glow | Gold text-shadow, animated counters, hover pulse |
| **Interactive Stats** | Hero stats with detail popovers | Progress bars, breakdown details, click-to-toggle |
| **Badges** | Status indicators | 3 variants: pending (gold), approved (green), rejected (red) |
| **Toast Notifications** | Slide-in notifications | 3 types (success/error/info), auto-dismiss 4s |
| **Modal System** | Overlay modals with backdrop | Escape key close, overlay click close, fade animation |
| **Timeline** | Vertical progress timeline | Active/done states, animated dot indicators |
| **Vault Lock Screen** | Admin login screen | Centered card, lock icon, glass effect |
| **Admin Sidebar** | Fixed right sidebar with navigation | 25+ nav items, CMS section dividers |
| **Tables** | Admin data tables | Responsive scroll, hover rows, action buttons |
| **Forms** | Dark-themed form inputs | Gold focus glow, custom select arrows |
| **Membership Selector** | Interactive card-based radio | Selected state with gold border/shadow |
| **Tracking Code** | Glowing consultation code container | Pulsing gold animation, monospace font |
| **Skeleton Loading** | Content placeholders | Shimmer animation, card/stat variants |
| **Scrollbar** | Custom gold scrollbar | 6px width, gold thumb |

### Mobile Responsive Design

| Breakpoint | Changes |
|------------|---------|
| **> 1440px** | Container max-width 1320px, hero content 800px |
| **1024px** | Charts grid stacks to single column |
| **768px** | Desktop nav hidden, mobile bottom nav shown, sidebar slides off-screen, membership cards stack, hero adjusts height |
| **480px** | Hero actions stack vertically, stats grid single column, toast full-width |
| **320px** | Compact hero stats, smaller buttons/padding |
| **Touch devices** | All hover effects disabled (no sticky hover on mobile) |
| **Reduced motion** | All animations disabled via `prefers-reduced-motion` |

### Dark Mode

- Default theme (dark background, light text)
- Applied automatically unless overridden
- All surfaces use dark tones with gold accents
- High contrast text with muted secondary elements

### Light Mode

- Toggle via theme switcher button
- Light cream background (`#f8f6f1`)
- Dark text (`#1a1a2e`) for readability
- Same gold accent color maintained
- All glass surfaces adapt to light palette
- Custom scrollbar track adapts to light theme
- Form inputs and selects get light-specific styling
- Stat values lose text-shadow for light background readability

---

## Production Infrastructure

### Environment Variables

| Variable | Type | Required | Description | Default |
|----------|------|----------|-------------|---------|
| `SUPABASE_URL` | String | ✅ | Supabase project URL | `https://ouyqcyrbppkxvcknxtbn.supabase.co` |
| `SUPABASE_ANON_KEY` | String | ✅ | Supabase anon/public key | (hardcoded) |
| `APP_BASE_PATH` | String | ❌ | Base path if deployed in subdirectory | `""` |
| `PUBLIC_URL` | String | ❌ | Public deployment URL | `""` |
| `PWA_NAME` | String | ❌ | PWA display name | منصة وعي الشباب BBA |
| `PWA_SHORT_NAME` | String | ❌ | PWA short name | وعي BBA |
| `CONTACT_EMAIL` | String | ❌ | Contact email | `abdelilah.sidiali@univ-bba.dz` |
| `CONTACT_PHONE` | String | ❌ | Primary contact phone | `+213540735461` |
| `CONTACT_PHONE_ALT` | String | ❌ | Secondary contact phone | `+213665376480` |
| `CONTACT_WHATSAPP` | String | ❌ | WhatsApp number | `+213540735461` |
| `ENABLE_SERVICE_WORKER` | Boolean | ❌ | Enable PWA service worker | `true` |
| `ENABLE_SUPABASE_SYNC` | Boolean | ❌ | Enable Supabase auto-sync | `true` |
| `ENABLE_ANALYTICS` | Boolean | ❌ | Enable analytics | `false` |
| `ENABLE_OFFLINE_MODE` | Boolean | ❌ | Enable offline mode | `true` |

### Deployment Requirements

- **Hosting:** Static file hosting (no server-side runtime required)
- **HTTPS:** Required for PWA features (Service Worker, geolocation, etc.)
- **Domain:** Custom domain recommended (e.g., `bba-wa3y.dz`)
- **CDN:** All external dependencies loaded from CDN (no build step needed)
- **Supabase:** Active Supabase project with schema applied

### Supabase Configuration

- **Project URL:** Configured in `config.js` / environment variable
- **Anon Key:** Public by design (RLS enforces security server-side)
- **CORS:** Must be configured in Supabase Dashboard → Settings → API → CORS
- **Rate Limiting:** Configure in Supabase Dashboard → Authentication → Settings
- **Auth:** Email/password with optional email confirmation (recommended for production)
- **RLS:** Applied via `supabase-rls-migration.sql` — restrict production data access

### Vercel Deployment

```bash
# Quick deploy (recommended)
npx vercel --prod

# Set environment variables in Vercel Dashboard:
#   - SUPABASE_URL
#   - SUPABASE_ANON_KEY
#   - PUBLIC_URL

# Configure CORS in Supabase Dashboard:
#   Settings → API → CORS → Add Vercel domain
```

### Domain Configuration

- **CNAME Record:** Point domain to `cname.vercel-dns.com` (Vercel) or hosting provider
- **DNS Settings:** Recommended TTL: 3600 seconds
- **www Redirection:** Configure www to non-www (or vice versa)
- **Custom Domain:** Add to Vercel/Netlify project settings

### SSL Configuration

- **Vercel/Netlify:** Automatic SSL via Let's Encrypt (included)
- **Manual:** Upload SSL certificate or use Cloudflare for SSL termination
- **HSTS:** Recommended header: `Strict-Transport-Security: max-age=31536000; includeSubDomains`

---

## Current Implementation Status

### ✅ Completed

| Module | Status | Details |
|--------|--------|---------|
| Public Homepage | ✅ Complete | Hero, articles, forms, events, testimonials, FAQ, charts, contact |
| Volunteer Registration | ✅ Complete | Form with validation, auto-store, toast notifications |
| Consultation System | ✅ Complete | Anonymous submission, tracking codes, status workflow, timeline |
| Certificate System | ✅ Complete | Issue, preview, PDF download, QR generation, reissue |
| Certificate Verification | ✅ Complete | QR scan, manual entry, valid/invalid results, animated checkmark |
| Admin Dashboard | ✅ Complete | 20+ management sections, statistics, quick actions |
| Volunteer Portal | ✅ Complete | Profile, activities, tasks, certificates, events, notifications |
| Psychologist Dashboard | ✅ Complete | Consultation management, respond, filter, search |
| CMS Module | ✅ Complete | 14 content types with full CRUD, publish toggle |
| PWA Features | ✅ Complete | Service Worker, offline page, manifest, install prompt |
| Theme Engine | ✅ Complete | Dark/Light/Auto modes, smooth transitions, persisted preference |
| Auth System | ✅ Complete | Supabase Auth + legacy fallback, RBAC, session management |
| RLS Security | ✅ Complete | Role-based policies on 21 tables, helper functions |
| Database Schema | ✅ Complete | 21 tables, 33 indexes, triggers, functions |
| PDF Reports | ✅ Complete | Weekly/Monthly/Yearly reports with charts and data |
| CSV Export | ✅ Complete | Volunteer data export with UTF-8 BOM |
| Notification System | ✅ Complete | Send to all/specific volunteers, urgent flag |
| Task Management | ✅ Complete | CRUD, priorities, deadlines, assign to volunteer/all |
| Event Management | ✅ Complete | Create, register, mark attendance, award points |
| Team Management | ✅ Complete | Create municipality teams, assign leaders and members |
| Points/Gamification | ✅ Complete | Add/remove points, history log, per-volunteer tracking |
| Activity Logging | ✅ Complete | Log activities with points, filter by volunteer |
| Achievement/Badges | ✅ Complete | Award badges to volunteers with custom icons |
| Anti-Spam Protection | ✅ Complete | Rate limiting, duplicate detection, form cooldown |
| XSS Prevention | ✅ Complete | escapeHtml() throughout, input sanitization |
| Login Rate Limiting | ✅ Complete | 5 attempts → 15-min lockout on legacy login |
| Inactivity Auto-Logout | ✅ Complete | 30-minute timeout with notification |
| Seed Test Data | ✅ Complete | `seedAll()`, `seedFlowDemo()`, URL auto-trigger |
| Accessibility | ✅ Complete | RTL support, aria-labels, keyboard nav, focus-visible |
| Deployment Documentation | ✅ Complete | DEPLOYMENT.md with 5 hosting options |
| Environment Configuration | ✅ Complete | .env.example, config.js, runtime overrides |
| Responsive Design | ✅ Complete | 6 breakpoints, touch-friendly, reduced motion |

### ⏳ Partially Completed

| Module | Status | Details |
|--------|--------|---------|
| Supabase Production Sync | ⚠️ Partial | Sync mechanism works but needs production testing |
| Analytics | ⚠️ Partial | Feature flag defined but no analytics integration |
| Achievements Page | ⚠️ Partial | Static page with dynamic stats, needs more real-time charts |
| Email Notifications | ⚠️ Partial | Contact form configured but no automated email service |
| Rehabilitation Program | ⚠️ Partial | CMS module built, page for public display not yet developed |
| Gallery Display | ⚠️ Partial | CMS admin complete, public display section needs development |
| Video Display | ⚠️ Partial | CMS admin complete, public video section needs development |
| Library Display | ⚠️ Partial | CMS admin complete, public library page needs development |
| Survey Responses | ⚠️ Partial | Admin can create surveys, public submission form not yet built |

### ❌ Missing / Not Yet Implemented

| Feature | Priority | Notes |
|---------|----------|-------|
| Automated Email Service | Medium | Need SendGrid/Mailgun integration for notifications |
| SMS Notifications | Low | For WhatsApp/call reminders to volunteers |
| Multi-language Support (French/English) | Medium | Currently Arabic-only |
| Volunteer Mobile App | Low | Could use PWA + push notifications |
| Advanced Analytics Dashboard | Medium | More charts, trends, forecasting |
| Volunteer Scheduling System | Low | Calendar-based shift management |
| AI Chatbot for Mental Health First Response | Low | Future enhancement |
| Public Forum / Discussion Board | Low | Community interaction feature |
| Donation / Fundraising Module | Low | For platform sustainability |
| Integration with National Health Systems | High | Coordination with Algerian health authorities |
| Training Certificate Templates | Medium | More certificate design options |
| Volunteer Performance Reports | Medium | Individual volunteer analytics |
| Bulk Operations in Admin | Medium | Select multiple volunteers for batch actions |
| Audit Log | High | Track all admin actions for accountability |
| Data Export (PDF, Excel) for All Modules | Medium | Currently only CSV for volunteers |

---

## Remaining Tasks

### 🔴 Critical

| # | Task | Module | Priority |
|---|------|--------|----------|
| 1 | Remove/safeguard legacy hardcoded credentials (`admin@bba.dz / bba2026` in admin.js) | Security | 🔴 Critical |
| 2 | Enable Supabase Auth email confirmation for production | Auth | 🔴 Critical |
| 3 | Run `supabase-rls-migration.sql` on production database | Security | 🔴 Critical |
| 4 | Set up proper monitoring and alerts (Supabase Dashboard) | Infrastructure | 🔴 Critical |
| 5 | Add CSP headers on production hosting | Security | 🔴 Critical |

### 🟡 High Priority

| # | Task | Module | Priority |
|---|------|--------|----------|
| 1 | Wire feature flags in config.js to actual module behavior | Config | 🟡 High |
| 2 | Create public pages for gallery, videos, and library display | CMS | 🟡 High |
| 3 | Build public survey submission form | CMS | 🟡 High |
| 4 | Set up automated database backups (pg_dump script) | Infrastructure | 🟡 High |
| 5 | Test complete Supabase sync flow end-to-end | Database | 🟡 High |
| 6 | Add `robots.txt` and `sitemap.xml` for SEO | SEO | 🟡 High |
| 7 | Configure proper CORS settings in Supabase | Security | 🟡 High |
| 8 | Implement rate limiting on Supabase Auth | Security | 🟡 High |

### 🟢 Medium Priority

| # | Task | Module | Priority |
|---|------|--------|----------|
| 1 | Add volunteer performance reports in admin | Admin | 🟢 Medium |
| 2 | Implement multi-language support (French, English) | i18n | 🟢 Medium |
| 3 | Add bulk operations for volunteer management | Admin | 🟢 Medium |
| 4 | Create audit log for all admin actions | Security | 🟢 Medium |
| 5 | Optimize images (replace Unsplash URLs with optimized local copies) | Performance | 🟢 Medium |
| 6 | Minify JS/CSS files for production | Build | 🟢 Medium |
| 7 | Add automated email service (SendGrid/Resend) | Notifications | 🟢 Medium |
| 8 | Create more certificate design templates | Certificates | 🟢 Medium |
| 9 | Add data export for all modules (PDF, Excel) | Reports | 🟢 Medium |
| 10 | Implement volunteer scheduling/shift management | Portal | 🟢 Medium |

### 🔵 Low Priority

| # | Task | Module | Priority |
|---|------|--------|----------|
| 1 | AI chatbot for mental health first response | AI | 🔵 Low |
| 2 | Mobile app (PWA with push notifications) | PWA | 🔵 Low |
| 3 | Public discussion forum | Community | 🔵 Low |
| 4 | Donation/fundraising module | Finance | 🔵 Low |
| 5 | Integration with national health systems | Integration | 🔵 Low |
| 6 | Volunteer mobile check-in with QR | Portal | 🔵 Low |
| 7 | Social media sharing integration | Marketing | 🔵 Low |
| 8 | Dark mode scheduling (automatic based on time) | Theme | 🔵 Low |

---

## Future Roadmap

### Phase 1: Foundation & Core (Current ✅)
- [x] Core platform architecture (HTML/CSS/JS)
- [x] Supabase database schema (21 tables)
- [x] Public homepage with all sections
- [x] Volunteer registration system
- [x] Anonymous consultation system
- [x] Admin dashboard (20+ management modules)
- [x] CMS module (14 content types)
- [x] PWA capabilities (manifest, service worker)
- [x] Theme engine (Dark/Light/Auto)
- [x] Authentication & RBAC
- [x] RLS security policies
- [x] Certificate management with QR verification
- [x] PDF report generation
- [x] Deployment documentation

### Phase 2: Enhancement & Stability (In Progress)
- [ ] Gallery, videos, library public display pages
- [ ] Survey submission form for public
- [ ] Automated email notifications
- [ ] Production security hardening
- [ ] Performance optimization (minification, caching)
- [ ] SEO configuration (robots.txt, sitemap.xml)
- [ ] Analytics integration
- [ ] Audit logging system
- [ ] Bulk operations in admin
- [ ] Progressive Web App push notifications

### Phase 3: Expansion
- [ ] Multi-language support (French, English)
- [ ] Volunteer mobile app with QR check-in
- [ ] Advanced analytics dashboard with trends
- [ ] Volunteer performance reports
- [ ] Public forum / discussion board
- [ ] Automated backup system
- [ ] Training certificate design templates
- [ ] Integration with national health systems

### Phase 4: AI & Automation
- [ ] AI chatbot for mental health first response
- [ ] Automated volunteer matching for events
- [ ] Predictive analytics for at-risk youth identification
- [ ] Smart notification routing
- [ ] Automated report generation

### Phase 5: Scale & Sustainability
- [ ] Multi-region deployment (other Algerian provinces)
- [ ] Mobile native apps (iOS/Android)
- [ ] Fundraising/donation module
- [ ] Partnership API for third-party integration
- [ ] Government data reporting dashboard
- [ ] Volunteer marketplace for skills exchange

---

## Deployment Checklist

### Pre-Deployment
- [ ] All JS files pass syntax check (`node --check js/*.js`)
- [ ] Supabase schema applied (run `supabase-schema.sql`)
- [ ] RLS migration applied (run `supabase-rls-migration.sql`)
- [ ] Auth users created with proper roles
- [ ] CORS configured in Supabase Dashboard
- [ ] Environment variables documented
- [ ] Legacy credentials noted for replacement

### Deployment
- [ ] Push to hosting (Vercel/Netlify/Pages)
- [ ] Configure custom domain (DNS + SSL)
- [ ] Set environment variables in hosting dashboard
- [ ] Configure CORS with production domain

### Post-Deployment
- [ ] **Homepage loads**: `https://domain.com/index.html`
- [ ] **All pages accessible**: about, achievements, target-audience, verify-certificate
- [ ] **Admin dashboard**: Login works at `admin.html`
- [ ] **Psychologist dashboard**: Login works at `psychologist.html`
- [ ] **Portal**: Login works at `portal.html`
- [ ] **Supabase sync**: Data syncs between localStorage and Supabase
- [ ] **HTTPS enabled**: All traffic encrypted
- [ ] **PWA manifest valid**: DevTools → Application → Manifest
- [ ] **Service Worker registered**: DevTools → Application → Service Workers
- [ ] **Offline page works**: Disconnect network, reload
- [ ] **QR codes generate**: Certificate verification works
- [ ] **Page load time** < 3 seconds (Lighthouse)
- [ ] **No console errors**: Check all pages

---

## Security Checklist

- [ ] Supabase RLS enforced (no anon write access to sensitive tables)
- [ ] Default credentials (`admin@bba.dz / bba2026`) removed or changed
- [ ] Login rate limiting active (5 attempts → 15-min lockout)
- [ ] XSS protection via `escapeHtml()` on all user input
- [ ] Content Security Policy headers configured
- [ ] HTTPS enforced (HSTS header)
- [ ] CORS restricted to production domain
- [ ] Supabase service role key never exposed client-side
- [ ] Inactivity auto-logout configured (30 min)
- [ ] Input validation on all forms (client-side)
- [ ] Password minimum length enforced
- [ ] Audit logging for admin actions (TBD)
- [ ] Rate limiting on form submissions (30s cooldown, 20/hour)
- [ ] Duplicate submission prevention (5-min window)
- [ ] Session storage cleared on logout
- [ ] No sensitive data in localStorage (IDs only, not passwords)

---

## Testing Checklist

### Functional Testing
- [ ] Volunteer registration → approval → portal login → activities → certificate → QR verify
- [ ] Anonymous consultation → tracking → psychologist response → status update
- [ ] Admin: approve/reject/suspend volunteer
- [ ] Admin: create event → volunteer registers → mark attendance → points awarded
- [ ] Admin: issue certificate → preview → PDF download → QR scan verification
- [ ] Admin: create task → volunteer sees in portal → toggles completion
- [ ] Admin: send notification → volunteer sees unread badge
- [ ] CMS: create/edit/publish/unpublish article → reflected on homepage
- [ ] Psychologist: filter, search, respond, close consultation
- [ ] Theme switching: Dark → Light → Auto → persists on reload

### Integration Testing
- [ ] localStorage → Supabase sync (auto-sync after write)
- [ ] Supabase → localStorage pull (initial load from server)
- [ ] Supabase Auth login → role fetch from user_roles
- [ ] Legacy auth fallback when Supabase offline
- [ ] PWA: install prompt → offline access → SW update detection

### Performance Testing
- [ ] Page load time < 3 seconds (Lighthouse mobile)
- [ ] First Contentful Paint (FCP) < 1.5s
- [ ] Largest Contentful Paint (LCP) < 2.5s
- [ ] Cumulative Layout Shift (CLS) < 0.1
- [ ] Time to Interactive (TTI) < 3.5s
- [ ] Service Worker cache hit ratio > 80%

### Security Testing
- [ ] XSS attempt via form fields → sanitized output
- [ ] Unauthorized direct URL access to admin.html → redirected to login
- [ ] Role escalation attempt → blocked by RLS
- [ ] SQL injection via Supabase → blocked (parameterized queries)
- [ ] Brute force login → locked out after 5 attempts

---

## Maintenance Guide

### Daily
- [ ] Review new volunteer registrations (approve/reject)
- [ ] Check pending consultations (assign to psychologist)
- [ ] Monitor Supabase API usage dashboard

### Weekly
- [ ] Generate weekly report (admin → التقارير)
- [ ] Review volunteer activity and points
- [ ] Update CMS content (articles, announcements)
- [ ] Check service worker update status
- [ ] Review security log (`bba_security_log` in localStorage)

### Monthly
- [ ] Generate monthly report with full statistics
- [ ] Review and update FAQ section
- [ ] Clean up old notifications
- [ ] Check database size and performance
- [ ] Review and update partner information
- [ ] Test certificate verification system

### Quarterly
- [ ] Full security audit
- [ ] Review and update RLS policies
- [ ] Performance optimization (Lighthouse audit)
- [ ] Backup database (SQL dump)
- [ ] Update dependencies (verify CDN versions)
- [ ] Review user roles and access permissions

### Annually
- [ ] Update copyright year in footer
- [ ] Review and archive old data
- [ ] Full platform audit
- [ ] Update project documentation
- [ ] Review and update deployment configuration
- [ ] Plan next year's roadmap

---

## Backup & Recovery Strategy

### Supabase Database Backup
```bash
# Manual SQL dump (requires pg_dump + connection string)
pg_dump --dbname=postgresql://postgres:password@db.xyz.supabase.co:5432/postgres > bba_backup_$(date +%Y%m%d).sql

# Supabase Dashboard: Database → Backups (enabled on Pro plan)
# Point-in-Time Recovery available on Pro+ plans
```

### CMS Data Backup
```bash
# Admin dashboard → الإعدادات → النسخ الاحتياطي
# Exports all CMS content as JSON from localStorage
```

### localStorage Data Recovery
```javascript
// Export all BBA data from browser console
function exportAllData() {
  var data = {};
  for (var i = 0; i < localStorage.length; i++) {
    var key = localStorage.key(i);
    if (key && key.indexOf('bba_') === 0) {
      data[key] = localStorage.getItem(key);
    }
  }
  var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'BBA_Backup_' + new Date().toISOString().split('T')[0] + '.json';
  a.click();
  URL.revokeObjectURL(url);
}

// Import backup
function importAllData(jsonString) {
  var data = JSON.parse(jsonString);
  for (var key in data) {
    localStorage.setItem(key, data[key]);
  }
  location.reload();
}
```

### Recovery Plan

| Scenario | Recovery Steps | RTO | RPO |
|----------|---------------|-----|-----|
| **Data corruption** | Restore from latest SQL dump → re-sync to localStorage via `initialPull()` | 1 hour | Daily |
| **Accidental data deletion** | Restore from Supabase Point-in-Time Recovery | 30 min | 5 min |
| **CMS data loss** | Restore from admin backup export → import via console | 15 min | Variable |
| **Full system failure** | Re-deploy from git → re-run schema → restore database → configure CORS | 2 hours | Daily |
| **Security breach** | Revoke Supabase anon key → rotate credentials → restore clean DB → apply RLS | 4 hours | At breach time |

---

## File Reference

| File | Purpose | Size |
|------|---------|------|
| `index.html` | Public homepage | ~38KB |
| `admin.html` | Admin dashboard | ~42KB |
| `portal.html` | Volunteer portal | ~33KB |
| `psychologist.html` | Psychologist dashboard | ~18KB |
| `about.html` | Project about page | ~14KB |
| `achievements.html` | Annual achievements | ~12KB |
| `target-audience.html` | Target audience info | ~14KB |
| `verify-certificate.html` | Certificate verification | ~14KB |
| `offline.html` | PWA offline page | ~2KB |
| `css/styles.css` | Complete design system | ~28KB (700+ lines) |
| `js/config.js` | Configuration module | ~4KB |
| `js/database.js` | Supabase + localStorage + Auth | ~28KB |
| `js/platform-core.js` | Theme, animations, security, PWA | ~18KB |
| `js/app.js` | Frontend application | ~22KB |
| `js/admin.js` | Admin dashboard logic | ~124KB (largest file) |
| `js/cms.js` | Content management system | ~38KB |
| `js/auth-guard.js` | Auth guard utility | ~8KB |
| `js/qr-utils.js` | QR code generation | ~6KB |
| `js/test-data.js` | Test data seed scripts | ~18KB |
| `manifest.json` | PWA manifest | ~2KB |
| `service-worker.js` | PWA service worker | ~4KB |
| `supabase-schema.sql` | Database schema (21 tables) | ~18KB |
| `supabase-rls-migration.sql` | RLS security policies | ~10KB |
| `.env.example` | Environment variables | ~2KB |
| `DEPLOYMENT.md` | Deployment guide | ~14KB |
| `PROJECT_MASTER_DOCUMENTATION.md` | This document | ~TBD |

---

> **Prepared by:** Sidiali Abdelilah  
> **Program:** Dz Young Leaders  
> **Location:** Bordj Bou Arreridj, Algeria  
> **Contact:** abdelilah.sidiali@univ-bba.dz  
> **Website:** [BBA Youth Awareness Platform](https://bba-wa3y.dz) *(when deployed)*
>
> *"وعي الشباب اليوم هو استثمار في مستقبل الغد"*
> — Awareness today is an investment in tomorrow's future
