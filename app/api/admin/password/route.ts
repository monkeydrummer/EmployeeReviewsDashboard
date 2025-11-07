import { NextRequest, NextResponse } from 'next/server';
import { getAdminConfig, saveAdminConfig } from '@/lib/storage';
import { verifyAdminPassword } from '@/lib/auth';
import { hashPassword, verifyPassword } from '@/lib/password';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, currentPassword, newPassword } = body;

    if (action === 'set-password') {
      // Setting password for the first time
      // Verify with default password
      if (!verifyAdminPassword(currentPassword)) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 });
      }

      const config = await getAdminConfig();
      
      // Don't allow setting if already set (use change-password instead)
      if (config.hashedPassword) {
        return NextResponse.json({ error: 'Password already set. Use change password instead.' }, { status: 400 });
      }

      config.hashedPassword = hashPassword(newPassword);
      await saveAdminConfig(config);
      
      return NextResponse.json({ success: true });
    }

    if (action === 'change-password') {
      const config = await getAdminConfig();
      
      // Verify current password
      if (config.hashedPassword) {
        // Custom password is set
        if (!verifyPassword(currentPassword, config.hashedPassword)) {
          return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 });
        }
      } else {
        // Still using default password
        if (!verifyAdminPassword(currentPassword)) {
          return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 });
        }
      }

      config.hashedPassword = hashPassword(newPassword);
      await saveAdminConfig(config);
      
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error managing admin password:', error);
    return NextResponse.json({ error: 'Failed to manage password' }, { status: 500 });
  }
}

