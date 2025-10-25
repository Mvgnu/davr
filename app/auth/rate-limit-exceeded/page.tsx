import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Clock } from 'lucide-react';
import Link from 'next/link';

export default function RateLimitExceededPage() {
  return (
    <div className="container mx-auto py-12 px-4">
      <div className="max-w-md mx-auto">
        <Card className="border-destructive/50">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-2xl">Zu viele Versuche</CardTitle>
            <CardDescription>
              Sie haben zu viele Anmelde- oder Registrierungsversuche durchgeführt
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg bg-muted p-4">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Warum sehe ich das?</h3>
                  <p className="text-sm text-muted-foreground">
                    Zum Schutz Ihres Kontos und unserer Plattform begrenzen wir die Anzahl der
                    Authentifizierungsversuche. Dies hilft, unbefugten Zugriff zu verhindern.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold">Was kann ich tun?</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Warten Sie 15 Minuten, bevor Sie es erneut versuchen</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Überprüfen Sie, ob Ihre Anmeldedaten korrekt sind</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>
                    Nutzen Sie die{' '}
                    <Link href="/auth/forgot-password" className="text-primary hover:underline">
                      Passwort vergessen
                    </Link>{' '}
                    Funktion, wenn Sie Ihr Passwort zurücksetzen möchten
                  </span>
                </li>
              </ul>
            </div>

            <div className="flex flex-col gap-2 pt-4">
              <Button asChild variant="default" className="w-full">
                <Link href="/">Zur Startseite</Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/kontakt">Support kontaktieren</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Diese Sicherheitsmaßnahme schützt sowohl Ihr Konto als auch die DAVR-Plattform vor
            unbefugtem Zugriff und automatisierten Angriffen.
          </p>
        </div>
      </div>
    </div>
  );
}
