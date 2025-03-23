import { Metadata } from 'next';
import Link from 'next/link';
import { 
  CheckCircle, 
  XCircle, 
  Shield, 
  MoreHorizontal, 
  Search, 
  Filter, 
  User,
  UserPlus
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
import { Badge } from '@/components/ui/badge';

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
  title: 'Benutzerverwaltung | Admin Dashboard | DAVR',
  description: 'Verwalten Sie Benutzerkonten, Rollen und Berechtigungen auf der DAVR-Plattform.',
};

// Sample data - would be fetched from an API in real implementation
const users = [
  {
    id: '1',
    name: 'Max Mustermann',
    email: 'max@example.com',
    verified: true,
    role: 'user',
    registeredAt: '2023-10-15',
    lastLogin: '2024-04-18',
    status: 'active',
  },
  {
    id: '2',
    name: 'Anna Schmidt',
    email: 'anna@example.com',
    verified: true,
    role: 'business',
    registeredAt: '2023-11-22',
    lastLogin: '2024-04-17',
    status: 'active',
  },
  {
    id: '3',
    name: 'Hans Müller',
    email: 'hans@example.com',
    verified: false,
    role: 'user',
    registeredAt: '2024-01-05',
    lastLogin: '2024-03-30',
    status: 'pending',
  },
  {
    id: '4',
    name: 'Lisa Weber',
    email: 'lisa@example.com',
    verified: true,
    role: 'business',
    registeredAt: '2023-09-08',
    lastLogin: '2024-04-16',
    status: 'active',
  },
  {
    id: '5',
    name: 'Thomas Becker',
    email: 'thomas@example.com',
    verified: true,
    role: 'admin',
    registeredAt: '2023-08-12',
    lastLogin: '2024-04-18',
    status: 'active',
  },
  {
    id: '6',
    name: 'Julia Fischer',
    email: 'julia@example.com',
    verified: false,
    role: 'user',
    registeredAt: '2024-02-10',
    lastLogin: '2024-03-15',
    status: 'suspended',
  },
  {
    id: '7',
    name: 'Michael Schneider',
    email: 'michael@example.com',
    verified: true,
    role: 'user',
    registeredAt: '2023-12-01',
    lastLogin: '2024-04-10',
    status: 'active',
  },
  {
    id: '8',
    name: 'Sarah Hoffmann',
    email: 'sarah@example.com',
    verified: true,
    role: 'business',
    registeredAt: '2024-01-18',
    lastLogin: '2024-04-15',
    status: 'active',
  },
  {
    id: '9',
    name: 'David Wagner',
    email: 'david@example.com',
    verified: true,
    role: 'user',
    registeredAt: '2023-10-30',
    lastLogin: '2024-04-05',
    status: 'active',
  },
  {
    id: '10',
    name: 'Laura Meyer',
    email: 'laura@example.com',
    verified: false,
    role: 'business',
    registeredAt: '2024-03-05',
    lastLogin: null,
    status: 'pending',
  }
];

// Functions to manage user roles, verification and status
const getRoleBadge = (role: string) => {
  switch (role) {
    case 'admin':
      return <Badge className="bg-purple-500">Admin</Badge>;
    case 'business':
      return <Badge className="bg-blue-500">Unternehmen</Badge>;
    default:
      return <Badge className="bg-gray-500">Benutzer</Badge>;
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'active':
      return <Badge className="bg-green-500">Aktiv</Badge>;
    case 'pending':
      return <Badge className="bg-yellow-500">Ausstehend</Badge>;
    case 'suspended':
      return <Badge className="bg-red-500">Gesperrt</Badge>;
    default:
      return <Badge className="bg-gray-500">Unbekannt</Badge>;
  }
};

export default function AdminUsersPage() {
  // Pagination data (would be connected to API in real implementation)
  const pagination = {
    total: 87,
    page: 1,
    limit: 10,
    totalPages: 9,
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
          <h1 className="text-3xl font-bold">Benutzerverwaltung</h1>
          <p className="text-gray-600 mt-1">Benutzerkonten verwalten und Rollen zuweisen</p>
        </div>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Neuen Benutzer anlegen
        </Button>
      </div>
      
      {/* Filters and Search */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Suche nach Name, Email oder ID..."
                className="pl-8"
              />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <select className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background w-full sm:w-[180px]">
                <option value="all-roles">Alle Rollen</option>
                <option value="user">Benutzer</option>
                <option value="business">Unternehmen</option>
                <option value="admin">Admin</option>
              </select>
              
              <select className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background w-full sm:w-[180px]">
                <option value="all-status">Alle Status</option>
                <option value="active">Aktiv</option>
                <option value="pending">Ausstehend</option>
                <option value="suspended">Gesperrt</option>
              </select>
              
              <select className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background w-full sm:w-[180px]">
                <option value="all-verification">Alle</option>
                <option value="verified">Verifiziert</option>
                <option value="unverified">Nicht verifiziert</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Benutzer</CardTitle>
          <CardDescription>
            Insgesamt {pagination.total} Benutzer, Seite {pagination.page} von {pagination.totalPages}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rolle</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Verifiziert</TableHead>
                <TableHead>Registriert am</TableHead>
                <TableHead>Letzter Login</TableHead>
                <TableHead className="text-right">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell>{getStatusBadge(user.status)}</TableCell>
                  <TableCell>
                    {user.verified ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                  </TableCell>
                  <TableCell>{user.registeredAt}</TableCell>
                  <TableCell>{user.lastLogin || 'Nie'}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Menü öffnen</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Aktionen</DropdownMenuLabel>
                        <DropdownMenuItem>
                          <User className="mr-2 h-4 w-4" />
                          <span>Profil anzeigen</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Shield className="mr-2 h-4 w-4" />
                          <span>Rolle ändern</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {user.status === 'active' ? (
                          <DropdownMenuItem className="text-red-600">
                            <XCircle className="mr-2 h-4 w-4" />
                            <span>Sperren</span>
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem className="text-green-600">
                            <CheckCircle className="mr-2 h-4 w-4" />
                            <span>Aktivieren</span>
                          </DropdownMenuItem>
                        )}
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