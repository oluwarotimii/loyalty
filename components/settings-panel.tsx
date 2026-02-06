'use client';

import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function SettingsPanel() {
  const settings = [
    { label: 'Bronze Tier', min: 0, max: 500, key: 'bronze' },
    { label: 'Silver Tier', min: 500, max: 2000, key: 'silver' },
    { label: 'Gold Tier', min: 2000, max: 5000, key: 'gold' },
    { label: 'Platinum Tier', min: 5000, max: 999999, key: 'platinum' },
  ];

  const policies = [
    { title: 'Spending Milestones', value: 'Automatic tracking', icon: '⏰' },
    { title: 'Birthday Bonus', value: '10% discount', icon: '🎂' },
    { title: 'Referral Reward', value: '5% commission', icon: '👥' },
    { title: 'Auto Tier Update', value: 'Daily at midnight', icon: '⚙️' },
  ];

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Tier Configuration</h2>
        <div className="space-y-4">
          {settings.map((setting) => (
            <div key={setting.key} className="p-4 border border-border rounded-lg">
              <h3 className="font-semibold mb-2">{setting.label}</h3>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-sm text-muted-foreground">Min Spending (₦)</label>
                  <Input type="number" value={setting.min} disabled className="mt-1" />
                </div>
                <div className="flex-1">
                  <label className="text-sm text-muted-foreground">Max Spending (₦)</label>
                  <Input type="number" value={setting.max} disabled className="mt-1" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Loyalty Policies</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {policies.map((policy, i) => (
            <div key={i} className="p-4 border border-border rounded-lg flex items-start gap-3">
              <span className="text-2xl">{policy.icon}</span>
              <div>
                <p className="font-semibold">{policy.title}</p>
                <p className="text-sm text-muted-foreground">{policy.value}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">System Status</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 border border-border rounded-lg">
            <span className="font-medium">Database Connection</span>
            <span className="text-green-600 font-semibold">Connected</span>
          </div>
          <div className="flex items-center justify-between p-3 border border-border rounded-lg">
            <span className="font-medium">Cron Jobs</span>
            <span className="text-green-600 font-semibold">Active</span>
          </div>
          <div className="flex items-center justify-between p-3 border border-border rounded-lg">
            <span className="font-medium">Notifications</span>
            <span className="text-green-600 font-semibold">Ready</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
