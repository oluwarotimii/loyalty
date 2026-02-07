'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LoadingScreen from './loading-screen';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  total_amount: number;
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
  min_amount: number;
  max_amount: number;
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
    return <LoadingScreen />;
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
  const nextTier = tiers.find((t) => t.min_amount > customer.total_amount);
  const amountToNextTier = nextTier
    ? nextTier.min_amount - customer.total_amount
    : 0;
  const progressPercent = nextTier
    ? ((customer.total_amount - (currentTier?.min_amount || 0)) /
        (nextTier.min_amount - (currentTier?.min_amount || 0))) *
      100
    : 100;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky-mobile bg-card border-b">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground funnel-display-hero">My Rewards</h1>
            <p className="text-sm text-muted-foreground vend-sans-admin">{customer.name}</p>
          </div>
          <Button variant="outline" onClick={handleLogout} className="mobile-button">
            Logout
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-4 sm:py-6">
        <div className="space-y-mobile">
          {/* Amount Card */}
          <Card className="p-4 sm:p-6 bg-gradient-to-r from-medium-blue to-dusty-denim text-white mobile-card">
            <div className="space-y-3">
              <h2 className="text-base sm:text-lg font-semibold vend-sans-dashboard">Your Total Spending</h2>
              <div className="text-4xl sm:text-5xl font-bold">₦{Number(customer.total_amount).toFixed(2)}</div>
              <p className="text-blue-100 vend-sans-dashboard">Total VIP spending</p>
            </div>
          </Card>

          {/* Spending Card */}
          <Card className="p-4 sm:p-6 bg-gradient-to-r from-dusty-denim to-apricot-cream text-white mobile-card">
            <div className="space-y-3">
              <h2 className="text-base sm:text-lg font-semibold vend-sans-dashboard">Your Total Spending</h2>
              <div className="text-4xl sm:text-5xl font-bold">₦{Number(customer.total_amount).toFixed(2)}</div>
              <p className="text-blue-100 vend-sans-dashboard">Total spent with us</p>
            </div>
          </Card>

          {/* Tier Info */}
          <Card className="p-4 sm:p-6 mobile-card">
            <div className="space-y-3">
              <div>
                <h3 className="text-base sm:text-lg font-semibold mb-2 vend-sans-dashboard">Current Tier</h3>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 sm:mb-4 gap-2">
                  <span className="text-xl sm:text-2xl font-bold text-primary">
                    {customer.current_tier}
                  </span>
                  {nextTier && (
                    <span className="text-xs sm:text-sm text-muted-foreground vend-sans-dashboard">
                      ₦{amountToNextTier} to {nextTier.name}
                    </span>
                  )}
                </div>

                {nextTier && (
                  <div className="w-full bg-muted rounded-full h-2 sm:h-3">
                    <div
                      className="bg-primary h-2 sm:h-3 rounded-full transition-all"
                      style={{ width: `${Math.min(progressPercent, 100)}%` }}
                    ></div>
                  </div>
                )}
              </div>

              {currentTier && currentTier.benefits.length > 0 && (
                <div>
                  <h4 className="font-semibold text-xs sm:text-sm mb-2 vend-sans-dashboard">Tier Benefits</h4>
                  <ul className="space-y-1">
                    {currentTier.benefits.map((benefit, idx) => (
                      <li key={idx} className="text-xs sm:text-sm text-muted-foreground flex gap-2 vend-sans-dashboard">
                        <span className="text-primary">✓</span>
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Card>

          {/* Transactions */}
          <Card className="p-4 sm:p-6 mobile-card">
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 vend-sans-dashboard">Recent Activity</h3>
            {transactions.length === 0 ? (
              <p className="text-muted-foreground text-sm vend-sans-dashboard">No transactions yet</p>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {transactions.slice(0, 10).map((trans) => (
                  <div
                    key={trans.id}
                    className="flex justify-between items-center pb-2 border-b last:border-b-0 last:pb-0"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-xs sm:text-sm truncate vend-sans-dashboard">{trans.transaction_type}</p>
                      <p className="text-xs text-muted-foreground truncate vend-sans-dashboard">
                        {trans.description}
                      </p>
                    </div>
                    <div className="text-right min-w-[80px] ml-2">
                      <p
                        className={`font-semibold text-xs sm:text-sm ${
                          trans.points_amount > 0
                            ? 'text-green-600'
                            : 'text-red-600'
                        } vend-sans-dashboard`}
                      >
                        {trans.points_amount > 0 ? '+' : ''}{trans.points_amount}
                      </p>
                      <p className="text-xs text-muted-foreground vend-sans-dashboard">
                        {new Date(trans.transaction_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* All Tiers */}
          <Card className="p-4 sm:p-6 mobile-card">
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 vend-sans-dashboard">All Tiers</h3>
            <div className="space-y-2 sm:space-y-3">
              {tiers.map((tier) => (
                <div
                  key={tier.name}
                  className={`p-3 sm:p-4 rounded-lg border ${
                    tier.name === customer.current_tier
                      ? 'border-primary bg-primary/10'
                      : 'border-border'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-2 gap-1">
                    <h4 className="font-semibold text-sm vend-sans-dashboard">{tier.name}</h4>
                    <span className="text-xs sm:text-sm text-muted-foreground vend-sans-dashboard">
                      ₦{tier.min_amount}+ spending
                    </span>
                  </div>
                  {tier.benefits.length > 0 && (
                    <ul className="text-xs space-y-1 text-muted-foreground vend-sans-dashboard">
                      {tier.benefits.slice(0, 2).map((benefit, idx) => (
                        <li key={idx} className="truncate">• {benefit}</li>
                      ))}
                      {tier.benefits.length > 2 && (
                        <li className="truncate">• +{tier.benefits.length - 2} more</li>
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
