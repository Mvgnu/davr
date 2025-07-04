'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Settings, Edit, LogOut, AlertCircle } from 'lucide-react';

interface ProfileSidebarActionsProps {
  isEditing: boolean;
  setIsEditing: (isEditing: boolean) => void;
  handleLogout: () => void;
  handleDeleteAccount: () => void;
}

const ProfileSidebarActions: React.FC<ProfileSidebarActionsProps> = ({
  isEditing,
  setIsEditing,
  handleLogout,
  handleDeleteAccount,
}) => {
  return (
    <div className="space-y-4">
      <Button
        variant="outline"
        className="w-full justify-start"
        onClick={() => setIsEditing(!isEditing)} // onClick handled within this client component
      >
        <Edit className="mr-2 h-4 w-4" />
        {isEditing ? 'Bearbeitung abbrechen' : 'Profil bearbeiten'}
      </Button>
      <Link href="/profile/settings">
        <Button variant="outline" className="w-full justify-start">
          <Settings className="mr-2 h-4 w-4" />
          Einstellungen
        </Button>
      </Link>
      <Button
        variant="outline"
        className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
        onClick={handleLogout} // onClick handled within this client component
      >
        <LogOut className="mr-2 h-4 w-4" />
        Abmelden
      </Button>
      <Button
        variant="outline"
        className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
        onClick={handleDeleteAccount} // onClick handled within this client component
      >
        <AlertCircle className="mr-2 h-4 w-4" />
        Konto löschen
      </Button>
    </div>
  );
};

export default ProfileSidebarActions; 