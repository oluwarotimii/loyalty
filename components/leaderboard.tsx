'use client';

import { Card } from '@/components/ui/card';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  total_spending: number;
  tier_id: string;
  created_at: string;
}

interface LeaderboardProps {
  customers: Customer[];
}

export default function Leaderboard({ customers }: LeaderboardProps) {
  const sorted = [...customers].sort((a, b) => b.total_spending - a.total_spending);

  return (
    <Card className="p-4">
      <h2 className="text-xl font-bold mb-4">Top Customers</h2>
      <div className="space-y-2">
        {sorted.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No customers yet</p>
        ) : (
          sorted.map((customer, index) => (
            <div key={customer.id} className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-accent/50 transition">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                  {index + 1}
                </div>
                <div>
                  <p className="font-semibold">{customer.name}</p>
                  <p className="text-xs text-muted-foreground">{customer.email}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg">₦{Number(customer.total_spending).toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">spent</p>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
