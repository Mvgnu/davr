import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

interface RecyclingCenterSelectorProps {
  value: string;
  onChange: (value: string) => void;
  userId: string;
  requireVerified?: boolean;
}

const RecyclingCenterSelector: React.FC<RecyclingCenterSelectorProps> = ({
  value,
  onChange,
  userId,
  requireVerified = false
}) => {
  const [centers, setCenters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    const fetchCenters = async () => {
      try {
        setLoading(true);
        
        const response = await fetch(`/api/recycling-centers?ownerId=${userId}`);
        const data = await response.json();
        
        if (data.success) {
          let filteredCenters = data.data;
          
          // Filter for verified centers if required
          if (requireVerified) {
            filteredCenters = filteredCenters.filter(
              (center: any) => center.verificationStatus === 'verified'
            );
          }
          
          setCenters(filteredCenters);
          
          // Auto-select the first center if only one exists and no value is set
          if (filteredCenters.length === 1 && !value) {
            onChange(filteredCenters[0]._id);
          }
        } else {
          setError(data.message || 'Recycling-Center konnten nicht geladen werden');
        }
      } catch (err) {
        console.error('Error fetching recycling centers:', err);
        setError('Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.');
      } finally {
        setLoading(false);
      }
    };
    
    if (userId) {
      fetchCenters();
    }
  }, [userId, requireVerified, onChange, value]);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        <span>Lade Recycling-Center...</span>
      </div>
    );
  }
  
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }
  
  if (centers.length === 0) {
    return (
      <Alert variant={requireVerified ? "destructive" : "default"} className="mb-4">
        <AlertDescription>
          {requireVerified
            ? 'Sie benötigen ein verifiziertes Recycling-Center, um Gebote abzugeben.'
            : 'Sie haben keine Recycling-Center. Möchten Sie als Privatperson fortfahren?'}
        </AlertDescription>
      </Alert>
    );
  }
  
  return (
    <div className="space-y-2">
      <label htmlFor="recyclingCenter" className="block text-sm font-medium">
        Als wer möchten Sie {requireVerified ? 'bieten' : 'schreiben'}?
      </label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id="recyclingCenter">
          <SelectValue placeholder="Als Privatperson" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">Als Privatperson</SelectItem>
          {centers.map((center) => (
            <SelectItem key={center._id} value={center._id}>
              <div className="flex items-center">
                <span>{center.name}</span>
                {center.verificationStatus === 'verified' && (
                  <Badge variant="outline" className="ml-2 bg-green-50 text-green-700">
                    Verifiziert
                  </Badge>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default RecyclingCenterSelector; 