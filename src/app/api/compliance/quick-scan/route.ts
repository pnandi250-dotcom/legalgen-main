/**
 * LegalGen V2 - Quick Scan API
 * 
 * POST /api/compliance/quick-scan
 * 
 * One-step: Scan URL → Analyze → Return results
 */

import { NextRequest, NextResponse } from 'next/server';
import { analyzeApplicability } from '@/lib/legalgen/applicability-engine';
import { calculateRiskScore } from '@/lib/legalgen/risk-calculator';
import { convertToBusinessProfile } from '@/lib/legalgen/business-types';

const SCRAPER_URL = process.env.SCRAPER_URL || 'http://localhost:3001';
const SCRAPER_API_KEY = process.env.SCRAPER_API_KEY || 'legalgen-v2-key-2024';

export async function POST(request: NextRequest) {
    try {
        const { url, companyName } = await request.json();

        if (!url) {
            return NextResponse.json({ error: 'URL required' }, { status: 400 });
        }

        console.log(`🚀 Quick scan starting: ${url}`);

        // Step 1: Scrape website
        const scrapeResponse = await fetch(`${SCRAPER_URL}/api/scan`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': SCRAPER_API_KEY,
            },
            body: JSON.stringify({ url }),
        });

        if (!scrapeResponse.ok) {
            throw new Error('Scraper failed');
        }

        const scrapeData = await scrapeResponse.json();
        const scanResult = scrapeData.data;

        // Step 2: Convert scraper output to business facts
        const features: Record<string, boolean> = {};

        // Map scraper findings to features
        if (scanResult.insights?.likelyEcommerce) {
            features.sellsProducts = true;
            features.hasPayments = true;
        }
        if (scanResult.forms?.collectsPersonalData) {
            features.hasUsers = true;
        }
        if (scanResult.technologies?.cookies?.length > 0) {
            features.hasCookies = true;
        }
        if (scanResult.technologies?.payments?.length > 0) {
            features.hasPayments = true;
        }
        if (scanResult.businessFacts?.some((f: any) => f.factType === 'runs_ads')) {
            features.hasAds = true;
        }
        if (scanResult.businessFacts?.some((f: any) => f.factType === 'uses_cookies')) {
            features.hasCookies = true;
        }

        // Step 3: Create business profile & analyze
        const businessProfile = convertToBusinessProfile({
            companyName: companyName || scanResult.url || 'Scanned Business',
            website: url,
            businessType: 'web-business',
            features
        });

        const applicability = analyzeApplicability(businessProfile);
        const risk = calculateRiskScore(applicability);

        console.log(`✅ Quick scan complete! Risk level: ${risk.level}`);

        return NextResponse.json({
            success: true,
            data: {
                url,
                scannedAt: scanResult.scannedAt,
                scanResult,
                analysis: {
                    applicability: {
                        summary: applicability.summary,
                        applicableObligations: applicability.applicableObligations.length,
                        needsReview: applicability.needsReviewObligations.length
                    },
                    risk: {
                        score: risk.overallScore,
                        level: risk.level,
                        topRisks: risk.topRisks.slice(0, 5),
                        categories: risk.categories
                    }
                },
                recommendations: risk.recommendations.slice(0, 8)
            }
        });

    } catch (error) {
        console.error('❌ Quick scan error:', error);
        return NextResponse.json(
            { error: 'Quick scan failed', message: (error as Error).message },
            { status: 500 }
        );
    }
}