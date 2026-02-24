const fs = require('fs');
const path = require('path');

const cwd = process.cwd();
const realPath = fs.realpathSync(cwd);

console.log('--- Environment Casing Check ---');
console.log('Current Working Directory (CWD):', cwd);
console.log('Real Path on Disk:             ', realPath);

if (cwd !== realPath) {
    console.error('\n❌ DISCREPANCY DETECTED!');
    console.error('Your shell is using a path casing that does not match the disk.');
    console.error('This causes Next.js to load duplicate modules and CRASH with the Invariant error.');
    console.error('\nFIX:');
    console.error('1. Close this terminal.');
    console.error('2. Open a NEW terminal.');
    console.error(`3. Run exactly: cd "${realPath}"`);
    console.error('4. Run: npm run dev');
} else {
    console.log('\n✅ Casing matches. If you still see errors, please delete .next and restart.');
}
