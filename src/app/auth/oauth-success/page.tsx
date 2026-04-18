'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/client/auth';

export default function OAuthSuccessPage() {
    const router = useRouter();

    useEffect(() => {
        const handleOAuthSuccess = async () => {
            // Wait a bit for the OAuth session to be established
            await new Promise(resolve => setTimeout(resolve, 2000));

            const maxRetries = 15;
            const retryDelay = 1500; // 1.5 seconds

            for (let attempt = 1; attempt <= maxRetries; attempt++) {
                try {
                    console.log(`OAuth verification attempt ${attempt}/${maxRetries}`);
                    const result = await getCurrentUser();
                    if (result.success && result.data?.user) {
                        console.log('OAuth success: user authenticated', result.data.user.$id);
                        router.replace('/dashboard');
                        return;
                    } else {
                        console.log('OAuth attempt failed: no user found');
                    }
                } catch (error) {
                    console.error(`OAuth check attempt ${attempt} failed:`, error);
                }

                if (attempt < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, retryDelay));
                }
            }

            // If all retries failed, redirect to signin with error
            console.error('OAuth verification failed after all retries');
            router.replace('/signin?error=oauth_session_failed');
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
