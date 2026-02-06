'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Dashboard from '@/components/dashboard';
import AdminHeader from '@/components/admin-header';
import LoadingScreen from '@/components/loading-screen';

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
  rank_order: number;
  evaluation_period: string;
  is_active: boolean;
  benefits: TierBenefit[];
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [initialCustomers, setInitialCustomers] = useState<Customer[]>([]);
  const [initialTiers, setInitialTiers] = useState<Tier[]>([]);

  useEffect(() => {
    // Check if user has admin session cookie by trying to fetch admin data
    const checkAuthAndLoadData = async () => {
      try {
        const response = await fetch('/api/auth/admin');
        if (response.status === 401) {
          router.push('/admin/login');
          return;
        } else {
          setAuthenticated(true);
        }

        // Fetch initial data
        const [customersResponse, tiersResponse] = await Promise.all([
          fetch('/api/customers'),
          fetch('/api/tiers')
        ]);

        if (customersResponse.ok) {
          const customersData = await customersResponse.json();
          console.log('Fetched customers data:', customersData);
          setInitialCustomers(customersData);
        }

        if (tiersResponse.ok) {
          const tiersData = await tiersResponse.json();
          console.log('Fetched tiers data:', tiersData);
          setInitialTiers(tiersData);
        }
      } catch (error) {
        console.error('Auth check or data loading failed:', error);
        router.push('/admin/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndLoadData();
  }, [router]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (!authenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />
      <Dashboard initialCustomers={initialCustomers} initialTiers={initialTiers} />
    </div>
  );
}
