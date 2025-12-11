const fs = require('fs');
const data = fs.readFileSync('hod_pending.json', 'utf8');
console.log(JSON.stringify(JSON.parse(data), null, 2));
