'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/client/auth';

export default function OAuthSuccessPage() {
    const router = useRouter();

    useEffect(() => {
        const handleOAuthSuccess = async () => {
            try {
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

    return null
}
