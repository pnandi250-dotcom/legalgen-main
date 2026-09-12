// src/lib/legalgen/questions.ts
import type { DocumentType, QuestionGroup } from './types';

export function getQuestions(type: DocumentType): QuestionGroup[] {
  switch (type) {
    
    // ─── EXISTING CORE POLICIES ───────────────────────────────────────────
    case 'privacy-policy':
      return [
        {
          id: 'group_basics',
          title: 'Business Details',
          description: 'Basic information about your company for the legal header.',
          questions: [
            { id: 'businessName', label: 'Business / Company Name', type: 'text', placeholder: 'e.g. Acme Corp Pvt Ltd', required: true },
            { id: 'websiteUrl', label: 'Website URL', type: 'url', placeholder: 'https://...', required: true },
            { id: 'email', label: 'Privacy Contact Email', type: 'email', placeholder: 'privacy@yourdomain.com', required: true },
            {
              id: 'industry',
              label: 'Industry',
              type: 'select',
              options: [
                { value: 'ecommerce', label: 'E-commerce / Retail' },
                { value: 'saas', label: 'SaaS / Software' },
                { value: 'fintech', label: 'FinTech / Finance' },
                { value: 'general', label: 'General / Other' }
              ]
            }
          ]
        },
        {
          id: 'group_data',
          title: 'Data Collection',
          description: 'What kind of data are you collecting from your users?',
          questions: [
            {
              id: 'dataTypes',
              label: 'What personal data do you collect?',
              type: 'multiselect',
              options: [
                { value: 'name', label: 'Full Name' },
                { value: 'email', label: 'Email Address' },
                { value: 'phone', label: 'Phone Number' },
                { value: 'address', label: 'Postal Address' },
                { value: 'bankDetails', label: 'Bank/Payment Details' },
                { value: 'location', label: 'Location Data' },
                { value: 'deviceInfo', label: 'Device/Browser Data' }
              ]
            },
            { id: 'hasAccounts', label: 'Users can create accounts on my website', type: 'checkbox' },
            { id: 'sellsProducts', label: 'We sell products or services and collect payment details', type: 'checkbox' },
            { id: 'sharesData', label: 'We share data with third-party services (analytics, hosting, payment processors)', type: 'checkbox' },
            {
              id: 'thirdParties',
              label: 'Which third-party services do you use?',
              type: 'multiselect',
              options: [
                { value: 'googleAnalytics', label: 'Google Analytics' },
                { value: 'razorpay', label: 'Razorpay' },
                { value: 'stripe', label: 'Stripe' },
                { value: 'other', label: 'Other' }
              ]
            },
            { id: 'storesIpAddress', label: 'We store user IP addresses for security/analytics', type: 'checkbox' },
            { id: 'childrenUnder18', label: 'We collect data from users under 18', type: 'checkbox', warning: 'Under DPDP Act 2023, you must obtain verifiable parental consent.' }
          ]
        },
        {
          id: 'group_security',
          title: 'Security & Compliance',
          description: 'DPDP Act and IT Act security declarations.',
          questions: [
            { id: 'usesCookies', label: 'My website uses cookies', type: 'checkbox' },
            {
              id: 'dataSecurityMeasures',
              label: 'What security measures do you have in place?',
              type: 'multiselect',
              options: [
                { value: 'ssl', label: 'SSL/TLS Encryption' },
                { value: 'encrypted', label: 'Encrypted Data Storage' },
                { value: 'accessControls', label: 'Role-Based Access Controls' },
                { value: 'twoFactor', label: 'Two-Factor Authentication' }
              ],
              tooltip: 'Required under Section 43A of the IT Act for reasonable security practices.'
            },
            { id: 'dataBreachProcess', label: 'We have a data breach notification process', type: 'checkbox' },
            { id: 'isDataFiduciary', label: 'We classify as a Significant Data Fiduciary', type: 'checkbox' }
          ]
        },
        {
          id: 'group_grievance',
          title: 'Grievance Officer',
          description: 'Mandatory under IT Rules 2021 for Indian businesses.',
          questions: [
            { id: 'grievanceOfficerName', label: 'Grievance Officer Name', type: 'text', required: true },
            { id: 'grievanceOfficerEmail', label: 'Grievance Officer Email', type: 'email', required: true }
          ]
        }
      ];
 
      case 'terms-of-service':
      return [
        {
          id: 'group_tos_basics',
          title: 'Platform Rules',
          description: 'Define the governing laws and basic rules of your platform.',
          questions: [
            { id: 'businessName', label: 'Business / Company Name', type: 'text', required: true },
            { id: 'websiteUrl', label: 'Website URL', type: 'url', required: true },
            { id: 'email', label: 'Support Email', type: 'email', required: true },
            { id: 'governingState', label: 'Governing State for Disputes', type: 'text', placeholder: 'e.g. Maharashtra', required: true, tooltip: 'Under the Indian Contract Act, which state courts have jurisdiction over disputes?' },
            {
              id: 'disputeResolution',
              label: 'Preferred Dispute Resolution Method',
              type: 'select',
              options: [
                { value: 'arbitration', label: 'Arbitration' },
                { value: 'courts', label: 'Regular Courts' }
              ],
              required: true
            }
          ]
        },
        {
          id: 'group_tos_business',
          title: 'Business Model',
          description: 'What does your platform actually do?',
          questions: [
            { id: 'hasAccounts', label: 'Users can create accounts on my platform', type: 'checkbox' },
            { id: 'sellsProducts', label: 'We sell products or services directly through the platform', type: 'checkbox' }
          ]
        },
        {
          id: 'group_tos_users',
          title: 'User Behavior & Content',
          description: 'Rules for what users can and cannot do.',
          questions: [
            { id: 'userGeneratedContent', label: 'Users can post comments, reviews, or upload content', type: 'checkbox', warning: 'This makes you an Intermediary under IT Rules 2021, with specific safe-harbour obligations.' },
            { id: 'hasSubscriptions', label: 'We offer paid subscriptions or SaaS tiers', type: 'checkbox' },
            { id: 'canTerminateAccounts', label: 'We reserve the right to ban users without notice', type: 'checkbox' }
          ]
        }
      ];
    case 'refund-policy':
      return [
        {
          id: 'group_refund_basics',
          title: 'Refund Terms',
          description: 'Comply with the Consumer Protection (E-Commerce) Rules, 2020.',
          questions: [
            { id: 'businessName', label: 'Business / Company Name', type: 'text', required: true },
            { id: 'contactEmail', label: 'Support Email', type: 'email', required: true },
            {
              id: 'refundPeriod',
              label: 'Refund Window',
              type: 'select',
              options: [
                { value: 'No refunds (all sales final)', label: 'No Refunds (All Sales Final)' },
                { value: '7 days', label: '7 Days' },
                { value: '14 days', label: '14 Days' },
                { value: '30 days', label: '30 Days' }
              ]
            }
          ]
        },
        {
          id: 'group_refund_business',
          title: 'What You Sell',
          description: 'This determines which refund rules apply.',
          questions: [
            { id: 'sellsProducts', label: 'We sell physical products', type: 'checkbox' },
            { id: 'sellsServices', label: 'We provide services (consulting, SaaS, etc.)', type: 'checkbox' },
            { id: 'offersStoreCredit', label: 'We offer store credit/wallet as a refund option', type: 'checkbox' }
          ]
        },
        {
          id: 'group_refund_conditions',
          title: 'Return Conditions',
          description: 'Specify when a return is rejected.',
          questions: [
            { id: 'requiresOriginalPackaging', label: 'Item must be in original, unopened packaging', type: 'checkbox' },
            { id: 'customerPaysShipping', label: 'Customer is responsible for return shipping costs', type: 'checkbox' },
            { id: 'digitalProducts', label: 'These are digital products/software (no physical returns)', type: 'checkbox' }
          ]
        }
      ];

    case 'cookie-policy':
      return [
        {
          id: 'group_cookie_basics',
          title: 'Cookie Information',
          description: 'Details about how your site tracks users.',
          questions: [
            { id: 'businessName', label: 'Business / Company Name', type: 'text', required: true },
            { id: 'websiteUrl', label: 'Website URL', type: 'url', required: true },
            { id: 'email', label: 'Privacy Email', type: 'email', required: true },
            {
              id: 'cookieTypes',
              label: 'What types of cookies do you use?',
              type: 'multiselect',
              options: [
                { value: 'essential', label: 'Essential / Strictly Necessary' },
                { value: 'analytics', label: 'Analytics & Performance (e.g., Google Analytics)' },
                { value: 'marketing', label: 'Marketing & Targeting (e.g., Meta Pixel)' },
                { value: 'functional', label: 'Functional (Preferences, Language)' }
              ],
              required: true
            },
            {
              id: 'thirdParties',
              label: 'Which third-party tools use cookies on your site?',
              type: 'multiselect',
              options: [
                { value: 'googleAnalytics', label: 'Google Analytics' },
                { value: 'facebookPixel', label: 'Meta (Facebook) Pixel' },
                { value: 'razorpay', label: 'Razorpay' },
                { value: 'stripe', label: 'Stripe' },
                { value: 'hotjar', label: 'Hotjar' }
              ]
            }
          ]
        }
      ];

    case 'shipping-policy':
      return [
        {
          id: 'group_shipping_basics',
          title: 'Shipping Operations',
          description: 'Define your delivery timelines under Consumer Protection laws.',
          questions: [
            { id: 'businessName', label: 'Business / Company Name', type: 'text', required: true },
            { id: 'email', label: 'Support Email', type: 'email', required: true },
            { id: 'phone', label: 'Support Phone Number', type: 'text' },
            { id: 'processingTime', label: 'Order Processing Time (e.g., 1-3 business days)', type: 'text', required: true },
            { id: 'domesticDeliveryTime', label: 'Domestic Delivery Time (e.g., 3-7 business days)', type: 'text', required: true },
            { id: 'offersInternationalShipping', label: 'Do you offer international shipping?', type: 'checkbox' },
            { id: 'internationalDeliveryTime', label: 'International Delivery Time (e.g., 10-15 business days)', type: 'text' }
          ]
        }
      ];

    case 'disclaimer':
      return [
        {
          id: 'group_disclaimer',
          title: 'Disclaimer Details',
          description: 'Identify the types of information you provide.',
          questions: [
            { id: 'businessName', label: 'Business Name', type: 'text', required: true },
            { id: 'websiteUrl', label: 'Website URL', type: 'url', required: true },
            { id: 'email', label: 'Contact Email', type: 'email', required: true },
            {
              id: 'industry',
              label: 'What type of information do you provide?',
              type: 'select',
              options: [
                { value: 'general', label: 'General / Other' },
                { value: 'medical', label: 'Medical / Health' },
                { value: 'fintech', label: 'Financial / Investment' },
                { value: 'legal', label: 'Legal' }
              ]
            },
            { id: 'hasAffiliateLinks', label: 'Do you use affiliate links (e.g., Amazon Affiliates)?', type: 'checkbox' },
            { id: 'hasTestimonials', label: 'Do you display customer testimonials or reviews?', type: 'checkbox' }
          ]
        }
      ];

    case 'cancellation-policy':
      return [
        {
          id: 'group_cancel',
          title: 'Cancellation Terms',
          description: 'Rules for ending subscriptions or orders.',
          questions: [
            { id: 'businessName', label: 'Business Name', type: 'text', required: true },
            { id: 'contactEmail', label: 'Support Email', type: 'email', required: true },
            { id: 'noticePeriod', label: 'Required Notice Period (e.g., 24 hours, 7 days)', type: 'text', required: true }
          ]
        }
      ];

    case 'return-policy':
      return [
        {
          id: 'group_return_basics',
          title: 'Return Terms',
          description: 'Rules for returning physical goods.',
          questions: [
            { id: 'businessName', label: 'Business Name', type: 'text', required: true },
            { id: 'email', label: 'Support Email', type: 'email', required: true },
            { id: 'phone', label: 'Support Phone Number', type: 'text' },
            { id: 'address', label: 'Business Address', type: 'textarea' },
            {
              id: 'refundPeriod',
              label: 'Return Window',
              type: 'select',
              options: [
                { value: 'No returns (all sales final)', label: 'No Returns (All Sales Final)' },
                { value: '7 days', label: '7 Days' },
                { value: '14 days', label: '14 Days' },
                { value: '30 days', label: '30 Days' }
              ],
              required: true
            },
            { id: 'cancellationWindow', label: 'Order Cancellation Window (e.g., 24 hours)', type: 'text', required: true }
          ]
        },
        {
          id: 'group_return_business',
          title: 'What You Sell',
          description: 'This determines which return rules apply.',
          questions: [
            { id: 'sellsProducts', label: 'We sell physical products', type: 'checkbox' },
            { id: 'digitalProducts', label: 'We sell digital products/software', type: 'checkbox' },
            { id: 'sellsServices', label: 'We provide services (consulting, SaaS, etc.)', type: 'checkbox' },
            { id: 'offersStoreCredit', label: 'We offer store credit/wallet as a refund option', type: 'checkbox' }
          ]
        }
      ];

    // ─── NEW ADVANCED POLICIES (EULA, AUP, SLA, ETC.) ─────────────────────

    case 'end-user-license-agreement':
      return [
        {
          id: 'group_eula',
          title: 'Software Details',
          description: 'Information about the application being licensed.',
          questions: [
            { id: 'businessName', label: 'Company / Developer Name', type: 'text', required: true },
            { id: 'websiteUrl', label: 'Website URL', type: 'url', required: true },
            { id: 'email', label: 'Support Email', type: 'email', required: true },
            { id: 'governingState', label: 'Governing State (Jurisdiction)', type: 'text', placeholder: 'e.g. Delhi', required: true },
            { id: 'softwareName', label: 'Software / App Name', type: 'text', placeholder: 'e.g. LegalGen Pro', required: true },
            { id: 'isSaaS', label: 'Is this a Cloud-based SaaS application?', type: 'checkbox' },
            { id: 'hasMobileApp', label: 'Do you have a mobile app on the App Store / Play Store?', type: 'checkbox' },
            { id: 'isDownloadable', label: 'Is this downloadable desktop software?', type: 'checkbox' }
          ]
        }
      ];

    case 'acceptable-use-policy':
      return [
        {
          id: 'group_aup_basics',
          title: 'AUP Information',
          description: 'Set the ground rules for your platform users.',
          questions: [
            { id: 'businessName', label: 'Business Name', type: 'text', required: true },
            { id: 'websiteUrl', label: 'Website URL', type: 'url', required: true },
            { id: 'email', label: 'Abuse/Contact Email', type: 'email', required: true },
            { id: 'userGeneratedContent', label: 'Can users post or upload their own content?', type: 'checkbox', warning: 'If yes, you are acting as an Intermediary under IT Rules 2021.' },
            { id: 'isSaaS', label: 'Do you provide software-as-a-service (SaaS)?', type: 'checkbox' }
          ]
        }
      ];

    case 'service-level-agreement':
      return [
        {
          id: 'group_sla_basics',
          title: 'SLA Terms',
          description: 'Your uptime and support guarantees.',
          questions: [
            { id: 'businessName', label: 'Business Name', type: 'text', required: true },
            { id: 'websiteUrl', label: 'Website URL', type: 'url', required: true },
            { id: 'email', label: 'Support Email', type: 'email', required: true },
            { id: 'governingState', label: 'Governing State (Jurisdiction)', type: 'text', placeholder: 'e.g. Karnataka', required: true },
            {
              id: 'uptimeTarget',
              label: 'Uptime Guarantee',
              type: 'select',
              options: [
                { value: '99.0%', label: '99.0% (approx. 7 hours downtime/month)' },
                { value: '99.9%', label: '99.9% (approx. 43 mins downtime/month)' },
                { value: '99.99%', label: '99.99% (approx. 4 mins downtime/month)' }
              ],
              required: true
            },
            {
              id: 'responseTime',
              label: 'Standard Support Response Time',
              type: 'select',
              options: [
                { value: '1 hour', label: '1 hour (Critical)' },
                { value: '24 hours', label: '24 hours (Standard)' },
                { value: '48 hours', label: '48 hours (Basic)' }
              ],
              required: true
            }
          ]
        }
      ];

    case 'data-processing-agreement':
      return [
        {
          id: 'group_dpa_basics',
          title: 'DPA Information',
          description: 'Details for processing partner data securely.',
          questions: [
            { id: 'businessName', label: 'Processor (Your Business Name)', type: 'text', required: true },
            { id: 'websiteUrl', label: 'Website URL', type: 'url', required: true },
            { id: 'email', label: 'Data Protection Officer Email', type: 'email', required: true },
            { id: 'governingState', label: 'Governing State (Jurisdiction)', type: 'text', placeholder: 'e.g. Maharashtra', required: true }
          ]
        }
      ];

    case 'dmca-policy':
      return [
        {
          id: 'group_dmca',
          title: 'Copyright Operations',
          description: 'Details for processing copyright takedowns.',
          questions: [
            { id: 'businessName', label: 'Platform / Business Name', type: 'text', required: true },
            { id: 'websiteUrl', label: 'Website URL', type: 'url', required: true },
            { id: 'email', label: 'Designated Copyright Email', type: 'email', required: true, tooltip: 'Where should takedown notices be sent?' },
            { id: 'governingState', label: 'Governing State (Jurisdiction)', type: 'text', placeholder: 'e.g. Delhi', required: true },
            { id: 'address', label: 'Physical Address of Grievance Officer', type: 'textarea', placeholder: 'Required for formal legal notices...', required: true }
          ]
        }
      ];

    case 'content-moderation-policy':
      return [
        {
          id: 'group_mod',
          title: 'Moderation Team',
          description: 'IT Rules 2021 Grievance Details.',
          questions: [
            { id: 'businessName', label: 'Platform / Business Name', type: 'text', required: true },
            { id: 'websiteUrl', label: 'Website URL', type: 'url', required: true },
            { id: 'email', label: 'Grievance Officer Email', type: 'email', required: true },
            { id: 'usesAutomatedModeration', label: 'Do you use AI or automated filters to block bad content?', type: 'checkbox' },
            { id: 'hasAppealsProcess', label: 'Can users appeal a ban or content takedown?', type: 'checkbox' }
          ]
        }
      ];

    case 'community-guidelines':
      return [
        {
          id: 'group_guidelines',
          title: 'Community Standards',
          description: 'Rules for user interaction.',
          questions: [
            { id: 'businessName', label: 'Community / Business Name', type: 'text', required: true },
            { id: 'websiteUrl', label: 'Website URL', type: 'url', required: true },
            { id: 'email', label: 'Support / Report Email', type: 'email', required: true },
            { id: 'hasMinors', label: 'Does your platform allow users under the age of 18?', type: 'checkbox', warning: 'You must comply strictly with the POCSO Act if minors use the platform.' }
          ]
        }
      ];

    case 'gdpr-compliance':
      return [
        {
          id: 'group_gdpr',
          title: 'Data Protection Officer',
          description: 'EU compliance contact information.',
          questions: [
            { id: 'businessName', label: 'Business Name', type: 'text', required: true },
            { id: 'websiteUrl', label: 'Website URL', type: 'url', required: true },
            { id: 'email', label: 'DPO / Privacy Contact Email', type: 'email', required: true }
          ]
        }
      ];

    // Fallback for documents not built yet
    default:
      return [
        {
          id: 'placeholder',
          title: 'Coming Soon',
          description: 'This document type is currently being reviewed by our legal team and will be available soon.',
          questions: []
        }
      ];
  }
}