import { promises as fs } from 'fs';
import path from 'path';
import { Review, RevieweesList, ReviewsList } from './types';
import { decodeRatings, encodeRatings, isObfuscated } from './obfuscate';

// Conditionally import Upstash Redis only in production
let redis: any = null;

// Initialize Redis storage in production
const initRedis = async () => {
  if (process.env.UPSTASH_REDIS_REST_URL && !redis) {
    const { Redis } = await import('@upstash/redis');
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  }
};

// Check if we're using Redis storage (production)
const useRedis = () => {
  return process.env.NODE_ENV === 'production' && process.env.UPSTASH_REDIS_REST_URL;
};

/**
 * Get the list of all reviewees
 */
export async function getRevieweesList(): Promise<RevieweesList> {
  if (useRedis()) {
    await initRedis();
    const data = await redis.get('reviewees-list');
    if (data) {
      return data as RevieweesList;
    }
    console.warn('Reviewees list not found in Redis, falling back to filesystem');
  }
  
  // Filesystem fallback (development)
  const dataDir = path.join(process.cwd(), 'data');
  const revieweesPath = path.join(dataDir, 'reviewees.json');
  const fileContents = await fs.readFile(revieweesPath, 'utf8');
  return JSON.parse(fileContents);
}

/**
 * Save the list of all reviewees
 */
export async function saveRevieweesList(list: RevieweesList): Promise<void> {
  if (useRedis()) {
    await initRedis();
    await redis.set('reviewees-list', list);
  } else {
    // Filesystem (development)
    const dataDir = path.join(process.cwd(), 'data');
    const revieweesPath = path.join(dataDir, 'reviewees.json');
    await fs.writeFile(revieweesPath, JSON.stringify(list, null, 2), 'utf8');
  }
}

/**
 * Get all reviews
 */
export async function getAllReviews(): Promise<Review[]> {
  if (useRedis()) {
    await initRedis();
    const data = await redis.get('reviews-list');
    if (data) {
      const reviewsList = data as ReviewsList;
      return reviewsList.reviews;
    }
    console.warn('Reviews list not found in Redis, falling back to filesystem');
  }

  // Filesystem fallback (development)
  const dataDir = path.join(process.cwd(), 'data');
  const reviewsPath = path.join(dataDir, 'reviews-2025.json');
  const fileContents = await fs.readFile(reviewsPath, 'utf8');
  const rawData: ReviewsList = JSON.parse(fileContents);
  
  // Decode obfuscated ratings
  const reviews: Review[] = rawData.reviews.map((review: any) => ({
    ...review,
    employeeCategoryRatings: isObfuscated(review.employeeCategoryRatings)
      ? decodeRatings(review.employeeCategoryRatings)
      : review.employeeCategoryRatings,
    managerCategoryRatings: isObfuscated(review.managerCategoryRatings)
      ? decodeRatings(review.managerCategoryRatings)
      : review.managerCategoryRatings,
  }));
  
  return reviews;
}

/**
 * Get a specific review by ID
 */
export async function getReview(reviewId: string): Promise<Review> {
  const reviews = await getAllReviews();
  const review = reviews.find(r => r.id === reviewId);
  
  if (!review) {
    throw new Error(`Review ${reviewId} not found`);
  }
  
  return review;
}

/**
 * Save a specific review
 */
export async function saveReview(reviewId: string, review: Review): Promise<void> {
  const allReviews = await getAllReviews();
  const index = allReviews.findIndex(r => r.id === reviewId);
  
  if (index === -1) {
    throw new Error(`Review ${reviewId} not found`);
  }
  
  allReviews[index] = review;
  await saveAllReviews(allReviews);
}

/**
 * Save all reviews
 */
export async function saveAllReviews(reviews: Review[]): Promise<void> {
  // Encode ratings before saving to filesystem
  const dataToSave: ReviewsList = {
    reviews: reviews.map(review => ({
      ...review,
      employeeCategoryRatings: encodeRatings(review.employeeCategoryRatings) as any,
      managerCategoryRatings: encodeRatings(review.managerCategoryRatings) as any,
    }))
  };

  if (useRedis()) {
    await initRedis();
    // Store decoded version in Redis for faster access
    await redis.set('reviews-list', { reviews });
  } else {
    // Filesystem (development)
    const dataDir = path.join(process.cwd(), 'data');
    const reviewsPath = path.join(dataDir, 'reviews-2025.json');
    await fs.writeFile(reviewsPath, JSON.stringify(dataToSave, null, 2), 'utf8');
  }
}

/**
 * Create a new review
 */
export async function createReview(review: Review): Promise<void> {
  const allReviews = await getAllReviews();
  allReviews.push(review);
  await saveAllReviews(allReviews);
}

/**
 * Delete a review
 */
export async function deleteReview(reviewId: string): Promise<void> {
  const allReviews = await getAllReviews();
  const filteredReviews = allReviews.filter(r => r.id !== reviewId);
  await saveAllReviews(filteredReviews);
}

/**
 * Initialize Redis storage from filesystem data (run once during deployment)
 */
export async function seedRedisFromFiles(): Promise<void> {
  if (!useRedis()) {
    console.log('Not using Redis storage, skipping seed');
    return;
  }

  await initRedis();
  
  try {
    const dataDir = path.join(process.cwd(), 'data');
    
    // Seed reviewees list
    const revieweesPath = path.join(dataDir, 'reviewees.json');
    const revieweesData = await fs.readFile(revieweesPath, 'utf8');
    const revieweesList: RevieweesList = JSON.parse(revieweesData);
    await redis.set('reviewees-list', revieweesList);
    console.log('✓ Seeded reviewees list to Redis');
    
    // Seed reviews list
    const reviewsPath = path.join(dataDir, 'reviews-2025.json');
    const reviewsData = await fs.readFile(reviewsPath, 'utf8');
    const rawReviewsList: ReviewsList = JSON.parse(reviewsData);
    
    // Decode ratings for Redis storage
    const decodedReviews: Review[] = rawReviewsList.reviews.map((review: any) => ({
      ...review,
      employeeCategoryRatings: isObfuscated(review.employeeCategoryRatings)
        ? decodeRatings(review.employeeCategoryRatings)
        : review.employeeCategoryRatings,
      managerCategoryRatings: isObfuscated(review.managerCategoryRatings)
        ? decodeRatings(review.managerCategoryRatings)
        : review.managerCategoryRatings,
    }));
    
    await redis.set('reviews-list', { reviews: decodedReviews });
    console.log('✓ Seeded reviews list to Redis');
    
    console.log('✓ All data seeded to Redis storage successfully');
  } catch (error) {
    console.error('Error seeding Redis storage:', error);
    throw error;
  }
}

