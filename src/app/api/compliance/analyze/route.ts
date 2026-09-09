/**
 * LegalGen V2 - Compliance Analysis API
 * 
 * POST /api/compliance/analyze
 * 
 * Runs full compliance analysis:
 * 1. Scrapes website (optional)
 * 2. Builds business profile
 * 3. Runs applicability engine
 * 4. Calculates risk scores
 * 5. Returns comprehensive analysis
 */

import { NextRequest, NextResponse } from 'next/server';
import {
    analyzeApplicability,
    generateCompliancePriority,
    type ApplicabilityAnalysis
} from '@/lib/legalgen/applicability-engine';
import {
    calculateRiskScore,
    generateExecutiveSummary,
    estimateComplianceInvestment,
    type RiskScoreBreakdown
} from '@/lib/legalgen/risk-calculator';
import {
    convertToBusinessProfile,
    type BusinessProfile
} from '@/lib/legalgen/business-types';

// Types
interface AnalyzeRequest {
    url?: string;                    // Optional: URL to scan first
    businessProfile?: Partial<BusinessProfile>;  // Or provide profile directly
    companyInfo?: {
        name: string;
        website: string;
        industry: string;
        employeeCount?: number;
    };
    features?: Record<string, boolean>;  // V1-style features (for migration)
}

interface AnalyzeResponse {
    success: boolean;
    data: {
        businessProfile: BusinessProfile;
        applicability: ApplicabilityAnalysis;
        risk: RiskScoreBreakdown;
        priority: ReturnType<typeof generateCompliancePriority>;
        executiveSummary: ReturnType<typeof generateExecutiveSummary>;
        investmentEstimate: ReturnType<typeof estimateComplianceInvestment>;
        recommendations: Array<{
            area: string;
            action: string;
            priority: string;
            effort: string;
        }>;
    };
    processingTimeMs: number;
}

export async function POST(request: NextRequest) {
    const startTime = Date.now();

    try {
        const body: AnalyzeRequest = await request.json();

        let businessProfile: BusinessProfile;

        // Option 1: Build from V1-style features (migration path)
        if (body.features && !body.businessProfile) {
            businessProfile = convertToBusinessProfile({
                companyName: body.companyInfo?.name || 'Unknown Business',
                website: body.companyInfo?.website || body.url || '',
                businessType: body.companyInfo?.industry || 'general',
                features: body.features
            });
        }
        // Option 2: Use provided business profile
        else if (body.businessProfile) {
            businessProfile = body.businessProfile as BusinessProfile;
        }
        // Option 3: Create minimal profile from company info
        else if (body.companyInfo) {
            businessProfile = convertToBusinessProfile({
                companyName: body.companyInfo.name,
                website: body.companyInfo.website,
                businessType: body.companyInfo.industry || 'general',
                features: {}
            });
        }
        else {
            return NextResponse.json(
                { error: 'Either features, businessProfile, or companyInfo is required' },
                { status: 400 }
            );
        }

        console.log(`🔍 Running compliance analysis for: ${businessProfile.companyInfo.name}`);

        // Step 1: Run Applicability Engine
        const applicability = analyzeApplicability(businessProfile);

        console.log(`✅ Applicability analysis complete:`);
        console.log(`   - Applies: ${applicability.summary.applies}`);
        console.log(`   - Potentially applies: ${applicability.summary.potentiallyApplies}`);
        console.log(`   - Does not apply: ${applicability.summary.doesNotApply}`);

        // Step 2: Calculate Risk Scores
        const risk = calculateRiskScore(applicability);

        console.log(`✅ Risk calculation complete:`);
        console.log(`   - Overall score: ${risk.overallScore}/100 (${risk.level})`);
        console.log(`   - Top risks: ${risk.topRisks.length}`);

        // Step 3: Generate Priority List
        const priority = generateCompliancePriority(applicability);

        // Step 4: Generate Executive Summary
        const executiveSummary = generateExecutiveSummary(risk, applicability);

        // Step 5: Estimate Investment
        const investmentEstimate = estimateComplianceInvestment(applicability);

        // Step 6: Compile Recommendations
        const recommendations = [
            ...risk.recommendations.map(r => ({
                area: r.area,
                action: r.action,
                priority: r.priority,
                effort: r.effort,
                impact: r.impact
            })),
            ...priority.slice(0, 5).map(p => ({
                area: p.obligation.category,
                action: `Implement controls for: ${p.obligation.title}`,
                priority: p.priority,
                effort: p.effort,
                impact: `${p.obligation.severity} severity obligation`
            }))
        ];

        const processingTime = Date.now() - startTime;

        console.log(`✅ Analysis complete in ${processingTime}ms`);

        const responseData: AnalyzeResponse = {
            success: true,
            data: {
                businessProfile,
                applicability,
                risk,
                priority,
                executiveSummary,
                investmentEstimate,
                recommendations
            },
            processingTimeMs: processingTime
        };

        return NextResponse.json(responseData);

    } catch (error) {
        console.error('❌ Analysis API error:', error);

        return NextResponse.json(
            {
                error: 'Failed to run compliance analysis',
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