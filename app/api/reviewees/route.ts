import { NextRequest, NextResponse } from 'next/server';
import { getRevieweesList, saveRevieweesList, getManagersList } from '@/lib/storage';
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
    const { password, managerEmail, action, reviewee } = body;

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

    const revieweesList = await getRevieweesList();

    if (action === 'add') {
      // Managers can only add reviewees to themselves
      if (!isAdmin && managerId) {
        const newReviewee = reviewee as Reviewee;
        if (!newReviewee.managerIds.includes(managerId)) {
          return NextResponse.json({ error: 'Managers can only add reviewees to themselves' }, { status: 403 });
        }
      }
      revieweesList.reviewees.push(reviewee as Reviewee);
    } else if (action === 'update') {
      const index = revieweesList.reviewees.findIndex(r => r.id === reviewee.id);
      if (index !== -1) {
        // Managers can only update their own reviewees
        if (!isAdmin && managerId) {
          if (!revieweesList.reviewees[index].managerIds.includes(managerId)) {
            return NextResponse.json({ error: 'Cannot update reviewee not managed by you' }, { status: 403 });
          }
        }
        revieweesList.reviewees[index] = reviewee as Reviewee;
      }
    } else if (action === 'delete') {
      // Managers can only delete their own reviewees
      if (!isAdmin && managerId) {
        const revieweeToDelete = revieweesList.reviewees.find(r => r.id === reviewee.id);
        if (!revieweeToDelete || !revieweeToDelete.managerIds.includes(managerId)) {
          return NextResponse.json({ error: 'Cannot delete reviewee not managed by you' }, { status: 403 });
        }
      }
      revieweesList.reviewees = revieweesList.reviewees.filter(r => r.id !== reviewee.id);
    }

    await saveRevieweesList(revieweesList);

    return NextResponse.json({ success: true, reviewees: revieweesList.reviewees });
  } catch (error) {
    console.error('Error updating reviewees:', error);
    return NextResponse.json({ error: 'Failed to update reviewees' }, { status: 500 });
  }
}

