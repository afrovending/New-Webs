import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner';
import { Star, ThumbsUp, Camera, User } from 'lucide-react';

// Star Rating Component
const StarRating = ({ rating, setRating, readonly = false, size = 'md' }) => {
  const [hover, setHover] = useState(0);
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          className={`${readonly ? 'cursor-default' : 'cursor-pointer'} transition-colors`}
          onClick={() => !readonly && setRating(star)}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(0)}
        >
          <Star
            className={`${sizeClasses[size]} ${
              star <= (hover || rating)
                ? 'fill-amber-400 text-amber-400'
                : 'fill-gray-200 text-gray-200'
            }`}
          />
        </button>
      ))}
    </div>
  );
};

// Review Form Component
const ReviewForm = ({ productId, serviceId, onSuccess }) => {
  const { api, isAuthenticated } = useAuth();
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [wouldRecommend, setWouldRecommend] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      toast.error('Please log in to write a review');
      return;
    }
    
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }
    
    if (!comment.trim()) {
      toast.error('Please write a review');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/reviews/create', {
        rating,
        title: title.trim() || null,
        comment: comment.trim(),
        product_id: productId || null,
        service_id: serviceId || null,
        would_recommend: wouldRecommend,
        images: []
      });
      
      toast.success('Review submitted successfully!');
      setRating(0);
      setTitle('');
      setComment('');
      if (onSuccess) onSuccess();
    } catch (error) {
      const message = error.response?.data?.detail || 'Failed to submit review';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <Card className="bg-gray-50">
        <CardContent className="p-6 text-center">
          <p className="text-gray-600">Please log in to write a review</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Write a Review</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Your Rating</label>
            <StarRating rating={rating} setRating={setRating} size="lg" />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Review Title (optional)</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Summarize your experience"
              maxLength={100}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Your Review</label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell others about your experience..."
              rows={4}
              required
            />
          </div>
          
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="recommend"
              checked={wouldRecommend}
              onChange={(e) => setWouldRecommend(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="recommend" className="text-sm">I would recommend this to others</label>
          </div>
          
          <Button type="submit" disabled={submitting} className="w-full bg-red-600 hover:bg-red-700">
            {submitting ? 'Submitting...' : 'Submit Review'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

// Single Review Card
const ReviewCard = ({ review, onHelpful }) => {
  const [helpfulClicked, setHelpfulClicked] = useState(false);

  const handleHelpful = () => {
    setHelpfulClicked(!helpfulClicked);
    if (onHelpful) onHelpful(review.id);
  };

  return (
    <div className="border-b last:border-0 py-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
            <User className="h-5 w-5 text-gray-400" />
          </div>
          <div>
            <p className="font-medium">{review.user_name}</p>
            <div className="flex items-center gap-2">
              <StarRating rating={review.rating} readonly size="sm" />
              {review.would_recommend && (
                <Badge variant="outline" className="text-xs text-green-600 border-green-200">
                  Recommends
                </Badge>
              )}
            </div>
          </div>
        </div>
        <span className="text-xs text-gray-500">
          {new Date(review.created_at).toLocaleDateString()}
        </span>
      </div>
      
      {review.title && (
        <h4 className="font-medium mt-3">{review.title}</h4>
      )}
      
      <p className="text-gray-600 mt-2">{review.comment}</p>
      
      {review.images?.length > 0 && (
        <div className="flex gap-2 mt-3">
          {review.images.map((img, i) => (
            <img key={i} src={img} alt="" className="w-16 h-16 object-cover rounded" />
          ))}
        </div>
      )}
      
      <div className="flex items-center gap-4 mt-3">
        <button
          onClick={handleHelpful}
          className={`flex items-center gap-1 text-sm ${
            helpfulClicked ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <ThumbsUp className="h-4 w-4" />
          Helpful ({review.helpful_count || 0})
        </button>
      </div>
    </div>
  );
};

// Reviews List Component
const ReviewsList = ({ productId, serviceId }) => {
  const { api } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [sortBy, setSortBy] = useState('newest');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const endpoint = productId 
        ? `/reviews/product/${productId}`
        : `/reviews/service/${serviceId}`;
      
      const params = new URLSearchParams({
        sort_by: sortBy,
        page: page.toString(),
        limit: '10'
      });
      
      if (ratingFilter !== 'all') {
        params.append('rating_filter', ratingFilter);
      }
      
      const response = await api.get(`${endpoint}?${params}`);
      setReviews(response.data.reviews);
      setTotalPages(response.data.pages);
      
      if (response.data.rating_distribution) {
        setStats({
          distribution: response.data.rating_distribution,
          recommendPercent: response.data.recommend_percent,
          total: response.data.total
        });
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (productId || serviceId) {
      fetchReviews();
    }
  }, [productId, serviceId, sortBy, ratingFilter, page]);

  const handleHelpful = async (reviewId) => {
    try {
      await api.post(`/reviews/${reviewId}/helpful`);
      fetchReviews();
    } catch (error) {
      toast.error('Please log in to mark reviews as helpful');
    }
  };

  if (loading && reviews.length === 0) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-gray-100 animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      {stats && stats.total > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="text-center">
              <p className="text-4xl font-bold text-amber-500">
                {(Object.entries(stats.distribution).reduce((sum, [rating, count]) => 
                  sum + (parseInt(rating) * count), 0) / stats.total).toFixed(1)}
              </p>
              <StarRating rating={Math.round(Object.entries(stats.distribution).reduce((sum, [rating, count]) => 
                sum + (parseInt(rating) * count), 0) / stats.total)} readonly size="sm" />
              <p className="text-sm text-gray-500 mt-1">{stats.total} reviews</p>
            </div>
            
            <div className="flex-1 space-y-1">
              {[5, 4, 3, 2, 1].map((rating) => (
                <div key={rating} className="flex items-center gap-2">
                  <span className="text-sm w-4">{rating}</span>
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-amber-400 h-2 rounded-full"
                      style={{
                        width: `${stats.total > 0 ? (stats.distribution[rating] / stats.total) * 100 : 0}%`
                      }}
                    />
                  </div>
                  <span className="text-sm text-gray-500 w-8">
                    {stats.distribution[rating] || 0}
                  </span>
                </div>
              ))}
            </div>
            
            {stats.recommendPercent > 0 && (
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{stats.recommendPercent}%</p>
                <p className="text-sm text-gray-500">would recommend</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="oldest">Oldest</SelectItem>
            <SelectItem value="highest">Highest Rated</SelectItem>
            <SelectItem value="lowest">Lowest Rated</SelectItem>
            <SelectItem value="helpful">Most Helpful</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={ratingFilter} onValueChange={(v) => { setRatingFilter(v); setPage(1); }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by rating" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Ratings</SelectItem>
            <SelectItem value="5">5 Stars</SelectItem>
            <SelectItem value="4">4 Stars</SelectItem>
            <SelectItem value="3">3 Stars</SelectItem>
            <SelectItem value="2">2 Stars</SelectItem>
            <SelectItem value="1">1 Star</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Reviews */}
      {reviews.length === 0 ? (
        <div className="text-center py-8">
          <Star className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No reviews yet. Be the first to review!</p>
        </div>
      ) : (
        <div className="divide-y">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              onHelpful={handleHelpful}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
          >
            Previous
          </Button>
          <span className="flex items-center px-3 text-sm">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page === totalPages}
            onClick={() => setPage(p => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

// Export components
export { StarRating, ReviewForm, ReviewCard, ReviewsList };
export default ReviewsList;
