'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader } from '@/components/ui/Loader';
import {
  User,
  Mail,
  Phone,
  Calendar,
  Edit2,
  Save,
  X,
  Shield,
  Lock,
} from 'lucide-react';
import AddressManager from '@/components/AddressManager';
import { showAlert } from '@/lib/dialog';

export default function ProfileContent() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });

  const getRoutePrefix = () => '';

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
      router.push(`${getRoutePrefix()}/login`);
      return;
    }

    try {
      const parsedUser = JSON.parse(userStr);
      setUser(parsedUser);
      setFormData({
        firstName: parsedUser.firstName || '',
        lastName: parsedUser.lastName || '',
        email: parsedUser.email || '',
        phone: parsedUser.phone || '',
      });
      setLoading(false);
    } catch (error) {
      console.error('Error parsing user data:', error);
      router.push(`${getRoutePrefix()}/login`);
    }
  }, [router]);

  const handleSave = async () => {
    // Validate required fields
    if (!formData.phone || !formData.phone.trim()) {
      showAlert('Phone number is required. Please provide your contact number.', 'warning');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        setEditing(false);
        showAlert('Profile updated successfully!', 'success');
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Failed to update profile' }));
        console.error('Error response:', response.status, errorData);
        throw new Error(errorData.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      showAlert(error instanceof Error ? error.message : 'Failed to update profile. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      phone: user.phone || '',
    });
    setEditing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader size="md" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2 text-foreground">My Profile</h1>
        <p className="text-muted-foreground">Manage your account information</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="bg-card rounded-lg shadow-sm border border-border p-6">
            <div className="text-center">
              <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-12 h-12 text-primary" />
              </div>
              <h2 className="text-xl font-bold mb-1 text-foreground">
                {user.firstName} {user.lastName}
              </h2>
              <p className="text-muted-foreground text-sm mb-4">{user.email}</p>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>
                  Joined {new Date(user.createdAt).toLocaleDateString('en-IN', {
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-border space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Account Type</span>
                <span className="font-medium capitalize text-foreground">{user.role || 'Customer'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                  Active
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <div className="bg-card rounded-lg shadow-sm border border-border">
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">Personal Information</h3>
                {!editing ? (
                  <button
                    onClick={() => setEditing(true)}
                    className="flex items-center gap-2 px-4 py-2 text-[hsl(var(--pb-rose-deep))] hover:bg-[hsl(var(--pb-blush-wash))] rounded-sm transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={handleCancel}
                      disabled={saving}
                      className="flex items-center gap-2 px-4 py-2 text-foreground hover:bg-muted rounded-sm transition-colors disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-2 px-4 py-2 bg-[hsl(var(--pb-rose))] text-white hover:bg-[hsl(var(--pb-rose-deep))] rounded-sm transition-colors disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    First Name
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                    />
                  ) : (
                    <div className="flex items-center gap-3 px-4 py-2 bg-muted rounded-lg">
                      <User className="w-5 h-5 text-muted-foreground" />
                      <span className="text-foreground">{user.firstName || '-'}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Last Name
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                    />
                  ) : (
                    <div className="flex items-center gap-3 px-4 py-2 bg-muted rounded-lg">
                      <User className="w-5 h-5 text-muted-foreground" />
                      <span className="text-foreground">{user.lastName || '-'}</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Email Address
                </label>
                <div className="flex items-center gap-3 px-4 py-2 bg-muted rounded-lg">
                  <Mail className="w-5 h-5 text-muted-foreground" />
                  <span className="text-foreground">{user.email}</span>
                  <span className="ml-auto text-xs text-muted-foreground">Cannot be changed</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                {editing ? (
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Enter phone number"
                    required
                    className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                  />
                ) : (
                  <div className="flex items-center gap-3 px-4 py-2 bg-muted rounded-lg">
                    <Phone className="w-5 h-5 text-muted-foreground" />
                    <span className="text-foreground">{user.phone || 'Not provided'}</span>
                  </div>
                )}
                {editing && !formData.phone && (
                  <p className="mt-1 text-sm text-red-500">Phone number is required</p>
                )}
              </div>
            </div>
          </div>

          {/* Saved Addresses */}
          <AddressManager showSelection={false} compact={false} />

          {/* Security Section */}
          <div className="bg-card rounded-lg shadow-sm border border-border">
            <div className="p-6 border-b border-border">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
                <Shield className="w-5 h-5" />
                Security
              </h3>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <Lock className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-foreground">Password</p>
                    <p className="text-sm text-muted-foreground">Last changed 30 days ago</p>
                  </div>
                </div>
                <button className="px-4 py-2 text-[hsl(var(--pb-rose-deep))] hover:bg-[hsl(var(--pb-blush-wash))] rounded-sm transition-colors">
                  Change Password
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-foreground">Email Verification</p>
                    <p className="text-sm text-muted-foreground">
                      {user.emailVerified ? 'Email verified' : 'Email not verified'}
                    </p>
                  </div>
                </div>
                {!user.emailVerified && (
                  <button className="px-4 py-2 text-[hsl(var(--pb-rose-deep))] hover:bg-[hsl(var(--pb-blush-wash))] rounded-sm transition-colors">
                    Verify Email
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
