import { Metadata } from 'next';
import Link from 'next/link';
import { 
  Edit, 
  Trash, 
  MoreHorizontal, 
  Search, 
  MapPin, 
  Plus, 
  Eye, 
  Phone,
  Mail,
  CheckCircle,
  XCircle
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/ui/pagination';

// Helper function to create dropdown menu components
const DropdownMenu = ({ children }: { children: React.ReactNode }) => <div className="relative">{children}</div>;
const DropdownMenuTrigger = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
const DropdownMenuContent = ({ align, children }: { align?: string, children: React.ReactNode }) => <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white z-10">{children}</div>;
const DropdownMenuLabel = ({ children }: { children: React.ReactNode }) => <div className="px-4 py-2 text-sm text-gray-700 font-medium">{children}</div>;
const DropdownMenuItem = ({ children, className }: { children: React.ReactNode, className?: string }) => <div className={`px-4 py-2 text-sm cursor-pointer hover:bg-gray-100 ${className || ''}`}>{children}</div>;
const DropdownMenuSeparator = () => <div className="border-t border-gray-200 my-1"></div>;

// Helper function to create table components
const Table = ({ children }: { children: React.ReactNode }) => <div className="w-full overflow-auto"><table className="w-full caption-bottom text-sm">{children}</table></div>;
const TableHeader = ({ children }: { children: React.ReactNode }) => <thead className="[&_tr]:border-b">{children}</thead>;
const TableBody = ({ children }: { children: React.ReactNode }) => <tbody className="[&_tr:last-child]:border-0">{children}</tbody>;
const TableRow = ({ children }: { children: React.ReactNode }) => <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">{children}</tr>;
const TableHead = ({ children, className }: { children: React.ReactNode, className?: string }) => <th className={`h-12 px-4 text-left align-middle font-medium text-muted-foreground ${className || ''}`}>{children}</th>;
const TableCell = ({ children, className }: { children: React.ReactNode, className?: string }) => <td className={`p-4 align-middle ${className || ''}`}>{children}</td>;

export const metadata: Metadata = {
  title: 'Recyclinghöfe verwalten | Admin Dashboard | DAVR',
  description: 'Verwalten und moderieren Sie Recyclinghöfe auf der DAVR-Plattform.',
};

// Type for recycling center
interface RecyclingCenter {
  id: string;
  name: string;
  city: string;
  address: string;
  materials: string[];
  contactEmail: string | null;
  contactPhone: string | null;
  verified: boolean;
  owner: {
    id: string;
    name: string;
    verified: boolean;
  } | null;
  createdAt: string;
  updatedAt: string | null;
}

// Sample data - this would come from an API in a real implementation
const recyclingCenters: RecyclingCenter[] = [
  {
    id: '1',
    name: 'Recyclinghof Neuaubing',
    city: 'München',
    address: 'Freihamstraße 72, 81249 München',
    materials: ['Papier', 'Metall', 'Glas', 'Elektronik'],
    contactEmail: 'info@awm-muenchen.de',
    contactPhone: '+49 89 233 96200',
    verified: true,
    owner: {
      id: '101',
      name: 'Abfallwirtschaftsbetrieb München',
      verified: true,
    },
    createdAt: '2023-05-15',
    updatedAt: '2024-02-10',
  },
  {
    id: '2',
    name: 'BSR Recyclinghof Gradestraße',
    city: 'Berlin',
    address: 'Gradestraße 73-99, 12347 Berlin',
    materials: ['Papier', 'Kunststoff', 'Glas', 'Holz', 'Bauschutt'],
    contactEmail: 'info@bsr.de',
    contactPhone: '+49 30 7592 4900',
    verified: true,
    owner: {
      id: '102',
      name: 'Berliner Stadtreinigung',
      verified: true,
    },
    createdAt: '2023-06-20',
    updatedAt: null,
  },
  {
    id: '3',
    name: 'Wertstoffhof Feldmoching',
    city: 'München',
    address: 'Lerchenstraße 13, 80995 München',
    materials: ['Papier', 'Metall', 'Glas', 'Elektronik', 'Batterien'],
    contactEmail: 'info@awm-muenchen.de',
    contactPhone: '+49 89 233 96200',
    verified: true,
    owner: {
      id: '101',
      name: 'Abfallwirtschaftsbetrieb München',
      verified: true,
    },
    createdAt: '2023-08-05',
    updatedAt: '2024-01-15',
  },
  {
    id: '4',
    name: 'Recyclinghof Hamburg-Harburg',
    city: 'Hamburg',
    address: 'Wilstorfer Straße 5, 21073 Hamburg',
    materials: ['Papier', 'Kunststoff', 'Holz', 'Glas', 'Metall'],
    contactEmail: 'info@stadtreinigung.hamburg',
    contactPhone: '+49 40 2576 1111',
    verified: true,
    owner: {
      id: '103',
      name: 'Stadtreinigung Hamburg',
      verified: true,
    },
    createdAt: '2023-09-12',
    updatedAt: null,
  },
  {
    id: '5',
    name: 'Recyclinghof Köln-Ossendorf',
    city: 'Köln',
    address: 'Butzweilerhofallee 50, 50829 Köln',
    materials: ['Papier', 'Kunststoff', 'Elektronik', 'Batterien'],
    contactEmail: 'abfallberatung@awbkoeln.de',
    contactPhone: '+49 221 9222 2222',
    verified: false,
    owner: null,
    createdAt: '2024-01-08',
    updatedAt: null,
  },
  {
    id: '6',
    name: 'Wertstoffhof Frankfurt-Kalbach',
    city: 'Frankfurt',
    address: 'Am Martinszehnten 29, 60437 Frankfurt am Main',
    materials: ['Papier', 'Elektronik', 'Kunststoff', 'Glas', 'Metall'],
    contactEmail: 'info@fes-frankfurt.de',
    contactPhone: '+49 69 212 35400',
    verified: true,
    owner: {
      id: '104',
      name: 'FES Frankfurter Entsorgungs-Service',
      verified: true,
    },
    createdAt: '2023-11-22',
    updatedAt: '2024-03-15',
  },
  {
    id: '7',
    name: 'BRAL Recycling Mitte',
    city: 'Berlin',
    address: 'Beuthstraße 21, 10117 Berlin',
    materials: ['Kunststoff', 'Metall', 'Elektronik'],
    contactEmail: 'kontakt@bral-recycling.de',
    contactPhone: '+49 30 555 7890',
    verified: false,
    owner: {
      id: '105',
      name: 'BRAL Recycling GmbH',
      verified: false,
    },
    createdAt: '2024-02-05',
    updatedAt: null,
  },
  {
    id: '8',
    name: 'Wertstoffcenter Düsseldorf-Reisholz',
    city: 'Düsseldorf',
    address: 'Nürnberger Straße 40, 40599 Düsseldorf',
    materials: ['Papier', 'Kunststoff', 'Glas', 'Holz', 'Bauschutt'],
    contactEmail: 'kundenservice@awista.de',
    contactPhone: '+49 211 8300',
    verified: true,
    owner: {
      id: '106',
      name: 'AWISTA Gesellschaft für Abfallwirtschaft und Stadtreinigung',
      verified: true,
    },
    createdAt: '2023-07-15',
    updatedAt: '2024-01-22',
  },
  {
    id: '9',
    name: 'Recyclinghof Stuttgart-Hedelfingen',
    city: 'Stuttgart',
    address: 'In den Ringelgärten 20, 70327 Stuttgart',
    materials: ['Papier', 'Kunststoff', 'Holz', 'Glas', 'Elektronik'],
    contactEmail: 'kundenservice@aws-stuttgart.de',
    contactPhone: '+49 711 216 88700',
    verified: true,
    owner: {
      id: '107',
      name: 'Abfallwirtschaft Stuttgart',
      verified: true,
    },
    createdAt: '2023-10-10',
    updatedAt: null,
  },
  {
    id: '10',
    name: 'Wertstoffhof Leipzig-Grünau',
    city: 'Leipzig',
    address: 'Ratzelstraße 20, 04207 Leipzig',
    materials: ['Papier', 'Kunststoff', 'Metall', 'Holz'],
    contactEmail: 'service@stadtreinigung-leipzig.de',
    contactPhone: '+49 341 6571 111',
    verified: false,
    owner: null,
    createdAt: '2024-03-01',
    updatedAt: null,
  }
];

export default function AdminRecyclingCentersPage() {
  // Pagination data (would be connected to API in real implementation)
  const pagination = {
    total: 43,
    page: 1,
    limit: 10,
    totalPages: 5,
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
          <h1 className="text-3xl font-bold">Recyclinghöfe verwalten</h1>
          <p className="text-gray-600 mt-1">Alle Recyclinghöfe anzeigen, bearbeiten oder löschen</p>
        </div>
        <Link href="/admin/recycling-centers/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Neuen Recyclinghof hinzufügen
          </Button>
        </Link>
      </div>
      
      {/* Filters and Search */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Suche nach Name, Stadt oder Adresse..."
                className="pl-8"
              />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <select className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background w-full sm:w-[180px]">
                <option value="all-cities">Alle Städte</option>
                <option value="berlin">Berlin</option>
                <option value="hamburg">Hamburg</option>
                <option value="münchen">München</option>
                <option value="köln">Köln</option>
                <option value="frankfurt">Frankfurt</option>
              </select>
              
              <select className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background w-full sm:w-[180px]">
                <option value="all-materials">Alle Materialien</option>
                <option value="papier">Papier</option>
                <option value="kunststoff">Kunststoff</option>
                <option value="glas">Glas</option>
                <option value="metall">Metall</option>
                <option value="elektronik">Elektronik</option>
              </select>
              
              <select className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background w-full sm:w-[180px]">
                <option value="all-verification">Alle</option>
                <option value="verified">Verifiziert</option>
                <option value="unverified">Nicht verifiziert</option>
                <option value="claimed">Mit Besitzer</option>
                <option value="unclaimed">Ohne Besitzer</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Recycling Centers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recyclinghöfe</CardTitle>
          <CardDescription>
            Insgesamt {pagination.total} Recyclinghöfe, Seite {pagination.page} von {pagination.totalPages}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Stadt</TableHead>
                <TableHead>Materialien</TableHead>
                <TableHead>Kontakt</TableHead>
                <TableHead>Besitzer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Hinzugefügt</TableHead>
                <TableHead className="text-right">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recyclingCenters.map((center) => (
                <TableRow key={center.id}>
                  <TableCell className="font-medium">{center.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <MapPin className="h-3.5 w-3.5 mr-1 text-gray-500" />
                      <span>{center.city}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {center.materials.slice(0, 2).map((material, index) => (
                        <Badge key={index} variant="outline" className="mr-1">
                          {material}
                        </Badge>
                      ))}
                      {center.materials.length > 2 && (
                        <Badge variant="outline" className="bg-gray-100">
                          +{center.materials.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {center.contactEmail && (
                        <div className="flex items-center text-xs">
                          <Mail className="h-3 w-3 mr-1 text-gray-500" />
                          <span className="truncate max-w-[120px]">
                            {center.contactEmail}
                          </span>
                        </div>
                      )}
                      {center.contactPhone && (
                        <div className="flex items-center text-xs">
                          <Phone className="h-3 w-3 mr-1 text-gray-500" />
                          <span>{center.contactPhone}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {center.owner ? (
                      <div className="flex flex-col">
                        <span className="truncate max-w-[140px]">{center.owner.name}</span>
                        <span className="text-xs text-gray-500">
                          {center.owner.verified ? (
                            <span className="flex items-center">
                              <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                              Verifiziert
                            </span>
                          ) : (
                            "Nicht verifiziert"
                          )}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {center.verified ? (
                      <Badge className="bg-green-500">Verifiziert</Badge>
                    ) : (
                      <Badge className="bg-yellow-500">Ausstehend</Badge>
                    )}
                  </TableCell>
                  <TableCell>{center.updatedAt || center.createdAt}</TableCell>
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
                          <Edit className="mr-2 h-4 w-4" />
                          <span>Bearbeiten</span>
                        </DropdownMenuItem>
                        {!center.verified && (
                          <DropdownMenuItem className="text-green-600">
                            <CheckCircle className="mr-2 h-4 w-4" />
                            <span>Verifizieren</span>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
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