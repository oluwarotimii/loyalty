'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import { formatNumberWithCommas } from '@/lib/db';

interface TierBenefit {
  id?: string;
  title: string;
  description?: string;
}

interface Tier {
  id?: string;
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

interface TierEditorProps {
  initialTiers: Tier[];
}

export default function TierEditor({ initialTiers }: TierEditorProps) {
  const [tiers, setTiers] = useState<Tier[]>(initialTiers);
  const [editingTier, setEditingTier] = useState<Tier | null>(null);
  const [newBenefit, setNewBenefit] = useState({ title: '', description: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    console.log('Initial tiers received in TierEditor:', initialTiers);
    setTiers(initialTiers);
  }, [initialTiers]);

  const handleAddTier = () => {
    const newTier: Tier = {
      name: '',
      min_amount: 0,
      max_amount: null,
      min_spend: 0,
      max_spend: null,
      rank_order: tiers.length,
      evaluation_period: 'monthly',
      is_active: true,
      benefits: [],
    };
    setEditingTier(newTier);
  };

  const handleEditTier = (tier: Tier) => {
    setEditingTier({ ...tier });
  };

  const handleSaveTier = async () => {
    if (!editingTier) return;
    
    setSaving(true);
    
    try {
      if (editingTier.id) {
        // Update existing tier
        const response = await fetch(`/api/tiers/manage?id=${editingTier.id}&type=tier`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: editingTier.name,
            min_spend: editingTier.min_spend,
            rank_order: editingTier.rank_order,
            evaluation_period: editingTier.evaluation_period,
            is_active: editingTier.is_active
          })
        });
        
        if (!response.ok) throw new Error('Failed to update tier');
        
        // Update benefits
        for (const benefit of editingTier.benefits) {
          if (benefit.id) {
            // Update existing benefit
            await fetch(`/api/tiers/manage?id=${benefit.id}&type=benefit`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title: benefit.title,
                description: benefit.description
              })
            });
          } else {
            // Create new benefit
            await fetch('/api/tiers/manage', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'benefit',
                data: {
                  tier_id: editingTier.id,
                  title: benefit.title,
                  description: benefit.description
                }
              })
            });
          }
        }
        
        // Update local state
        setTiers(tiers.map(t => t.id === editingTier.id ? editingTier : t));
      } else {
        // Create new tier
        const response = await fetch('/api/tiers/manage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'tier',
            data: {
              name: editingTier.name,
              min_spend: editingTier.min_spend,
              rank_order: editingTier.rank_order,
              evaluation_period: editingTier.evaluation_period,
              is_active: editingTier.is_active
            }
          })
        });
        
        if (!response.ok) throw new Error('Failed to create tier');
        
        const newTier = await response.json();
        
        // Create benefits for the new tier
        for (const benefit of editingTier.benefits) {
          await fetch('/api/tiers/manage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'benefit',
              data: {
                tier_id: newTier.id,
                title: benefit.title,
                description: benefit.description
              }
            })
          });
        }
        
        // Update local state with new tier
        setTiers([...tiers, { ...editingTier, id: newTier.id }]);
      }
      
      setEditingTier(null);
      toast.success(editingTier.id ? 'Tier updated successfully' : 'Tier created successfully');
    } catch (error) {
      console.error('Error saving tier:', error);
      toast.error(`Failed to ${editingTier.id ? 'update' : 'create'} tier`);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingTier(null);
  };

  const handleDeleteTier = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this tier? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/tiers/manage?id=${id}&type=tier`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to delete tier');
      
      setTiers(tiers.filter(t => t.id !== id));
      toast.success('Tier deleted successfully');
    } catch (error) {
      console.error('Error deleting tier:', error);
      toast.error('Failed to delete tier');
    }
  };

  const handleAddBenefit = () => {
    if (!editingTier || !newBenefit.title.trim()) return;

    const updatedTier = {
      ...editingTier,
      benefits: [...editingTier.benefits, { title: newBenefit.title, description: newBenefit.description }]
    };
    
    setEditingTier(updatedTier);
    setNewBenefit({ title: '', description: '' });
  };

  const handleRemoveBenefit = (index: number) => {
    if (!editingTier) return;
    
    const updatedBenefits = [...editingTier.benefits];
    updatedBenefits.splice(index, 1);
    
    setEditingTier({
      ...editingTier,
      benefits: updatedBenefits
    });
  };

  const handleChange = (field: keyof Tier, value: string | number | boolean) => {
    if (!editingTier) return;
    
    setEditingTier({
      ...editingTier,
      [field]: value
    });
  };

  const handleBenefitChange = (field: keyof TierBenefit, value: string, index: number) => {
    if (!editingTier) return;
    
    const updatedBenefits = [...editingTier.benefits];
    updatedBenefits[index] = {
      ...updatedBenefits[index],
      [field]: value
    };
    
    setEditingTier({
      ...editingTier,
      benefits: updatedBenefits
    });
  };

  console.log('Rendering TierEditor with tiers:', tiers);
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Tier Management</h2>
        <Button onClick={handleAddTier} className="text-sm py-2">
          <Plus className="mr-2 h-4 w-4" /> Add Tier
        </Button>
      </div>

      {editingTier && (
        <Card>
          <CardHeader>
            <CardTitle>{editingTier.id ? 'Edit Tier' : 'Create New Tier'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Tier Name</Label>
                <Input
                  id="name"
                  value={editingTier.name || ''}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="e.g., Bronze, Silver, Gold"
                />
              </div>
              
              <div>
                <Label htmlFor="min_spend">Minimum Spend (₦)</Label>
                <Input
                  id="min_spend"
                  type="number"
                  step="0.01"
                  value={editingTier.min_spend || 0}
                  onChange={(e) => handleChange('min_spend', parseFloat(e.target.value) || 0)}
                />
              </div>

              <div>
                <Label htmlFor="max_amount">Maximum Amount (₦)</Label>
                <Input
                  id="max_amount"
                  type="number"
                  value={editingTier.max_amount || 0}
                  onChange={(e) => handleChange('max_amount', parseInt(e.target.value) || 0)}
                />
              </div>
              
              <div>
                <Label htmlFor="rank_order">Rank Order</Label>
                <Input
                  id="rank_order"
                  type="number"
                  value={editingTier.rank_order || 0}
                  onChange={(e) => handleChange('rank_order', parseInt(e.target.value) || 0)}
                />
              </div>
              
              <div>
                <Label htmlFor="evaluation_period">Evaluation Period</Label>
                <select
                  id="evaluation_period"
                  value={editingTier.evaluation_period}
                  onChange={(e) => handleChange('evaluation_period', e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={editingTier.is_active}
                  onChange={(e) => handleChange('is_active', e.target.checked)}
                  className="h-4 w-4"
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
            </div>
            
            <div className="mt-4">
              <h3 className="font-medium mb-2">Benefits</h3>
              
              <div className="flex space-x-2 mb-2">
                <Input
                  value={newBenefit.title || ''}
                  onChange={(e) => setNewBenefit({...newBenefit, title: e.target.value})}
                  placeholder="Benefit title"
                />
                <Input
                  value={newBenefit.description || ''}
                  onChange={(e) => setNewBenefit({...newBenefit, description: e.target.value})}
                  placeholder="Description (optional)"
                />
                <Button onClick={handleAddBenefit} variant="outline" className="text-xs py-1">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-2">
                {editingTier.benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex-1">
                      <Input
                        value={benefit.title || ''}
                        onChange={(e) => handleBenefitChange('title', e.target.value, index)}
                        placeholder="Benefit title"
                      />
                      <Input
                        value={benefit.description || ''}
                        onChange={(e) => handleBenefitChange('description', e.target.value, index)}
                        placeholder="Description"
                        className="mt-1"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveBenefit(index)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex space-x-2 pt-4">
              <Button onClick={handleSaveTier} disabled={saving} className="text-sm py-2">
                {saving ? (
                  <>
                    <Save className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {editingTier.id ? 'Update Tier' : 'Create Tier'}
                  </>
                )}
              </Button>
              <Button onClick={handleCancelEdit} variant="outline" disabled={saving} className="text-sm py-2">
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tiers.map((tier) => (
          <Card key={tier.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-xl">{tier.name}</CardTitle>
                <div className="flex gap-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {tier.name}
                  </span>
                  <Badge variant={tier.is_active ? "default" : "secondary"}>
                    {tier.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Min: ₦{formatNumberWithCommas(Number(tier.min_spend || 0))} spend
              </p>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <h4 className="font-medium mb-2">Benefits</h4>
                <ul className="space-y-1">
                  {tier.benefits.slice(0, 3).map((benefit, idx) => (
                    <li key={idx} className="text-sm flex items-start">
                      <span className="mr-2">•</span>
                      <span className="truncate">
                        {benefit.title}
                        {benefit.description && ` - ${benefit.description}`}
                      </span>
                    </li>
                  ))}
                  {tier.benefits.length > 3 && (
                    <li className="text-sm text-muted-foreground">
                      + {tier.benefits.length - 3} more benefits
                    </li>
                  )}
                </ul>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditTier(tier)}
                  className="text-xs py-1"
                >
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteTier(tier.id!)}
                  className="text-red-500 hover:text-red-700 text-xs py-1"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}