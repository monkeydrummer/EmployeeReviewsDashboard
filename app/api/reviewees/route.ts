import { NextRequest, NextResponse } from 'next/server';
import { getRevieweesList, saveRevieweesList, getManagersList } from '@/lib/storage';
import { verifyAdminPassword } from '@/lib/auth';
import { Reviewee } from '@/lib/types';
import { hashPassword, verifyPassword } from '@/lib/password';

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
    const { password, managerEmail, action, reviewee, email, password: userPassword } = body;

    const revieweesList = await getRevieweesList();

    // Handle password-related actions (no admin auth needed)
    if (action === 'set-password') {
      const revieweeIndex = revieweesList.reviewees.findIndex(r => r.email === email);
      if (revieweeIndex === -1) {
        return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
      }
      
      revieweesList.reviewees[revieweeIndex].hashedPassword = hashPassword(userPassword);
      await saveRevieweesList(revieweesList);
      return NextResponse.json({ success: true });
    }
    
    if (action === 'change-password') {
      const { oldPassword, newPassword } = body;
      const revieweeIndex = revieweesList.reviewees.findIndex(r => r.email === email);
      
      if (revieweeIndex === -1) {
        return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
      }
      
      const reviewee = revieweesList.reviewees[revieweeIndex];
      if (reviewee.hashedPassword && !verifyPassword(oldPassword, reviewee.hashedPassword)) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 });
      }
      
      revieweesList.reviewees[revieweeIndex].hashedPassword = hashPassword(newPassword);
      await saveRevieweesList(revieweesList);
      return NextResponse.json({ success: true });
    }
    
    if (action === 'reset-password') {
      // Admin only - reset an employee's password
      if (!verifyAdminPassword(password)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      const revieweeIndex = revieweesList.reviewees.findIndex(r => r.email === email);
      if (revieweeIndex === -1) {
        return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
      }
      
      // Remove password so they have to set it up again
      delete revieweesList.reviewees[revieweeIndex].hashedPassword;
      await saveRevieweesList(revieweesList);
      return NextResponse.json({ success: true });
    }

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
    } else if (action === 'assign-manager') {
      // Batch assign a manager to multiple reviewees (admin only)
      if (!isAdmin) {
        return NextResponse.json({ error: 'Only admins can batch assign managers' }, { status: 403 });
      }
      
      const { revieweeIds, managerId: newManagerId } = body;
      
      if (!revieweeIds || !Array.isArray(revieweeIds) || revieweeIds.length === 0) {
        return NextResponse.json({ error: 'revieweeIds must be a non-empty array' }, { status: 400 });
      }
      
      if (!newManagerId) {
        return NextResponse.json({ error: 'managerId is required' }, { status: 400 });
      }
      
      // Verify the manager exists
      const managersList = await getManagersList();
      const managerExists = managersList.managers.some(m => m.id === newManagerId);
      if (!managerExists) {
        return NextResponse.json({ error: 'Manager not found' }, { status: 404 });
      }
      
      // Add the manager to each selected reviewee (if not already present)
      let updatedCount = 0;
      revieweesList.reviewees = revieweesList.reviewees.map(reviewee => {
        if (revieweeIds.includes(reviewee.id)) {
          if (!reviewee.managerIds.includes(newManagerId)) {
            reviewee.managerIds.push(newManagerId);
            updatedCount++;
          }
        }
        return reviewee;
      });
      
      await saveRevieweesList(revieweesList);
      return NextResponse.json({ 
        success: true, 
        reviewees: revieweesList.reviewees,
        message: `Manager assigned to ${updatedCount} employee(s)` 
      });
    }

    await saveRevieweesList(revieweesList);

    return NextResponse.json({ success: true, reviewees: revieweesList.reviewees });
  } catch (error) {
    console.error('Error updating reviewees:', error);
    return NextResponse.json({ error: 'Failed to update reviewees' }, { status: 500 });
  }
}

