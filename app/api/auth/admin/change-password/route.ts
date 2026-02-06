import { updateAdminPassword, verifyAdminSession, verifyPassword } from '@/lib/auth';
import { cookies } from 'next/headers';

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

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return Response.json(
        { error: 'Current and new password required' },
        { status: 400 }
      );
    }

    // Verify current password
    const { pool } = await import('@/lib/db');
    const result = await pool.query(
      'SELECT password_hash FROM admin_users WHERE id = $1',
      [admin.admin_id]
    );

    if (result.rows.length === 0) {
      return Response.json({ error: 'Admin not found' }, { status: 404 });
    }

    const passwordMatch = await verifyPassword(currentPassword, result.rows[0].password_hash);
    if (!passwordMatch) {
      return Response.json({ error: 'Current password is incorrect' }, { status: 401 });
    }

    // Update password
    const success = await updateAdminPassword(admin.admin_id, newPassword);

    if (!success) {
      return Response.json({ error: 'Failed to update password' }, { status: 400 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Change password error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
