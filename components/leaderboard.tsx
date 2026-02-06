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
    <Card className="p-3 mobile-card">
      <h2 className="text-lg font-bold mb-3 vend-sans-dashboard">Top Customers</h2>
      <div className="space-y-2">
        {sorted.length === 0 ? (
          <p className="text-muted-foreground text-center py-6">No customers yet</p>
        ) : (
          sorted.map((customer, index) => (
            <div key={customer.id} className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-accent/50 transition touch-target">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs sm:text-sm">
                  {index + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold truncate">{customer.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{customer.email}</p>
                </div>
              </div>
              <div className="text-right min-w-[80px] ml-2">
                <p className="font-bold">₦{Number(customer.total_spending).toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">spent</p>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
