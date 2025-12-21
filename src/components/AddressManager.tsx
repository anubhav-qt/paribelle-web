'use client';

import { useState, useEffect, useRef } from 'react';
import { MapPin, Edit2, Trash2, Plus, Phone, Home, ChevronDown } from 'lucide-react';

const COUNTRIES = [
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
  { code: 'BE', name: 'Belgium', flag: '🇧🇪' },
  { code: 'CH', name: 'Switzerland', flag: '🇨🇭' },
  { code: 'AT', name: 'Austria', flag: '🇦🇹' },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪' },
  { code: 'NO', name: 'Norway', flag: '🇳🇴' },
  { code: 'DK', name: 'Denmark', flag: '🇩🇰' },
  { code: 'FI', name: 'Finland', flag: '🇫🇮' },
  { code: 'PL', name: 'Poland', flag: '🇵🇱' },
  { code: 'IE', name: 'Ireland', flag: '🇮🇪' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
  { code: 'GR', name: 'Greece', flag: '🇬🇷' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
  { code: 'CN', name: 'China', flag: '🇨🇳' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
  { code: 'MY', name: 'Malaysia', flag: '🇲🇾' },
  { code: 'TH', name: 'Thailand', flag: '🇹🇭' },
  { code: 'ID', name: 'Indonesia', flag: '🇮🇩' },
  { code: 'PH', name: 'Philippines', flag: '🇵🇭' },
  { code: 'VN', name: 'Vietnam', flag: '🇻🇳' },
  { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪' },
  { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦' },
  { code: 'QA', name: 'Qatar', flag: '🇶🇦' },
  { code: 'KW', name: 'Kuwait', flag: '🇰🇼' },
  { code: 'BH', name: 'Bahrain', flag: '🇧🇭' },
  { code: 'OM', name: 'Oman', flag: '🇴🇲' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷' },
  { code: 'NZ', name: 'New Zealand', flag: '🇳🇿' },
];

const PHONE_CODES = [
  { code: '+91', country: 'India', flag: '🇮🇳' },
  { code: '+1', country: 'United States', flag: '🇺🇸' },
  { code: '+44', country: 'United Kingdom', flag: '🇬🇧' },
  { code: '+61', country: 'Australia', flag: '🇦🇺' },
  { code: '+86', country: 'China', flag: '🇨🇳' },
  { code: '+81', country: 'Japan', flag: '🇯🇵' },
  { code: '+82', country: 'South Korea', flag: '🇰🇷' },
  { code: '+65', country: 'Singapore', flag: '🇸🇬' },
  { code: '+971', country: 'United Arab Emirates', flag: '🇦🇪' },
  { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦' },
  { code: '+33', country: 'France', flag: '🇫🇷' },
  { code: '+49', country: 'Germany', flag: '🇩🇪' },
  { code: '+39', country: 'Italy', flag: '🇮🇹' },
  { code: '+34', country: 'Spain', flag: '🇪🇸' },
  { code: '+31', country: 'Netherlands', flag: '🇳🇱' },
  { code: '+41', country: 'Switzerland', flag: '🇨🇭' },
  { code: '+46', country: 'Sweden', flag: '🇸🇪' },
  { code: '+47', country: 'Norway', flag: '🇳🇴' },
  { code: '+45', country: 'Denmark', flag: '🇩🇰' },
  { code: '+358', country: 'Finland', flag: '🇫🇮' },
  { code: '+48', country: 'Poland', flag: '🇵🇱' },
  { code: '+353', country: 'Ireland', flag: '🇮🇪' },
  { code: '+351', country: 'Portugal', flag: '🇵🇹' },
  { code: '+30', country: 'Greece', flag: '🇬🇷' },
  { code: '+27', country: 'South Africa', flag: '🇿🇦' },
  { code: '+55', country: 'Brazil', flag: '🇧🇷' },
  { code: '+52', country: 'Mexico', flag: '🇲🇽' },
  { code: '+64', country: 'New Zealand', flag: '🇳🇿' },
];

export interface Address {
  id?: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault?: boolean;
}

interface AddressManagerProps {
  onAddressSelect?: (address: Address) => void;
  selectedAddressId?: string | null;
  showSelection?: boolean; // Whether to show radio buttons for selection
  compact?: boolean; // Compact view for checkout
}

export default function AddressManager({ 
  onAddressSelect, 
  selectedAddressId,
  showSelection = false,
  compact = false
}: AddressManagerProps) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [showPhoneDropdown, setShowPhoneDropdown] = useState(false);
  const [selectedPhoneCode, setSelectedPhoneCode] = useState('+91');
  const countryDropdownRef = useRef<HTMLDivElement>(null);
  const phoneDropdownRef = useRef<HTMLDivElement>(null);
  
  const [addressForm, setAddressForm] = useState<Address>({
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    isDefault: false,
  });

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      try {
        const target = event.target as Node;
        if (target && target.nodeType === Node.ELEMENT_NODE) {
          if (countryDropdownRef.current && !countryDropdownRef.current.contains(target)) {
            setShowCountryDropdown(false);
          }
          if (phoneDropdownRef.current && !phoneDropdownRef.current.contains(target)) {
            setShowPhoneDropdown(false);
          }
        }
      } catch (error) {
        // Ignore errors from DOM operations during cleanup
      }
    };

    if (showAddressForm) {
      document.addEventListener('mousedown', handleClickOutside, { passive: true });
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAddressForm, showCountryDropdown, showPhoneDropdown]);

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = () => {
    const savedAddresses = localStorage.getItem('user_addresses');
    if (savedAddresses) {
      const parsed = JSON.parse(savedAddresses);
      setAddresses(parsed);
      
      // Auto-select default address if in selection mode
      if (showSelection && onAddressSelect && !selectedAddressId) {
        const defaultAddr = parsed.find((a: Address) => a.isDefault);
        if (defaultAddr) {
          onAddressSelect(defaultAddr);
        }
      }
    }
  };

  const resetAddressForm = () => {
    setAddressForm({
      fullName: '',
      phone: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'India',
      isDefault: false,
    });
  };

  const handleSaveAddress = () => {
    // Validate address
    if (!addressForm.fullName || !addressForm.phone || !addressForm.addressLine1 || 
        !addressForm.city || !addressForm.state || !addressForm.postalCode || !addressForm.country) {
      alert('Please fill in all required fields');
      return;
    }

    // Validate phone (international format: 5-15 digits)
    const phoneRegex = /^\d{5,15}$/;
    if (!phoneRegex.test(addressForm.phone)) {
      alert('Please enter a valid phone number (5-15 digits)');
      return;
    }

    // Validate postal code (international format: 3-10 alphanumeric characters)
    const postalRegex = /^[A-Za-z0-9\s-]{3,10}$/;
    if (!postalRegex.test(addressForm.postalCode)) {
      alert('Please enter a valid postal code (3-10 characters)');
      return;
    }

    let updatedAddresses: Address[];
    if (editingAddressId) {
      // Update existing address
      updatedAddresses = addresses.map(addr => 
        addr.id === editingAddressId ? { ...addressForm, id: editingAddressId } : addr
      );
    } else {
      // Add new address
      const newAddress: Address = {
        ...addressForm,
        id: Date.now().toString(),
        isDefault: addresses.length === 0 ? true : addressForm.isDefault,
      };
      
      // If this is set as default, unset others
      if (newAddress.isDefault) {
        updatedAddresses = [...addresses.map(a => ({ ...a, isDefault: false })), newAddress];
      } else {
        updatedAddresses = [...addresses, newAddress];
      }

      // Auto-select newly added address if in selection mode
      if (showSelection && onAddressSelect) {
        onAddressSelect(newAddress);
      }
    }

    setAddresses(updatedAddresses);
    localStorage.setItem('user_addresses', JSON.stringify(updatedAddresses));
    setShowAddressForm(false);
    setEditingAddressId(null);
    resetAddressForm();
  };

  const handleEditAddress = (address: Address, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setAddressForm({
      fullName: address.fullName,
      phone: address.phone,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 || '',
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country || 'India',
      isDefault: address.isDefault || false,
    });
    setEditingAddressId(address.id || null);
    setShowAddressForm(true);
  };

  const handleDeleteAddress = (addressId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (confirm('Are you sure you want to delete this address?')) {
      const updatedAddresses = addresses.filter(addr => addr.id !== addressId);
      
      // If deleted address was default and there are other addresses, make first one default
      const deletedAddr = addresses.find(a => a.id === addressId);
      if (deletedAddr?.isDefault && updatedAddresses.length > 0) {
        updatedAddresses[0].isDefault = true;
      }
      
      setAddresses(updatedAddresses);
      localStorage.setItem('user_addresses', JSON.stringify(updatedAddresses));
      
      // If in selection mode and deleted the selected address, select default
      if (showSelection && onAddressSelect && selectedAddressId === addressId) {
        const defaultAddr = updatedAddresses.find(a => a.isDefault);
        if (defaultAddr) {
          onAddressSelect(defaultAddr);
        }
      }
    }
  };

  const handleSetDefaultAddress = (addressId: string) => {
    const updatedAddresses = addresses.map(addr => ({
      ...addr,
      isDefault: addr.id === addressId,
    }));
    setAddresses(updatedAddresses);
    localStorage.setItem('user_addresses', JSON.stringify(updatedAddresses));
  };

  const handleSelectAddress = (address: Address) => {
    if (showSelection && onAddressSelect) {
      onAddressSelect(address);
    }
  };

  if (showAddressForm) {
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">
            {editingAddressId ? 'Edit Address' : addresses.length > 0 ? 'Add New Address' : 'Delivery Address'}
          </h3>
          {addresses.length > 0 && (
            <button
              onClick={() => {
                setShowAddressForm(false);
                setEditingAddressId(null);
                resetAddressForm();
              }}
              className="text-sm text-primary hover:underline"
            >
              {showSelection ? 'Choose from saved addresses' : 'Cancel'}
            </button>
          )}
        </div>

        <form className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Full Name *</label>
              <input
                type="text"
                value={addressForm.fullName}
                onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                placeholder="John Doe"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Phone Number *</label>
              <div className="flex gap-2">
                {/* Custom Phone Code Dropdown */}
                <div className="relative w-32" ref={phoneDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setShowPhoneDropdown(!showPhoneDropdown)}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground flex items-center justify-between"
                  >
                    <span className="font-medium">{selectedPhoneCode}</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  {showPhoneDropdown && (
                    <div className="absolute z-50 w-full mt-1 max-h-60 overflow-y-auto bg-background border border-border rounded-lg shadow-lg">
                      {PHONE_CODES.map((phone) => (
                        <button
                          key={phone.code}
                          type="button"
                          onClick={() => {
                            setSelectedPhoneCode(phone.code);
                            setShowPhoneDropdown(false);
                          }}
                          className="w-full px-3 py-2 text-left hover:bg-muted flex items-center gap-3 text-foreground transition-colors"
                        >
                          <span className="text-lg" style={{ fontFamily: '"Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji", "Apple Color Emoji", sans-serif' }}>
                            {phone.flag}
                          </span>
                          <span className="flex-1">{phone.country}</span>
                          <span className="font-medium text-muted-foreground">{phone.code}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <input
                  type="tel"
                  value={addressForm.phone}
                  onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                  placeholder="9876543210"
                  maxLength={15}
                  className="flex-1 px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                  required
                />
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Address Line 1 *</label>
            <input
              type="text"
              value={addressForm.addressLine1}
              onChange={(e) => setAddressForm({ ...addressForm, addressLine1: e.target.value })}
              placeholder="House No., Building Name"
              className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Address Line 2</label>
            <input
              type="text"
              value={addressForm.addressLine2}
              onChange={(e) => setAddressForm({ ...addressForm, addressLine2: e.target.value })}
              placeholder="Street, Area, Landmark"
              className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">City *</label>
              <input
                type="text"
                value={addressForm.city}
                onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                placeholder="Mumbai"
                className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">State *</label>
              <input
                type="text"
                value={addressForm.state}
                onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                placeholder="Maharashtra"
                className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Postal Code *</label>
              <input
                type="text"
                value={addressForm.postalCode}
                onChange={(e) => setAddressForm({ ...addressForm, postalCode: e.target.value })}
                placeholder="400001 or SW1A 1AA"
                maxLength={10}
                className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                required
              />
            </div>
          </div>
          
          {/* Custom Country Dropdown */}
          <div className="relative" ref={countryDropdownRef}>
            <label className="block text-sm font-medium text-foreground mb-2">Country *</label>
            <button
              type="button"
              onClick={() => setShowCountryDropdown(!showCountryDropdown)}
              className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground flex items-center justify-between text-left"
            >
              <span className="flex items-center gap-2.5">
                {addressForm.country ? (
                  <>
                    <span className="text-lg" style={{ fontFamily: '"Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji", "Apple Color Emoji", sans-serif' }}>
                      {COUNTRIES.find(c => c.name === addressForm.country)?.flag}
                    </span>
                    <span>{addressForm.country}</span>
                  </>
                ) : (
                  <span className="text-muted-foreground">Select Country</span>
                )}
              </span>
              <ChevronDown className="w-4 h-4" />
            </button>
            {showCountryDropdown && (
              <div className="absolute z-50 w-full mt-1 max-h-60 overflow-y-auto bg-background border border-border rounded-lg shadow-lg">
                {COUNTRIES.map((country) => (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => {
                      setAddressForm({ ...addressForm, country: country.name });
                      setShowCountryDropdown(false);
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-muted flex items-center gap-3 text-foreground transition-colors"
                  >
                    <span className="text-lg" style={{ fontFamily: '"Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji", "Apple Color Emoji", sans-serif' }}>
                      {country.flag}
                    </span>
                    <span>{country.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {!showSelection && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="defaultAddress"
                checked={addressForm.isDefault}
                onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                className="w-4 h-4 text-primary rounded"
              />
              <label htmlFor="defaultAddress" className="text-sm text-foreground">
                Set as default address
              </label>
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowAddressForm(false);
                setEditingAddressId(null);
                resetAddressForm();
              }}
              className="flex-1 px-4 py-2 border border-border text-foreground rounded-lg hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveAddress}
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              {editingAddressId ? 'Update Address' : 'Save Address'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">
          {showSelection ? 'Select Delivery Address' : 'Saved Addresses'}
        </h3>
        <button
          onClick={() => {
            setShowAddressForm(true);
            setEditingAddressId(null);
            resetAddressForm();
          }}
          className="flex items-center gap-2 text-sm text-primary hover:underline"
        >
          <Plus className="w-4 h-4" />
          Add New Address
        </button>
      </div>

      {addresses.length > 0 ? (
        <div className="space-y-3">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`flex items-start gap-3 p-4 border-2 rounded-lg transition ${
                showSelection && selectedAddressId === addr.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              {showSelection && (
                <input
                  type="radio"
                  name="savedAddress"
                  checked={selectedAddressId === addr.id}
                  onChange={() => handleSelectAddress(addr)}
                  className="mt-1 cursor-pointer"
                />
              )}
              <div 
                className={`flex-1 ${showSelection ? 'cursor-pointer' : ''}`}
                onClick={() => showSelection && handleSelectAddress(addr)}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-foreground">{addr.fullName}</span>
                  {addr.isDefault && (
                    <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded">
                      Default
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{addr.addressLine1}</p>
                {addr.addressLine2 && (
                  <p className="text-sm text-muted-foreground">{addr.addressLine2}</p>
                )}
                <p className="text-sm text-muted-foreground">
                  {addr.city}, {addr.state} - {addr.postalCode}
                </p>
                <p className="text-sm text-muted-foreground">
                  {addr.country}
                </p>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  {addr.phone}
                </p>
                {!showSelection && !addr.isDefault && (
                  <button
                    onClick={() => handleSetDefaultAddress(addr.id || '')}
                    className="mt-2 text-sm text-primary hover:underline"
                  >
                    Set as default
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={(e) => handleEditAddress(addr, e)}
                  className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                  title="Edit address"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => handleDeleteAddress(addr.id || '', e)}
                  className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                  title="Delete address"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <MapPin className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No saved addresses yet</p>
          <p className="text-sm">Add an address for faster checkout</p>
        </div>
      )}
    </div>
  );
}
