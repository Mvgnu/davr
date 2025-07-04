import { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowUpRight, ArrowDownRight, Users, ShoppingBag, Recycle, Globe, BarChart3, LineChart, PieChart, Calendar } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Analytics | Admin Dashboard | DAVR',
  description: 'Überwachen Sie die Leistung der DAVR-Plattform mit detaillierten Analysen und Berichten.',
};

// Sample data - would be fetched from a database or analytics API in a real implementation
const overviewData = {
  visitors: {
    value: 12438,
    change: 8.2,
    isPositive: true,
  },
  newUsers: {
    value: 3275,
    change: 12.5,
    isPositive: true,
  },
  marketplaceListings: {
    value: 843,
    change: 4.3,
    isPositive: true,
  },
  recyclingCenters: {
    value: 128,
    change: 2.1,
    isPositive: true,
  },
};

const topPages = [
  { path: '/', name: 'Startseite', views: 4521 },
  { path: '/recycling-centers', name: 'Recycling-Zentren', views: 2873 },
  { path: '/marketplace', name: 'Marktplatz', views: 2456 },
  { path: '/materials', name: 'Materialien', views: 1892 },
  { path: '/about', name: 'Über uns', views: 965 },
];

const browsers = [
  { name: 'Chrome', users: 7346 },
  { name: 'Safari', users: 2854 },
  { name: 'Firefox', users: 1432 },
  { name: 'Edge', users: 621 },
  { name: 'Other', users: 185 },
];

const devices = [
  { name: 'Desktop', percentage: 58 },
  { name: 'Mobile', percentage: 35 },
  { name: 'Tablet', percentage: 7 },
];

const monthlyTraffic = [
  { month: 'Jan', visitors: 8750 },
  { month: 'Feb', visitors: 9250 },
  { month: 'Mär', visitors: 10200 },
  { month: 'Apr', visitors: 11500 },
  { month: 'Mai', visitors: 12200 },
  { month: 'Jun', visitors: 12438 },
];

export default function AdminAnalyticsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Analytics & Statistiken</h1>
          <p className="text-gray-600 mt-1">Datenbasierte Einblicke zur Plattformnutzung</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Zeitraum:</span>
          <select className="bg-white border rounded-md px-3 py-1.5 text-sm">
            <option>Letzte 30 Tage</option>
            <option>Letzte 7 Tage</option>
            <option>Letzte 90 Tage</option>
            <option>Letztes Jahr</option>
            <option>Alle Zeiten</option>
          </select>
        </div>
      </div>
      
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Besucher</p>
                <h3 className="text-2xl font-bold mt-1">{overviewData.visitors.value.toLocaleString()}</h3>
                <div className={`flex items-center mt-1 text-sm ${
                  overviewData.visitors.isPositive ? 'text-green-600' : 'text-red-600'
                }`}>
                  {overviewData.visitors.isPositive ? 
                    <ArrowUpRight className="h-4 w-4 mr-1" /> : 
                    <ArrowDownRight className="h-4 w-4 mr-1" />
                  }
                  {overviewData.visitors.change}%
                </div>
              </div>
              <div className="bg-blue-100 p-2 rounded-md">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Neue Benutzer</p>
                <h3 className="text-2xl font-bold mt-1">{overviewData.newUsers.value.toLocaleString()}</h3>
                <div className={`flex items-center mt-1 text-sm ${
                  overviewData.newUsers.isPositive ? 'text-green-600' : 'text-red-600'
                }`}>
                  {overviewData.newUsers.isPositive ? 
                    <ArrowUpRight className="h-4 w-4 mr-1" /> : 
                    <ArrowDownRight className="h-4 w-4 mr-1" />
                  }
                  {overviewData.newUsers.change}%
                </div>
              </div>
              <div className="bg-green-100 p-2 rounded-md">
                <Users className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Marktplatz-Angebote</p>
                <h3 className="text-2xl font-bold mt-1">{overviewData.marketplaceListings.value.toLocaleString()}</h3>
                <div className={`flex items-center mt-1 text-sm ${
                  overviewData.marketplaceListings.isPositive ? 'text-green-600' : 'text-red-600'
                }`}>
                  {overviewData.marketplaceListings.isPositive ? 
                    <ArrowUpRight className="h-4 w-4 mr-1" /> : 
                    <ArrowDownRight className="h-4 w-4 mr-1" />
                  }
                  {overviewData.marketplaceListings.change}%
                </div>
              </div>
              <div className="bg-yellow-100 p-2 rounded-md">
                <ShoppingBag className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Recycling-Zentren</p>
                <h3 className="text-2xl font-bold mt-1">{overviewData.recyclingCenters.value.toLocaleString()}</h3>
                <div className={`flex items-center mt-1 text-sm ${
                  overviewData.recyclingCenters.isPositive ? 'text-green-600' : 'text-red-600'
                }`}>
                  {overviewData.recyclingCenters.isPositive ? 
                    <ArrowUpRight className="h-4 w-4 mr-1" /> : 
                    <ArrowDownRight className="h-4 w-4 mr-1" />
                  }
                  {overviewData.recyclingCenters.change}%
                </div>
              </div>
              <div className="bg-purple-100 p-2 rounded-md">
                <Recycle className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Visitor Trend */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Besuchertrend</CardTitle>
            <CardDescription>Monatliche Besucherzahlen</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-end justify-between">
              {monthlyTraffic.map((month) => (
                <div key={month.month} className="flex flex-col items-center w-1/6">
                  <div 
                    className="w-full bg-blue-500 rounded-t-md" 
                    style={{ 
                      height: `${(month.visitors / 15000) * 260}px` 
                    }}
                  />
                  <span className="text-xs mt-2">{month.month}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* Device Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Geräteverteilung</CardTitle>
            <CardDescription>Verteilung der Nutzergeräte</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center mb-4">
              <div className="relative w-32 h-32 rounded-full bg-gray-100">
                <div 
                  className="absolute inset-2 rounded-full border-8 border-blue-500"
                  style={{ 
                    clipPath: `polygon(0 0, 100% 0, 100% ${devices[0].percentage}%, 0 ${devices[0].percentage}%)` 
                  }}
                />
                <div 
                  className="absolute inset-2 rounded-full border-8 border-green-500"
                  style={{ 
                    clipPath: `polygon(0 ${devices[0].percentage}%, 100% ${devices[0].percentage}%, 100% ${devices[0].percentage + devices[1].percentage}%, 0 ${devices[0].percentage + devices[1].percentage}%)` 
                  }}
                />
                <div 
                  className="absolute inset-2 rounded-full border-8 border-yellow-500"
                  style={{ 
                    clipPath: `polygon(0 ${devices[0].percentage + devices[1].percentage}%, 100% ${devices[0].percentage + devices[1].percentage}%, 100% 100%, 0 100%)` 
                  }}
                />
              </div>
            </div>
            <div className="space-y-2">
              {devices.map((device, index) => (
                <div key={device.name} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-2 ${
                      index === 0 ? 'bg-blue-500' : index === 1 ? 'bg-green-500' : 'bg-yellow-500'
                    }`} />
                    <span className="text-sm">{device.name}</span>
                  </div>
                  <span className="text-sm font-medium">{device.percentage}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Top Pages */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Meistbesuchte Seiten</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topPages.map((page, index) => (
                <div key={page.path} className="flex justify-between items-center">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-500 w-5">{index + 1}</span>
                    <span className="ml-2">{page.name}</span>
                    <span className="ml-2 text-xs text-gray-500">{page.path}</span>
                  </div>
                  <span className="font-medium">{page.views.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* Browsers */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Browser</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {browsers.map((browser) => (
                <div key={browser.name} className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span>{browser.name}</span>
                    <span className="text-sm font-medium">{browser.users.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ width: `${(browser.users / browsers[0].users) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Weitere Analysen</CardTitle>
            <CardDescription>
              Diese Seite zeigt Beispieldaten für Demonstrationszwecke. In einer vollständigen Implementierung würden 
              hier echte Analysedaten angezeigt werden, die aus verschiedenen Quellen wie Google Analytics, 
              Datenbankabfragen oder anderen Analytics-Diensten stammen.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 border rounded-md text-center hover:bg-gray-50 transition-colors">
                <BarChart3 className="mx-auto h-8 w-8 text-gray-500 mb-2" />
                <h3 className="font-medium">Benutzeraktivität</h3>
              </div>
              <div className="p-4 border rounded-md text-center hover:bg-gray-50 transition-colors">
                <LineChart className="mx-auto h-8 w-8 text-gray-500 mb-2" />
                <h3 className="font-medium">Leistungsdaten</h3>
              </div>
              <div className="p-4 border rounded-md text-center hover:bg-gray-50 transition-colors">
                <PieChart className="mx-auto h-8 w-8 text-gray-500 mb-2" />
                <h3 className="font-medium">Materialverteilung</h3>
              </div>
              <div className="p-4 border rounded-md text-center hover:bg-gray-50 transition-colors">
                <Calendar className="mx-auto h-8 w-8 text-gray-500 mb-2" />
                <h3 className="font-medium">Ereignistracking</h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 