// src/lib/legalgen/shared/security.ts

export function escapeHtml(unsafe: string): string {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function safeUrl(url: string): string {
  if (!url) return '#';
  // Basic validation to ensure the URL doesn't contain malicious javascript: links
  if (url.toLowerCase().trim().startsWith('javascript:')) {
    return '#';
  }
  return escapeHtml(url);
}

export function safeEmail(email: string): string {
  if (!email) return '';
  return escapeHtml(email.trim());
}