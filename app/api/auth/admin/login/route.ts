import { adminLogin } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return Response.json(
        { error: 'Username and password required' },
        { status: 400 }
      );
    }

    const result = await adminLogin(username, password);

    if (!result) {
      return Response.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Set session cookie
    const cookieStore = await cookies();
    cookieStore.set('admin_session', result.session_id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });

    return Response.json({ success: true, admin_id: result.admin_id });
  } catch (error) {
    console.error('Admin login error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
