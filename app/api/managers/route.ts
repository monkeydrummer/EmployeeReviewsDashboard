import { NextRequest, NextResponse } from 'next/server';
import { getManagersList, saveManagersList } from '@/lib/storage';
import { verifyAdminPassword } from '@/lib/auth';
import { Manager } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const managersList = await getManagersList();
    return NextResponse.json(managersList);
  } catch (error) {
    console.error('Error fetching managers:', error);
    return NextResponse.json({ error: 'Failed to fetch managers' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password, action, manager } = body;

    // Verify admin password
    if (!verifyAdminPassword(password)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const managersList = await getManagersList();

    if (action === 'add') {
      managersList.managers.push(manager as Manager);
    } else if (action === 'update') {
      const index = managersList.managers.findIndex(m => m.id === manager.id);
      if (index !== -1) {
        managersList.managers[index] = manager as Manager;
      }
    } else if (action === 'delete') {
      managersList.managers = managersList.managers.filter(m => m.id !== manager.id);
    }

    await saveManagersList(managersList);

    return NextResponse.json({ success: true, managers: managersList.managers });
  } catch (error) {
    console.error('Error updating managers:', error);
    return NextResponse.json({ error: 'Failed to update managers' }, { status: 500 });
  }
}

