import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  // Verify the request is from Vercel Cron
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get all customers and their total spending
    const customers = await sql`
      SELECT 
        c.id,
        COALESCE(SUM(t.amount), 0) as total_spending
      FROM customers c
      LEFT JOIN transactions t ON c.id = t.customer_id
      GROUP BY c.id
    `;
    
    // Get all tiers
    const tiers = await sql`SELECT id, name, min_spend FROM tiers WHERE is_active = true ORDER BY min_spend DESC`;

    for (const customer of customers.rows) {
      // Find the highest tier the customer qualifies for based on spending
      let newTierId = '';
      for (const tier of tiers.rows) {
        if (customer.total_spending >= tier.min_spend) {
          newTierId = tier.id;
          break;
        }
      }

      // If no tier was found (shouldn't happen if there's a base tier), assign the lowest tier
      if (!newTierId && tiers.rows.length > 0) {
        // Get the tier with the lowest min_spend (the last one since we ordered DESC)
        const lowestTier = await sql`SELECT id FROM tiers WHERE is_active = true ORDER BY min_spend ASC LIMIT 1`;
        newTierId = lowestTier.rows[0]?.id || '';
      }

      // Update customer tier if a valid tier was found
      if (newTierId) {
        await sql`UPDATE customers SET tier_id = ${newTierId} WHERE id = ${customer.id}`;

        // Log tier update
        await sql`
          INSERT INTO transactions (customer_id, type, amount, description)
          VALUES (${customer.id}, 'tier-update', 0, 'Tier updated automatically based on spending')
        `;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Updated tiers for ${customers.rows.length} customers`,
    });
  } catch (error) {
    console.error('Cron error:', error);
    return NextResponse.json({ error: 'Failed to update tiers' }, { status: 500 });
  }
}
