// src/app/api/widget/[id]/route.ts
// NOTE: This route is now at /api/widget/[id] (publicly accessible)
// The previous _api path was private due to underscore prefix

import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Next.js 15 requires us to await the params!
  const resolvedParams = await params;
  const widgetId = resolvedParams.id;

  // TODO: Fetch actual document content from Firestore using widgetId
  // For now, this serves as a functional embeddable widget skeleton
  // Replace the placeholder HTML with real document data from your database

  const jsCode = `
    (function() {
      var widgetId = '${widgetId}';
      
      // 1. Inject the legal content container
      var container = document.getElementById('FOOTER-widget');
      if (container) {
        container.innerHTML = '<div style="font-family: system-ui, -apple-system, sans-serif; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #f8fafc;">' +
          '<h2 style="margin-top:0; color: #0f172a;">Legal Policy</h2>' +
          '<p style="color: #475569; line-height: 1.6;">' +
          'This policy is dynamically synced from FOOTER for widget ID: <strong>' + widgetId + '</strong>. ' +
          'When Indian laws change, this text updates automatically.' +
          '</p></div>';
      }

      // 2. Inject the Trust Badge
      var badge = document.createElement('div');
      badge.innerHTML = 
        '<a href="https://FOOTER.in/verify/' + widgetId + '" target="_blank" ' +
        'style="position: fixed; bottom: 24px; right: 24px; background: #059669; color: white; ' +
        'padding: 12px 20px; border-radius: 50px; font-family: system-ui, sans-serif; ' +
        'font-size: 14px; font-weight: 600; text-decoration: none; box-shadow: 0 10px 15px -3px rgba(5, 150, 105, 0.3); ' +
        'display: flex; align-items: center; gap: 8px; z-index: 999999; transition: all 0.2s ease;">' +
        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>' +
        '<path d="m9 12 2 2 4-4"></path></svg>' +
        'Protected by FOOTER</a>';
      
      var link = badge.firstElementChild;
      link.addEventListener('mouseenter', function(e) {
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.boxShadow = '0 10px 25px -3px rgba(5, 150, 105, 0.5)';
      });
      link.addEventListener('mouseleave', function(e) {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(5, 150, 105, 0.3)';
      });
      
      document.body.appendChild(badge);
      
      // 3. Dispatch custom event for integration hooks
      if (typeof CustomEvent !== 'undefined') {
        document.dispatchEvent(new CustomEvent('FOOTER-widget-loaded', { detail: { widgetId: widgetId } }));
      }
    })();
  `;

  return new NextResponse(jsCode, {
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  });
}