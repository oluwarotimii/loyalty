'use client';

import React from "react"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import Link from 'next/link';

export default function CustomerLoginPage() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Only allow digits in phone number
  const formatPhoneNumber = (value: string) => {
    return value.replace(/\D/g, '');
  };

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Remove formatting characters to send only digits
    const rawPhoneNumber = phoneNumber.replace(/\D/g, '');

    try {
      const response = await fetch('/api/auth/customer/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: rawPhoneNumber }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Login failed');
        setLoading(false);
        return;
      }

      // Login successful
      router.push('/customer/dashboard');
    } catch (err) {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md p-6 sm:p-8 mobile-card">
        <div className="space-y-mobile">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <img 
                src="/icon.png" 
                alt="Femtch VIP Logo" 
                className="h-16 w-16 object-contain"
              />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
              My Rewards
            </h1>
            <p className="text-muted-foreground text-sm">
              Access your VIP benefits and rewards
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-3">
            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-medium text-label">
                Phone Number
              </label>
              <Input
                id="phone"
                type="tel"
                placeholder="1234567890"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(formatPhoneNumber(e.target.value))}
                disabled={loading}
                maxLength={11}
                required
                className="mobile-input"
              />
              <p className="text-xs text-muted-foreground">
                Enter your phone number to access your account
              </p>
            </div>

            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-md text-destructive text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Button
                type="submit"
                disabled={loading || phoneNumber.length !== 11}
                className="w-full mobile-button btn-hover"
              >
                {loading ? 'Logging in...' : 'View My Rewards'}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full mobile-button"
                onClick={() => window.history.back()}
              >
                Back
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}
