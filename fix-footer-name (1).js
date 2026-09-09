// ============================================
// FIX SCRIPT: LegalGen → FOOTER + Sign In → LOGIN
// ============================================
// Run this in your project root: node fix-footer-name.js
// ============================================

const fs = require('fs');
const path = require('path');

const filesToFix = [
    'src/app/page.tsx',
    'src/app/layout.tsx',
    'src/app/_api/widget/[id]/route.ts',
    'src/app/api/widget/[id]/route.ts'
];

console.log('🔧 Starting fix: LegalGen → FOOTER, Sign In → LOGIN\n');

let totalReplacements = 0;

filesToFix.forEach(filePath => {
    const fullPath = path.join(process.cwd(), filePath);
    
    if (!fs.existsSync(fullPath)) {
        console.log(`⚠️  File not found: ${filePath}`);
        return;
    }
    
    let content = fs.readFileSync(fullPath, 'utf8');
    const originalContent = content;
    
    // Replace "LegalGen" with "FOOTER" (case sensitive)
    const legalGenCount = (content.match(/LegalGen/g) || []).length;
    content = content.replace(/LegalGen/g, 'FOOTER');
    totalReplacements += legalGenCount;
    
    // Replace "Sign In" with "LOGIN"
    const signInCount = (content.match(/Sign In/g) || []).length;
    content = content.replace(/Sign In/g, 'LOGIN');
    totalReplacements += signInCount;
    
    if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`✅ Fixed ${filePath}:`);
        console.log(`   - LegalGen → FOOTER: ${legalGenCount} replacements`);
        console.log(`   - Sign In → LOGIN: ${signInCount} replacements\n`);
    } else {
        console.log(`ℹ️  No changes needed in ${filePath}\n`);
    }
});

console.log('========================================');
console.log(`✨ Total replacements made: ${totalReplacements}`);
console.log('========================================');
console.log('\n📦 Now run these commands to deploy:');
console.log('   git add .');
console.log('   git commit -m "Fix: Rename LegalGen to FOOTER, Sign In to LOGIN"');
console.log('   git push origin main');
console.log('\n🚀 Vercel will auto-deploy in 1-2 minutes!');
