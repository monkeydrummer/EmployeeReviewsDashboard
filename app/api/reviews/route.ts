import { NextRequest, NextResponse } from 'next/server';
import { getAllReviews, saveAllReviews, createReview, getManagersList, getRevieweesList } from '@/lib/storage';
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
    const { password, managerEmail, action, review } = body;

    // Check authorization: admin or manager
    let isAdmin = false;
    let managerId: string | null = null;

    if (password) {
      // Admin authentication
      if (!verifyAdminPassword(password)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      isAdmin = true;
    } else if (managerEmail) {
      // Manager authentication
      const managersList = await getManagersList();
      const manager = managersList.managers.find(m => m.email === managerEmail);
      if (!manager) {
        return NextResponse.json({ error: 'Unauthorized - not a manager' }, { status: 401 });
      }
      managerId = manager.id;
    } else {
      return NextResponse.json({ error: 'No authentication provided' }, { status: 401 });
    }

    if (action === 'create') {
      // Managers can only create reviews for their own reviewees
      if (!isAdmin && managerId) {
        const revieweesList = await getRevieweesList();
        const reviewee = revieweesList.reviewees.find(r => r.id === review.revieweeId);
        if (!reviewee || !reviewee.managerIds.includes(managerId)) {
          return NextResponse.json({ error: 'Cannot create review for reviewee not managed by you' }, { status: 403 });
        }
      }
      await createReview(review);
      return NextResponse.json({ success: true, review });
    } else if (action === 'delete') {
      const { reviewId } = body;
      
      // Verify permissions - managers can only delete reviews for their own reviewees
      if (!isAdmin && managerId) {
        const reviews = await getAllReviews();
        const reviewToDelete = reviews.find(r => r.id === reviewId);
        if (!reviewToDelete) {
          return NextResponse.json({ error: 'Review not found' }, { status: 404 });
        }
        
        const revieweesList = await getRevieweesList();
        const reviewee = revieweesList.reviewees.find(r => r.id === reviewToDelete.revieweeId);
        if (!reviewee || !reviewee.managerIds.includes(managerId)) {
          return NextResponse.json({ error: 'Cannot delete review for reviewee not managed by you' }, { status: 403 });
        }
      }
      
      const reviews = await getAllReviews();
      const filteredReviews = reviews.filter(r => r.id !== reviewId);
      await saveAllReviews(filteredReviews);
      return NextResponse.json({ success: true });
    } else if (action === 'update-status') {
      // Only admin can update status
      if (!isAdmin) {
        return NextResponse.json({ error: 'Only admin can update review status' }, { status: 403 });
      }
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

