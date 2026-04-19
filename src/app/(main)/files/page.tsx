'use client'

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { DashboardSkeleton } from '@/components/ui/dashboard-skeleton';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import FileBrowser from '@/components/FileBrowser';
import AIDriveAssistant from '@/components/AIDriveAssistant';
import { useAllFiles } from '@/hooks/useFiles';

const FilesPage: React.FC = () => {
  const { user, loading } = useAuth();
  const router = useRouter();

  // useAllFiles fetches ALL files across every folder — not just root
  // This is what gets passed to the AI so it can see the full drive
  const { files: allFiles } = useAllFiles(user?.$id || '');

  React.useEffect(() => {
    if (!loading && !user) router.push('/signin');
  }, [loading, user, router]);

  if (loading) return <DashboardSkeleton />;
  if (!user)   return null;

  return (
    <div className="h-screen flex flex-col bg-background">
      <Navbar user={user} />
      <div className="flex flex-1 overflow-hidden">
        <div className="hidden md:block">
          <Sidebar userId={user.$id} />
        </div>
        <div className="flex-1 p-4 md:p-6 overflow-auto">
          <FileBrowser userId={user.$id} />
        </div>
      </div>
      {/* Pass ALL files so AI sees every subfolder */}
      <AIDriveAssistant files={allFiles} />
    </div>
  );
};

export default FilesPage;