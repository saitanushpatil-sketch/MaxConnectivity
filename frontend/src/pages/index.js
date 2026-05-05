import { useEffect } from 'react';
import { useRouter } from 'next/router';
import useAuthStore from '../context/authStore';

export default function IndexPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading) {
      router.replace(isAuthenticated ? '/chats' : '/login');
    }
  }, [isAuthenticated, isLoading]);

  return (
    <div className="min-h-screen bg-max-bg flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-max-card border border-max-border rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl font-bold text-max-cyan font-display">M</span>
        </div>
        <div className="w-6 h-6 border-2 border-max-cyan border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    </div>
  );
}
