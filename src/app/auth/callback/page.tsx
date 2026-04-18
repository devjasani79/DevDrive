'use client';

import { useEffect } from 'react';
import { account } from '@/lib/appwrite';
import { OAuthProvider } from 'appwrite';

export default function OAuthCallbackPage() {
    useEffect(() => {
        const handleCallback = async () => {
            try {
                const urlParams = new URLSearchParams(window.location.search);
                const code = urlParams.get('code');
                const error = urlParams.get('error');

                if (error) {
                    console.error('OAuth error:', error);
                    window.location.href = `/signin?error=oauth_${error}`;
                    return;
                }

                if (!code) {
                    console.error('No authorization code received');
                    window.location.href = '/signin?error=oauth_no_code';
                    return;
                }

                console.log('Creating OAuth session with code...');
                await account.createOAuth2Session(OAuthProvider.Google, code);
                console.log('OAuth session created successfully');

                // Redirect to success page for verification
                window.location.href = '/auth/oauth-success';
            } catch (error) {
                console.error('OAuth callback failed:', error);
                window.location.href = '/signin?error=oauth_callback_failed';
            }
        };

        handleCallback();
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <h2 className="text-lg font-semibold">Completing Google authentication...</h2>
                <p className="text-sm text-gray-600 mt-2">Please wait while we set up your session.</p>
            </div>
        </div>
    );
}