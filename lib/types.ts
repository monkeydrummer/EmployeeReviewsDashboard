// Category Rating Types
export type CategoryRating = "unsatisfactory" | "needs-improvement" | "delivers" | "exceeds" | "distinguished" | null;

export type ReviewPeriod = "mid-year" | "end-year";

export type ReviewStatus = "pending" | "employee-submitted" | "manager-submitted" | "completed";

// Manager
export interface Manager {
  id: string;
  name: string;
  email: string;
  title: string;
}

// Reviewee (Employee)
export interface Reviewee {
  id: string;
  name: string;
  email: string;
  title: string;
  managerIds: string[];  // manager IDs (not emails)
}

// Review
export interface Review {
  id: string;
  revieweeId: string;
  period: ReviewPeriod;
  year: number;
  status: ReviewStatus;
  
  // Category ratings (descriptive)
  employeeCategoryRatings: Record<string, CategoryRating>;
  managerCategoryRatings: Record<string, CategoryRating>;
  
  // Overall scores (numeric 0-5, 0.25 increments)
  employeeOverallScore: number | null;
  managerOverallScore: number | null;
  
  // Comments
  employeeComments: Record<string, string>;
  managerComments: Record<string, string>;
  
  // Career Development
  employeeCareerDev: string;
  managerCareerDev: string;
  
  completedDate?: string;
}

// Category
export interface Category {
  id: string;
  name: string;
  coreValue: string;
}

// List structures
export interface ManagersList {
  managers: Manager[];
}

export interface RevieweesList {
  reviewees: Reviewee[];
}

export interface ReviewsList {
  reviews: Review[];
}

// Fixed categories
export const CATEGORIES: Category[] = [
  { id: "quality-of-work", name: "Quality of Work", coreValue: "Customer Focused" },
  { id: "dependability-responsibility", name: "Dependability and Responsibility", coreValue: "Accountability" },
  { id: "attitude-teamwork", name: "Attitude and Teamwork", coreValue: "Supportive" },
  { id: "initiative", name: "Initiative", coreValue: "Innovation" },
  { id: "technical-expertise", name: "Technical Expertise", coreValue: "Excellence" },
  { id: "communication", name: "Communication", coreValue: "Supportive" },
];

// Career Development Question
export const CAREER_DEV_QUESTION = "What are the types of challenges you'd like to be tackling in the next six months? What would you find fulfilling? Is there a specific role you'd like to see yourself in? How can you work to achieve these goals? How can your manager help you achieve these goals?";

// Rating definitions
export interface RatingDefinition {
  level: number;
  label: string;
  description: string;
}

export const RATING_DEFINITIONS: RatingDefinition[] = [
  {
    level: 1,
    label: "UNSATISFACTORY",
    description: "The employee is consistently underperforming and has provided inadequate value to the team and organization."
  },
  {
    level: 2,
    label: "NEEDS IMPROVEMENT",
    description: "The employee demonstrates inconsistent performance and often requires more supervision and guidance than expected. Development is needed in specific areas, and reliability is a concern at times."
  },
  {
    level: 3,
    label: "DELIVERS ON EXPECTATIONS",
    description: "The employee reliably meets, or at times exceeds, performance expectations in terms of quality, quantity, and timeliness. They consistently contribute meaningfully to the team and organization and demonstrate effective workplace behaviours."
  },
  {
    level: 4,
    label: "EXCEEDS EXPECTATIONS",
    description: "The employee regularly performs above expectations and contributes significantly to the team and organization. They show initiative, deliver continuous improvements, and consistently demonstrate strong workplace behaviours. They showed a strong connection to the company's values, acknowledged by their supervisor and management."
  },
  {
    level: 5,
    label: "DISTINGUISHED",
    description: "The employee delivers exceptional results far beyond expectations and has made outstanding contributions to the team and organization. Their performance sets a high standard and exemplifies excellence in workplace behaviours."
  }
];

