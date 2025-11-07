# Employee Reviews Dashboard

A comprehensive employee performance review management system built with Next.js 16, TypeScript, and Tailwind CSS. Designed for Rocscience to manage mid-year and end-year employee reviews.

## Features

### Core Functionality
- **Three Authentication Modes**: Admin (password), Employee (email), Manager (email)
- **Review Management**: Create, track, and complete employee reviews
- **Category-Based Assessment**: Six performance categories aligned with core values
- **Dual Assessment**: Both employee self-assessment and manager evaluation
- **Career Development**: Structured career planning section
- **PDF Export**: Generate professional PDF reports (individual or batch)
- **Data Obfuscation**: Ratings are obfuscated in source code for privacy

### Review Categories
1. **Quality of Work** → Core Value: Customer Focused
2. **Dependability and Responsibility** → Core Value: Accountability
3. **Attitude and Teamwork** → Core Value: Supportive
4. **Initiative** → Core Value: Innovation
5. **Technical Expertise** → Core Value: Excellence
6. **Communication** → Core Value: Supportive

### Rating System
- **Categories**: Descriptive ratings (Unsatisfactory, Needs Improvement, Delivers on Expectations, Exceeds Expectations, Distinguished)
- **Overall Score**: Numeric scale 0-5 with 0.25 increments

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **PDF Generation**: @react-pdf/renderer
- **Database**: 
  - Development: JSON files
  - Production: Upstash Redis (via Vercel)
- **Deployment**: Vercel

## Project Structure

```
ReviewsDashboard/
├── app/
│   ├── admin/                 # Admin dashboard
│   ├── review/[id]/
│   │   ├── employee/          # Employee self-assessment
│   │   └── manager/           # Manager assessment
│   ├── api/
│   │   ├── reviewees/         # Reviewee management API
│   │   ├── reviews/           # Reviews API
│   │   ├── review/[id]/       # Single review API
│   │   │   └── pdf/           # PDF export
│   │   └── seed-kv/           # Database seeding
│   ├── page.tsx               # Home/login page
│   └── layout.tsx             # Root layout
├── components/
│   ├── CategoryRatingSelect.tsx
│   ├── OverallScoreInput.tsx
│   ├── RatingDefinitions.tsx
│   └── ReviewStatusBadge.tsx
├── lib/
│   ├── types.ts               # TypeScript types
│   ├── auth.ts                # Authentication
│   ├── storage.ts             # Storage abstraction
│   ├── obfuscate.ts           # Rating obfuscation
│   ├── utils.ts               # Helper functions
│   └── pdf/
│       └── ReviewPDF.tsx      # PDF template
├── data/
│   ├── reviewees.json         # Employee data
│   └── reviews-2025.json      # Review data
└── scripts/
    └── encode-password.js     # Password encoding utility
```

## Getting Started

### Prerequisites
- Node.js 20+ 
- npm or yarn

### Installation

1. **Clone or navigate to the project**:
   ```bash
   cd ReviewsDashboard
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run development server**:
   ```bash
   npm run dev
   ```

4. **Open in browser**:
   ```
   http://localhost:3000
   ```

### Default Credentials

- **Admin Password**: `reviews2025`
- **Employee Login**: Use any employee email from `data/reviewees.json`
- **Manager Login**: Use any manager email from reviewee data

## Usage

### Admin Workflow
1. Login with admin password
2. Add/manage reviewees
3. Create reviews for employees
4. Monitor review status
5. Mark reviews as completed
6. Export PDFs (individual or batch)

### Employee Workflow
1. Login with your email address
2. Access your assigned review
3. Complete category ratings (descriptive)
4. Provide overall self-assessment score (numeric 0-5)
5. Fill career development responses
6. Submit review for manager assessment

### Manager Workflow
1. Login with your email address
2. Access direct report reviews
3. View employee self-assessments
4. Complete manager ratings and comments
5. Provide overall manager score
6. Complete career development guidance
7. Mark review as completed

## Configuration

### Change Admin Password

1. Generate encoded password:
   ```bash
   node scripts/encode-password.js "your-new-password"
   ```

2. Copy the output and update `lib/auth.ts`:
   ```typescript
   const OBFUSCATED_DEFAULT_PASSWORD = 'your-encoded-password';
   ```

Or set environment variable:
```bash
NEXT_PUBLIC_ADMIN_PASSWORD=your-password
```

### Add Reviewees

Edit `data/reviewees.json`:
```json
{
  "reviewees": [
    {
      "id": "emp-001",
      "name": "John Doe",
      "email": "john.doe@rocscience.com",
      "title": "Senior Software Engineer",
      "managers": ["manager@rocscience.com"]
    }
  ]
}
```

### Create Reviews

Use the admin dashboard or edit `data/reviews-2025.json` manually.

## Deployment

See [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) for detailed deployment instructions to Vercel.

## API Routes

### `/api/reviewees` (GET, POST)
- Get all reviewees
- Add/update/delete reviewees (admin only)

### `/api/reviews` (GET, POST)
- Get all reviews
- Create new reviews (admin only)
- Update review status (admin only)

### `/api/review/[id]` (GET, POST)
- Get specific review
- Update review (employee or manager)

### `/api/review/[id]/pdf` (GET)
- Generate PDF for single review

### `/api/reviews/export-all` (POST)
- Generate ZIP with multiple review PDFs
- Filter by period, year, status

### `/api/seed-kv` (POST)
- Seed Upstash Redis from JSON files (production)

## Rating Definitions

### 1 - UNSATISFACTORY
The employee is consistently underperforming and has provided inadequate value to the team and organization.

### 2 - NEEDS IMPROVEMENT
The employee demonstrates inconsistent performance and often requires more supervision and guidance than expected.

### 3 - DELIVERS ON EXPECTATIONS
The employee reliably meets, or at times exceeds, performance expectations in terms of quality, quantity, and timeliness.

### 4 - EXCEEDS EXPECTATIONS
The employee regularly performs above expectations and contributes significantly to the team and organization.

### 5 - DISTINGUISHED
The employee delivers exceptional results far beyond expectations and has made outstanding contributions to the team and organization.

## Security

- **Admin password**: Obfuscated using XOR + Base64
- **Ratings data**: Obfuscated in JSON files
- **Email-based auth**: Simple validation for employee/manager access
- **API protection**: Password verification for admin operations

## Development

### Build for Production
```bash
npm run build
```

### Run Production Build
```bash
npm start
```

### Lint
```bash
npm run lint
```

## License

Proprietary - Rocscience Internal Use Only

## Support

For issues or questions, contact your IT administrator.

