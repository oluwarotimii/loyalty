'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import CustomerPortal from '@/components/customer-portal';

export default function CustomerDashboardPage() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [allCustomers, setAllCustomers] = useState<any[]>([]);
  const [tiers, setTiers] = useState<any[]>([]);

  useEffect(() => {
    // Check if user has customer session cookie
    const checkAuthAndLoadData = async () => {
      try {
        const response = await fetch('/api/auth/customer');
        if (response.status === 401) {
          router.push('/customer/login');
          return;
        } else {
          setAuthenticated(true);
        }

        // Fetch all customers for leaderboard
        const customersResponse = await fetch('/api/customers');
        if (customersResponse.ok) {
          const customersData = await customersResponse.json();
          console.log('Page fetched all customers:', customersData);
          setAllCustomers(customersData);
        }

        // Fetch tiers
        const tiersResponse = await fetch('/api/tiers');
        if (tiersResponse.ok) {
          const tiersData = await tiersResponse.json();
          console.log('Page fetched tiers:', tiersData);
          setTiers(tiersData);
        }
      } catch (error) {
        console.error('Auth check or data loading failed:', error);
        router.push('/customer/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndLoadData();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your rewards...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return null;
  }

  return <CustomerPortal allCustomers={allCustomers} initialTiers={tiers} />;
}
