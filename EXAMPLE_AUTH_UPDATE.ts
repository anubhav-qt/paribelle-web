// Example: How to update ProfileContent.tsx to use the new auth utilities

// BEFORE (old code):
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
  // Handle success
} else {
  // Handle error
  throw new Error('Failed to update profile');
}

// AFTER (with auth error handling):
import { checkAuthResponse } from '@/lib/auth';

const token = localStorage.getItem('token');
const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/profile`, {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify(formData),
});

// This will automatically redirect to login if 401 (unverified email or expired token)
await checkAuthResponse(response);

if (response.ok) {
  const updatedUser = await response.json();
  // Handle success
} else {
  // Handle other errors (400, 500, etc.)
  throw new Error('Failed to update profile');
}
