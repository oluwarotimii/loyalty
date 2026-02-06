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

  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  };

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/customer/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber }),
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
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2 funnel-display-title">
              My Rewards
            </h1>
            <p className="text-muted-foreground text-sm vend-sans-dashboard">
              Check your loyalty spending and benefits
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
                placeholder="123-456-7890"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(formatPhoneNumber(e.target.value))}
                disabled={loading}
                maxLength={12}
                required
                className="mobile-input"
              />
              <p className="text-xs text-muted-foreground vend-sans-admin">
                Enter your phone number to access your account
              </p>
            </div>

            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-md text-destructive text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading || phoneNumber.replace(/\D/g, '').length !== 10}
              className="w-full mobile-button btn-hover"
            >
              {loading ? 'Logging in...' : 'View My Rewards'}
            </Button>
          </form>

          <div className="pt-4 border-t border-border">
            <p className="text-center text-sm text-muted-foreground vend-sans-dashboard">
              <Link
                href="/admin/login"
                className="text-primary hover:underline font-medium"
              >
                Admin Login
              </Link>
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
