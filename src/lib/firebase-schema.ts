// =============================================================================
// LEGALGEN - FIREBASE SCHEMA (Database Structure)
// =============================================================================
// How to store V2 data in Firestore
// =============================================================================

// ─── 1. ORGANIZATION DOCUMENT ────────────────────────────────────────────

export interface OrgDocument {
    id: string;
    name: string;
    plan: 'free' | 'pro' | 'enterprise';
    ownerId: string;
    createdAt: string;

    // Settings
    defaultCountry: string;
    defaultLanguage: string;

    // Usage
    scansUsedThisMonth: number;
}

// ─── 2. BUSINESS PROFILE (Sub-collection) ─────────────────────────────────

export interface BusinessProfileDoc {
    id: string;
    orgId: string;

    company: {
        name: string;
        website: string;
        industry: string;
        businessModel: string;
    };

    jurisdiction: {
        primaryCountry: string;
        countries: string[];
        hasInternationalCustomers: boolean;
    };

    facts: Array<{
        key: string;
        value: unknown;
        source: string;
        confidence: number;
    }>;

    version: number;
    lastUpdatedAt: string;
}

// ─── 3. SCAN RESULTS (Sub-collection) ─────────────────────────────────────

export interface ScanDoc {
    id: string;
    orgId: string;
    url: string;

    status: 'completed' | 'failed' | 'partial';
    scannedAt: string;

    // V2 Structured results
    business: object;
    technologies: object;
    cookies: object[];
    legalPages: object[];

    // Legacy support
    textContent?: string;

    confidence: number;
}

// ─── 4. CONTROLS (Sub-collection) ─────────────────────────────────────────

export interface ControlDoc {
    id: string;
    orgId: string;

    name: string;
    obligationId: string;

    status: 'pass' | 'fail' | 'partial' | 'not-tested';
    lastChecked?: string;

    evidenceIds: string[];
}

// ─── 5. EVIDENCE (Sub-collection) ─────────────────────────────────────────

export interface EvidenceDoc {
    id: string;
    controlId: string;
    orgId: string;

    type: 'url' | 'file' | 'screenshot';
    location: string;

    status: 'valid' | 'expired' | 'missing';
    collectedAt: string;
}

// ─── 6. SECURITY RULES TEMPLATE ──────────────────────────────────────────

export const FIREBASE_RULES = `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Organizations
    match /organizations/{orgId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        resource.data.ownerId == request.auth.uid;
      
      // Sub-collections
      match /businessProfile/{doc} {
        allow read, write: if request.auth != null;
      }
      
      match /scans/{doc} {
        allow read, write: if request.auth != null;
      }
      
      match /controls/{doc} {
        allow read, write: if request.auth != null;
      }
      
      match /evidence/{doc} {
        allow read, write: if request.auth != null;
      }
    }
  }
}
`;