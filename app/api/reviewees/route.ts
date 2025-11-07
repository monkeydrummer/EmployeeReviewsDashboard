import { NextRequest, NextResponse } from 'next/server';
import { getRevieweesList, saveRevieweesList } from '@/lib/storage';
import { verifyAdminPassword } from '@/lib/auth';
import { Reviewee } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const revieweesList = await getRevieweesList();
    return NextResponse.json(revieweesList);
  } catch (error) {
    console.error('Error fetching reviewees:', error);
    return NextResponse.json({ error: 'Failed to fetch reviewees' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password, action, reviewee } = body;

    // Verify admin password
    if (!verifyAdminPassword(password)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const revieweesList = await getRevieweesList();

    if (action === 'add') {
      revieweesList.reviewees.push(reviewee as Reviewee);
    } else if (action === 'update') {
      const index = revieweesList.reviewees.findIndex(r => r.id === reviewee.id);
      if (index !== -1) {
        revieweesList.reviewees[index] = reviewee as Reviewee;
      }
    } else if (action === 'delete') {
      revieweesList.reviewees = revieweesList.reviewees.filter(r => r.id !== reviewee.id);
    }

    await saveRevieweesList(revieweesList);

    return NextResponse.json({ success: true, reviewees: revieweesList.reviewees });
  } catch (error) {
    console.error('Error updating reviewees:', error);
    return NextResponse.json({ error: 'Failed to update reviewees' }, { status: 500 });
  }
}

