import { pool } from '@/lib/db';
import { verifyCustomerSession } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('customer_session')?.value;

    if (!sessionToken) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const customer = await verifyCustomerSession(sessionToken);
    if (!customer) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Calculate total spending for the customer
    const spendingResult = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as total_spending
       FROM transactions
       WHERE customer_id = $1`,
      [customer.customer_id]
    );
    
    // Fetch full customer data
    const result = await pool.query(
      `SELECT
        id, name, email, phone, points_balance as total_points, current_tier
       FROM customers
       WHERE id = $1`,
      [customer.customer_id]
    );

    if (result.rows.length === 0) {
      return Response.json({ error: 'Customer not found' }, { status: 404 });
    }

    const customerData = result.rows[0];
    const totalSpending = parseFloat(spendingResult.rows[0]?.total_spending || 0);

    return Response.json({
      ...customerData,
      total_spending: totalSpending
    });
  } catch (error) {
    console.error('Get customer error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
