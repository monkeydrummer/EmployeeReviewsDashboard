import { NextRequest, NextResponse } from 'next/server';
import { getAllReviews, saveAllReviews, createReview } from '@/lib/storage';
import { verifyAdminPassword } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const reviews = await getAllReviews();
    return NextResponse.json({ reviews });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password, action, review } = body;

    // Verify admin password
    if (!verifyAdminPassword(password)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (action === 'create') {
      await createReview(review);
      return NextResponse.json({ success: true, review });
    } else if (action === 'update-status') {
      const reviews = await getAllReviews();
      const index = reviews.findIndex(r => r.id === review.id);
      if (index !== -1) {
        reviews[index].status = review.status;
        if (review.status === 'completed') {
          reviews[index].completedDate = new Date().toISOString();
        }
        await saveAllReviews(reviews);
        return NextResponse.json({ success: true, review: reviews[index] });
      }
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error updating reviews:', error);
    return NextResponse.json({ error: 'Failed to update reviews' }, { status: 500 });
  }
}

