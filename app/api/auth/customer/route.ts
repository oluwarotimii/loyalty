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

    // Fetch full customer data with tier information
    // Get the most recently assigned tier for the customer within the current period
    const result = await pool.query(
      `SELECT
        c.id, c.name, c.email, c.phone, c.date_of_birth, c.address, c.created_at,
        ct.tier_id,
        t.name as current_tier,
        COALESCE(ct.total_spend, 0) as total_spending
       FROM customers c
       LEFT JOIN customer_tiers ct ON c.id = ct.customer_id
         AND ct.period_start <= CURRENT_DATE
         AND ct.period_end >= CURRENT_DATE
       LEFT JOIN tiers t ON ct.tier_id = t.id
       WHERE c.id = $1`,
      [customer.customer_id]
    );

    if (result.rows.length === 0) {
      return Response.json({ error: 'Customer not found' }, { status: 404 });
    }

    const customerData = result.rows[0];

    return Response.json({
      ...customerData,
      total_amount: customerData.total_spending, // Amount-based model
      current_tier: customerData.current_tier || 'Unassigned', // Use the tier name from the join
      total_spending: customerData.total_spending,
      tier_id: customerData.tier_id // Include the tier_id in the response
    });
  } catch (error) {
    console.error('Get customer error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
