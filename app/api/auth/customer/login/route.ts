import { customerPhoneLogin } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { phoneNumber } = await request.json();

    if (!phoneNumber) {
      return Response.json(
        { error: 'Phone number required' },
        { status: 400 }
      );
    }

    // Normalize phone number (remove spaces, dashes, etc.)
    const normalizedPhone = phoneNumber.replace(/\D/g, '');

    const result = await customerPhoneLogin(normalizedPhone);

    if (!result) {
      return Response.json(
        { error: 'Phone number not found' },
        { status: 404 }
      );
    }

    // Set session cookie
    const cookieStore = await cookies();
    cookieStore.set('customer_session', result.session_id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    return Response.json({ success: true, customer_id: result.customer_id });
  } catch (error) {
    console.error('Customer phone login error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
