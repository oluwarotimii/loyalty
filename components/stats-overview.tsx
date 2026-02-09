'use client';

import { Card } from '@/components/ui/card';
import { Users, DollarSign, TrendingUp, Crown } from 'lucide-react';
import { formatNumberWithCommas } from '@/lib/db';

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
    { label: 'Total Customers', value: formatNumberWithCommas(totalCustomers), icon: <Users className="w-5 h-5 sm:w-6 sm:h-6" /> },
    // { label: 'Total Spending', value: `₦${totalSpending.toLocaleString()}`, icon: <DollarSign className="w-5 h-5 sm:w-6 sm:h-6" /> },
    // { label: 'Avg. Spending', value: `₦${avgSpending.toLocaleString()}`, icon: <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" /> },
    { label: 'Top Customer', value: topCustomer?.name || 'N/A', icon: <Crown className="w-5 h-5 sm:w-6 sm:h-6" /> },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 stats-grid">
      {stats.map((stat, i) => (
        <Card key={i} className="p-3 mobile-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-xs sm:text-sm">{stat.label}</p>
              <p className="text-lg sm:text-xl font-normal mt-1">{stat.value}</p>
            </div>
            <div className="text-foreground">{stat.icon}</div>
          </div>
        </Card>
      ))}
    </div>
  );
}
