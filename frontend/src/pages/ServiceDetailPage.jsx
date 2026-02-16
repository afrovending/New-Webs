import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Calendar } from '../components/ui/calendar';
import { Textarea } from '../components/ui/textarea';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { Star, Clock, MapPin, DollarSign, MessageSquare, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

const ServiceDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { api, isAuthenticated } = useAuth();
  const [service, setService] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [notes, setNotes] = useState('');
  const [address, setAddress] = useState('');
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    const fetchService = async () => {
      try {
        const [serviceRes, reviewsRes] = await Promise.all([
          api.get(`/services/${id}`),
          api.get(`/reviews?service_id=${id}`),
        ]);
        setService(serviceRes.data);
        setReviews(reviewsRes.data);
      } catch (error) {
        console.error('Error fetching service:', error);
        toast.error('Service not found');
        navigate('/services');
      } finally {
        setLoading(false);
      }
    };
    fetchService();
  }, [id]);

  useEffect(() => {
    const fetchSlots = async () => {
      if (!selectedDate) return;
      try {
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        const response = await api.get(`/services/${id}/timeslots?date=${dateStr}`);
        setAvailableSlots(response.data);
        setSelectedSlot(null);
      } catch (error) {
        console.error('Error fetching slots:', error);
      }
    };
    fetchSlots();
  }, [selectedDate, id]);

  const handleBooking = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to book this service');
      navigate('/login', { state: { from: `/services/${id}` } });
      return;
    }

    if (!selectedDate || !selectedSlot) {
      toast.error('Please select a date and time slot');
      return;
    }

    if (service.location_type !== 'remote' && !address) {
      toast.error('Please provide your address for on-site service');
      return;
    }

    setBooking(true);
    try {
      const response = await api.post('/bookings', {
        service_id: id,
        booking_date: format(selectedDate, 'yyyy-MM-dd'),
        booking_time: selectedSlot,
        notes: notes,
        customer_address: address,
      });
      toast.success('Booking created successfully!');
      navigate(`/dashboard/bookings`);
    } catch (error) {
      console.error('Error creating booking:', error);
      toast.error(error.response?.data?.detail || 'Failed to create booking');
    } finally {
      setBooking(false);
    }
  };

  const getPriceLabel = () => {
    if (!service) return '';
    switch (service.price_type) {
      case 'hourly':
        return `$${service.price}/hr`;
      case 'starting_from':
        return `From $${service.price}`;
      default:
        return `$${service.price}`;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-4" />
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-8" />
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 h-64 bg-gray-200 rounded" />
            <div className="h-96 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!service) return null;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6">
        <Link to="/" className="hover:text-red-600">Home</Link>
        <span className="mx-2">/</span>
        <Link to="/services" className="hover:text-red-600">Services</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">{service.name}</span>
      </nav>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Service Details */}
        <div className="md:col-span-2 space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2" data-testid="service-name">{service.name}</h1>
            {service.vendor && (
              <Link to={`/vendors/${service.vendor.id}`} className="text-red-600 hover:underline">
                by {service.vendor.store_name}
              </Link>
            )}
          </div>

          {/* Quick Info */}
          <div className="flex flex-wrap gap-4">
            <Badge variant="outline" className="text-lg py-2 px-4">
              <DollarSign className="h-4 w-4 mr-1" />
              {getPriceLabel()}
            </Badge>
            <Badge variant="outline" className="py-2 px-4">
              <Clock className="h-4 w-4 mr-1" />
              {service.duration_minutes} minutes
            </Badge>
            <Badge variant="outline" className="py-2 px-4">
              <MapPin className="h-4 w-4 mr-1" />
              {service.location_type === 'remote' ? 'Remote Only' : 
               service.location_type === 'onsite' ? 'On-site Only' : 'Remote & On-site'}
            </Badge>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-5 w-5 ${
                    i < Math.round(service.average_rating || 0)
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-gray-600">
              {service.average_rating?.toFixed(1) || '0.0'} ({service.review_count || 0} reviews)
            </span>
          </div>

          {/* Images */}
          {service.images?.length > 0 && (
            <div className="grid grid-cols-2 gap-4">
              {service.images.map((img, i) => (
                <img key={i} src={img} alt="" className="rounded-lg w-full h-48 object-cover" />
              ))}
            </div>
          )}

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>About This Service</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">{service.description}</p>
              {service.tags?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {service.tags.map((tag, i) => (
                    <Badge key={i} variant="secondary">{tag}</Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Vendor */}
          {service.vendor && (
            <Card>
              <CardHeader>
                <CardTitle>About the Provider</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                    {service.vendor.logo_url ? (
                      <img src={service.vendor.logo_url} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span className="text-2xl font-bold text-red-600">{service.vendor.store_name?.[0]}</span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{service.vendor.store_name}</h3>
                    <p className="text-sm text-gray-500">{service.vendor.city}, {service.vendor.country}</p>
                    <p className="text-gray-600 mt-2">{service.vendor.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Reviews */}
          <Card>
            <CardHeader>
              <CardTitle>Reviews ({reviews.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {reviews.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No reviews yet</p>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="border-b pb-4 last:border-0">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-medium">{review.user_name}</p>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(review.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-gray-600">{review.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Booking Sidebar */}
        <div>
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Book This Service</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Calendar */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Select Date</label>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date() || date > new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)}
                  className="rounded-md border"
                />
              </div>

              {/* Time Slots */}
              {selectedDate && (
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Available Times for {format(selectedDate, 'MMM d, yyyy')}
                  </label>
                  {availableSlots.length === 0 ? (
                    <p className="text-gray-500 text-sm">No available slots for this date</p>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {availableSlots.map((slot) => (
                        <Button
                          key={slot}
                          variant={selectedSlot === slot ? 'default' : 'outline'}
                          className={selectedSlot === slot ? 'bg-red-600 hover:bg-red-700' : ''}
                          size="sm"
                          onClick={() => setSelectedSlot(slot)}
                        >
                          {slot}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Address (for on-site) */}
              {service.location_type !== 'remote' && (
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Your Address</label>
                  <Input
                    placeholder="Enter your address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Additional Notes</label>
                <Textarea
                  placeholder="Any special requirements..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Summary */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Service Price</span>
                  <span className="font-medium">{getPriceLabel()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration</span>
                  <span className="font-medium">{service.duration_minutes} min</span>
                </div>
              </div>

              <Button
                className="w-full bg-red-600 hover:bg-red-700"
                onClick={handleBooking}
                disabled={booking || !selectedDate || !selectedSlot}
                data-testid="book-service-btn"
              >
                {booking ? 'Booking...' : 'Confirm Booking'}
              </Button>

              <p className="text-xs text-gray-500 text-center">
                Payment will be processed securely with escrow protection
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ServiceDetailPage;
