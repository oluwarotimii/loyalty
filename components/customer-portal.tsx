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
  type: string;
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

interface CustomerPortalProps {
  allCustomers?: any[];
  initialTiers?: any[];
}

export default function CustomerPortal({ allCustomers = [], initialTiers = [] }: CustomerPortalProps) {
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tiers, setTiers] = useState<TierInfo[]>([]);
  const [allCustomersState, setAllCustomersState] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
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
        console.log('Customer data received:', customerData);
        setCustomer(customerData);

        // Fetch transactions
        if (customerData?.id) {
          const transRes = await fetch(`/api/transactions/${customerData.id}`);
          if (transRes.ok) {
            const transData = await transRes.json();
            setTransactions(transData);
          }
        }

        // Use passed props if available, otherwise fetch
        if (initialTiers.length > 0) {
          console.log('Using passed tiers:', initialTiers);
          setTiers(initialTiers);
        } else {
          const tiersRes = await fetch('/api/tiers');
          if (tiersRes.ok) {
            const tiersData = await tiersRes.json();
            console.log('Fetched tiers:', tiersData);
            setTiers(tiersData);
          }
        }

        if (allCustomers.length > 0) {
          // Use passed customers if available
          console.log('Using passed customers:', allCustomers);
          setAllCustomersState(allCustomers);
        } else {
          // Fetch all customers for leaderboard
          const customersRes = await fetch('/api/customers');
          if (customersRes.ok) {
            const customersData = await customersRes.json();
            console.log('Fetched all customers:', customersData);
            setAllCustomersState(customersData);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router, allCustomers, initialTiers]);

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
    
    // Reset editing state after saving
    setIsEditing(false);
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

  // Store customer data in a variable accessible to the leaderboard
  const customerData = customer;

  // Determine current tier from the API response
  let currentTierName = customer.current_tier || 'Unassigned';
  let currentTier = null;

  console.log('Customer data for tier calculation:', { 
    customer, 
    tiers, 
    currentTierName 
  });

  // Find the tier based on the tier_id from the API response
  if (customer.tier_id) {
    currentTier = tiers.find(t => t.id === customer.tier_id);
    console.log('Found tier by ID:', currentTier);
  } else {
    // Fallback: find tier by name if tier_id is not available
    currentTier = tiers.find(t => t.name === currentTierName);
    console.log('Found tier by name:', currentTier);
  }

  // If still no tier found, try to determine based on spending
  if (!currentTier && currentTierName !== 'Unassigned') {
    currentTier = tiers.find((t) => t.name === currentTierName);
    console.log('Found tier by name fallback:', currentTier);
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
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">My Rewards</h1>
            <p className="text-sm text-primary">Welcome, {customer.name || 'Valued Customer'}!</p>
            {customer.phone && (
              <p className="text-xs text-muted-foreground">Phone: {customer.phone}</p>
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
          {/* <Card className="p-4 sm:p-6 bg-gradient-to-r from-medium-blue to-dusty-denim text-black mobile-card">
            <div className="space-y-3">
              <h2 className="text-blue sm:text-lg font-semibold">Your Total Spending</h2>
              <div className="text-4xl sm:text-5xl font-bold">₦{Number(customer.total_spending || customer.total_amount || 0).toFixed(2)}</div>
              <p className="text-white/80">Total VIP spending</p>
            </div>
          </Card> */}

          {/* Spending Card */}
          <Card className="p-4 sm:p-6 bg-gradient-to-r from-dusty-denim to-apricot-cream text-black mobile-card">
            <div className="space-y-3">
              <h2 className="text-blue sm:text-lg font-semibold">Your Total Spending</h2>
              <div className="text-4xl sm:text-5xl font-bold">₦{Number(customer.total_spending || customer.total_amount || 0).toFixed(2)}</div>
              <p className="text-gray-700">Total spent with us</p>
            </div>
          </Card>

          {/* Tier Info */}
          <Card className="p-4 sm:p-6 mobile-card">
            <div className="space-y-3">
              <div>
                <h3 className="text-base sm:text-lg font-semibold mb-2">Current Tier</h3>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 sm:mb-4 gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl sm:text-2xl font-bold text-primary">
                      Current Tier:
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {currentTierName}
                    </span>
                  </div>
                  {nextTier && (
                    <span className="text-xs sm:text-sm text-muted-foreground">
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
                  <h4 className="font-semibold text-xs sm:text-sm mb-2">Tier Benefits</h4>
                  <ul className="space-y-1">
                    {currentTier.benefits.map((benefit, idx) => (
                      <li key={idx} className="text-xs sm:text-sm text-muted-foreground flex gap-2">
                        <span className="text-primary">✓</span>
                        {typeof benefit === 'string' ? benefit : benefit.title || benefit.description}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Card>

          {/* Transactions */}
          <Card className="p-4 sm:p-6 mobile-card">
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Recent Activity</h3>
            {transactions.length === 0 ? (
              <p className="text-muted-foreground text-sm">No transactions yet</p>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {transactions.slice(0, 10).map((trans) => (
                  <div
                    key={trans.id}
                    className="flex justify-between items-center pb-2 border-b last:border-b-0 last:pb-0"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-xs sm:text-sm truncate">{trans.type || 'Purchase'}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {trans.reference || 'Transaction'}
                      </p>
                    </div>
                    <div className="text-right min-w-[80px] ml-2">
                      <p
                        className={`font-semibold text-xs sm:text-sm ${
                          Number(trans.amount) > 0
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {Number(trans.amount) > 0 ? '+' : ''}{Number(trans.amount).toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">
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
            <div className="flex justify-between items-center mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-semibold">Personal Information</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
                className="text-xs sm:text-sm"
              >
                {isEditing ? 'Cancel' : 'Edit'}
              </Button>
            </div>
            
            {/* Display Information */}
            <div className={`${isEditing ? 'hidden' : 'block'} grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4`}>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <p className="text-sm">{customer.email || 'Not provided'}</p>
                {!customer.email && (
                  <p className="text-xs text-muted-foreground mt-1">Email is required for account verification</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <p className="text-sm">{customer.phone || 'Not provided'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date of Birth</label>
                {customer.date_of_birth ? (
                  <p className="text-sm">{new Date(customer.date_of_birth).toLocaleDateString()}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">Not provided</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Address</label>
                {customer.address ? (
                  <p className="text-sm">{customer.address}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">Not provided</p>
                )}
              </div>
            </div>

            {/* Update Personal Information Form */}
            <div className={`${isEditing ? 'block' : 'hidden'} pt-4 border-t border-border`}>
              <h4 className="text-sm font-semibold mb-2">Update Information</h4>
              <p className="text-xs text-muted-foreground mb-3">Note: Email cannot be changed after account creation</p>
              <div className="space-y-3">
                <div>
                  <label htmlFor="dob" className="block text-xs font-medium mb-1">Date of Birth</label>
                  <input
                    type="date"
                    id="dob"
                    ref={dobInputRef}
                    defaultValue={customer.date_of_birth || ''}
                    className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background"
                  />
                </div>
                <div>
                  <label htmlFor="address" className="block text-xs font-medium mb-1">Address</label>
                  <input
                    type="text"
                    id="address"
                    ref={addressInputRef}
                    defaultValue={customer.address || ''}
                    placeholder="Enter your address"
                    className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={handleSaveInfo}
                    className="w-full sm:w-auto"
                  >
                    Save Information
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* All Tiers */}
          <Card className="p-4 sm:p-6 mobile-card">
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">All Tiers</h3>
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
                    <h4 className="font-semibold text-sm">{tier.name}</h4>
                    <span className="text-xs sm:text-sm text-muted-foreground">
                      ₦{tier.min_amount?.toLocaleString()}+ spending
                    </span>
                  </div>
                  {tier.benefits && tier.benefits.length > 0 && (
                    <ul className="text-xs space-y-1 text-muted-foreground">
                      {tier.benefits.map((benefit: any, idx: number) => (
                        <li key={idx} className="truncate">
                          • {typeof benefit === 'string' ? benefit : benefit.title || benefit.description}
                        </li>
                      ))}
                    </ul>
                  )}
                  {(!tier.benefits || tier.benefits.length === 0) && (
                    <p className="text-xs text-muted-foreground">No specific benefits defined</p>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* Leaderboard */}
          <Card className="p-4 sm:p-6 mobile-card">
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Tier Leaderboard</h3>
            <div className="space-y-6">
              {/* Current Tier Leaderboard */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-md font-semibold text-primary">Tier</h3>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {currentTierName}
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {allCustomersState.filter(c => c.current_tier === currentTierName).length} members
                  </span>
                </div>
                <Card className="p-3 mobile-card">
                  <div className="space-y-2">
                    {console.log('All customers for leaderboard:', { 
                      allCustomersState, 
                      currentTierName, 
                      filteredCustomers: allCustomersState.filter(c => c.current_tier === currentTierName) 
                    })}
                    {allCustomersState
                      .filter(c => c.current_tier === currentTierName)
                      .sort((a, b) => (b.total_spending || b.total_amount || 0) - (a.total_spending || a.total_amount || 0))
                      .map((customer, index) => {
                        const isCurrentUser = customer.id === customerData.id;
                        return (
                          <div
                            key={customer.id}
                            className={`flex items-center justify-between p-3 border border-border rounded-lg hover:bg-accent/50 transition touch-target ${
                              isCurrentUser ? 'bg-primary/10 border-primary' : ''
                            }`}
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <div className={`w-7 h-7 rounded-full ${
                                isCurrentUser 
                                  ? 'bg-primary text-primary-foreground' 
                                  : 'bg-muted text-muted-foreground'
                              } flex items-center justify-center font-bold text-xs sm:text-sm`}>
                                {index + 1}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className={`font-semibold truncate ${
                                  isCurrentUser ? 'text-primary' : ''
                                }`}>
                                  {isCurrentUser ? `${customer.name} (You)` : customer.name}
                                </p>
                                <div className="flex items-center gap-2">
                                  {/* <p className="text-xs text-muted-foreground truncate">{customer.email}</p> */}
                                  {/* {customer.phone && (
                                    <p className="text-xs text-muted-foreground truncate">({customer.phone})</p>
                                  )} */}
                                </div>
                              </div>
                            </div>
                            <div className="text-right min-w-[80px] ml-2">
                              <p className="font-bold">₦{Number(customer.total_spending || customer.total_amount || 0).toFixed(2)}</p>
                              <p className="text-xs text-muted-foreground">spent</p>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </Card>
              </div>

              {/* Other Tiers Information */}
              <div className="space-y-4">
                <h3 className="text-md font-semibold text-muted-foreground">Other Tiers</h3>
                {tiers
                  .filter(tier => tier.name !== currentTierName)
                  .sort((a, b) => (a.min_amount || 0) - (b.min_amount || 0))
                  .map((tier) => (
                    <div key={tier.id} className="border border-border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-sm">{tier.name}</h4>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {tier.name}
                          </span>
                          <span className="text-xs font-medium bg-secondary text-secondary-foreground px-2 py-1 rounded-full">
                            ₦{(tier.min_amount || 0).toLocaleString()}+ spending
                          </span>
                        </div>
                      </div>
                      
                      {tier.benefits && tier.benefits.length > 0 && (
                        <div className="mt-3">
                          <h5 className="text-xs font-medium text-muted-foreground mb-1">Benefits:</h5>
                          <ul className="text-xs space-y-1">
                            {Array.from(new Set(tier.benefits.map((benefit: any) => 
                              typeof benefit === 'string' 
                                ? benefit 
                                : (benefit.title || benefit.description || '')
                            ).filter(benefit => benefit.trim() !== ''))).map((uniqueBenefit, idx) => (
                              <li key={idx} className="flex items-start">
                                <span className="text-primary mr-2">•</span>
                                <span>{uniqueBenefit}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {(!tier.benefits || tier.benefits.length === 0) && (
                        <p className="text-xs text-muted-foreground">No specific benefits defined</p>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
