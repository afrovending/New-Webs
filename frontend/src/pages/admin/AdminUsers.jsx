import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../components/ui/dialog';
import { toast } from 'sonner';
import { Users, Trash2, Edit, Ban, CheckCircle, Eye, AlertTriangle } from 'lucide-react';

const AdminUsers = () => {
  const { api } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [filterRole, setFilterRole] = useState('all');

  const fetchUsers = async () => {
    try {
      const url = filterRole === 'all' ? '/admin/users?limit=100' : `/admin/users?limit=100&role=${filterRole}`;
      const response = await api.get(url);
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [filterRole]);

  const updateRole = async (userId, role) => {
    try {
      await api.put(`/admin/users/${userId}/role?role=${role}`);
      toast.success('User role updated');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update role');
    }
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setEditForm({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      email: user.email || ''
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async () => {
    try {
      await api.put(`/admin/users/${selectedUser.id}`, null, {
        params: editForm
      });
      toast.success('User updated successfully');
      setShowEditModal(false);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update user');
    }
  };

  const openDeleteModal = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/admin/users/${selectedUser.id}`);
      toast.success('User deleted successfully');
      setShowDeleteModal(false);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete user');
    }
  };

  const handleSuspend = async (userId, isSuspended) => {
    try {
      if (isSuspended) {
        await api.put(`/admin/users/${userId}/unsuspend`);
        toast.success('User unsuspended');
      } else {
        await api.put(`/admin/users/${userId}/suspend?reason=Admin action`);
        toast.success('User suspended');
      }
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update user status');
    }
  };

  const viewUserDetails = async (user) => {
    try {
      const response = await api.get(`/admin/users/${user.id}`);
      setSelectedUser(response.data);
      setShowDetailsModal(true);
    } catch (error) {
      toast.error('Failed to load user details');
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
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="h-6 w-6" />
          Users Management
        </h1>
        <div className="flex items-center gap-4">
          <Select value={filterRole} onValueChange={setFilterRole}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="customer">Customers</SelectItem>
              <SelectItem value="vendor">Vendors</SelectItem>
              <SelectItem value="admin">Admins</SelectItem>
            </SelectContent>
          </Select>
          <Badge variant="outline">{users.length} total</Badge>
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id} className={user.is_active === false ? 'bg-red-50' : ''}>
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
                <TableCell>
                  {user.is_active === false ? (
                    <Badge variant="destructive">Suspended</Badge>
                  ) : (
                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                  )}
                </TableCell>
                <TableCell className="text-gray-500">{new Date(user.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => viewUserDetails(user)}
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openEditModal(user)}
                      title="Edit"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleSuspend(user.id, user.is_active === false)}
                      title={user.is_active === false ? "Unsuspend" : "Suspend"}
                    >
                      {user.is_active === false ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <Ban className="h-4 w-4 text-amber-600" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openDeleteModal(user)}
                      title="Delete"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Select value={user.role} onValueChange={(v) => updateRole(user.id, v)}>
                      <SelectTrigger className="w-28 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="customer">Customer</SelectItem>
                        <SelectItem value="vendor">Vendor</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>First Name</Label>
              <Input
                value={editForm.first_name}
                onChange={(e) => setEditForm({...editForm, first_name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Last Name</Label>
              <Input
                value={editForm.last_name}
                onChange={(e) => setEditForm({...editForm, last_name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({...editForm, email: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>Cancel</Button>
            <Button onClick={handleEditSubmit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Delete User
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{selectedUser?.first_name} {selectedUser?.last_name}</strong>?
              This will permanently remove the user and all associated data including:
              <ul className="list-disc ml-6 mt-2 text-sm">
                <li>Cart and wishlist items</li>
                <li>Notifications and price alerts</li>
                {selectedUser?.role === 'vendor' && (
                  <>
                    <li>All products and services</li>
                    <li>Vendor profile and store data</li>
                  </>
                )}
              </ul>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                {selectedUser.picture ? (
                  <img src={selectedUser.picture} alt="" className="w-16 h-16 rounded-full" />
                ) : (
                  <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl font-bold text-red-600">{selectedUser.first_name?.[0]}</span>
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-semibold">{selectedUser.first_name} {selectedUser.last_name}</h3>
                  <p className="text-gray-500">{selectedUser.email}</p>
                  <div className="flex gap-2 mt-1">
                    {getRoleBadge(selectedUser.role)}
                    {selectedUser.is_active === false && <Badge variant="destructive">Suspended</Badge>}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-gray-500">Joined</p>
                  <p className="font-medium">{new Date(selectedUser.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Orders</p>
                  <p className="font-medium">{selectedUser.orders_count || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Reviews</p>
                  <p className="font-medium">{selectedUser.reviews_count || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">User ID</p>
                  <p className="font-mono text-xs">{selectedUser.id}</p>
                </div>
              </div>

              {selectedUser.vendor_info && (
                <div className="pt-4 border-t">
                  <h4 className="font-semibold mb-2">Vendor Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Store Name</p>
                      <p className="font-medium">{selectedUser.vendor_info.store_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <div className="flex gap-2">
                        {selectedUser.vendor_info.is_approved && <Badge className="bg-green-100 text-green-800">Approved</Badge>}
                        {selectedUser.vendor_info.is_verified && <Badge className="bg-blue-100 text-blue-800">Verified</Badge>}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers;
