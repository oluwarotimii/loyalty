'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  total_points: number;
  total_spending: number;
  current_tier: string;
}

interface Transaction {
  id: string;
  transaction_type: string;
  points_amount: number;
  description: string;
  transaction_date: string;
}

interface TierInfo {
  name: string;
  min_points: number;
  max_points: number;
  benefits: string[];
}

export default function CustomerPortal() {
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tiers, setTiers] = useState<TierInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch customer data
        const customerRes = await fetch('/api/auth/customer');
        if (customerRes.status === 401) {
          router.push('/customer/login');
          return;
        }

        const customerData = await customerRes.json();
        setCustomer(customerData);

        // Fetch transactions
        if (customerData?.id) {
          const transRes = await fetch(`/api/transactions/${customerData.id}`);
          if (transRes.ok) {
            const transData = await transRes.json();
            setTransactions(transData);
          }

          // Fetch tiers
          const tiersRes = await fetch('/api/tiers');
          if (tiersRes.ok) {
            const tiersData = await tiersRes.json();
            setTiers(tiersData);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/customer/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Customer data not found</p>
          <Button onClick={handleLogout}>Logout</Button>
        </div>
      </div>
    );
  }

  const currentTier = tiers.find((t) => t.name === customer.current_tier);
  const nextTier = tiers.find((t) => t.min_points > customer.total_points);
  const pointsToNextTier = nextTier
    ? nextTier.min_points - customer.total_points
    : 0;
  const progressPercent = nextTier
    ? ((customer.total_points - (currentTier?.min_points || 0)) /
        (nextTier.min_points - (currentTier?.min_points || 0))) *
      100
    : 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground">My Rewards</h1>
            <p className="text-sm text-muted-foreground">{customer.name}</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Points Card */}
          <Card className="p-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Your Points</h2>
              <div className="text-5xl font-bold">{customer.total_points}</div>
              <p className="text-purple-100">Total loyalty points</p>
            </div>
          </Card>

          {/* Spending Card */}
          <Card className="p-6 bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Your Total Spending</h2>
              <div className="text-5xl font-bold">₦{customer.total_spending.toFixed(2)}</div>
              <p className="text-blue-100">Total spent with us</p>
            </div>
          </Card>

          {/* Tier Info */}
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Current Tier</h3>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl font-bold text-purple-600">
                    {customer.current_tier}
                  </span>
                  {nextTier && (
                    <span className="text-sm text-muted-foreground">
                      {pointsToNextTier} points to {nextTier.name}
                    </span>
                  )}
                </div>

                {nextTier && (
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-purple-600 h-3 rounded-full transition-all"
                      style={{ width: `${Math.min(progressPercent, 100)}%` }}
                    ></div>
                  </div>
                )}
              </div>

              {currentTier && currentTier.benefits.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">Tier Benefits</h4>
                  <ul className="space-y-1">
                    {currentTier.benefits.map((benefit, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground flex gap-2">
                        <span className="text-purple-600">✓</span>
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Card>

          {/* Transactions */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
            {transactions.length === 0 ? (
              <p className="text-muted-foreground text-sm">No transactions yet</p>
            ) : (
              <div className="space-y-3">
                {transactions.slice(0, 10).map((trans) => (
                  <div
                    key={trans.id}
                    className="flex justify-between items-center pb-3 border-b last:border-b-0 last:pb-0"
                  >
                    <div>
                      <p className="font-medium text-sm">{trans.transaction_type}</p>
                      <p className="text-xs text-muted-foreground">
                        {trans.description}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-semibold text-sm ${
                          trans.points_amount > 0
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {trans.points_amount > 0 ? '+' : ''}{trans.points_amount}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(trans.transaction_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* All Tiers */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">All Tiers</h3>
            <div className="space-y-3">
              {tiers.map((tier) => (
                <div
                  key={tier.name}
                  className={`p-4 rounded-lg border-2 ${
                    tier.name === customer.current_tier
                      ? 'border-purple-600 bg-purple-50'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold">{tier.name}</h4>
                    <span className="text-sm text-muted-foreground">
                      {tier.min_points}+ points
                    </span>
                  </div>
                  {tier.benefits.length > 0 && (
                    <ul className="text-xs space-y-1 text-muted-foreground">
                      {tier.benefits.slice(0, 2).map((benefit, idx) => (
                        <li key={idx}>• {benefit}</li>
                      ))}
                      {tier.benefits.length > 2 && (
                        <li>• +{tier.benefits.length - 2} more</li>
                      )}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
