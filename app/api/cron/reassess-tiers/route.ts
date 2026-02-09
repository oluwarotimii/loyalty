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
        c.name,
        c.email,
        COALESCE(SUM(t.amount), 0) as total_spending
      FROM customers c
      LEFT JOIN transactions t ON c.id = t.customer_id
      GROUP BY c.id, c.name, c.email
    `;

    // Get all active tiers ordered by minimum spend (highest first)
    const tiers = await sql`
      SELECT id, name, min_spend 
      FROM tiers 
      WHERE is_active = true 
      ORDER BY min_spend DESC
    `;

    let updatedCount = 0;

    for (const customer of customers.rows) {
      // Find the highest tier the customer qualifies for based on spending
      let newTierId = '';
      let newTierName = 'Unassigned';

      for (const tier of tiers.rows) {
        if (customer.total_spending >= tier.min_spend) {
          newTierId = tier.id;
          newTierName = tier.name;
          break;
        }
      }

      // Get current tier for comparison
      const currentTierResult = await sql`
        SELECT t.name as current_tier_name
        FROM customer_tiers ct
        LEFT JOIN tiers t ON ct.tier_id = t.id
        WHERE ct.customer_id = ${customer.id}
          AND ct.period_start <= CURRENT_DATE
          AND ct.period_end >= CURRENT_DATE
      `;

      const currentTierName = currentTierResult.rows[0]?.current_tier_name || 'Unassigned';

      // Only update if the tier has changed
      if (currentTierName !== newTierName) {
        // Remove previous active tier assignment
        await sql`
          UPDATE customer_tiers 
          SET period_end = CURRENT_DATE - INTERVAL '1 day'
          WHERE customer_id = ${customer.id} 
            AND period_end >= CURRENT_DATE
        `;

        // Add new tier assignment
        await sql`
          INSERT INTO customer_tiers (customer_id, tier_id, total_spend, period_start, period_end)
          VALUES (${customer.id}, ${newTierId}, ${customer.total_spending}, CURRENT_DATE, '2099-12-31')
        `;

        // Update customer record with new tier_id
        await sql`
          UPDATE customers 
          SET tier_id = ${newTierId} 
          WHERE id = ${customer.id}
        `;

        // Log tier change
        await sql`
          INSERT INTO transactions (customer_id, amount, reference)
          VALUES (${customer.id}, 0, 'Tier changed from "${currentTierName}" to "${newTierName}" based on reassessment')
        `;

        updatedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Reassessed tiers for ${customers.rows.length} customers, updated ${updatedCount} customers`,
    });
  } catch (error) {
    console.error('Cron error:', error);
    return NextResponse.json({ error: 'Failed to reassess tiers' }, { status: 500 });
  }
}