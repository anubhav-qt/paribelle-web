import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function GET() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/v1/settings/default-theme`, {
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      return NextResponse.json(
        { key: 'default-theme', value: null },
        { status: 200 }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching theme:', error);
    return NextResponse.json(
      { key: 'default-theme', value: null },
      { status: 200 }
    );
  }
}
