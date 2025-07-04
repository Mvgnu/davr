'use client';

import { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get('callbackUrl') || '/';

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.password) {
      setError('Bitte füllen Sie alle Felder aus.');
      return;
    }

    try {
      setIsLoading(true);

      const result = await signIn('credentials', {
        redirect: false,
        email: formData.email,
        password: formData.password,
      });

      if (result?.error) {
        setError('Ungültige E-Mail oder Passwort.');
        setIsLoading(false);
        return;
      }

      router.push(callbackUrl);

    } catch (error) {
      setError('Bei der Anmeldung ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut.');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-150px)] px-4 py-12 bg-gradient-to-b from-background to-muted/30">
      <Card 
        className="w-full max-w-md border-border/60 shadow-lg animate-fade-in-up opacity-0"
        style={{ animationFillMode: 'forwards' }}
      >
        <CardHeader className="space-y-1 items-center">
          <div className="mb-4 text-2xl font-bold text-primary">
            DAVR Logo 
          </div>
          <CardTitle className="text-2xl font-bold text-center">Anmelden</CardTitle>
          <CardDescription className="text-center">
            Geben Sie Ihre E-Mail und Ihr Passwort ein, um sich anzumelden
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-5 px-6">
            {error && (
              <Alert variant="destructive" className="bg-destructive/10 border-destructive/30 text-destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email">E-Mail</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="name@beispiel.de"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                className="transition-colors duration-200 focus:border-primary focus:ring-primary/20"
                required
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Passwort</Label>
                <Link
                  href="/auth/forgot-password"
                  className="text-sm font-medium text-muted-foreground hover:text-primary hover:underline"
                >
                  Passwort vergessen?
                </Link>
              </div>

              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleChange}
                  className="transition-colors duration-200 focus:border-primary focus:ring-primary/20 pr-10"
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground transition-colors duration-200"
                  onClick={togglePasswordVisibility}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4 px-6 pb-6 pt-4">
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? <LoadingSpinner className="mr-2 h-4 w-4" /> : null}
              {isLoading ? 'Anmeldung läuft...' : 'Anmelden'}
            </Button>

            <div className="text-center text-sm">
              Noch kein Konto?{' '}
              <Link
                href="/auth/register"
                className="font-medium text-primary hover:underline hover:text-primary/90"
              >
                Jetzt registrieren
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
} 