import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '../ui/navigation-menu';
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet';
import {
  Search,
  ShoppingCart,
  User,
  Menu,
  Heart,
  LogOut,
  Package,
  Calendar,
  MessageSquare,
  Settings,
  LayoutDashboard,
  Store,
  Shield,
  ChevronDown,
} from 'lucide-react';

const MainLayout = () => {
  const { user, isAuthenticated, logout, isVendor, isAdmin, api } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [productCategories, setProductCategories] = useState([]);
  const [serviceCategories, setServiceCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const [productRes, serviceRes] = await Promise.all([
          api.get('/categories?type=product'),
          api.get('/categories?type=service'),
        ]);
        setProductCategories(productRes.data);
        setServiceCategories(serviceRes.data.filter(c => c.name !== 'Services'));
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, []);

  const categoryIcons = {
    // Product categories
    Fashion: '👗',
    'Art & Crafts': '🎨',
    'Food & Groceries': '🍲',
    Jewelry: '💎',
    'Home Decor': '🏠',
    Beauty: '✨',
    // Service categories
    'Event and Decor': '🎉',
    'Fashion Designing': '✂️',
    'Catering Services': '🍽️',
    'Barbing Services': '💈',
    'Beauty and Facials': '💆',
    'Braiding Services': '💇',
    'Professional Services': '💼',
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-amber-50">
      {/* Top Bar */}
      <div className="bg-amber-900 text-amber-100 text-sm py-2">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <span>Authentic African Products & Services</span>
          <div className="hidden md:flex items-center gap-4">
            <Link to="/vendors" className="hover:text-white transition">Become a Vendor</Link>
            <span>|</span>
            <span>Free shipping on orders over $100</span>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-amber-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xl">A</span>
              </div>
              <span className="text-xl font-bold text-amber-900 hidden sm:block">AfroVending</span>
            </Link>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl mx-8">
              <div className="relative w-full">
                <Input
                  type="text"
                  placeholder="Search products, services, vendors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border-amber-200 focus:border-amber-500"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
            </form>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              {/* Cart */}
              <Link to="/cart">
                <Button variant="ghost" size="icon" className="relative" data-testid="cart-button">
                  <ShoppingCart className="h-5 w-5" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-amber-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </Button>
              </Link>

              {/* User Menu */}
              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" data-testid="user-menu-button">
                      {user?.picture ? (
                        <img src={user.picture} alt={user.first_name} className="w-8 h-8 rounded-full" />
                      ) : (
                        <User className="h-5 w-5" />
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-2 py-1.5">
                      <p className="font-medium">{user?.first_name} {user?.last_name}</p>
                      <p className="text-sm text-gray-500">{user?.email}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/dashboard/orders')}>
                      <Package className="mr-2 h-4 w-4" />
                      My Orders
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/dashboard/bookings')}>
                      <Calendar className="mr-2 h-4 w-4" />
                      My Bookings
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/dashboard/messages')}>
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Messages
                    </DropdownMenuItem>
                    {isVendor && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => navigate('/vendor')}>
                          <Store className="mr-2 h-4 w-4" />
                          Vendor Dashboard
                        </DropdownMenuItem>
                      </>
                    )}
                    {isAdmin && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => navigate('/admin')}>
                          <Shield className="mr-2 h-4 w-4" />
                          Admin Dashboard
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/dashboard/profile')}>
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="hidden sm:flex items-center gap-2">
                  <Link to="/login">
                    <Button variant="ghost" data-testid="login-button">Login</Button>
                  </Link>
                  <Link to="/register">
                    <Button className="bg-amber-600 hover:bg-amber-700" data-testid="register-button">Sign Up</Button>
                  </Link>
                </div>
              )}

              {/* Mobile Menu */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80">
                  <nav className="flex flex-col gap-4 mt-8">
                    <form onSubmit={handleSearch} className="mb-4">
                      <Input
                        type="text"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </form>
                    <Link to="/products" onClick={() => setMobileMenuOpen(false)} className="text-lg font-medium">Products</Link>
                    <Link to="/services" onClick={() => setMobileMenuOpen(false)} className="text-lg font-medium">Services</Link>
                    <Link to="/vendors" onClick={() => setMobileMenuOpen(false)} className="text-lg font-medium">Vendors</Link>
                    {!isAuthenticated && (
                      <>
                        <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                          <Button variant="outline" className="w-full">Login</Button>
                        </Link>
                        <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                          <Button className="w-full bg-amber-600 hover:bg-amber-700">Sign Up</Button>
                        </Link>
                      </>
                    )}
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="border-t border-gray-100 hidden md:block">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-8 h-12">
              <Link to="/products" className="text-gray-700 hover:text-amber-600 font-medium transition">
                Products
              </Link>
              <Link to="/services" className="text-gray-700 hover:text-amber-600 font-medium transition">
                Services
              </Link>
              <Link to="/vendors" className="text-gray-700 hover:text-amber-600 font-medium transition">
                Vendors
              </Link>
              <Link to="/products?category=Fashion" className="text-gray-600 hover:text-amber-600 transition">
                Fashion
              </Link>
              <Link to="/products?category=Art+%26+Crafts" className="text-gray-600 hover:text-amber-600 transition">
                Art & Crafts
              </Link>
              <Link to="/products?category=Jewelry" className="text-gray-600 hover:text-amber-600 transition">
                Jewelry
              </Link>
              <Link to="/products?category=Beauty" className="text-gray-600 hover:text-amber-600 transition">
                Beauty
              </Link>
            </div>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="min-h-[calc(100vh-200px)]">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-amber-900 text-amber-100 py-12 mt-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold text-white mb-4">AfroVending</h3>
              <p className="text-amber-200">
                Your gateway to authentic African products and services from vendors across the continent.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Shop</h4>
              <ul className="space-y-2">
                <li><Link to="/products" className="hover:text-white transition">Products</Link></li>
                <li><Link to="/services" className="hover:text-white transition">Services</Link></li>
                <li><Link to="/vendors" className="hover:text-white transition">Vendors</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Support</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition">Shipping Info</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Become a Vendor</h4>
              <p className="text-amber-200 mb-4">Start selling your African products to customers worldwide.</p>
              <Link to="/register">
                <Button variant="outline" className="border-amber-200 text-amber-200 hover:bg-amber-800">
                  Start Selling
                </Button>
              </Link>
            </div>
          </div>
          <div className="border-t border-amber-800 mt-8 pt-8 text-center text-amber-300">
            <p>&copy; {new Date().getFullYear()} AfroVending. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
