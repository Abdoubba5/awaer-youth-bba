# 🚀 Deployment Guide — منصة وعي الشباب BBA

## Prerequisites

- **Supabase Account** (free tier works): [supabase.com](https://supabase.com)
- **Static Hosting** (any of these):
  - [Vercel](https://vercel.com) (free) — recommended for simplicity
  - [Netlify](https://netlify.com) (free)
  - [GitHub Pages](https://pages.github.com) (free)
  - [Cloudflare Pages](https://pages.cloudflare.com) (free)
  - Traditional hosting (Apache, Nginx, IIS)

---

## 1. 🔧 Supabase Setup

### Create the project
1. Go to [supabase.com](https://supabase.com) → **New Project**
2. Name: `bba-awareness-platform` (or your choice)
3. Database password: **Save this securely**
4. Region: Choose the closest to Algeria (e.g., `eu-west-1` - Ireland, or `eu-central-1` - Frankfurt)
5. Wait for the database to provision (~2 minutes)

### Run the schema
1. Go to **SQL Editor** → **New Query**
2. Open [`supabase-schema.sql`](./supabase-schema.sql)
3. Copy the entire contents and paste into the editor
4. Click **Run** (or `Ctrl+Enter`)
5. ✅ All 21 tables created

### Apply RLS policies
1. Open a **New Query** in the SQL Editor
2. Open [`supabase-rls-migration.sql`](./supabase-rls-migration.sql)
3. Copy and paste, then **Run**
4. ✅ Row-Level Security enabled with role-based access

### Get API credentials
1. Go to **Settings** → **API**
2. Copy the **Project URL** (e.g., `https://xyz.supabase.co`)
3. Copy the **anon / public key** (long base64 string)
4. These go into your environment configuration (see step 2)

### Create auth users
1. Go to **Authentication** → **Users** → **Add User**
2. Create at least these accounts:

| Email | Password | Role |
|-------|----------|------|
| `admin@bba.dz` | (choose strong password) | `super_admin` |
| `psychologist@bba.dz` | (choose strong password) | `psychologist` |
| `volunteer@bba.dz` | (choose strong password) | `volunteer` |

3. For each user, get their UUID from the users table
4. Run in SQL Editor to assign roles:
```sql
SELECT set_user_role('USER_UUID', 'super_admin');
SELECT set_user_role('USER_UUID', 'psychologist');
SELECT set_user_role('USER_UUID', 'volunteer');
```

---

## 2. ⚙️ Environment Configuration

### Option A: Static deployment (recommended for simple hosting)

Create a `config-override.js` file (not committed to git) or use `window.__BBA_CONFIG__`:

```html
<script>
window.__BBA_CONFIG__ = {
  SUPABASE_URL: 'https://your-project.supabase.co',
  SUPABASE_ANON_KEY: 'your-anon-key',
  PUBLIC_URL: 'https://your-domain.com',
  APP_BASE_PATH: ''
};
</script>
```

Add this **before** loading `js/config.js` in every HTML page.

### Option B: Server-side templating (advanced)

If using a server (Node.js, PHP, etc.), inject the config values into `js/config.js`
from environment variables at build/deploy time.

---

## 3. 🚀 Deploy to Hosting

### Option A: Vercel (simplest, recommended)

1. Install Vercel CLI: `npm i -g vercel`
2. In the project root, run:
```bash
vercel --prod
```
3. Follow the prompts — Vercel auto-detects static files
4. Set environment variables in Vercel Dashboard:
   - Go to **Project Settings** → **Environment Variables**
   - Add: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `PUBLIC_URL`

### Option B: Netlify

1. Install Netlify CLI: `npm i -g netlify-cli`
2. Deploy directly:
```bash
netlify deploy --prod --dir=.
```
3. Or connect your Git repo to Netlify for automatic deploys
4. Set environment variables in Netlify Dashboard:
   - **Site Settings** → **Environment Variables**
   - Add: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `PUBLIC_URL`

### Option C: GitHub Pages

```bash
# Push to a gh-pages branch or use the repo's Pages settings
git checkout -b gh-pages
git push origin gh-pages

# Or use GitHub Actions (see .github/workflows/deploy.yml)
```

### Option D: Traditional Hosting (Apache/Nginx)

1. Upload all files to your web root (e.g., `/var/www/html/`)
2. For Apache, ensure `.htaccess` is enabled with:
```
RewriteEngine On
RewriteBase /
RewriteRule ^verify-certificate\.html$ verify-certificate.html [L]
```
3. For Nginx, add to your server block:
```nginx
location / {
    try_files $uri $uri/ =404;
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;
}
```

---

## 4. ✅ Post-Deployment Checklist

### Core Verification
- [ ] **Homepage loads**: `https://your-domain.com/index.html`
- [ ] **All pages accessible**: about.html, achievements.html, target-audience.html, verify-certificate.html
- [ ] **Admin dashboard**: Login works at `admin.html`
- [ ] **Psychologist dashboard**: Login works at `psychologist.html`
- [ ] **Portal**: Login works at `portal.html`
- [ ] **Supabase sync**: Data syncs between localStorage and Supabase

### Security Verification
- [ ] **Supabase RLS active**: Anonymous users cannot read/write protected tables
- [ ] **Auth working**: Role-based access to dashboards (admin, psychologist, volunteer)
- [ ] **No exposed secrets**: Supabase anon key is the only secret — RLS protects data
- [ ] **HTTPS enabled**: All traffic is encrypted
- [ ] **CORS configured**: Supabase allows requests from your domain
  - Go to Supabase → **Settings** → **API** → **CORS**
  - Add your domain (e.g., `https://your-domain.com`)

### PWA Verification
- [ ] **HTTPS enabled** (PWA requires HTTPS, except localhost)
- [ ] **Manifest valid**: Chrome DevTools → Application → Manifest
- [ ] **Service Worker registered**: Chrome DevTools → Application → Service Workers
- [ ] **Offline page works**: Disconnect network, navigate to any page
- [ ] **Install prompt**: `beforeinstallprompt` event fires
- [ ] **App icon**: Displays correctly on home screen
- [ ] **Splash screen**: Shows correct background color and icon

### Performance Check
- [ ] **Page load time** < 3 seconds (use Chrome DevTools → Lighthouse)
- [ ] **Images optimized**: Replace Unsplash URLs with optimized local images
- [ ] **CDN resources cached**: Google Fonts, Font Awesome, Chart.js load from CDN
- [ ] **JS minified**: Consider minifying JS files for production

### Content Check
- [ ] **CMS content loads**: Articles, testimonials, FAQ appear correctly
- [ ] **RTL rendering**: Arabic text displays properly
- [ ] **Theme switching**: Dark/Light/Auto modes work
- [ ] **Charts render**: Chart.js visualizations load without errors
- [ ] **QR codes generate**: Certificate verification QR codes work

---

## 5. 🔐 Security Hardening (Production Only)

### Supabase
- [ ] **RLS policies enforced** (already done via `supabase-rls-migration.sql`)
- [ ] **Service role key** NOT exposed (never use in client-side code)
- [ ] **Rate limiting** enabled on Supabase Auth (Dashboard → Authentication → Settings)
- [ ] **Email confirmations** disabled if testing, but **enable for production**

### App
- [ ] Change default login credentials in admin.js:
  - Legacy fallback `admin@bba.dz / bba2026` → **Remove or change immediately**
- [ ] Rate limiting on login (already implemented: 5 attempts → 15-min lockout)
- [ ] XSS protection (already implemented via `escapeHtml()`)
- [ ] CSP headers recommended:
```
Content-Security-Policy: default-src 'self';
  script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: https://images.unsplash.com https://api.qrserver.com;
  connect-src 'self' https://*.supabase.co;
```

---

## 6. 📊 Monitoring & Maintenance

### Monitoring
- **Supabase Dashboard**: Database size, Auth users, API requests
- **Vercel/Netlify Dashboard**: Bandwidth, errors, deployment status
- **Chrome DevTools**: Lighthouse audit monthly

### Backup Strategy
1. **Supabase**: Enable Point-in-Time Recovery (paid plan) or weekly SQL dump:
```bash
pg_dump --dbname=postgresql://postgres:password@db.xyz.supabase.co:5432/postgres > backup_$(date +%Y%m%d).sql
```

2. **CMS Data**: Admin dashboard → الإعدادات → النسخ الاحتياطي exports JSON

### Update Checklist
- [ ] Test changes in staging/dev copy first
- [ ] Backup database before schema changes
- [ ] Update `version` in relevant files
- [ ] Clear browser cache / increment SW version
- [ ] Test all auth flows after deployment
- [ ] Monitor Supabase API usage for rate limits

---

## 7. 🐛 Troubleshooting

### PWA/Service Worker Issues
| Problem | Solution |
|---------|----------|
| SW not registering | Check HTTPS, check path in manifest.json |
| Offline page not showing | Verify `OFFLINE_URL` path in service-worker.js |
| Manifest icon not showing | Use HTTPS for icon URLs or use inline data URIs |
| "Site cannot be installed" | Ensure manifest has `display: standalone`, valid icons, HTTPS |
| SW not updating | Increment `CACHE_NAME` version in service-worker.js |

### Supabase Connection Issues
| Problem | Solution |
|---------|----------|
| CORS error | Add your domain to Supabase → Settings → API → CORS |
| RLS blocking writes | Check `user_roles` table has your user's role |
| Auth session lost | Check `autoRefreshToken: true` in database.js |
| `anon_all` policy conflict | Run the RLS migration again to replace old policies |

### General Issues
| Problem | Solution |
|---------|----------|
| Blank page on load | Check browser console for JS errors |
| Arabic not displaying | Ensure Cairo font loaded from Google Fonts |
| Charts not rendering | Check Chart.js CDN URL is accessible |
| localStorage full | Clear localStorage or increase storage quota |

---

## 8. 📁 File Reference

| File | Purpose |
|------|---------|
| `supabase-schema.sql` | Complete database schema (21 tables + indexes + RLS + helper functions) |
| `supabase-rls-migration.sql` | RLS policies overlay (replaces anon_all with role-based policies) |
| `js/config.js` | Production configuration module (reads env vars) |
| `.env.example` | Environment variable documentation |
| `js/database.js` | Supabase client initialization + localStorage sync |
| `js/platform-core.js` | Theme, animations, SW registration, security |
| `js/admin.js` | Admin dashboard logic |
| `js/cms.js` | Content management system |
| `js/auth-guard.js` | Auth guard for dashboards |
| `js/app.js` | Frontend app scripts (articles, forms, charts) |
| `service-worker.js` | PWA service worker (caching, offline) |
| `manifest.json` | PWA manifest |

---

## 9. 🏃 Quick Start (5-Minute Deploy)

```bash
# 1. Set up Supabase (web UI: create project, run schema + RLS SQL files)
# 2. Deploy to Vercel:
npx vercel --prod

# 3. Set environment variables in Vercel Dashboard:
#    - SUPABASE_URL
#    - SUPABASE_ANON_KEY
#    - PUBLIC_URL

# 4. Configure CORS in Supabase Dashboard:
#    Settings → API → CORS → Add your Vercel domain

# 5. Test:
#    - Open deployed URL
#    - Login with admin credentials
#    - Verify data syncs to Supabase
```

---

> **🔒 Production Note**: Before going live, ensure you:
> 1. Remove/safeguard the legacy hardcoded credentials (`admin@bba.dz / bba2026` in `admin.js`)
> 2. Enable Supabase Auth email confirmation
> 3. Run the RLS migration to protect your data
> 4. Set up proper monitoring and backups
