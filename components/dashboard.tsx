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
import BulkUploadComponent from './bulk-upload';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  total_spending: number;
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
  min_amount: number;
  max_amount?: number;
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
  const [activeTab, setActiveTab] = useState('customers');

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
      <header className="sticky-mobile border-b border-border bg-card px-4 py-3 sm:px-6 sm:py-4">
        <div className="header-content flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Femtch VIP</h1>
            <p className="text-muted-foreground text-sm mt-1">Premium Loyalty Program Dashboard</p>
          </div>
        </div>
      </header>

      <div className="flex-1 px-4 py-4 sm:px-6 sm:py-6 space-y-4 sm:space-y-6">
        <StatsOverview customers={customers} />
        {/* Desktop Tabs */}
        <div className="hidden sm:block">
          <Tabs defaultValue="customers" className="tabs-container space-y-4">
            <TabsList className="w-full overflow-x-auto">
              <TabsTrigger value="customers" className="mobile-tab whitespace-nowrap">Customers</TabsTrigger>
              <TabsTrigger value="transactions" className="mobile-tab whitespace-nowrap">Transactions</TabsTrigger>
              <TabsTrigger value="tiers" className="mobile-tab whitespace-nowrap">Tiers & Benefits</TabsTrigger>
              <TabsTrigger value="bulk-upload" className="mobile-tab whitespace-nowrap">Bulk Upload</TabsTrigger>
              <TabsTrigger value="leaderboard" className="mobile-tab whitespace-nowrap">Leaderboard</TabsTrigger>
              <TabsTrigger value="notifications" className="mobile-tab whitespace-nowrap">Notifications</TabsTrigger>
            </TabsList>

            <TabsContent value="customers" className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="customer-list-container">
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
                    <div className="bg-card border border-border rounded-lg p-4 mobile-card">
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
                          <span className="text-muted-foreground">Total Spending:</span>
                          <span className="font-semibold ml-1">₦{Number(selectedCustomer.total_spending).toFixed(2)}</span>
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="transactions" className="space-y-4">
              <div className="grid grid-cols-1 gap-4 transaction-panel-grid">
                <div>
                  <TransactionPanel
                    customers={customers}
                    selectedCustomer={selectedCustomer}
                    onCustomerUpdated={handleCustomerUpdated}
                  />
                </div>
                {selectedCustomer && (
                  <div className="transaction-history-container">
                    <TransactionHistory customerId={selectedCustomer.id} />
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="tiers" className="space-y-4">
              <TierEditor initialTiers={initialTiers} />
            </TabsContent>

            <TabsContent value="bulk-upload" className="space-y-4">
              <BulkUploadComponent />
            </TabsContent>

            <TabsContent value="leaderboard" className="space-y-4">
              <Leaderboard customers={customers} initialTiers={initialTiers} />
            </TabsContent>

            <TabsContent value="notifications" className="space-y-4">
              <NotificationPanel customers={customers} />
            </TabsContent>

          </Tabs>
        </div>

        {/* Mobile Dropdown */}
        <div className="sm:hidden">
          <div className="mb-4">
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value)}
              className="w-full p-3 border border-input rounded-lg bg-background text-foreground mobile-input"
            >
              <option value="dashboard">Dashboard</option>
              <option value="customers">Customers</option>
              <option value="transactions">Transactions</option>
              <option value="tiers">Tiers & Benefits</option>
              <option value="bulk-upload">Bulk Upload</option>
              <option value="leaderboard">Leaderboard</option>
              <option value="notifications">Notifications</option>
            </select>
          </div>

          {activeTab === 'dashboard' && (
            <div className="space-y-4">
              <StatsOverview customers={customers} />
            </div>
          )}

          {activeTab === 'customers' && (
            <div className="space-y-4">
              <div className="customer-list-container">
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
                  <div className="bg-card border border-border rounded-lg p-4 mobile-card">
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
                        <span className="text-muted-foreground">Total Spending:</span>
                        <span className="font-semibold ml-1">₦{Number(selectedCustomer.total_spending).toFixed(2)}</span>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'transactions' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 transaction-panel-grid">
                <div>
                  <TransactionPanel
                    customers={customers}
                    selectedCustomer={selectedCustomer}
                    onCustomerUpdated={handleCustomerUpdated}
                  />
                </div>
                {selectedCustomer && (
                  <div className="transaction-history-container">
                    <TransactionHistory customerId={selectedCustomer.id} />
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'tiers' && (
            <div className="space-y-4">
              <TierEditor initialTiers={initialTiers} />
            </div>
          )}

          {activeTab === 'leaderboard' && (
            <div className="space-y-4">
              <Leaderboard customers={customers} initialTiers={initialTiers} />
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-4">
              <NotificationPanel customers={customers} />
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
