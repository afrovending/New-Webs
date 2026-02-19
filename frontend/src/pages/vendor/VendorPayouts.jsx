import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Switch } from '../../components/ui/switch';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../../components/ui/dialog';
import { toast } from 'sonner';
import { 
  DollarSign, TrendingUp, Clock, Calendar, ArrowRight, 
  Loader2, CheckCircle, AlertCircle, Banknote, History,
  Settings, Download, RefreshCw
} from 'lucide-react';
import { useCurrency } from '../../contexts/CurrencyContext';

const VendorPayouts = () => {
  const { api } = useAuth();
  const { formatPrice } = useCurrency();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [requestingPayout, setRequestingPayout] = useState(false);
  const [payoutDialogOpen, setPayoutDialogOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  
  const [earnings, setEarnings] = useState(null);
  const [payoutHistory, setPayoutHistory] = useState([]);
  const [settings, setSettings] = useState({
    auto_payout_enabled: false,
    payout_threshold: 50,
    payout_frequency: 'weekly',
    payout_day: 'monday'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [earningsRes, historyRes, settingsRes] = await Promise.all([
        api.get('/stripe-connect/earnings-summary'),
        api.get('/stripe-connect/payout-history'),
        api.get('/stripe-connect/payout-settings')
      ]);
      setEarnings(earningsRes.data);
      setPayoutHistory(historyRes.data.payouts || []);
      setSettings(settingsRes.data);
    } catch (error) {
      console.error('Error fetching payout data:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      await api.put('/stripe-connect/payout-settings', settings);
      toast.success('Payout settings saved!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const requestPayout = async () => {
    setRequestingPayout(true);
    try {
      const amount = payoutAmount ? parseFloat(payoutAmount) : earnings?.available_balance;
      const response = await api.post('/stripe-connect/request-payout', { amount });
      toast.success(response.data.message);
      setPayoutDialogOpen(false);
      setPayoutAmount('');
      fetchData(); // Refresh data
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to request payout');
    } finally {
      setRequestingPayout(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      paid: { color: 'bg-green-100 text-green-700', label: 'Paid' },
      pending: { color: 'bg-yellow-100 text-yellow-700', label: 'Pending' },
      in_transit: { color: 'bg-blue-100 text-blue-700', label: 'In Transit' },
      failed: { color: 'bg-red-100 text-red-700', label: 'Failed' },
      canceled: { color: 'bg-gray-100 text-gray-700', label: 'Canceled' }
    };
    const config = statusConfig[status] || statusConfig.pending;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <DollarSign className="h-7 w-7" />
              Payouts & Earnings
            </h1>
            <p className="text-green-100 mt-1">Manage your earnings and payout settings</p>
          </div>
          <Button 
            onClick={fetchData}
            variant="outline"
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Earnings Overview */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Available Balance</p>
                <p className="text-2xl font-bold text-green-600">
                  ${earnings?.available_balance?.toFixed(2) || '0.00'}
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <Banknote className="h-6 w-6 text-green-600" />
              </div>
            </div>
            {earnings?.available_balance >= (settings.payout_threshold || 50) && (
              <Badge className="mt-2 bg-green-600">Ready to withdraw</Badge>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending Balance</p>
                <p className="text-2xl font-bold text-yellow-600">
                  ${earnings?.pending_balance?.toFixed(2) || '0.00'}
                </p>
              </div>
              <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Processing from sales</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Paid Out</p>
                <p className="text-2xl font-bold text-blue-600">
                  ${earnings?.total_paid_out?.toFixed(2) || '0.00'}
                </p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Download className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Sales</p>
                <p className="text-2xl font-bold text-purple-600">
                  ${earnings?.total_sales?.toFixed(2) || '0.00'}
                </p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">{earnings?.commission_rate || 15}% platform fee</p>
          </CardContent>
        </Card>
      </div>

      {/* Request Payout Button */}
      {earnings?.available_balance >= 10 && (
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardContent className="py-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h3 className="font-semibold text-green-800">Ready to withdraw?</h3>
                <p className="text-sm text-green-600">
                  You have ${earnings?.available_balance?.toFixed(2)} available for payout
                </p>
              </div>
              <Dialog open={payoutDialogOpen} onOpenChange={setPayoutDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700" data-testid="request-payout-btn">
                    <Banknote className="h-4 w-4 mr-2" />
                    Request Payout
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Request Payout</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500">Available Balance</p>
                      <p className="text-2xl font-bold text-green-600">
                        ${earnings?.available_balance?.toFixed(2)}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label>Amount to withdraw</Label>
                      <Input
                        type="number"
                        placeholder={`Max: $${earnings?.available_balance?.toFixed(2)}`}
                        value={payoutAmount}
                        onChange={(e) => setPayoutAmount(e.target.value)}
                        min="10"
                        max={earnings?.available_balance}
                        step="0.01"
                        data-testid="payout-amount-input"
                      />
                      <p className="text-xs text-gray-500">
                        Minimum: $10.00. Leave empty to withdraw full balance.
                      </p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setPayoutDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={requestPayout}
                      disabled={requestingPayout}
                      className="bg-green-600 hover:bg-green-700"
                      data-testid="confirm-payout-btn"
                    >
                      {requestingPayout ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      )}
                      Confirm Payout
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payout Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-gray-600" />
            Automatic Payout Settings
          </CardTitle>
          <CardDescription>
            Configure automatic payouts when your balance reaches a threshold
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <Label className="font-medium">Enable Automatic Payouts</Label>
              <p className="text-sm text-gray-500">
                Automatically transfer funds when balance exceeds threshold
              </p>
            </div>
            <Switch
              checked={settings.auto_payout_enabled}
              onCheckedChange={(checked) => setSettings({...settings, auto_payout_enabled: checked})}
              data-testid="auto-payout-switch"
            />
          </div>

          {settings.auto_payout_enabled && (
            <div className="grid md:grid-cols-3 gap-4 p-4 border rounded-lg">
              <div className="space-y-2">
                <Label>Payout Threshold ($)</Label>
                <Input
                  type="number"
                  value={settings.payout_threshold}
                  onChange={(e) => setSettings({...settings, payout_threshold: parseFloat(e.target.value)})}
                  min="10"
                  step="5"
                  data-testid="threshold-input"
                />
                <p className="text-xs text-gray-500">Minimum: $10</p>
              </div>

              <div className="space-y-2">
                <Label>Frequency</Label>
                <Select 
                  value={settings.payout_frequency}
                  onValueChange={(v) => setSettings({...settings, payout_frequency: v})}
                >
                  <SelectTrigger data-testid="frequency-select">
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="biweekly">Bi-weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Payout Day</Label>
                <Select 
                  value={settings.payout_day}
                  onValueChange={(v) => setSettings({...settings, payout_day: v})}
                >
                  <SelectTrigger data-testid="day-select">
                    <SelectValue placeholder="Select day" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monday">Monday</SelectItem>
                    <SelectItem value="tuesday">Tuesday</SelectItem>
                    <SelectItem value="wednesday">Wednesday</SelectItem>
                    <SelectItem value="thursday">Thursday</SelectItem>
                    <SelectItem value="friday">Friday</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <Button 
              onClick={saveSettings}
              disabled={saving}
              data-testid="save-payout-settings-btn"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Save Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payout History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-gray-600" />
            Payout History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {payoutHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Banknote className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No payouts yet</p>
              <p className="text-sm">Your payout history will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {payoutHistory.map((payout) => (
                <div 
                  key={payout.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                      payout.status === 'paid' ? 'bg-green-100' : 
                      payout.status === 'in_transit' ? 'bg-blue-100' : 'bg-yellow-100'
                    }`}>
                      {payout.status === 'paid' ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : payout.status === 'in_transit' ? (
                        <ArrowRight className="h-5 w-5 text-blue-600" />
                      ) : (
                        <Clock className="h-5 w-5 text-yellow-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">${payout.amount.toFixed(2)}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(payout.created_at).toLocaleDateString()} • {payout.type === 'automatic' ? 'Auto' : 'Manual'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(payout.status)}
                    {payout.arrival_date && (
                      <p className="text-xs text-gray-500 mt-1">
                        Est. arrival: {new Date(payout.arrival_date * 1000).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VendorPayouts;
