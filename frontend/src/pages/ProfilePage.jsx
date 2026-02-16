import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { User, Mail, Shield } from 'lucide-react';

const ProfilePage = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">Profile Settings</h1>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 mb-6">
            {user?.picture ? (
              <img src={user.picture} alt="" className="w-20 h-20 rounded-full" />
            ) : (
              <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center">
                <span className="text-3xl font-bold text-red-600">{user?.first_name?.[0]}</span>
              </div>
            )}
            <div>
              <p className="font-medium text-lg">{user?.first_name} {user?.last_name}</p>
              <p className="text-gray-500">{user?.email}</p>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>First Name</Label>
              <Input value={user?.first_name || ''} disabled />
            </div>
            <div className="space-y-2">
              <Label>Last Name</Label>
              <Input value={user?.last_name || ''} disabled />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={user?.email || ''} disabled />
          </div>
          <div className="space-y-2">
            <Label>Account Type</Label>
            <Input value={user?.role || ''} disabled className="capitalize" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-sm mb-4">
            {user?.password_hash === null 
              ? 'You signed in with Google. Password management is not available.'
              : 'Manage your password and security settings.'}
          </p>
          <Button variant="outline" disabled={!user?.password_hash}>
            Change Password
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;
