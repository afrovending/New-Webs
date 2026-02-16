import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { toast } from 'sonner';
import { Calendar } from 'lucide-react';

const VendorBookings = () => {
  const { api } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = async () => {
    try {
      const response = await api.get('/vendor/bookings');
      setBookings(response.data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBookings(); }, []);

  const updateStatus = async (bookingId, status) => {
    try {
      await api.put(`/bookings/${bookingId}/status?status=${status}`);
      toast.success('Booking status updated');
      fetchBookings();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-amber-100 text-amber-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) return <div className="space-y-4">{[...Array(5)].map((_, i) => <Card key={i} className="h-32 animate-pulse bg-gray-100" />)}</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Bookings</h1>
      {bookings.length === 0 ? (
        <Card className="p-12 text-center">
          <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No bookings yet</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <Card key={booking.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-medium text-lg">{booking.service_name}</p>
                    <p className="text-sm text-gray-500">{booking.booking_date} at {booking.booking_time}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-amber-600">${booking.price}</p>
                    <Badge className={getStatusColor(booking.status)}>{booking.status}</Badge>
                  </div>
                </div>
                {booking.notes && <p className="text-sm text-gray-600 mb-3">Notes: {booking.notes}</p>}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-sm">
                    <span className="text-gray-500">Payment: </span>
                    <Badge variant="outline">{booking.payment_status}</Badge>
                  </div>
                  {booking.status !== 'completed' && booking.status !== 'cancelled' && (
                    <Select value={booking.status} onValueChange={(v) => updateStatus(booking.id, v)}>
                      <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
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

export default VendorBookings;
