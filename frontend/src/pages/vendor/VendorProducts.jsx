import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Package, Warehouse, Store } from 'lucide-react';
import ImageUploader from '../../components/ImageUploader';

const VendorProducts = () => {
  const { api } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productImages, setProductImages] = useState([]);
  const [formData, setFormData] = useState({
    name: '', description: '', price: '', compare_price: '', category_id: '', stock: '', tags: '', fulfillment_option: 'FBV'
  });

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products?vendor_id=me&limit=100');
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        price: parseFloat(formData.price),
        compare_price: formData.compare_price ? parseFloat(formData.compare_price) : null,
        stock: parseInt(formData.stock) || 0,
        images: productImages,
        tags: formData.tags ? formData.tags.split(',').map(s => s.trim()) : [],
        fulfillment_option: formData.fulfillment_option || 'FBV',
      };
      
      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, data);
        toast.success('Product updated');
      } else {
        await api.post('/products', data);
        toast.success('Product created');
      }
      setDialogOpen(false);
      setEditingProduct(null);
      setProductImages([]);
      setFormData({ name: '', description: '', price: '', compare_price: '', category_id: '', stock: '', tags: '', fulfillment_option: 'FBV' });
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save product');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
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
      stock: product.stock.toString(),
      tags: product.tags?.join(', ') || '',
      fulfillment_option: product.fulfillment_option || 'FBV',
    });
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Products</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-red-600 hover:bg-red-700" onClick={() => { setEditingProduct(null); setProductImages([]); setFormData({ name: '', description: '', price: '', compare_price: '', category_id: '', stock: '', tags: '', fulfillment_option: 'FBV' }); }}>
              <Plus className="h-4 w-4 mr-2" />Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingProduct ? 'Edit Product' : 'Add Product'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Price ($)</Label>
                  <Input type="number" step="0.01" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Compare Price ($)</Label>
                  <Input type="number" step="0.01" value={formData.compare_price} onChange={(e) => setFormData({ ...formData, compare_price: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Stock</Label>
                <Input type="number" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: e.target.value })} />
              </div>
              <ImageUploader 
                onImagesChange={setProductImages}
                initialImages={productImages}
                maxImages={5}
                label="Product Images"
              />
              <div className="space-y-2">
                <Label>Tags (comma-separated)</Label>
                <Input value={formData.tags} onChange={(e) => setFormData({ ...formData, tags: e.target.value })} placeholder="fashion, handmade" />
              </div>
              <div className="space-y-2">
                <Label>Fulfillment Option</Label>
                <Select value={formData.fulfillment_option} onValueChange={(v) => setFormData({ ...formData, fulfillment_option: v })}>
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
              <Button type="submit" className="w-full bg-red-600 hover:bg-red-700">
                {editingProduct ? 'Update Product' : 'Create Product'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <Card key={i} className="h-48 animate-pulse bg-gray-100" />)}
        </div>
      ) : products.length === 0 ? (
        <Card className="p-12 text-center">
          <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No products yet. Add your first product!</p>
        </Card>
      ) : (
        <div className="grid md:grid-cols-3 gap-4">
          {products.map((product) => (
            <Card key={product.id} className="overflow-hidden">
              <div className="aspect-video bg-gray-100 relative">
                {product.images?.[0] ? (
                  <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                )}
                {product.fulfillment_option && (
                  <Badge 
                    className={`absolute top-2 right-2 ${product.fulfillment_option === 'FBA' ? 'bg-blue-600' : 'bg-gray-600'}`}
                  >
                    {product.fulfillment_option === 'FBA' ? (
                      <><Warehouse className="h-3 w-3 mr-1" />FBA</>
                    ) : (
                      <><Store className="h-3 w-3 mr-1" />FBV</>
                    )}
                  </Badge>
                )}
              </div>
              <CardContent className="p-4">
                <h3 className="font-medium line-clamp-1">{product.name}</h3>
                <div className="flex items-center justify-between mt-2">
                  <span className="font-bold text-red-600">${product.price}</span>
                  <span className="text-sm text-gray-500">Stock: {product.stock}</span>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button size="sm" variant="outline" onClick={() => openEdit(product)}>
                    <Edit className="h-3 w-3 mr-1" />Edit
                  </Button>
                  <Button size="sm" variant="outline" className="text-red-600" onClick={() => handleDelete(product.id)}>
                    <Trash2 className="h-3 w-3 mr-1" />Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default VendorProducts;
