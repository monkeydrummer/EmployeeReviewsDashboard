# Deploying Reviews Dashboard to Vercel (2025)

This guide explains how to deploy the Employee Reviews Dashboard to Vercel with full admin editing capabilities using **Upstash Redis**.

## Problem

Vercel's filesystem is **read-only** in production, so the default JSON file storage won't work for editing data. This has been fixed by integrating **Upstash Redis** (via Vercel Marketplace) for production data storage.

## Solution Overview

- **Development**: Uses JSON files in the `/data` folder
- **Production (Vercel)**: Uses Upstash Redis storage for read/write capabilities
- **Automatic**: The app detects the environment and uses the appropriate storage method

---

## Deployment Steps

### Step 1: Push Your Code to GitHub

```bash
cd ReviewsDashboard
git init
git add .
git commit -m "Initial commit: Employee Reviews Dashboard"
git branch -M main
git remote add origin https://github.com/yourusername/reviews-dashboard.git
git push -u origin main
```

### Step 2: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New Project"**
3. Import your GitHub repository
4. Click **"Deploy"** (don't worry about storage yet)
5. Wait for the initial deployment to complete

### Step 3: Add Upstash Redis from Vercel Marketplace

> **Note**: As of 2025, Vercel uses marketplace integrations for storage. Upstash Redis provides a free tier perfect for review dashboards.

1. In your Vercel project dashboard, navigate to the **"Storage"** tab
2. Click **"Create Database"** or **"Connect Store"**
3. Select **"Upstash Redis"** from the available options
4. Follow the prompts to:
   - Create an Upstash account (if you don't have one)
   - Name your database (e.g., `reviews-dashboard`)
   - Choose the **Free** plan
5. Click **"Create"** or **"Connect"**

**Important**: Vercel will automatically add the required environment variables to your project:
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

You don't need to copy these manually!

### Step 4: Redeploy Your Application

After connecting Upstash Redis:

1. Go to the **"Deployments"** tab
2. Click on the **three dots (⋯)** next to your latest deployment
3. Select **"Redeploy"**
4. **Uncheck** "Use existing Build Cache"
5. Click **"Redeploy"**

This ensures your app picks up the new environment variables.

### Step 5: Seed Your Redis Database

After the redeployment completes, you need to copy your JSON data to Redis storage.

#### Option A: Using Browser Console (Easiest)

1. Open your deployed site: `https://your-app.vercel.app`
2. Press **F12** to open Developer Tools
3. Go to the **Console** tab
4. Paste and run this command:

```javascript
fetch('/api/seed-kv', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ password: 'reviews2025' })
})
.then(r => r.json())
.then(data => {
  console.log(data);
  if (data.success) {
    alert('✓ Database seeded successfully! Admin editing now works.');
  } else {
    alert('Error: ' + (data.error || 'Unknown error'));
  }
});
```

Replace `'reviews2025'` with your actual admin password if you've customized it.

#### Option B: Using cURL

```bash
curl -X POST https://your-app.vercel.app/api/seed-kv \
  -H "Content-Type: application/json" \
  -d '{"password":"reviews2025"}'
```

You should see:
```json
{
  "success": true,
  "message": "Successfully seeded Redis storage from JSON files"
}
```

### Step 6: Verify It Works! 🎉

1. Go to your deployed site: `https://your-app.vercel.app`
2. Click **"Admin Login"**
3. Enter your admin password
4. Try adding a new reviewee or creating a review
5. Refresh the page - your changes should persist!

---

## Optional: Set Custom Admin Password

If you haven't already, set a secure admin password:

1. In your Vercel project dashboard, go to **"Settings" → "Environment Variables"**
2. Add a new variable:
   - **Name**: `NEXT_PUBLIC_ADMIN_PASSWORD`
   - **Value**: Your secure password (e.g., `MySecurePassword123!`)
   - **Environment**: All (Production, Preview, and Development)
3. Click **"Save"**
4. **Redeploy** your application for changes to take effect

---

## How It Works

### Storage Architecture

The app uses an intelligent storage abstraction (`lib/storage.ts`):

**Development (Local)**
```
JSON Files (/data/*.json) ←→ Storage Layer ←→ Admin Interface
```

**Production (Vercel)**
```
Upstash Redis ←→ Storage Layer ←→ Admin Interface
```

The storage layer automatically:
- ✅ Detects environment (dev vs production)
- ✅ Uses JSON files locally
- ✅ Uses Redis in production
- ✅ Falls back gracefully if Redis isn't configured

### Data Flow

1. **Reading Data**: 
   - Production: Fetches from Redis
   - Development: Reads JSON files

2. **Saving Data**:
   - Production: Writes to Redis
   - Development: Writes to JSON files

3. **Ratings**: 
   - Automatically encoded/decoded for privacy
   - Stored efficiently in both systems

---

## Cost Breakdown (Upstash Free Tier)

### What You Get FREE:
- ✅ **256 MB storage** (your dashboard uses ~100-500 KB)
- ✅ **500,000 commands/month** (typical usage: 5,000-20,000)
- ✅ **Global low latency**
- ✅ **No credit card required**

### Usage Estimates:
| Action | Commands | Typical Usage |
|--------|----------|---------------|
| Load review | 5-10 | 100/day = 3,000/month |
| Save review edits | 10-20 | 30/day = 900/month |
| View admin dashboard | 10-15 | 50/day = 1,500/month |
| **Total** | | **~5,500/month** |

**Result**: You'll use about 1% of the free tier! 🎉

### If You Exceed Free Tier:
- **Pay-as-you-go**: $0.20 per 100,000 commands
- Extremely unlikely for a reviews dashboard
- Would require 100s of concurrent users

---

## Environment Variables Reference

### Automatically Set (by Vercel/Upstash):
- `UPSTASH_REDIS_REST_URL` - Redis REST API URL
- `UPSTASH_REDIS_REST_TOKEN` - Authentication token

### You Set (Optional):
- `NEXT_PUBLIC_ADMIN_PASSWORD` - Custom admin password (defaults to `reviews2025`)

---

## Adding New Data After Deployment

### Adding Reviewees or Reviews

1. **Option A: Use the Admin Dashboard** (Recommended)
   - Login to admin dashboard
   - Use the UI to add reviewees and create reviews
   - Changes are saved directly to Redis

2. **Option B: Update JSON and Re-seed**
   - Update `data/reviewees.json` and `data/reviews-2025.json` locally
   - Commit and push to GitHub
   - Vercel auto-deploys
   - **Re-seed the database** using the seed command from Step 5

---

## Troubleshooting

### ❌ "Failed to save data" in production

**Cause**: Redis not configured or not seeded

**Solution**:
1. Verify Upstash Redis is connected (Settings → Integrations)
2. Check environment variables exist:
   - Settings → Environment Variables
   - Look for `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`
3. Re-seed the database using Step 5 above

### ❌ "Review not found" after deployment

**Cause**: Database not seeded with initial data

**Solution**: Run the seed command from Step 5

### ❌ Environment variables not found

**Cause**: Integration not properly connected

**Solution**:
1. Go to Settings → Integrations
2. Verify Upstash Redis is listed and connected
3. If not, reconnect it from the Storage tab
4. Redeploy the application

### ❌ Changes don't persist after saving

**Checklist**:
1. ✅ Upstash Redis connected?
2. ✅ Environment variables present?
3. ✅ Redeployed after adding Redis?
4. ✅ Database seeded with initial data?
5. ✅ Check browser console for errors
6. ✅ Check Vercel deployment logs for server errors

### 🔍 Verify Redis is Working

Run this in your browser console on the deployed site:

```javascript
fetch('/api/reviewees')
  .then(r => r.json())
  .then(data => {
    if (data.reviewees) {
      console.log('✓ Redis is working! Data loaded:', data);
    } else {
      console.error('✗ Error loading data:', data);
    }
  });
```

---

## PDF Export Feature

The PDF export functionality works seamlessly in both development and production:

### Single Review Export
- Admin dashboard → Click "View" on any review
- Or use API: `GET /api/review/{id}/pdf`

### Batch Export (All Reviews)
- Admin dashboard → "Export All Reviews" button
- Filter by period, year, status
- Downloads ZIP file with all matching PDFs

**Note**: PDF generation uses server-side rendering and works in Vercel without additional configuration.

---

## Advanced: Managing Data Entirely Through Admin UI

Once your data is in Redis, you can:

1. **Option A**: Keep JSON files as backup
   - Good for version control
   - Easy to replicate to new instances
   - Re-seed when needed

2. **Option B**: Remove JSON files
   - Manage everything through admin UI
   - Data persists in Redis only
   - More dynamic workflow

---

## Comparison: 2024 vs 2025

### Old Way (Deprecated):
- ❌ Vercel KV (deprecated June 2025)
- ❌ Required manual `@vercel/kv` setup
- ❌ Less flexible

### New Way (Current):
- ✅ Upstash Redis via Vercel Marketplace
- ✅ Automatic provisioning and billing
- ✅ Better free tier
- ✅ More reliable and supported
- ✅ Direct access to Upstash console

---

## Additional Resources

- 📘 [Upstash Redis Documentation](https://docs.upstash.com/redis)
- 📘 [Vercel Storage Documentation](https://vercel.com/docs/storage)
- 📘 [Vercel Marketplace](https://vercel.com/marketplace)
- 🎥 [Upstash + Vercel Integration Guide](https://upstash.com/docs/redis/tutorials/vercel_integration)

---

## Summary Checklist

- [ ] Code pushed to GitHub
- [ ] Deployed to Vercel
- [ ] Upstash Redis connected (Storage tab)
- [ ] Environment variables automatically added
- [ ] Application redeployed
- [ ] Database seeded with initial data
- [ ] Admin password set (optional)
- [ ] Admin editing tested and working
- [ ] PDF export tested

**Once complete**: Your employee reviews dashboard is fully functional with persistent data editing in production! 🚀

---

## Need Help?

1. **Check Vercel deployment logs** for server-side errors
2. **Check browser console** for client-side errors
3. **Verify environment variables** in Vercel dashboard
4. **Check Upstash console** for connection issues
5. **Re-run the seed script** if data seems missing
6. **Check this document** for troubleshooting steps

Still stuck? Check the [Vercel Community Forums](https://github.com/vercel/community) or [Upstash Discord](https://upstash.com/discord).

