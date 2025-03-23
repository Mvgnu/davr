import { useState } from 'react';

interface GeolocationPosition {
  coords: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  timestamp: number;
}

interface UseGeolocationReturn {
  getCurrentPosition: () => Promise<GeolocationPosition>;
  isLoading: boolean;
  error: string | null;
}

export function useGeolocation(): UseGeolocationReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCurrentPosition = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      setIsLoading(true);
      setError(null);

      if (!navigator.geolocation) {
        setIsLoading(false);
        const error = 'Geolocation wird von Ihrem Browser nicht unterstützt.';
        setError(error);
        reject(new Error(error));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          setIsLoading(false);
          resolve({
            coords: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
            },
            timestamp: position.timestamp,
          });
        },
        (error) => {
          setIsLoading(false);
          let errorMessage = 'Ein Fehler ist aufgetreten beim Abrufen Ihres Standorts.';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Standortzugriff wurde verweigert. Bitte überprüfen Sie Ihre Browsereinstellungen.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Standortinformationen sind derzeit nicht verfügbar.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Zeitüberschreitung beim Abrufen des Standorts.';
              break;
          }
          
          setError(errorMessage);
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        }
      );
    });
  };

  return {
    getCurrentPosition,
    isLoading,
    error,
  };
} 