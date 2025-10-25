'use client';

import React, { useState } from 'react';
import {
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Droplet,
  Scissors,
  Trash2,
  Check,
  AlertCircle,
  Sparkles,
  Package
} from 'lucide-react';

interface PreparationTip {
  title: string;
  description: string;
  icon: string;
}

interface PreparationTipsSectionProps {
  preparationTips: PreparationTip[] | null;
  materialName: string;
}

// Map icon names to Lucide components
const iconComponents: { [key: string]: React.ComponentType<{ className?: string }> } = {
  droplet: Droplet,
  scissors: Scissors,
  trash2: Trash2,
  check: Check,
  alertCircle: AlertCircle,
  sparkles: Sparkles,
  package: Package,
  lightbulb: Lightbulb,
};

export default function PreparationTipsSection({
  preparationTips,
  materialName,
}: PreparationTipsSectionProps) {
  const [expandedTips, setExpandedTips] = useState<Set<number>>(new Set([0])); // First tip expanded by default

  if (!preparationTips || !Array.isArray(preparationTips) || preparationTips.length === 0) {
    return null;
  }

  const toggleTip = (index: number) => {
    const newExpanded = new Set(expandedTips);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedTips(newExpanded);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 md:p-8 border border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
          <Lightbulb className="w-6 h-6 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Recycling-Vorbereitung
          </h2>
          <p className="text-sm text-muted-foreground">
            So bereiten Sie {materialName} richtig vor
          </p>
        </div>
      </div>

      {/* Tips List */}
      <div className="space-y-3">
        {preparationTips.map((tip, index) => {
          const isExpanded = expandedTips.has(index);
          const IconComponent = iconComponents[tip.icon.toLowerCase()] || Lightbulb;

          return (
            <div
              key={index}
              className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden transition-all duration-200 hover:border-primary/50"
            >
              {/* Tip Header - Clickable */}
              <button
                onClick={() => toggleTip(index)}
                className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors text-left"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 rounded-lg bg-white dark:bg-gray-700 flex items-center justify-center flex-shrink-0 border border-gray-200 dark:border-gray-600">
                    <IconComponent className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-base">
                      {tip.title}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-muted-foreground font-medium">
                      Schritt {index + 1}/{preparationTips.length}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </button>

              {/* Tip Content - Expandable */}
              {isExpanded && (
                <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 animate-fade-in">
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {tip.description}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Expand/Collapse All Button */}
      <div className="mt-4 flex justify-center">
        <button
          onClick={() => {
            if (expandedTips.size === preparationTips.length) {
              setExpandedTips(new Set());
            } else {
              setExpandedTips(new Set(preparationTips.map((_, i) => i)));
            }
          }}
          className="text-sm text-primary hover:text-primary/80 font-medium transition-colors flex items-center gap-1"
        >
          {expandedTips.size === preparationTips.length ? (
            <>
              <ChevronUp className="w-4 h-4" />
              Alle einklappen
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              Alle ausklappen
            </>
          )}
        </button>
      </div>
    </div>
  );
}
