import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { toast } from 'sonner';
import { Users } from 'lucide-react';

const AdminUsers = () => {
  const { api } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/admin/users?limit=100');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const updateRole = async (userId, role) => {
    try {
      await api.put(`/admin/users/${userId}/role?role=${role}`);
      toast.success('User role updated');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update role');
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin': return <Badge className="bg-purple-100 text-purple-800">Admin</Badge>;
      case 'vendor': return <Badge className="bg-amber-100 text-red-800">Vendor</Badge>;
      default: return <Badge className="bg-gray-100 text-gray-800">Customer</Badge>;
    }
  };

  if (loading) return <div className="space-y-4"><Card className="h-96 animate-pulse bg-gray-100" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Users</h1>
        <Badge variant="outline">{users.length} total</Badge>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    {user.picture ? (
                      <img src={user.picture} alt="" className="w-8 h-8 rounded-full" />
                    ) : (
                      <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-red-600">{user.first_name?.[0]}</span>
                      </div>
                    )}
                    <span className="font-medium">{user.first_name} {user.last_name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-gray-500">{user.email}</TableCell>
                <TableCell>{getRoleBadge(user.role)}</TableCell>
                <TableCell className="text-gray-500">{new Date(user.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Select value={user.role} onValueChange={(v) => updateRole(user.id, v)}>
                    <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="customer">Customer</SelectItem>
                      <SelectItem value="vendor">Vendor</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default AdminUsers;
