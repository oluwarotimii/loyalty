import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');

    let query = 'SELECT * FROM notifications ORDER BY created_at DESC LIMIT 100';
    let values: string[] = [];

    if (customerId) {
      query = 'SELECT * FROM notifications WHERE customer_id = $1 ORDER BY created_at DESC LIMIT 100';
      values = [customerId];
    }

    const result = values.length > 0 ? await sql.query(query, values) : await sql`SELECT * FROM notifications ORDER BY created_at DESC LIMIT 100`;
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { customerId, type, message } = await request.json();

    if (!customerId || !type || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await sql`
      INSERT INTO notifications (customer_id, type, message)
      VALUES (${customerId}, ${type}, ${message})
      RETURNING *
    `;

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 });
  }
}
