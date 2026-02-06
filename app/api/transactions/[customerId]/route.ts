import { NextRequest, NextResponse } from 'next/server';
import { getTransactions } from '@/lib/db';

export async function GET(request: NextRequest, { params }: { params: Promise<{ customerId: string }> }) {
  try {
    const { customerId } = await params;
    const transactions = await getTransactions(customerId);
    return NextResponse.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}
