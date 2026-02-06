import { pool } from '@/lib/db';
import { createAdminUser } from '@/lib/auth';
import { cookies } from 'next/headers';
import { verifyAdminSession } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('admin_session')?.value;

    if (!sessionToken) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = await verifyAdminSession(sessionToken);
    if (!admin) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all admin users
    const result = await pool.query(
      'SELECT id, username, email, is_active, created_at FROM admin_users ORDER BY created_at DESC'
    );

    return Response.json(result.rows);
  } catch (error) {
    console.error('Get admins error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('admin_session')?.value;

    if (!sessionToken) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = await verifyAdminSession(sessionToken);
    if (!admin) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { username, email, password } = await request.json();

    if (!username || !email || !password) {
      return Response.json(
        { error: 'Username, email, and password required' },
        { status: 400 }
      );
    }

    const result = await createAdminUser(username, email, password);

    if (!result) {
      return Response.json(
        { error: 'Failed to create admin user' },
        { status: 400 }
      );
    }

    return Response.json({ success: true, admin_id: result.id });
  } catch (error) {
    console.error('Create admin error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
