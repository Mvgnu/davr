import { Metadata } from 'next';
import Link from 'next/link';
import { 
  Edit, 
  Trash, 
  MoreHorizontal, 
  Search, 
  Calendar, 
  Plus, 
  Eye,
  FileText
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
  title: 'Blog verwalten | Admin Dashboard | DAVR',
  description: 'Verwalten und veröffentlichen Sie Blogbeiträge auf der DAVR-Plattform.',
};

// Type for blog post
interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  author: string;
  category: string;
  publishedAt: string | null;
  updatedAt: string | null;
  status: 'published' | 'draft';
  featured: boolean;
}

// Sample data for blog posts
const blogPosts: BlogPost[] = [
  {
    id: '1',
    title: 'Recycling in Deutschland: Aktuelle Trends und Entwicklungen',
    slug: 'recycling-deutschland-trends-entwicklungen',
    excerpt: 'Ein Überblick über die neuesten Entwicklungen im deutschen Recyclingsektor und was dies für die Zukunft bedeutet.',
    author: 'Dr. Martina Weber',
    category: 'Trends',
    publishedAt: '2024-03-15',
    updatedAt: '2024-04-05',
    status: 'published',
    featured: true,
  },
  {
    id: '2',
    title: 'Die Wirtschaftlichkeit von Aluminium-Recycling',
    slug: 'wirtschaftlichkeit-aluminium-recycling',
    excerpt: 'Warum das Recycling von Aluminium sowohl ökologisch als auch ökonomisch sinnvoll ist.',
    author: 'Prof. Thomas Schmidt',
    category: 'Wirtschaft',
    publishedAt: '2024-02-20',
    updatedAt: null,
    status: 'published',
    featured: false,
  },
  {
    id: '3',
    title: 'Neue EU-Richtlinien für Recyclingquoten: Was ändert sich?',
    slug: 'eu-richtlinien-recyclingquoten-aenderungen',
    excerpt: 'Analyse der neuen EU-Verordnungen und deren Auswirkungen auf die deutsche Recyclingbranche.',
    author: 'Maria Schulz',
    category: 'Politik',
    publishedAt: '2024-04-02',
    updatedAt: null,
    status: 'published',
    featured: false,
  },
  {
    id: '4',
    title: 'Circular Economy: Vom Abfall zum Wertstoff',
    slug: 'circular-economy-abfall-wertstoff',
    excerpt: 'Wie moderne Kreislaufwirtschaft funktioniert und welche Vorteile sie bietet.',
    author: 'Dr. Frank Müller',
    category: 'Nachhaltigkeit',
    publishedAt: '2024-01-30',
    updatedAt: '2024-03-18',
    status: 'published',
    featured: true,
  },
  {
    id: '5',
    title: 'Innovationen im Kunststoffrecycling',
    slug: 'innovationen-kunststoffrecycling',
    excerpt: 'Die neuesten technologischen Durchbrüche im Bereich des Kunststoffrecyclings.',
    author: 'Dr. Martina Weber',
    category: 'Technologie',
    publishedAt: null,
    updatedAt: null,
    status: 'draft',
    featured: false,
  },
  {
    id: '6',
    title: 'Recycling im Alltag: Praktische Tipps für jeden Haushalt',
    slug: 'recycling-alltag-tipps-haushalte',
    excerpt: 'Einfache und effektive Methoden, um den eigenen Abfall zu reduzieren und richtig zu trennen.',
    author: 'Laura Becker',
    category: 'Tipps',
    publishedAt: '2024-03-25',
    updatedAt: null,
    status: 'published',
    featured: false,
  },
  {
    id: '7',
    title: 'Die Zukunft des E-Waste-Recyclings',
    slug: 'zukunft-ewaste-recycling',
    excerpt: 'Herausforderungen und Chancen beim Recycling elektronischer Abfälle in den kommenden Jahren.',
    author: 'Prof. Thomas Schmidt',
    category: 'Technologie',
    publishedAt: null,
    updatedAt: null,
    status: 'draft',
    featured: false,
  },
  {
    id: '8',
    title: 'Städtische Recyclingprogramme im Vergleich',
    slug: 'staedtische-recyclingprogramme-vergleich',
    excerpt: 'Analyse der Recyclingkonzepte verschiedener deutscher Großstädte und deren Erfolge.',
    author: 'Maria Schulz',
    category: 'Städte',
    publishedAt: '2024-02-15',
    updatedAt: '2024-04-10',
    status: 'published',
    featured: false,
  },
  {
    id: '9',
    title: 'Die Rolle der Künstlichen Intelligenz im modernen Recycling',
    slug: 'kuenstliche-intelligenz-modernes-recycling',
    excerpt: 'Wie KI und maschinelles Lernen die Sortierung und Verarbeitung von Recyclingmaterialien revolutionieren.',
    author: 'Dr. Frank Müller',
    category: 'Technologie',
    publishedAt: '2024-04-08',
    updatedAt: null,
    status: 'published',
    featured: false,
  },
  {
    id: '10',
    title: 'Recycling-Mythen entlarvt: Was stimmt wirklich?',
    slug: 'recycling-mythen-entlarvt',
    excerpt: 'Wir räumen mit den gängigsten Missverständnissen und Fehlinformationen über Recycling auf.',
    author: 'Laura Becker',
    category: 'Aufklärung',
    publishedAt: null,
    updatedAt: null,
    status: 'draft',
    featured: false,
  }
];

export default function AdminBlogPage() {
  // Pagination data (would be connected to API in real implementation)
  const pagination = {
    total: 32,
    page: 1,
    limit: 10,
    totalPages: 4,
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
          <h1 className="text-3xl font-bold">Blog verwalten</h1>
          <p className="text-gray-600 mt-1">Blog-Artikel erstellen, bearbeiten und veröffentlichen</p>
        </div>
        <Link href="/admin/blog/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Neuen Artikel erstellen
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
                placeholder="Suche nach Titel, Autor oder Kategorie..."
                className="pl-8"
              />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <select className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background w-full sm:w-[180px]">
                <option value="all-categories">Alle Kategorien</option>
                <option value="trends">Trends</option>
                <option value="wirtschaft">Wirtschaft</option>
                <option value="politik">Politik</option>
                <option value="nachhaltigkeit">Nachhaltigkeit</option>
                <option value="technologie">Technologie</option>
              </select>
              
              <select className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background w-full sm:w-[180px]">
                <option value="all-status">Alle Status</option>
                <option value="published">Veröffentlicht</option>
                <option value="draft">Entwurf</option>
              </select>
              
              <select className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background w-full sm:w-[180px]">
                <option value="all-featured">Alle</option>
                <option value="featured">Hervorgehoben</option>
                <option value="not-featured">Nicht hervorgehoben</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Blog Posts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Blog-Artikel</CardTitle>
          <CardDescription>
            Insgesamt {pagination.total} Artikel, Seite {pagination.page} von {pagination.totalPages}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Titel</TableHead>
                <TableHead>Autor</TableHead>
                <TableHead>Kategorie</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Hervorgehoben</TableHead>
                <TableHead>Veröffentlicht am</TableHead>
                <TableHead>Zuletzt aktualisiert</TableHead>
                <TableHead className="text-right">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {blogPosts.map((post) => (
                <TableRow key={post.id}>
                  <TableCell className="font-medium">{post.title}</TableCell>
                  <TableCell>{post.author}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{post.category}</Badge>
                  </TableCell>
                  <TableCell>
                    {post.status === 'published' ? (
                      <Badge className="bg-green-500">Veröffentlicht</Badge>
                    ) : (
                      <Badge className="bg-yellow-500">Entwurf</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {post.featured ? (
                      <Badge className="bg-blue-500">Hervorgehoben</Badge>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>{post.publishedAt || '-'}</TableCell>
                  <TableCell>{post.updatedAt || '-'}</TableCell>
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
                          <span>Vorschau</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          <span>Bearbeiten</span>
                        </DropdownMenuItem>
                        {post.status === 'draft' && (
                          <DropdownMenuItem className="text-green-600">
                            <FileText className="mr-2 h-4 w-4" />
                            <span>Veröffentlichen</span>
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