// src/lib/legalgen/shared/render.ts

export interface RenderSection {
  title: string;
  content: string;
}

export interface RenderOptions {
  documentTitle: string;
  businessName: string;
  effectiveDate: string;
  version: string;
  sections: RenderSection[];
  preambleHtml?: string;
}

export function renderDocument(options: RenderOptions): string {
  const { documentTitle, sections, preambleHtml } = options;

  let html = `<div class="legalgen-document" style="font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto;">\n`;

  html += `  <h1 style="font-size: 2.5rem; margin-bottom: 0.5rem; color: #111;">${documentTitle}</h1>\n`;

  if (preambleHtml) {
    html += `  <div class="document-preamble" style="margin-bottom: 2rem; color: #555;">\n    ${preambleHtml}\n  </div>\n`;
  }

  sections.forEach((section, index) => {
    html += `  <h2 style="font-size: 1.5rem; margin-top: 2rem; margin-bottom: 1rem; color: #222; border-bottom: 1px solid #eaeaea; padding-bottom: 0.5rem;">${index + 1}. ${section.title}</h2>\n`;
    html += `  <div class="document-section" style="margin-bottom: 1.5rem;">\n    ${section.content}\n  </div>\n`;
  });

  html += `</div>`;

  return html;
}