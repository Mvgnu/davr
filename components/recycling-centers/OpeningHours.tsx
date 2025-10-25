'use client';

import { Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface WorkingHour {
  day_of_week: string;
  open_time: string;
  close_time: string;
  is_closed: boolean;
}

interface OpeningHoursProps {
  hours: WorkingHour[];
}

const DAY_ORDER = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

const DAY_NAMES: Record<string, string> = {
  MONDAY: 'Montag',
  TUESDAY: 'Dienstag',
  WEDNESDAY: 'Mittwoch',
  THURSDAY: 'Donnerstag',
  FRIDAY: 'Freitag',
  SATURDAY: 'Samstag',
  SUNDAY: 'Sonntag',
};

export function OpeningHours({ hours }: OpeningHoursProps) {
  if (!hours || hours.length === 0) {
    return null;
  }

  // Sort hours by day of week
  const sortedHours = [...hours].sort((a, b) => {
    return DAY_ORDER.indexOf(a.day_of_week) - DAY_ORDER.indexOf(b.day_of_week);
  });

  // Get current day
  const today = new Date().getDay();
  const currentDayName = DAY_ORDER[(today === 0 ? 6 : today - 1)];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold flex items-center">
          <Clock className="w-4 h-4 mr-2" />
          Öffnungszeiten
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-2">
        {sortedHours.map((hour) => {
          const isToday = hour.day_of_week === currentDayName;

          return (
            <div
              key={hour.day_of_week}
              className={`flex justify-between text-sm ${
                isToday ? 'font-semibold text-foreground' : 'text-muted-foreground'
              }`}
            >
              <span className="flex items-center">
                {DAY_NAMES[hour.day_of_week]}
                {isToday && (
                  <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                    Heute
                  </span>
                )}
              </span>
              <span>
                {hour.is_closed ? (
                  <span className="text-red-600">Geschlossen</span>
                ) : (
                  `${hour.open_time} - ${hour.close_time}`
                )}
              </span>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
