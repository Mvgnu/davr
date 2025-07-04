import { Suspense } from 'react';
import LoginForm from '@/components/auth/LoginForm';
import LoadingSpinner from '@/components/LoadingSpinner'; // Assuming a spinner exists for fallback

export default function LoginPage() {
  return (
    <Suspense 
      fallback={
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <LoadingSpinner />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
} 