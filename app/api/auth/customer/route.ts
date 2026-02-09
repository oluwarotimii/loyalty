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

    console.log('Verifying customer session:', customer);
    
    // Fetch full customer data with tier information
    // First, try to get current active tier
    let result = await pool.query(
      `SELECT
        c.id, c.name, c.email, c.phone, c.date_of_birth, c.address, c.created_at,
        ct.tier_id,
        COALESCE(t.name, 'Unassigned') as current_tier,
        COALESCE(ct.total_spend, 0) as total_spending
       FROM customers c
       LEFT JOIN customer_tiers ct ON c.id = ct.customer_id
         AND ct.period_start <= CURRENT_DATE
         AND ct.period_end >= CURRENT_DATE
       LEFT JOIN tiers t ON ct.tier_id = t.id
       WHERE c.id = $1`,
      [customer.id]  // Use 'id' instead of 'customer_id'
    );

    // If no active tier found, get the most recent tier assignment
    if (result.rows.length === 0 || !result.rows[0].current_tier || result.rows[0].current_tier === 'Unassigned') {
      result = await pool.query(
        `SELECT
          c.id, c.name, c.email, c.phone, c.date_of_birth, c.address, c.created_at,
          ct_latest.tier_id,
          COALESCE(t_latest.name, 'Unassigned') as current_tier,
          COALESCE(ct_latest.total_spend, 
            (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE customer_id = c.id)
          ) as total_spending
         FROM customers c
         LEFT JOIN (
           SELECT DISTINCT ON (customer_id) 
             customer_id, tier_id, total_spend
           FROM customer_tiers 
           WHERE customer_id = $1
           ORDER BY customer_id, period_start DESC
         ) ct_latest ON c.id = ct_latest.customer_id
         LEFT JOIN tiers t_latest ON ct_latest.tier_id = t_latest.id
         WHERE c.id = $1`,
        [customer.id]  // Use 'id' instead of 'customer_id'
      );
    }

    // If still no customer found, return 404
    console.log('Query result rows count:', result.rows.length);
    if (result.rows.length === 0) {
      console.log('No customer found with ID:', customer.customer_id);
      return Response.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Calculate total spending from transactions if not available in customer_tiers
    let customerData = result.rows[0];
    console.log('Customer data retrieved:', customerData);
    if (customerData.total_spending === 0) {
      const transactionSum = await pool.query(
        'SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE customer_id = $1',
        [customer.id]  // Use 'id' instead of 'customer_id'
      );
      console.log('Transaction sum result:', transactionSum.rows[0]);
      customerData.total_spending = Number(transactionSum.rows[0].total);
    }

    const responseData = {
      ...customerData,
      total_amount: customerData.total_spending, // Amount-based model
      current_tier: customerData.current_tier || 'Unassigned', // Use the tier name from the join
      total_spending: customerData.total_spending,
      tier_id: customerData.tier_id // Include the tier_id in the response
    };

    console.log('Customer API response:', responseData);

    return Response.json(responseData);
  } catch (error) {
    console.error('Get customer error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
