'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { deleteRecyclingCenter } from '@/lib/api/recyclingCenters';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  recyclingCenterId: string | number;
  recyclingCenterName: string;
  redirectUrl?: string;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  recyclingCenterId,
  recyclingCenterName,
  redirectUrl = '/recycling-centers'
}) => {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  if (!isOpen) return null;
  
  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      setError(null);
      
      const success = await deleteRecyclingCenter(recyclingCenterId);
      
      if (success) {
        toast.success('Recyclingcenter erfolgreich gelöscht');
        router.push(redirectUrl);
        router.refresh();
        onClose();
      } else {
        throw new Error('Failed to delete recycling center');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Löschen des Recyclingcenters');
      toast.error('Fehler beim Löschen des Recyclingcenters');
    } finally {
      setIsDeleting(false);
    }
  };
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" onClick={onClose}>
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>
        
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 className="text-lg font-medium text-gray-900">
                  Recyclingcenter löschen
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Sind Sie sicher, dass Sie <span className="font-semibold">{recyclingCenterName}</span> löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden und alle zugehörigen Daten werden dauerhaft gelöscht.
                  </p>
                  
                  {error && (
                    <div className="mt-3 p-2 bg-red-50 border border-red-100 rounded-md text-sm text-red-600">
                      {error}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="animate-spin w-4 h-4 mr-2" />
                  Löschen...
                </>
              ) : (
                'Löschen'
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Abbrechen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal; 