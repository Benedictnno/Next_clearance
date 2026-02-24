// Fix Windows case-sensitivity issue at the earliest possible point.
// This script runs via NODE_OPTIONS=--require before Next.js starts.
const fs = require('fs');
const realCwd = fs.realpathSync(process.cwd());
if (realCwd !== process.cwd()) {
    console.log(`[fix-cwd] Correcting CWD: "${process.cwd()}" → "${realCwd}"`);
    process.chdir(realCwd);
}
