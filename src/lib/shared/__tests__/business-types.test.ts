import { describe, it, expect } from 'vitest';
import {
  detectBusinessType,
  calculateComplianceScore,
  inferPageNameFromUrl,
  BUSINESS_TYPE_RULES,
} from '../business-types';

describe('Business Types', () => {
  describe('detectBusinessType', () => {
    it('detects e-commerce from checkout/cart keywords', () => {
      const html = 'Welcome to our store. Add to cart and checkout now!';
      const result = detectBusinessType(html, 'https://example.com');
      expect(result.name).toBe('E-Commerce');
      expect(result.required).toContain('Privacy Policy');
      expect(result.required).toContain('Refund Policy');
      expect(result.required).toContain('Terms of Service');
      expect(result.required).toContain('Shipping Policy');
    });

    it('detects SaaS from signup/trial keywords', () => {
      const html = 'Sign up for a free trial. View pricing and access dashboard.';
      const result = detectBusinessType(html, 'https://example.com');
      expect(result.name).toBe('SaaS/Tech');
      expect(result.required).toContain('Privacy Policy');
      expect(result.required).toContain('Terms of Service');
      expect(result.required).toContain('SLA');
      expect(result.required).toContain('Acceptable Use');
    });

    it('detects finance from banking/investment keywords', () => {
      const html = 'Apply for a loan or invest in stocks. RBI and SEBI regulated.';
      const result = detectBusinessType(html, 'https://example.com');
      expect(result.name).toBe('Finance');
      expect(result.required).toContain('Privacy Policy');
      expect(result.required).toContain('Risk Disclosure');
      expect(result.required).toContain('Grievance Redressal');
      expect(result.required).toContain('KYC Policy');
    });

    it('detects healthcare from medical keywords', () => {
      const html = 'Book a doctor consultation. Patient medical records and hospital services.';
      const result = detectBusinessType(html, 'https://example.com');
      expect(result.name).toBe('Healthcare');
      expect(result.required).toContain('Privacy Policy');
      expect(result.required).toContain('Medical Disclaimer');
      expect(result.required).toContain('Patient Consent');
    });

    it('defaults to general business for unknown content', () => {
      const html = 'Welcome to our generic website about nothing specific.';
      const result = detectBusinessType(html, 'https://example.com');
      expect(result.name).toBe('General Business');
      expect(result.required).toContain('Privacy Policy');
      expect(result.required).toContain('Terms of Service');
      expect(result.required).toContain('Cookie Policy');
    });

    it('handles empty content', () => {
      const result = detectBusinessType('', 'https://example.com');
      expect(result.name).toBe('General Business');
    });

    it('is case insensitive', () => {
      const html = 'ADD TO CART and CHECKOUT NOW';
      const result = detectBusinessType(html, 'https://example.com');
      expect(result.name).toBe('E-Commerce');
    });
  });

  describe('calculateComplianceScore', () => {
    it('calculates 100% when all required pages found', () => {
      const config = BUSINESS_TYPE_RULES.ecommerce;
      const foundPages = [
        { name: 'Privacy Policy', url: 'https://example.com/privacy' },
        { name: 'Refund Policy', url: 'https://example.com/refund' },
        { name: 'Terms of Service', url: 'https://example.com/terms' },
        { name: 'Shipping Policy', url: 'https://example.com/shipping' },
      ];
      const { score, missingPages } = calculateComplianceScore(config, foundPages);
      expect(score).toBe(100);
      expect(missingPages).toHaveLength(0);
    });

    it('calculates score based on missing pages', () => {
      const config = BUSINESS_TYPE_RULES.ecommerce;
      const foundPages = [
        { name: 'Privacy Policy', url: 'https://example.com/privacy' },
        { name: 'Terms of Service', url: 'https://example.com/terms' },
      ];
      const { score, missingPages } = calculateComplianceScore(config, foundPages);
      expect(missingPages).toContain('Refund Policy');
      expect(missingPages).toContain('Shipping Policy');
      expect(score).toBe(50); // 100 - 2 * 25
    });

    it('returns compliance results with correct structure', () => {
      const config = BUSINESS_TYPE_RULES.saas;
      const foundPages = [{ name: 'Privacy Policy', url: 'https://example.com/privacy' }];
      const { complianceResults } = calculateComplianceScore(config, foundPages);

      expect(complianceResults).toHaveLength(4);
      expect(complianceResults[0]).toMatchObject({
        type: 'privacy-policy',
        label: 'Privacy Policy',
        found: true,
        severity: 'critical',
      });
      expect(complianceResults[1]).toMatchObject({
        type: 'terms-of-service',
        label: 'Terms of Service',
        found: false,
        severity: 'critical',
      });
    });

    it('handles case-insensitive page matching', () => {
      const config = BUSINESS_TYPE_RULES.default;
      const foundPages = [
        { name: 'privacy policy', url: 'https://example.com/privacy' },
        { name: 'TERMS OF SERVICE', url: 'https://example.com/terms' },
      ];
      const { missingPages } = calculateComplianceScore(config, foundPages);
      expect(missingPages).not.toContain('Privacy Policy');
      expect(missingPages).not.toContain('Terms of Service');
      expect(missingPages).toContain('Cookie Policy');
    });
  });

  describe('inferPageNameFromUrl', () => {
    it('infers privacy policy from URL', () => {
      expect(inferPageNameFromUrl('https://example.com/privacy-policy')).toBe('Privacy Policy');
      expect(inferPageNameFromUrl('https://example.com/privacy')).toBe('Privacy Policy');
    });

    it('infers terms of service from URL', () => {
      expect(inferPageNameFromUrl('https://example.com/terms-of-service')).toBe('Terms of Service');
      expect(inferPageNameFromUrl('https://example.com/terms')).toBe('Terms of Service');
    });

    it('infers refund policy from URL', () => {
      expect(inferPageNameFromUrl('https://example.com/refund-policy')).toBe('Refund Policy');
    });

    it('infers cookie policy from URL', () => {
      expect(inferPageNameFromUrl('https://example.com/cookie-policy')).toBe('Cookie Policy');
    });

    it('returns generic name for unknown URLs', () => {
      expect(inferPageNameFromUrl('https://example.com/about')).toBe('Legal Page');
      expect(inferPageNameFromUrl('https://example.com/contact')).toBe('Legal Page');
    });

    it('infers other policy types', () => {
      expect(inferPageNameFromUrl('https://example.com/shipping')).toBe('Shipping Policy');
      expect(inferPageNameFromUrl('https://example.com/cancellation')).toBe('Cancellation Policy');
      expect(inferPageNameFromUrl('https://example.com/return')).toBe('Return Policy');
      expect(inferPageNameFromUrl('https://example.com/disclaimer')).toBe('Disclaimer');
      expect(inferPageNameFromUrl('https://example.com/aup')).toBe('Acceptable Use Policy');
      expect(inferPageNameFromUrl('https://example.com/sla')).toBe('SLA');
      expect(inferPageNameFromUrl('https://example.com/dmca')).toBe('DMCA Policy');
    });
  });
});