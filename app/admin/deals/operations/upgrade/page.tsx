import { getServerSession } from 'next-auth/next';
import Link from 'next/link';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { authOptions } from '@/lib/auth/options';
import { AdminPremiumUpgradeFlow } from '@/components/marketplace/deals/AdminPremiumUpgradeFlow';

export default async function AdminPremiumUpgradePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.isAdmin && session?.user?.role !== 'ADMIN') {
    return (
      <Alert variant="destructive">
        <AlertTitle>Kein Zugriff</AlertTitle>
        <AlertDescription>Nur Administratoren dürfen Concierge-Entitlements verwalten.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <nav className="text-sm text-muted-foreground">
        <Link href="/admin/deals/operations" className="hover:underline">
          Operations
        </Link>{' '}
        /{' '}
        <span className="text-foreground">Premium-Upgrade</span>
      </nav>

      <Card>
        <CardHeader>
          <CardTitle>Premium-Upgrade verwalten</CardTitle>
          <CardDescription>
            Starten Sie Testphasen oder aktivieren Sie Concierge-Abonnements direkt für Ihr aktuelles Administrator-Konto.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Die Aktionen lösen automatisch die Premium-Entitlements aus und protokollieren Conversion-Events. Nach dem Upgrade
            bitte einmal neu im Workspace anmelden, damit Concierge-Werkzeuge geladen werden.
          </p>
          <AdminPremiumUpgradeFlow tier="CONCIERGE" />
        </CardContent>
      </Card>
    </div>
  );
}
