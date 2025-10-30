'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectItem } from '@/components/ui/select';
import { X } from 'lucide-react';

interface User {
  id: string;
  role: string | null;
  chapter_role: string | null;
}

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onSaved: () => void;
}

export function EditUserModal({ isOpen, onClose, user, onSaved }: EditUserModalProps) {
  const [role, setRole] = useState<'admin' | 'active_member' | 'alumni'>('active_member');
  const [chapterRole, setChapterRole] = useState<string>('member');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      const r = (user.role as any) || 'active_member';
      setRole(['admin', 'active_member', 'alumni'].includes(r) ? r : 'active_member');
      setChapterRole(user.chapter_role || 'member');
    }
  }, [user]);

  if (!isOpen || !user) return null;

  const predefined = ['president','vice_president','secretary','treasurer','rush_chair','social_chair','philanthropy_chair','risk_management_chair','alumni_relations_chair','member','pledge'];

  const handleSave = async () => {
    try {
      setSaving(true);
      const resp = await fetch(`/api/developer/users?userId=${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, chapter_role: chapterRole })
      });
      if (!resp.ok) {
        const e = await resp.json();
        throw new Error(e.error || 'Failed to update user');
      }
      onSaved();
      onClose();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="pb-2 flex items-center justify-between">
          <CardTitle>Edit User</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>System Role</Label>
            <Select value={role} onValueChange={(v: any) => setRole(v)}>
              <SelectItem value="active_member">Active Member</SelectItem>
              <SelectItem value="alumni">Alumni</SelectItem>
              <SelectItem value="admin">Admin / Executive</SelectItem>
            </Select>
          </div>

          <div>
            <Label>Chapter Role</Label>
            <Select
              value={predefined.includes(chapterRole) ? chapterRole : '__custom__'}
              onValueChange={(v: string) => {
                if (v === '__custom__') setChapterRole('');
                else setChapterRole(v);
              }}
            >
              <SelectItem value="member">General Member</SelectItem>
              <SelectItem value="president">President</SelectItem>
              <SelectItem value="vice_president">Vice President</SelectItem>
              <SelectItem value="secretary">Secretary</SelectItem>
              <SelectItem value="treasurer">Treasurer</SelectItem>
              <SelectItem value="rush_chair">Rush Chair</SelectItem>
              <SelectItem value="social_chair">Social Chair</SelectItem>
              <SelectItem value="philanthropy_chair">Philanthropy Chair</SelectItem>
              <SelectItem value="risk_management_chair">Risk Management Chair</SelectItem>
              <SelectItem value="alumni_relations_chair">Alumni Relations Chair</SelectItem>
              <SelectItem value="pledge">Pledge</SelectItem>
              <SelectItem value="__custom__">Custom…</SelectItem>
            </Select>
            {(!predefined.includes(chapterRole)) && (
              <div className="mt-2">
                <Label htmlFor="chapter_role_custom">Custom Title</Label>
                <Input
                  id="chapter_role_custom"
                  placeholder='e.g. "Historian"'
                  value={chapterRole}
                  onChange={(e) => setChapterRole(e.target.value)}
                  required
                />
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button className="flex-1" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


