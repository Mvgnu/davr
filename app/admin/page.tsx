'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building, Users, ShoppingBag, FileText, AlertCircle, Settings, Shield, BarChart3, TrendingUp, User, Store, Flag } from 'lucide-react';

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState({
    users: 0,
    recyclingCenters: 0,
    marketplaceItems: 0,
    pendingApprovals: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Redirect if not admin
    if (status === 'authenticated' && !session?.user?.isAdmin) {
      router.push('/');
    }

    // Fetch dashboard stats
    if (status === 'authenticated' && session?.user?.isAdmin) {
      fetchDashboardStats();
    }
  }, [status, session, router]);

  const fetchDashboardStats = async () => {
    try {
      setIsLoading(true);
      
      // These endpoints don't exist yet but will be implemented
      const [usersRes, centersRes, marketplaceRes] = await Promise.all([
        fetch('/api/admin/stats/users').then(res => res.json()).catch(() => ({ count: 0 })),
        fetch('/api/admin/stats/recycling-centers').then(res => res.json()).catch(() => ({ count: 0 })),
        fetch('/api/admin/stats/marketplace').then(res => res.json()).catch(() => ({ count: 0 })),
      ]);
      
      setStats({
        users: usersRes.count || 0,
        recyclingCenters: centersRes.count || 0,
        marketplaceItems: marketplaceRes.count || 0,
        pendingApprovals: (centersRes.pending || 0) + (marketplaceRes.pending || 0),
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'loading' || (status === 'authenticated' && isLoading)) {
    return (
      <div className="container py-10">
        <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated' || !session?.user?.isAdmin) {
    return (
      <div className="container py-10">
        <Card className="border-red-300 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center text-red-700">
              <AlertCircle className="mr-2 h-5 w-5" />
              Zugriff verweigert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700">
              Sie haben keine Berechtigung, auf den Admin-Bereich zuzugreifen.
            </p>
          </CardContent>
          <CardFooter>
            <Button
              variant="outline"
              onClick={() => router.push('/')}
            >
              Zurück zur Startseite
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Verwalten Sie die DAVR-Plattform</p>
        </div>
        <Button>
          <Settings className="mr-2 h-4 w-4" />
          Admin-Einstellungen
        </Button>
      </div>
      
      {/* Main Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Benutzer</CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.users}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Recyclinghöfe</CardTitle>
            <Building className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recyclingCenters}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Marktplatz</CardTitle>
            <ShoppingBag className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.marketplaceItems}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ausstehende Genehmigungen</CardTitle>
            <AlertCircle className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingApprovals}</div>
          </CardContent>
        </Card>
      </div>
      
      {/* Admin Sections */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="grid grid-cols-5">
          <TabsTrigger value="users">Benutzer</TabsTrigger>
          <TabsTrigger value="recycling-centers">Recyclinghöfe</TabsTrigger>
          <TabsTrigger value="marketplace">Marktplatz</TabsTrigger>
          <TabsTrigger value="content">Inhalte</TabsTrigger>
          <TabsTrigger value="analytics">Analysen</TabsTrigger>
        </TabsList>
        
        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link href="/admin/users" className="block">
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Benutzer verwalten</CardTitle>
                    <CardDescription>Benutzerkonten, Rollen und Berechtigungen</CardDescription>
                  </div>
                  <Users className="h-8 w-8 text-green-600" />
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">Benutzerdetails anzeigen, Rollen ändern, Konten verwalten und Berechtigungen konfigurieren.</p>
                </CardContent>
              </Card>
            </Link>
            
            <Link href="/admin/users/verification" className="block">
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Verifizierungen</CardTitle>
                    <CardDescription>Benutzer- und Unternehmensverifizierungen</CardDescription>
                  </div>
                  <Shield className="h-8 w-8 text-green-600" />
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">Überprüfung und Bestätigung von Benutzer- und Unternehmensdokumenten zur Verifizierung.</p>
                </CardContent>
              </Card>
            </Link>
            
            <Link href="/admin/users/reports" className="block">
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Benutzermeldungen</CardTitle>
                    <CardDescription>Gemeldete Benutzer überprüfen</CardDescription>
                  </div>
                  <Flag className="h-8 w-8 text-red-500" />
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">Überprüfen Sie gemeldete Benutzer und ergreifen Sie entsprechende Maßnahmen.</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </TabsContent>
        
        {/* Recycling Centers Tab */}
        <TabsContent value="recycling-centers" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link href="/admin/recycling-centers" className="block">
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Recyclinghöfe verwalten</CardTitle>
                    <CardDescription>Alle Recyclinghöfe anzeigen und bearbeiten</CardDescription>
                  </div>
                  <Building className="h-8 w-8 text-green-600" />
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">Recyclinghöfe anzeigen, bearbeiten, verifizieren oder löschen.</p>
                </CardContent>
              </Card>
            </Link>
            
            <Link href="/admin/recycling-centers/verification" className="block">
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Verifizierungsanfragen</CardTitle>
                    <CardDescription>Anfragen zur Verifizierung von Recyclinghöfen</CardDescription>
                  </div>
                  <Shield className="h-8 w-8 text-green-600" />
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">Überprüfen Sie Anfragen zur Verifizierung von Recyclinghöfen und Unternehmen.</p>
                </CardContent>
              </Card>
            </Link>
            
            <Link href="/admin/recycling-centers/claims" className="block">
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Anspruchsanfragen</CardTitle>
                    <CardDescription>Anfragen zur Übernahme bestehender Einträge</CardDescription>
                  </div>
                  <Store className="h-8 w-8 text-green-600" />
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">Überprüfen Sie Anfragen von Unternehmen, die bestehende Recyclinghofeinträge als ihre eigenen beanspruchen.</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </TabsContent>
        
        {/* Marketplace Tab */}
        <TabsContent value="marketplace" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link href="/admin/marketplace" className="block">
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Angebote verwalten</CardTitle>
                    <CardDescription>Marktplatzangebote überwachen</CardDescription>
                  </div>
                  <ShoppingBag className="h-8 w-8 text-green-600" />
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">Sehen Sie alle Angebote auf dem Marktplatz ein und moderieren Sie diese.</p>
                </CardContent>
              </Card>
            </Link>
            
            <Link href="/admin/marketplace/categories" className="block">
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Kategorien</CardTitle>
                    <CardDescription>Materialkategorien verwalten</CardDescription>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">Bearbeiten und organisieren Sie die Kategorien für Materialien auf dem Marktplatz.</p>
                </CardContent>
              </Card>
            </Link>
            
            <Link href="/admin/marketplace/reports" className="block">
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Gemeldete Angebote</CardTitle>
                    <CardDescription>Überprüfung problematischer Angebote</CardDescription>
                  </div>
                  <Flag className="h-8 w-8 text-red-500" />
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">Überprüfen Sie Angebote, die von Benutzern als problematisch gemeldet wurden.</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </TabsContent>
        
        {/* Content Tab */}
        <TabsContent value="content" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link href="/admin/blog" className="block">
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Blog verwalten</CardTitle>
                    <CardDescription>Blogbeiträge erstellen und bearbeiten</CardDescription>
                  </div>
                  <FileText className="h-8 w-8 text-green-600" />
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">Blogbeiträge erstellen, bearbeiten und veröffentlichen.</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </TabsContent>
        
        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link href="/admin/analytics" className="block">
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Benutzeraktivität</CardTitle>
                    <CardDescription>Übersicht über die Benutzeraktivität</CardDescription>
                  </div>
                  <User className="h-8 w-8 text-green-600" />
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">Analysen zur Benutzeraktivität, Anmeldungen und Interaktionen anzeigen.</p>
                </CardContent>
              </Card>
            </Link>
            
            <Link href="/admin/analytics/marketplace" className="block">
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Marktplatzanalysen</CardTitle>
                    <CardDescription>Marktplatzaktivität und Trends</CardDescription>
                  </div>
                  <BarChart3 className="h-8 w-8 text-green-600" />
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">Analysen zu Marktplatzaktivitäten, beliebtesten Materialien und Preisen anzeigen.</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 