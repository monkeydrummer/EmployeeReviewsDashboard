import { NextRequest, NextResponse } from 'next/server';
import { getManagersList, saveManagersList } from '@/lib/storage';
import { verifyAdminPassword } from '@/lib/auth';
import { Manager } from '@/lib/types';
import { hashPassword, verifyPassword } from '@/lib/password';

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
    const { password, action, manager, email, password: userPassword } = body;

    const managersList = await getManagersList();

    // Handle password-related actions (no admin auth needed)
    if (action === 'set-password') {
      const managerIndex = managersList.managers.findIndex(m => m.email === email);
      if (managerIndex === -1) {
        return NextResponse.json({ error: 'Manager not found' }, { status: 404 });
      }
      
      managersList.managers[managerIndex].hashedPassword = hashPassword(userPassword);
      await saveManagersList(managersList);
      return NextResponse.json({ success: true });
    }
    
    if (action === 'change-password') {
      const { oldPassword, newPassword } = body;
      const managerIndex = managersList.managers.findIndex(m => m.email === email);
      
      if (managerIndex === -1) {
        return NextResponse.json({ error: 'Manager not found' }, { status: 404 });
      }
      
      const manager = managersList.managers[managerIndex];
      if (manager.hashedPassword && !verifyPassword(oldPassword, manager.hashedPassword)) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 });
      }
      
      managersList.managers[managerIndex].hashedPassword = hashPassword(newPassword);
      await saveManagersList(managersList);
      return NextResponse.json({ success: true });
    }
    
    if (action === 'reset-password') {
      // Admin only - reset a manager's password
      if (!verifyAdminPassword(password)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      const managerIndex = managersList.managers.findIndex(m => m.email === email);
      if (managerIndex === -1) {
        return NextResponse.json({ error: 'Manager not found' }, { status: 404 });
      }
      
      // Remove password so they have to set it up again
      delete managersList.managers[managerIndex].hashedPassword;
      await saveManagersList(managersList);
      return NextResponse.json({ success: true });
    }

    // All other actions require admin password
    if (!verifyAdminPassword(password)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

