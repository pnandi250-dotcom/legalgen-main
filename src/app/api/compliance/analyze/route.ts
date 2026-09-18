/**
 * POST /api/compliance/analyze
 * Full analysis from answers or company details. No scanning, no upstream.
 *
 * The unchecked `body.businessProfile as BusinessProfile` cast is gone: input
 * is Zod-parsed and the profile is always built by convertToBusinessProfile.
 */
import { route } from '@/lib/api/handler';
import { analyzeRequest } from '@/lib/validation/schemas';
import { consumeQuota } from '@/lib/quota';
import {
    analyzeApplicability,
    generateCompliancePriority,
} from '@/lib/legalgen/applicability-engine';
import {
    calculateRiskScore,
    generateExecutiveSummary,
    estimateComplianceInvestment,
} from '@/lib/legalgen/risk-calculator';
import { convertToBusinessProfile } from '@/lib/legalgen/business-types';

export const runtime = 'nodejs';

export const POST = route({ schema: analyzeRequest, auth: 'anonymous' }, async ({ body, user, request }) => {
    await consumeQuota(user, request, 'generate');

    const profile = convertToBusinessProfile({
        companyName: body.companyInfo?.name ?? 'Unnamed business',
        website: body.companyInfo?.website ?? body.url ?? '',
        businessType: body.companyInfo?.industry ?? 'general',
        features: body.features ?? {},
    });

    const applicability = analyzeApplicability(profile);
    const risk = calculateRiskScore(applicability);

    return {
        businessProfile: profile,
        applicability,
        risk,
        priority: generateCompliancePriority(applicability),
        executiveSummary: generateExecutiveSummary(risk, applicability),
        investmentEstimate: estimateComplianceInvestment(applicability),
    };
});
