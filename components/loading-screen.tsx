'use client';

import { useEffect, useState } from 'react';

export default function LoadingScreen() {
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    // Show the animation after a short delay to prevent flickering
    const timer = setTimeout(() => {
      setShowAnimation(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        {showAnimation ? (
          <dotlottie-wc 
            src="https://lottie.host/98456526-9ef7-4553-95de-901307392e95/27oOknJ670.lottie" 
            style={{width: '200px', height: '200px'}} 
            autoplay 
            loop
          ></dotlottie-wc>
        ) : (
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        )}
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}