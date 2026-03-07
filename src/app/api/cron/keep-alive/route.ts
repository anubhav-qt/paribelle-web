export const dynamic = 'force-dynamic';
export const maxDuration = 10;

function resolveBackendOrigin(apiUrl?: string): string {
  const fallback = 'https://marketplace-backend-prqr.onrender.com';
  if (!apiUrl) return fallback;

  const trimmed = apiUrl.replace(/\/+$/, '');
  return trimmed.endsWith('/api/v1') ? trimmed.slice(0, -7) : trimmed;
}

export async function GET(request: Request) {
  try {
    const backendOrigin = resolveBackendOrigin(process.env.NEXT_PUBLIC_API_URL);
    const pingUrl = `${backendOrigin}/api/v1/settings/name`;
    
    console.log(`[Cron] Pinging backend at ${pingUrl}`);
    
    const response = await fetch(pingUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Vercel-Cron-Keep-Alive',
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    });
    
    if (!response.ok) {
      console.error(`[Cron] Backend ping failed with status ${response.status}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          status: response.status,
          timestamp: new Date().toISOString() 
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const contentType = response.headers.get('content-type') || '';
    const data = contentType.includes('application/json')
      ? await response.json()
      : await response.text();
    console.log('[Cron] Backend is alive:', data);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        backend: data,
        timestamp: new Date().toISOString() 
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Cron] Error pinging backend:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString() 
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
