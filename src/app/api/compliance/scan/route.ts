/**
 * LegalGen V2 - Website Scanner API
 * 
 * POST /api/compliance/scan
 * 
 * Scans a website and returns structured intelligence
 */

import { NextRequest, NextResponse } from 'next/server';

// Scraper configuration
const SCRAPER_URL = process.env.SCRAPER_URL || 'http://localhost:3001';
const SCRAPER_API_KEY = process.env.SCRAPER_API_KEY || 'legalgen-v2-key-2024';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { url } = body;

        // Validate URL
        if (!url) {
            return NextResponse.json(
                { error: 'URL is required' },
                { status: 400 }
            );
        }

        // Basic URL validation
        try {
            new URL(url);
        } catch {
            return NextResponse.json(
                { error: 'Invalid URL format' },
                { status: 400 }
            );
        }

        console.log(`🔍 Scanning website: ${url}`);

        // Call scraper service
        const scraperResponse = await fetch(`${SCRAPER_URL}/api/scan`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': SCRAPER_API_KEY,
            },
            body: JSON.stringify({ url }),
        });

        if (!scraperResponse.ok) {
            const errorData = await scraperResponse.json().catch(() => ({}));
            throw new Error(errorData.error || `Scraper error: ${scraperResponse.status}`);
        }

        const scraperResult = await scraperResponse.json();

        console.log(`✅ Scan complete for: ${url}`);

        // Return enhanced response
        return NextResponse.json({
            success: true,
            data: {
                ...scraperResult.data,
                apiVersion: '2.0.0',
                processedAt: new Date().toISOString(),
            },
            metadata: {
                scanDuration: scraperResult.data?.scannedAt ?
                    Date.now() - new Date(scraperResult.data.scannedAt).getTime() : null,
                source: 'v2-scraper',
            }
        });

    } catch (error) {
        console.error('❌ Scan API error:', error);

        return NextResponse.json(
            {
                error: 'Failed to scan website',
                message: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString(),
            },
            { status: 500 }
        );
    }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
        },
    });
}