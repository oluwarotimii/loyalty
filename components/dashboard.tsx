'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CustomerList from './customer-list';
import CustomerForm from './customer-form';
import TransactionPanel from './transaction-panel';
import TransactionHistory from './transaction-history';
import TierEditor from './tier-editor';
import Leaderboard from './leaderboard';
import StatsOverview from './stats-overview';
import NotificationPanel from './notification-panel';
import SettingsPanel from './settings-panel';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  points_balance: number;
  tier_id: string;
  created_at: string;
}

interface TierBenefit {
  id?: string;
  title: string;
  description?: string;
}

interface Tier {
  id: string;
  name: string;
  min_points: number;
  max_points?: number;
  min_spend: number;
  max_spend?: number;
  rank_order: number;
  evaluation_period: string;
  is_active: boolean;
  benefits: TierBenefit[];
}

interface DashboardProps {
  initialCustomers: Customer[];
  initialTiers: Tier[];
}

export default function Dashboard({ initialCustomers, initialTiers }: DashboardProps) {
  console.log('Dashboard component received initial data:', { initialCustomers, initialTiers });
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const handleCustomerAdded = (newCustomer: Customer) => {
    setCustomers([newCustomer, ...customers]);
  };

  const handleCustomerUpdated = (updatedCustomer: Customer) => {
    setCustomers(customers.map((c) => (c.id === updatedCustomer.id ? updatedCustomer : c)));
    setSelectedCustomer(updatedCustomer);
  };

  const handleCustomerDeleted = (customerId: string) => {
    setCustomers(customers.filter((c) => c.id !== customerId));
    if (selectedCustomer?.id === customerId) {
      setSelectedCustomer(null);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b border-border bg-card px-6 py-4">
        <h1 className="text-3xl font-bold">Loyalty Management Platform</h1>
        <p className="text-muted-foreground mt-1">Manage customers, points, and loyalty tiers</p>
      </header>

      <div className="flex-1 px-6 py-6 space-y-6">
        <StatsOverview customers={customers} />
        <Tabs defaultValue="customers" className="space-y-4">
          <TabsList>
            <TabsTrigger value="customers">Customers</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="tiers">Tiers & Benefits</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="customers" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <CustomerList
                  customers={customers}
                  selectedCustomer={selectedCustomer}
                  onSelectCustomer={setSelectedCustomer}
                  onCustomerDeleted={handleCustomerDeleted}
                />
              </div>
              <div className="space-y-4">
                <CustomerForm onCustomerAdded={handleCustomerAdded} />
                {selectedCustomer && (
                  <div className="bg-card border border-border rounded-lg p-4">
                    <h3 className="font-semibold mb-3">Customer Details</h3>
                    <div className="space-y-2 text-sm">
                      <p>
                        <span className="text-muted-foreground">Name:</span> {selectedCustomer.name}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Email:</span> {selectedCustomer.email}
                      </p>
                      {selectedCustomer.phone && (
                        <p>
                          <span className="text-muted-foreground">Phone:</span> {selectedCustomer.phone}
                        </p>
                      )}
                      <p>
                        <span className="text-muted-foreground">Points:</span>
                        <span className="font-semibold ml-1">{selectedCustomer.points_balance}</span>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="transactions" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <TransactionPanel
                  customers={customers}
                  selectedCustomer={selectedCustomer}
                  onCustomerUpdated={handleCustomerUpdated}
                />
              </div>
              {selectedCustomer && (
                <div>
                  <TransactionHistory customerId={selectedCustomer.id} />
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="tiers" className="space-y-4">
            <TierEditor initialTiers={initialTiers} />
          </TabsContent>

          <TabsContent value="leaderboard" className="space-y-4">
            <Leaderboard customers={customers} />
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <NotificationPanel customers={customers} />
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <SettingsPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
