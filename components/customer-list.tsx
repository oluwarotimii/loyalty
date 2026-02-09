'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  total_spending: number;
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
    <Card className="p-3 mobile-card">
      <h2 className="text-lg font-bold mb-3">Customers ({customers.length})</h2>
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {customers.length === 0 ? (
          <p className="text-muted-foreground text-sm py-4 text-center">No customers yet</p>
        ) : (
          customers.map((customer) => (
            <div
              key={customer.id}
              className={`p-3 rounded-lg border cursor-pointer transition touch-target ${
                selectedCustomer?.id === customer.id
                  ? 'bg-accent border-accent text-accent-foreground'
                  : 'border-border hover:bg-accent/50'
              }`}
            >
              <div onClick={() => onSelectCustomer(customer)}>
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{customer.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{customer.email}</p>
                  </div>
                  <span className="text-sm font-bold ml-2">₦{Number(customer.total_spending).toFixed(2)}</span>
                </div>
              </div>
              {selectedCustomer?.id === customer.id && (
                <div className="flex justify-end mt-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(customer.id)}
                    className="mobile-button px-3 py-1 text-xs"
                  >
                    Delete
                  </Button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
