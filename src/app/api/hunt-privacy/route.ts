// src/app/api/hunt-privacy/route.ts
// API endpoint for Privacy Policy Hunter

import { NextRequest, NextResponse } from 'next/server';
import { huntPrivacyPolicy, type HunterResult } from '@/lib/legalgen/privacy-hunter';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    // Validate input
    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Basic URL validation
    try {
      new URL(url.startsWith('http') ? url : `https://${url}`);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    console.log(`[API] Starting privacy policy hunt for: ${url}`);

    // Run the hunter
    const result: HunterResult = await huntPrivacyPolicy(url);

    console.log(`[API] Hunt complete. Found ${result.summary.totalFound} policies`);

    return NextResponse.json({
      success: true,
      data: result,
    });

  } catch (error) {
    console.error('[API] Error in privacy hunt:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to scan website' 
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Privacy Policy Hunter API',
    usage: 'POST with { "url": "https://example.com" }',
    endpoints: {
      '/api/hunt-privacy': {
        method: 'POST',
        description: 'Hunt for privacy policies on a website',
        body: { url: 'string (required)' },
        response: { success: 'boolean', data: 'HunterResult' }  // ✅ FIXED: Added quotes around boolean
      }
    }
  });
}