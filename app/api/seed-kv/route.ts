import { NextRequest, NextResponse } from 'next/server';
import { seedRedisFromFiles } from '@/lib/storage';
import { verifyAdminPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body;

    // Verify admin password
    if (!verifyAdminPassword(password)) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid password' },
        { status: 401 }
      );
    }

    // Seed the Redis database from JSON files
    await seedRedisFromFiles();

    return NextResponse.json({
      success: true,
      message: 'Successfully seeded Redis storage from JSON files',
    });
  } catch (error) {
    console.error('Error seeding Redis:', error);
    return NextResponse.json(
      { error: 'Failed to seed Redis storage', details: (error as Error).message },
      { status: 500 }
    );
  }
}

