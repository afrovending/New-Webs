import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { 
  Star, 
  ShoppingCart, 
  ArrowRight, 
  BadgeCheck,
  Truck,
  Shield,
  Award,
  Heart,
  ChevronRight
} from 'lucide-react';

// Category data with SEO content
const CATEGORY_DATA = {
  fashion: {
    name: 'Fashion',
    slug: 'fashion',
    hero: {
      title: 'African Fashion',
      subtitle: 'Wear Your Heritage',
      description: 'Discover stunning Ankara prints, Kente cloth, and contemporary African designs. Each piece tells a story of culture, craftsmanship, and pride.',
      cta: 'Shop African Fashion',
    },
    seo: {
      title: 'African Fashion | Ankara, Kente & Traditional Clothing | AfroVending',
      description: 'Shop authentic African fashion including Ankara dresses, Kente cloth, dashikis, and modern African-inspired clothing. Handcrafted by verified African artisans.',
      keywords: ['african fashion', 'ankara dress', 'kente cloth', 'african clothing', 'dashiki', 'african print'],
    },
    features: [
      { icon: Award, title: 'Authentic Designs', description: 'Traditional patterns from across Africa' },
      { icon: Heart, title: 'Handcrafted', description: 'Made by skilled African tailors' },
      { icon: Truck, title: 'Global Shipping', description: 'Delivered worldwide with care' },
    ],
    popularTags: ['Ankara', 'Kente', 'Dashiki', 'Headwrap', 'Agbada', 'Kaftan'],
    bgGradient: 'from-orange-600 to-red-700',
    accentColor: 'orange',
  },
  'art-crafts': {
    name: 'Art & Crafts',
    slug: 'art-crafts',
    hero: {
      title: 'African Art & Crafts',
      subtitle: 'Handcrafted Masterpieces',
      description: 'From hand-carved wooden sculptures to intricate beadwork, explore authentic African artistry that brings culture and beauty into your space.',
      cta: 'Explore African Art',
    },
    seo: {
      title: 'African Art & Crafts | Sculptures, Masks & Handmade Decor | AfroVending',
      description: 'Discover authentic African art including wooden masks, sculptures, djembe drums, and handcrafted decor. Support African artisans directly.',
      keywords: ['african art', 'african masks', 'wooden sculptures', 'african crafts', 'djembe drum', 'african decor'],
    },
    features: [
      { icon: Award, title: 'Museum Quality', description: 'Gallery-worthy African masterpieces' },
      { icon: Heart, title: 'Artisan Made', description: 'Directly from African craftsmen' },
      { icon: Shield, title: 'Authentic', description: 'Verified traditional techniques' },
    ],
    popularTags: ['Masks', 'Sculptures', 'Drums', 'Baskets', 'Paintings', 'Carvings'],
    bgGradient: 'from-amber-700 to-brown-800',
    accentColor: 'amber',
  },
  'food-groceries': {
    name: 'Food & Groceries',
    slug: 'food-groceries',
    hero: {
      title: 'African Food & Spices',
      subtitle: 'Taste of Africa',
      description: 'Bring the flavors of Africa to your kitchen with authentic spices, seasonings, and specialty foods sourced directly from African suppliers.',
      cta: 'Shop African Foods',
    },
    seo: {
      title: 'African Food & Groceries | Spices, Seasonings & Specialty Foods | AfroVending',
      description: 'Shop authentic African foods including suya spice, palm oil, garri, egusi, and traditional seasonings. Imported directly from Africa.',
      keywords: ['african food', 'african spices', 'suya spice', 'palm oil', 'egusi', 'african groceries'],
    },
    features: [
      { icon: Award, title: 'Authentic Flavors', description: 'Traditional African taste' },
      { icon: Shield, title: 'Quality Checked', description: 'Food safety certified' },
      { icon: Truck, title: 'Fresh Delivery', description: 'Carefully packaged & shipped' },
    ],
    popularTags: ['Spices', 'Palm Oil', 'Garri', 'Egusi', 'Suya', 'Jollof'],
    bgGradient: 'from-green-600 to-emerald-800',
    accentColor: 'green',
  },
  jewelry: {
    name: 'Jewelry',
    slug: 'jewelry',
    hero: {
      title: 'African Jewelry',
      subtitle: 'Adorn Your Story',
      description: 'Discover stunning handcrafted jewelry featuring traditional African beadwork, brass pieces, and contemporary designs inspired by African heritage.',
      cta: 'Shop African Jewelry',
    },
    seo: {
      title: 'African Jewelry | Beaded Necklaces, Brass & Handcrafted Pieces | AfroVending',
      description: 'Shop authentic African jewelry including Maasai beadwork, brass jewelry, cowrie shells, and handcrafted African accessories.',
      keywords: ['african jewelry', 'african beads', 'maasai jewelry', 'brass jewelry', 'african necklace', 'african earrings'],
    },
    features: [
      { icon: Award, title: 'Unique Pieces', description: 'One-of-a-kind handcrafted designs' },
      { icon: Heart, title: 'Cultural Heritage', description: 'Traditional African symbolism' },
      { icon: Shield, title: 'Quality Materials', description: 'Authentic beads & metals' },
    ],
    popularTags: ['Beads', 'Necklaces', 'Earrings', 'Bracelets', 'Brass', 'Cowrie'],
    bgGradient: 'from-purple-600 to-indigo-800',
    accentColor: 'purple',
  },
  'home-decor': {
    name: 'Home Decor',
    slug: 'home-decor',
    hero: {
      title: 'African Home Decor',
      subtitle: 'Transform Your Space',
      description: 'Create a warm, culturally-rich home with authentic African decor including handwoven baskets, textiles, and artisan-made furnishings.',
      cta: 'Shop Home Decor',
    },
    seo: {
      title: 'African Home Decor | Baskets, Textiles & Artisan Furnishings | AfroVending',
      description: 'Transform your home with African decor including Kente baskets, mud cloth pillows, African textiles, and handcrafted home accessories.',
      keywords: ['african home decor', 'african baskets', 'mud cloth', 'african textiles', 'kente decor', 'african furnishings'],
    },
    features: [
      { icon: Award, title: 'Artisan Made', description: 'Handcrafted by African artisans' },
      { icon: Heart, title: 'Unique Style', description: 'Statement pieces for your home' },
      { icon: Truck, title: 'Safe Shipping', description: 'Carefully packaged delivery' },
    ],
    popularTags: ['Baskets', 'Textiles', 'Pillows', 'Wall Art', 'Rugs', 'Vases'],
    bgGradient: 'from-teal-600 to-cyan-800',
    accentColor: 'teal',
  },
  beauty: {
    name: 'Beauty',
    slug: 'beauty',
    hero: {
      title: 'African Beauty',
      subtitle: 'Natural & Authentic',
      description: 'Discover the power of African beauty secrets with organic shea butter, black soap, and natural skincare products sourced directly from Africa.',
      cta: 'Shop African Beauty',
    },
    seo: {
      title: 'African Beauty Products | Shea Butter, Black Soap & Natural Skincare | AfroVending',
      description: 'Shop authentic African beauty products including raw shea butter, African black soap, natural hair care, and organic skincare from Ghana and Nigeria.',
      keywords: ['african beauty', 'shea butter', 'african black soap', 'natural skincare', 'african hair care', 'organic beauty'],
    },
    features: [
      { icon: Award, title: '100% Natural', description: 'Pure, organic ingredients' },
      { icon: Heart, title: 'Traditional Recipes', description: 'Ancient African beauty secrets' },
      { icon: Shield, title: 'Ethically Sourced', description: 'Fair trade & sustainable' },
    ],
    popularTags: ['Shea Butter', 'Black Soap', 'Hair Oil', 'Skincare', 'Natural', 'Organic'],
    bgGradient: 'from-pink-600 to-rose-800',
    accentColor: 'pink',
  },
};

const CategoryLandingPage = () => {
  const { categorySlug } = useParams();
  const { api } = useAuth();
  const { addToCart } = useCart();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryId, setCategoryId] = useState(null);

  // Get category data
  const category = CATEGORY_DATA[categorySlug] || CATEGORY_DATA.fashion;

  useEffect(() => {
    const fetchCategoryAndProducts = async () => {
      setLoading(true);
      try {
        // Get category ID by name
        const categoriesRes = await api.get('/categories?type=product');
        const cat = categoriesRes.data.find(c => 
          c.name.toLowerCase().replace(/\s+&\s+/g, '-').replace(/\s+/g, '-') === categorySlug ||
          c.name === category.name
        );
        
        if (cat) {
          setCategoryId(cat.id);
          // Fetch products for this category
          const productsRes = await api.get(`/products?category_id=${cat.id}&limit=12`);
          setProducts(productsRes.data);
        } else {
          // Fallback: fetch all products
          const productsRes = await api.get('/products?limit=12');
          setProducts(productsRes.data);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCategoryAndProducts();
  }, [categorySlug, category.name]);

  // Update document title for SEO
  useEffect(() => {
    document.title = category.seo.title;
  }, [category.seo.title]);

  const handleAddToCart = (product) => {
    addToCart(product, 1);
    toast.success(`${product.name} added to cart!`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className={`relative py-20 md:py-32 bg-gradient-to-br ${category.bgGradient} text-white overflow-hidden`}>
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-40 h-40 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute bottom-10 right-10 w-60 h-60 rounded-full bg-white/20 blur-3xl" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl">
            <Badge className="bg-white/20 text-white border-white/30 mb-4">
              {category.name}
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
              {category.hero.title}
            </h1>
            <p className="text-2xl md:text-3xl font-light mb-4 text-white/90">
              {category.hero.subtitle}
            </p>
            <p className="text-lg text-white/80 mb-8 max-w-2xl">
              {category.hero.description}
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to={`/products?category=${categoryId || ''}`}>
                <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100">
                  {category.hero.cta}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/vendors">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                  Meet Our Vendors
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-8 bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-8 md:gap-16">
            {category.features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div key={index} className="flex items-center gap-3 text-center md:text-left">
                  <div className={`w-12 h-12 rounded-full bg-${category.accentColor}-100 flex items-center justify-center`}>
                    <IconComponent className={`h-6 w-6 text-${category.accentColor}-600`} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{feature.title}</p>
                    <p className="text-sm text-gray-500">{feature.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Popular Tags */}
      <section className="py-8 bg-gray-100">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <span className="text-gray-600 font-medium">Popular:</span>
            {category.popularTags.map((tag, index) => (
              <Link 
                key={index} 
                to={`/products?search=${encodeURIComponent(tag)}`}
                className="px-4 py-2 bg-white rounded-full text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors border border-gray-200 hover:border-red-200"
              >
                {tag}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                Featured {category.name} Products
              </h2>
              <p className="text-gray-600 mt-1">Handpicked authentic African {category.name.toLowerCase()}</p>
            </div>
            <Link to={`/products?category=${categoryId || ''}`} className="text-red-600 hover:text-red-700 font-medium flex items-center">
              View All <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="aspect-square bg-gray-200" />
                  <CardContent className="p-4">
                    <div className="h-4 bg-gray-200 rounded mb-2" />
                    <div className="h-4 bg-gray-200 rounded w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <Card key={product.id} className="group hover:shadow-lg transition-shadow overflow-hidden" data-testid={`product-card-${product.id}`}>
                  <Link to={`/products/${product.id}`}>
                    <div className="aspect-square bg-gray-100 relative overflow-hidden">
                      {product.images?.[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          No Image
                        </div>
                      )}
                      {product.compare_price && product.compare_price > product.price && (
                        <Badge className="absolute top-2 left-2 bg-red-500">
                          {Math.round((1 - product.price / product.compare_price) * 100)}% OFF
                        </Badge>
                      )}
                    </div>
                  </Link>
                  <CardContent className="p-4">
                    <p className="text-xs text-gray-500 mb-1">AfroVending Official Store</p>
                    <Link to={`/products/${product.id}`}>
                      <h3 className="font-medium text-gray-900 group-hover:text-red-600 transition-colors line-clamp-2">
                        {product.name}
                      </h3>
                    </Link>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm text-gray-600">
                        {product.average_rating || 4.5} ({product.review_count || 0})
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <div>
                        <span className="text-lg font-bold text-red-600">${product.price}</span>
                        {product.compare_price && product.compare_price > product.price && (
                          <span className="text-sm text-gray-400 line-through ml-2">${product.compare_price}</span>
                        )}
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                        onClick={(e) => {
                          e.preventDefault();
                          handleAddToCart(product);
                        }}
                      >
                        <ShoppingCart className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-gray-500 text-lg">No products found in this category yet.</p>
              <Link to="/products">
                <Button className="mt-4 bg-red-600 hover:bg-red-700">
                  Browse All Products
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* SEO Content Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto prose prose-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Shop Authentic African {category.name} at AfroVending
            </h2>
            <p className="text-gray-600 leading-relaxed">
              AfroVending is your premier destination for authentic African {category.name.toLowerCase()}. 
              We connect you directly with verified African artisans and vendors, ensuring every product 
              you purchase is genuine, high-quality, and supports African communities.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Our {category.name.toLowerCase()} collection features traditional craftsmanship passed down through 
              generations, combined with contemporary designs that celebrate African heritage. Each piece tells 
              a unique story and brings the beauty of Africa into your life.
            </p>
            <div className="mt-8 p-6 bg-gray-50 rounded-xl">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Why Shop African {category.name} at AfroVending?</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start gap-2">
                  <BadgeCheck className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>All vendors are verified and vetted for authenticity</span>
                </li>
                <li className="flex items-start gap-2">
                  <BadgeCheck className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Directly support African artisans and small businesses</span>
                </li>
                <li className="flex items-start gap-2">
                  <BadgeCheck className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Secure checkout with buyer protection</span>
                </li>
                <li className="flex items-start gap-2">
                  <BadgeCheck className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Worldwide shipping from multiple African countries</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={`py-16 bg-gradient-to-r ${category.bgGradient} text-white`}>
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Start Your African {category.name} Journey Today
          </h2>
          <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
            Join thousands of customers who have discovered authentic African products. 
            Shop with confidence knowing you're supporting African artisans.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to={`/products?category=${categoryId || ''}`}>
              <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100">
                Shop {category.name}
              </Button>
            </Link>
            <Link to="/pricing">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                Become a Vendor
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CategoryLandingPage;
