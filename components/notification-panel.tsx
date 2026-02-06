'use client';

import React from "react"

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  total_spending: number;
  tier_id: string;
  created_at: string;
}

interface NotificationPanelProps {
  customers: Customer[];
}

export default function NotificationPanel({ customers }: NotificationPanelProps) {
  const [formData, setFormData] = useState({
    customerId: '',
    type: 'tier-upgrade',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [sentNotifications, setSentNotifications] = useState<{ id: string; customer: string; message: string }[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerId || !formData.message) return;

    setLoading(true);
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const customer = customers.find((c) => c.id === formData.customerId);
        setSentNotifications([
          {
            id: Date.now().toString(),
            customer: customer?.name || 'Unknown',
            message: formData.message,
          },
          ...sentNotifications.slice(0, 9),
        ]);
        setFormData({ customerId: '', type: 'tier-upgrade', message: '' });
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const notificationTemplates = {
    'tier-upgrade': 'Congratulations! You\'ve reached a new tier.',
    'spending-milestone': 'You\'ve reached a spending milestone!',
    'redemption': 'Your spending has earned rewards.',
    'promotion': 'Exclusive promotion available for you!',
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="p-4">
        <h3 className="text-lg font-bold mb-4">Send Notification</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Customer</label>
            <Select value={formData.customerId} onValueChange={(value) => setFormData({ ...formData, customerId: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select customer" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Type</label>
            <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(notificationTemplates).map(([key, _]) => (
                  <SelectItem key={key} value={key}>
                    {key.replace('-', ' ').charAt(0).toUpperCase() + key.replace('-', ' ').slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Message</label>
            <Input
              placeholder={notificationTemplates[formData.type as keyof typeof notificationTemplates]}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              required
            />
          </div>

          <Button type="submit" disabled={loading || !formData.customerId} className="w-full">
            {loading ? 'Sending...' : 'Send Notification'}
          </Button>
        </form>
      </Card>

      <Card className="p-4">
        <h3 className="text-lg font-bold mb-4">Recent Notifications</h3>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {sentNotifications.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No notifications sent yet</p>
          ) : (
            sentNotifications.map((notif) => (
              <div key={notif.id} className="p-3 border border-border rounded-lg hover:bg-accent/50 transition">
                <p className="font-semibold text-sm">{notif.customer}</p>
                <p className="text-sm text-muted-foreground">{notif.message}</p>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
