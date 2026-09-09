import type { FeatureMap } from './types';
import type { FormData } from '../legalgen/types';

export function detectFeatures(data: FormData): FeatureMap {
    return {
        hasLogin: !!data.hasAccounts,
        hasPayments: !!data.sellsProducts || !!data.collectsPayment || !!data.hasSubscriptions,
        hasSubscriptions: !!data.hasSubscriptions,
        shipsPhysicalGoods: !!data.sellsProducts && !data.digitalProducts,
        hasBookingSystem: !!data.hasBookingSystem,
        hasUserGeneratedContent: !!data.userGeneratedContent,
        hasAiFeatures: !!data.usesAi,
        hasCookiesAnalytics: !!data.usesCookies,
        hasNewsletter: !!data.hasNewsletter,
        hasInternationalUsers: ((data.targetAudience as string) || 'india').toLowerCase() !== 'india',
        collectsChildrenData: !!data.childrenUnder18,
        hasFileUploads: !!data.hasFileUploads,
        hasReviews: !!data.hasTestimonials,
    };
}