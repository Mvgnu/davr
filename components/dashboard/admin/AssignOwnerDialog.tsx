'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Search, UserPlus } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface User {
  id: string;
  name: string | null;
  email: string | null;
}

interface AssignOwnerDialogProps {
  centerId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onOwnerAssigned: () => void;
}

export default function AssignOwnerDialog({ centerId, isOpen, onOpenChange, onOwnerAssigned }: AssignOwnerDialogProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load users when dialog opens
  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen]);

  // Filter users based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredUsers(users);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = users.filter(
        user => 
          (user.name && user.name.toLowerCase().includes(term)) ||
          (user.email && user.email.toLowerCase().includes(term))
      );
      setFilteredUsers(filtered);
    }
  }, [searchTerm, users]);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      // Fetch users with role CENTER_OWNER or ADMIN
      const response = await fetch('/api/dashboard/admin/users');
      const result = await response.json();

      if (result.success) {
        // Filter for center owners and admins
        const eligibleUsers = result.users.filter(
          (user: any) => user.role === 'CENTER_OWNER' || user.role === 'ADMIN'
        );
        setUsers(eligibleUsers);
        setFilteredUsers(eligibleUsers);
      } else {
        toast.error(result.error || 'Failed to load users');
      }
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignOwner = async () => {
    if (!selectedUser || !centerId) {
      toast.error('Please select a user to assign');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/dashboard/admin/centers/assign-owner', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          centerId,
          userId: selectedUser,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Owner assigned successfully');
        onOwnerAssigned();
        onOpenChange(false);
      } else {
        toast.error(result.error || 'Failed to assign owner');
      }
    } catch (error) {
      toast.error('Failed to assign owner');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Assign Center Owner
          </DialogTitle>
          <DialogDescription>
            Select a user to assign as the owner of this recycling center.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="search-users">Search Users</Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-muted-foreground" />
              </div>
              <Input
                id="search-users"
                placeholder="Search by name or email..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Select Owner</Label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {user.name || 'Unnamed User'}
                          </span>
                          {user.email && (
                            <span className="text-xs text-muted-foreground">
                              {user.email}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="" disabled>
                      No users found
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAssignOwner}
            disabled={!selectedUser || isSaving}
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Assign Owner
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}