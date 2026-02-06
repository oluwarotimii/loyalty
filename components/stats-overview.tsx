'use client';

import { Card } from '@/components/ui/card';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  points_balance: number;
  tier_id: string;
  created_at: string;
}

interface StatsOverviewProps {
  customers: Customer[];
}

export default function StatsOverview({ customers }: StatsOverviewProps) {
  const totalCustomers = customers.length;
  const totalPoints = customers.reduce((sum, c) => sum + c.points_balance, 0);
  const avgPoints = totalCustomers > 0 ? Math.floor(totalPoints / totalCustomers) : 0;
  const topCustomer = customers.length > 0 ? customers.reduce((max, c) => (c.points_balance > max.points_balance ? c : max)) : null;

  const stats = [
    { label: 'Total Customers', value: totalCustomers, icon: '👥' },
    { label: 'Total Points', value: totalPoints.toLocaleString(), icon: '⭐' },
    { label: 'Average Points', value: avgPoints, icon: '📊' },
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
