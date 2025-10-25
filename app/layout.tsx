import './globals.css';
import 'leaflet/dist/leaflet.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Providers from '@/components/Providers';
import Navbar from '@/components/Navbar';
import Topbar from '@/components/Topbar';
import Footer from '@/components/Footer';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://davr.de'),
  title: 'Aluminium Recycling Deutschland',
  description: 'Finden Sie Recyclinghöfe in Deutschland und erfahren Sie mehr über Aluminium-Recycling',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body className={inter.className}>
        <ErrorBoundary showDetails={process.env.NODE_ENV === 'development'}>
          <Providers>
            <div className="flex flex-col min-h-screen">
              <Topbar />
              <Navbar />
              <main className="flex-grow">
                <ErrorBoundary>
                  {children}
                </ErrorBoundary>
              </main>
              <Footer />
            </div>
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
} 