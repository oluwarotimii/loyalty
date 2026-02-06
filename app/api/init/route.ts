import { pool } from '@/lib/db';
import { createAdminUser } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    // Check if any admin users exist
    const checkResult = await pool.query('SELECT COUNT(*) as count FROM admin_users');
    const adminCount = parseInt(checkResult.rows[0].count);

    if (adminCount > 0) {
      return Response.json(
        { error: 'Admin users already exist. Use the admin interface to add more users.' },
        { status: 400 }
      );
    }

    const { username, email, password } = await request.json();

    if (!username || !email || !password) {
      return Response.json(
        { error: 'Username, email, and password required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return Response.json(
        { error: 'Password must be at least 6 characters' },
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

    return Response.json({
      success: true,
      message: 'First admin user created successfully',
      admin_id: result.id,
    });
  } catch (error) {
    console.error('Init error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const checkResult = await pool.query('SELECT COUNT(*) as count FROM admin_users');
    const adminCount = parseInt(checkResult.rows[0].count);

    return Response.json({ hasAdmins: adminCount > 0 });
  } catch (error) {
    console.error('Init check error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
