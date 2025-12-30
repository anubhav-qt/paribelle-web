import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();

    const headers: HeadersInit = {};
    
    // Forward Authorization header from the request
    const authHeader = request.headers.get('authorization');
    console.log('📥 [Invoices API Route] Received auth header:', authHeader ? 'Bearer token present' : 'NO TOKEN');
    
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    const backendUrl = `${API_URL}/api/v1/invoices?${queryString}`;
    console.log('🔗 [Invoices API Route] Calling backend:', backendUrl);
    console.log('📤 [Invoices API Route] Headers:', headers);

    const response = await fetch(backendUrl, {
      headers,
    });

    console.log('📨 [Invoices API Route] Backend response status:', response.status);
    const data = await response.json();
    console.log('📦 [Invoices API Route] Backend response data:', data);

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      { message: 'Failed to fetch invoices' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${API_URL}/api/v1/invoices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: request.headers.get('cookie') || '',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error creating invoice:', error);
    return NextResponse.json(
      { message: 'Failed to create invoice' },
      { status: 500 }
    );
  }
}
