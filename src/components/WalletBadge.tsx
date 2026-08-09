'use client';

import * as React from 'react';
import Link from 'next/link';
import { Wallet } from 'lucide-react';

interface WalletBadgeProps {
  buttonClassName?: string;
  iconClassName?: string;
}

/**
 * Storefront header shortcut to the customer's store-credit balance
 * (GET /wallet/balance) — credited automatically on order cancellations and
 * exchanges. Links to /wallet for the full ledger.
 */
export function WalletBadge({ buttonClassName, iconClassName }: WalletBadgeProps) {
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
