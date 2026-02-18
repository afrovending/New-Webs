import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { ArrowLeft, Mail, CheckCircle, Loader2 } from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_URL}/api/auth/forgot-password`, { email });
      setSent(true);
      // For demo: show reset token (remove in production)
      if (response.data.reset_token) {
        setResetToken(response.data.reset_token);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle>Check Your Email</CardTitle>
            <CardDescription>
              If an account exists for {email}, we've sent password reset instructions.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {resetToken && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800 font-medium mb-2">Demo Mode - Reset Token:</p>
                <code className="text-xs bg-yellow-100 px-2 py-1 rounded break-all">{resetToken}</code>
                <p className="text-xs text-yellow-600 mt-2">
                  Use this token at: <Link to={`/reset-password?token=${resetToken}`} className="underline">/reset-password</Link>
                </p>
              </div>
            )}
            <div className="flex flex-col gap-2">
              <Link to="/login">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Login
                </Button>
              </Link>
              <Button variant="ghost" onClick={() => { setSent(false); setResetToken(''); }}>
                Try another email
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle>Forgot Password?</CardTitle>
          <CardDescription>
            Enter your email address and we'll send you instructions to reset your password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 p-3 rounded">{error}</p>
            )}

            <Button type="submit" className="w-full bg-red-600 hover:bg-red-700" disabled={loading}>
              {loading ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sending...</>
              ) : (
                'Send Reset Instructions'
              )}
            </Button>

            <div className="text-center">
              <Link to="/login" className="text-sm text-gray-600 hover:text-red-600">
                <ArrowLeft className="h-4 w-4 inline mr-1" />
                Back to Login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPasswordPage;
