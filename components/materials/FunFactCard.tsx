import React from 'react';
import { Sparkles } from 'lucide-react';

interface FunFactCardProps {
  funFact: string | null;
  materialName: string;
}

export default function FunFactCard({ funFact, materialName }: FunFactCardProps) {
  if (!funFact) {
    return null;
  }

  return (
    <div className="relative bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-purple-950/20 dark:via-pink-950/20 dark:to-orange-950/20 rounded-2xl p-6 md:p-8 border-2 border-purple-200 dark:border-purple-800 shadow-sm overflow-hidden">
      {/* Decorative Background Pattern */}
      <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
        <Sparkles className="w-full h-full text-purple-600" />
      </div>

      <div className="relative z-10">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 shadow-lg">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
              <span>Wussten Sie schon?</span>
            </h3>
            <p className="text-base leading-relaxed text-gray-700 dark:text-gray-300 italic">
              "{funFact}"
            </p>
          </div>
        </div>
      </div>

      {/* Decorative Border Shine Effect */}
      <div className="absolute inset-0 rounded-2xl opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent animate-shine" />
      </div>
    </div>
  );
}
