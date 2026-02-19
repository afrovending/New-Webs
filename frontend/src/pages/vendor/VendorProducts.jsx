import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Package, Warehouse, Store, Search, Filter, Grid, List, Loader2 } from 'lucide-react';
import ImageUploader from '../../components/ImageUploader';
import { useCurrency } from '../../contexts/CurrencyContext';

const VendorProducts = () => {
  const { api } = useAuth();
  const { formatPrice } = useCurrency();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productImages, setProductImages] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    compare_price: '',
    category_id: '',
    stock: '',
    tags: '',
    fulfillment_option: 'FBV',
    sku: '',
    weight: '',
    dimensions: '',
  });

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories?type=product');
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products?vendor_id=me&limit=100');
      setProducts(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        compare_price: formData.compare_price ? parseFloat(formData.compare_price) : null,
        category_id: formData.category_id,
        stock: parseInt(formData.stock) || 0,
        images: productImages,
        tags: formData.tags ? formData.tags.split(',').map(s => s.trim()) : [],
        fulfillment_option: formData.fulfillment_option || 'FBV',
        sku: formData.sku || null,
        weight: formData.weight || null,
        dimensions: formData.dimensions || null,
      };
      
      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, data);
        toast.success('Product updated successfully!');
      } else {
        await api.post('/products', data);
        toast.success('Product created successfully!');
      }
      setDialogOpen(false);
      resetForm();
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save product');
    }
  };

  const resetForm = () => {
    setEditingProduct(null);
    setProductImages([]);
    setFormData({
      name: '',
      description: '',
      price: '',
      compare_price: '',
      category_id: '',
      stock: '',
      tags: '',
      fulfillment_option: 'FBV',
      sku: '',
      weight: '',
      dimensions: '',
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success('Product deleted');
      fetchProducts();
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  const openEdit = (product) => {
    setEditingProduct(product);
    setProductImages(product.images || []);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      compare_price: product.compare_price?.toString() || '',
      category_id: product.category_id || '',
      stock: product.stock?.toString() || '0',
      tags: product.tags?.join(', ') || '',
      fulfillment_option: product.fulfillment_option || 'FBV',
      sku: product.sku || '',
      weight: product.weight || '',
      dimensions: product.dimensions || '',
    });
    setDialogOpen(true);
  };

  const getCategoryName = (categoryId) => {
    const cat = categories.find(c => c.id === categoryId);
    return cat?.name || 'Uncategorized';
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || product.category_id === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg p-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Package className="h-7 w-7" />
              My Products
            </h1>
            <p className="text-red-100 mt-1">{products.length} products in your store</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="bg-white text-red-600 hover:bg-red-50" onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />Add New Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-xl">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900 border-b pb-2">Basic Information</h3>
                  <div className="space-y-2">
                    <Label>Product Name *</Label>
                    <Input 
                      value={formData.name} 
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                      placeholder="Enter product name"
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description *</Label>
                    <Textarea 
                      value={formData.description} 
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
                      placeholder="Describe your product, materials, size, care instructions..."
                      rows={4}
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Category *</Label>
                    <Select 
                      value={formData.category_id} 
                      onValueChange={(v) => setFormData({ ...formData, category_id: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
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
                </div>

                {/* Pricing */}
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900 border-b pb-2">Pricing & Inventory</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Price ($) *</Label>
                      <Input 
                        type="number" 
                        step="0.01" 
                        min="0"
                        value={formData.price} 
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })} 
                        placeholder="0.00"
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Compare Price ($)</Label>
                      <Input 
                        type="number" 
                        step="0.01" 
                        min="0"
                        value={formData.compare_price} 
                        onChange={(e) => setFormData({ ...formData, compare_price: e.target.value })} 
                        placeholder="Original price for showing discount"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Stock Quantity</Label>
                      <Input 
                        type="number" 
                        min="0"
                        value={formData.stock} 
                        onChange={(e) => setFormData({ ...formData, stock: e.target.value })} 
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>SKU (Optional)</Label>
                      <Input 
                        value={formData.sku} 
                        onChange={(e) => setFormData({ ...formData, sku: e.target.value })} 
                        placeholder="Product SKU"
                      />
                    </div>
                  </div>
                </div>

                {/* Images */}
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900 border-b pb-2">Product Images</h3>
                  <ImageUploader 
                    onImagesChange={setProductImages}
                    initialImages={productImages}
                    maxImages={5}
                    label="Upload up to 5 images"
                    folder="products"
                  />
                </div>

                {/* Additional Details */}
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900 border-b pb-2">Additional Details</h3>
                  <div className="space-y-2">
                    <Label>Tags (comma-separated)</Label>
                    <Input 
                      value={formData.tags} 
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })} 
                      placeholder="fashion, handmade, african print" 
                    />
                    <p className="text-xs text-gray-500">Tags help customers find your products</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Weight</Label>
                      <Input 
                        value={formData.weight} 
                        onChange={(e) => setFormData({ ...formData, weight: e.target.value })} 
                        placeholder="e.g., 500g, 1kg"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Dimensions</Label>
                      <Input 
                        value={formData.dimensions} 
                        onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })} 
                        placeholder="e.g., 20x15x5 cm"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Fulfillment Option</Label>
                    <Select 
                      value={formData.fulfillment_option} 
                      onValueChange={(v) => setFormData({ ...formData, fulfillment_option: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select fulfillment" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FBV">
                          <div className="flex items-center gap-2">
                            <Store className="h-4 w-4" />
                            <span>Fulfilled by Vendor (FBV)</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="FBA">
                          <div className="flex items-center gap-2">
                            <Warehouse className="h-4 w-4" />
                            <span>Fulfilled by AfroVending (FBA)</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500">
                      {formData.fulfillment_option === 'FBA' 
                        ? 'Ship to our US warehouse for faster delivery to customers' 
                        : 'You ship directly to customers from your location'}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1 bg-red-600 hover:bg-red-700">
                    {editingProduct ? 'Update Product' : 'Create Product'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Search products..." 
            className="pl-10 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-full md:w-[200px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex border rounded-md">
            <Button 
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'} 
              size="icon"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button 
              variant={viewMode === 'list' ? 'secondary' : 'ghost'} 
              size="icon"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Products */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-red-600" />
        </div>
      ) : filteredProducts.length === 0 ? (
        <Card className="p-12 text-center">
          <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {products.length === 0 ? 'No products yet' : 'No products match your search'}
          </h3>
          <p className="text-gray-500 mb-4">
            {products.length === 0 
              ? 'Start by adding your first product to your store!'
              : 'Try adjusting your search or filter criteria'}
          </p>
          {products.length === 0 && (
            <Button className="bg-red-600 hover:bg-red-700" onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />Add Your First Product
            </Button>
          )}
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="overflow-hidden group hover:shadow-lg transition-shadow">
              <div className="aspect-square bg-gray-100 relative overflow-hidden">
                {product.images?.[0] ? (
                  <img 
                    src={product.images[0]} 
                    alt={product.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <Package className="h-12 w-12" />
                  </div>
                )}
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                  <Badge variant="secondary" className="text-xs">
                    {getCategoryName(product.category_id)}
                  </Badge>
                  {product.fulfillment_option && (
                    <Badge className={product.fulfillment_option === 'FBA' ? 'bg-blue-600' : 'bg-gray-600'}>
                      {product.fulfillment_option}
                    </Badge>
                  )}
                </div>
                {product.compare_price && product.compare_price > product.price && (
                  <Badge className="absolute top-2 right-2 bg-green-600">
                    {Math.round((1 - product.price / product.compare_price) * 100)}% OFF
                  </Badge>
                )}
              </div>
              <CardContent className="p-4">
                <h3 className="font-medium line-clamp-2 min-h-[48px]">{product.name}</h3>
                <div className="flex items-center justify-between mt-2">
                  <div>
                    <span className="font-bold text-red-600 text-lg">{formatPrice(product.price)}</span>
                    {product.compare_price && (
                      <span className="text-sm text-gray-400 line-through ml-2">
                        {formatPrice(product.compare_price)}
                      </span>
                    )}
                  </div>
                  <span className={`text-sm ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                  </span>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => openEdit(product)}>
                    <Edit className="h-3 w-3 mr-1" />Edit
                  </Button>
                  <Button size="sm" variant="outline" className="text-red-600 hover:bg-red-50" onClick={() => handleDelete(product.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="overflow-hidden">
              <div className="flex items-center p-4 gap-4">
                <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                  {product.images?.[0] ? (
                    <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Package className="h-8 w-8" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{product.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">{getCategoryName(product.category_id)}</Badge>
                    <span className={`text-xs ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-red-600">{formatPrice(product.price)}</span>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => openEdit(product)}>
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="outline" className="text-red-600" onClick={() => handleDelete(product.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default VendorProducts;
