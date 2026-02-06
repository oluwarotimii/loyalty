'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  points_balance: number;
  tier_id: string;
  created_at: string;
}

interface CustomerListProps {
  customers: Customer[];
  selectedCustomer: Customer | null;
  onSelectCustomer: (customer: Customer) => void;
  onCustomerDeleted: (id: string) => void;
}

export default function CustomerList({
  customers,
  selectedCustomer,
  onSelectCustomer,
  onCustomerDeleted,
}: CustomerListProps) {
  const handleDelete = async (customerId: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      await fetch(`/api/customers/${customerId}`, { method: 'DELETE' });
      onCustomerDeleted(customerId);
    } catch (error) {
      console.error('Failed to delete customer:', error);
    }
  };

  return (
    <Card className="p-4">
      <h2 className="text-xl font-bold mb-4">Customers ({customers.length})</h2>
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {customers.length === 0 ? (
          <p className="text-muted-foreground text-sm py-4 text-center">No customers yet</p>
        ) : (
          customers.map((customer) => (
            <div
              key={customer.id}
              className={`p-3 rounded-lg border cursor-pointer transition ${
                selectedCustomer?.id === customer.id
                  ? 'bg-accent border-accent text-accent-foreground'
                  : 'border-border hover:bg-accent/50'
              }`}
            >
              <div onClick={() => onSelectCustomer(customer)}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">{customer.name}</p>
                    <p className="text-xs text-muted-foreground">{customer.email}</p>
                  </div>
                  <span className="text-sm font-bold">{customer.points_balance}pts</span>
                </div>
              </div>
              {selectedCustomer?.id === customer.id && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(customer.id)}
                  className="mt-2 w-full"
                >
                  Delete
                </Button>
              )}
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
