import { sql } from '@vercel/postgres';

// Export sql as pool to maintain compatibility
export const pool = sql;

export async function getCustomers() {
  const result = await sql`SELECT id, name, email, phone, points_balance, tier_id, created_at FROM customers ORDER BY created_at DESC`;
  return result.rows;
}

export async function getCustomerById(id: string) {
  const result = await sql`SELECT id, name, email, phone, points_balance, tier_id, created_at FROM customers WHERE id = ${id}`;
  return result.rows[0];
}

export async function createCustomer(name: string, email: string, phone?: string) {
  // Assign the lowest tier based on spend (typically the entry-level tier)
  const result = await sql`
    INSERT INTO customers (name, email, phone, points_balance, tier_id)
    VALUES (${name}, ${email}, ${phone || null}, 0, 
      (SELECT id FROM tiers WHERE is_active = true ORDER BY min_spend ASC LIMIT 1))
    RETURNING *
  `;
  return result.rows[0];
}

export async function updateCustomer(id: string, data: { name?: string; email?: string; phone?: string; points_balance?: number }) {
  const updates: string[] = [];
  const values: unknown[] = [];
  let paramCount = 1;

  if (data.name !== undefined) {
    updates.push(`name = $${paramCount++}`);
    values.push(data.name);
  }
  if (data.email !== undefined) {
    updates.push(`email = $${paramCount++}`);
    values.push(data.email);
  }
  if (data.phone !== undefined) {
    updates.push(`phone = $${paramCount++}`);
    values.push(data.phone);
  }
  if (data.points_balance !== undefined) {
    updates.push(`points_balance = $${paramCount++}`);
    values.push(data.points_balance);
  }

  if (updates.length === 0) return null;

  values.push(id);
  const query = `UPDATE customers SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING id, name, email, phone, points_balance, tier_id, created_at`;
  const result = await sql.query(query, values);
  return result.rows[0];
}

export async function deleteCustomer(id: string) {
  await sql`DELETE FROM customers WHERE id = ${id}`;
}

export async function getTransactions(customerId?: string) {
  if (customerId) {
    const result = await sql`SELECT * FROM transactions WHERE customer_id = ${customerId} ORDER BY created_at DESC`;
    return result.rows;
  }
  const result = await sql`SELECT * FROM transactions ORDER BY created_at DESC`;
  return result.rows;
}

export async function createTransaction(customerId: string, type: string, points: number, description: string) {
  const client = await sql.connect();
  try {
    await client.query('BEGIN');

    const result = await client.query(
      `INSERT INTO transactions (customer_id, type, points, description)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [customerId, type, points, description]
    );

    const customer = await client.query('SELECT points_balance FROM customers WHERE id = $1', [customerId]);
    const newBalance = (customer.rows[0]?.points_balance || 0) + points;

    await client.query('UPDATE customers SET points_balance = $1 WHERE id = $2', [newBalance, customerId]);
    
    // Update customer tier based on total spending
    const totalSpending = await client.query(`
      SELECT COALESCE(SUM(amount), 0) as total_spending
      FROM transactions
      WHERE customer_id = $1
    `, [customerId]);
    
    // Get the highest tier the customer qualifies for based on spending
    const tiers = await client.query(`
      SELECT id, min_spend
      FROM tiers
      WHERE is_active = true
      ORDER BY min_spend DESC
    `);
    
    let newTierId = '';
    for (const tier of tiers.rows) {
      if (totalSpending.rows[0].total_spending >= tier.min_spend) {
        newTierId = tier.id;
        break;
      }
    }
    
    // If no tier was found, assign the lowest tier
    if (!newTierId) {
      const lowestTier = await client.query(`
        SELECT id
        FROM tiers
        WHERE is_active = true
        ORDER BY min_spend ASC
        LIMIT 1
      `);
      newTierId = lowestTier.rows[0]?.id || '';
    }
    
    if (newTierId) {
      await client.query('UPDATE customers SET tier_id = $1 WHERE id = $2', [newTierId, customerId]);
    }
    
    await client.query('COMMIT');

    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}

export async function getTiers() {
  const result = await sql`
    SELECT
      t.id, t.name, t.min_spend, t.rank_order, t.evaluation_period, t.is_active,
      COALESCE(
        json_agg(
          json_build_object('id', tb.id, 'title', tb.title, 'description', tb.description)
          ORDER BY tb.title
        ) FILTER (WHERE tb.id IS NOT NULL),
        '[]'::json
      ) as benefits
    FROM tiers t
    LEFT JOIN tier_benefits tb ON t.id = tb.tier_id
    GROUP BY t.id, t.name, t.min_spend, t.rank_order, t.evaluation_period, t.is_active
    ORDER BY t.min_spend ASC
  `;

  return result.rows.map((row) => ({
    id: row.id,
    name: row.name,
    min_points: Number(row.min_spend), // Maintain backward compatibility
    max_points: null,          // No max_points in the schema
    min_spend: Number(row.min_spend),
    rank_order: row.rank_order,
    evaluation_period: row.evaluation_period,
    is_active: row.is_active,
    benefits: row.benefits,
  }));
}

export async function getTierBenefits(tierId: string) {
  const result = await sql`SELECT * FROM tier_benefits WHERE tier_id = ${tierId}`;
  return result.rows;
}

export async function createTier(tierData: {
  name: string;
  min_spend: number;
  rank_order: number;
  evaluation_period: string;
  is_active: boolean
}) {
  const result = await sql`
    INSERT INTO tiers (name, min_spend, rank_order, evaluation_period, is_active)
    VALUES (${tierData.name}, ${tierData.min_spend}, ${tierData.rank_order}, ${tierData.evaluation_period}, ${tierData.is_active})
    RETURNING *
  `;
  return result.rows[0];
}

export async function updateTier(id: string, tierData: Partial<{
  name: string;
  min_spend: number;
  rank_order: number;
  evaluation_period: string;
  is_active: boolean;
}>) {
  const updates: string[] = [];
  const values: unknown[] = [];
  let paramCount = 1;

  Object.entries(tierData).forEach(([key, value]) => {
    updates.push(`${key} = $${paramCount++}`);
    values.push(value);
  });

  if (updates.length === 0) return null;

  values.push(id);
  const query = `UPDATE tiers SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;
  const result = await sql.query(query, values);
  return result.rows[0];
}

export async function deleteTier(id: string) {
  const client = await sql.connect();
  try {
    await client.query('BEGIN');
    
    // Delete associated benefits first
    await client.query('DELETE FROM tier_benefits WHERE tier_id = $1', [id]);
    
    // Then delete the tier
    await client.query('DELETE FROM tiers WHERE id = $1', [id]);
    
    await client.query('COMMIT');
    return true;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}

export async function createTierBenefit(benefitData: { 
  tier_id: string; 
  title: string; 
  description?: string 
}) {
  const result = await sql`
    INSERT INTO tier_benefits (tier_id, title, description)
    VALUES (${benefitData.tier_id}, ${benefitData.title}, ${benefitData.description || null})
    RETURNING *
  `;
  return result.rows[0];
}

export async function updateTierBenefit(id: string, benefitData: Partial<{
  title: string;
  description?: string;
}>) {
  const updates: string[] = [];
  const values: unknown[] = [];
  let paramCount = 1;

  Object.entries(benefitData).forEach(([key, value]) => {
    updates.push(`${key} = $${paramCount++}`);
    values.push(value);
  });

  if (updates.length === 0) return null;

  values.push(id);
  const query = `UPDATE tier_benefits SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;
  const result = await sql.query(query, values);
  return result.rows[0];
}

export async function deleteTierBenefit(id: string) {
  await sql`DELETE FROM tier_benefits WHERE id = ${id}`;
}
