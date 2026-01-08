'use client';

import ThemeRenderer from '@/components/ThemeRenderer';
import { Users, DollarSign, Gift, TrendingUp, CheckCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <>
      <ThemeRenderer component="header" />
      
      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-primary to-primary/80 text-white py-20">
          <div className="container mx-auto px-4 max-w-6xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Join Our Growing Marketplace
            </h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90">
              Connect sellers with buyers. Grow together through our referral program.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/vendor-registration"
                className="bg-white text-primary px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-flex items-center gap-2"
              >
                Become a Vendor
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/login"
                className="bg-white/20 backdrop-blur-sm text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/30 transition-colors"
              >
                View Your Referrals
              </Link>
            </div>
          </div>
        </div>

        {/* Referral Program Benefits */}
        <div className="container mx-auto px-4 py-16 max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Referral Program Benefits
            </h2>
            <p className="text-xl text-gray-600">
              Earn rewards while helping vendors grow their business
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            <div className="bg-white rounded-lg shadow-sm p-6 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Gift className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">20% Vendor Discount</h3>
              <p className="text-gray-600">
                Your referrals save ₹1,000 on registration fee
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">20% Cash Reward</h3>
              <p className="text-gray-600">
                Earn ₹1,000 credit for each successful referral
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Unlimited Referrals</h3>
              <p className="text-gray-600">
                No cap on how many vendors you can refer
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Track Performance</h3>
              <p className="text-gray-600">
                Real-time dashboard to monitor your earnings
              </p>
            </div>
          </div>

          {/* How It Works */}
          <div className="bg-white rounded-lg shadow-sm p-8 mb-16">
            <h3 className="text-2xl font-bold mb-8 text-center">How It Works</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="relative">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center font-bold text-lg">
                    1
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold mb-2">Get Your Code</h4>
                    <p className="text-gray-600">
                      Sign up and receive your unique referral code instantly. Share it with potential vendors.
                    </p>
                  </div>
                </div>
                {/* Arrow for desktop */}
                <div className="hidden md:block absolute top-6 -right-4 text-gray-300">
                  <ArrowRight className="w-8 h-8" />
                </div>
              </div>

              <div className="relative">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center font-bold text-lg">
                    2
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold mb-2">They Save Money</h4>
                    <p className="text-gray-600">
                      Vendors use your code during registration and get 20% discount (₹1,000 off).
                    </p>
                  </div>
                </div>
                {/* Arrow for desktop */}
                <div className="hidden md:block absolute top-6 -right-4 text-gray-300">
                  <ArrowRight className="w-8 h-8" />
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center font-bold text-lg">
                  3
                </div>
                <div>
                  <h4 className="text-xl font-semibold mb-2">You Earn Credits</h4>
                  <p className="text-gray-600">
                    After they pay, you receive ₹1,000 credit to your wallet or vendor balance instantly.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-semibold text-green-900 mb-1">Example Earnings</h5>
                  <p className="text-gray-700">
                    Refer 5 vendors = <span className="font-bold text-green-600">₹5,000</span> in credits. 
                    Refer 10 vendors = <span className="font-bold text-green-600">₹10,000</span>. 
                    The more you refer, the more you earn!
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Credit Usage */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
            <div className="bg-white rounded-lg shadow-sm p-8">
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Users className="w-6 h-6 text-blue-600" />
                For Customers
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Credits added to your wallet balance</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Use on any future order at checkout</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Automatically applies discount to your cart</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Never expires - use anytime</span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-8">
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <DollarSign className="w-6 h-6 text-green-600" />
                For Vendors
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Credits added to vendor balance</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Available in next payout cycle</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Withdraw directly to bank account</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Track in vendor dashboard</span>
                </li>
              </ul>
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-gradient-to-r from-primary to-primary/80 rounded-lg shadow-lg p-12 text-white text-center">
            <h3 className="text-3xl font-bold mb-4">
              Ready to Start Earning?
            </h3>
            <p className="text-xl mb-8 opacity-90">
              Join thousands of users earning rewards by referring vendors
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="/signup"
                className="bg-white text-primary px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-flex items-center gap-2"
              >
                Sign Up Free
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/vendor-registration"
                className="bg-white/20 backdrop-blur-sm text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/30 transition-colors"
              >
                Become a Vendor
              </Link>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mt-16">
            <h3 className="text-2xl font-bold mb-8 text-center">Frequently Asked Questions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h4 className="font-semibold mb-2">Is there a limit to referrals?</h4>
                <p className="text-gray-600 text-sm">
                  You can refer as many vendors as you want per day, but each user can only refer 1 successful vendor per day. Unlimited monthly referrals!
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h4 className="font-semibold mb-2">When do I get credited?</h4>
                <p className="text-gray-600 text-sm">
                  Credits are added immediately after the vendor completes their registration payment. No waiting period!
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h4 className="font-semibold mb-2">Can vendors refer other vendors?</h4>
                <p className="text-gray-600 text-sm">
                  Yes! Vendors can also participate in the referral program and earn credits to their vendor balance.
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h4 className="font-semibold mb-2">Do credits expire?</h4>
                <p className="text-gray-600 text-sm">
                  No, your wallet credits never expire. Use them whenever you're ready to shop or withdraw (for vendors).
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <ThemeRenderer component="footer" />
    </>
  );
}
