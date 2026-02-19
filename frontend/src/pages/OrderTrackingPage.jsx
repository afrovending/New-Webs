import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import {
  Package,
  Truck,
  MapPin,
  CheckCircle,
  Clock,
  Share2,
  RefreshCw,
  ExternalLink,
  Box,
  Home,
  Navigation,
  Calendar,
  Copy
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

const GOOGLE_MAPS_KEY = process.env.REACT_APP_GOOGLE_MAPS_KEY;

const OrderTrackingPage = () => {
  const { orderId } = useParams();
  const { api } = useAuth();
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [order, setOrder] = useState(null);
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    fetchOrderAndTracking();
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchOrderAndTracking(true);
    }, 30000);
    return () => clearInterval(interval);
  }, [orderId]);

  useEffect(() => {
    loadGoogleMaps();
  }, []);

  useEffect(() => {
    if (mapLoaded && order && mapRef.current) {
      initializeMap();
    }
  }, [mapLoaded, order]);

  const loadGoogleMaps = () => {
    if (window.google && window.google.maps) {
      setMapLoaded(true);
      return;
    }

    if (GOOGLE_MAPS_KEY) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_KEY}&libraries=places,geometry`;
      script.async = true;
      script.defer = true;
      script.onload = () => setMapLoaded(true);
      document.head.appendChild(script);
    }
  };

  const fetchOrderAndTracking = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      // Fetch order details
      const orderRes = await api.get(`/orders/${orderId}`);
      setOrder(orderRes.data);

      // Fetch tracking info if tracking number exists
      if (orderRes.data.tracking_number) {
        try {
          const trackingRes = await api.get(`/shipping/track/${orderRes.data.tracking_number}`);
          setTracking(trackingRes.data);
        } catch (e) {
          console.log('Tracking not available yet');
        }
      }
    } catch (error) {
      console.error('Error fetching order:', error);
      if (!silent) toast.error('Failed to load order details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const initializeMap = () => {
    if (!window.google || !mapRef.current || mapInstanceRef.current) return;

    // Default center (will be updated based on addresses)
    const defaultCenter = { lat: 37.7749, lng: -122.4194 };

    const map = new window.google.maps.Map(mapRef.current, {
      zoom: 4,
      center: defaultCenter,
      styles: [
        { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] }
      ],
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true
    });

    mapInstanceRef.current = map;

    // Add markers based on order data
    if (order) {
      const bounds = new window.google.maps.LatLngBounds();

      // Origin marker (warehouse - use a default location or vendor location)
      const originIcon = {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="#059669">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        `),
        scaledSize: new window.google.maps.Size(40, 40),
        anchor: new window.google.maps.Point(20, 40)
      };

      // Destination marker
      const destIcon = {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="#DC2626">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        `),
        scaledSize: new window.google.maps.Size(40, 40),
        anchor: new window.google.maps.Point(20, 40)
      };

      // Package marker (current location)
      const packageIcon = {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="#F59E0B">
            <rect x="2" y="7" width="20" height="14" rx="2" fill="#F59E0B"/>
            <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" stroke="#fff" stroke-width="2" fill="none"/>
            <line x1="12" y1="11" x2="12" y2="17" stroke="#fff" stroke-width="2"/>
            <line x1="9" y1="14" x2="15" y2="14" stroke="#fff" stroke-width="2"/>
          </svg>
        `),
        scaledSize: new window.google.maps.Size(48, 48),
        anchor: new window.google.maps.Point(24, 24)
      };

      // Use geocoding for actual addresses or simulate locations
      const geocoder = new window.google.maps.Geocoder();

      // Geocode destination (customer address)
      if (order.shipping_address && order.shipping_city) {
        const destAddress = `${order.shipping_address}, ${order.shipping_city}, ${order.shipping_country || 'US'}`;
        geocoder.geocode({ address: destAddress }, (results, status) => {
          if (status === 'OK' && results[0]) {
            const destPos = results[0].geometry.location;
            
            new window.google.maps.Marker({
              position: destPos,
              map: map,
              icon: destIcon,
              title: 'Delivery Address'
            });

            bounds.extend(destPos);

            // Create origin point (simulate warehouse location - offset from destination)
            const originLat = destPos.lat() + (Math.random() * 10 - 5);
            const originLng = destPos.lng() + (Math.random() * 15 - 7.5);
            const originPos = { lat: originLat, lng: originLng };

            new window.google.maps.Marker({
              position: originPos,
              map: map,
              icon: originIcon,
              title: 'Warehouse'
            });

            bounds.extend(originPos);

            // Draw route line
            const routePath = new window.google.maps.Polyline({
              path: [originPos, destPos],
              geodesic: true,
              strokeColor: '#3B82F6',
              strokeOpacity: 0.8,
              strokeWeight: 3,
              strokeDasharray: [10, 5]
            });
            routePath.setMap(map);

            // Add package marker (somewhere along the route based on status)
            if (order.status !== 'delivered' && order.status !== 'pending') {
              let progress = 0.3; // Default 30% along route
              if (order.status === 'shipped') progress = 0.2;
              if (order.status === 'in_transit') progress = 0.5;
              if (order.status === 'out_for_delivery') progress = 0.85;

              const packageLat = originLat + (destPos.lat() - originLat) * progress;
              const packageLng = originLng + (destPos.lng() - originLng) * progress;

              new window.google.maps.Marker({
                position: { lat: packageLat, lng: packageLng },
                map: map,
                icon: packageIcon,
                title: 'Package Location',
                animation: window.google.maps.Animation.BOUNCE
              });

              bounds.extend({ lat: packageLat, lng: packageLng });
            }

            map.fitBounds(bounds, { padding: 50 });
          }
        });
      }
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      pending: { color: 'bg-gray-100 text-gray-800', icon: Clock, label: 'Order Placed' },
      processing: { color: 'bg-blue-100 text-blue-800', icon: Box, label: 'Processing' },
      shipped: { color: 'bg-purple-100 text-purple-800', icon: Package, label: 'Shipped' },
      in_transit: { color: 'bg-amber-100 text-amber-800', icon: Truck, label: 'In Transit' },
      out_for_delivery: { color: 'bg-orange-100 text-orange-800', icon: Navigation, label: 'Out for Delivery' },
      delivered: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Delivered' },
      cancelled: { color: 'bg-red-100 text-red-800', icon: Clock, label: 'Cancelled' }
    };
    return configs[status] || configs.pending;
  };

  const copyTrackingNumber = () => {
    if (order?.tracking_number) {
      navigator.clipboard.writeText(order.tracking_number);
      toast.success('Tracking number copied!');
    }
  };

  const shareTracking = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Order Tracking - ${orderId}`,
          text: `Track your AfroVending order`,
          url: url
        });
      } catch (e) {
        navigator.clipboard.writeText(url);
        toast.success('Tracking link copied!');
      }
    } else {
      navigator.clipboard.writeText(url);
      toast.success('Tracking link copied!');
    }
  };

  const timelineSteps = [
    { key: 'pending', label: 'Order Placed', icon: Box },
    { key: 'processing', label: 'Processing', icon: Package },
    { key: 'shipped', label: 'Shipped', icon: Truck },
    { key: 'in_transit', label: 'In Transit', icon: Navigation },
    { key: 'delivered', label: 'Delivered', icon: CheckCircle }
  ];

  const getCurrentStepIndex = () => {
    if (!order) return 0;
    const statusOrder = ['pending', 'processing', 'shipped', 'in_transit', 'out_for_delivery', 'delivered'];
    const index = statusOrder.indexOf(order.status);
    return Math.min(index, timelineSteps.length - 1);
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
          <div className="h-48 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 text-center">
        <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-700">Order not found</h2>
        <p className="text-gray-500 mt-2">The order you're looking for doesn't exist.</p>
        <Link to="/orders">
          <Button className="mt-4">View All Orders</Button>
        </Link>
      </div>
    );
  }

  const statusConfig = getStatusConfig(order.status);
  const StatusIcon = statusConfig.icon;
  const currentStep = getCurrentStepIndex();

  return (
    <div className="max-w-6xl mx-auto px-4 py-8" data-testid="order-tracking-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="h-6 w-6 text-red-600" />
            Track Your Order
          </h1>
          <p className="text-gray-500 mt-1">Order #{orderId?.slice(0, 8)}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchOrderAndTracking()}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={shareTracking}>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
      </div>

      {/* Status Banner */}
      <Card className="mb-6 border-l-4 border-l-red-600">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full ${statusConfig.color}`}>
                <StatusIcon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Current Status</p>
                <p className="text-xl font-bold">{statusConfig.label}</p>
              </div>
            </div>
            {order.estimated_delivery && (
              <div className="text-right">
                <p className="text-sm text-gray-500">Estimated Delivery</p>
                <p className="text-lg font-semibold flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(order.estimated_delivery), 'MMM d, yyyy')}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Map Section */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-red-600" />
                Live Tracking Map
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                ref={mapRef}
                className="w-full h-[400px] rounded-lg bg-gray-100"
                data-testid="tracking-map"
              >
                {!mapLoaded && (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center">
                      <RefreshCw className="h-8 w-8 text-gray-400 animate-spin mx-auto mb-2" />
                      <p className="text-gray-500">Loading map...</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Map Legend */}
              <div className="flex flex-wrap gap-4 mt-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-emerald-600"></div>
                  <span>Origin (Warehouse)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-amber-500"></div>
                  <span>Package Location</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-red-600"></div>
                  <span>Delivery Address</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Delivery Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                {/* Progress Bar */}
                <div className="absolute top-5 left-5 right-5 h-1 bg-gray-200 rounded">
                  <div
                    className="h-full bg-red-600 rounded transition-all duration-500"
                    style={{ width: `${(currentStep / (timelineSteps.length - 1)) * 100}%` }}
                  ></div>
                </div>

                {/* Steps */}
                <div className="flex justify-between relative">
                  {timelineSteps.map((step, index) => {
                    const StepIcon = step.icon;
                    const isCompleted = index <= currentStep;
                    const isCurrent = index === currentStep;

                    return (
                      <div key={step.key} className="flex flex-col items-center">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center z-10 transition-all ${
                            isCompleted
                              ? 'bg-red-600 text-white'
                              : 'bg-gray-200 text-gray-400'
                          } ${isCurrent ? 'ring-4 ring-red-200' : ''}`}
                        >
                          <StepIcon className="h-5 w-5" />
                        </div>
                        <p
                          className={`mt-2 text-xs font-medium text-center ${
                            isCompleted ? 'text-red-600' : 'text-gray-400'
                          }`}
                        >
                          {step.label}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Tracking Events */}
              {tracking?.events && tracking.events.length > 0 && (
                <div className="mt-8 border-t pt-6">
                  <h4 className="font-semibold mb-4">Tracking History</h4>
                  <div className="space-y-4">
                    {tracking.events.map((event, index) => (
                      <div key={index} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`w-3 h-3 rounded-full ${index === 0 ? 'bg-red-600' : 'bg-gray-300'}`}></div>
                          {index < tracking.events.length - 1 && (
                            <div className="w-0.5 h-full bg-gray-200 my-1"></div>
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <p className="font-medium">{event.message || event.status}</p>
                          {event.location && (
                            <p className="text-sm text-gray-500">
                              {event.location.city}, {event.location.state}
                            </p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">
                            {event.datetime && formatDistanceToNow(new Date(event.datetime), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Order Details Sidebar */}
        <div className="space-y-6">
          {/* Tracking Info */}
          {order.tracking_number && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tracking Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Tracking Number</p>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono flex-1 truncate">
                      {order.tracking_number}
                    </code>
                    <Button variant="ghost" size="icon" onClick={copyTrackingNumber}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {order.shipping_carrier && (
                  <div>
                    <p className="text-sm text-gray-500">Carrier</p>
                    <p className="font-medium">{order.shipping_carrier}</p>
                  </div>
                )}
                {order.shipping_label_url && (
                  <a
                    href={order.shipping_label_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-red-600 hover:text-red-700 text-sm flex items-center gap-1"
                  >
                    View Shipping Label
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </CardContent>
            </Card>
          )}

          {/* Delivery Address */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Home className="h-4 w-4" />
                Delivery Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">{order.shipping_name}</p>
              <p className="text-gray-600">{order.shipping_address}</p>
              {order.shipping_address2 && (
                <p className="text-gray-600">{order.shipping_address2}</p>
              )}
              <p className="text-gray-600">
                {order.shipping_city}, {order.shipping_state} {order.shipping_zip}
              </p>
              <p className="text-gray-600">{order.shipping_country}</p>
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {order.items?.map((item, index) => (
                  <div key={index} className="flex gap-3">
                    <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                      {item.image ? (
                        <img src={item.image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.name}</p>
                      <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-medium text-sm">${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>
              <div className="border-t mt-4 pt-4">
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>${order.total?.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Need Help */}
          <Card className="bg-gray-50">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-gray-600 mb-2">Need help with your order?</p>
              <Link to="/contact">
                <Button variant="outline" size="sm">Contact Support</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OrderTrackingPage;
