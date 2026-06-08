import { NextResponse } from 'next/server';
import { query } from '@/lib/db/index';
import { optionalAuth } from '@/lib/authMiddleware';

export async function POST(request) {
  try {
    const auth = await optionalAuth(request);
    const userId = auth.session?.user?.dbUserId || auth.userId;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { format, blueprintId } = await request.json();

    if (!format) {
      return NextResponse.json({ error: 'Format is required' }, { status: 400 });
    }

    // Fire and forget insert into blueprint_exports
    await query(
      `INSERT INTO blueprint_exports (user_id, blueprint_id, format, created_at)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP)`,
      [userId, blueprintId || null, format]
    );

    console.log(`✓ Export logged (user: ${userId}, format: ${format})`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to log export:', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
