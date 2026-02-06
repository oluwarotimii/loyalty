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

interface TransactionPanelProps {
  customers: Customer[];
  selectedCustomer: Customer | null;
  onCustomerUpdated: (customer: Customer) => void;
}

export default function TransactionPanel({
  customers,
  selectedCustomer,
  onCustomerUpdated,
}: TransactionPanelProps) {
  const [formData, setFormData] = useState({
    customerId: selectedCustomer?.id || '',
    type: 'purchase',
    amount: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerId || !formData.amount) return;

    setLoading(true);
    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: formData.customerId,
          type: formData.type,
          amount: parseInt(formData.amount),
          description: formData.description,
        }),
      });

      if (!response.ok) throw new Error('Failed to create transaction');

      // Update customer
      const customerResponse = await fetch(`/api/customers/${formData.customerId}`);
      const updatedCustomer = await customerResponse.json();
      onCustomerUpdated(updatedCustomer);

      setFormData({ customerId: formData.customerId, type: 'purchase', amount: '', description: '' });
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="p-4">
        <h3 className="text-lg font-bold mb-4">Add Transaction</h3>
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
                <SelectItem value="purchase">Purchase</SelectItem>
                {/* <SelectItem value="referral">Referral</SelectItem>
                <SelectItem value="bonus">Bonus</SelectItem>
                <SelectItem value="redemption">Redemption</SelectItem> */}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Amount</label>
            <Input
              type="number"
              placeholder="0"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium">Description</label>
            <Input
              placeholder="Optional"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <Button type="submit" disabled={loading || !formData.customerId} className="w-full">
            {loading ? 'Processing...' : 'Add Transaction'}
          </Button>
        </form>
      </Card>

      {/* {selectedCustomer && (
        <Card className="p-4">
          <h3 className="text-lg font-bold mb-4">Quick Add Amount</h3>
          <div className="space-y-3">
            {[10, 50, 100, 500].map((amount) => (
              <Button
                key={amount}
                variant="outline"
                onClick={() => {
                  setFormData({
                    customerId: selectedCustomer.id,
                    type: 'bonus',
                    amount: amount.toString(),
                    description: 'Quick bonus',
                  });
                }}
                className="w-full"
              >
                Add ₦{amount}
              </Button>
            ))}
          </div>
        </Card>
      )} */}
    </div>
  );
}
