import { NextRequest, NextResponse } from 'next/server';

// Store sensitive keys in environment variables
const EXTERNAL_API_KEY = process.env.EXTERNAL_API_KEY || '';
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'https://legalgen.in',
  'https://www.legalgen.in',
];

export async function POST(request: NextRequest) {
  // CORS check
  const origin = request.headers.get('origin');
  if (origin && !ALLOWED_ORIGINS.includes(origin)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  try {
    const body = await request.json();
    const { targetUrl, method = 'GET', payload } = body;
    
    // Make server-side request with secure key
    const response = await fetch(targetUrl, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${EXTERNAL_API_KEY}`,
        'x-api-key': EXTERNAL_API_KEY,
      },
      body: payload ? JSON.stringify(payload) : undefined,
    });
    
    const data = await response.json();
    
    return NextResponse.json(data, {
      status: response.status,
      headers: {
        'Access-Control-Allow-Origin': origin || '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
    
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Proxy request failed' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}