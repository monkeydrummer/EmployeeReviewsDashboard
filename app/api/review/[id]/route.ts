import { NextRequest, NextResponse } from 'next/server';
import { getReview, saveReview, getRevieweesList, getManagersList } from '@/lib/storage';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const review = await getReview(params.id);
    const revieweesList = await getRevieweesList();
    const managersList = await getManagersList();
    const reviewee = revieweesList.reviewees.find(r => r.id === review.revieweeId);
    
    if (!reviewee) {
      return NextResponse.json({ error: 'Reviewee not found' }, { status: 404 });
    }
    
    return NextResponse.json({ review, reviewee, managers: managersList.managers });
  } catch (error: any) {
    console.error('Error fetching review:', error);
    // Check if it's a "not found" error
    if (error?.message?.includes('not found')) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }
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
    const managersList = await getManagersList();
    const reviewee = revieweesList.reviewees.find(r => r.id === currentReview.revieweeId);

    if (!reviewee) {
      return NextResponse.json({ error: 'Reviewee not found' }, { status: 404 });
    }

    // Verify permissions
    const isEmployee = email === reviewee.email;
    const isManager = managersList.managers.some(m => 
      reviewee.managerIds.includes(m.id) && m.email === email
    );

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

