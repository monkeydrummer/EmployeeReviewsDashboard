import { NextRequest, NextResponse } from 'next/server';
import { getReview, saveReview, getRevieweesList } from '@/lib/storage';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const review = await getReview(params.id);
    const revieweesList = await getRevieweesList();
    const reviewee = revieweesList.reviewees.find(r => r.id === review.revieweeId);
    
    return NextResponse.json({ review, reviewee });
  } catch (error) {
    console.error('Error fetching review:', error);
    return NextResponse.json({ error: 'Failed to fetch review' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { review, email } = body;

    // Get the current review to verify permissions
    const currentReview = await getReview(params.id);
    const revieweesList = await getRevieweesList();
    const reviewee = revieweesList.reviewees.find(r => r.id === currentReview.revieweeId);

    if (!reviewee) {
      return NextResponse.json({ error: 'Reviewee not found' }, { status: 404 });
    }

    // Verify permissions
    const isEmployee = email === reviewee.email;
    const isManager = reviewee.managers.includes(email);

    if (!isEmployee && !isManager) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Save the review
    await saveReview(params.id, review);

    return NextResponse.json({ success: true, review });
  } catch (error) {
    console.error('Error saving review:', error);
    return NextResponse.json({ error: 'Failed to save review' }, { status: 500 });
  }
}

