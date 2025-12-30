import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function POST(request: NextRequest) {
  try {
    const headers: HeadersInit = {};
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    console.log('🔄 Auto-generating invoices...');
    const response = await fetch(`${API_URL}/api/v1/invoices/auto-generate`, {
      method: 'POST',
      headers,
    });

    console.log('📨 Backend response status:', response.status);

    // Handle 204 No Content
    if (response.status === 204) {
      console.log('✅ Auto-generate completed (204)');
      return new NextResponse(null, { status: 204 });
    }

    // Check if response is ok before parsing
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Auto-generate failed:', response.status, errorText);
      return NextResponse.json(
        { message: errorText || 'Failed to auto-generate invoices' },
        { status: response.status }
      );
    }

    // Try to parse JSON only if there's content
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      console.log('✅ Auto-generate response:', data);
      return NextResponse.json(data, { status: response.status });
    }

    // If no JSON content but response is ok
    console.log('✅ Auto-generate completed (no JSON response)');
    return new NextResponse(null, { status: 200 });
  } catch (error) {
    console.error('Error auto-generating invoices:', error);
    return NextResponse.json(
      { message: 'Failed to auto-generate invoices' },
      { status: 500 }
    );
  }
}
