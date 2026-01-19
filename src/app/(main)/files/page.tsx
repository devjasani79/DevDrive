'use client'

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { DashboardSkeleton } from '@/components/ui/dashboard-skeleton';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import FileBrowser from '@/components/FileBrowser';

const FilesPage: React.FC = () => {
  const { user, loading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!loading && !user) {
      router.push('/signin');
    }
  }, [loading, user, router]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Navbar */}
      <Navbar user={user} />
      
      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Hidden on mobile */}
        <div className="hidden md:block">
          <Sidebar userId={user.$id} />
        </div>
        
        {/* Main Content */}
        <div className="flex-1 p-4 md:p-6 overflow-auto">
          <FileBrowser userId={user.$id} />
        </div>
      </div>
    </div>
  );
};

export default FilesPage;
