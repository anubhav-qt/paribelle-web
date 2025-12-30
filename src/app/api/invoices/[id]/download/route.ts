import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const headers: HeadersInit = {};
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    const backendUrl = `${API_URL}/api/v1/invoices/${params.id}/download`;
    console.log('📥 [Next.js API] Fetching from backend:', backendUrl);
    console.log('🔑 [Next.js API] Authorization header:', authHeader ? 'present' : 'missing');

    const response = await fetch(backendUrl, {
      headers,
    });

    console.log('📨 [Next.js API] Backend response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [Next.js API] Backend error:', errorText);
      return NextResponse.json(
        { message: 'Failed to download invoice', error: errorText },
        { status: response.status }
      );
    }

    const buffer = await response.arrayBuffer();
    console.log('✅ [Next.js API] PDF received, size:', buffer.byteLength, 'bytes');

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${params.id}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error('❌ [Next.js API] Error downloading invoice:', error);
    return NextResponse.json(
      { message: 'Failed to download invoice', error: error.message },
      { status: 500 }
    );
  }
}
