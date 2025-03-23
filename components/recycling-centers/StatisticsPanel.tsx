import React from 'react';
import { RecyclingStats } from '@/lib/data/recycling';
import { MapPin, Recycle, TrendingUp, Clock } from 'lucide-react';

interface StatisticsPanelProps {
  stats: RecyclingStats;
}

const StatisticsPanel: React.FC<StatisticsPanelProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
      <StatCard 
        value={stats.totalCenters} 
        label="Aktive Recyclingcenter"
        icon={<MapPin className="w-7 h-7 text-green-600" />}
        color="green"
        trend={+5}
      />
      
      <StatCard 
        value={stats.totalMaterials} 
        label="Recycelbare Materialarten"
        icon={<Recycle className="w-7 h-7 text-blue-600" />}
        color="blue"
        trend={+2}
      />
      
      <StatCard 
        value={67} 
        label="Recyclingquote"
        icon={<TrendingUp className="w-7 h-7 text-amber-600" />}
        suffix="%"
        color="amber"
        trend={+1.2}
      />
      
      <StatCard 
        value={16} 
        label="Bundesländer abgedeckt"
        icon={<MapPin className="w-7 h-7 text-purple-600" />}
        color="purple"
      />
    </div>
  );
};

interface StatCardProps {
  value: number;
  label: string;
  icon: React.ReactNode;
  suffix?: string;
  color: 'green' | 'blue' | 'amber' | 'purple';
  trend?: number;
}

const StatCard: React.FC<StatCardProps> = ({ 
  value, 
  label, 
  icon, 
  suffix = '', 
  color,
  trend
}) => {
  const colorMap = {
    green: {
      bg: 'bg-green-50',
      border: 'border-green-100',
      icon: 'bg-green-100',
      text: 'text-green-800',
      trendUp: 'text-green-600',
      trendDown: 'text-red-600'
    },
    blue: {
      bg: 'bg-blue-50',
      border: 'border-blue-100',
      icon: 'bg-blue-100',
      text: 'text-blue-800',
      trendUp: 'text-green-600',
      trendDown: 'text-red-600'
    },
    amber: {
      bg: 'bg-amber-50',
      border: 'border-amber-100',
      icon: 'bg-amber-100',
      text: 'text-amber-800',
      trendUp: 'text-green-600',
      trendDown: 'text-red-600'
    },
    purple: {
      bg: 'bg-purple-50',
      border: 'border-purple-100',
      icon: 'bg-purple-100',
      text: 'text-purple-800',
      trendUp: 'text-green-600',
      trendDown: 'text-red-600'
    }
  };
  
  return (
    <div className={`p-6 rounded-2xl ${colorMap[color].bg} border ${colorMap[color].border} shadow-sm transform transition-transform hover:scale-105`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl ${colorMap[color].icon}`}>
          {icon}
        </div>
        
        {trend !== undefined && (
          <div className={`flex items-center rounded-full px-2 py-1 text-xs font-medium ${trend >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {trend >= 0 ? '+' : ''}{trend}{trend % 1 === 0 ? '' : '%'}
            <TrendingUp className={`ml-1 w-3 h-3 ${trend >= 0 ? colorMap[color].trendUp : colorMap[color].trendDown}`} />
          </div>
        )}
      </div>
      
      <div className={`text-4xl font-bold ${colorMap[color].text} mb-2`}>
        {value.toLocaleString()}{suffix}
      </div>
      
      <div className="text-gray-700">{label}</div>
    </div>
  );
};

export default StatisticsPanel; 