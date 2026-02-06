'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';

interface Transaction {
  id: string;
  customer_id: string;
  type: string;
  points: number;
  description?: string;
  created_at: string;
}

interface TransactionHistoryProps {
  customerId: string;
}

export default function TransactionHistory({ customerId }: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await fetch(`/api/transactions/${customerId}`);
        if (response.ok) {
          const data = await response.json();
          setTransactions(data);
        }
      } catch (error) {
        console.error('Error fetching transactions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [customerId]);

  const getTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      purchase: 'text-blue-600',
      referral: 'text-green-600',
      bonus: 'text-purple-600',
      redemption: 'text-red-600',
    };
    return colors[type] || 'text-gray-600';
  };

  const getTypeIcon = (type: string) => {
    const icons: { [key: string]: string } = {
      purchase: '🛍️',
      referral: '👥',
      bonus: '⭐',
      redemption: '🎁',
    };
    return icons[type] || '💰';
  };

  return (
    <Card className="p-4">
      <h3 className="text-lg font-bold mb-4">Transaction History</h3>
      {loading ? (
        <p className="text-muted-foreground text-center py-4">Loading...</p>
      ) : transactions.length === 0 ? (
        <p className="text-muted-foreground text-center py-4">No transactions yet</p>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {transactions.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-accent/50 transition">
              <div className="flex items-center gap-3 flex-1">
                <span className="text-xl">{getTypeIcon(tx.type)}</span>
                <div className="flex-1">
                  <p className={`font-semibold capitalize ${getTypeColor(tx.type)}`}>{tx.type}</p>
                  {tx.description && <p className="text-xs text-muted-foreground">{tx.description}</p>}
                </div>
              </div>
              <div className="text-right">
                <p className={`font-bold ${tx.points > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {tx.points > 0 ? '+' : ''}{tx.points}
                </p>
                <p className="text-xs text-muted-foreground">{new Date(tx.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
