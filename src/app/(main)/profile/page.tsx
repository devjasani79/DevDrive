'use client'

import React from 'react';
import { useRouter } from 'next/navigation';
import Profile from '@/components/Profile';

export default function ProfilePage() {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Profile onBack={handleBack} showBackButton={true} />
    </div>
  );
}
