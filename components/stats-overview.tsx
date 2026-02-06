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

interface StatsOverviewProps {
  customers: Customer[];
}

export default function StatsOverview({ customers }: StatsOverviewProps) {
  const totalCustomers = customers.length;
  const totalSpending = customers.reduce((sum, c) => sum + Number(c.total_spending), 0);
  const avgSpending = totalCustomers > 0 ? Math.floor(totalSpending / totalCustomers) : 0;
  const topCustomer = customers.length > 0 ? customers.reduce((max, c) => (Number(c.total_spending) > Number(max.total_spending) ? c : max)) : null;

  const stats = [
    { label: 'Total Customers', value: totalCustomers, icon: '👥' },
    // { label: 'Total Spending', value: `₦${totalSpending.toLocaleString()}`, icon: '💰' },
    // { label: 'Average Spending', value: `₦${avgSpending}`, icon: '📊' },
    { label: 'Top Customer', value: topCustomer?.name || 'N/A', icon: '🏆' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, i) => (
        <Card key={i} className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">{stat.label}</p>
              <p className="text-2xl font-bold mt-1">{stat.value}</p>
            </div>
            <span className="text-3xl">{stat.icon}</span>
          </div>
        </Card>
      ))}
    </div>
  );
}
