import { NextRequest, NextResponse } from 'next/server';
import { getRevieweesList, saveRevieweesList, getManagersList } from '@/lib/storage';
import { Reviewee } from '@/lib/types';

interface ApplyChange {
  type: 'add' | 'update' | 'remove';
  employeeId?: string;
  name: string;
  email: string;
  newTitle?: string;
  managerEmail?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { adminEmail, changes } = await request.json();

    // Verify admin authentication
    if (!adminEmail) {
      return NextResponse.json({ error: 'Admin email required' }, { status: 401 });
    }

    if (!changes || !Array.isArray(changes)) {
      return NextResponse.json({ error: 'Changes array required' }, { status: 400 });
    }

    // Get current data
    const revieweesList = await getRevieweesList();
    const managersList = await getManagersList();
    
    // Create manager lookup by email
    const managerByEmail = new Map(
      managersList.managers.map(m => [m.email.toLowerCase(), m])
    );

    let added = 0;
    let updated = 0;
    let removed = 0;

    // Apply changes
    for (const change of changes as ApplyChange[]) {
      if (change.type === 'add') {
        // Add new employee
        const newId = `reviewee-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const managerIds: string[] = [];
        
        // Find manager ID by email if provided
        if (change.managerEmail) {
          const manager = managerByEmail.get(change.managerEmail.toLowerCase());
          if (manager) {
            managerIds.push(manager.id);
          }
        }

        const newReviewee: Reviewee = {
          id: newId,
          name: change.name,
          email: change.email,
          title: change.newTitle || '',
          managerIds
        };

        revieweesList.reviewees.push(newReviewee);
        added++;

      } else if (change.type === 'update') {
        // Update existing employee
        const reviewee = revieweesList.reviewees.find(r => r.id === change.employeeId);
        if (reviewee) {
          if (change.newTitle) {
            reviewee.title = change.newTitle;
          }
          
          // Update manager if provided
          if (change.managerEmail) {
            const manager = managerByEmail.get(change.managerEmail.toLowerCase());
            if (manager && !reviewee.managerIds.includes(manager.id)) {
              // Only add if not already assigned
              reviewee.managerIds = [manager.id];
            }
          }
          
          updated++;
        }

      } else if (change.type === 'remove') {
        // Remove employee
        const index = revieweesList.reviewees.findIndex(r => r.id === change.employeeId);
        if (index !== -1) {
          revieweesList.reviewees.splice(index, 1);
          removed++;
        }
      }
    }

    // Save updated list
    await saveRevieweesList(revieweesList);

    return NextResponse.json({
      success: true,
      added,
      updated,
      removed
    });

  } catch (error: any) {
    console.error('Error applying sync changes:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to apply sync changes'
    }, { status: 500 });
  }
}


