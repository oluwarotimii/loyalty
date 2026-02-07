import { sql } from '@vercel/postgres';

// Export sql as pool to maintain compatibility
export const pool = sql;

export async function getCustomers() {
  // Get customers with their total spending and current tier
  const result = await sql`
    SELECT
      c.id,
      c.name,
      c.phone,
      c.email,
      c.date_of_birth,
      c.address,
      c.created_at,
      COALESCE(ct.total_spend, 0) AS total_spending,
      ct.tier_id,
      t.name AS current_tier
    FROM customers c
    LEFT JOIN customer_tiers ct ON c.id = ct.customer_id
      AND ct.period_start <= CURRENT_DATE
      AND ct.period_end >= CURRENT_DATE
    LEFT JOIN tiers t ON ct.tier_id = t.id
    ORDER BY c.created_at DESC
  `;

  return result.rows;
}

export async function getCustomerById(id: string) {
  const result = await sql`
    SELECT
      c.id,
      c.name,
      c.phone,
      c.email,
      c.date_of_birth,
      c.address,
      c.created_at,
      COALESCE(ct.total_spend, 0) AS total_spending,
      ct.tier_id,
      t.name AS current_tier
    FROM customers c
    LEFT JOIN customer_tiers ct ON c.id = ct.customer_id
      AND ct.period_start <= CURRENT_DATE
      AND ct.period_end >= CURRENT_DATE
    LEFT JOIN tiers t ON ct.tier_id = t.id
    WHERE c.id = ${id}
  `;

  const customer = result.rows[0];
  if (!customer) return null;

  return customer;
}

export async function createCustomer(name: string, email: string, phone: string, initialSpending: number = 0) {
  const client = await sql.connect();
  try {
    await client.query('BEGIN');

    // Insert the customer
    const customerResult = await client.query(`
      INSERT INTO customers (name, phone, email)
      VALUES ($1, $2, $3)
      RETURNING id, name, phone, email, created_at
    `, [name, phone, email || null]);

    const customer = customerResult.rows[0];

    // Get the highest tier the customer qualifies for based on initial spending
    const tiers = await client.query(`
      SELECT id, min_spend
      FROM tiers
      WHERE is_active = true
      ORDER BY min_spend DESC
    `);

    let assignedTierId = '';
    for (const tier of tiers.rows) {
      if (initialSpending >= Number(tier.min_spend)) {
        assignedTierId = tier.id;
        break;
      }
    }

    // If no tier was found, assign the lowest tier
    if (!assignedTierId) {
      const lowestTier = await client.query(`
        SELECT id
        FROM tiers
        WHERE is_active = true
        ORDER BY min_spend ASC
        LIMIT 1
      `);
      assignedTierId = lowestTier.rows[0]?.id || '';
    }

    // If a tier was found, create a customer_tier record
    if (assignedTierId) {
      const periodStart = new Date();
      const periodEnd = new Date();
      periodEnd.setFullYear(periodStart.getFullYear() + 1); // Annual evaluation period

      await client.query(`
        INSERT INTO customer_tiers (customer_id, tier_id, total_spend, period_start, period_end)
        VALUES ($1, $2, $3, $4, $5)
      `, [customer.id, assignedTierId, initialSpending, periodStart, periodEnd]);
    }

    // If initial spending is greater than 0, create a transaction record
    if (initialSpending > 0) {
      await client.query(`
        INSERT INTO transactions (customer_id, amount, reference)
        VALUES ($1, $2, $3)
      `, [customer.id, initialSpending, 'Initial spending from import']);
    }

    await client.query('COMMIT');

    // Return the full customer data with tier information
    const fullCustomer = await getCustomerById(customer.id);
    return fullCustomer;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}

export async function updateCustomer(id: string, data: {
  name?: string;
  email?: string;
  phone?: string;
  total_spending?: number;
  date_of_birth?: string;
  address?: string;
}) {
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
  if (data.date_of_birth !== undefined) {
    updates.push(`date_of_birth = $${paramCount++}`);
    values.push(data.date_of_birth);
  }
  if (data.address !== undefined) {
    updates.push(`address = $${paramCount++}`);
    values.push(data.address);
  }

  if (updates.length === 0) return null;

  values.push(id);
  const query = `UPDATE customers SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING id`;
  const result = await sql.query(query, values);

  // Get the updated customer with their total spending and tier information
  const updatedCustomer = await getCustomerById(id);
  return updatedCustomer;
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

export async function createTransaction(customerId: string, amount: number, reference: string, type: string = 'purchase') {
  const client = await sql.connect();
  try {
    await client.query('BEGIN');

    // Insert transaction using amount column
    // Using reference column for description since that's what's available in the schema
    const result = await client.query(
      `INSERT INTO transactions (customer_id, amount, reference, type)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [customerId, amount, reference || '', type]
    );

    // Calculate new total spending for the customer
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
      if (Number(totalSpending.rows[0].total_spending) >= Number(tier.min_spend)) {
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
      // Update or create customer_tier record
      const periodStart = new Date();
      const periodEnd = new Date();
      periodEnd.setFullYear(periodStart.getFullYear() + 1); // Annual evaluation period

      // Check if there's an existing active customer_tier record
      const existingRecord = await client.query(`
        SELECT id FROM customer_tiers
        WHERE customer_id = $1
        AND period_start <= $2
        AND period_end >= $2
      `, [customerId, new Date()]);

      if (existingRecord.rows.length > 0) {
        // Update existing record
        await client.query(`
          UPDATE customer_tiers
          SET tier_id = $1, total_spend = $2, last_evaluated_at = $3
          WHERE customer_id = $4
          AND period_start <= $5
          AND period_end >= $5
        `, [newTierId, Number(totalSpending.rows[0].total_spending), new Date(), customerId, new Date()]);
      } else {
        // Create new record
        await client.query(`
          INSERT INTO customer_tiers (customer_id, tier_id, total_spend, period_start, period_end, last_evaluated_at)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [customerId, newTierId, Number(totalSpending.rows[0].total_spending), periodStart, periodEnd, new Date()]);
      }
    }

    await client.query('COMMIT');

    // Return the transaction along with updated customer info
    const updatedCustomer = await getCustomerById(customerId);
    
    return {
      ...result.rows[0],
      customer_info: updatedCustomer
    };
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
    min_amount: Number(row.min_spend), // Amount-based model
    max_amount: null,          // No max_amount in the schema
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
