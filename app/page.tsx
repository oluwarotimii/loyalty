import { getCustomers, getTiers } from '@/lib/db';
import Dashboard from '@/components/dashboard';

export default async function Home() {
  const [customers, tiers] = await Promise.all([getCustomers(), getTiers()]);

  return (
    <main className="min-h-screen bg-background">
      <Dashboard initialCustomers={customers} initialTiers={tiers} />
    </main>
  );
}
