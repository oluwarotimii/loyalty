'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency } from '@/lib/db';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  total_spending?: number;
  total_amount?: number;
  tier_id?: string;
  current_tier?: string;
  created_at: string;
}

interface Tier {
  id: string;
  name: string;
  min_amount: number;
  max_amount?: number;
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

interface LeaderboardProps {
  customers: Customer[];
  initialTiers: Tier[];
}

// Function to determine which tier a customer belongs to based on their stored tier_id
const getCustomerTier = (customer: Customer, tiers: Tier[]) => {
  // If customer has a stored tier_id, use that
  if (customer.tier_id) {
    const storedTier = tiers.find(tier => tier.id === customer.tier_id);
    if (storedTier) {
      return storedTier;
    }
  }

  // Otherwise, return null
  return null;
};

export default function Leaderboard({ customers, initialTiers }: LeaderboardProps) {
  const [selectedTierId, setSelectedTierId] = useState<string>('all');
  const tiers = initialTiers || [];

  // Memoize the filtered customers calculation
  const filteredCustomers = useMemo(() => {
    let result: Customer[] = [];

    if (selectedTierId === 'all') {
      // Show all customers
      result = [...customers];
    } else {
      // Filter customers by selected tier
      const selectedTier = tiers.find(tier => tier.id === selectedTierId || tier.name === selectedTierId);
      if (selectedTier) {
        result = customers.filter(customer => {
          const customerTier = getCustomerTier(customer, tiers);
          return customerTier && (customerTier.id === selectedTierId || customerTier.name === selectedTierId);
        });
      }
    }

    // Sort by total spending (descending)
    return result.sort((a, b) => (b.total_spending || b.total_amount || 0) - (a.total_spending || a.total_amount || 0));
  }, [selectedTierId, customers, tiers]);

  // Group customers by tier for the "All Tiers" view
  const customersByTier = useMemo(() => {
    const grouped: Record<string, Customer[]> = {};
    
    // Initialize empty arrays for each tier
    tiers.forEach(tier => {
      grouped[tier.name] = [];
    });
    
    // Group customers by their tier
    customers.forEach(customer => {
      const tierName = customer.current_tier || 'Unassigned';
      if (!grouped[tierName]) {
        grouped[tierName] = [];
      }
      grouped[tierName].push(customer);
    });
    
    // Sort each tier's customers by spending
    Object.keys(grouped).forEach(tierName => {
      grouped[tierName] = grouped[tierName].sort((a, b) => 
        (b.total_spending || b.total_amount || 0) - (a.total_spending || a.total_amount || 0)
      );
    });
    
    return grouped;
  }, [customers, tiers]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-lg font-bold">Customer Leaderboard</h2>
        <div className="w-full sm:w-auto">
          <Select value={selectedTierId} onValueChange={setSelectedTierId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a tier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tiers</SelectItem>
              {[...tiers]
                .sort((a, b) => (a.rank_order || 0) - (b.rank_order || 0)) // Sort by rank order
                .map((tier) => (
                  <SelectItem key={tier.id || tier.name} value={tier.id || tier.name}>
                    {tier.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedTierId === 'all' ? (
        // Display separate leaderboards for each tier
        <div className="space-y-6">
          {tiers
            .sort((a, b) => (a.rank_order || 0) - (b.rank_order || 0))
            .map((tier) => {
              const tierCustomers = customersByTier[tier.name] || [];
              return (
                <div key={tier.id} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="text-md font-semibold text-primary">Tier</h3>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {tier.name}
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {tierCustomers.length} {tierCustomers.length === 1 ? 'member' : 'members'}
                    </span>
                  </div>
                  <Card className="p-3 mobile-card">
                    <div className="space-y-2">
                      {tierCustomers.length === 0 ? (
                        <p className="text-muted-foreground text-center py-4 text-sm">No members in this tier</p>
                      ) : (
                        tierCustomers.map((customer, index) => {
                          return (
                            <div
                              key={customer.id}
                              className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-accent/50 transition touch-target"
                            >
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs sm:text-sm">
                                  {index + 1}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="font-semibold truncate">{customer.name}</p>
                                  <div className="flex items-center gap-2">
                                    <p className="text-xs text-muted-foreground truncate">{customer.email}</p>
                                    {customer.phone && (
                                      <p className="text-xs text-muted-foreground truncate">({customer.phone})</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right min-w-[80px] ml-2">
                                <p className="font-bold">₦{formatCurrency(Number(customer.total_spending || customer.total_amount || 0))}</p>
                                <p className="text-xs text-muted-foreground">spent</p>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </Card>
                </div>
              );
            })}
          
          {/* Unassigned customers section */}
          {customersByTier['Unassigned'] && customersByTier['Unassigned'].length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-md font-semibold text-muted-foreground">Tier</h3>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    Unassigned
                  </span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {customersByTier['Unassigned'].length} {customersByTier['Unassigned'].length === 1 ? 'member' : 'members'}
                </span>
              </div>
              <Card className="p-3 mobile-card">
                <div className="space-y-2">
                  {customersByTier['Unassigned'].map((customer, index) => {
                    return (
                      <div
                        key={customer.id}
                        className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-accent/50 transition touch-target"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className="w-7 h-7 rounded-full bg-muted text-muted-foreground flex items-center justify-center font-bold text-xs sm:text-sm">
                            {index + 1}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold truncate">{customer.name}</p>
                            <div className="flex items-center gap-2">
                              <p className="text-xs text-muted-foreground truncate">{customer.email}</p>
                              {customer.phone && (
                                <p className="text-xs text-muted-foreground truncate">({customer.phone})</p>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right min-w-[80px] ml-2">
                          <p className="font-bold">₦{formatCurrency(Number(customer.total_spending || customer.total_amount || 0))}</p>
                          <p className="text-xs text-muted-foreground">spent</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          )}
        </div>
      ) : (
        // Display single tier leaderboard
        <Card className="p-3 mobile-card">
          <div className="space-y-2">
            {filteredCustomers.length === 0 ? (
              <p className="text-muted-foreground text-center py-6">
                {selectedTierId === 'all'
                  ? 'No customers yet'
                  : `No customers in ${tiers.find(t => t.id === selectedTierId || t.name === selectedTierId)?.name} tier`}
              </p>
            ) : (
              filteredCustomers.map((customer, index) => {
                const customerTier = getCustomerTier(customer, tiers);

                return (
                  <div
                    key={customer.id}
                    className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-accent/50 transition touch-target"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs sm:text-sm">
                        {index + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold truncate">{customer.name}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-muted-foreground truncate">{customer.email}</p>
                          {customer.phone && (
                            <p className="text-xs text-muted-foreground truncate">({customer.phone})</p>
                          )}
                          {(customerTier || customer.current_tier) && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {customer.current_tier || customerTier?.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right min-w-[80px] ml-2">
                      <p className="font-bold">₦{Number(customer.total_spending || customer.total_amount || 0).toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">spent</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      )}
    </div>
  );
}