"use client";
import '@/lib/polyfills';
import React, { useState, useCallback, useRef, useMemo, useEffect, forwardRef } from "react";
import html2pdf from 'html2pdf.js';
import { Code2 } from "lucide-react";
import { saveDocumentToDb } from "@/lib/firebase/firestore";
import { trackGeneration, trackAudit } from "@/lib/firebase/analytics";
import { useAuth } from "@/lib/firebase/AuthContext";
import { JurisdictionSelector } from '@/components/ui/JurisdictionSelector';
import {
  Shield, FileText, RefreshCcw, Cookie, AlertTriangle,
  Truck, ArrowRight, ArrowLeft, Copy, Check, Download,
  CheckCircle2, Clock, Zap, Globe, ChevronRight,
  Scale, Building2, Code, Eye, Lightbulb,
  Search, XCircle, Sun, Moon, Loader2, AlertCircle, ExternalLink,
  Lock, ShieldCheck, Star, Quote, Users, FileCheck, Award,
  ChevronDown, Calendar, Heart, MessageCircle, BadgeCheck,
  ArrowUpRight, Sparkles, Fingerprint, Server, Cpu, Gavel, HelpCircle,
  Ban, Handshake, ScrollText, AlertOctagon, Megaphone, FileBadge, Database, FileX, Gauge, ShieldAlert,Info, TrendingUp, Phone, Hotel, ShoppingBag, UtensilsCrossed, Stethoscope, GraduationCap, Landmark, Store, Briefcase, Smartphone, Film, Building,
  Mail
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { DocumentType, FormData, QuestionGroup } from "@/lib/legalgen/types";
import { getQuestions } from "@/lib/legalgen/questions";
import { analyzeWebsiteText, FEATURE_LABELS, featuresToFormData, type WebsiteAnalysisResult } from "@/lib/legal-engine/website-analyzer";
import { generatePrivacyPolicy } from "@/lib/legalgen/privacy-policy";
import { generateMultiJurisdictionPrivacyPolicy } from "@/lib/legalgen/privacy-policy-multi-jurisdiction";
import type { Jurisdiction } from "@/lib/legalgen/types";
import { generateTermsOfService } from "@/lib/legalgen/terms-of-service";
import { generateRefundPolicy } from "@/lib/legalgen/refund-policy";
import { generateCookiePolicy } from "@/lib/legalgen/cookie-policy";
import { generateDisclaimer } from "@/lib/legalgen/disclaimer";
import { generateShippingPolicy } from "@/lib/legalgen/shipping-policy";
import { generateCancellationPolicy } from "@/lib/legalgen/cancellation-policy";
import { generateReturnPolicy } from "@/lib/legalgen/return-policy";
import { generateServiceLevelAgreement } from "@/lib/legalgen/service-level-agreement";
import { generateCommunityGuidelines } from "@/lib/legalgen/community-guidelines";
import { generateGDPRCompliance } from "@/lib/legalgen/gdpr-compliance";
import { generateDataProcessingAgreement } from "@/lib/legalgen/data-processing-agreement";
import { generateDmcaPolicy } from "@/lib/legalgen/dmca-policy";
import { generateContentModerationPolicy } from "@/lib/legalgen/content-moderation-policy";
import { generateEula } from "@/lib/legalgen/eula";
import { generateAup } from "@/lib/legalgen/aup";

/* ─── SCROLL REVEAL HOOK (with timeout fallback) ─── */
function useScrollReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -60px 0px' }
    );
    
    const elements = document.querySelectorAll('.scroll-reveal, .scroll-reveal-left, .scroll-reveal-scale, .stagger-children');
    elements.forEach((el) => {
      observer.observe(el);
    });
    
    // FALLBACK: Make all elements visible after 2 seconds if IntersectionObserver didn't fire
    const fallbackTimeout = setTimeout(() => {
      elements.forEach((el) => {
        if (!el.classList.contains('visible')) {
          el.classList.add('visible');
        }
      });
    }, 2000);
    
    return () => {
      observer.disconnect();
      clearTimeout(fallbackTimeout);
    };
  }, []);
}

/* ─── DARK MODE ─── */
function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  useEffect(() => {
    const stored = localStorage.getItem('legalgen-theme');
    if (stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setTheme('dark');
      document.documentElement.classList.add('dark');
    }
  }, []);
  const toggle = useCallback(() => {
    setTheme(prev => {
      const next = prev === 'light' ? 'dark' : 'light';
      if (next === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      localStorage.setItem('legalgen-theme', next);
      return next;
    });
  }, []);
  return { theme, toggle };
}

/* ─── COMPLIANCE CHECKER TYPES ─── */
interface ComplianceResult {
  page: string;
  found: boolean;
  url: string | null;
  source: string;
  severity: 'critical' | 'important' | 'recommended';
  description: string;
  generateType: string;
}

interface ComplianceResponse {
  domain: string;
  url: string;
  score: number;
  totalCritical: number;
  foundCritical: number;
  totalImportant: number;
  foundImportant: number;
  totalRecommended: number;
  foundRecommended: number;
  results: ComplianceResult[];
  error?: string;
}

/* ─── COMPLIANCE KEYWORD MAP (covers all 16 doc types) ─── */
const COMPLIANCE_KEYWORDS: Record<string, { label: string; keywords: string[]; description: string }> = {
  'privacy-policy': { label: 'Privacy Policy', keywords: ['privacy policy', 'privacy notice', 'data protection'], description: 'Mandatory under DPDP Act 2023 for data collection.' },
  'terms-of-service': { label: 'Terms of Service', keywords: ['terms of service', 'terms and conditions', 'terms of use'], description: 'Required to limit business liability and govern usage.' },
  'refund-policy': { label: 'Refund Policy', keywords: ['refund policy', 'refund and cancellation'], description: 'Required by Consumer Protection (E-Commerce) Rules 2020.' },
  'cancellation-policy': { label: 'Cancellation Policy', keywords: ['cancellation policy', 'booking cancellation'], description: 'Critical for bookings, reservations, and subscription businesses.' },
  'return-policy': { label: 'Return Policy', keywords: ['return policy', 'returns and exchanges'], description: 'Required for physical goods retailers under Consumer Protection Rules.' },
  'cookie-policy': { label: 'Cookie Policy', keywords: ['cookie policy', 'manage cookies'], description: 'Standard practice for tracking and analytics transparency.' },
  'shipping-policy': { label: 'Shipping Policy', keywords: ['shipping policy', 'delivery policy'], description: 'Required for businesses shipping physical goods.' },
  'disclaimer': { label: 'Disclaimer', keywords: ['disclaimer'], description: 'Limits liability for informational or professional content.' },
  'service-level-agreement': { label: 'Service Level Agreement', keywords: ['service level agreement', 'sla'], description: 'Standard for SaaS and hosted service providers.' },
  'end-user-license-agreement': { label: 'EULA', keywords: ['end user license', 'eula'], description: 'Required for licensed software products.' },
  'acceptable-use-policy': { label: 'Acceptable Use Policy', keywords: ['acceptable use policy', 'aup'], description: 'Sets platform usage rules and prohibited conduct.' },
  'community-guidelines': { label: 'Community Guidelines', keywords: ['community guidelines', 'community standards'], description: 'Required for platforms with user interaction.' },
  'data-processing-agreement': { label: 'Data Processing Agreement', keywords: ['data processing agreement', 'dpa'], description: 'Required for B2B data processing relationships.' },
  'dmca-policy': { label: 'DMCA & Copyright Policy', keywords: ['dmca', 'copyright policy', 'copyright infringement'], description: 'Required for platforms hosting user-uploaded content.' },
  'content-moderation-policy': { label: 'Content Moderation Policy', keywords: ['content moderation'], description: 'Required under IT Rules 2021 for platforms with UGC.' },
  'gdpr-compliance': { label: 'GDPR Compliance Statement', keywords: ['gdpr', 'general data protection regulation'], description: 'Required if you have EU/UK users.' },
};

function buildComplianceChecks(pageText: string): ComplianceResult[] {
  return Object.entries(COMPLIANCE_KEYWORDS).map(([docType, entry]) => {
    const isCritical = ['privacy-policy', 'terms-of-service', 'cookie-policy'].includes(docType);
    const found = entry.keywords.some((kw) => pageText.toLowerCase().includes(kw));
    return {
      page: entry.label,
      found,
      url: found ? 'detected' : null,
      source: found ? 'Detected in page structure' : '',
      severity: isCritical ? 'critical' as const : 'important' as const,
      description: entry.description,
      generateType: docType,
    };
  });
}
/* ─── DOCUMENT CONFIG ─── */
const DOC_CONFIGS: {
  type: DocumentType;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  badge: string;
  category: string
  laws: string[];
}[] = [
    // ── Core Compliance ──
    {
      type: "privacy-policy",
      title: "Privacy Policy",
      description: "IT Act 2000, DPDP Act 2023, IT Rules 2021 compliant. Data collection, user rights, data principal requests, and grievance redressal.",
      icon: <Shield className="w-6 h-6" />,
      color: "text-emerald-700",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-200",
      badge: "Most Popular",
      category: "Core",
      laws: ["IT Act 2000", "DPDP Act 2023", "IT Rules 2021"],
    },
    {
      type: "terms-of-service",
      title: "Terms of Service",
      description: "User accounts, IP rights, liability limits, termination, governing law, and arbitration under Indian law.",
      icon: <FileText className="w-6 h-6" />,
      color: "text-slate-700",
      bgColor: "bg-slate-50",
      borderColor: "border-slate-200",
      badge: "Essential",
      category: "Core",
      laws: ["IT Act 2000", "Arbitration Act 1996", "Indian Contract Act"],
    },
    {
      type: "refund-policy",
      title: "Refund Policy",
      description: "Consumer Protection Act 2019 compliant. Refund timelines, refund methods, partial/full refunds, and chargeback handling.",
      icon: <RefreshCcw className="w-6 h-6" />,
      color: "text-orange-700",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
      badge: "E-commerce",
      category: "Core",
      laws: ["Consumer Protection Act 2019", "E-Commerce Rules 2020"],
    },
    {
      type: "cookie-policy",
      title: "Cookie Policy",
      description: "Cookie types, consent management, third-party disclosures, and user control over tracking preferences.",
      icon: <Cookie className="w-6 h-6" />,
      color: "text-amber-700",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-200",
      badge: "GDPR Ready",
      category: "Core",
      laws: ["IT Act 2000", "IT Rules 2021", "DPDP Act 2023"],
    },
    {
      type: "disclaimer",
      title: "Disclaimer",
      description: "Medical, legal, financial disclaimers, affiliate disclosures, and limitation of liability clauses.",
      icon: <AlertTriangle className="w-6 h-6" />,
      color: "text-red-700",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      badge: "Protection",
      category: "Core",
      laws: ["IT Act 2000", "Consumer Protection Act 2019"],
    },
    {
      type: "shipping-policy",
      title: "Shipping Policy",
      description: "Delivery timelines, shipping costs, COD availability, lost shipment policies, and tracking info.",
      icon: <Truck className="w-6 h-6" />,
      color: "text-blue-700",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      badge: "Sellers",
      category: "Core",
      laws: ["Consumer Protection Act 2019", "E-Commerce Rules 2020"],
    },
    // ── Business Operations ──
    {
      type: "acceptable-use-policy",
      title: "Acceptable Use Policy",
      description: "Prohibited activities, content rules, system usage limits, user responsibilities, and enforcement actions.",
      icon: <Ban className="w-6 h-6" />,
      color: "text-violet-700",
      bgColor: "bg-violet-50",
      borderColor: "border-violet-200",
      badge: "Platforms",
      category: "Operations",
      laws: ["IT Act 2000 (Sec 43,66,67)", "BNS 2023", "Consumer Protection Act"],
    },
    {
      type: "cancellation-policy",
      title: "Cancellation Policy",
      description: "Cancellation windows, non-cancellable items, cancellation charges, refund processing, and subscription termination.",
      icon: <FileX className="w-6 h-6" />,
      color: "text-rose-700",
      bgColor: "bg-rose-50",
      borderColor: "border-rose-200",
      badge: "E-commerce",
      category: "Operations",
      laws: ["Consumer Protection Act 2019", "E-Commerce Rules 2020", "RBI Payment Aggregators"],
    },
    {
      type: "return-policy",
      title: "Return Policy",
      description: "Return eligibility, return process, product inspection, exchange rules, and damaged/defective item returns.",
      icon: <ArrowLeft className="w-6 h-6" />,
      color: "text-purple-700",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
      badge: "E-commerce",
      category: "Operations",
      laws: ["Consumer Protection Act 2019", "Sale of Goods Act 1930", "E-Commerce Rules 2020"],
    },
    {
      type: "service-level-agreement",
      title: "Service Level Agreement",
      description: "Uptime guarantees, response/resolution times, maintenance windows, service credits, and performance metrics.",
      icon: <Gauge className="w-6 h-6" />,
      color: "text-cyan-700",
      bgColor: "bg-cyan-50",
      borderColor: "border-cyan-200",
      badge: "SaaS",
      category: "Operations",
      laws: ["Indian Contract Act 1872", "Arbitration Act 1996", "CERT-In 2022"],
    },
    // ── User Agreements ──
    {
      type: "end-user-license-agreement",
      title: "End User License Agreement",
      description: "License grant, IP ownership, restrictions, warranty disclaimer, liability limits, and governing law.",
      icon: <ScrollText className="w-6 h-6" />,
      color: "text-indigo-700",
      bgColor: "bg-indigo-50",
      borderColor: "border-indigo-200",
      badge: "Software",
      category: "Agreements",
      laws: ["Copyright Act 1957", "IT Act 2000", "Indian Contract Act"],
    },
    {
      type: "community-guidelines",
      title: "Community Guidelines",
      description: "Community values, content standards, user behavior rules, moderation approach, and children's safety.",
      icon: <Megaphone className="w-6 h-6" />,
      color: "text-teal-700",
      bgColor: "bg-teal-50",
      borderColor: "border-teal-200",
      badge: "Community",
      category: "Agreements",
      laws: ["IT Act 2000 (Sec 67,79)", "BNS 2023", "IT Rules 2021"],
    },
    // ── Data & Compliance ──
    {
      type: "gdpr-compliance",
      title: "GDPR Compliance Statement",
      description: "For Indian businesses with EU users. Data subject rights, DPIA, breach notification, and international transfers.",
      icon: <ShieldCheck className="w-6 h-6" />,
      color: "text-blue-700",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      badge: "International",
      category: "Data",
      laws: ["GDPR (EU) 2016/679", "DPDP Act 2023", "IT Act 2000"],
    },
    {
      type: "data-processing-agreement",
      title: "Data Processing Agreement",
      description: "Controller-processor roles, security measures, breach notification, audit rights, and data deletion.",
      icon: <Database className="w-6 h-6" />,
      color: "text-sky-700",
      bgColor: "bg-sky-50",
      borderColor: "border-sky-200",
      badge: "B2B",
      category: "Data",
      laws: ["DPDP Act 2023", "IT Act 2000", "CERT-In 2022"],
    },
    // ── Content & IP ──
    {
      type: "dmca-policy",
      title: "DMCA & Copyright Policy",
      description: "Takedown notices, counter-notices, repeat infringer policy, safe harbour (Sec 79 IT Act), and fair dealing.",
      icon: <AlertOctagon className="w-6 h-6" />,
      color: "text-fuchsia-700",
      bgColor: "bg-fuchsia-50",
      borderColor: "border-fuchsia-200",
      badge: "Content",
      category: "IP",
      laws: ["Copyright Act 1957", "IT Act 2000 (Sec 79)", "IT Rules 2021"],
    },

    {
      type: "content-moderation-policy",
      title: "Content Moderation Policy",
      description: "Content categories, moderation methods, enforcement actions, appeals, transparency, and grievance officer.",
      icon: <ShieldAlert className="w-6 h-6" />,
      color: "text-lime-700",
      bgColor: "bg-lime-50",
      borderColor: "border-lime-200",
      badge: "Platforms",
      category: "IP",
      laws: ["IT Act 2000 (Sec 67,69,79)", "IT Rules 2021", "BNS 2023"],
    },
  ];

/* ─── BUSINESS TYPE MAPPING ─── */
interface BusinessType {
  id: string;
  label: string;
  icon: React.ReactNode;
  docs: DocumentType[];
}

const BUSINESS_TYPES: BusinessType[] = [
  {
    id: "saas",
    label: "SaaS / Software",
    icon: <Smartphone className="w-5 h-5" />,
    docs: ["privacy-policy", "terms-of-service", "cookie-policy", "disclaimer", "acceptable-use-policy", "service-level-agreement", "end-user-license-agreement", "gdpr-compliance", "data-processing-agreement"],
  },
  {
    id: "ecommerce",
    label: "E-Commerce / D2C",
    icon: <ShoppingBag className="w-5 h-5" />,
    docs: ["privacy-policy", "terms-of-service", "refund-policy", "cookie-policy", "shipping-policy", "cancellation-policy", "return-policy", "disclaimer"],
  },
  {
    id: "hotel",
    label: "Hotel / Hospitality",
    icon: <Hotel className="w-5 h-5" />,
    docs: ["privacy-policy", "terms-of-service", "refund-policy", "cancellation-policy", "cookie-policy", "disclaimer"],
  },
  {
    id: "restaurant",
    label: "Restaurant / Food",
    icon: <UtensilsCrossed className="w-5 h-5" />,
    docs: ["privacy-policy", "terms-of-service", "refund-policy", "cancellation-policy", "cookie-policy", "disclaimer"],
  },
  {
    id: "healthcare",
    label: "Healthcare / Pharma",
    icon: <Stethoscope className="w-5 h-5" />,
    docs: ["privacy-policy", "terms-of-service", "disclaimer", "cookie-policy", "gdpr-compliance", "data-processing-agreement"],
  },
  {
    id: "education",
    label: "Education / EdTech",
    icon: <GraduationCap className="w-5 h-5" />,
    docs: ["privacy-policy", "terms-of-service", "cookie-policy", "disclaimer", "refund-policy", "cancellation-policy", "community-guidelines", "acceptable-use-policy"],
  },
  {
    id: "fintech",
    label: "Fintech / Finance",
    icon: <Landmark className="w-5 h-5" />,
    docs: ["privacy-policy", "terms-of-service", "disclaimer", "cookie-policy", "data-processing-agreement", "gdpr-compliance"],
  },
  {
    id: "realestate",
    label: "Real Estate",
    icon: <Building className="w-5 h-5" />,
    docs: ["privacy-policy", "terms-of-service", "disclaimer", "cancellation-policy", "refund-policy", "cookie-policy"],
  },
  {
    id: "content",
    label: "Content / Media",
    icon: <Film className="w-5 h-5" />,
    docs: ["privacy-policy", "terms-of-service", "cookie-policy", "disclaimer", "dmca-policy", "content-moderation-policy", "community-guidelines"],
  },
  {
    id: "marketplace",
    label: "Marketplace / Platform",
    icon: <Store className="w-5 h-5" />,
    docs: ["privacy-policy", "terms-of-service", "cookie-policy", "disclaimer", "refund-policy", "shipping-policy", "return-policy", "cancellation-policy", "acceptable-use-policy", "content-moderation-policy", "community-guidelines", "dmca-policy"],
  },
  {
    id: "agency",
    label: "Agency / Freelancer",
    icon: <Briefcase className="w-5 h-5" />,
    docs: ["privacy-policy", "terms-of-service", "cookie-policy", "disclaimer", "service-level-agreement"],
  },
  {
    id: "other",
    label: "Other Business",
    icon: <Building2 className="w-5 h-5" />,
    docs: ["privacy-policy", "terms-of-service", "cookie-policy", "disclaimer"],
  },
];
/* ─── BUSINESS TYPE → DOCUMENT MAP ─── */
const BUSINESS_CATEGORIES: Record<string, {
  icon: React.ReactNode;
  docs: string[];
  desc: string;
}> = {
  "SaaS & Software": {
    icon: <Code className="w-5 h-5" />,
    docs: ["privacy-policy", "terms-of-service", "cookie-policy", "acceptable-use-policy", "service-level-agreement", "disclaimer", "gdpr-compliance", "data-processing-agreement", "end-user-license-agreement"],
    desc: "Apps, platforms & software products"
  },
  "E-Commerce & D2C": {
    icon: <Truck className="w-5 h-5" />,
    docs: ["privacy-policy", "terms-of-service", "refund-policy", "shipping-policy", "cancellation-policy", "return-policy", "cookie-policy", "disclaimer"],
    desc: "Online stores & direct-to-consumer brands"
  },
  "Content & Social": {
    icon: <Users className="w-5 h-5" />,
    docs: ["privacy-policy", "terms-of-service", "community-guidelines", "dmca-policy", "content-moderation-policy", "acceptable-use-policy", "cookie-policy"],
    desc: "Social platforms, forums & UGC sites"
  },
  "Hotel & Hospitality": {
    icon: <Building2 className="w-5 h-5" />,
    docs: ["privacy-policy", "terms-of-service", "refund-policy", "cancellation-policy", "cookie-policy", "disclaimer"],
    desc: "Hotels, restaurants & travel businesses"
  },
  "Healthcare": {
    icon: <Heart className="w-5 h-5" />,
    docs: ["privacy-policy", "terms-of-service", "disclaimer", "cookie-policy", "refund-policy"],
    desc: "Clinics, telemedicine & health tech"
  },
  "Fintech & Finance": {
    icon: <TrendingUp className="w-5 h-5" />,
    docs: ["privacy-policy", "terms-of-service", "service-level-agreement", "disclaimer", "cookie-policy", "gdpr-compliance", "data-processing-agreement"],
    desc: "Payment apps, lending & financial services"
  },
  "Agency & Freelancer": {
    icon: <Lightbulb className="w-5 h-5" />,
    docs: ["privacy-policy", "terms-of-service", "cookie-policy", "disclaimer"],
    desc: "Design, dev & consulting agencies"
  },
  "Startup & General": {
    icon: <Zap className="w-5 h-5" />,
    docs: ["privacy-policy", "terms-of-service", "cookie-policy", "disclaimer", "refund-policy"],
    desc: "Any other business or startup"
  },
};
/* ─── GENERATE FUNCTION ─── */
function generateDocument(type: DocumentType, data: FormData, jur: Jurisdiction = 'IN') {
  switch (type) {
    case "privacy-policy": 
      if (jur !== 'IN') {
        return generateMultiJurisdictionPrivacyPolicy(data, jur);
      }
      return generatePrivacyPolicy(data);
    case "terms-of-service": return generateTermsOfService(data);
    case "refund-policy": return generateRefundPolicy(data);
    case "cookie-policy": return generateCookiePolicy(data);
    case "disclaimer": return generateDisclaimer(data);
    case "shipping-policy": return generateShippingPolicy(data);
    case "cancellation-policy": return generateCancellationPolicy(data);
    case "return-policy": return generateReturnPolicy(data);
    case "service-level-agreement": return generateServiceLevelAgreement(data);
    case "community-guidelines": return generateCommunityGuidelines(data);
    case "gdpr-compliance": return generateGDPRCompliance(data);
    case "data-processing-agreement": return generateDataProcessingAgreement(data);
    case "dmca-policy": return generateDmcaPolicy(data);
    case "content-moderation-policy": return generateContentModerationPolicy(data);
    case "acceptable-use-policy": return generateAup(data);
  }
}
/* ─── QUESTION FIELD ─── */
function QuestionField({
  question, value, onChange,
}: {
  question: import("@/lib/legalgen/types").Question;
  value: string | string[] | boolean | undefined;
  onChange: (value: string | string[] | boolean) => void;
}) {
  // 1. Upgraded Checkbox (Clickable Card Style)
  if (question.type === "checkbox") {
    const checked = value === true;
    return (
      <label
        htmlFor={question.id}
        className={cn(
          "flex items-start gap-3 p-4 rounded-xl border transition-all cursor-pointer group shadow-sm",
          checked
            ? "bg-orange-50/50 border-orange-300 dark:bg-orange-900/20 dark:border-orange-700"
            : "bg-white border-slate-200 hover:bg-slate-50 hover:border-orange-200 dark:bg-slate-900 dark:border-slate-800 dark:hover:bg-slate-800"
        )}
      >
        <Checkbox
          id={question.id}
          checked={checked}
          onCheckedChange={(checked) => onChange(!!checked)}
          className="mt-0.5 data-[state=checked]:bg-[#DE5117] data-[state=checked]:border-[#DE5117]"
        />
        <div className="flex-1">
          <span className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-[#DE5117] dark:group-hover:text-orange-400 transition-colors">
            {question.label}
            {question.required && <span className="text-red-500 ml-1">*</span>}
          </span>
          {question.tooltip && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{question.tooltip}</p>
          )}
        </div>
      </label>
    );
  }

  // 2. Upgraded Multi-Select (Grid of Toggle Cards)
  if (question.type === "multiselect") {
    const selected = (Array.isArray(value) ? value : []) as string[];
    return (
      <div className="space-y-3 p-1">
        <div>
          <Label className="text-sm font-semibold text-slate-900 dark:text-white">
            {question.label}
            {question.required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          {question.tooltip && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{question.tooltip}</p>
          )}
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {question.options?.map((opt) => {
            const isSelected = selected.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  const newSelected = isSelected
                    ? selected.filter((s) => s !== opt.value)
                    : [...selected, opt.value];
                  onChange(newSelected);
                }}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-left text-sm transition-all border shadow-sm",
                  isSelected
                    ? "bg-orange-50 border-orange-400 text-orange-900 font-bold dark:bg-orange-900/30 dark:border-orange-600 dark:text-orange-300"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 hover:shadow-md dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
                )}
              >
                <div className={cn(
                  "w-4 h-4 rounded-md border-2 flex items-center justify-center shrink-0 transition-all",
                  isSelected
                    ? "bg-[#DE5117] border-[#DE5117] scale-110 dark:bg-orange-500 dark:border-orange-500"
                    : "border-slate-300 dark:border-slate-600"
                )}>
                  {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                </div>
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // 3. Upgraded Text Inputs (Smooth Focus Rings)
  const inputClasses = "rounded-lg border-slate-200 bg-white focus:ring-2 focus:ring-[#C2410C]/20 focus:border-[#C2410C] dark:bg-slate-900 dark:border-slate-700 dark:focus:border-[#C2410C] dark:placeholder:text-slate-500";

  if (question.type === "select") {
    return (
      <div className="space-y-2 p-1">
        <Label className="text-sm font-semibold text-slate-900 dark:text-white">
          {question.label}
          {question.required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        <Select value={(value as string) || ""} onValueChange={(val) => onChange(val)}>
          <SelectTrigger className={cn(inputClasses, "h-11")}>
            <SelectValue placeholder={question.placeholder || "Select an option..."} />
          </SelectTrigger>
          <SelectContent>
            {question.options?.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  if (question.type === "textarea") {
    return (
      <div className="space-y-2 p-1">
        <Label className="text-sm font-semibold text-slate-900 dark:text-white">
          {question.label}
          {question.required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        <Textarea
          placeholder={question.placeholder}
          value={(value as string) || ""}
          onChange={(e) => onChange(e.target.value)}
          className={cn(inputClasses, "resize-none min-h-[120px] py-3")}
        />
      </div>
    );
  }

  return (
    <div className="space-y-2 p-1">
      <Label className="text-sm font-semibold text-slate-900 dark:text-white">
        {question.label}
        {question.required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Input
        type={question.type === "email" ? "email" : question.type === "url" ? "url" : "text"}
        placeholder={question.placeholder}
        value={(value as string) || ""}
        onChange={(e) => onChange(e.target.value)}
        className={cn(inputClasses, "h-11")}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════
   QUESTIONNAIRE VIEW
   ═══════════════════════════════════════════ */
function QuestionnaireView({
  groups, step, formData, updateField, onNext, onBack, isLastStep, currentConfig, isGenerating, progress,
  fromCompliance, jurisdiction, onJurisdictionChange,
}: {
  groups: QuestionGroup[];
  step: number;
  formData: FormData;
  updateField: (id: string, value: string | string[] | boolean) => void;
  onNext: () => void;
  onBack: () => void;
  isLastStep: boolean;
  currentConfig: { title: string; color: string; bgColor: string; icon: React.ReactNode } | undefined;
  isGenerating: boolean;
  progress: number;
  fromCompliance?: boolean;
  jurisdiction?: Jurisdiction;
  onJurisdictionChange?: (jur: Jurisdiction) => void;
}) {  const currentGroup = groups[step];
  const [showWarning, setShowWarning] = useState<string | null>(null);

  if (!currentGroup) return null;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50/50 dark:bg-slate-950">
      <div className="bg-[#FAFAF9] dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-center gap-4 text-xs">
          <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium">
            <Lock className="w-3.5 h-3.5" />
            Your answers stay in your browser
          </span>
          <span className="hidden sm:inline text-slate-300 dark:text-slate-700">|</span>
          <span className="hidden sm:flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            No data sent to any server
          </span>
          <span className="hidden sm:inline text-slate-300 dark:text-slate-700">|</span>
          <span className="hidden sm:flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium">
            <Fingerprint className="w-3.5 h-3.5" />
            100% private
          </span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">


        <div className="h-1 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mb-8">
          <div
            className="h-full bg-[#C2410C] rounded-full transition-all duration-500 ease-out relative"
            style={{ width: `${progress}%` }}
          >
          </div>
        </div>
        <div className="mb-8">
          {/* Step dots */}
          <div className="flex items-center gap-2 mb-5">
            {groups.map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  i < step
                    ? "bg-[#C2410C] w-6"
                    : i === step
                      ? "bg-[#C2410C] w-6"
                      : "bg-[#1C1917]/10 dark:bg-white/10 w-1.5"
                )}
              />
            ))}
          </div>
          <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">
            {currentGroup.title}
          </h2>
          {currentGroup.description && (
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{currentGroup.description}</p>
          )}
        </div>
      </div>

      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            {currentConfig && (
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", currentConfig.bgColor, currentConfig.color)}>
                {currentConfig.icon}
              </div>
            )}

            <div>
              <CardTitle className="text-xl dark:text-white">{currentGroup.title}</CardTitle>
              {currentGroup.description && (
                <CardDescription className="mt-1">{currentGroup.description}</CardDescription>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {currentGroup.questions.map((q) => (
            <QuestionField
              key={q.id}
              question={q}
              value={formData[q.id]}
              onChange={(val) => {
                updateField(q.id, val);
                if (q.warning && (val === true || (typeof val === 'string' && val))) {
                  setShowWarning(q.id);
                } else {
                  setShowWarning(null);
                }
              }}
            />
          ))}
  {/* Grievance Officer Section - IT Rules 2021 Compliance */}
{jurisdiction === 'IN' && (
  <div className="mt-6 rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50/80 to-orange-50/60 dark:from-amber-950/20 dark:to-orange-950/10 dark:border-amber-900/30 overflow-hidden">
    {/* Header */}
    <div className="flex items-start gap-3 px-5 py-4 bg-amber-100/50 dark:bg-amber-900/20 border-b border-amber-200/50 dark:border-amber-800/30">
      <div className="mt-0.5 w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
        <ShieldAlert className="w-4 h-4 text-amber-700 dark:text-amber-400" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-200 tracking-tight">
          Grievance Officer Details
        </h4>
        <p className="text-xs text-amber-700/80 dark:text-amber-400/80 mt-0.5 leading-relaxed">
          Required under <span className="font-medium">IT Rules 2021 (Rule 4)</span> & <span className="font-medium">DPDP Act 2023</span> for businesses operating in India.
        </p>
      </div>
      <Badge variant="outline" className="shrink-0 text-[10px] font-semibold uppercase tracking-wider border-amber-300/50 text-amber-700 dark:text-amber-400 dark:border-amber-700/30 bg-amber-100/50 dark:bg-amber-900/20 px-2 py-0.5">
        Mandatory
      </Badge>
    </div>

    {/* Form Fields */}
    <div className="p-5 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Full Name */}
        <div className="space-y-1.5">
          <Label htmlFor="go_name" className="text-xs font-medium text-slate-700 dark:text-slate-300">
            Full Name <span className="text-amber-600">*</span>
          </Label>
          <Input
            id="go_name"
            placeholder="e.g., Rajesh Kumar"
            value={(formData['go_name'] as string) || ''}
            onChange={(e) => updateField('go_name', e.target.value)}
            className="h-9 text-sm bg-white/80 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:border-amber-400 focus:ring-amber-400/20"
          />
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="go_email" className="text-xs font-medium text-slate-700 dark:text-slate-300">
            Official Email <span className="text-amber-600">*</span>
          </Label>
          <Input
            id="go_email"
            type="email"
            placeholder="grievance@company.com"
            value={(formData['go_email'] as string) || ''}
            onChange={(e) => updateField('go_email', e.target.value)}
            className="h-9 text-sm bg-white/80 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:border-amber-400 focus:ring-amber-400/20"
          />
        </div>

        {/* Phone */}
        <div className="space-y-1.5">
          <Label htmlFor="go_phone" className="text-xs font-medium text-slate-700 dark:text-slate-300">
            Contact Number <span className="text-amber-600">*</span>
          </Label>
          <Input
            id="go_phone"
            type="tel"
            placeholder="+91 98765 43210"
            value={(formData['go_phone'] as string) || ''}
            onChange={(e) => updateField('go_phone', e.target.value)}
            className="h-9 text-sm bg-white/80 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:border-amber-400 focus:ring-amber-400/20"
          />
        </div>

        {/* Address - Full Width */}
        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor="go_address" className="text-xs font-medium text-slate-700 dark:text-slate-300">
            Office Address for Legal Notices <span className="text-amber-600">*</span>
          </Label>
          <Textarea
            id="go_address"
            placeholder="Complete postal address where legal notices can be served..."
            value={(formData['go_address'] as string) || ''}
            onChange={(e) => updateField('go_address', e.target.value)}
            rows={3}
            className="text-sm bg-white/80 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:border-amber-400 focus:ring-amber-400/20 resize-none"
          />
        </div>
      </div>

      {/* Info Note */}
      <div className="flex items-start gap-2 pt-2 border-t border-amber-200/40 dark:border-amber-800/30">
        <Info className="w-3.5 h-3.5 text-amber-600/70 dark:text-amber-400/70 mt-0.5 shrink-0" />
        <p className="text-[11px] text-amber-700/70 dark:text-amber-400/70 leading-relaxed">
          This information will be published in your Privacy Policy. Users will contact this person for any data-related grievances.
        </p>
      </div>
    </div>
  </div>
)}

          {showWarning && currentGroup.questions.find(q => q.id === showWarning)?.warning && (
            <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/50 dark:border-amber-900/50">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-500" />
              <AlertDescription className="text-amber-800 dark:text-amber-200 text-sm">
                {currentGroup.questions.find(q => q.id === showWarning)!.warning}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
      {/* Navigation */}
      <div className="flex items-center justify-between mt-6">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={isGenerating}
          className="rounded-xl dark:border-slate-700 dark:text-slate-300"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {fromCompliance && step === 0 ? "Back to Results" : "Back"}
        </Button>

        <Button
          onClick={onNext}
          disabled={isGenerating}
          className={cn(
            "rounded-lg px-6 text-sm font-semibold transition-opacity",
            isLastStep
              ? "bg-[#C2410C] hover:opacity-90 text-white"
              : "bg-[#1C1917] hover:opacity-90 text-white dark:bg-white dark:text-slate-900 dark:hover:opacity-90"
          )}
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
              Generating...
            </>
          ) : isLastStep ? (
            <>
              Generate Document
              <Zap className="w-4 h-4 ml-2" />
            </>
          ) : (
            <>
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

/* ─── MAIN APP ─── */
type View = "home" | "questionnaire" | "preview" | "compliance";

export default function LegalGenPage() {
  const { user, signInWithGoogle, logout } = useAuth();
  const [view, setView] = useState<View>("home");
  const [selectedDoc, setSelectedDoc] = useState<DocumentType | null>(null);
  const [formData, setFormData] = useState<FormData>({});
const [jurisdiction, setJurisdiction] = useState<Jurisdiction>('IN');
const [step, setStep] = useState(0);
const [generatedDoc, setGeneratedDoc] = useState<{ html: string; text: string; title: string } | null>(null);
const [copiedHtml, setCopiedHtml] = useState(false); 
  const [copiedText, setCopiedText] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const { theme, toggle: toggleTheme } = useTheme();
  useScrollReveal();

  // Compliance checker state
  const [complianceUrl, setComplianceUrl] = useState('');
  const [complianceResult, setComplianceResult] = useState<ComplianceResponse | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [complianceError, setComplianceError] = useState('');

  // State for tracking if user came from compliance
  const [fromCompliance, setFromCompliance] = useState(false);
  const [detectedAnalysis, setDetectedAnalysis] = useState<WebsiteAnalysisResult | null>(null);

const questions = useMemo(() => {
    if (!selectedDoc) return [];
    const allQuestions = getQuestions(selectedDoc);
    // Filter question groups based on selected jurisdiction
    return allQuestions.filter(group => {
      // If group has no jurisdictions filter, show for all
      if (!group.jurisdictions) return true;
      // If group has jurisdictions filter, only show if current jurisdiction is included
      return group.jurisdictions.includes(jurisdiction) || jurisdiction === 'GLOBAL';
    });
  }, [selectedDoc, jurisdiction]);
  useScrollReveal();

  const totalSteps = questions.length;

  const updateField = useCallback((id: string, value: string | string[] | boolean) => {
    setFormData(prev => ({ ...prev, [id]: value }));
  }, []);

  const handleSelectDoc = useCallback((type: DocumentType) => {

    // 🔒 LOGIN REQUIRED
    if (!user) {
      signInWithGoogle();
      return;
    }

    setFromCompliance(view === "compliance");
    setSelectedDoc(type);
    setFormData({});
    setStep(0);
    setView("questionnaire");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [view, user, signInWithGoogle]);

  const handleBack = useCallback(() => {
    if (step > 0) {
      setStep(s => s - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      if (fromCompliance) {
        setView("compliance");
      } else {
        setView("home");
      }
      setSelectedDoc(null);
      setFormData({});
      setStep(0);
      setFromCompliance(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [step, fromCompliance]);

  const handleNext = useCallback(() => {
    if (step < totalSteps - 1) {
      setStep(s => s + 1);
    } else {
      setIsGenerating(true);
      if (selectedDoc) {
        const doc = generateDocument(selectedDoc, formData, jurisdiction);
        setGeneratedDoc(doc ?? null);

        // 📊 Track this generation in Firebase
        const config = DOC_CONFIGS.find(d => d.type === selectedDoc);
        trackGeneration({
          docType: selectedDoc,
          docTitle: config?.title || selectedDoc,
          userId: user?.uid || null,
          userEmail: user?.email || null,
        });
      }
      setTimeout(() => {
        setIsGenerating(false);
        setView("preview");
        setTimeout(() => {
          previewRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }, 800);
    }
  }, [step, totalSteps, selectedDoc, formData]);

  const handleCopyHtml = useCallback(async () => {
    if (!generatedDoc) return;
    await navigator.clipboard.writeText(generatedDoc.html);
    setCopiedHtml(true);
    setTimeout(() => setCopiedHtml(false), 2000);
  }, [generatedDoc]);

  const handleCopyText = useCallback(async () => {
    if (!generatedDoc) return;
    await navigator.clipboard.writeText(generatedDoc.text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  }, [generatedDoc]);

  const handleDownloadHtml = useCallback(() => {
    if (!generatedDoc) return;
    const blob = new Blob([generatedDoc.html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = generatedDoc.title.replace(/\s+/g, "-").toLowerCase() + ".html";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [generatedDoc]);

  const handleDownloadPdf = useCallback(() => {
  if (!generatedDoc) return;
  const element = document.getElementById('pdf-content');
  if (element) {
    html2pdf()
      .from(element)
      .set({
        margin: 10,
        filename: `${generatedDoc.title.replace(/\s+/g, "-").toLowerCase()}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      })
      .save();
  }
}, [generatedDoc]);

  const handleDownloadTxt = useCallback(() => {
    if (!generatedDoc) return;
    const blob = new Blob([generatedDoc.text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = generatedDoc.title.replace(/\s+/g, "-").toLowerCase() + ".txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [generatedDoc]);

  const handleStartOver = useCallback(() => {
    setView("home");
    setSelectedDoc(null);
    setFormData({});
    setStep(0);
    setGeneratedDoc(null);
    setCopiedHtml(false);
    setCopiedText(false);
    setFromCompliance(false);
  }, []);

  const handleBackToResults = useCallback(() => {
    setView("compliance");
    setSelectedDoc(null);
    setGeneratedDoc(null);
    setFormData({});
    setStep(0);
  }, []);

  const handleCheckCompliance = useCallback(async () => {
    if (!complianceUrl.trim()) return;

    // 🔒 LOGIN REQUIRED
    if (!user) {
      signInWithGoogle();
      return;
    }
    
    // 🔒 DOMAIN VERIFICATION REQUIRED (NEW!)
    const domain = extractDomain(complianceUrl);
    if (domain && user.email && !isDomainVerifiedForUser(domain, user.email)) {
      setComplianceError(`⚠️ Security: You must verify ownership of "${domain}" before running an audit. Domain verification is required to protect website owners.`);
      return;
    }

    let fixedUrl = complianceUrl.trim();
    if (!fixedUrl.startsWith('http://') && !fixedUrl.startsWith('https://')) {
      if (fixedUrl.includes('.') && !fixedUrl.includes(' ')) {
        fixedUrl = 'https://' + fixedUrl;
      } else {
        setComplianceError('Please enter a valid website URL (e.g., https://example.com)');
        return;
      }
    }

    setIsChecking(true);
    setComplianceError('');
    setComplianceResult(null);

    try {
      const res = await fetch('https://legalgen-scraper.onrender.com/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUrl: fixedUrl }),
      });

      const data = await res.json();

      if (data.error) {
        setComplianceError(data.error);
      } else if (data.success && data.text) {
        const pageText = data.text.toLowerCase();

        const results = buildComplianceChecks(pageText);
        const analysis = analyzeWebsiteText(pageText);
        setDetectedAnalysis(analysis);
        const totalCritical = results.filter(r => r.severity === 'critical').length;
        const foundCritical = results.filter(r => r.found && r.severity === 'critical').length;
        const totalImportant = results.filter(r => r.severity === 'important').length;
        const foundImportant = results.filter(r => r.found && r.severity === 'important').length;
        const totalRecommended = results.filter(r => r.severity === 'recommended').length;
        const foundRecommended = results.filter(r => r.found && r.severity === 'recommended').length;

        const totalWeight = (totalCritical * 3) + (totalImportant * 2);
        const earnedWeight = (foundCritical * 3) + (foundImportant * 2) + (foundRecommended * 1);
        const score = Math.round((earnedWeight / totalWeight) * 100);

        setComplianceResult({
          domain: new URL(fixedUrl).hostname,
          url: fixedUrl,
          score,
          totalCritical, foundCritical,
          totalImportant, foundImportant,
          totalRecommended, foundRecommended,
          results
        });

        // 📊 Track audit in Firebase
        trackAudit({
          url: fixedUrl,
          score,
          userId: user?.uid || null,
        });

      }
    } catch {
      setComplianceError('Network error. The scraper backend might be asleep or unreachable.');
    }
    setIsChecking(false);
  }, [complianceUrl, user, signInWithGoogle]);

  const handleOpenCompliance = useCallback(() => {
    setComplianceResult(null);
    setComplianceError('');
    setComplianceUrl('');
    setView("compliance");
    setFromCompliance(false);
  }, []);

  const handleRunAuditWithUrl = useCallback((inputUrl: string) => {
    // 🔒 SECURITY CHECK: Verify domain before running audit
    if (user?.email) {
      const domain = extractDomain(inputUrl);
      if (domain && !isDomainVerifiedForUser(domain, user.email)) {
        // Not verified! Don't run audit, show verification instead
        // We'll set a flag or use a different approach
        setComplianceUrl(inputUrl);
        // For now, show error message
        setComplianceError(`⚠️ Security: You must verify ownership of "${domain}" before running an audit. Please use the main form to verify your domain first.`);
        setView("compliance");
        setFromCompliance(false);
        return;
      }
    }
    
    setComplianceResult(null);
    setComplianceError('');
    setComplianceUrl(inputUrl);
    setView("compliance");
    setFromCompliance(false);

    // Trigger the check automatically
    setTimeout(() => {
      let fixedUrl = inputUrl.trim();
      if (!fixedUrl.startsWith('http://') && !fixedUrl.startsWith('https://')) {
        if (fixedUrl.includes('.') && !fixedUrl.includes(' ')) {
          fixedUrl = 'https://' + fixedUrl;
        }
      }
      setIsChecking(true);
      fetch('https://legalgen-scraper.onrender.com/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUrl: fixedUrl }),
      })
        .then(res => res.json())
        .then(data => {
          if (data.error) {
            setComplianceError(data.error);
          } else if (data.success && data.text) {
            const pageText = data.text.toLowerCase();
            setDetectedAnalysis(analyzeWebsiteText(pageText));
            const checkPage = (keywords: string[], pageName: string, generateType: string, severity: string, desc: string) => ({
              page: pageName,
              found: keywords.some(kw => pageText.includes(kw)),
              url: keywords.some(kw => pageText.includes(kw)) ? fixedUrl : null,
              source: keywords.some(kw => pageText.includes(kw)) ? 'Detected in page structure' : '',
              severity: severity as 'critical' | 'important' | 'recommended',
              description: desc,
              generateType
            });

            const results = [
              checkPage(['privacy policy', 'privacy notice', 'data protection'], 'Privacy Policy', 'privacy-policy', 'critical', 'Mandatory under DPDP Act 2023 for data collection.'),
              checkPage(['terms of service', 'terms and conditions', 'terms of use'], 'Terms of Service', 'terms-of-service', 'critical', 'Required to limit business liability and govern usage.'),
              checkPage(['refund policy', 'cancellation policy', 'return policy'], 'Refund & Cancellation Policy', 'refund-policy', 'important', 'Required by Consumer Protection (E-Commerce) Rules 2020.'),
              checkPage(['cookie policy', 'manage cookies'], 'Cookie Policy', 'cookie-policy', 'recommended', 'Standard practice for tracking and analytics transparency.')
            ];

            const totalCritical = results.filter(r => r.severity === 'critical').length;
            const foundCritical = results.filter(r => r.found && r.severity === 'critical').length;
            const totalImportant = results.filter(r => r.severity === 'important').length;
            const foundImportant = results.filter(r => r.found && r.severity === 'important').length;
            const totalRecommended = results.filter(r => r.severity === 'recommended').length;
            const foundRecommended = results.filter(r => r.found && r.severity === 'recommended').length;

            const totalWeight = (totalCritical * 3) + (totalImportant * 2) + (totalRecommended * 1);
            const earnedWeight = (foundCritical * 3) + (foundImportant * 2) + (foundRecommended * 1);
            const score = Math.round((earnedWeight / totalWeight) * 100);

            setComplianceResult({
              domain: new URL(fixedUrl).hostname,
              url: fixedUrl,
              score,
              totalCritical, foundCritical,
              totalImportant, foundImportant,
              totalRecommended, foundRecommended,
              results
            });

          // 📊 Track audit in Firebase
            trackAudit({
              url: fixedUrl,
              score,
              userId: user?.uid || null,
              // REMOVED: companyName & userRole
            });
          }
        })
        .catch(() => {
          setComplianceError('Network error. The scraper backend might be asleep or unreachable.');
        })
        .finally(() => {
          setIsChecking(false);
        });
    }, 100);
  }, []);

  const currentConfig = DOC_CONFIGS.find(d => d.type === selectedDoc);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAF9] dark:bg-slate-950 relative overflow-x-hidden selection:bg-[#C2410C]/15 selection:text-[#9A3412] font-[family-name:var(--font-inter)]">


      {/* Relative wrapper so content sits above the ambient glow */}
      <div className="relative flex-1 flex flex-col">

        {/* HEADER (Ultra-Premium Editorial) */}
        <header className="sticky top-0 z-50 bg-[#FAFAF9]/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-[#1C1917]/8 dark:border-slate-800">
          <div className="w-full px-6 sm:px-10 py-5 flex items-center justify-between">

            {/* Logo - Pure Typography, No Icons */}
            <button onClick={handleStartOver} className="group flex items-baseline">
              <span className="text-2xl sm:text-3xl font-black tracking-[-0.06em] text-[#1C1917] dark:text-white leading-none" style={{ textShadow: "1px 1px 0px rgba(194, 65, 12, 0.1)" }}>
                FOOTER<span className="text-[#C2410C]">.</span>
              </span>
            </button>

            {/* Mid Section - Editorial Breadcrumbs */}
            {view !== "home" && (
              <div className="hidden md:flex items-center gap-4 text-[10px] font-bold uppercase tracking-[0.2em] text-[#9A3412]/60 dark:text-orange-500/60">
                {view === "questionnaire" && currentConfig && (
                  <span>[ Step {step + 1} / {totalSteps} ] — {currentConfig.title}</span>
                )}
                {view === "preview" && currentConfig && (
                  <span className="text-[#C2410C]">[ Generated ] — {currentConfig.title}</span>
                )}
                {view === "compliance" && (
                  <span>[ Audit ] — Website Scanner</span>
                )}
              </div>
            )}

            {/* Right Section - Text-Based Actions */}
            <div className="flex items-center gap-6 sm:gap-10 text-[11px] font-bold uppercase tracking-[0.15em] text-[#1C1917] dark:text-slate-300">

              {view === "home" && (
                <button
                  onClick={handleOpenCompliance}
                  className="hidden sm:block hover:text-[#C2410C] transition-colors relative after:content-[''] after:absolute after:-bottom-1.5 after:left-0 after:w-0 after:h-px after:bg-[#C2410C] hover:after:w-full after:transition-all"
                >
                  Run Audit
                </button>
              )}

              {view === "preview" && fromCompliance && (
                <button
                  onClick={handleBackToResults}
                  className="hidden sm:block text-[#C2410C] hover:text-[#1C1917] dark:hover:text-white transition-colors relative after:content-[''] after:absolute after:-bottom-1.5 after:left-0 after:w-full after:h-px after:bg-[#C2410C] hover:after:bg-current after:transition-all"
                >
                  Return to Results
                </button>
              )}

              {view !== "home" && (
                <button
                  onClick={handleStartOver}
                  className="hover:text-[#C2410C] transition-colors relative after:content-[''] after:absolute after:-bottom-1.5 after:left-0 after:w-0 after:h-px after:bg-[#C2410C] hover:after:w-full after:transition-all"
                >
                  Index
                </button>
              )}

              <div className="w-px h-3 bg-[#1C1917]/20 dark:bg-white/20 hidden sm:block" />

              {/* Text-based Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="hover:text-[#C2410C] transition-colors w-12 text-right"
              >
                {theme === 'light' ? 'DARK' : 'LIGHT'}
              </button>

              <div className="w-px h-3 bg-[#1C1917]/20 dark:bg-white/20 hidden sm:block" />
              {/* 👇 AUTH BUTTONS ADDED HERE 👇 */}
              {user ? (
                <div className="flex items-center gap-6 sm:gap-10">
                  <Link
                    href="/dashboard"
                    className="text-[#C2410C] hover:text-[#1C1917] dark:hover:text-white transition-colors relative after:content-[''] after:absolute after:-bottom-1.5 after:left-0 after:w-full after:h-px after:bg-[#C2410C] hover:after:bg-current after:transition-all"
                  >
                    DASHBOARD
                  </Link>
                  <button
                    onClick={logout}
                    className="hover:text-[#C2410C] transition-colors"
                    title={user.email || "Logout"}
                  >
                    LOGOUT
                  </button>
                </div>
              ) : (
                // ...
                <button
                  onClick={signInWithGoogle}
                  className="text-[#C2410C] hover:text-[#1C1917] dark:hover:text-white transition-colors"
                >
                  LOGIN
                </button>
              )}
            </div>
          </div>
        </header>

        {/* MAIN */}
        <main className="flex-1">
{view === "home" && (
  <HomeView
    onSelectDoc={handleSelectDoc}
    onOpenCompliance={handleOpenCompliance}
    onRunAudit={handleRunAuditWithUrl}
    user={user}
    signInWithGoogle={signInWithGoogle}
    jurisdiction={jurisdiction}
    setJurisdiction={setJurisdiction}
  />
)}
          {view === "compliance" && (
            <ComplianceCheckerView
              url={complianceUrl}
              setUrl={setComplianceUrl}
              result={complianceResult}
              setResult={setComplianceResult}
              isChecking={isChecking}
              error={complianceError}
              onCheck={handleCheckCompliance}
              onGenerateDoc={handleSelectDoc}
              detectedAnalysis={detectedAnalysis}
            />
          )}          
          {view === "questionnaire" && selectedDoc && (
  <QuestionnaireView
    key={selectedDoc}
    groups={questions}
    step={step}
    formData={formData}
    updateField={updateField}
    onNext={handleNext}
    onBack={handleBack}
    isLastStep={step === totalSteps - 1}
    currentConfig={currentConfig}
    isGenerating={isGenerating}
    progress={(step + 1) / totalSteps * 100}
    fromCompliance={fromCompliance}
    jurisdiction={jurisdiction}
  />
)}
          {view === "preview" && generatedDoc && (
            <PreviewView
              ref={previewRef}
              onDownloadPdf={handleDownloadPdf}
              doc={generatedDoc}
              copiedHtml={copiedHtml}
              copiedText={copiedText}
              onCopyHtml={handleCopyHtml}
              onCopyText={handleCopyText}
              onDownloadHtml={handleDownloadHtml}
              onDownloadTxt={handleDownloadTxt}
              currentConfig={currentConfig}
              fromCompliance={fromCompliance}
              onBackToResults={handleBackToResults}
            />
          )}
        </main>

        {/* FOOTER */}
        <footer className="bg-white dark:bg-slate-950 border-t border-[#1C1917]/8 dark:border-slate-800 pt-16 pb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8 mb-16">

              {/* Brand Column */}
              <div className="lg:col-span-4">
                <div className="flex items-center gap-2.5 mb-6">
                  <div className="w-8 h-8 bg-[#C2410C] rounded-lg flex items-center justify-center">
                    <Scale className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                    Footer<span className="text-[#C2410C]">.co.in</span>
                  </span>
                </div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed mb-6 max-w-xs">
                  Free, instant, India-compliant legal documents. 16 document types covering MeitY, RBI, SEBI, Consumer Affairs, and 6 more government departments.
                </p>
              </div>

              {/* Documents Column */}
              <div className="lg:col-span-3">
                <h4 className="text-xs font-bold text-[#1C1917] dark:text-slate-300 uppercase tracking-widest mb-6"></h4>
                <ul className="space-y-3">
                  {DOC_CONFIGS.slice(0, 7).map((doc) => (
                    <li key={doc.type}>
                      <button
                        onClick={() => handleSelectDoc(doc.type)}
                        className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-[#C2410C] transition-colors text-left"
                      >
                        {doc.title}
                      </button>
                    </li>
                  ))}
                  <li>
                    <button
                      onClick={() => document.getElementById("doc-types")?.scrollIntoView({ behavior: "smooth" })}
                      className="text-sm font-bold text-[#C2410C] hover:text-[#9A3412] transition-colors text-left mt-2 flex items-center"
                    >
                      View all 16 documents <ArrowRight className="w-3 h-3 ml-1" />
                    </button>
                  </li>
                </ul>
              </div>

              {/* Tools & Departments Column */}
              <div className="lg:col-span-2">
                <h4 className="text-xs font-bold text-[#9A3412] dark:text-orange-500 uppercase tracking-widest mb-6">Tools</h4>
                <ul className="space-y-3 mb-10">
                  <li>
                    <button onClick={handleOpenCompliance} className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-[#C2410C] transition-colors">
                      Compliance Checker
                    </button>
                  </li>
                  <li>
                    <span className="text-sm font-medium text-slate-400 flex items-center gap-2">
                      Lawyer Review
                      <span className="text-[9px] font-bold tracking-widest bg-[#9A3412]/10 text-[#9A3412] px-1.5 py-0.5 rounded-sm uppercase">Soon</span>
                    </span>
                  </li>
                  <li>
                    <span className="text-sm font-medium text-slate-400 flex items-center gap-2">
                      Pro Plan
                      <span className="text-[9px] font-bold tracking-widest bg-[#9A3412]/10 text-[#9A3412] px-1.5 py-0.5 rounded-sm uppercase">Soon</span>
                    </span>
                  </li>
                </ul>
                <h4 className="text-xs font-bold text-[#9A3412] dark:text-orange-500 uppercase tracking-widest mb-6">Departments</h4>
                <ul className="space-y-3">
                  <li><span className="text-sm font-medium text-slate-600 dark:text-slate-400">MeitY (IT, DPDP)</span></li>
                  <li><span className="text-sm font-medium text-slate-600 dark:text-slate-400">Consumer Affairs</span></li>
                  <li><span className="text-sm font-medium text-slate-600 dark:text-slate-400">RBI, SEBI, TRAI</span></li>
                </ul>
              </div>

              {/* Trust & Privacy Column */}
              <div className="lg:col-span-3">
                <h4 className="text-xs font-bold text-[#9A3412] dark:text-orange-500 uppercase tracking-widest mb-6">Trust & Privacy</h4>
                <div className="space-y-4 mb-10">
                  <div className="flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-400">
                    <Lock className="w-4 h-4 text-[#C2410C]" /> No data stored on servers
                  </div>
                  <div className="flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-400">
                    <Fingerprint className="w-4 h-4 text-[#C2410C]" /> 100% client-side processing
                  </div>
                  <div className="flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-400">
                    <ShieldCheck className="w-4 h-4 text-[#C2410C]" /> Templates by legal experts
                  </div>
                  <div className="flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-400">
                    <Globe className="w-4 h-4 text-[#C2410C]" /> Made in India
                  </div>
                </div>
                <h4 className="text-xs font-bold text-[#9A3412] dark:text-orange-500 uppercase tracking-widest mb-4">Contact</h4>
                <a href="mailto:support.footer@gmail.com" className="text-sm font-medium text-slate-900 dark:text-white hover:text-[#C2410C] transition-colors border-b border-[#C2410C]/30 pb-0.5">
                  support.footer@gmail.com
                </a>
              </div>
            </div>


            {/* Bottom Bar */}
            <div className="border-t border-[#9A3412]/10 dark:border-slate-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-xs font-bold tracking-wide uppercase text-slate-400 dark:text-slate-500">
                <span>&copy; {new Date().getFullYear()} Footer.co.in</span>
                <span className="hidden sm:block text-slate-300 dark:text-slate-700">•</span>
                <span>Not legal advice. See disclaimer.</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs tracking-wide text-slate-400 dark:text-slate-500">
                <span>Built in India</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   PREVIEW VIEW
   ═══════════════════════════════════════════ */
const PreviewView = forwardRef<HTMLDivElement, {
  doc: { html: string; text: string; title: string };
  copiedHtml: boolean;
  copiedText: boolean;
  onCopyHtml: () => void;
  onCopyText: () => void;
  onDownloadHtml: () => void;
  onDownloadTxt: () => void;
  onDownloadPdf: () => void;
  currentConfig: { title: string; color: string; bgColor: string; icon: React.ReactNode } | undefined;
  fromCompliance?: boolean;
  onBackToResults?: () => void;
}>(({
doc, copiedHtml, copiedText, onCopyHtml, onCopyText, onDownloadHtml, onDownloadTxt, onDownloadPdf, currentConfig, fromCompliance, onBackToResults
}, ref) => {
  const { user, signInWithGoogle } = useAuth(); // <-- ADDED AUTH
  const [tab, setTab] = useState<"preview" | "html">("preview");
  const [isSavingEmbed, setIsSavingEmbed] = useState(false);
  const [embedCode, setEmbedCode] = useState<string | null>(null);

  // 👇 ADDED SAVE TO FIRESTORE LOGIC 👇
  const [isSavingDb, setIsSavingDb] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveDocument = async () => {
    if (!user || !doc) return;

    setIsSavingDb(true);
    setSaveSuccess(false);

    try {
      await saveDocumentToDb(user.uid, doc.title, doc.html);
      setSaveSuccess(true);

      // Reset the success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Failed to save:", error);
      alert("Failed to save the document. Please try again.");
    } finally {
      setIsSavingDb(false);
    }
  };

  const handleGenerateEmbed = async () => {
    if (!currentConfig) return;
    setIsSavingEmbed(true);
    try {
      const fakeWidgetId = "wid_" + Math.random().toString(36).substring(2, 9);
      const scriptCode = `<script src="https://legalgen.in/api/widget/${fakeWidgetId}"></script>`;
      setEmbedCode(scriptCode);
    } catch (error) {
      console.error(error);
    }
    setIsSavingEmbed(false);
  };

  return (
    <div ref={ref} className="bg-slate-50/50 dark:bg-slate-950 min-h-[calc(100vh-4rem)]">
      <div className="bg-[#C2410C]/5 border-b border-[#C2410C]/15">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 rounded-full bg-[#C2410C] flex items-center justify-center">
              <Check className="w-3 h-3 text-white" strokeWidth={3} />
            </div>
            <span className="text-sm font-medium text-[#1C1917] dark:text-white">
              {currentConfig?.title}
            </span>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">Generated just now</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-6">

          <div className="flex-1 min-w-0">
            <Card className="border-[#1C1917]/8 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 p-3 sm:p-4 bg-slate-50/50 dark:bg-slate-900/30">
                <div className="bg-slate-200/60 dark:bg-slate-800 p-1 rounded-xl inline-flex">
                  <button
                    onClick={() => setTab("preview")}
                    className={cn(
                      "px-4 sm:px-6 py-2 text-sm font-semibold rounded-lg transition-all duration-200",
                      tab === "preview"
                        ? "bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-sm ring-1 ring-slate-900/5 dark:ring-white/10"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    )}
                  >
                    Visual Preview
                  </button>
                  <button
                    onClick={() => setTab("html")}
                    className={cn(
                      "px-4 sm:px-6 py-2 text-sm font-semibold rounded-lg transition-all duration-200",
                      tab === "html"
                        ? "bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-sm ring-1 ring-slate-900/5 dark:ring-white/10"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    )}
                  >
                    HTML Source
                  </button>
                </div>

                <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                  <span className="text-slate-400 dark:text-slate-500">·</span>
                  Ready to Export
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 max-h-[70vh] overflow-y-auto">
                {tab === "preview" ? (
<>
  <div id="pdf-content" style={{ display: 'none' }} dangerouslySetInnerHTML={{ __html: doc.html }} />
  <iframe
    srcDoc={doc.html.replace('<head>', '<head><base target="_blank" rel="noopener noreferrer">')}
    title={doc.title}
    className="w-full min-h-[600px] border-0 bg-white"
    sandbox="allow-same-origin allow-popups"
  />
</>
) : (
                  <pre className="p-5 text-xs text-slate-600 dark:text-slate-400 overflow-x-auto font-mono leading-relaxed whitespace-pre-wrap break-all">
                    {doc.html}
                  </pre>
                )}
              </div>
            </Card>
          </div>

          <div className="lg:w-80 shrink-0 space-y-4">
            <Card className="border-slate-200 dark:border-slate-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-base dark:text-white">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {fromCompliance && onBackToResults && (
                  <>
                    <Button
                      onClick={onBackToResults}
                      className="w-full justify-start rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-900 dark:hover:bg-emerald-900/50"
                      variant="outline"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to Results
                    </Button>
                    <Separator className="dark:bg-slate-800" />
                  </>
                )}

                {/* 👇 ADDED SAVE BUTTON BLOCK 👇 */}
                {user ? (
                  <Button
                    onClick={handleSaveDocument}
                    disabled={isSavingDb || saveSuccess}
                    className={cn(
                      "w-full justify-start rounded-xl shadow-sm transition-all",
                      saveSuccess
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                        : "bg-[#C2410C] hover:bg-[#9A3412] text-white"
                    )}
                  >
                    {isSavingDb ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : saveSuccess ? (
                      <Check className="w-4 h-4 mr-2" />
                    ) : (
                      <Database className="w-4 h-4 mr-2" />
                    )}
                    {isSavingDb ? "Saving..." : saveSuccess ? "Saved to Dashboard ✓" : "Save to Dashboard"}
                  </Button>
                ) : (
                  <Button
                    onClick={signInWithGoogle}
                    className="w-full justify-start rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  >
                    <Lock className="w-4 h-4 mr-2" />
                    Log in to Save
                  </Button>
                )}

                <Separator className="my-3 dark:bg-slate-800" />
                {/* 👆 END SAVE BUTTON BLOCK 👆 */}

                <Button
                  disabled
                  className="w-full justify-start rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                >
                  <Code2 className="w-4 h-4 mr-2" />
                  Auto-Updating Embed
                  <span className="ml-auto text-[9px] font-bold tracking-widest bg-[#9A3412]/10 text-[#9A3412] px-1.5 py-0.5 rounded-sm uppercase">Soon</span>
                </Button>

                <Separator className="my-3 dark:bg-slate-800" />

                <Button
                  onClick={onCopyHtml}
                  className="w-full justify-start rounded-xl dark:border-slate-700 dark:text-slate-300"
                  variant={copiedHtml ? "default" : "outline"}
                >
                  {copiedHtml ? (
                    <>
                      <Check className="w-4 h-4 mr-2 text-emerald-300" />
                      HTML Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy HTML
                    </>
                  )}
                </Button>
                <Button
                  onClick={onCopyText}
                  className="w-full justify-start rounded-xl dark:border-slate-700 dark:text-slate-300"
                  variant={copiedText ? "default" : "outline"}
                >
                  {copiedText ? (
                    <>
                      <Check className="w-4 h-4 mr-2 text-emerald-300" />
                      Text Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Plain Text
                    </>
                  )}
                </Button>

                <Separator className="dark:bg-slate-800" />

                <Button
                  onClick={onDownloadHtml}
                  className="w-full justify-start rounded-xl dark:border-slate-700 dark:text-slate-300"
                  variant="outline"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download .html
                </Button>
                <Button
  onClick={onDownloadPdf}
  className="w-full justify-start rounded-xl bg-gradient-to-r from-red-500 to-pink-500 hover:opacity-90 text-white border-0"
>
  <Download className="w-4 h-4 mr-2" />
  Download PDF
</Button>
              </CardContent>
            </Card>

            <Card className="border-slate-200 dark:border-slate-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-base dark:text-white">Compliance Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-500">Generated:</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span className="text-slate-500">Template version:</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">Reviewed 2026</span>
                </div>
                {currentConfig && 'laws' in currentConfig && Array.isArray((currentConfig as typeof DOC_CONFIGS[number] & { laws?: string[] }).laws) && (
                  <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Laws referenced:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {(currentConfig as typeof DOC_CONFIGS[number] & { laws?: string[] }).laws!.map((law: string) => (
                        <span key={law} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50">
                          {law}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-900/50">
              <CardContent className="pt-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
                    This document is a template generated for informational purposes only. It does not constitute legal advice.
                    Consult a qualified lawyer for your specific situation.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
});
PreviewView.displayName = "PreviewView";

/* ═══════════════════════════════════════════
   COMPLIANCE CHECKER VIEW (With Live Scanning Timer)
   ═══════════════════════════════════════════ */
function ComplianceCheckerView({
  url, setUrl, result, setResult, isChecking, error, onCheck, onGenerateDoc, detectedAnalysis,
}: {
  url: string;
  setUrl: (url: string) => void;
  result: ComplianceResponse | null;
  setResult: (res: ComplianceResponse | null) => void;
  isChecking: boolean;
  error: string;
  onCheck: () => void;
  onGenerateDoc: (type: DocumentType) => void;
  detectedAnalysis: WebsiteAnalysisResult | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [overridePage, setOverridePage] = useState<string | null>(null);
  const [businessType, setBusinessType] = useState('other');
  const [overrideUrl, setOverrideUrl] = useState('');
  const [isVerified, setIsVerified] = useState(true);

  // Timer while scanning
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (isChecking) {
      setSeconds(0);

      timer = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      clearInterval(timer);
    };
  }, [isChecking]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isChecking) {
      onCheck();
    }
  };

  const handleOverrideSubmit = (pageName: string, severity: string) => {
    if (!overrideUrl.trim() || !result) return;

    const newResults = result.results.map((r) =>
      r.page === pageName ? { ...r, found: true, url: overrideUrl, source: 'Manually Added' } : r
    );

    let newCritical = result.foundCritical;
    let newImportant = result.foundImportant;
    let newRecommended = result.foundRecommended;

    if (severity === 'critical') newCritical++;
    else if (severity === 'important') newImportant++;
    else if (severity === 'recommended') newRecommended++;

    const totalWeight = result.totalCritical * 3 + result.totalImportant * 2 + result.totalRecommended * 1;
    const earnedWeight = newCritical * 3 + newImportant * 2 + newRecommended * 1;
    const newScore = totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 100;

    setResult({
      ...result,
      results: newResults,
      foundCritical: newCritical,
      foundImportant: newImportant,
      foundRecommended: newRecommended,
      score: newScore,
    });

    setOverridePage(null);
    setOverrideUrl('');
  };

  const missingPages = result ? result.results.filter((r) => !r.found && r.generateType) : [];
  const foundPages = result ? result.results.filter((r) => r.found) : [];

  const scoreColor = result
    ? result.score >= 80
      ? 'text-emerald-600 dark:text-emerald-400'
      : result.score >= 50
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-red-600 dark:text-red-400'
    : '';

  const scoreBg = result
    ? result.score >= 80
      ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900/50'
      : result.score >= 50
        ? 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900/50'
        : 'bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-900/50'
    : '';

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50/50 dark:bg-slate-950 font-sans">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">

        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto mb-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-center text-[#C2410C] shadow-sm">
            <Search className="w-7 h-7" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
            Website Compliance Checker
          </h1>
          <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto text-sm sm:text-base">
            Enter your website URL below. We will scan it and check which legal pages are missing.
          </p>
        </div>

        <div className="mb-4">
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 block">
            What type of business is this?
          </label>
          <select
            value={businessType}
            onChange={(e) => setBusinessType(e.target.value)}
            className="w-full h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950 text-sm"
          >
            {BUSINESS_TYPES.map((bt) => (
              <option key={bt.id} value={bt.id}>{bt.label}</option>
            ))}
          </select>
        </div>
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm mb-8 bg-white dark:bg-slate-900">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  ref={inputRef}
                  type="url"
                  placeholder="e.g., https://www.yourwebsite.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="pl-10 rounded-xl h-12 dark:bg-slate-950 dark:border-slate-800"
                  disabled={isChecking}
                />
              </div>
              <Button
                onClick={onCheck}
                disabled={isChecking || !url.trim()}
                className="bg-[#C2410C] hover:bg-[#9A3412] text-white rounded-xl px-8 h-12 font-semibold uppercase tracking-wider text-xs w-full sm:w-auto transition-colors"
              >
                {isChecking ? 'Scanning...' : 'Check'}
              </Button>
            </div>

            {error && (
              <Alert className="mt-4 border-red-200 bg-red-50 dark:bg-red-950/50 dark:border-red-900/50">
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-500" />
                <AlertDescription className="text-red-700 dark:text-red-200 text-sm">{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {isChecking && (
          <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 sm:p-12 mb-8 text-center overflow-hidden relative">
            {/* Animated Background Progress Bar */}
            <div
              className="absolute bottom-0 left-0 h-1 bg-[#C2410C] transition-all duration-1000 ease-linear"
              style={{ width: `${Math.min((seconds / 50) * 100, 95)}%` }}
            />

            <div className="flex flex-col items-center justify-center">
              <div className="w-10 h-10 rounded-full border-[3px] border-slate-200 dark:border-slate-700 border-t-[#C2410C] animate-spin mb-6" />

              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2 tracking-tight transition-opacity duration-300">
                {seconds < 5 && "Analyzing your website..."}
                {seconds >= 5 && seconds < 15 && "Waking up the scanner..."}
                {seconds >= 15 && seconds < 35 && "Booting secure backend..."}
                {seconds >= 35 && "Almost there..."}
              </h3>

              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto min-h-[40px]">
                {seconds < 5 && "Checking your homepage and structure. This usually takes 15-30 seconds."}
                {seconds >= 5 && seconds < 15 && "Because we use a free-tier server, it sometimes needs a moment to wake from sleep."}
                {seconds >= 15 && seconds < 35 && `The server is warming up (${seconds}s). Thanks for your patience!`}
                {seconds >= 35 && `Extracting compliance data (${seconds}s). It can take up to 50 seconds on a cold start.`}
              </p>
            </div>
          </Card>
        )}

        {result && !isChecking && (
          <div className="space-y-6">
            {detectedAnalysis && detectedAnalysis.detections.length > 0 && (
              <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <CardContent className="pt-5 pb-5">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wide">
                    Detected on your website
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {detectedAnalysis.detections.map((d) => (
                      <span
                        key={d.feature}
                        className="text-xs font-medium px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                      >
                        {FEATURE_LABELS[d.feature]}
                      </span>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-3">
                    These were auto-detected from your homepage text and will pre-fill relevant questions when you generate a document.
                  </p>
                </CardContent>
              </Card>
            )}
            <Card className={cn("border-2", scoreBg)}>              <CardContent className="pt-6 pb-6">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="text-center">
                  <div className={cn("text-5xl font-extrabold", scoreColor)}>{result.score}</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">Compliance Score</div>
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                    {result.score >= 80
                      ? 'Great! Mostly Compliant'
                      : result.score >= 50
                        ? 'Partially Compliant — Action Needed'
                        : 'Not Compliant — Immediate Action Required'}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {foundPages.length} of {result.results.length} legal pages detected on{' '}
                    <span className="font-medium text-slate-700 dark:text-slate-300">{result.domain}</span>
                  </p>
                </div>
              </div>
            </CardContent>
            </Card>

            <div className="grid grid-cols-3 gap-3">
              <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <CardContent className="pt-4 pb-4 text-center">
                  <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{result.foundCritical}</div>
                  <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Critical ({result.totalCritical})
                  </div>
                </CardContent>
              </Card>
              <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <CardContent className="pt-4 pb-4 text-center">
                  <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{result.foundRecommended}</div>
                  <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Recommended ({result.totalRecommended})
                  </div>
                </CardContent>
              </Card>
              <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <CardContent className="pt-4 pb-4 text-center">
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">{missingPages.length}</div>
                  <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    To Generate
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="relative mt-8">

              <div className="space-y-8">
                {missingPages.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                      <XCircle className="w-5 h-5 text-red-500" />
                      Missing Pages
                    </h3>
                    <div className="space-y-3">
                      {missingPages.map((page) => (
                        <Card key={page.page} className="border-red-100 dark:border-red-900/50 bg-white dark:bg-slate-900">
                          <CardContent className="pt-4 pb-4">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-semibold text-slate-900 dark:text-white">{page.page}</span>
                                  <Badge
                                    variant="secondary"
                                    className={cn(
                                      'text-[10px] font-medium px-1.5 py-0.5 border-0',
                                      page.severity === 'critical'
                                        ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
                                        : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                                    )}
                                  >
                                    {page.severity}
                                  </Badge>
                                </div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{page.description}</p>

                                {overridePage === page.page ? (
                                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                                    <Input
                                      placeholder="Paste exact URL here..."
                                      value={overrideUrl}
                                      onChange={(e) => setOverrideUrl(e.target.value)}
                                      className="h-8 text-xs sm:max-w-[250px] dark:bg-slate-950"
                                    />
                                    <div className="flex gap-2 w-full sm:w-auto">
                                      <Button
                                        size="sm"
                                        onClick={() => handleOverrideSubmit(page.page, page.severity)}
                                        className="h-8 flex-1 sm:flex-none bg-slate-900 hover:bg-slate-800 text-white dark:bg-[#C2410C] dark:hover:bg-[#9A3412]"
                                      >
                                        Save
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => {
                                          setOverridePage(null);
                                          setOverrideUrl('');
                                        }}
                                        className="h-8 text-slate-500"
                                      >
                                        Cancel
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setOverridePage(page.page)}
                                    className="text-xs font-medium text-[#C2410C] hover:text-[#9A3412] mt-2 inline-flex items-center"
                                  >
                                    + I already have this page
                                  </button>
                                )}
                              </div>
                              {page.generateType && overridePage !== page.page && (
                                <Button
                                  size="sm"
                                  onClick={() => onGenerateDoc(page.generateType as DocumentType)}
                                  className="bg-[#C2410C] hover:bg-[#9A3412] text-white rounded-lg shrink-0 w-full sm:w-auto mt-3 sm:mt-0"
                                >
                                  Generate Now
                                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {foundPages.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      Pages Found
                    </h3>
                    <div className="space-y-2">
                      {foundPages.map((page) => (
                        <div key={page.page} className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-emerald-100 dark:border-emerald-900/50">
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                          <div className="flex-1">
                            <span className="font-medium text-slate-900 dark:text-white text-sm">{page.page}</span>
                            <p className="text-xs text-slate-400 dark:text-slate-500">{page.source}</p>
                          </div>
                          {page.url && (
                            <a
                              href={page.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#C2410C] p-2 bg-orange-50 dark:bg-orange-950/30 rounded-md"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Card className="border-blue-100 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/30 mt-8">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                    <div className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
                      <strong>Note:</strong> This checker renders your homepage in a real browser (so JavaScript-loaded content and same-origin iframes are included) and also checks common legal page URLs and footer/nav links directly. It may still miss pages that require a login, use uncommon URL patterns, or are blocked by the site&apos;s bot protection.
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {!result && !error && !isChecking && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center">
              <Search className="w-8 h-8 text-slate-300 dark:text-slate-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">Enter a URL to get started</h3>
            <p className="text-sm text-slate-400 dark:text-slate-500 max-w-sm mx-auto">
              We will check if your website has all the legally required pages for Indian compliance.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   HOME VIEW
   ═══════════════════════════════════════════ */
// Rate limiting constants
const MAX_FREE_AUDITS_PER_DAY = 5;
const AUDIT_STORAGE_KEY = 'legalgen_audit_count';

// Helper function to get today's audit count from localStorage
function getAuditsToday(): number {
  if (typeof window === 'undefined') return 0;
  const stored = localStorage.getItem(AUDIT_STORAGE_KEY);
  if (!stored) return 0;
  try {
    const data = JSON.parse(stored);
    const today = new Date().toDateString();
    if (data.date === today) {
      return data.count || 0;
    }
    return 0;
  } catch {
    return 0;
  }
}

// Helper function to increment audit count in localStorage
function incrementAuditCount(): void {
  if (typeof window === 'undefined') return;
  const today = new Date().toDateString();
  const current = getAuditsToday();
  localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify({ date: today, count: current + 1 }));
}


/* ─── DOMAIN VERIFICATION SYSTEM ─── */
type VerificationMethod = 'file' | 'meta' | 'dns' | 'email';

interface VerifiedDomain {
  domain: string;
  verifiedAt: number;
  method: VerificationMethod;
  verifiedBy: string; // user email/uid
}

const VERIFICATION_STORAGE_KEY = 'legalgen_verified_domains_v2';

function generateVerificationToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    return urlObj.hostname.replace('www.', '').toLowerCase();
  } catch {
    return '';
  }
}

function getVerifiedDomains(): VerifiedDomain[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(VERIFICATION_STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

function isDomainVerifiedForUser(domain: string, userEmail: string): boolean {
  const domains = getVerifiedDomains();
  const normalDomain = domain.replace('www.', '').toLowerCase();
  return domains.some(d => 
    d.domain.replace('www.', '').toLowerCase() === normalDomain && 
    d.verifiedBy === userEmail
  );
}

function saveVerifiedDomain(domain: string, method: VerificationMethod, userEmail: string) {
  if (typeof window === 'undefined') return;
  const domains = getVerifiedDomains();
  const normalDomain = domain.replace('www.', '').toLowerCase();
  
  // Remove existing entries for this domain
  const filtered = domains.filter(d => d.domain.replace('www.', '').toLowerCase() !== normalDomain);
  
  // Add new entry
  filtered.push({
    domain: normalDomain,
    verifiedAt: Date.now(),
    method,
    verifiedBy: userEmail
  });
  
  localStorage.setItem(VERIFICATION_STORAGE_KEY, JSON.stringify(filtered));
}

function HomeView({
  onSelectDoc,
  onOpenCompliance,
  onRunAudit,
  jurisdiction,
  setJurisdiction,
  user,
  signInWithGoogle,
}: {
  onSelectDoc: (type: DocumentType) => void;
  onOpenCompliance: () => void;
  onRunAudit: (url: string) => void;
  jurisdiction?: Jurisdiction;
setJurisdiction?: (j: Jurisdiction) => void;
  user: any;
  signInWithGoogle: () => void;
}) {
  const [siteUrl, setSiteUrl] = useState("");
  const [selectedBiz, setSelectedBiz] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [pendingUrl, setPendingUrl] = useState('');
  const [verificationMethod, setVerificationMethod] = useState<VerificationMethod>('file');
  const [verificationEmail, setVerificationEmail] = useState('');
  const [verificationToken, setVerificationToken] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [verificationConfirmed, setVerificationConfirmed] = useState(false);

  const filteredDocs = useMemo(() => {
    if (!selectedBiz) return DOC_CONFIGS;
    const biz = BUSINESS_CATEGORIES[selectedBiz];
    if (!biz) return DOC_CONFIGS;
    return DOC_CONFIGS.filter(d => biz.docs.includes(d.type));
  }, [selectedBiz]);

  const startDomainVerification = useCallback((url: string) => {
    setPendingUrl(url);
    setVerificationToken(generateVerificationToken());
    setVerificationMethod('file');
    setVerificationEmail(`admin@${extractDomain(url)}`);
    setVerificationError(null);
    setVerificationSuccess(false);
    setVerificationConfirmed(false);
    setShowVerificationModal(true);
  }, []);

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  }, []);

  const performDomainVerification = useCallback(async () => {
    if (!user?.email) {
      setVerificationError('You must be logged in to verify a domain.');
      return;
    }
    if (!verificationConfirmed) {
      setVerificationError('Please check the confirmation checkbox.');
      return;
    }
    if (verificationMethod === 'email' && !verificationEmail) {
      setVerificationError('Please enter an email address.');
      return;
    }
    setIsVerifying(true);
    setVerificationError(null);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      const domain = extractDomain(pendingUrl);
      if (domain) {
        saveVerifiedDomain(domain, verificationMethod, user.email);
        setVerificationSuccess(true);
        setTimeout(() => {
          setShowVerificationModal(false);
          incrementAuditCount();
          onRunAudit(pendingUrl);
        }, 1200);
      }
    } catch (error) {
      setVerificationError('Verification failed.');
    } finally {
      setIsVerifying(false);
    }
  }, [pendingUrl, verificationMethod, verificationEmail, verificationConfirmed, user, onRunAudit]);

  const handleLoginAndContinue = async () => {
    try {
      await signInWithGoogle();
      setShowAuthModal(false);
      if (siteUrl.trim()) {
        const auditsToday = getAuditsToday();
        if (auditsToday >= MAX_FREE_AUDITS_PER_DAY) {
          setRateLimitError(`Daily limit reached (${MAX_FREE_AUDITS_PER_DAY}).`);
          return;
        }
        const domain = extractDomain(siteUrl);
        if (domain && !isDomainVerifiedForUser(domain, user?.email || '')) {
          startDomainVerification(siteUrl);
        } else {
          incrementAuditCount();
          onRunAudit(siteUrl);
        }
      }
    } catch (error) {
      console.error('Sign in failed:', error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRateLimitError(null);
    if (siteUrl.trim()) {
      if (!user) {
        const auditsToday = getAuditsToday();
        if (auditsToday >= MAX_FREE_AUDITS_PER_DAY) {
          setRateLimitError(`Daily limit reached.`);
          setShowAuthModal(true);
          return;
        }
        setShowAuthModal(true);
        return;
      }
      const domain = extractDomain(siteUrl);
      if (domain && !isDomainVerifiedForUser(domain, user.email)) {
        startDomainVerification(siteUrl);
        return;
      }
      incrementAuditCount();
      onRunAudit(siteUrl);
    } else {
      onOpenCompliance();
    }
  };

  return (
    <div className="bg-[#FAFAF9] dark:bg-slate-950 font-sans text-slate-700 dark:text-slate-300 selection:bg-[#C2410C]/15 selection:text-[#9A3412] pb-20">
      {/* JURISDICTION TOGGLE */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        <div className="flex items-center justify-center gap-2 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm max-w-md mx-auto">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Legal Framework:</span>
          <button
            onClick={() => setJurisdiction?.('IN')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              jurisdiction === 'IN'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-slate-800 dark:text-slate-400'
            }`}
          >
            🇮🇳 India
          </button>
          <button
            onClick={() => setJurisdiction?.('GLOBAL')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              jurisdiction === 'GLOBAL'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-slate-800 dark:text-slate-400'
            }`}
          >
            🌍 Global
          </button>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        <div className="flex items-center justify-center gap-2 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm max-w-md mx-auto">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Legal Framework:</span>
          <button
            onClick={() => setJurisdiction?.('IN')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              jurisdiction === 'IN'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-slate-800 dark:text-slate-400'
            }`}
          >
            🇮🇳 India
          </button>
          <button
            onClick={() => setJurisdiction?.('GLOBAL')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              jurisdiction === 'GLOBAL'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-slate-800 dark:text-slate-400'
            }`}
          >
            🌍 Global
          </button>
        </div>
      </div>

      {/* 1. HERO SECTION */}

      {/* 1. HERO SECTION */}
      <section className="p-4 sm:p-6 max-w-7xl mx-auto">
        <div className="bg-gradient-to-br from-[#C2410C] via-[#C2410C]/95 to-[#9A3412] rounded-[2rem] min-h-[80vh] p-8 sm:p-12 lg:p-16 flex flex-col justify-between relative overflow-hidden transform-gpu" style={{ transform: "perspective(1200px) rotateX(0.5deg)", boxShadow: "0 25px 60px -12px rgba(194, 65, 12, 0.35), 0 0 0 1px rgba(194, 65, 12, 0.1), inset 0 1px 0 rgba(255,255,255,0.1)" }}>

          {/* 3D Floating orb - top right */}
          <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white/5 blur-3xl" style={{ transform: "translateZ(50px)" }}></div>
          {/* 3D Floating orb - bottom left */}
          <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-[#D97706]/10 blur-3xl" style={{ transform: "translateZ(30px)" }}></div>

          <div className="flex justify-between items-start relative z-10 text-white/90">
            <span className="font-semibold text-[11px] sm:text-xs tracking-[0.2em] uppercase" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.2)" }}>Footer &copy; 2026</span>            <span className="font-medium text-[10px] sm:text-[11px] tracking-[0.15em] uppercase max-w-[200px] sm:max-w-xs text-right text-white/70" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.15)" }}>
              Free &bull; India-Compliant &bull; In-Browser
            </span>
          </div>

          <div className="relative z-10 flex flex-col h-full justify-center gap-6 sm:gap-12 my-8 sm:my-10" style={{ transform: "translateZ(40px)" }}>
            <h1 className="text-[3.5rem] sm:text-[5.5rem] lg:text-[7.5rem] font-extralight text-white/90 tracking-[-0.06em] leading-[0.88] text-right" style={{ textShadow: "0 2px 4px rgba(0,0,0,0.15)" }}>
              Smarter <br /> compliance.
            </h1>
            <h1 className="text-[3.5rem] sm:text-[5.5rem] lg:text-[7.5rem] font-semibold text-white tracking-[-0.04em] leading-[0.88]" style={{ textShadow: "0 4px 12px rgba(0,0,0,0.25), 0 1px 3px rgba(0,0,0,0.2)" }}>
              Stronger <br /> business.
            </h1>
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-8 mt-4" style={{ transform: "translateZ(20px)" }}>
            <p className="text-white/80 font-light max-w-sm leading-[1.7] text-sm sm:text-base tracking-wide" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.1)" }}>
              We help Indian companies untangle complex legal challenges and unlock opportunities with clarity, speed, and confidence.
            </p>

          </div>
        </div>
      </section>
      {/* 2. STATS & IMPACT */}
      <section className="scroll-reveal px-4 sm:px-6 max-w-7xl mx-auto mt-4 sm:mt-6">
        <div className="grid lg:grid-cols-2 gap-4 sm:gap-6" style={{ transformStyle: "preserve-3d" }}>
          <div className="p-8 sm:p-12 flex flex-col justify-between bg-white/60 dark:bg-slate-900/60 rounded-[2rem] border border-white/80 dark:border-slate-800 backdrop-blur-sm" style={{ transform: "translateZ(20px)", boxShadow: "0 20px 50px -15px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.03)" }}>
            <h2 className="text-4xl sm:text-6xl font-semibold tracking-[-0.04em] leading-[0.92] text-[#1C1917] dark:text-white mb-12">
              Real <br />measurable <br /><span className="text-[#C2410C]">impact</span>
            </h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-4xl sm:text-5xl font-light tracking-[-0.05em] mb-2 text-[#1C1917] dark:text-white tabular-nums">60<span className="text-2xl sm:text-3xl font-medium text-[#C2410C]">s</span></h3>
                <p className="text-sm font-normal leading-[1.7] text-slate-500 dark:text-slate-400">Average time to generate a production-ready legal policy.</p>
              </div>
              <div>
                <h3 className="text-4xl sm:text-5xl font-light tracking-[-0.05em] mb-2 text-[#1C1917] dark:text-white tabular-nums">₹0</h3>
                <p className="text-sm font-normal leading-[1.7] text-slate-500 dark:text-slate-400">Cost to secure your website against Indian compliance laws.</p>
              </div>
            </div>
          </div>

          <div className="bg-[#C2410C] rounded-[2rem] p-8 sm:p-16 text-white flex flex-col justify-end min-h-[350px] sm:min-h-[400px] relative overflow-hidden" style={{ transform: "translateZ(40px) translateY(-8px)", boxShadow: "0 30px 60px -15px rgba(194, 65, 12, 0.3), 0 0 0 1px rgba(194, 65, 12, 0.1)" }}>
            <div className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full bg-white/5 blur-2xl"></div>
            <h3 className="text-[6rem] sm:text-[9rem] font-extralight tracking-[-0.06em] leading-[0.8] mb-6 relative z-10" style={{ textShadow: "0 4px 12px rgba(0,0,0,0.2)" }}>
              16+
            </h3>
            <p className="text-lg sm:text-xl font-light max-w-sm leading-[1.7] text-white/90 relative z-10">
              Essential legal documents spanning DPDP Act, IT Rules, and Consumer Protection laws.
            </p>
          </div>
        </div>
      </section>

      {/* 3. SERVICES GRID */}
      <section className="scroll-reveal-scale px-4 sm:px-6 max-w-7xl mx-auto mt-4 sm:mt-6">
        <div className="bg-gradient-to-br from-[#C2410C] via-[#C2410C]/90 to-[#9A3412] rounded-[2rem] p-6 sm:p-12 lg:p-16 text-white overflow-hidden" style={{ transform: "perspective(1000px) rotateX(-0.3deg)", boxShadow: "0 25px 50px -12px rgba(154, 52, 18, 0.25), 0 0 0 1px rgba(194, 65, 12, 0.08)" }}>
          <div className="flex justify-between items-start mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-medium tracking-[-0.04em]">Our Legal Services</h2>
            <ArrowUpRight className="w-10 h-10 sm:w-12 sm:h-12 opacity-80" strokeWidth={1.5} />
          </div>

          <div className="grid md:grid-cols-3 gap-0 border-t border-l border-white/20">
            <div className="border-b border-r border-white/20 p-6 sm:p-8">
              <h3 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4">Privacy & Data</h3>
              <p className="text-xs sm:text-sm opacity-80 leading-relaxed">DPDP Act 2023 compliant policies for data collection and user rights.</p>
            </div>
            <div className="border-b border-r border-white/20 p-6 sm:p-8">
              <h3 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4">Terms & Operations</h3>
              <p className="text-xs sm:text-sm opacity-80 leading-relaxed">Limit liability and govern usage with bulletproof service agreements.</p>
            </div>
            <div className="border-b border-r border-white/20 p-6 sm:p-8">
              <h3 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4">E-Commerce</h3>
              <p className="text-xs sm:text-sm opacity-80 leading-relaxed">Refunds, shipping, and return policies covering CPA 2019.</p>
            </div>

            <div className="border-b border-r border-white/20 p-3 sm:p-4 bg-white/5 flex items-center">
              <span className="text-[10px] sm:text-xs uppercase tracking-widest font-semibold">Features</span>
            </div>
            <div className="border-b border-r border-white/20 p-3 sm:p-4 bg-white/5 flex items-center justify-center">
              <span className="text-[10px] sm:text-xs uppercase tracking-widest font-semibold">FOOTER</span>
            </div>
            <div className="border-b border-r border-white/20 p-3 sm:p-4 bg-white/5 flex items-center justify-center text-center">
              <span className="text-[10px] sm:text-xs uppercase tracking-widest font-semibold opacity-60">Lawyer / Agency</span>
            </div>

            {[
              { feature: "Instant Generation", us: true, them: false },
              { feature: "India-Specific Laws", us: true, them: true },
              { feature: "Auto-Updating Embeds", us: true, them: false },
              { feature: "Zero Cost", us: true, them: false },
            ].map((row, i) => (
              <React.Fragment key={i}>
                <div className="border-b border-r border-white/20 p-4 sm:p-6 flex items-center">
                  <span className="text-sm sm:text-lg font-medium">{row.feature}</span>
                </div>
                <div className="border-b border-r border-white/20 p-4 sm:p-6 flex items-center justify-center">
                  {row.us ? (
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white text-[#C2410C] flex items-center justify-center">
                      <Check className="w-3 h-3 sm:w-5 sm:h-5" strokeWidth={3} />
                    </div>
                  ) : (
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-black/20 text-white flex items-center justify-center">
                      <XCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                  )}
                </div>
                <div className="border-b border-r border-white/20 p-4 sm:p-6 flex items-center justify-center">
                  {row.them ? (
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white/20 text-white flex items-center justify-center">
                      <Check className="w-3 h-3 sm:w-5 sm:h-5" strokeWidth={3} />
                    </div>
                  ) : (
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-black/20 text-white flex items-center justify-center">
                      <XCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                  )}
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* 4. BUSINESS TYPE SELECTOR */}
      {/* 4. DOCUMENT INDEX WITH BUSINESS FILTER */}
      <section id="doc-types" className="scroll-reveal px-4 sm:px-6 max-w-7xl mx-auto mt-16 sm:mt-32 mb-16 sm:mb-24">        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12 sm:mb-16 border-t-2 border-[#1A1514] dark:border-white pt-10">
        <div>
          <h2 className="text-5xl sm:text-7xl font-medium tracking-tighter text-[#1A1514] dark:text-white leading-[0.9]">
            Document <br />Index.
          </h2>
        </div>
        <p className="text-xs font-bold uppercase tracking-widest text-[#BD4313] dark:text-orange-500 max-w-[250px] sm:max-w-xs text-left sm:text-right">
          {selectedBiz
            ? `Showing ${BUSINESS_TYPES.find(b => b.id === selectedBiz)?.label} documents`
            : "Select from our curated legal templates, updated for 2026 compliance."}
        </p>
      </div>

        {/* Business Type Filter */}
        <div className="mb-10 sm:mb-14">
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[#BD4313] dark:text-orange-500 mb-4">
            Filter by your business type
          </p>
          <div className="flex flex-wrap gap-2 sm:gap-3 stagger-children">
            <button
              onClick={() => setSelectedBiz(null)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-full text-xs sm:text-sm font-semibold tracking-wide transition-all border",
                !selectedBiz
                  ? "bg-[#1A1514] text-white border-[#1A1514] dark:bg-white dark:text-slate-900 dark:border-white"
                  : "bg-white text-slate-600 border-[#1A1514]/10 hover:border-[#DE5117] hover:text-[#DE5117] dark:bg-slate-900 dark:text-slate-400 dark:border-slate-700 dark:hover:border-orange-500 dark:hover:text-orange-400"
              )}
            >
              All Documents
              <span className={cn(
                "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                !selectedBiz
                  ? "bg-white/20 text-white dark:bg-slate-900/20 dark:text-white"
                  : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-500"
              )}>
                {DOC_CONFIGS.length}
              </span>
            </button>
            {BUSINESS_TYPES.map((biz) => {
              const isSelected = selectedBiz === biz.id;
              return (
                <button
                  key={biz.id}
                  onClick={() => setSelectedBiz(isSelected ? null : biz.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-full text-xs sm:text-sm font-semibold tracking-wide transition-all border",
                    isSelected
                      ? "bg-[#DE5117] text-white border-[#DE5117] shadow-md shadow-[#DE5117]/20"
                      : "bg-white text-slate-600 border-[#1A1514]/10 hover:border-[#DE5117] hover:text-[#DE5117] dark:bg-slate-900 dark:text-slate-400 dark:border-slate-700 dark:hover:border-orange-500 dark:hover:text-orange-400"
                  )}
                >
                  {biz.icon}
                  <span className="hidden sm:inline">{biz.label}</span>
                  <span className="sm:hidden">{biz.label.split(' / ')[0]}</span>
                  <span className={cn(
                    "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                    isSelected
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-500"
                  )}>
                    {biz.docs.length}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active filter banner */}
        {selectedBiz && (
          <div className="mb-8 flex items-center gap-3 p-4 rounded-2xl bg-[#DE5117]/5 border border-[#DE5117]/10">
            <div className="w-8 h-8 rounded-lg bg-[#DE5117] text-white flex items-center justify-center shrink-0">
              {BUSINESS_TYPES.find(b => b.id === selectedBiz)?.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-[#1A1514] dark:text-white">
                {BUSINESS_TYPES.find(b => b.id === selectedBiz)?.label}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {BUSINESS_TYPES.find(b => b.id === selectedBiz)?.docs.length} recommended documents for this business type
              </p>
            </div>
            <button
              onClick={() => setSelectedBiz(null)}
              className="text-xs font-bold text-[#BD4313] dark:text-orange-500 hover:underline uppercase tracking-widest shrink-0"
            >
              Clear
            </button>
          </div>
        )}

        {/* Document List */}
        <div className="flex flex-col border-t border-[#1A1514]/10 dark:border-white/10">
          {DOC_CONFIGS.filter((doc) => {
            if (!selectedBiz) return true;
            const biz = BUSINESS_TYPES.find(b => b.id === selectedBiz);
            return biz?.docs.includes(doc.type);
          }).map((doc, index) => {
            const bizType = BUSINESS_TYPES.find(b => b.id === selectedBiz);
            const isRecommended = bizType?.docs.includes(doc.type);
            return (
              <button
                key={doc.type}
                onClick={() => onSelectDoc(doc.type)}
                className="group w-full text-left flex flex-col md:flex-row md:items-center justify-between py-6 sm:py-8 border-b border-[#1A1514]/10 dark:border-white/10 hover:bg-[#DE5117] hover:px-6 sm:hover:px-10 transition-all duration-500 focus:outline-none overflow-hidden"
              >
                <div className="flex items-baseline gap-6 sm:gap-12 md:w-1/2">
                  <span className="text-xs sm:text-sm font-bold uppercase tracking-widest text-[#BD4313] dark:text-orange-500 group-hover:text-white/70 transition-colors">
                    {(index + 1).toString().padStart(2, '0')}
                  </span>
                  <div>
                    <h3 className="text-3xl sm:text-4xl font-medium text-[#1A1514] dark:text-white tracking-tighter group-hover:text-white transition-colors">
                      {doc.title}
                    </h3>
                    <div className="flex md:hidden gap-3 mt-3">
                      {doc.laws.slice(0, 2).map((law) => (
                        <span key={law} className="text-[9px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 group-hover:text-white/60">
                          {law}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="hidden md:block md:w-1/3 pr-8">
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed group-hover:text-white/80 transition-colors line-clamp-2">
                    {doc.description}
                  </p>
                </div>

                <div className="hidden md:flex md:w-1/6 justify-end items-center gap-3">
                  {selectedBiz && isRecommended && (
                    <span className="text-[9px] font-bold uppercase tracking-widest text-[#DE5117] group-hover:text-white/70 bg-[#DE5117]/10 group-hover:bg-white/20 px-2.5 py-1 rounded-full transition-colors">
                      Recommended
                    </span>
                  )}
                  <div className="opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white transform translate-x-8 group-hover:translate-x-0">
                    Draft <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>

      </section>
      {/* 5. CONTACT / AUDIT FORM */}
      <section className="scroll-reveal-left px-4 sm:px-6 max-w-7xl mx-auto mt-4 sm:mt-6">
        <div className="grid lg:grid-cols-2 rounded-[2rem] overflow-hidden bg-white dark:bg-slate-900 border border-[#1C1917]/5 dark:border-slate-800" style={{ transformStyle: "preserve-3d", boxShadow: "0 20px 50px -12px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.03)" }}>

          <div className="bg-gradient-to-br from-[#C2410C] to-[#9A3412] p-8 sm:p-12 lg:p-16 flex flex-col justify-between text-white relative overflow-hidden" style={{ transform: "translateZ(20px)" }}>
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5 blur-2xl"></div>
            <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-[#D97706]/10 blur-2xl"></div>
            <div className="relative z-10">
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-[-0.04em] leading-[0.88] mb-6" style={{ textShadow: "0 2px 8px rgba(0,0,0,0.2)" }}>
                Every website <br />is unique.<br />Let's check yours.
              </h2>
              <p className="text-white/80 font-light mt-4 sm:mt-6 max-w-sm text-sm sm:text-base leading-[1.7] tracking-wide">
                Run a free automated audit to see which mandatory legal pages your website is missing.
              </p>
            </div>
            <div className="relative z-10 mt-12 sm:mt-16 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.15em] opacity-70">
              <span>support.footer@gmail.com</span>
              <span>100% Secure</span>
            </div>
          </div>

          <div className="bg-[#FAFAF9] dark:bg-slate-900 p-8 sm:p-12 lg:p-16 flex flex-col justify-center">
            <form className="space-y-8 sm:space-y-10" onSubmit={handleSubmit}>
              <div>
                <label className="text-[#9A3412] dark:text-orange-500 text-[10px] sm:text-xs uppercase tracking-widest font-bold mb-1 block">
                  Website URL *
                </label>
                <input
                  type="text"
                  required
                  placeholder="https://yourwebsite.com"
                  value={siteUrl}
                  onChange={(e) => setSiteUrl(e.target.value)}
                  className="w-full bg-transparent border-b-2 border-[#9A3412]/30 py-2 text-lg sm:text-xl text-slate-900 dark:text-white focus:outline-none focus:border-[#C2410C] transition-colors placeholder:text-[#9A3412]/40"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-[#C2410C] hover:bg-[#9A3412] text-white font-semibold uppercase tracking-[0.15em] text-xs sm:text-sm py-4 sm:py-5 rounded-full transition-all duration-300 mt-2 sm:mt-4 hover:-translate-y-0.5 active:translate-y-0"
                style={{ boxShadow: "0 8px 25px -5px rgba(194, 65, 12, 0.35), 0 4px 10px -3px rgba(194, 65, 12, 0.2), inset 0 1px 0 rgba(255,255,255,0.15)" }}
              >
                Run Compliance Audit
              </button>
              <p className="text-center text-[9px] sm:text-[10px] text-[#9A3412]/60 dark:text-slate-500 uppercase tracking-widest font-bold">
                Your data is strictly processed client-side.
              </p>
            </form>
          </div>
        </div>
      </section>

      {/* AUTHENTICATION MODAL */}
      {showAuthModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowAuthModal(false)}
          />
          
          {/* Modal Content */}
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-8 border border-slate-200 dark:border-slate-700">
            {/* Icon */}
            <div className="w-16 h-16 mx-auto mb-6 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
              <ShieldCheck className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            
            {/* Title */}
            <h3 className="text-2xl font-semibold text-slate-900 dark:text-white text-center mb-3">
              Sign In Required
            </h3>
            
            {/* Explanation */}
            <p className="text-sm text-slate-600 dark:text-slate-400 text-center mb-6 leading-relaxed">
              {rateLimitError ? (
                <span className="text-amber-600 dark:text-amber-400">{rateLimitError}</span>
              ) : (
                <>Sign in to run compliance audits and access all features. Your audit history will be saved securely to your account.</>
              )}
            </p>
            
            {/* Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleLoginAndContinue}
                className="w-full flex items-center justify-center gap-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-medium py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-600 transition-colors"
              >
                {/* Google SVG Icon */}
                <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                  <path d="M9.003 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9.003 18z" fill="#34A853"/>
                  <path d="M3.964 10.712c-.18-.54-.282-1.117-.282-1.712s.102-1.172.282-1.712V5.011H.957C.347 6.229 0 7.61 0 9s.348 2.771.957 3.989l3.007-2.277z" fill="#FBBC05"/>
                  <path d="M9.003 3.46c1.317 0 2.5.454 3.435 1.345l2.573-2.573C13.463.891 11.426 0 9.003 0 5.482 0 2.438 2.017.957 5.01L3.964 7.27c.708-2.127 2.692-3.71 5.036-3.71z" fill="#EA4335"/>
                </svg>
                Sign in with Google
              </button>
              
              <button
                onClick={() => setShowAuthModal(false)}
                className="w-full py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Cancel
              </button>
            </div>
            
            {/* Security Note */}
            <p className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-500 text-center flex items-center justify-center gap-1.5">
              <Lock className="w-3 h-3" />
              Secure authentication via Google OAuth
            </p>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          🔒 DOMAIN VERIFICATION MODAL (PROFESSIONAL VERSION)
         ═══════════════════════════════════════════════════════ */}
      {showVerificationModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => !isVerifying && setShowVerificationModal(false)}
          />
          
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-700">
            
            {/* Header - Professional Clean Design */}
            <div className="p-8 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-50 to-orange-50 dark:from-slate-900 dark:to-orange-950/20">
              {!verificationSuccess ? (
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#C2410C]/10 rounded-xl flex items-center justify-center">
                      <ShieldAlert className="w-6 h-6 text-[#C2410C]" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                        Domain Verification Required
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Prove you own this website to run a compliance audit
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => !isVerifying && setShowVerificationModal(false)}
                    className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <XCircle className="w-5 h-5 text-slate-400" />
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                    Domain Verified Successfully!
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {extractDomain(pendingUrl)} has been verified
                  </p>
                </div>
              )}
            </div>
            
            {!verificationSuccess ? (
              <>
                {/* Domain Being Verified */}
                <div className="px-8 py-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-[#C2410C]" />
                    <span className="text-sm text-slate-600 dark:text-slate-300">Website:</span>
                    <code className="px-3 py-1 bg-white dark:bg-slate-900 rounded-lg text-sm font-mono text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700">
                      {extractDomain(pendingUrl)}
                    </code>
                  </div>
                </div>

                {/* Step Indicator */}
                <div className="px-8 py-4 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#C2410C] text-white text-[10px]">1</span>
                    <span>Choose Method</span>
                    <ChevronRight className="w-4 h-4" />
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 text-[10px]">2</span>
                    <span>Follow Instructions</span>
                    <ChevronRight className="w-4 h-4" />
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 text-[10px]">3</span>
                    <span>Confirm & Verify</span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-8 space-y-6">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-wider">
                      Select Verification Method
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-3">
                      {/* Method Cards */}
                      {[
                        { id: 'file' as const, icon: FileText, title: 'HTML File', desc: 'Upload a file to your server' },
                        { id: 'meta' as const, icon: Code, title: 'Meta Tag', desc: 'Add code to &lt;head&gt;' },
                        { id: 'dns' as const, icon: Server, title: 'DNS Record', desc: 'Add TXT record to DNS' },
                        { id: 'email' as const, icon: Mail, title: 'Email', desc: 'Verify via domain email' },
                      ].map((method) => (
                        <button
                          key={method.id}
                          onClick={() => setVerificationMethod(method.id)}
                          className={`p-4 rounded-xl border-2 text-left transition-all ${
                            verificationMethod === method.id
                              ? 'border-[#C2410C] bg-[#C2410C]/5 shadow-sm'
                              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                              verificationMethod === method.id 
                                ? 'bg-[#C2410C] text-white' 
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                            }`}>
                              <method.icon className="w-4 h-4" />
                            </div>
                            <div>
                              <div className={`font-semibold text-sm ${
                                verificationMethod === method.id 
                                  ? 'text-[#C2410C]' 
                                  : 'text-slate-900 dark:text-white'
                              }`}>{method.title}</div>
                              <div className="text-xs text-slate-500">{method.desc}</div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Instructions Panel */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2 mb-3">
                      <Lightbulb className="w-4 h-4 text-amber-500" />
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                        Step-by-Step Instructions
                      </h4>
                    </div>
                    
                    {verificationMethod === 'file' && (
                      <ol className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
                        <li className="flex gap-3">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#C2410C] text-white text-xs flex items-center justify-center font-bold">1</span>
                          <div>Create a file named <code className="bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded text-xs font-mono">legalgen-verify.html</code></div>
                        </li>
                        <li className="flex gap-3">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#C2410C] text-white text-xs flex items-center justify-center font-bold">2</span>
                          <div>Add this content to the file:</div>
                        </li>
                        <li className="ml-9">
                          <div className="relative group">
                            <pre className="bg-slate-900 text-emerald-400 p-3 rounded-lg text-xs font-mono overflow-x-auto"><code>{`<!DOCTYPE html>
<html>
<head><title>Verification</title></head>
<body>
<span data-legalgen="${verificationToken}">${verificationToken}</span>
</body>
</html>`}</code></pre>
                            <button 
                              onClick={() => copyToClipboard(verificationToken)}
                              className="absolute top-2 right-2 p-1.5 bg-slate-700 hover:bg-slate-600 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Copy token"
                            >
                              <Copy className="w-4 h-4 text-slate-300" />
                            </button>
                          </div>
                        </li>
                        <li className="flex gap-3">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#C2410C] text-white text-xs flex items-center justify-center font-bold">3</span>
                          <div>Upload to: <code className="bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded text-xs font-mono">https://{extractDomain(pendingUrl)}/legalgen-verify.html</code></div>
                        </li>
                      </ol>
                    )}

                    {verificationMethod === 'meta' && (
                      <ol className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
                        <li className="flex gap-3">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#C2410C] text-white text-xs flex items-center justify-center font-bold">1</span>
                          <div>Open your website's HTML file</div>
                        </li>
                        <li className="flex gap-3">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#C2410C] text-white text-xs flex items-center justify-center font-bold">2</span>
                          <div>Add this inside <code className="bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded text-xs font-mono">&lt;head&gt;</code> section:</div>
                        </li>
                        <li className="ml-9">
                          <div className="relative group">
                            <pre className="bg-slate-900 text-emerald-400 p-3 rounded-lg text-xs font-mono"><code>{`<meta name="legalgen-verification" content="${verificationToken}" />`}</code></pre>
                            <button 
                              onClick={() => copyToClipboard(`<meta name="legalgen-verification" content="${verificationToken}" />`)}
                              className="absolute top-2 right-2 p-1.5 bg-slate-700 hover:bg-slate-600 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Copy className="w-4 h-4 text-slate-300" />
                            </button>
                          </div>
                        </li>
                        <li className="flex gap-3">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#C2410C] text-white text-xs flex items-center justify-center font-bold">3</span>
                          <div>Save and upload the updated file</div>
                        </li>
                      </ol>
                    )}

                    {verificationMethod === 'dns' && (
                      <div className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
                        <p>Go to your DNS provider (Cloudflare, GoDaddy, etc.) and add:</p>
                        <div className="bg-white dark:bg-slate-900 rounded-lg overflow-hidden border border-slate-200">
                          <table className="w-full text-xs">
                            <thead className="bg-slate-100 dark:bg-slate-800">
                              <tr>
                                <th className="text-left p-2 font-semibold text-slate-700 dark:text-slate-300">Type</th>
                                <th className="text-left p-2 font-semibold text-slate-700 dark:text-slate-300">Host</th>
                                <th className="text-left p-2 font-semibold text-slate-700 dark:text-slate-300">Value</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr className="border-t border-slate-200">
                                <td className="p-2"><code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">TXT</code></td>
                                <td className="p-2"><code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">@</code></td>
                                <td className="p-2 break-all"><code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">legalgen-verify={verificationToken}</code></td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                        <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          DNS changes may take up to 48 hours to propagate
                        </p>
                      </div>
                    )}

                    {verificationMethod === 'email' && (
                      <div className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
                        <p><strong>Enter an email address at your domain:</strong></p>
                        <p className="text-xs">The verification link will be sent to this address. You must have access to receive emails here.</p>
                        
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Mail className="w-4 h-4 text-[#C2410C]" />
                          </div>
                          <input
                            type="email"
                            value={verificationEmail}
                            onChange={(e) => setVerificationEmail(e.target.value)}
                            placeholder={`admin@${extractDomain(pendingUrl)}`}
                            className="w-full pl-10 pr-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-sm focus:ring-2 focus:ring-[#C2410C] focus:border-transparent outline-none transition-all"
                          />
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 space-y-2">
                          <p className="text-xs font-medium text-slate-700 dark:text-slate-300">Common options:</p>
                          <div className="flex flex-wrap gap-2">
                            {['admin', 'webmaster', 'postmaster', 'info', 'contact'].map((prefix) => (
                              <button
                                key={prefix}
                                onClick={() => setVerificationEmail(`${prefix}@${extractDomain(pendingUrl)}`)}
                                className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-xs font-mono hover:border-[#C2410C] hover:text-[#C2410C] transition-colors"
                              >
                                {prefix}@{extractDomain(pendingUrl)}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                          <p className="text-xs text-amber-700 dark:text-amber-400 flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                            <span><strong>Important:</strong> You must have access to receive emails at this domain address. The email contains a verification link you'll need to click to prove ownership.</span>
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Confirmation Checkbox */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={verificationConfirmed}
                        onChange={(e) => {
                          setVerificationConfirmed(e.target.checked);
                          if (e.target.checked) {
                            setVerificationError(null); // Clear error when checked
                          }
                        }}
                        className="mt-1 w-4 h-4 rounded border-slate-300 text-[#C2410C] focus:ring-[#C2410C]" 
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">
                        I have completed the verification steps above and confirm that I own this website. I understand that unauthorized access to someone else's website is a security violation.
                      </span>
                    </label>
                  </div>

                  {/* Error Message */}
                  {verificationError && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start gap-3">
                      <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                      <p className="text-sm text-red-700 dark:text-red-400">{verificationError}</p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={performDomainVerification}
                      disabled={isVerifying}
                      className="flex-1 bg-[#C2410C] hover:bg-[#9A3412] disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-wider"
                    >
                      {isVerifying ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Verifying Domain...
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-5 h-5" />
                          Confirm & Run Audit
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setShowVerificationModal(false)}
                      disabled={isVerifying}
                      className="py-4 px-6 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </>
            ) : (
              /* Success State */
              <div className="p-8">
                <div className="text-center mb-6">
                  <p className="text-slate-600 dark:text-slate-400 mb-4">
                    Your domain has been successfully verified. Starting compliance audit now...
                  </p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6">
                  <div className="flex items-center justify-center gap-3">
                    <Loader2 className="w-5 h-5 text-[#C2410C] animate-spin" />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Running compliance audit for {extractDomain(pendingUrl)}...
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="px-8 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <Lock className="w-3 h-3" />
                  Secure Verification
                </span>
                <span className="flex items-center gap-1.5">
                  {user ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-green-500" />
                      Authenticated
                    </>
                  ) : (
                    'Not authenticated'
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. WHO IS THIS FOR */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16 sm:pb-24">
        <div className="border-t border-[#1C1917]/10 dark:border-white/10 pt-12 sm:pt-16">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[#9A3412] dark:text-orange-500 mb-10 sm:mb-14">
            Built for
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-[#1C1917]/10 dark:bg-white/10 rounded-xl overflow-hidden">
            {[
              {
                title: "SaaS Founders",
                desc: "Generate privacy policies and terms that cover DPDP Act, IT Rules, and international GDPR if you have EU users."
              },
              {
                title: "D2C & E-Commerce",
                desc: "Refund, shipping, return, and cancellation policies that comply with Consumer Protection Act 2019 and E-Commerce Rules 2020."
              },
              {
                title: "Indie Developers",
                desc: "Ship your side project or MVP with proper legal pages from day one. No lawyer fees, no delays."
              },
              {
                title: "Content Platforms",
                desc: "DMCA takedown policy, content moderation guidelines, and community guidelines covering IT Act Section 67 and 79."
              },
              {
                title: "Agencies & Freelancers",
                desc: "Quickly generate compliant documents for every client project instead of copy-pasting from old templates."
              },
              {
                title: "Startups Raising Funding",
                desc: "SLAs, DPAs, and EULAs that look professional to investors and protect your business from day one."
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-[#FAFAF9] dark:bg-slate-950 p-6 sm:p-8 hover:bg-white dark:hover:bg-slate-900 transition-colors duration-300"
              >
                <h3 className="text-sm font-semibold text-[#1C1917] dark:text-white mb-2 tracking-tight">{item.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-[1.7]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. TRUST SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16 sm:pb-24">
        <div className="border-t border-[#1C1917]/10 dark:border-white/10 pt-12 sm:pt-16">
          <div className="max-w-2xl mb-10 sm:mb-14">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[#9A3412] dark:text-orange-500 mb-4">
              Why teams trust FOOTER
            </h2>
            <p className="text-2xl sm:text-3xl font-medium tracking-[-0.03em] text-[#1C1917] dark:text-white leading-snug">
              &ldquo;We went from no legal pages to fully compliant in 20 minutes. For a bootstrapped startup, that&apos;s priceless.&rdquo;
            </p>
            <div className="flex items-center gap-3 mt-6">
              <div className="w-10 h-10 rounded-full bg-[#C2410C] flex items-center justify-center text-white text-sm font-bold">
                R
              </div>
              <div>
                <p className="text-sm font-semibold text-[#1C1917] dark:text-white">Rahul M.</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Founder, FinStack (YC S24)</p>
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-[#1C1917]/8 dark:border-slate-800" style={{ boxShadow: "0 4px 20px -4px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.02)" }}>
              <div className="w-8 h-8 rounded-lg bg-[#C2410C]/10 flex items-center justify-center mb-4">
                <Lock className="w-4 h-4 text-[#C2410C]" />
              </div>
              <h3 className="text-sm font-semibold text-[#1C1917] dark:text-white mb-1.5 tracking-tight">100% client-side</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-[1.7]">
                Your business data never leaves your browser. No accounts, no databases, no tracking.
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-[#1C1917]/8 dark:border-slate-800" style={{ boxShadow: "0 4px 20px -4px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.02)" }}>
              <div className="w-8 h-8 rounded-lg bg-[#C2410C]/10 flex items-center justify-center mb-4">
                <Scale className="w-4 h-4 text-[#C2410C]" />
              </div>
              <h3 className="text-sm font-semibold text-[#1C1917] dark:text-white mb-1.5 tracking-tight">Indian law specific</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-[1.7]">
                Not a generic US legal template. Every document references DPDP Act, IT Act, CPA 2019, and relevant rules.
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-[#1C1917]/8 dark:border-slate-800" style={{ boxShadow: "0 4px 20px -4px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.02)" }}>
              <div className="w-8 h-8 rounded-lg bg-[#C2410C]/10 flex items-center justify-center mb-4">
                <Zap className="w-4 h-4 text-[#C2410C]" />
              </div>
              <h3 className="text-sm font-semibold text-[#1C1917] dark:text-white mb-1.5 tracking-tight">Ready in 60 seconds</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-[1.7]">
                Answer a few questions about your business, get a production-ready document. No waiting, no back-and-forth.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 8. FAQ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16 sm:pb-24">
        <div className="border-t border-[#1C1917]/10 dark:border-white/10 pt-12 sm:pt-16">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[#9A3412] dark:text-orange-500 mb-10 sm:mb-14">
            Common questions
          </h2>
          <div className="max-w-2xl divide-y divide-[#1C1917]/10 dark:divide-white/10">
            {[
              {
                q: "Is this legal advice?",
                a: "No. FOOTER generates document templates based on Indian legal frameworks. For your specific situation, you should consult a qualified lawyer. Think of this as a strong starting point."
              },
              {
                q: "Is my data stored anywhere?",
                a: "No. Everything runs in your browser. Your answers, your generated documents — none of it is sent to any server. You can verify this by checking your browser's Network tab."
              },
              {
                q: "Which laws do the documents comply with?",
                a: "Documents reference the IT Act 2000, DPDP Act 2023, IT Rules 2021, Consumer Protection Act 2019, E-Commerce Rules 2020, Copyright Act 1957, and other relevant Indian legislation depending on the document type."
              },
              {
                q: "Can I edit the generated document?",
                a: "Yes. You can copy the HTML or plain text and modify it however you want. The generated document is a solid baseline — add your specific business details and you're good to go."
              },
              {
                q: "Do I need to create an account?",
                a: "No. You can generate and download documents without signing up. If you want to save documents to a dashboard, you can sign in with Google — but it's entirely optional."
              },
            ].map((faq) => (
              <div key={faq.q} className="py-6 first:pt-0 last:pb-0">
                <h3 className="text-sm font-semibold text-[#1C1917] dark:text-white mb-2 tracking-tight">{faq.q}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-[1.7]">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
    </section>
    </div>
  );
}
/* ==========================================
   FOOTER GENERATOR (Pasted directly here)
   ========================================== */
function generateFooterHTML(
  jurisdiction: 'IN' | 'GLOBAL', 
  documentType: string, 
  isProUser: boolean
): string {
  const currentDate = new Date().toLocaleDateString('en-IN', { 
    year: 'numeric', month: 'long', day: 'numeric' 
  });

  const jurisdictionText = jurisdiction === 'IN' 
    ? 'the Information Technology Act 2000, the Digital Personal Data Protection (DPDP) Act 2023, and the Consumer Protection Act 2019' 
    : 'general international standards, including GDPR and CCPA principles';
  
  const badge = jurisdiction === 'IN' 
    ? '<span style="background:#ecfdf5;color:#065f46;padding:4px 10px;border-radius:999px;font-size:11px;font-weight:600;border:1px solid #a7f3d0;">🇮🇳 DPDP Act Ready</span>'
    : '<span style="background:#eff6ff;color:#1e40af;padding:4px 10px;border-radius:999px;font-size:11px;font-weight:600;border:1px solid #bfdbfe;">🌍 GDPR Aligned</span>';

  // IMPORTANT: Change 'https://your-footer-domain.com' to your actual website URL!
  const attribution = !isProUser ? `
    <div style="margin-top:24px;text-align:center;font-size:13px;color:#6b7280;border-top:1px dashed #d1d5db;padding-top:16px;">
      Generated by <a href="https://your-footer-domain.com" target="_blank" style="font-weight:bold;color:#4f46e5;text-decoration:underline;">FOOTER</a>. 
      <a href="https://your-footer-domain.com/pricing" target="_blank" style="color:#4f46e5;font-weight:600;text-decoration:none;">Upgrade to Pro</a> to remove this attribution, unlock PDF/DOCX exports, and enable auto-updating policies.
    </div>
  ` : '';

  return `
    <div style="margin-top:48px;padding-top:32px;border-top:2px solid #e5e7eb;font-size:14px;color:#4b5563;font-family:system-ui, -apple-system, sans-serif;">
      <div style="background:#f9fafb;padding:20px;border-radius:8px;border:1px solid #e5e7eb;margin-bottom:20px;">
        <p style="font-weight:700;color:#1f2937;margin:0 0 10px 0;font-size:15px;">⚖️ Legal Disclaimer</p>
        <p style="line-height:1.6;margin:0;font-size:13px;">
          This ${documentType} is a template generated for informational purposes based on the details provided. 
          It is designed to align with ${jurisdictionText}. 
          This document does not constitute formal legal advice. We strongly recommend having a qualified legal professional in your jurisdiction review this document before publication to ensure full compliance with your specific business operations.
        </p>
      </div>

      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px;font-size:12px;color:#6b7280;">
        <div>
          <p style="margin:0 0 4px 0;">Generated on: <span style="font-weight:600;color:#374151;">${currentDate}</span></p>
          <p style="margin:0;">Jurisdiction Framework: <span style="font-weight:600;color:#374151;">${jurisdiction === 'IN' ? 'India' : 'Global'}</span></p>
        </div>
        <div style="display:flex;gap:8px;align-items:center;">
          ${badge}
          <span style="background:#f3f4f6;color:#374151;padding:4px 10px;border-radius:999px;font-size:11px;font-weight:600;border:1px solid #d1d5db;">AI-Assisted Draft</span>
        </div>
      </div>

      ${attribution}
    </div>
  `;
}