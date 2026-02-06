'use client';

import { Card } from '@/components/ui/card';
import { Users, DollarSign, TrendingUp, Crown } from 'lucide-react';

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
    { label: 'Total Customers', value: totalCustomers, icon: <Users className="w-6 h-6 sm:w-8 sm:h-8" /> },
    { label: 'Top Customer', value: topCustomer?.name || 'N/A', icon: <Crown className="w-6 h-6 sm:w-8 sm:h-8" /> },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 stats-grid">
      {stats.map((stat, i) => (
        <Card key={i} className="p-3 mobile-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-xs sm:text-sm vend-sans-admin">{stat.label}</p>
              <p className="text-xl sm:text-2xl font-normal mt-1 vend-sans-admin">{stat.value}</p>
            </div>
            <div className="text-foreground">{stat.icon}</div>
          </div>
        </Card>
      ))}
    </div>
  );
}
