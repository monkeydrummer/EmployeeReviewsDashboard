import { NextRequest, NextResponse } from 'next/server';
import { getAdminConfig } from '@/lib/storage';
import { verifyPassword } from '@/lib/password';
import { verifyAdminPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json({ error: 'Password required' }, { status: 400 });
    }

    // Check stored admin password first
    const config = await getAdminConfig();
    
    if (config.hashedPassword) {
      // Custom password is set
      if (verifyPassword(password, config.hashedPassword)) {
        return NextResponse.json({ success: true });
      }
    } else {
      // Still using default password
      if (verifyAdminPassword(password)) {
        return NextResponse.json({ success: true });
      }
    }

    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  } catch (error) {
    console.error('Error verifying admin password:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}

