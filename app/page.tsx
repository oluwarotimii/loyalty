'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface Tier {
  id: string;
  name: string;
  min_amount: number;
  benefits: Array<{
    id?: string;
    title?: string;
    description?: string;
  } | string>;
}

export default function Home() {
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTiers = async () => {
      try {
        const response = await fetch('/api/tiers');
        if (response.ok) {
          const data = await response.json();
          setTiers(data);
        }
      } catch (error) {
        console.error('Error fetching tiers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTiers();
  }, []);

  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.pexels.com/photos/7267538/pexels-photo-7267538.jpeg"
            alt="Loyalty program concept"
            fill
            style={{ objectFit: 'cover' }}
            priority
            className="opacity-80"
          />
          <div className="absolute inset-0 bg-black/40"></div>
        </div>
        
        <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">
          <div className="flex flex-col items-center">
            <img 
              src="/icon.png" 
              alt="Femtech VIP Logo" 
              className="h-20 w-20 object-contain mb-4"
            />
            <h1 className="text-4xl md:text-6xl font-bold mb-6 transition-all duration-700 ease-in-out">
              Empower Your Loyalty Journey
            </h1>
          </div>
          <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto transition-all duration-700 ease-in-out delay-150">
            Join our exclusive rewards program and unlock premium benefits tailored just for you. 
            Experience personalized perks that grow with your loyalty.
          </p>
          <div className="transition-all duration-700 ease-in-out delay-300">
            <Link 
              href="/customer/login" 
              className="inline-block bg-primary text-primary-foreground px-8 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              Access Your Rewards
            </Link>
          </div>
        </div>
      </section>

      {/* Tiers Section */}
      <section className="py-20 px-4 bg-card">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 text-foreground">
            Membership Tiers
          </h2>
          
          {loading ? (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {tiers.map((tier, index) => (
                <div 
                  key={tier.id} 
                  className="border border-border rounded-xl p-6 bg-background hover:shadow-lg transition-shadow duration-300"
                  style={{
                    animationDelay: `${index * 150}ms`,
                  }}
                >
                  <h3 className="text-2xl font-bold mb-4 text-primary">{tier.name}</h3>
                  <p className="text-lg mb-4">
                    Starting at ₦{Number(tier.min_amount).toLocaleString()}
                  </p>
                  
                  <div className="space-y-2 mb-6">
                    <h4 className="font-semibold text-sm text-muted-foreground">Benefits:</h4>
                    {tier.benefits && tier.benefits.length > 0 ? (
                      <ul className="space-y-1">
                        {tier.benefits.slice(0, 4).map((benefit: any, idx: number) => (
                          <li key={idx} className="text-sm flex items-start">
                            <span className="text-primary mr-2">•</span>
                            {typeof benefit === 'string' 
                              ? benefit 
                              : (benefit.title || benefit.description)}
                          </li>
                        ))}
                        {tier.benefits.length > 4 && (
                          <li className="text-sm text-muted-foreground">
                            +{tier.benefits.length - 4} more benefits
                          </li>
                        )}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">No specific benefits defined</p>
                    )}
                  </div>
                  
                  <div className="text-center mt-6">
                    <div className="inline-block bg-muted text-muted-foreground text-xs px-3 py-1 rounded-full">
                      Spend ₦{Number(tier.min_amount).toLocaleString()} to qualify
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Value Proposition Section */}
      <section className="py-20 px-4 bg-background">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
            Why Join Our Loyalty Program?
          </h2>
          <p className="text-lg text-muted-foreground mb-12">
            Our loyalty program is designed to reward your continued support with exclusive benefits and personalized experiences.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Exclusive Rewards</h3>
              <p className="text-muted-foreground">Access special discounts and offers reserved only for our loyal customers.</p>
            </div>
            
            <div className="p-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Priority Support</h3>
              <p className="text-muted-foreground">Get faster assistance and dedicated support as a valued member.</p>
            </div>
            
            <div className="p-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">VIP Community</h3>
              <p className="text-muted-foreground">Join an exclusive community of our most valued customers.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
