'use client';

import * as React from 'react';
import Link from 'next/link';
import { Wallet } from 'lucide-react';
import { formatPrice } from '@/lib/currency';

interface WalletBadgeProps {
  /** 'icon' is a standalone header button; 'row' matches the account
   * dropdown's other menu items (My Account, My Orders, ...). */
  variant?: 'icon' | 'row';
  buttonClassName?: string;
  iconClassName?: string;
  onNavigate?: () => void;
}

/**
 * Storefront shortcut to the customer's store-credit balance
 * (GET /wallet/balance) — credited automatically on order cancellations and
 * exchanges. Links to /wallet for the full ledger.
 */
export function WalletBadge({ variant = 'icon', buttonClassName, iconClassName, onNavigate }: WalletBadgeProps) {
  const [balance, setBalance] = React.useState<number | null>(null);

  React.useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/wallet/balance`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setBalance(data ? Number(data.balance) || 0 : null))
      .catch(() => setBalance(null));
  }, []);

  if (variant === 'row') {
    return (
      <Link
        href="/wallet"
        onClick={onNavigate}
        className="flex items-center justify-between gap-3 rounded-sm px-3 py-2 text-sm text-[hsl(var(--pb-ink))] hover:bg-[hsl(var(--pb-shell))]"
      >
        <span className="flex items-center gap-3">
          <Wallet className="h-4 w-4" /> Wallet
        </span>
        {balance !== null && balance > 0 && (
          <span className="text-xs text-[hsl(var(--pb-ink-muted))]">{formatPrice(balance, 'INR')}</span>
        )}
      </Link>
    );
  }

  return (
    <Link href="/wallet" aria-label="Wallet" className={buttonClassName || 'relative p-2 rounded-full hover:bg-gray-100'}>
      <Wallet className={iconClassName || 'h-5 w-5'} />
      {balance !== null && balance > 0 && (
        <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-green-600 px-1 text-[9px] font-medium text-white">
          ₹{balance > 999 ? `${Math.floor(balance / 1000)}k` : Math.round(balance)}
        </span>
      )}
    </Link>
  );
}
