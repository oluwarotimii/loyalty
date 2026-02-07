'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LoadingScreen from './loading-screen';
import Leaderboard from './leaderboard';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  date_of_birth?: string;
  address?: string;
  total_amount?: number;
  total_spending?: number;
  current_tier?: string;
  tier_id?: string;
  created_at?: string;
}

interface Transaction {
  id: string;
  customer_id: string;
  amount: number;
  reference: string;
  created_at: string;
}

interface TierInfo {
  id: string;
  name: string;
  min_amount: number;
  max_amount: number;
  min_spend?: number;
  max_spend?: number;
  rank_order?: number;
  evaluation_period?: string;
  is_active?: boolean;
  benefits: Array<{
    id?: string;
    title?: string;
    description?: string;
  } | string>;
}

export default function CustomerPortal() {
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tiers, setTiers] = useState<TierInfo[]>([]);
  const [allCustomers, setAllCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const dobInputRef = useRef<HTMLInputElement>(null);
  const addressInputRef = useRef<HTMLInputElement>(null);

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

          // Fetch all customers for leaderboard
          const customersRes = await fetch('/api/customers');
          if (customersRes.ok) {
            const customersData = await customersRes.json();
            setAllCustomers(customersData);
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

  async function handleUpdateInfo(updates: { date_of_birth?: string; address?: string }) {
    try {
      const response = await fetch(`/api/customers/${customer?.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        // Refresh customer data
        const updatedCustomer = await response.json();
        setCustomer(prevCustomer => prevCustomer ? {...prevCustomer, ...updatedCustomer} : updatedCustomer);
        // Optionally show a success message
      } else {
        console.error('Failed to update customer info');
      }
    } catch (error) {
      console.error('Error updating customer info:', error);
    }
  }

  async function handleSaveInfo() {
    if (!customer) return;
    
    const dobValue = dobInputRef.current?.value;
    const addressValue = addressInputRef.current?.value;
    
    const updates: { date_of_birth?: string; address?: string } = {};
    
    if (dobValue !== undefined && dobValue !== customer.date_of_birth) {
      updates.date_of_birth = dobValue;
    }
    
    if (addressValue !== undefined && addressValue !== customer.address) {
      updates.address = addressValue;
    }
    
    if (Object.keys(updates).length > 0) {
      await handleUpdateInfo(updates);
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

  // Determine current tier from the API response
  let currentTierName = customer.current_tier || 'Unassigned';
  let currentTier = null;

  // Find the tier based on the tier_id from the API response
  if (customer.tier_id) {
    currentTier = tiers.find(t => t.id === customer.tier_id);
  } else {
    // Fallback: find tier by name if tier_id is not available
    currentTier = tiers.find(t => t.name === currentTierName);
  }

  // If still no tier found, try to determine based on spending
  if (!currentTier && currentTierName !== 'Unassigned') {
    currentTier = tiers.find((t) => t.name === currentTierName);
  }
  const customerSpending = customer.total_spending || customer.total_amount || 0;
  const nextTier = tiers.find((t) => t.min_amount > customerSpending && (t.min_amount || 0) > (currentTier?.min_amount || 0));
  const amountToNextTier = nextTier
    ? (nextTier.min_amount || 0) - customerSpending
    : 0;
  const progressPercent = nextTier && currentTier
    ? ((customerSpending - (currentTier.min_amount || 0)) /
        ((nextTier.min_amount || 0) - (currentTier.min_amount || 0))) *
      100
    : 100;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky-mobile bg-card border-b">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground funnel-display-hero">My Rewards</h1>
            <p className="text-sm text-primary vend-sans-admin">Welcome, {customer.name || 'Valued Customer'}!</p>
            {customer.phone && (
              <p className="text-xs text-muted-foreground vend-sans-admin">Phone: {customer.phone}</p>
            )}
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
              <div className="text-4xl sm:text-5xl font-bold">₦{Number(customer.total_spending || customer.total_amount || 0).toFixed(2)}</div>
              <p className="text-blue-100 vend-sans-dashboard">Total VIP spending</p>
            </div>
          </Card>

          {/* Spending Card */}
          <Card className="p-4 sm:p-6 bg-gradient-to-r from-dusty-denim to-apricot-cream text-black mobile-card">
            <div className="space-y-3">
              <h2 className="text-base sm:text-lg font-semibold vend-sans-dashboard">Your Total Spending</h2>
              <div className="text-4xl sm:text-5xl font-bold">₦{Number(customer.total_spending || customer.total_amount || 0).toFixed(2)}</div>
              <p className="text-gray-700 vend-sans-dashboard">Total spent with us</p>
            </div>
          </Card>

          {/* Tier Info */}
          <Card className="p-4 sm:p-6 mobile-card">
            <div className="space-y-3">
              <div>
                <h3 className="text-base sm:text-lg font-semibold mb-2 vend-sans-dashboard">Current Tier</h3>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 sm:mb-4 gap-2">
                  <span className="text-xl sm:text-2xl font-bold text-primary">
                    {currentTierName}
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
                      <p className="font-medium text-xs sm:text-sm truncate vend-sans-dashboard">Purchase</p>
                      <p className="text-xs text-muted-foreground truncate vend-sans-dashboard">
                        {trans.reference || 'Transaction'}
                      </p>
                    </div>
                    <div className="text-right min-w-[80px] ml-2">
                      <p
                        className={`font-semibold text-xs sm:text-sm ${
                          trans.amount > 0
                            ? 'text-green-600'
                            : 'text-red-600'
                        } vend-sans-dashboard`}
                      >
                        {trans.amount > 0 ? '+' : ''}{trans.amount.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground vend-sans-dashboard">
                        {new Date(trans.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Personal Information */}
          <Card className="p-4 sm:p-6 mobile-card">
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 vend-sans-dashboard">Personal Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 vend-sans-dashboard">Date of Birth</label>
                {customer.date_of_birth ? (
                  <p className="text-sm vend-sans-dashboard">{new Date(customer.date_of_birth).toLocaleDateString()}</p>
                ) : (
                  <p className="text-sm text-muted-foreground vend-sans-dashboard">Not provided</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 vend-sans-dashboard">Address</label>
                {customer.address ? (
                  <p className="text-sm vend-sans-dashboard">{customer.address}</p>
                ) : (
                  <p className="text-sm text-muted-foreground vend-sans-dashboard">Not provided</p>
                )}
              </div>
            </div>
            
            {/* Update Personal Information Form */}
            <div className="mt-4 pt-4 border-t border-border">
              <h4 className="text-sm font-semibold mb-2 vend-sans-dashboard">Update Information</h4>
              <div className="space-y-3">
                <div>
                  <label htmlFor="dob" className="block text-xs font-medium mb-1 vend-sans-dashboard">Date of Birth</label>
                  <input
                    type="date"
                    id="dob"
                    ref={dobInputRef}
                    defaultValue={customer.date_of_birth || ''}
                    className="w-full px-3 py-2 text-sm border border-input rounded-md vend-sans-dashboard bg-background"
                  />
                </div>
                <div>
                  <label htmlFor="address" className="block text-xs font-medium mb-1 vend-sans-dashboard">Address</label>
                  <input
                    type="text"
                    id="address"
                    ref={addressInputRef}
                    defaultValue={customer.address || ''}
                    placeholder="Enter your address"
                    className="w-full px-3 py-2 text-sm border border-input rounded-md vend-sans-dashboard bg-background"
                  />
                </div>
                <Button 
                  type="button" 
                  onClick={handleSaveInfo}
                  className="w-full sm:w-auto"
                >
                  Save Information
                </Button>
              </div>
            </div>
          </Card>

          {/* All Tiers */}
          <Card className="p-4 sm:p-6 mobile-card">
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 vend-sans-dashboard">All Tiers</h3>
            <div className="space-y-2 sm:space-y-3">
              {tiers.map((tier) => (
                <div
                  key={tier.id}
                  className={`p-3 sm:p-4 rounded-lg border ${
                    tier.name === currentTierName
                      ? 'border-primary bg-primary/10'
                      : 'border-border'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-2 gap-1">
                    <h4 className="font-semibold text-sm vend-sans-dashboard">{tier.name}</h4>
                    <span className="text-xs sm:text-sm text-muted-foreground vend-sans-dashboard">
                      ₦{tier.min_amount?.toLocaleString()}+ spending
                    </span>
                  </div>
                  {tier.benefits && tier.benefits.length > 0 && (
                    <ul className="text-xs space-y-1 text-muted-foreground vend-sans-dashboard">
                      {tier.benefits.map((benefit: any, idx: number) => (
                        <li key={idx} className="truncate">
                          • {typeof benefit === 'string' ? benefit : benefit.title || benefit.description}
                        </li>
                      ))}
                    </ul>
                  )}
                  {(!tier.benefits || tier.benefits.length === 0) && (
                    <p className="text-xs text-muted-foreground vend-sans-dashboard">No specific benefits defined</p>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* Leaderboard */}
          <Card className="p-4 sm:p-6 mobile-card">
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 vend-sans-dashboard">Tier Leaderboard</h3>
            <Leaderboard
              customers={allCustomers.map(c => ({
                ...c,
                total_spending: c.total_spending ?? c.total_amount ?? 0,
                total_amount: c.total_amount ?? c.total_spending ?? 0
              }))}
              initialTiers={tiers}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}
