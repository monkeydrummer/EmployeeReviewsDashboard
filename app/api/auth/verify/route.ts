import { NextRequest, NextResponse } from 'next/server';
import { getManagersList, getRevieweesList } from '@/lib/storage';
import { verifyPassword } from '@/lib/password';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, role } = body;

    if (!email || !password || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (role === 'manager') {
      const managersList = await getManagersList();
      const manager = managersList.managers.find(m => m.email === email);
      
      if (!manager || !manager.hashedPassword) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
      }
      
      if (verifyPassword(password, manager.hashedPassword)) {
        return NextResponse.json({ success: true });
      }
    } else if (role === 'employee') {
      const revieweesList = await getRevieweesList();
      const employee = revieweesList.reviewees.find(r => r.email === email);
      
      if (!employee || !employee.hashedPassword) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
      }
      
      if (verifyPassword(password, employee.hashedPassword)) {
        return NextResponse.json({ success: true });
      }
    }

    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  } catch (error) {
    console.error('Error verifying password:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}

