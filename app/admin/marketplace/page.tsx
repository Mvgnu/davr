import { Metadata } from 'next';
import Link from 'next/link';
import { 
  Eye, 
  Flag, 
  Trash, 
  MoreHorizontal, 
  Search, 
  Check, 
  X, 
  Plus, 
  ExternalLink,
  MessageSquare,
  Tag
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/ui/pagination';

// Helper function to create dropdown menu components (since they don't exist yet)
const DropdownMenu = ({ children }: { children: React.ReactNode }) => <div className="relative">{children}</div>;
const DropdownMenuTrigger = ({ asChild, children }: { asChild?: boolean, children: React.ReactNode }) => <div>{children}</div>;
const DropdownMenuContent = ({ align, children }: { align?: string, children: React.ReactNode }) => <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white z-10">{children}</div>;
const DropdownMenuLabel = ({ children }: { children: React.ReactNode }) => <div className="px-4 py-2 text-sm text-gray-700 font-medium">{children}</div>;
const DropdownMenuItem = ({ children, className }: { children: React.ReactNode, className?: string }) => <div className={`px-4 py-2 text-sm cursor-pointer hover:bg-gray-100 ${className || ''}`}>{children}</div>;
const DropdownMenuSeparator = () => <div className="border-t border-gray-200 my-1"></div>;

// Helper function to create table components (since they don't exist yet)
const Table = ({ children }: { children: React.ReactNode }) => <div className="w-full overflow-auto"><table className="w-full caption-bottom text-sm">{children}</table></div>;
const TableHeader = ({ children }: { children: React.ReactNode }) => <thead className="[&_tr]:border-b">{children}</thead>;
const TableBody = ({ children }: { children: React.ReactNode }) => <tbody className="[&_tr:last-child]:border-0">{children}</tbody>;
const TableRow = ({ children }: { children: React.ReactNode }) => <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">{children}</tr>;
const TableHead = ({ children, className }: { children: React.ReactNode, className?: string }) => <th className={`h-12 px-4 text-left align-middle font-medium text-muted-foreground ${className || ''}`}>{children}</th>;
const TableCell = ({ children, className }: { children: React.ReactNode, className?: string }) => <td className={`p-4 align-middle ${className || ''}`}>{children}</td>;

export const metadata: Metadata = {
  title: 'Marktplatz verwalten | Admin Dashboard | DAVR',
  description: 'Verwalten und moderieren Sie Marktplatzangebote auf der DAVR-Plattform.',
};

// Define listing type for TypeScript
type ListingType = 'buy' | 'sell';

// Define listing status for TypeScript
type ListingStatus = 'active' | 'pending' | 'closed' | 'flagged';

interface Listing {
  id: string;
  title: string;
  type: ListingType;
  price: number | null;
  quantity: number;
  unit: string;
  material: string;
  createdAt: string;
  updatedAt: string | null;
  status: ListingStatus;
  owner: {
    id: string;
    name: string;
    verified: boolean;
  };
  location: string;
  reportCount: number;
}

// Sample data - this would come from an API in a real implementation
const marketplaceListings: Listing[] = [
  {
    id: '1',
    title: 'Altpapier in großen Mengen zu verkaufen',
    type: 'sell',
    price: 120,
    quantity: 500,
    unit: 'kg',
    material: 'Papier',
    createdAt: '2024-03-15',
    updatedAt: '2024-04-10',
    status: 'active',
    owner: {
      id: '101',
      name: 'Papierfabrik Schmidt GmbH',
      verified: true,
    },
    location: 'München',
    reportCount: 0,
  },
  {
    id: '2',
    title: 'Suche PET-Flaschen für Recycling',
    type: 'buy',
    price: 0.15,
    quantity: 1000,
    unit: 'Stück',
    material: 'Kunststoff',
    createdAt: '2024-03-20',
    updatedAt: null,
    status: 'active',
    owner: {
      id: '102',
      name: 'RecyclingPlus UG',
      verified: true,
    },
    location: 'Berlin',
    reportCount: 0,
  },
  {
    id: '3',
    title: 'Metallschrott gemischt abzugeben',
    type: 'sell',
    price: 180,
    quantity: 250,
    unit: 'kg',
    material: 'Metall',
    createdAt: '2024-04-01',
    updatedAt: null,
    status: 'active',
    owner: {
      id: '103',
      name: 'Peter Müller',
      verified: false,
    },
    location: 'Hamburg',
    reportCount: 0,
  },
  {
    id: '4',
    title: 'Kaufe Altglas jeglicher Art',
    type: 'buy',
    price: null,
    quantity: 1000,
    unit: 'kg',
    material: 'Glas',
    createdAt: '2024-03-25',
    updatedAt: '2024-04-05',
    status: 'closed',
    owner: {
      id: '104',
      name: 'Glasrecycling Nord GmbH',
      verified: true,
    },
    location: 'Hamburg',
    reportCount: 0,
  },
  {
    id: '5',
    title: 'Elektronikschrott zu verkaufen',
    type: 'sell',
    price: 200,
    quantity: 100,
    unit: 'kg',
    material: 'Elektronik',
    createdAt: '2024-04-08',
    updatedAt: null,
    status: 'pending',
    owner: {
      id: '105',
      name: 'Michael Weber',
      verified: false,
    },
    location: 'Frankfurt',
    reportCount: 0,
  },
  {
    id: '6',
    title: 'Suche Kupferkabel und -drähte',
    type: 'buy',
    price: 4.5,
    quantity: 500,
    unit: 'kg',
    material: 'Kupfer',
    createdAt: '2024-04-05',
    updatedAt: '2024-04-12',
    status: 'active',
    owner: {
      id: '106',
      name: 'Metall-Recycling Schneider',
      verified: true,
    },
    location: 'Köln',
    reportCount: 0,
  },
  {
    id: '7',
    title: 'Große Menge Bauholz abzugeben',
    type: 'sell',
    price: 80,
    quantity: 2000,
    unit: 'kg',
    material: 'Holz',
    createdAt: '2024-03-18',
    updatedAt: null,
    status: 'flagged',
    owner: {
      id: '107',
      name: 'Baufirma Wagner',
      verified: false,
    },
    location: 'Stuttgart',
    reportCount: 3,
  },
  {
    id: '8',
    title: 'Kaufe Aluminiumdosen in großen Mengen',
    type: 'buy',
    price: 1.2,
    quantity: 800,
    unit: 'kg',
    material: 'Aluminium',
    createdAt: '2024-04-02',
    updatedAt: '2024-04-14',
    status: 'active',
    owner: {
      id: '108',
      name: 'Alu-Recycling GmbH',
      verified: true,
    },
    location: 'Düsseldorf',
    reportCount: 1,
  },
  {
    id: '9',
    title: 'Bauschutt gemischt abzugeben',
    type: 'sell',
    price: 25,
    quantity: 5000,
    unit: 'kg',
    material: 'Bauschutt',
    createdAt: '2024-04-10',
    updatedAt: null,
    status: 'active',
    owner: {
      id: '109',
      name: 'Abbruch & Entsorgung Schmidt',
      verified: true,
    },
    location: 'Leipzig',
    reportCount: 0,
  },
  {
    id: '10',
    title: 'Suche Autobatterien zum Recycling',
    type: 'buy',
    price: 5,
    quantity: 100,
    unit: 'Stück',
    material: 'Batterien',
    createdAt: '2024-03-22',
    updatedAt: '2024-04-08',
    status: 'pending',
    owner: {
      id: '110',
      name: 'EcoRecycle UG',
      verified: false,
    },
    location: 'Nürnberg',
    reportCount: 0,
  }
];

// Helper function to format price
const formatPrice = (price: number | null): string => {
  if (price === null) return 'Verhandelbar';
  return `${price.toFixed(2)} €`;
};

// Helper function to get badge for listing type
const getTypeBadge = (type: ListingType) => {
  switch (type) {
    case 'buy':
      return <Badge className="bg-blue-500">Kaufgesuch</Badge>;
    case 'sell':
      return <Badge className="bg-green-500">Verkaufsangebot</Badge>;
    default:
      return <Badge className="bg-gray-500">Unbekannt</Badge>;
  }
};

// Helper function to get badge for listing status
const getStatusBadge = (status: ListingStatus, reportCount: number) => {
  if (reportCount > 0) {
    return <Badge className="bg-red-500">Gemeldet ({reportCount})</Badge>;
  }
  
  switch (status) {
    case 'active':
      return <Badge className="bg-green-500">Aktiv</Badge>;
    case 'pending':
      return <Badge className="bg-yellow-500">Ausstehend</Badge>;
    case 'closed':
      return <Badge className="bg-gray-500">Geschlossen</Badge>;
    case 'flagged':
      return <Badge className="bg-red-500">Markiert</Badge>;
    default:
      return <Badge className="bg-gray-500">Unbekannt</Badge>;
  }
};

export default function AdminMarketplacePage() {
  // Pagination data (would be connected to API in real implementation)
  const pagination = {
    total: 125,
    page: 1,
    limit: 10,
    totalPages: 13,
  };
  
  // Handler for page changes
  const handlePageChange = (page: number) => {
    // In real implementation, this would update the URL or fetch new data
    console.log(`Changing to page ${page}`);
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Marktplatz verwalten</h1>
          <p className="text-gray-600 mt-1">Alle Marktplatzangebote anzeigen, moderieren oder löschen</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/marketplace/categories">
            <Button variant="outline">
              <Tag className="mr-2 h-4 w-4" />
              Kategorien verwalten
            </Button>
          </Link>
          <Link href="/admin/marketplace/reports">
            <Button variant="outline">
              <Flag className="mr-2 h-4 w-4" />
              Gemeldete Angebote
            </Button>
          </Link>
        </div>
      </div>
      
      {/* Filters and Search */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Suche nach Titel, Material oder ID..."
                className="pl-8"
              />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <select className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background w-full sm:w-[180px]">
                <option value="all-types">Alle Typen</option>
                <option value="buy">Kaufgesuche</option>
                <option value="sell">Verkaufsangebote</option>
              </select>
              
              <select className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background w-full sm:w-[180px]">
                <option value="all-status">Alle Status</option>
                <option value="active">Aktiv</option>
                <option value="pending">Ausstehend</option>
                <option value="closed">Geschlossen</option>
                <option value="flagged">Markiert</option>
              </select>
              
              <select className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background w-full sm:w-[180px]">
                <option value="all-materials">Alle Materialien</option>
                <option value="paper">Papier</option>
                <option value="plastic">Kunststoff</option>
                <option value="metal">Metall</option>
                <option value="glass">Glas</option>
                <option value="electronics">Elektronik</option>
                <option value="wood">Holz</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Marketplace Listings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Marktplatzangebote</CardTitle>
          <CardDescription>
            Insgesamt {pagination.total} Angebote, Seite {pagination.page} von {pagination.totalPages}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Titel</TableHead>
                <TableHead>Typ</TableHead>
                <TableHead>Material</TableHead>
                <TableHead>Menge</TableHead>
                <TableHead>Preis</TableHead>
                <TableHead>Anbieter</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Datum</TableHead>
                <TableHead className="text-right">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {marketplaceListings.map((listing) => (
                <TableRow key={listing.id}>
                  <TableCell className="font-medium">{listing.title}</TableCell>
                  <TableCell>{getTypeBadge(listing.type)}</TableCell>
                  <TableCell>{listing.material}</TableCell>
                  <TableCell>{`${listing.quantity} ${listing.unit}`}</TableCell>
                  <TableCell>{formatPrice(listing.price)}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{listing.owner.name}</span>
                      <span className="text-xs text-gray-500">
                        {listing.owner.verified ? (
                          <span className="flex items-center">
                            <Check className="h-3 w-3 text-green-500 mr-1" />
                            Verifiziert
                          </span>
                        ) : (
                          "Nicht verifiziert"
                        )}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(listing.status, listing.reportCount)}</TableCell>
                  <TableCell>{listing.updatedAt || listing.createdAt}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Menü öffnen</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Aktionen</DropdownMenuLabel>
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          <span>Details anzeigen</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <ExternalLink className="mr-2 h-4 w-4" />
                          <span>Öffentliche Ansicht</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <MessageSquare className="mr-2 h-4 w-4" />
                          <span>Anbieter kontaktieren</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {listing.status === 'pending' && (
                          <DropdownMenuItem className="text-green-600">
                            <Check className="mr-2 h-4 w-4" />
                            <span>Freigeben</span>
                          </DropdownMenuItem>
                        )}
                        {listing.status === 'active' && (
                          <DropdownMenuItem className="text-yellow-600">
                            <X className="mr-2 h-4 w-4" />
                            <span>Deaktivieren</span>
                          </DropdownMenuItem>
                        )}
                        {listing.reportCount > 0 && (
                          <DropdownMenuItem className="text-blue-600">
                            <Flag className="mr-2 h-4 w-4" />
                            <span>Meldungen prüfen</span>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem className="text-red-600">
                          <Trash className="mr-2 h-4 w-4" />
                          <span>Löschen</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          <div className="mt-6">
            <Pagination 
              currentPage={pagination.page} 
              totalPages={pagination.totalPages} 
              onPageChange={handlePageChange} 
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 