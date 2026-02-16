import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import { Calendar, CheckCircle } from 'lucide-react';

const BookingsPage = () => {
  const { api } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await api.get('/bookings');
        setBookings(response.data);
      } catch (error) {
        console.error('Error fetching bookings:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  const handlePayment = async (bookingId) => {
    try {
      const response = await api.post(`/checkout/booking/${bookingId}`, {
        origin_url: window.location.origin,
      });
      window.location.href = response.data.checkout_url;
    } catch (error) {
      toast.error('Failed to initiate payment');
    }
  };

  const handleConfirmDelivery = async (bookingId) => {
    try {
      await api.put(`/bookings/${bookingId}/confirm-delivery`);
      toast.success('Service delivery confirmed! Payment released to vendor.');
      const response = await api.get('/bookings');
      setBookings(response.data);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to confirm delivery');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-amber-100 text-red-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="space-y-4">{[...Array(5)].map((_, i) => <Card key={i} className="h-32 animate-pulse bg-gray-100" />)}</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold" data-testid="bookings-title">My Bookings</h1>
      {bookings.length === 0 ? (
        <Card className="p-12 text-center">
          <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No bookings yet</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <Card key={booking.id} data-testid={`booking-${booking.id}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-medium text-lg">{booking.service_name}</p>
                    <p className="text-sm text-gray-500">
                      {booking.booking_date} at {booking.booking_time}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-red-600">${booking.price}</p>
                    <Badge className={getStatusColor(booking.status)}>{booking.status}</Badge>
                  </div>
                </div>
                {booking.notes && (
                  <p className="text-sm text-gray-600 mb-3">Notes: {booking.notes}</p>
                )}
                <div className="flex gap-2 mt-4">
                  {booking.payment_status === 'pending' && booking.status !== 'cancelled' && (
                    <Button onClick={() => handlePayment(booking.id)} className="bg-red-600 hover:bg-red-700">
                      Pay Now
                    </Button>
                  )}
                  {booking.payment_status === 'paid' && !booking.delivery_confirmed && booking.status === 'confirmed' && (
                    <Button onClick={() => handleConfirmDelivery(booking.id)} variant="outline" className="border-green-600 text-green-600 hover:bg-green-50">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Confirm Service Completed
                    </Button>
                  )}
                  {booking.delivery_confirmed && (
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Service Completed
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default BookingsPage;
