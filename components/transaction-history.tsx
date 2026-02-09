'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { DollarSign } from 'lucide-react';

interface Transaction {
  id: string;
  customer_id: string;
  amount: number;
  reference: string;
  created_at: string;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  total_spending: number;
  tier_id: string;
  created_at: string;
}

interface TransactionHistoryProps {
  customerId: string;
}

export default function TransactionHistory({ customerId }: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch customer data
        const customerResponse = await fetch(`/api/customers?id=${customerId}`);
        if (customerResponse.ok) {
          const customerData = await customerResponse.json();
          setCustomer(customerData);
        }

        // Fetch transactions
        const transactionsResponse = await fetch(`/api/transactions/${customerId}`);
        if (transactionsResponse.ok) {
          const transactionsData = await transactionsResponse.json();
          setTransactions(transactionsData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [customerId]);


  return (
    <Card className="p-3 mobile-card">
      <h3 className="text-lg font-bold mb-2">Transaction History</h3>
      {customer && (
        <p className="text-sm text-muted-foreground mb-3">For: {customer.name}</p>
      )}
      {loading ? (
        <p className="text-muted-foreground text-center py-4">Loading...</p>
      ) : transactions.length === 0 ? (
        <p className="text-muted-foreground text-center py-4">No transactions yet</p>
      ) : (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {transactions.map((tx) => {
            return (
              <div key={tx.id} className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-accent/50 transition touch-target">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="text-lg"><DollarSign className="w-5 h-5" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold capitalize truncate text-gray-600">Transaction</p>
                    {tx.reference && <p className="text-xs text-muted-foreground truncate">{tx.reference}</p>}
                  </div>
                </div>
                <div className="text-right min-w-[80px]">
                  <p className={`font-bold truncate ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ₦{tx.amount}
                  </p>
                  <p className="text-xs text-muted-foreground">{new Date(tx.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
