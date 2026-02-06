'use client';

import { Card } from '@/components/ui/card';

interface Tier {
  id: string;
  name: string;
  min_points: number;
  max_points: number;
}

interface TierManagerProps {
  tiers: Tier[];
}

export default function TierManager({ tiers }: TierManagerProps) {
  const getTierColor = (name: string) => {
    const colors: { [key: string]: string } = {
      Bronze: 'bg-orange-100 text-orange-900 border-orange-300',
      Silver: 'bg-gray-100 text-gray-900 border-gray-300',
      Gold: 'bg-yellow-100 text-yellow-900 border-yellow-300',
      Platinum: 'bg-blue-100 text-blue-900 border-blue-300',
    };
    return colors[name] || 'bg-gray-100 text-gray-900 border-gray-300';
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <h2 className="text-xl font-bold mb-4">Loyalty Tiers</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {tiers.map((tier) => (
            <div key={tier.id} className={`p-4 rounded-lg border ${getTierColor(tier.name)}`}>
              <h3 className="font-bold text-lg mb-2">{tier.name}</h3>
              <div className="text-sm space-y-1">
                <p>
                  <span className="opacity-70">Min Points:</span> {tier.min_points}
                </p>
                <p>
                  <span className="opacity-70">Max Points:</span> {tier.max_points}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="text-lg font-bold mb-4">Benefits by Tier</h3>
        <div className="space-y-3">
          {[
            { tier: 'Bronze', benefits: ['5% discount', 'Birthday bonus'] },
            { tier: 'Silver', benefits: ['10% discount', 'Birthday bonus', 'Free shipping'] },
            { tier: 'Gold', benefits: ['15% discount', 'Birthday bonus', 'Free shipping', 'Priority support'] },
            { tier: 'Platinum', benefits: ['20% discount', 'Birthday bonus', 'Free shipping', 'VIP support', 'Exclusive events'] },
          ].map((item) => (
            <div key={item.tier} className="p-3 border border-border rounded-lg">
              <p className="font-semibold mb-2">{item.tier}</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                {item.benefits.map((benefit, i) => (
                  <li key={i}>✓ {benefit}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
