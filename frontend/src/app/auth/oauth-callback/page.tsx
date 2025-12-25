'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');

    if (accessToken && refreshToken) {
      // Store tokens
      // TODO: Use a proper auth context or NextAuth to sync this state
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      // Trigger an event or rely on AuthProvider to pick up changes logic if exists.
      // For now, simple redirect.
      
      router.push('/dashboard');
    } else {
      // Handle error case
      console.error("Tokens missing from callback URL");
      router.push('/login?error=oauth_failed');
    }
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Logging in...</h2>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-gray-500">Please wait while we redirect you.</p>
      </div>
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CallbackContent />
    </Suspense>
  );
}
