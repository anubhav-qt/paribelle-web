'use client';

import { useState, useEffect } from 'react';
import { Share2, Copy, Users, DollarSign, TrendingUp, CheckCircle } from 'lucide-react';

interface ReferralStats {
  referralCode: string;
  shareUrl: string;
  totalReferrals: number;
  totalEarned: number;
  pendingCredits: number;
  transactions: Array<{
    id: string;
    creditAmount: number;
    status: string;
    creditedAt: string;
    referredVendor: {
      storeName: string;
    };
  }>;
}

export default function ReferralDashboard({ token }: { token?: string }) {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReferralStats();
  }, []);

  const fetchReferralStats = async () => {
    if (!token) {
      setError('Please login to view referral stats');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/referrals/stats`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch referral stats');
      }

      const data = await response.json();
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load referral stats');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareReferral = async () => {
    if (!stats) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join as a Vendor',
          text: `Use my referral code ${stats.referralCode} and get 20% discount on registration!`,
          url: stats.shareUrl,
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      copyToClipboard(stats.shareUrl);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <p className="text-red-600">{error || 'No referral data available'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <Users className="w-6 h-6 text-primary" />
          Referral Program
        </h2>
        <p className="text-gray-600">
          Invite vendors to join and earn 20% of their registration fee as credit!
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Referrals</p>
              <p className="text-3xl font-bold text-primary">{stats.totalReferrals}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Earned</p>
              <p className="text-3xl font-bold text-green-600">₹{stats.totalEarned.toFixed(2)}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Pending Credits</p>
              <p className="text-3xl font-bold text-orange-600">₹{stats.pendingCredits.toFixed(2)}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Share Section */}
      <div className="bg-gradient-to-r from-primary to-primary/80 rounded-lg shadow-sm p-6 text-white">
        <h3 className="text-xl font-bold mb-4">Your Referral Code</h3>
        
        <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-mono font-bold">{stats.referralCode}</span>
            <button
              onClick={() => copyToClipboard(stats.referralCode)}
              className="flex items-center gap-2 bg-white text-primary px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {copied ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy Code
                </>
              )}
            </button>
          </div>
        </div>

        <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 mb-4">
          <p className="text-sm mb-2 opacity-90">Share this link:</p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={stats.shareUrl}
              readOnly
              className="flex-1 bg-white/30 text-white placeholder-white/70 rounded-lg px-4 py-2 text-sm font-mono"
            />
            <button
              onClick={() => copyToClipboard(stats.shareUrl)}
              className="bg-white text-primary px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>

        <button
          onClick={shareReferral}
          className="w-full bg-white text-primary px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
        >
          <Share2 className="w-5 h-5" />
          Share Referral Link
        </button>
      </div>

      {/* Recent Transactions */}
      {stats.transactions && stats.transactions.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-xl font-bold mb-4">Recent Referrals</h3>
          <div className="space-y-3">
            {stats.transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div>
                  <p className="font-semibold">{transaction.referredVendor?.storeName || 'Vendor'}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(transaction.creditedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-600">
                    +₹{transaction.creditAmount.toFixed(2)}
                  </p>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      transaction.status === 'credited'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {transaction.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* How It Works */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-xl font-bold mb-4">How It Works</h3>
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold">
              1
            </div>
            <div>
              <h4 className="font-semibold mb-1">Share Your Code</h4>
              <p className="text-gray-600 text-sm">
                Send your referral code to vendors who want to join the platform.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold">
              2
            </div>
            <div>
              <h4 className="font-semibold mb-1">They Get 20% Discount</h4>
              <p className="text-gray-600 text-sm">
                New vendors get 20% off their registration fee when they use your code.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold">
              3
            </div>
            <div>
              <h4 className="font-semibold mb-1">You Earn Credits</h4>
              <p className="text-gray-600 text-sm">
                When they complete payment, you earn 20% of the registration fee as credit to your wallet or vendor balance.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
