// Fix for Vercel build error: "self is not defined"
if (typeof self === 'undefined') {
  (globalThis as any).self = globalThis;
}