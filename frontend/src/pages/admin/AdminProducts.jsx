import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { toast } from 'sonner';
import { 
  Package, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Star,
  Search,
  RefreshCw
} from 'lucide-react';

const AdminProducts = () => {
  const { api } = useAuth();
  const [products, setProducts] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterVendor, setFilterVendor] = useState('all');
  const [filterActive, setFilterActive] = useState('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  
  // New product form
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    compare_price: '',
    category_id: '',
    vendor_id: '',
    stock: '0',
    tags: '',
    fulfillment_option: 'FBV',
    is_active: true,
    is_featured: false
  });

  useEffect(() => {
    fetchData();
  }, [filterVendor, filterActive]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let url = '/admin/products?limit=100';
      if (filterVendor !== 'all') url += `&vendor_id=${filterVendor}`;
      if (filterActive !== 'all') url += `&is_active=${filterActive === 'active'}`;
      
      const [productsRes, vendorsRes, categoriesRes] = await Promise.all([
        api.get(url),
        api.get('/admin/vendors?limit=100'),
        api.get('/categories?type=product')
      ]);
      
      setProducts(productsRes.data.products || []);
      setVendors(vendorsRes.data.vendors || []);
      setCategories(categoriesRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = async () => {
    if (!newProduct.name || !newProduct.price || !newProduct.vendor_id || !newProduct.category_id) {
      toast.error('Please fill all required fields');
      return;
    }

    setCreating(true);
    try {
      const params = new URLSearchParams({
        name: newProduct.name,
        description: newProduct.description,
        price: newProduct.price,
        category_id: newProduct.category_id,
        vendor_id: newProduct.vendor_id,
        stock: newProduct.stock || '0',
        fulfillment_option: newProduct.fulfillment_option,
        is_active: newProduct.is_active,
        is_featured: newProduct.is_featured
      });
      
      if (newProduct.compare_price) {
        params.append('compare_price', newProduct.compare_price);
      }
      if (newProduct.tags) {
        newProduct.tags.split(',').map(t => t.trim()).forEach(tag => {
          params.append('tags', tag);
        });
      }

      await api.post(`/admin/products?${params.toString()}`);
      toast.success('Product created successfully');
      setIsCreateOpen(false);
      setNewProduct({
        name: '',
        description: '',
        price: '',
        compare_price: '',
        category_id: '',
        vendor_id: '',
        stock: '0',
        tags: '',
        fulfillment_option: 'FBV',
        is_active: true,
        is_featured: false
      });
      fetchData();
    } catch (error) {
      console.error('Error creating product:', error);
      toast.error(error.response?.data?.detail || 'Failed to create product');
    } finally {
      setCreating(false);
    }
  };

  const toggleProductStatus = async (productId, currentStatus) => {
    try {
      await api.put(`/admin/products/${productId}?is_active=${!currentStatus}`);
      toast.success(`Product ${!currentStatus ? 'activated' : 'deactivated'}`);
      fetchData();
    } catch (error) {
      toast.error('Failed to update product');
    }
  };

  const toggleFeatured = async (productId, currentStatus) => {
    try {
      await api.put(`/admin/products/${productId}?is_featured=${!currentStatus}`);
      toast.success(`Product ${!currentStatus ? 'featured' : 'unfeatured'}`);
      fetchData();
    } catch (error) {
      toast.error('Failed to update product');
    }
  };

  const deleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    
    try {
      await api.delete(`/admin/products/${productId}`);
      toast.success('Product deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.vendor_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Product Management</h1>
        </div>
        <Card className="h-96 animate-pulse bg-gray-100" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="admin-products-title">Product Management</h1>
          <p className="text-gray-500">Manage all products across vendors</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-red-600 hover:bg-red-700" data-testid="add-product-btn">
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Product</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                    placeholder="Enter product name"
                    data-testid="product-name-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vendor">Vendor *</Label>
                  <Select
                    value={newProduct.vendor_id}
                    onValueChange={(v) => setNewProduct({...newProduct, vendor_id: v})}
                  >
                    <SelectTrigger data-testid="vendor-select">
                      <SelectValue placeholder="Select vendor" />
                    </SelectTrigger>
                    <SelectContent>
                      {vendors.map((vendor) => (
                        <SelectItem key={vendor.id} value={vendor.id}>
                          {vendor.store_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                  placeholder="Product description"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price (USD) *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                    placeholder="0.00"
                    data-testid="product-price-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="compare_price">Compare Price</Label>
                  <Input
                    id="compare_price"
                    type="number"
                    step="0.01"
                    value={newProduct.compare_price}
                    onChange={(e) => setNewProduct({...newProduct, compare_price: e.target.value})}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock">Stock</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct({...newProduct, stock: e.target.value})}
                    placeholder="0"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={newProduct.category_id}
                    onValueChange={(v) => setNewProduct({...newProduct, category_id: v})}
                  >
                    <SelectTrigger data-testid="category-select">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fulfillment">Fulfillment</Label>
                  <Select
                    value={newProduct.fulfillment_option}
                    onValueChange={(v) => setNewProduct({...newProduct, fulfillment_option: v})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FBV">Fulfilled by Vendor (FBV)</SelectItem>
                      <SelectItem value="FBA">Fulfilled by AfroVending (FBA)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  value={newProduct.tags}
                  onChange={(e) => setNewProduct({...newProduct, tags: e.target.value})}
                  placeholder="african, handmade, organic"
                />
              </div>
              
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newProduct.is_active}
                    onChange={(e) => setNewProduct({...newProduct, is_active: e.target.checked})}
                    className="rounded"
                  />
                  <span className="text-sm">Active</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newProduct.is_featured}
                    onChange={(e) => setNewProduct({...newProduct, is_featured: e.target.checked})}
                    className="rounded"
                  />
                  <span className="text-sm">Featured</span>
                </label>
              </div>
              
              <Button 
                onClick={handleCreateProduct} 
                disabled={creating}
                className="w-full bg-red-600 hover:bg-red-700"
                data-testid="create-product-submit"
              >
                {creating ? (
                  <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Creating...</>
                ) : (
                  <><Plus className="h-4 w-4 mr-2" /> Create Product</>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search products or vendors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterVendor} onValueChange={setFilterVendor}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Vendors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Vendors</SelectItem>
                {vendors.map((vendor) => (
                  <SelectItem key={vendor.id} value={vendor.id}>
                    {vendor.store_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterActive} onValueChange={setFilterActive}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Products ({filteredProducts.length})
            </CardTitle>
            <Button variant="outline" size="sm" onClick={fetchData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No products found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden">
                          {product.images?.[0] ? (
                            <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <Package className="h-6 w-6" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            {product.average_rating?.toFixed(1) || '0.0'}
                            <span>({product.review_count || 0})</span>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-600">{product.vendor_name}</TableCell>
                    <TableCell>
                      <div>
                        <span className="font-medium text-red-600">${product.price}</span>
                        {product.compare_price && product.compare_price > product.price && (
                          <span className="text-xs text-gray-400 line-through ml-2">
                            ${product.compare_price}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={product.stock > 0 ? "outline" : "destructive"}>
                        {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge className={product.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {product.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        {product.is_featured && (
                          <Badge className="bg-amber-100 text-amber-800">Featured</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleProductStatus(product.id, product.is_active)}
                          title={product.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {product.is_active ? (
                            <EyeOff className="h-4 w-4 text-gray-500" />
                          ) : (
                            <Eye className="h-4 w-4 text-green-500" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleFeatured(product.id, product.is_featured)}
                          title={product.is_featured ? 'Unfeature' : 'Feature'}
                        >
                          <Star className={`h-4 w-4 ${product.is_featured ? 'fill-amber-400 text-amber-400' : 'text-gray-400'}`} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteProduct(product.id)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminProducts;
