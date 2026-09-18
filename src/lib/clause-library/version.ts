/**
 * Versioning for legal content. Foundation for P2-04 (law-change pipeline)
 * and the honest form of the "auto-updating policies" claim that F-10 found
 * being made with no mechanism behind it.
 *
 * Bump CLAUSE_LIBRARY_VERSION whenever clause TEXT or statutory mapping
 * changes. Every stored document version records which library produced it,
 * so you can answer "which of my customers is on outdated text?" with a query
 * instead of a guess.
 */
export const CLAUSE_LIBRARY_VERSION = '2026.09.1';

/** Bump when the rendering pipeline changes but clause text does not. */
export const GENERATOR_VERSION = '2.0.0';

export interface LibraryChange {
    version: string;
    date: string;
    jurisdictions: string[];
    affectedDocumentTypes: string[];
    summary: string;
    /** Do existing published documents need re-rendering? */
    requiresRepublish: boolean;
    reviewedBy: string | null;
}

/**
 * Append-only changelog. This is the artefact that makes "your policy is up
 * to date as of X" a statement you can defend.
 */
export const LIBRARY_CHANGELOG: LibraryChange[] = [
    {
        version: '2026.09.1',
        date: '2026-09-16',
        jurisdictions: ['IN', 'EU', 'UK', 'US-CA'],
        affectedDocumentTypes: ['*'],
        summary: 'Baseline library extracted from the v1 generators, with versioning and provenance added.',
        requiresRepublish: false,
        reviewedBy: null,
    },
];

/** Documents older than this should be flagged for review in the dashboard. */
export function isStale(documentLibraryVersion: string): boolean {
    return documentLibraryVersion !== CLAUSE_LIBRARY_VERSION;
}
