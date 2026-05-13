import { query, queryOne } from '@/lib/db/index.js';

export async function GET() {
  try {
    // Test 1: Check if we can connect
    const testQuery = await queryOne('SELECT NOW() as current_time');
    
    // Test 2: Check if tables exist
    const tablesCheck = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    return Response.json({
      status: 'success',
      message: 'Database connected successfully',
      current_time: testQuery.current_time,
      tables_count: tablesCheck.length,
      tables: tablesCheck.map(t => t.table_name),
    });
  } catch (error) {
    return Response.json({
      status: 'error',
      message: error.message,
      hint: 'Check DATABASE_URL in .env.local and ensure PostgreSQL is running',
    }, { status: 500 });
  }
}
