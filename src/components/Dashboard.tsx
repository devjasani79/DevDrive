'use client'

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardSkeleton } from './ui/dashboard-skeleton';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import MainContent from './MainContent';

const Dashboard: React.FC = () => {
    const router = useRouter();
    const { user, loading } = useAuth();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/signin');
        }
    }, [loading, user, router]);

    if (loading) {
        return (
            <DashboardSkeleton />
        );
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
                <MainContent user={user} />
            </div>
        </div>
    );
};

export default Dashboard;