// ─── JURISDICTION SELECTOR COMPONENT ───────────────────────────────────────
// Professional jurisdiction selector for multi-region LegalGen
// Supports: India (IN), EU, USA/California (US-CA), USA Federal (US), UK, GLOBAL

"use client";

import React from 'react';
import { Globe, ChevronDown, Check, Shield, Scale, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Jurisdiction, JurisdictionConfig } from '@/lib/legalgen/types';
import { JURISDICTION_CONFIGS } from '@/lib/legalgen/types';

interface JurisdictionSelectorProps {
  value: Jurisdiction;
  onChange: (jurisdiction: Jurisdiction) => void;
  className?: string;
  showDetails?: boolean;
}

export function JurisdictionSelector({ 
  value, 
  onChange, 
  className,
  showDetails = true 
}: JurisdictionSelectorProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  
  // ALL jurisdictions from the type definition
  const jurisdictions: Jurisdiction[] = ['IN', 'EU', 'US-CA', 'US', 'UK', 'GLOBAL'];
  
  const currentConfig = JURISDICTION_CONFIGS[value];
  
  return (
    <div className={cn("relative", className)}>
      {/* Label */}
      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
        <Globe className="w-4 h-4 inline mr-1 -mt-0.5" />
        Select Your Legal Jurisdiction
      </label>
      
      {/* Selected Value Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between px-4 py-3 rounded-xl",
          "bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700",
          "hover:border-blue-400 dark:hover:border-blue-500",
          "transition-all duration-200 shadow-sm",
          "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        )}
      >
        <span className="flex items-center gap-3">
          <span className="text-2xl">{currentConfig.flag}</span>
          <div className="text-left">
            <span className="font-bold text-slate-900 dark:text-white block">
              {currentConfig.name}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {currentConfig.primaryLaw.split('(')[0].trim()}
            </span>
          </div>
        </span>
        <ChevronDown 
          className={cn(
            "w-5 h-5 text-slate-400 transition-transform duration-200",
            isOpen && "rotate-180"
          )} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)} 
          />
          
          {/* Dropdown */}
          <div className="absolute z-50 w-full mt-2 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-2">
              {jurisdictions.map((jur) => {
                const config = JURISDICTION_CONFIGS[jur];
                const isSelected = jur === value;
                
                return (
                  <button
                    key={jur}
                    type="button"
                    onClick={() => {
                      onChange(jur);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-150",
                      "hover:bg-slate-100 dark:hover:bg-slate-700",
                      isSelected && "bg-blue-50 dark:bg-blue-900/20"
                    )}
                  >
                    <span className="text-2xl">{config.flag}</span>
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "font-semibold",
                          isSelected ? "text-blue-600 dark:text-blue-400" : "text-slate-900 dark:text-white"
                        )}>
                          {config.name}
                        </span>
                        {isSelected && (
                          <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        )}
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {config.region} • {config.authority.split(' ')[0]}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
            
            {/* Footer Info */}
            <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>
                  Choosing the correct jurisdiction ensures your documents comply with local laws. 
                  Not sure? Consult a legal professional in your region.
                </span>
              </p>
            </div>
          </div>
        </>
      )}

      {/* Details Panel (when selected) */}
      {showDetails && currentConfig && (
        <JurisdictionDetailsCard config={currentConfig} />
      )}
    </div>
  );
}

// ─── JURISDICTION DETAILS CARD ──────────────────────────────────────────────

interface JurisdictionDetailsCardProps {
  config: JurisdictionConfig;
}

function JurisdictionDetailsCard({ config }: JurisdictionDetailsCardProps) {
  return (
    <div className="mt-4 p-4 rounded-xl bg-linear-to-br from-slate-50 to-blue-50/50 dark:from-slate-800/50 dark:to-blue-900/10 border border-slate-200 dark:border-slate-700">
      <div className="flex items-start gap-3">
        <div className="text-3xl">{config.flag}</div>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
            {config.name} Compliance
            <Scale className="w-4 h-4 text-blue-500" />
          </h4>
          
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
            Documents generated will comply with:
          </p>
          
          <ul className="mt-2 space-y-1">
            <li className="text-sm font-medium text-slate-700 dark:text-slate-300">
              <Shield className="w-3.5 h-3.5 inline mr-1 text-green-500" />
              {config.primaryLaw}
            </li>
            {config.secondaryLaws.slice(0, 2).map((law, i) => (
              <li key={i} className="text-sm text-slate-600 dark:text-slate-400 ml-5">
                • {law}
              </li>
            ))}
          </ul>
          
          <div className="mt-3 pt-3 border-t border-slate-200/50 dark:border-slate-700/50">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-500 dark:text-slate-400">Authority:</span>
                <p className="font-medium text-slate-800 dark:text-slate-200 truncate">
                  {config.authority.split(',')[0]}
                </p>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">Max Penalty:</span>
                <p className="font-medium text-red-600 dark:text-red-400 truncate">
                  {config.maxFine}
                </p>
              </div>
            </div>
          </div>
          
          {/* Key Features */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {config.features.filter(f => f.required).slice(0, 3).map(feature => (
              <span 
                key={feature.id}
                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md text-[11px] font-medium"
              >
                ✓ {feature.name}
              </span>
            ))}
            {config.features.length > 3 && (
              <span className="inline-flex items-center px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-md text-[11px] font-medium">
                +{config.features.length - 3} more
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── JURISDICTION BADGE (Compact Version) ────────────────────────────────────

interface JurisdictionBadgeProps {
  jurisdiction: Jurisdiction;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
}

export function JurisdictionBadge({ 
  jurisdiction, 
  size = 'md',
  showName = true 
}: JurisdictionBadgeProps) {
  const config = JURISDICTION_CONFIGS[jurisdiction];
  
  const sizes = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5'
  };
  
  return (
    <span 
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium",
        "bg-linear-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20",
        "border border-blue-200 dark:border-blue-800/30",
        "text-blue-700 dark:text-blue-300",
        sizes[size]
      )}
    >
      <span>{config.flag}</span>
      {showName && <span>{config.name}</span>}
    </span>
  );
}

// ─── JURISDICTION COMPARISON TABLE ─────────────────────────────────────────

export function JurisdictionComparison() {
  const jurisdictions: Jurisdiction[] = ['IN', 'EU', 'US-CA', 'US', 'UK', 'GLOBAL'];
  
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-100 dark:bg-slate-800">
            <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Feature</th>
            {jurisdictions.map(jur => (
              <th key={jur} className="px-4 py-3 text-center font-semibold text-slate-700 dark:text-slate-300">
                {JURISDICTION_CONFIGS[jur].flag} {JURISDICTION_CONFIGS[jur].name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-slate-200 dark:border-slate-700">
            <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">Primary Law</td>
            {jurisdictions.map(jur => (
              <td key={jur} className="px-4 py-3 text-center text-slate-600 dark:text-slate-400 text-xs">
                {JURISDICTION_CONFIGS[jur].primaryLaw.split('(')[0].trim()}
              </td>
            ))}
          </tr>
          <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
            <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">Max Fine</td>
            {jurisdictions.map(jur => (
              <td key={jur} className="px-4 py-3 text-center text-red-600 dark:text-red-400 text-xs font-medium">
                {JURISDICTION_CONFIGS[jur].maxFine}
              </td>
            ))}
          </tr>
          <tr className="border-b border-slate-200 dark:border-slate-700">
            <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">DPO Required</td>
            {jurisdictions.map(jur => (
              <td key={jur} className="px-4 py-3 text-center">
                {JURISDICTION_CONFIGS[jur].features.find(f => f.id === 'dpo')?.required ? (
                  <span className="text-green-600 dark:text-green-400">✓ Yes</span>
                ) : (
                  <span className="text-slate-400">○ Optional</span>
                )}
              </td>
            ))}
          </tr>
          <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
            <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">Data Portability</td>
            {jurisdictions.map(jur => (
              <td key={jur} className="px-4 py-3 text-center">
                {JURISDICTION_CONFIGS[jur].features.find(f => f.id === 'data-portability') ? (
                  <span className="text-green-600 dark:text-green-400">✓ Yes</span>
                ) : (
                  <span className="text-slate-400">—</span>
                )}
              </td>
            ))}
          </tr>
          <tr>
            <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">Right to Erasure/Opt-out</td>
            {jurisdictions.map(jur => (
              <td key={jur} className="px-4 py-3 text-center">
                {JURISDICTION_CONFIGS[jur].features.find(f => f.id === 'erasure-right' || f.id === 'opt-out') ? (
                  <span className="text-green-600 dark:text-green-400">✓ Yes</span>
                ) : (
                  <span className="text-slate-400">—</span>
                )}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// Export types for use in other components
export type { Jurisdiction, JurisdictionConfig };
export { JURISDICTION_CONFIGS };