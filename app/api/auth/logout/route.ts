import { logout } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    
    // Try to get both admin and customer session cookies
    const adminSession = cookieStore.get('admin_session')?.value;
    const customerSession = cookieStore.get('customer_session')?.value;

    if (adminSession) {
      await logout(adminSession, true);
      cookieStore.delete('admin_session');
    }

    if (customerSession) {
      await logout(customerSession, false);
      cookieStore.delete('customer_session');
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
