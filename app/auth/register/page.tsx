'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { useCsrfToken, withCsrfToken } from '@/hooks/useCsrfToken'

export default function RegisterPage() {
  const router = useRouter()
  const { token: csrfToken, loading: csrfLoading } = useCsrfToken()

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    terms: false,
  })

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleCheckboxChange = (checked: boolean) => {
    setFormData(prev => ({ ...prev, terms: checked }))
  }

  const togglePasswordVisibility = (field: 'password' | 'confirmPassword') => {
    if (field === 'password') {
      setShowPassword(prev => !prev)
    } else {
      setShowConfirmPassword(prev => !prev)
    }
  }

  const validateForm = () => {
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Bitte füllen Sie alle Felder aus.')
      return false
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError('Bitte geben Sie eine gültige E-Mail-Adresse ein.')
      return false
    }

    if (formData.password.length < 8) {
      setError('Das Passwort muss mindestens 8 Zeichen lang sein.')
      return false
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Die Passwörter stimmen nicht überein.')
      return false
    }

    if (!formData.terms) {
      setError('Sie müssen den Nutzungsbedingungen und der Datenschutzerklärung zustimmen.')
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!validateForm()) {
      return
    }

    if (!csrfToken) {
      setError('Sicherheitstoken fehlt. Bitte laden Sie die Seite neu.')
      return
    }

    try {
      setIsLoading(true)

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: withCsrfToken(csrfToken, {
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          terms: formData.terms,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.message || 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.')
        return
      }

      // Registration successful, redirect to login page
      router.push('/auth/login?registered=true')

    } catch (error) {
      console.error('Registration error:', error)
      setError('Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.')
    } finally {
      setIsLoading(false)
    }
  }

  const isFormDisabled = isLoading || csrfLoading || !csrfToken

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
          <CardTitle className="text-2xl font-bold text-center">Konto erstellen</CardTitle>
          <CardDescription className="text-center">
            Geben Sie Ihre Daten ein, um ein neues Konto zu erstellen
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

            {csrfLoading && (
              <Alert className="bg-muted/50">
                <Loader2 className="h-4 w-4 animate-spin" />
                <AlertDescription>Sicherheitstoken wird geladen...</AlertDescription>
              </Alert>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="Max Mustermann"
                value={formData.name}
                onChange={handleChange}
                className="transition-colors duration-200 focus:border-primary focus:ring-primary/20"
                disabled={isFormDisabled}
                required
              />
            </div>

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
                disabled={isFormDisabled}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Passwort</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className="transition-colors duration-200 focus:border-primary focus:ring-primary/20 pr-10"
                  disabled={isFormDisabled}
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground transition-colors duration-200"
                  onClick={() => togglePasswordVisibility('password')}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  disabled={isFormDisabled}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground pt-0.5">
                Mindestens 8 Zeichen lang
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Passwort bestätigen</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="transition-colors duration-200 focus:border-primary focus:ring-primary/20 pr-10"
                  disabled={isFormDisabled}
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground transition-colors duration-200"
                  onClick={() => togglePasswordVisibility('confirmPassword')}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  disabled={isFormDisabled}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-start space-x-2.5 pt-2.5">
              <Checkbox
                id="terms"
                checked={formData.terms}
                onCheckedChange={handleCheckboxChange}
                className="mt-0.5 border-border data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                disabled={isFormDisabled}
              />
              <label
                htmlFor="terms"
                className="text-sm font-normal leading-snug text-muted-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Ich stimme den{" "}
                <Link href="/terms" className="font-medium text-primary underline underline-offset-4 hover:text-primary/90 transition-colors">
                  Nutzungsbedingungen
                </Link>{" "}
                und der{" "}
                <Link href="/privacy" className="font-medium text-primary underline underline-offset-4 hover:text-primary/90 transition-colors">
                  Datenschutzerklärung
                </Link>{" "}
                zu
              </label>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4 px-6 pb-6 pt-4">
            <Button
              type="submit"
              className="w-full"
              disabled={isFormDisabled}
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isLoading ? 'Registrierung läuft...' : 'Konto erstellen'}
            </Button>

            <div className="text-center text-sm">
              Bereits ein Konto?{' '}
              <Link
                href="/auth/login"
                className="font-medium text-primary hover:underline hover:text-primary/90 transition-colors"
              >
                Hier anmelden
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
