'use client';

import React, { useState } from 'react';
import { AlertTriangle, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({
  isOpen,
  onClose,
  onConfirm
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const handleConfirm = async () => {
    if (confirmText !== 'LÖSCHEN') {
      setError('Bitte geben Sie "LÖSCHEN" ein, um zu bestätigen.');
      return;
    }
    
    setError(null);
    setIsDeleting(true);
    
    try {
      await onConfirm();
    } catch (err) {
      setError('Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.');
      setIsDeleting(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" onClick={onClose}>
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>
        
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="absolute top-0 right-0 pt-4 pr-4">
            <button
              type="button"
              className="text-gray-400 hover:text-gray-500 focus:outline-none"
              onClick={onClose}
              disabled={isDeleting}
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 className="text-lg font-medium text-gray-900">
                  Konto löschen
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Sind Sie sicher, dass Sie Ihr Konto löschen möchten? Alle Ihre Daten werden dauerhaft entfernt.
                    Diese Aktion kann nicht rückgängig gemacht werden.
                  </p>
                  
                  <div className="mt-4">
                    <label htmlFor="confirmDelete" className="block text-sm font-medium text-gray-700 mb-1">
                      Geben Sie "LÖSCHEN" ein, um zu bestätigen
                    </label>
                    <input
                      type="text"
                      id="confirmDelete"
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                      placeholder="LÖSCHEN"
                      disabled={isDeleting}
                    />
                  </div>
                  
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
            <Button
              onClick={handleConfirm}
              disabled={isDeleting || confirmText !== 'LÖSCHEN'}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="animate-spin w-4 h-4 mr-2" />
                  Löschen...
                </>
              ) : (
                'Konto löschen'
              )}
            </Button>
            <Button
              onClick={onClose}
              disabled={isDeleting}
              variant="outline"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Abbrechen
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteAccountModal; 