import { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, AlertCircle, Info, Settings, Shield, Mail, Globe, Database, Server, Lock, Clock } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Einstellungen | Admin Dashboard | DAVR',
  description: 'Konfigurieren Sie globale Einstellungen für die DAVR-Plattform.',
};

export default function AdminSettingsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Einstellungen</h1>
          <p className="text-gray-600 mt-1">Systemweite Konfiguration der DAVR-Plattform</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1">
          <div className="sticky top-8">
            <nav className="space-y-1">
              <button className="w-full text-left px-3 py-2 bg-green-50 text-green-700 font-medium rounded-md">
                <Globe className="inline-block mr-2 h-5 w-5" />
                Allgemein
              </button>
              <button className="w-full text-left px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-md">
                <Mail className="inline-block mr-2 h-5 w-5" />
                E-Mail
              </button>
              <button className="w-full text-left px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-md">
                <Server className="inline-block mr-2 h-5 w-5" />
                API-Einstellungen
              </button>
              <button className="w-full text-left px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-md">
                <Database className="inline-block mr-2 h-5 w-5" />
                Datenbank
              </button>
              <button className="w-full text-left px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-md">
                <Shield className="inline-block mr-2 h-5 w-5" />
                Sicherheit
              </button>
              <button className="w-full text-left px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-md">
                <Lock className="inline-block mr-2 h-5 w-5" />
                Berechtigungen
              </button>
              <button className="w-full text-left px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-md">
                <Clock className="inline-block mr-2 h-5 w-5" />
                Cron Jobs
              </button>
              <button className="w-full text-left px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-md">
                <Settings className="inline-block mr-2 h-5 w-5" />
                Integrationen
              </button>
            </nav>
            
            <div className="mt-12 p-4 bg-blue-50 rounded-md text-blue-700 text-sm">
              <Info className="h-5 w-5 mb-2" />
              <p className="mb-2 font-medium">Hilfe zur Konfiguration</p>
              <p className="text-xs">
                Die vorgenommenen Änderungen können sich auf die gesamte Plattform auswirken. 
                Bei Fragen kontaktieren Sie bitte den Support.
              </p>
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-3 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Allgemeine Einstellungen</CardTitle>
              <CardDescription>
                Grundlegende Konfiguration der DAVR-Plattform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="site-name" className="block text-sm font-medium text-gray-700 mb-1">
                    Website-Name
                  </label>
                  <input
                    id="site-name"
                    type="text"
                    defaultValue="DAVR-Plattform"
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div>
                  <label htmlFor="site-url" className="block text-sm font-medium text-gray-700 mb-1">
                    Website-URL
                  </label>
                  <input
                    id="site-url"
                    type="url"
                    defaultValue="https://davr.example.com"
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div>
                  <label htmlFor="admin-email" className="block text-sm font-medium text-gray-700 mb-1">
                    Admin-E-Mail
                  </label>
                  <input
                    id="admin-email"
                    type="email"
                    defaultValue="admin@davr.example.com"
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div>
                  <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 mb-1">
                    Zeitzone
                  </label>
                  <select
                    id="timezone"
                    defaultValue="Europe/Berlin"
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="Europe/Berlin">Europe/Berlin</option>
                    <option value="Europe/London">Europe/London</option>
                    <option value="Europe/Paris">Europe/Paris</option>
                    <option value="Europe/Rome">Europe/Rome</option>
                    <option value="Europe/Madrid">Europe/Madrid</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label htmlFor="maintenance-mode" className="flex items-center">
                  <input
                    id="maintenance-mode"
                    type="checkbox"
                    className="mr-2 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Wartungsmodus aktivieren</span>
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Im Wartungsmodus ist die Website für normalen Benutzer nicht zugänglich.
                </p>
              </div>
              
              <div>
                <label htmlFor="meta-description" className="block text-sm font-medium text-gray-700 mb-1">
                  Standard Meta-Beschreibung
                </label>
                <textarea
                  id="meta-description"
                  rows={3}
                  defaultValue="DAVR-Plattform: Die führende Plattform für Recycling-Management und Materialaustausch."
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button variant="outline" className="mr-2">
                Zurücksetzen
              </Button>
              <Button>
                <Save className="h-4 w-4 mr-2" />
                Speichern
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Feature-Flags</CardTitle>
              <CardDescription>
                Aktivieren oder deaktivieren Sie bestimmte Funktionen auf der Plattform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Marktplatz</h4>
                    <p className="text-sm text-gray-500">Materialangebote und -gesuche auf dem Marktplatz</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Recycling-Zentren-Karte</h4>
                    <p className="text-sm text-gray-500">Interaktive Karte mit Recycling-Zentren</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Benutzer-Verifikation</h4>
                    <p className="text-sm text-gray-500">E-Mail-Verifikation für Benutzerkonten</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Material-Suchfunktion</h4>
                    <p className="text-sm text-gray-500">Erweiterte Suche für Materialien</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Materialpreisindex</h4>
                    <p className="text-sm text-gray-500">Materialpreisindex und Trendanalyse</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Blog</h4>
                    <p className="text-sm text-gray-500">Blog-Funktionalität</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                  </label>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button>Änderungen speichern</Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Cache-Management</CardTitle>
              <CardDescription>
                Verwalten Sie den Cache der Anwendung
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>Die Anwendung verwendet Caching, um die Leistung zu verbessern. Sie können den Cache leeren, falls Änderungen nicht sofort sichtbar sind.</p>
              
              <div className="bg-amber-50 border border-amber-200 rounded-md p-4 text-amber-700 flex items-start">
                <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Warnung</p>
                  <p className="text-sm mt-1">Das Leeren des Caches kann vorübergehend zu einer langsameren Leistung führen, bis der Cache wieder aufgebaut ist.</p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row gap-4 sm:justify-end">
              <Button variant="outline">Cache teilweise leeren</Button>
              <Button variant="outline" className="border-red-300 text-red-700 hover:bg-red-50">
                Cache vollständig leeren
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
} 