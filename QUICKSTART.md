# Quick Start Guide - Employee Reviews Dashboard

## Installation

1. **Navigate to the project directory:**
   ```bash
   cd ReviewsDashboard
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   ```
   http://localhost:3000
   ```

## Default Login Credentials

### Admin Access
- **Password**: `reviews2025`

### Employee Access (Test Data)
- **Email**: `john.doe@rocscience.com`
- **Email**: `alice.johnson@rocscience.com`

### Manager Access (Test Data)
- **Email**: `jane.smith@rocscience.com`

## Quick Test Workflow

### 1. Admin Setup
1. Login with admin password: `reviews2025`
2. View existing reviewees (John Doe, Alice Johnson)
3. Create a new review for an employee:
   - Select employee
   - Choose period (Mid-Year or End-Year)
   - Set year (2025)
   - Click "Create Review"

### 2. Employee Self-Assessment
1. Go to Home page
2. Click "Employee Login"
3. Enter email: `john.doe@rocscience.com`
4. Access the review (ID: `rev-2025-mid-001`)
5. Complete ratings for all categories:
   - Choose descriptive ratings (Unsatisfactory to Distinguished)
   - Add comments for each category
6. Set overall score (0-5, 0.25 increments)
7. Fill career development section
8. Click "Submit Review"

### 3. Manager Assessment
1. Go to Home page
2. Click "Manager Login"
3. Enter email: `jane.smith@rocscience.com`
4. View employee reviews
5. See employee's self-assessment (read-only)
6. Complete manager ratings for each category
7. Add manager comments
8. Set manager overall score
9. Provide career development guidance
10. Click "Complete Review"

### 4. Export PDF
1. Login as admin
2. View completed reviews
3. Click "View" on any review
4. Click "Export PDF" button
5. Or use "Export All Reviews" for batch export

## File Structure

```
ReviewsDashboard/
├── app/                      # Next.js app directory
│   ├── page.tsx             # Home/login page
│   ├── admin/               # Admin dashboard
│   ├── review/[id]/         # Review pages
│   │   ├── employee/        # Employee self-assessment
│   │   ├── manager/         # Manager assessment
│   │   └── view/            # View-only (admin)
│   └── api/                 # API routes
├── components/              # Reusable UI components
├── lib/                     # Core libraries
│   ├── types.ts            # TypeScript types
│   ├── auth.ts             # Authentication
│   ├── storage.ts          # Data storage
│   ├── obfuscate.ts        # Data obfuscation
│   └── pdf/                # PDF generation
├── data/                    # JSON data files (dev)
└── public/                  # Static assets
```

## Key Features to Test

✅ **Admin Dashboard**
- Add/delete reviewees
- Create reviews
- Mark reviews as completed
- View all reviews

✅ **Employee Review**
- Descriptive category ratings
- Numeric overall score
- Comments per category
- Career development section
- Submit for manager review

✅ **Manager Review**
- View employee submissions
- Add manager ratings
- Provide feedback
- Complete review

✅ **PDF Export**
- Single review PDF
- Batch export as ZIP
- Professional formatting
- Rating definitions included

## Common Issues

### Port Already in Use
```bash
# Kill process on port 3000
npx kill-port 3000
# Or use a different port
npm run dev -- -p 3001
```

### Dependencies Not Installing
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Build Errors
```bash
# Check TypeScript errors
npx tsc --noEmit

# Check linting
npm run lint
```

## Next Steps

1. **Customize Admin Password**:
   ```bash
   node scripts/encode-password.js "your-secure-password"
   ```
   Then update `lib/auth.ts` with the generated hash.

2. **Add Your Reviewees**:
   Edit `data/reviewees.json` with your employee data.

3. **Create Reviews**:
   Use the admin dashboard to create reviews for the current period.

4. **Deploy to Vercel**:
   See `VERCEL_DEPLOYMENT.md` for complete deployment guide.

## Support

For detailed documentation:
- **README.md** - Full application documentation
- **VERCEL_DEPLOYMENT.md** - Vercel deployment guide

For issues, check the browser console (F12) and terminal logs.

---

**Happy Reviewing! 🎉**

