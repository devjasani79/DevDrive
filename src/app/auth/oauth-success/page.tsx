'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/client/auth';

export default function OAuthSuccessPage() {
    const router = useRouter();

    useEffect(() => {
        const handleOAuthSuccess = async () => {
            try {
                // Small delay to ensure cookie is set
                await new Promise(resolve => setTimeout(resolve, 500));
                
                const result = await getCurrentUser();
                if (result.success && result.data?.user) {
                    router.replace('/dashboard');
                } else {
                    router.replace('/signin?error=oauth_session_failed');
                }
            } catch (error) {
                console.error('Error checking user after OAuth:', error);
                router.replace('/signin?error=oauth_session_failed');
            }
        };

        handleOAuthSuccess();
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <h2 className="text-lg font-semibold">Completing authentication...</h2>
            </div>
        </div>
    );
}
