import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function GET(
  request: NextRequest,
  { params }: { params: { vendorId: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();

    const response = await fetch(
      `${API_URL}/invoices/vendor/${params.vendorId}?${queryString}`,
      {
        headers: {
          Cookie: request.headers.get('cookie') || '',
        },
      }
    );

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error fetching vendor invoices:', error);
    return NextResponse.json(
      { message: 'Failed to fetch vendor invoices' },
      { status: 500 }
    );
  }
}
