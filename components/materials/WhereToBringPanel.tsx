import React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, ArrowRight, Building2, Search } from 'lucide-react';

export default function WhereToBringPanel() {
  return (
    <Card className="mt-8 border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-primary/3 to-transparent shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <MapPin className="w-6 h-6 text-primary" />
          </div>

          {/* Content */}
          <div className="flex-1">
            <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-gray-100">
              Wo kann ich Materialien abgeben?
            </h3>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              Finden Sie verifizierte Recyclinghöfe in Ihrer Nähe, prüfen Sie welche Materialien
              angenommen werden, und erhalten Sie aktuelle Preisinformationen.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/recycling-centers"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors group"
              >
                <Building2 className="w-4 h-4" />
                Alle Recyclinghöfe anzeigen
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                href="/recycling-centers?search=true"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <Search className="w-4 h-4" />
                In meiner Nähe suchen
              </Link>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


