export const dynamic = 'force-dynamic';
export const maxDuration = 10;

export async function GET(request: Request) {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://marketplace-backend-prqr.onrender.com';
    const categoriesUrl = `${backendUrl}/api/v1/categories`;
    
    console.log(`[Cron] Pinging backend at ${categoriesUrl}`);
    
    const response = await fetch(categoriesUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Vercel-Cron-Keep-Alive',
      },
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
    
    const data = await response.json();
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
